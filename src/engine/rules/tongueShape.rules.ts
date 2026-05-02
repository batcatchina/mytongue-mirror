/**
 * 舌形反直觉辨证规则 v2.0
 * Layer 2 专用规则配置
 * 核心原则：胖大≠实，瘦小红≠单纯虚
 * 要看到表象下的本质
 */

import type { TongueShapeValue, TongueColorValue } from '@/types/tongue';

/**
 * 舌形反直觉规则
 * 表面特征 -> 真实本质
 */
export interface TongueShapeRule {
  id: string;
  tongueShape: TongueShapeValue | TongueShapeValue[];
  tongueColor?: TongueColorValue | TongueColorValue[];
  features?: ('teethMark' | 'crack')[];
  pattern: string;
  essence: string;
  description: string;
  mechanism: string;
  confidence: number;
  isAntiIntuitive: boolean;
  evidence: string[];
}

export const tongueShapeRules: TongueShapeRule[] = [
  // ========== 胖大舌规则（反直觉：胖大≠实，而是气虚）==========
  {
    id: 'L2-R01',
    tongueShape: '胖大',
    pattern: '气虚',
    essence: '气虚（本虚）',
    description: '舌体胖大为气虚表现',
    mechanism: '气虚→水湿运化失常→湿泛于舌→胖大',
    confidence: 0.75,
    isAntiIntuitive: true,
    evidence: ['反直觉判断：胖大≠实，而是气虚'],
  },
  {
    id: 'L2-R02',
    tongueShape: '胖大',
    tongueColor: ['淡白', '淡红'],
    pattern: '气虚/阳虚',
    essence: '气虚（阳虚倾向）',
    description: '舌体胖大舌色淡为气虚或阳虚',
    mechanism: '气虚/阳虚→水湿运化失常→湿泛于舌→胖大',
    confidence: 0.8,
    isAntiIntuitive: true,
    evidence: ['胖大舌+淡白=气虚/阳虚'],
  },
  {
    id: 'L2-R03',
    tongueShape: '胖大',
    features: ['teethMark'],
    pattern: '气虚湿盛',
    essence: '气虚+湿盛（本虚标实）',
    description: '胖大+齿痕=气虚为本，湿盛为标',
    mechanism: '气虚为本，湿盛为标',
    confidence: 0.85,
    isAntiIntuitive: true,
    evidence: ['胖大+齿痕=气虚湿盛', '气虚为本，湿盛为标'],
  },
  {
    id: 'L2-R04',
    tongueShape: '胖大',
    tongueColor: ['红', '绛'],
    pattern: '湿热/实热',
    essence: '湿热蕴结',
    description: '舌体胖大舌色红为湿热或实热',
    mechanism: '湿热内蕴→熏蒸于舌→舌体胖大色红',
    confidence: 0.75,
    isAntiIntuitive: false,
    evidence: ['胖大+舌红=湿热'],
  },
  
  // ========== 瘦薄舌规则（反直觉：瘦薄≠单纯虚）==========
  {
    id: 'L2-R10',
    tongueShape: '瘦薄',
    pattern: '阴虚',
    essence: '阴虚（津液耗损）',
    description: '舌体瘦薄为阴虚表现',
    mechanism: '阴虚→组织失养→舌体收缩',
    confidence: 0.75,
    isAntiIntuitive: true,
    evidence: ['舌体瘦薄=阴虚津亏'],
  },
  {
    id: 'L2-R11',
    tongueShape: '瘦薄',
    tongueColor: ['红', '绛'],
    pattern: '阴虚火旺',
    essence: '阴虚火旺',
    description: '舌体瘦薄舌色红为阴虚火旺',
    mechanism: '阴虚→虚火灼津→舌红少津→舌体瘦薄',
    confidence: 0.85,
    isAntiIntuitive: true,
    evidence: ['瘦薄+红=阴虚火旺', '阴虚→虚火灼津'],
  },
  {
    id: 'L2-R12',
    tongueShape: '瘦薄',
    tongueColor: ['淡白', '淡红'],
    pattern: '气血两虚',
    essence: '气血两虚',
    description: '舌体瘦薄舌色淡为气血两虚',
    mechanism: '气血亏虚→组织失养→舌体瘦薄色淡',
    confidence: 0.8,
    isAntiIntuitive: true,
    evidence: ['瘦薄+淡=气血两虚'],
  },
  {
    id: 'L2-R13',
    tongueShape: '瘦薄',
    features: ['crack'],
    tongueColor: ['红', '绛'],
    pattern: '阴虚火旺+裂纹',
    essence: '阴虚火旺（津液大亏）',
    description: '舌体瘦薄舌红有裂纹为阴虚火旺津液大亏',
    mechanism: '阴虚→虚火灼津→舌红有裂纹→舌体瘦薄',
    confidence: 0.9,
    isAntiIntuitive: true,
    evidence: ['瘦薄+红+裂纹=阴虚火旺重证'],
  },
  
  // ========== 齿痕舌规则 ==========
  {
    id: 'L2-R20',
    tongueShape: ['胖大', '正常', '适中'],
    features: ['teethMark'],
    pattern: '脾虚湿盛',
    essence: '脾虚湿盛',
    description: '舌边有齿痕为脾虚湿盛',
    mechanism: '脾虚→运化失司→湿泛于舌→齿痕',
    confidence: 0.75,
    isAntiIntuitive: false,
    evidence: ['齿痕=脾虚湿盛'],
  },
  {
    id: 'L2-R21',
    tongueShape: '胖大',
    features: ['teethMark'],
    tongueColor: '淡白',
    pattern: '气虚湿盛（阳虚倾向）',
    essence: '气虚+阳虚+湿盛',
    description: '胖大+齿痕+舌淡为气虚阳虚湿盛',
    mechanism: '气虚/阳虚为本，湿盛为标',
    confidence: 0.85,
    isAntiIntuitive: true,
    evidence: ['胖大+齿痕+淡白=气虚阳虚湿盛'],
  },
  
  // ========== 裂纹舌规则 ==========
  {
    id: 'L2-R30',
    tongueShape: ['瘦薄', '正常', '适中'],
    features: ['crack'],
    tongueColor: ['淡白', '淡红'],
    pattern: '血虚',
    essence: '血虚',
    description: '舌淡有裂纹为血虚',
    mechanism: '血虚→组织失养→舌面裂纹',
    confidence: 0.7,
    isAntiIntuitive: false,
    evidence: ['裂纹+舌淡=血虚'],
  },
  {
    id: 'L2-R31',
    tongueShape: ['瘦薄', '正常', '适中'],
    features: ['crack'],
    tongueColor: ['红', '绛'],
    pattern: '阴虚火旺',
    essence: '阴虚火旺',
    description: '舌红有裂纹为阴虚火旺',
    mechanism: '阴虚→虚火灼津→舌红裂纹',
    confidence: 0.75,
    isAntiIntuitive: false,
    evidence: ['裂纹+舌红=阴虚火旺'],
  },
  {
    id: 'L2-R32',
    tongueShape: ['正常', '适中'],
    features: ['crack'],
    tongueColor: ['淡白', '淡红', '红'],
    pattern: '精亏',
    essence: '精亏',
    description: '舌有裂纹为精亏表现',
    mechanism: '肾精亏虚→精不化血→舌失所养→裂纹',
    confidence: 0.65,
    isAntiIntuitive: false,
    evidence: ['裂纹=精亏'],
  },
  
  // ========== 短缩舌规则（危急重症）==========
  {
    id: 'L2-R40',
    tongueShape: '短缩',
    pattern: '危急重症',
    essence: '热盛伤津/寒凝筋脉',
    description: '舌体短缩为危重证候',
    mechanism: '热盛伤津或寒凝筋脉致舌卷短缩',
    confidence: 0.9,
    isAntiIntuitive: false,
    evidence: ['短缩舌为危急表现'],
  },
  
  // ========== 松弛舌规则 ==========
  {
    id: 'L2-R50',
    tongueShape: '松弛',
    pattern: '气虚（松弛）',
    essence: '气虚',
    description: '舌体松弛为气虚表现',
    mechanism: '气虚→肌肉松弛→舌体无力',
    confidence: 0.7,
    isAntiIntuitive: false,
    evidence: ['松弛舌=气虚'],
  },
];

