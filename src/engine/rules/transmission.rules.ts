/**
 * 传变辨证规则 v2.0
 * Layer 4 专用规则配置
 * 包含子盗母气、母病及子、相克传变、相生传变等规则
 */

import type { TransmissionType } from '@/types/inference';

/**
 * 传变规则
 */
export interface TransmissionRule {
  id: string;
  type: TransmissionType;
  sourceOrgan: string;
  targetOrgan: string;
  triggerConditions: {
    sourcePattern: string | string[];
    targetPattern?: string | string[];
    minConfidence?: number;
  };
  mechanism: string;
  resultDescription: string;
  confidence: number;
  evidence: string[];
}

export const transmissionRules: TransmissionRule[] = [
  // ========== 子盗母气（子系统虚弱消耗母系统）==========
  {
    id: 'L4-T01',
    type: '子盗母气',
    sourceOrgan: '肝',
    targetOrgan: '肾',
    triggerConditions: {
      sourcePattern: ['肝阴虚', '肝血虚', '肝火旺'],
      targetPattern: ['肾阴虚'],
      minConfidence: 0.6,
    },
    mechanism: '肝为肾之子，肝阴/肝血亏虚日久，耗伤肾阴',
    resultDescription: '肝阴虚→肾阴虚（子盗母气）',
    confidence: 0.75,
    evidence: ['肝肾同源', '子盗母气'],
  },
  {
    id: 'L4-T02',
    type: '子盗母气',
    sourceOrgan: '心',
    targetOrgan: '肝',
    triggerConditions: {
      sourcePattern: ['心阴虚', '心血虚', '心火旺'],
      targetPattern: ['肝阴虚', '肝火旺'],
      minConfidence: 0.6,
    },
    mechanism: '心为肝之子，心阴/心血亏虚，累及肝脏',
    resultDescription: '心阴虚→肝阴虚/肝火旺（子盗母气）',
    confidence: 0.7,
    evidence: ['心肝相关', '子盗母气'],
  },
  {
    id: 'L4-T03',
    type: '子盗母气',
    sourceOrgan: '脾',
    targetOrgan: '心',
    triggerConditions: {
      sourcePattern: ['脾气虚', '脾血虚'],
      targetPattern: ['心气虚', '心血虚'],
      minConfidence: 0.6,
    },
    mechanism: '脾为心之子，脾虚气血生化不足，累及心脏',
    resultDescription: '脾虚→心血虚/心气虚（子盗母气）',
    confidence: 0.7,
    evidence: ['脾为气血生化之源', '子盗母气'],
  },
  {
    id: 'L4-T04',
    type: '子盗母气',
    sourceOrgan: '肺',
    targetOrgan: '脾',
    triggerConditions: {
      sourcePattern: ['肺气虚'],
      targetPattern: ['脾气虚'],
      minConfidence: 0.6,
    },
    mechanism: '肺为脾之子，肺气虚累及脾土',
    resultDescription: '肺气虚→脾气虚（子盗母气）',
    confidence: 0.65,
    evidence: ['肺脾相关', '子盗母气'],
  },
  
  // ========== 母病及子（母系统病变影响子系统）==========
  {
    id: 'L4-T10',
    type: '母病及子',
    sourceOrgan: '肾',
    targetOrgan: '肝',
    triggerConditions: {
      sourcePattern: ['肾阴虚', '肾精亏'],
      targetPattern: ['肝阴虚', '肝火旺'],
      minConfidence: 0.6,
    },
    mechanism: '肾为肝之母，肾阴不足，水不涵木，肝阳上亢',
    resultDescription: '肾阴虚→肝阴虚/肝阳上亢（母病及子）',
    confidence: 0.75,
    evidence: ['水不涵木', '母病及子'],
  },
  {
    id: 'L4-T11',
    type: '母病及子',
    sourceOrgan: '肝',
    targetOrgan: '心',
    triggerConditions: {
      sourcePattern: ['肝火旺', '肝郁化火'],
      targetPattern: ['心火旺'],
      minConfidence: 0.6,
    },
    mechanism: '肝为心之母，肝火炽盛，引动心火',
    resultDescription: '肝火旺→心火旺（母病及子）',
    confidence: 0.7,
    evidence: ['肝木生心火', '母病及子'],
  },
  {
    id: 'L4-T12',
    type: '母病及子',
    sourceOrgan: '脾',
    targetOrgan: '肺',
    triggerConditions: {
      sourcePattern: ['脾气虚', '脾虚湿盛'],
      targetPattern: ['肺气虚'],
      minConfidence: 0.6,
    },
    mechanism: '脾为肺之母，脾虚土不生金，肺气不足',
    resultDescription: '脾虚→肺气不足（母病及子）',
    confidence: 0.75,
    evidence: ['土生金', '脾为肺之母', '母病及子'],
  },
  
  // ========== 相克传变（木克土/土克水/水克火/火克金/金克木）==========
  {
    id: 'L4-T20',
    type: '相克传变',
    sourceOrgan: '肝',
    targetOrgan: '脾',
    triggerConditions: {
      sourcePattern: ['肝郁', '肝气郁结', '肝火旺'],
      targetPattern: ['脾虚', '脾虚湿盛'],
      minConfidence: 0.55,
    },
    mechanism: '肝木克脾土，肝气郁结横逆犯脾，导致脾虚',
    resultDescription: '肝郁→克脾→脾虚湿盛',
    confidence: 0.8,
    evidence: ['肝木克脾土', '相克传变'],
  },
  {
    id: 'L4-T21',
    type: '相克传变',
    sourceOrgan: '脾',
    targetOrgan: '肾',
    triggerConditions: {
      sourcePattern: ['脾虚', '脾虚湿盛'],
      targetPattern: ['肾虚', '肾精亏'],
      minConfidence: 0.55,
    },
    mechanism: '脾土克肾水，脾虚湿盛下注伤肾',
    resultDescription: '脾虚→克肾→肾虚',
    confidence: 0.7,
    evidence: ['脾土克肾水', '相克传变'],
  },
  {
    id: 'L4-T22',
    type: '相克传变',
    sourceOrgan: '心',
    targetOrgan: '肺',
    triggerConditions: {
      sourcePattern: ['心火旺', '心阴虚火旺'],
      targetPattern: ['肺阴虚', '肺热'],
      minConfidence: 0.55,
    },
    mechanism: '心火克肺金，心火炽盛灼伤肺阴',
    resultDescription: '心火旺→克肺→肺阴虚/肺热',
    confidence: 0.7,
    evidence: ['心火克肺金', '相克传变'],
  },
  {
    id: 'L4-T23',
    type: '相克传变',
    sourceOrgan: '肺',
    targetOrgan: '肝',
    triggerConditions: {
      sourcePattern: ['肺气虚', '肺阴虚'],
      targetPattern: ['肝郁', '肝火旺'],
      minConfidence: 0.55,
    },
    mechanism: '肺金克肝木，肺虚不能制肝，导致肝木反侮',
    resultDescription: '肺虚→肝木反侮→肝郁/肝火',
    confidence: 0.65,
    evidence: ['金克木', '肺虚肝旺'],
  },
  
  // ========== 相生传变（木生火/火生土/土生金/金生水/水生木）==========
  {
    id: 'L4-T30',
    type: '相生传变',
    sourceOrgan: '脾',
    targetOrgan: '心',
    triggerConditions: {
      sourcePattern: ['脾气虚', '心气虚', '心血虚'],
      minConfidence: 0.55,
    },
    mechanism: '脾土生心火，脾虚气血不足，心失所养',
    resultDescription: '脾虚→气血不足→心失所养',
    confidence: 0.7,
    evidence: ['土生火', '脾为气血之源'],
  },
  {
    id: 'L4-T31',
    type: '相生传变',
    sourceOrgan: '肾',
    targetOrgan: '肝',
    triggerConditions: {
      sourcePattern: ['肾阴虚', '肝阴虚'],
      minConfidence: 0.55,
    },
    mechanism: '肾水生肝木，肾阴不足，水不涵木',
    resultDescription: '肾阴虚→水不涵木→肝阴虚/肝阳上亢',
    confidence: 0.75,
    evidence: ['水生木', '水涵木'],
  },
  {
    id: 'L4-T32',
    type: '相生传变',
    sourceOrgan: '心',
    targetOrgan: '脾',
    triggerConditions: {
      sourcePattern: ['心火旺', '心阴虚'],
      targetPattern: ['脾阴虚', '胃阴虚'],
      minConfidence: 0.55,
    },
    mechanism: '心火生脾土，心火亢盛耗伤脾阴',
    resultDescription: '心火旺→耗伤脾阴→脾阴虚',
    confidence: 0.65,
    evidence: ['火生土', '心火耗脾阴'],
  },
  
  // ========== 脏腑直接传变 ==========
  {
    id: 'L4-T40',
    type: '脏腑传变',
    sourceOrgan: '肝',
    targetOrgan: '胆',
    triggerConditions: {
      sourcePattern: ['肝郁', '肝火旺'],
      targetPattern: ['胆郁', '胆湿热'],
      minConfidence: 0.6,
    },
    mechanism: '肝胆相表里，肝病最易传胆',
    resultDescription: '肝郁/肝火→胆郁/胆湿热',
    confidence: 0.8,
    evidence: ['肝胆相表里', '脏腑传变'],
  },
  {
    id: 'L4-T41',
    type: '脏腑传变',
    sourceOrgan: '脾',
    targetOrgan: '胃',
    triggerConditions: {
      sourcePattern: ['脾虚', '脾虚湿盛', '胃热'],
      targetPattern: ['胃虚', '胃热', '胃阴虚'],
      minConfidence: 0.6,
    },
    mechanism: '脾胃相表里，脾病易传胃',
    resultDescription: '脾虚/脾湿→胃虚/胃热',
    confidence: 0.75,
    evidence: ['脾胃相表里', '脏腑传变'],
  },
  {
    id: 'L4-T42',
    type: '脏腑传变',
    sourceOrgan: '心',
    targetOrgan: '小肠',
    triggerConditions: {
      sourcePattern: ['心火旺', '心阴虚'],
      targetPattern: ['小肠热'],
      minConfidence: 0.55,
    },
    mechanism: '心与小肠相表里，心火下移小肠',
    resultDescription: '心火旺→小肠热',
    confidence: 0.7,
    evidence: ['心与小肠相表里'],
  },
  {
    id: 'L4-T43',
    type: '脏腑传变',
    sourceOrgan: '肺',
    targetOrgan: '大肠',
    triggerConditions: {
      sourcePattern: ['肺气虚', '肺阴虚', '肺热'],
      targetPattern: ['大肠虚', '大肠湿热', '便秘'],
      minConfidence: 0.55,
    },
    mechanism: '肺与大肠相表里，肺病易传大肠',
    resultDescription: '肺虚/肺热→大肠虚/大肠湿热',
    confidence: 0.7,
    evidence: ['肺与大肠相表里'],
  },
  {
    id: 'L4-T44',
    type: '脏腑传变',
    sourceOrgan: '肾',
    targetOrgan: '膀胱',
    triggerConditions: {
      sourcePattern: ['肾阴虚', '肾阳虚', '肾气虚'],
      targetPattern: ['膀胱湿热', '膀胱虚'],
      minConfidence: 0.55,
    },
    mechanism: '肾与膀胱相表里，肾病易传膀胱',
    resultDescription: '肾虚→膀胱虚/膀胱湿热',
    confidence: 0.7,
    evidence: ['肾与膀胱相表里'],
  },
];

