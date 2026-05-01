/**
 * 修正规则库 v2.0
 * 管理问诊回答到推理节点修正的映射规则
 */

import type { CorrectionRule, CorrectionAnswer } from '@/types/interrogation';

/**
 * 修正规则库
 */
export class CorrectionRules {
  /** 规则库 */
  private rules: Map<string, CorrectionRule[]>;
  
  constructor() {
    this.rules = new Map();
    this.initializeDefaultRules();
  }
  
  /**
   * 初始化默认规则
   */
  private initializeDefaultRules(): void {
    // 二便相关规则
    this.addRule({
      id: 'rule-stool-001',
      questionId: 'q-stool',
      answers: [
        {
          answer: '便溏',
          adjustmentType: 'increase',
          targetNodeId: '脾虚湿盛',
          modification: { confidenceDelta: 0.15 },
        },
        {
          answer: '便秘',
          adjustmentType: 'increase',
          targetNodeId: '热结/阴虚',
          modification: { confidenceDelta: 0.15 },
        },
      ],
    });
    
    // 寒热相关规则
    this.addRule({
      id: 'rule-cold-heat-001',
      questionId: 'q-cold-heat',
      answers: [
        {
          answer: '怕冷',
          adjustmentType: 'replace',
          targetNodeId: '阳虚',
          modification: { 
            newLabel: '阳虚',
            confidenceDelta: 0.2,
          },
        },
        {
          answer: '怕热',
          adjustmentType: 'replace',
          targetNodeId: '阴虚/热证',
          modification: { 
            newLabel: '阴虚内热',
            confidenceDelta: 0.2,
          },
        },
      ],
    });
    
    // 疲劳相关规则
    this.addRule({
      id: 'rule-fatigue-001',
      questionId: 'q-fatigue',
      answers: [
        {
          answer: '是',
          adjustmentType: 'increase',
          targetNodeId: '气虚',
          modification: { confidenceDelta: 0.2 },
        },
        {
          answer: '否',
          adjustmentType: 'decrease',
          targetNodeId: '气虚',
          modification: { confidenceDelta: -0.1 },
        },
      ],
    });
    
    // 口干相关规则
    this.addRule({
      id: 'rule-thirsty-001',
      questionId: 'q-thirsty',
      answers: [
        {
          answer: '是',
          adjustmentType: 'replace',
          targetNodeId: '阴虚',
          modification: { 
            newLabel: '阴虚火旺',
            confidenceDelta: 0.25,
          },
        },
        {
          answer: '否',
          adjustmentType: 'decrease',
          targetNodeId: '阴虚',
          modification: { confidenceDelta: -0.1 },
        },
      ],
    });
    
    // 睡眠相关规则
    this.addRule({
      id: 'rule-sleep-001',
      questionId: 'q-sleep',
      answers: [
        {
          answer: '失眠',
          adjustmentType: 'increase',
          targetNodeId: '心肾不交',
          modification: { confidenceDelta: 0.15 },
        },
        {
          answer: '睡眠差',
          adjustmentType: 'increase',
          targetNodeId: '肝血不足',
          modification: { confidenceDelta: 0.1 },
        },
        {
          answer: '正常',
          adjustmentType: 'invalidate',
          targetNodeId: '心肾不交',
          modification: {},
        },
      ],
    });
    
    // 情绪相关规则
    this.addRule({
      id: 'rule-emotion-001',
      questionId: 'q-emotion',
      answers: [
        {
          answer: '烦躁',
          adjustmentType: 'replace',
          targetNodeId: '肝郁化火',
          modification: { 
            newLabel: '肝郁化火',
            confidenceDelta: 0.25,
          },
        },
        {
          answer: '抑郁',
          adjustmentType: 'replace',
          targetNodeId: '肝郁',
          modification: { 
            newLabel: '肝郁气滞',
            confidenceDelta: 0.2,
          },
        },
        {
          answer: '正常',
          adjustmentType: 'decrease',
          targetNodeId: '肝郁',
          modification: { confidenceDelta: -0.15 },
        },
      ],
    });
    
    // 年龄相关规则
    this.addRule({
      id: 'rule-age-001',
      questionId: 'q-age',
      answers: [
        {
          answer: '少年',
          adjustmentType: 'replace',
          targetNodeId: '体质',
          modification: { 
            newLabel: '少年体质（易虚易实）',
            confidenceDelta: 0.1,
          },
        },
        {
          answer: '青年',
          adjustmentType: 'replace',
          targetNodeId: '体质',
          modification: { 
            newLabel: '青年体质（实证多见）',
            confidenceDelta: 0.1,
          },
        },
        {
          answer: '中年',
          adjustmentType: 'replace',
          targetNodeId: '体质',
          modification: { 
            newLabel: '中年体质（虚实夹杂）',
            confidenceDelta: 0.1,
          },
        },
        {
          answer: '老年',
          adjustmentType: 'replace',
          targetNodeId: '体质',
          modification: { 
            newLabel: '老年体质（虚证为主）',
            confidenceDelta: 0.1,
          },
        },
      ],
    });
  }
  
  /**
   * 添加规则
   */
  addRule(rule: CorrectionRule): void {
    const existing = this.rules.get(rule.questionId) || [];
    existing.push(rule);
    this.rules.set(rule.questionId, existing);
  }
  
  /**
   * 获取问题的修正规则
   */
  getRules(questionId: string): CorrectionRule[] {
    return this.rules.get(questionId) || [];
  }
  
  /**
   * 获取特定问题和答案的修正规则
   */
  getRule(questionId: string, answer: string): CorrectionRule | undefined {
    const rules = this.rules.get(questionId);
    if (!rules) return undefined;
    
    return rules.find(r => 
      r.answers.some(a => a.answer === answer)
    );
  }
  
  /**
   * 获取特定答案的修正配置
   */
  getAnswerCorrection(questionId: string, answer: string): CorrectionAnswer | undefined {
    const rule = this.getRule(questionId, answer);
    if (!rule) return undefined;
    
    return rule.answers.find(a => a.answer === answer);
  }
  
  /**
   * 获取所有规则
   */
  getAllRules(): CorrectionRule[] {
    const allRules: CorrectionRule[] = [];
    for (const rules of this.rules.values()) {
      allRules.push(...rules);
    }
    return allRules;
  }
  
  /**
   * 获取规则统计
   */
  getStats(): {
    totalRules: number;
    totalAnswers: number;
    questionsCovered: number;
  } {
    let totalAnswers = 0;
    for (const rules of this.rules.values()) {
      for (const rule of rules) {
        totalAnswers += rule.answers.length;
      }
    }
    
    return {
      totalRules: this.rules.size,
      totalAnswers,
      questionsCovered: this.rules.size,
    };
  }
  
  /**
   * 清除所有规则
   */
  clear(): void {
    this.rules.clear();
  }
  
  /**
   * 移除特定规则
   */
  removeRule(questionId: string, ruleId?: string): void {
    if (ruleId) {
      const rules = this.rules.get(questionId);
      if (rules) {
        const filtered = rules.filter(r => r.id !== ruleId);
        if (filtered.length > 0) {
          this.rules.set(questionId, filtered);
        } else {
          this.rules.delete(questionId);
        }
      }
    } else {
      this.rules.delete(questionId);
    }
  }
}

/**
 * 创建全局修正规则实例
 */
export const correctionRules = new CorrectionRules();
