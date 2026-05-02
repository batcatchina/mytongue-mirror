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
      '胖大': '脾虚湿盛',
      '瘦薄': '阴虚可能',
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
      '胖大': '痰湿内蕴',
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
      '红': '可能有郁热',
      '紫': '可能有血瘀',
      '苔腻': '湿热蕴结',
      '胖大': '脾虚湿困+肝郁',
    },
  },
  老年: {
    range: [56, 150],
    coefficient: 1.2,
    tendency: '虚证为主',
    focus: ['肾虚', '气血双亏'],
    tongueColorMap: {
      '淡白': '肾阳虚衰',
      '淡红': '气血不足',
      '红': '阴虚火旺+肾阴虚',
      '紫': '可能有瘀血',
      '苔腻': '湿热+虚实夹杂',
      '胖大': '气虚水泛',
    },
  },
};

/**
 * 舌象→年龄组→推理方向映射
 */
const TONGUE_TO_PATTERN_MAPPING: Record<string, Record<AgeGroup, string>> = {
  '舌淡苔白': {
    '少年': '先天不足',
    '青年': '气血偏虚',
    '中年': '肝郁血虚',
    '老年': '肾阳虚衰',
  },
  '舌红少苔': {
    '少年': '阴虚火旺',
    '青年': '阴虚内热',
    '中年': '阴虚肝旺',
    '老年': '阴虚火旺+肾阴虚',
  },
  '苔黄腻': {
    '少年': '湿热中焦',
    '青年': '湿热下注',
    '中年': '湿热蕴结',
    '老年': '湿热+虚实夹杂',
  },
  '胖大齿痕': {
    '少年': '脾虚湿盛',
    '青年': '痰湿内蕴',
    '中年': '脾虚湿困+肝郁',
    '老年': '气虚水泛',
  },
  '舌边红': {
    '少年': '肝热可能',
    '青年': '肝郁化火',
    '中年': '肝郁化火倾向',
    '老年': '肝肾阴虚',
  },
  '舌尖凹陷': {
    '少年': '心气不足',
    '青年': '心气血虚',
    '中年': '心脾两虚',
    '老年': '心肾不交',
  },
  '舌中凹陷': {
    '少年': '脾胃虚弱',
    '青年': '脾虚湿困',
    '中年': '肝郁犯脾',
    '老年': '脾肾两虚',
  },
  '舌根苔黄腻': {
    '少年': '下焦湿热',
    '青年': '膀胱湿热',
    '中年': '下焦湿热',
    '老年': '湿热+肾虚',
  },
};

/**
 * 年龄权重计算器类
 */
export class AgeWeightCalculator {
  private currentAge: number;
  private currentAgeGroup: AgeGroup;
  private config: typeof AGE_GROUP_CONFIG[AgeGroup];
  /** 模式调整映射 */
  private patternAdjustments: Record<string, number>;

  constructor() {
    this.currentAge = 30; // 默认年龄
    this.currentAgeGroup = '中年';
    this.config = AGE_GROUP_CONFIG['中年'];
    this.patternAdjustments = this.calculatePatternAdjustments();
  }

  /**
   * 设置年龄，返回年龄组和对应权重
   * @param age 年龄
   * @returns 年龄权重结果
   */
  setAge(age: number): AgeWeightResult {
    this.currentAge = age;
    this.currentAgeGroup = this.getAgeGroupFromAge(age);
    this.config = AGE_GROUP_CONFIG[this.currentAgeGroup];
    this.patternAdjustments = this.calculatePatternAdjustments();

    return this.getResult();
  }

  /**
   * 根据年龄获取年龄段
   * @returns 年龄段分类
   */
  getAgeGroup(): AgeGroup {
    return this.currentAgeGroup;
  }

  /**
   * 根据年龄获取年龄段（静态方法）
   */
  private getAgeGroupFromAge(age: number): AgeGroup {
    if (age < 19) return '少年';
    if (age < 36) return '青年';
    if (age < 56) return '中年';
    return '老年';
  }

  /**
   * 获取完整的年龄权重结果
   */
  getResult(): AgeWeightResult {
    return {
      group: this.currentAgeGroup,
      baseWeight: this.config.coefficient,
      tongueColorInterpretation: this.config.tongueColorMap,
      patternAdjustment: this.patternAdjustments,
      interrogationFocus: this.config.focus,
    };
  }