/**
 * 虚实本质判断规则
 * 综合舌形特征判断虚实
 */
export interface EssenceRule {
  id: string;
  name: string;
  conditions: {
    hasDeficiencySign: boolean;
    hasExcessSign: boolean;
    deficiencyPatterns: string[];
    excessPatterns: string[];
  };
  result: {
    essenceLabel: string;
    description: string;
    confidence: number;
  };
}

export const essenceRules: EssenceRule[] = [
  {
    id: 'L2-E01',
    name: '纯虚证',
    conditions: {
      hasDeficiencySign: true,
      hasExcessSign: false,
      deficiencyPatterns: ['气虚', '阴虚', '血虚', '阳虚'],
      excessPatterns: [],
    },
    result: {
      essenceLabel: '本虚',
      description: '以虚为主，正气不足',
      confidence: 0.8,
    },
  },
  {
    id: 'L2-E02',
    name: '纯实证',
    conditions: {
      hasDeficiencySign: false,
      hasExcessSign: true,
      deficiencyPatterns: [],
      excessPatterns: ['湿热', '实热', '血瘀', '痰湿'],
    },
    result: {
      essenceLabel: '标实',
      description: '以实为主，邪气盛实',
      confidence: 0.7,
    },
  },
  {
    id: 'L2-E03',
    name: '虚实夹杂',
    conditions: {
      hasDeficiencySign: true,
      hasExcessSign: true,
      deficiencyPatterns: ['气虚', '阴虚', '血虚', '阳虚'],
      excessPatterns: ['湿盛', '湿热', '痰湿'],
    },
    result: {
      essenceLabel: '虚实夹杂',
      description: '本虚标实，以虚为本',
      confidence: 0.75,
    },
  },
  {
    id: 'L2-E04',
    name: '平和质',
    conditions: {
      hasDeficiencySign: false,
      hasExcessSign: false,
      deficiencyPatterns: [],
      excessPatterns: [],
    },
    result: {
      essenceLabel: '虚实平衡',
      description: '舌形特征未显示明显虚实偏颇',
      confidence: 0.6,
    },
  },
];