/**
 * 传变方向枚举
 */
export type TransmissionDirection = 'forward' | 'backward';

/**
 * 匹配传变规则
 */
export function matchTransmissionRule(
  sourceOrgan: string,
  targetOrgan: string,
  sourcePatterns: string[],
  minConfidence: number = 0.6
): TransmissionRule | undefined {
  return transmissionRules.find(rule => {
    if (rule.sourceOrgan !== sourceOrgan || rule.targetOrgan !== targetOrgan) {
      return false;
    }
    
    // 检查触发条件
    const patternMatch = sourcePatterns.some(pattern =>
      Array.isArray(rule.triggerConditions.sourcePattern)
        ? rule.triggerConditions.sourcePattern.some(sp => pattern.includes(sp) || sp.includes(pattern))
        : pattern.includes(rule.triggerConditions.sourcePattern as string) || 
          (rule.triggerConditions.sourcePattern as string).includes(pattern)
    );
    
    if (!patternMatch) return false;
    
    // 检查置信度
    if (rule.confidence < minConfidence) return false;
    
    return true;
  });
}

/**
 * 查找某脏腑的所有传变关系
 */
export function findTransmissionByOrgan(
  organ: string,
  direction: TransmissionDirection = 'forward'
): TransmissionRule[] {
  return transmissionRules.filter(rule => {
    if (direction === 'forward') {
      return rule.sourceOrgan === organ;
    } else {
      return rule.targetOrgan === organ;
    }
  });
}