  /**
   * 计算模式调整值
   */
  private calculatePatternAdjustments(): Record<string, number> {
    const adjustments: Record<AgeGroup, Record<string, number>> = {
      少年: {
        '气虚': 1.2,
        '脾虚': 1.1,
        '先天不足': 1.3,
        '阴虚': 0.9,
        '湿热': 0.8,
        '血瘀': 0.5,
      },
      青年: {
        '气虚': 0.9,
        '肝郁': 1.3,
        '湿热': 1.2,
        '气滞': 1.2,
        '阴虚': 0.9,
        '血瘀': 0.7,
      },
      中年: {
        '气虚': 1.1,
        '肝郁': 1.2,
        '脾虚': 1.1,
        '肾虚': 1.2,
        '湿热': 1.0,
        '血瘀': 1.1,
      },
      老年: {
        '气虚': 1.3,
        '肾虚': 1.4,
        '阴虚': 1.2,
        '阳虚': 1.3,
        '气血双亏': 1.4,
        '湿热': 0.7,
        '肝郁': 0.6,
      },
    };

    return adjustments[this.currentAgeGroup] || adjustments['中年'];
  }

  /**
   * 根据年龄调整推理结论的权重
   * @param conclusion 原始结论标签
   * @returns 调整后的权重系数
   */
  adjustWeight(conclusion: string): number {
    // 基础权重
    let weight = this.config.coefficient;

    // 检查是否有特定调整
    const specificAdjustment = this.patternAdjustments[conclusion];
    if (specificAdjustment !== undefined) {
      weight *= specificAdjustment;
    }

    return weight;
  }

  /**
   * 获取该年龄段优先问的问题方向
   * @returns 问题方向列表（按优先级排序）
   */
  getPriorityQuestions(): string[] {
    // 基于年龄段定义问题优先级
    const priorityMap: Record<AgeGroup, string[]> = {
      少年: [
        '先天禀赋',  // 年龄必问
        '脾胃状态',  // 大便、食欲
        '外感症状',  // 感冒、发热
        '睡眠情况',
        '汗出情况',
      ],
      青年: [
        '年龄（必问）',
        '二便状况',  // 高优先级
        '寒热感觉',  // 阴阳区分
        '睡眠质量',  // 心肝辨证
        '情绪状态',  // 肝郁
        '头身不适',
        '饮食情况',
      ],
      中年: [
        '年龄（必问）',
        '二便状况',  // 脾肾
        '寒热感觉',
        '睡眠情况',
        '饮食消化',
        '疲劳程度',
        '情绪压力',
      ],
      老年: [
        '年龄（必问）',
        '二便状况',  // 肾虚指标
        '寒热感觉',  // 阴阳
        '睡眠情况',
        '腰膝酸软',  // 肾虚
        '听力耳鸣',
        '四肢温度',
      ],
    };

    return priorityMap[this.currentAgeGroup] || priorityMap['中年'];
  }

  /**
   * 根据舌象特征和年龄推断可能的证型
   * @param tongueFeature 舌象特征
   * @returns 推断的证型
   */
  inferPatternByAge(tongueFeature: string): string {
    // 查找直接匹配
    const featureMappings = TONGUE_TO_PATTERN_MAPPING[tongueFeature];
    if (featureMappings) {
      return featureMappings[this.currentAgeGroup];
    }

    // 模糊匹配
    for (const [key, mappings] of Object.entries(TONGUE_TO_PATTERN_MAPPING)) {
      if (tongueFeature.includes(key) || key.includes(tongueFeature)) {
        return mappings[this.currentAgeGroup];
      }
    }

    // 默认返回基于年龄段的倾向
    return this.getDefaultPatternByAgeGroup();
  }

  /**
   * 获取年龄段默认证型倾向
   */
  private getDefaultPatternByAgeGroup(): string {
    const defaults: Record<AgeGroup, string> = {
      少年: '脾胃虚弱',
      青年: '肝郁湿热',
      中年: '肝郁脾虚',
      老年: '肾虚气血亏',
    };
    return defaults[this.currentAgeGroup];
  }

  /**
   * 获取置信度调整值
   * 用于根据年龄调整推理结论的置信度
   * @param baseConfidence 基础置信度
   * @param pattern 证型标签
   * @returns 调整后的置信度
   */
  adjustConfidence(baseConfidence: number, pattern: string): number {
    const weight = this.adjustWeight(pattern);
    // 权重对置信度的影响：范围限制在 0.3-1.0 之间
    const adjusted = baseConfidence * weight;
    return Math.max(0.3, Math.min(1.0, adjusted));
  }

  /**
   * 获取年龄权重配置
   */
  getConfig(): AgeWeight {
    return {
      group: this.currentAgeGroup,
      coefficient: this.config.coefficient,
      tendency: this.config.tendency,
      focus: this.config.focus,
    };
  }

  /**
   * 获取当前年龄
   */
  getAge(): number {
    return this.currentAge;
  }
}

/**
 * 创建年龄权重计算器的工厂函数
 */
export function createAgeWeightCalculator(age?: number): AgeWeightCalculator {
  const calculator = new AgeWeightCalculator();
  if (age !== undefined) {
    calculator.setAge(age);
  }
  return calculator;
}

/**
 * 根据年龄获取默认年龄段
 */
export function getAgeGroup(age: number): AgeGroup {
  if (age < 19) return '少年';
  if (age < 36) return '青年';
  if (age < 56) return '中年';
  return '老年';
}