/**
 * 匹配舌形规则
 */
export function matchTongueShapeRule(
  shape: TongueShapeValue,
  color?: TongueColorValue,
  hasTeethMark?: boolean,
  hasCrack?: boolean
): TongueShapeRule | undefined {
  return tongueShapeRules.find(rule => {
    // 检查舌形
    const shapeMatch = Array.isArray(rule.tongueShape)
      ? rule.tongueShape.includes(shape)
      : rule.tongueShape === shape;
    
    if (!shapeMatch) return false;
    
    // 检查舌色（如果规则有要求）
    if (rule.tongueColor && color) {
      const colorMatch = Array.isArray(rule.tongueColor)
        ? rule.tongueColor.includes(color)
        : rule.tongueColor === color;
      if (!colorMatch) return false;
    }
    
    // 检查特征（如果规则有要求）
    if (rule.features && rule.features.length > 0) {
      for (const feature of rule.features) {
        if (feature === 'teethMark' && !hasTeethMark) return false;
        if (feature === 'crack' && !hasCrack) return false;
      }
    }
    
    return true;
  });
}

/**
 * 判断虚实本质
 */
export function determineEssence(
  patterns: string[]
): { essenceLabel: string; description: string; confidence: number } {
  const hasDeficiencySign = patterns.some(p =>
    ['气虚', '阴虚', '血虚', '阳虚'].some(d => p.includes(d))
  );
  const hasExcessSign = patterns.some(p =>
    ['湿盛', '湿热', '痰湿', '实热', '血瘀'].some(e => p.includes(e))
  );
  
  const matchingRule = essenceRules.find(rule => {
    if (rule.conditions.hasDeficiencySign !== hasDeficiencySign) return false;
    if (rule.conditions.hasExcessSign !== hasExcessSign) return false;
    return true;
  });
  
  if (matchingRule) {
    return matchingRule.result;
  }
  
  return {
    essenceLabel: '待定',
    description: '需结合更多信息判断虚实',
    confidence: 0.3,
  };
}

/**
 * Layer2 规则导出
 */
export const Layer2Rules = {
  tongueShapeRules,
  essenceRules,
  matchTongueShapeRule,
  determineEssence,
};
