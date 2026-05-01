/**
 * 年龄权重计算器 v2.0
 * 根据患者年龄调整辨证权重和问诊重点
 */

import type { AgeGroup, AgeWeight, AgeWeightResult } from '@/types/interrogation';

/**
 * 年龄段配置
 */
const AGE_GROUP_CONFIG: Record<AgeGroup, {
  range: [number, number];
  coefficient: number;
  tendency: string;
  focus: string[];
  tongueColorMap: Record<string, string>;
}> = {
  少年: {
    range: [0, 18],
    coefficient: 0.8,
    tendency: '易虚易实，变化快',
    focus: ['先天不足', '外感', '脾胃'],
    tongueColorMap: {
      '淡白': '先天不足',
      '淡红': '正常/稚阴稚阳',
      '红': '可能有热证',
      '苔腻': '可能湿热',
    },
  },
  青年: {
    range: [19, 35],
    coefficient: 1.0,
    tendency: '实证多见',
    focus: ['肝郁', '湿热', '气滞'],
    tongueColorMap: {
      '淡白': '气血偏虚',
      '淡红': '正常',
      '红': '可能有热证',
      '紫': '可能有气滞血瘀',
      '苔腻': '可能有痰湿',
    },
  },
  中年: {
    range: [36, 55],
    coefficient: 1.1,
    tendency: '虚实夹杂',
    focus: ['肝郁脾虚', '肾虚'],
    tongueColorMap: {
      '淡白': '可能有气血虚',
      '淡红': '相对正常',
      '红': '可能有阴虚火旺',
      '苔腻': '可能有湿热',
    },
  },
  老年: {
    range: [56, 150],
    coefficient: 1.2,
    tendency: '虚证为主',
    focus: ['肾虚', '气血双亏'],
    tongueColorMap: {
      '淡白': '肾阳虚衰',
      '淡红': '相对正常',
      '红': '可能有阴虚火旺',
      '紫': '可能有血瘀',
      '苔腻': '可能有痰湿/脾虚',
    },
  },
};

/**
 * 年龄权重计算器
 */
export class AgeWeightCalculator {
  /**
   * 计算年龄权重
   */
  calculate(age: number): AgeWeight {
    const group = this.getAgeGroup(age);
    const config = AGE_GROUP_CONFIG[group];
    
    return {
      group,
      coefficient: config.coefficient,
      tendency: config.tendency,
      focus: config.focus,
    };
  }
  
  /**
   * 获取年龄段
   */
  getAgeGroup(age: number): AgeGroup {
    if (age < 19) return '少年';
    if (age < 36) return '青年';
    if (age < 56) return '中年';
    return '老年';
  }
  
  /**
   * 获取年龄权重结果
   */
  getAgeWeightResult(age: number): AgeWeightResult {
    const group = this.getAgeGroup(age);
    const config = AGE_GROUP_CONFIG[group];
    
    return {
      group,
      baseWeight: config.coefficient,
      tongueColorInterpretation: config.tongueColorMap,
      patternAdjustment: {
        '气虚': group === '老年' ? 1.2 : group === '中年' ? 1.1 : 1.0,
        '阴虚': group === '老年' ? 1.2 : group === '中年' ? 1.1 : 1.0,
        '湿热': group === '青年' ? 1.1 : 1.0,
        '肝郁': group === '中年' ? 1.1 : 1.0,
      },
      interrogationFocus: config.focus,
    };
  }
  
  /**
   * 调整证型置信度
   */
  adjustPatternConfidence(age: number, originalConfidence: number, pattern: string): number {
    const result = this.getAgeWeightResult(age);
    const adjustment = result.patternAdjustment[pattern] || 1.0;
    return Math.min(1, originalConfidence * adjustment);
  }
  
  /**
   * 获取舌色解读
   */
  interpretTongueColor(age: number, tongueColor: string): string {
    const config = AGE_GROUP_CONFIG[this.getAgeGroup(age)];
    return config.tongueColorMap[tongueColor] || '需要综合判断';
  }
  
  /**
   * 获取问诊重点
   */
  getInterrogationFocus(age: number): string[] {
    const config = AGE_GROUP_CONFIG[this.getAgeGroup(age)];
    return config.focus;
  }
  
  /**
   * 获取年龄相关建议
   */
  getAgeRelatedAdvice(age: number): {
    treatmentPrinciple: string;
    precautions: string[];
    lifestyleAdvice: string[];
  } {
    const group = this.getAgeGroup(age);
    
    const adviceMap: Record<AgeGroup, {
      treatmentPrinciple: string;
      precautions: string[];
      lifestyleAdvice: string[];
    }> = {
      少年: {
        treatmentPrinciple: '清热消食为主，慎用补益',
        precautions: ['避免过度用药', '注意脾胃养护'],
        lifestyleAdvice: ['规律作息', '适度运动', '健康饮食'],
      },
      青年: {
        treatmentPrinciple: '疏肝解郁，清热化湿',
        precautions: ['避免熬夜', '调节情绪'],
        lifestyleAdvice: ['规律作息', '情绪管理', '适度运动'],
      },
      中年: {
        treatmentPrinciple: '健脾补肾，调和气血',
        precautions: ['注意劳逸结合', '定期体检'],
        lifestyleAdvice: ['规律作息', '适度运动', '情志调节'],
      },
      老年: {
        treatmentPrinciple: '补益为主，兼顾脾胃',
        precautions: ['缓慢调理', '避免峻下'],
        lifestyleAdvice: ['充足睡眠', '适度散步', '温和调理'],
      },
    };
    
    return adviceMap[group];
  }
  
  /**
   * 计算综合年龄系数
   * 用于调整整体辨证结果
   */
  getCompositeAgeFactor(age: number): number {
    const group = this.getAgeGroup(age);
    const config = AGE_GROUP_CONFIG[group];
    
    // 基础系数
    let factor = config.coefficient;
    
    // 极端年龄调整
    if (age < 10) {
      factor *= 0.9; // 儿童更敏感
    } else if (age > 70) {
      factor *= 1.1; // 老年人更需谨慎
    }
    
    return factor;
  }
}