/**
 * 推断可能的传变路径
 */
export function inferTransmissionPath(
  organPatterns: Array<{ organ: string; pattern: string; confidence: number }>
): TransmissionRule[] {
  const path: TransmissionRule[] = [];
  
  for (const op of organPatterns) {
    // 查找从该脏腑出发的传变
    const forwardRules = transmissionRules.filter(rule =>
      rule.sourceOrgan === op.organ &&
      op.confidence >= (rule.triggerConditions.minConfidence || 0.6)
    );
    
    for (const rule of forwardRules) {
      // 检查目标脏腑是否也有问题
      const targetPatterns = rule.triggerConditions.targetPattern;
      const targetPatternArray = targetPatterns 
        ? (Array.isArray(targetPatterns) ? targetPatterns : [targetPatterns])
        : [];
      
      const targetExists = organPatterns.some(op2 =>
        op2.organ === rule.targetOrgan &&
        targetPatternArray.some(p => op2.pattern.includes(p) || p.includes(op2.pattern))
      );
      
      if (targetExists && !path.includes(rule)) {
        path.push(rule);
      }
    }
  }
  
  return path;
}

/**
 * Layer4 规则导出
 */
export const Layer4Rules = {
  transmissionRules,
  matchTransmissionRule,
  findTransmissionByOrgan,
  inferTransmissionPath,
};
