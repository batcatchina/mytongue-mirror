/**
 * 十问歌实现 v2.0
 * 经典问诊十问歌的数字化实现
 */

import type { Question, TenQuestionsConfig } from '@/types/interrogation';
import { TEN_QUESTIONS } from '@/types/interrogation';

/**
 * 十问歌问诊系统
 */
export class TenQuestions {
  /** 问诊配置 */
  private config: TenQuestionsConfig[];
  
  constructor() {
    this.config = TEN_QUESTIONS;
  }
  
  /**
   * 获取所有十问问题
   */
  getAllQuestions(): TenQuestionsConfig[] {
    return this.config;
  }
  
  /**
   * 获取指定顺序的问题
   */
  getQuestionByOrder(order: number): TenQuestionsConfig | undefined {
    return this.config.find(q => q.order === order);
  }
  
  /**
   * 根据年龄段过滤问题
   */
  filterByAgeGroup(ageGroup: string): TenQuestionsConfig[] {
    const filters: Record<string, string[]> = {
      '少年': ['二便', '饮食', '寒热', '汗'],
      '青年': ['二便', '寒热', '睡眠', '头身', '饮食'],
      '中年': ['二便', '寒热', '睡眠', '饮食', '汗'],
      '老年': ['二便', '寒热', '睡眠', '耳/渴', '头身'],
    };
    
    const relevant = filters[ageGroup] || filters['中年'];
    return this.config.filter(q => relevant.includes(q.content));
  }
  
  /**
   * 根据舌象特征过滤问题
   */
  filterByTongueFeatures(features: string[]): TenQuestionsConfig[] {
    return this.config.filter(q => {
      // 年龄问题总是包含
      if (q.order === 0) return true;
      
      // 检查是否有相关特征
      return q.relatedTongueFeatures.some(f =>
        features.some(feat => feat.includes(f) || f.includes(feat))
      );
    });
  }
  
  /**
   * 将十问配置转换为问题对象
   */
  toQuestion(config: TenQuestionsConfig, additionalOptions?: Record<string, string[]>): Question {
    const defaultOptions: Record<string, string[]> = {
      '年龄（必问）': ['18岁以下', '18-35岁', '36-55岁', '56岁以上'],
      '二便': ['大便溏稀', '大便正常', '便秘', '小便黄', '小便清长'],
      '寒热': ['怕冷', '怕热', '无明显感觉', '手脚心热', '手脚冰凉'],
      '睡眠': ['失眠', '容易醒', '多梦', '睡眠良好', '嗜睡'],
      '头身': ['头晕', '头痛', '身体酸痛', '四肢沉重', '无明显不适'],
      '饮食': ['食欲不振', '胃口好', '口苦', '口干', '消化不良'],
      '汗': ['自汗', '盗汗', '不出汗', '汗多'],
      '胸腹': ['胸闷', '胁胀', '腹痛', '腹胀', '无明显不适'],
      '耳/渴': ['耳鸣', '听力下降', '口渴', '不渴'],
      '旧病/病因': ['无', '有慢性病', '有过敏', '有手术史'],
    };
    
    const options = additionalOptions?.[config.content] || defaultOptions[config.content] || ['有', '无'];
    
    return {
      id: `ten-questions-${config.order}`,
      content: config.questionTemplates[0],
      type: 'single_choice',
      options: options.map((opt, idx) => ({
        id: `opt-${idx}`,
        text: opt,
        value: opt,
      })),
      trigger: {
        ageRange: config.order === 0 ? undefined : [0, 150],
      },
      priority: config.priority,
      required: config.order === 0,
      validationPurpose: `${config.content}对应${config.dialecticalMapping}`,
    };
  }
  
  /**
   * 生成完整的十问问题列表
   */
  generateQuestions(ageGroup?: string): Question[] {
    const configs = ageGroup 
      ? this.filterByAgeGroup(ageGroup)
      : this.config;
    
    return configs.map(c => this.toQuestion(c));
  }
  
  /**
   * 获取问诊顺序
   */
  getInterrogationOrder(): number[] {
    return this.config
      .filter(q => q.order > 0) // 排除年龄
      .sort((a, b) => b.priority - a.priority)
      .map(q => q.order);
  }
  
  /**
   * 获取问诊映射关系
   */
  getDialecticalMapping(): Record<string, string> {
    const mapping: Record<string, string> = {};
    
    for (const q of this.config) {
      mapping[q.content] = q.dialecticalMapping;
    }
    
    return mapping;
  }
  
  /**
   * 根据回答推断证型倾向
   */
  inferPatternFromAnswer(question: string, answer: string): string[] {
    const patterns: string[] = [];
    
    // 二便推断
    if (question.includes('二便') || question.includes('大便')) {
      if (answer.includes('溏') || answer.includes('稀')) {
        patterns.push('脾虚湿盛');
      }
      if (answer.includes('便秘')) {
        patterns.push('热结/阴虚');
      }
      if (answer.includes('黄')) {
        patterns.push('湿热');
      }
    }
    
    // 寒热推断
    if (question.includes('寒热') || question.includes('冷') || question.includes('热')) {
      if (answer.includes('怕冷')) {
        patterns.push('阳虚');
      }
      if (answer.includes('怕热')) {
        patterns.push('阴虚/热证');
      }
      if (answer.includes('手脚心热')) {
        patterns.push('阴虚火旺');
      }
    }
    
    // 睡眠推断
    if (question.includes('睡眠') || question.includes('失眠')) {
      if (answer.includes('失眠') || answer.includes('难入睡')) {
        patterns.push('心肾不交');
      }
      if (answer.includes('多梦')) {
        patterns.push('肝血不足');
      }
    }
    
    // 饮食推断
    if (question.includes('饮食') || question.includes('胃口')) {
      if (answer.includes('不振') || answer.includes('差')) {
        patterns.push('脾胃虚弱');
      }
      if (answer.includes('口苦')) {
        patterns.push('肝胆湿热');
      }
      if (answer.includes('口干')) {
        patterns.push('阴虚');
      }
    }
    
    return patterns;
  }
}
