/**
 * 八大体质判断引擎 v1.0
 * 基于舌象特征直接判断体质，而非从证型倒推
 * 支持复合体质识别（主体质 + 兼夹体质）
 */

import {
  ConstitutionEnum,
  ConstitutionType,
  CompoundConstitution,
  ConstitutionAssessment,
  CONSTITUTION_DATA,
} from '@/types/output';

// 舌象特征输入
export interface TongueFeaturesForConstitution {
  tongueColor: string;        // 舌色: 淡红/淡白/红/绛/紫/青紫
  tongueShape: string;        // 舌形: 胖大/瘦薄/正常
  coatingColor: string;       // 苔色: 薄白/白厚/黄/灰黑/剥落
  coatingTexture: string;     // 苔质: 薄/厚/正常
  teethMark: boolean;         // 齿痕
  crack: boolean;            // 裂纹
  ecchymosis?: boolean;       // 瘀斑
  tongueShapeDetail?: string; // 舌形详细: 偏尖/鼓胀等
  coatingGreasy?: boolean;   // 苔腻
}

// 体质匹配规则
interface ConstitutionMatchRule {
  type: ConstitutionEnum;
  // 匹配条件：多个条件满足则匹配
  conditions: {
    tongueColor?: string[];
    tongueShape?: string[];
    coatingColor?: string[];
    coatingTexture?: string[];
    teethMark?: boolean;
    crack?: boolean;
    ecchymosis?: boolean;
    tongueShapeDetail?: string[];
    coatingGreasy?: boolean;
    coatingMoisture?: string[]; // 润燥
  };
  // 特征权重
  weights: {
    tongueColor: number;
    tongueShape: number;
    coating: number;
    teethMark: number;
    crack: number;
    ecchymosis: number;
  };
}

// 八大体质舌象特征映射规则
const CONSTITUTION_RULES: ConstitutionMatchRule[] = [
  // 气虚体质
  {
    type: '气虚',
    conditions: {
      tongueShape: ['胖大'],
      teethMark: true,
      coatingTexture: ['厚'],
    },
    weights: { tongueColor: 0.2, tongueShape: 0.3, coating: 0.2, teethMark: 0.2, crack: 0.05, ecchymosis: 0.05 },
  },
  {
    type: '气虚',
    conditions: {
      crack: true,
      coatingTexture: ['薄'],
    },
    weights: { tongueColor: 0.2, tongueShape: 0.2, coating: 0.3, teethMark: 0.1, crack: 0.15, ecchymosis: 0.05 },
  },
  // 阴虚体质
  {
    type: '阴虚',
    conditions: {
      tongueColor: ['红', '绛'],
      crack: true,
      coatingColor: ['剥落'],
    },
    weights: { tongueColor: 0.35, tongueShape: 0.1, coating: 0.35, teethMark: 0.05, crack: 0.1, ecchymosis: 0.05 },
  },
  {
    type: '阴虚',
    conditions: {
      tongueColor: ['红'],
      coatingColor: ['剥落'],
    },
    weights: { tongueColor: 0.4, tongueShape: 0.1, coating: 0.4, teethMark: 0.0, crack: 0.05, ecchymosis: 0.05 },
  },
  // 阳虚体质
  {
    type: '阳虚',
    conditions: {
      tongueColor: ['淡白', '淡红'],
      tongueShape: ['胖大'],
      teethMark: true,
      coatingColor: ['薄白', '白厚'],
    },
    weights: { tongueColor: 0.25, tongueShape: 0.25, coating: 0.25, teethMark: 0.2, crack: 0.0, ecchymosis: 0.05 },
  },
  // 血瘀体质
  {
    type: '血瘀',
    conditions: {
      tongueColor: ['紫', '青紫'],
      ecchymosis: true,
    },
    weights: { tongueColor: 0.4, tongueShape: 0.1, coating: 0.1, teethMark: 0.0, crack: 0.1, ecchymosis: 0.3 },
  },
  {
    type: '血瘀',
    conditions: {
      tongueColor: ['紫'],
    },
    weights: { tongueColor: 0.5, tongueShape: 0.1, coating: 0.1, teethMark: 0.0, crack: 0.1, ecchymosis: 0.2 },
  },
  // 痰湿体质
  {
    type: '痰湿',
    conditions: {
      tongueShape: ['胖大'],
      coatingTexture: ['厚'],
      teethMark: true,
    },
    weights: { tongueColor: 0.1, tongueShape: 0.35, coating: 0.35, teethMark: 0.15, crack: 0.0, ecchymosis: 0.05 },
  },
  {
    type: '痰湿',
    conditions: {
      tongueShape: ['胖大'],
      coatingColor: ['白厚'],
    },
    weights: { tongueColor: 0.1, tongueShape: 0.4, coating: 0.4, teethMark: 0.05, crack: 0.0, ecchymosis: 0.05 },
  },
  // 湿热体质
  {
    type: '湿热',
    conditions: {
      tongueColor: ['红'],
      coatingColor: ['黄'],
      coatingTexture: ['厚'],
    },
    weights: { tongueColor: 0.35, tongueShape: 0.1, coating: 0.45, teethMark: 0.0, crack: 0.05, ecchymosis: 0.05 },
  },
  {
    type: '湿热',
    conditions: {
      tongueColor: ['红'],
      coatingColor: ['黄'],
    },
    weights: { tongueColor: 0.4, tongueShape: 0.1, coating: 0.4, teethMark: 0.0, crack: 0.05, ecchymosis: 0.05 },
  },
  // 气郁体质
  {
    type: '气郁',
    conditions: {
      tongueShapeDetail: ['偏尖'],
      tongueColor: ['红', '淡红'],
    },
    weights: { tongueColor: 0.3, tongueShape: 0.5, coating: 0.1, teethMark: 0.0, crack: 0.05, ecchymosis: 0.05 },
  },
  // 平和体质
  {
    type: '平和',
    conditions: {
      tongueColor: ['淡红'],
      coatingColor: ['薄白'],
      tongueShape: ['正常'],
      coatingTexture: ['薄'],
    },
    weights: { tongueColor: 0.3, tongueShape: 0.25, coating: 0.3, teethMark: 0.05, crack: 0.05, ecchymosis: 0.05 },
  },
];

/**
 * 检查条件是否匹配
 */
function checkCondition(
  value: any,
  expected: any[]
): boolean {
  if (!expected || expected.length === 0) return true;
  if (value === undefined || value === null || value === '') return false;
  return expected.includes(value);
}

/**
 * 计算单个规则的匹配得分
 */
function calculateRuleScore(
  rule: ConstitutionMatchRule,
  features: TongueFeaturesForConstitution
): number {
  let totalWeight = 0;
  let matchedWeight = 0;
  const matchedFeatures: string[] = [];

  const conditions = rule.conditions;

  // 舌色匹配
  if (conditions.tongueColor) {
    totalWeight += rule.weights.tongueColor;
    if (checkCondition(features.tongueColor, conditions.tongueColor)) {
      matchedWeight += rule.weights.tongueColor;
      matchedFeatures.push(`舌色${features.tongueColor}`);
    }
  }

  // 舌形匹配
  if (conditions.tongueShape) {
    totalWeight += rule.weights.tongueShape;
    if (checkCondition(features.tongueShape, conditions.tongueShape)) {
      matchedWeight += rule.weights.tongueShape;
      matchedFeatures.push(`舌形${features.tongueShape}`);
    }
  }

  // 苔色匹配
  if (conditions.coatingColor) {
    totalWeight += rule.weights.coating;
    if (checkCondition(features.coatingColor, conditions.coatingColor)) {
      matchedWeight += rule.weights.coating;
      matchedFeatures.push(`苔色${features.coatingColor}`);
    }
  }

  // 苔质匹配
  if (conditions.coatingTexture) {
    totalWeight += rule.weights.coating;
    if (checkCondition(features.coatingTexture, conditions.coatingTexture)) {
      matchedWeight += rule.weights.coating;
      matchedFeatures.push(`苔质${features.coatingTexture}`);
    }
  }

  // 齿痕匹配
  if (conditions.teethMark !== undefined) {
    totalWeight += rule.weights.teethMark;
    if (features.teethMark === conditions.teethMark) {
      matchedWeight += rule.weights.teethMark;
      matchedFeatures.push(conditions.teethMark ? '有齿痕' : '无齿痕');
    }
  }

  // 裂纹匹配
  if (conditions.crack !== undefined) {
    totalWeight += rule.weights.crack;
    if (features.crack === conditions.crack) {
      matchedWeight += rule.weights.crack;
      matchedFeatures.push(conditions.crack ? '有裂纹' : '无裂纹');
    }
  }

  // 瘀斑匹配
  if (conditions.ecchymosis !== undefined) {
    totalWeight += rule.weights.ecchymosis;
    if (features.ecchymosis === conditions.ecchymosis) {
      matchedWeight += rule.weights.ecchymosis;
      matchedFeatures.push(conditions.ecchymosis ? '有瘀斑' : '无瘀斑');
    }
  }

  // 舌形细节（偏尖等）
  if (conditions.tongueShapeDetail) {
    totalWeight += rule.weights.tongueShape;
    if (checkCondition(features.tongueShapeDetail, conditions.tongueShapeDetail)) {
      matchedWeight += rule.weights.tongueShape;
      matchedFeatures.push(`舌形特征${features.tongueShapeDetail}`);
    }
  }

  return totalWeight > 0 ? matchedWeight / totalWeight : 0;
}

/**
 * 构建体质类型
 */
function buildConstitutionType(
  type: ConstitutionEnum,
  confidence: number,
  matchedFeatures: string[]
): ConstitutionType {
  const data = CONSTITUTION_DATA[type];
  return {
    type,
    name: data.name,
    description: data.description,
    characteristics: data.characteristics,
    carePrinciple: data.carePrinciple,
    careMethod: data.careMethod,
    dietary禁忌: data.dietary禁忌,
    lifestyle建议: data.lifestyle建议,
    matchedFeatures,
    confidence,
  };
}

/**
 * 核心体质评估函数
 * 从舌象特征直接判断体质
 */
export function assessConstitution(
  features: TongueFeaturesForConstitution
): ConstitutionAssessment {
  
  // 1. 计算所有规则的匹配得分
  const ruleScores: { rule: ConstitutionMatchRule; score: number; matchedFeatures: string[] }[] = [];
  
  for (const rule of CONSTITUTION_RULES) {
    const score = calculateRuleScore(rule, features);
    if (score > 0) {
      // 重新计算匹配的舌象特征
      const matchedFeatures: string[] = [];
      const conditions = rule.conditions;
      
      if (conditions.tongueColor && features.tongueColor && conditions.tongueColor.includes(features.tongueColor)) {
        matchedFeatures.push(`舌色${features.tongueColor}`);
      }
      if (conditions.tongueShape && features.tongueShape && conditions.tongueShape.includes(features.tongueShape)) {
        matchedFeatures.push(`舌形${features.tongueShape}`);
      }
      if (conditions.coatingColor && features.coatingColor && conditions.coatingColor.includes(features.coatingColor)) {
        matchedFeatures.push(`苔色${features.coatingColor}`);
      }
      if (conditions.coatingTexture && features.coatingTexture && conditions.coatingTexture.includes(features.coatingTexture)) {
        matchedFeatures.push(`苔质${features.coatingTexture}`);
      }
      if (conditions.teethMark !== undefined && features.teethMark === conditions.teethMark) {
        matchedFeatures.push(conditions.teethMark ? '有齿痕' : '无齿痕');
      }
      if (conditions.crack !== undefined && features.crack === conditions.crack) {
        matchedFeatures.push(conditions.crack ? '有裂纹' : '无裂纹');
      }
      if (conditions.ecchymosis !== undefined && features.ecchymosis === conditions.ecchymosis) {
        matchedFeatures.push(conditions.ecchymosis ? '有瘀斑' : '无瘀斑');
      }
      if (conditions.tongueShapeDetail && features.tongueShapeDetail && conditions.tongueShapeDetail.includes(features.tongueShapeDetail)) {
        matchedFeatures.push(`舌形特征${features.tongueShapeDetail}`);
      }
      
      ruleScores.push({ rule, score, matchedFeatures });
    }
  }

  // 2. 按得分排序
  ruleScores.sort((a, b) => b.score - a.score);

  // 3. 确定主体质和兼夹体质
  let primary: ConstitutionType | null = null;
  const secondary: ConstitutionType[] = [];
  const MIN_CONFIDENCE = 0.4; // 最低置信度阈值

  for (let i = 0; i < ruleScores.length; i++) {
    const { rule, score, matchedFeatures } = ruleScores[i];
    
    if (i === 0 && score >= MIN_CONFIDENCE) {
      // 第一高分的作为主体质
      primary = buildConstitutionType(rule.type, score, matchedFeatures);
    } else if (i > 0 && i < 3 && score >= MIN_CONFIDENCE) {
      // 第二、三名作为兼夹体质
      const existing = secondary.find(s => s.type === rule.type);
      if (!existing) {
        secondary.push(buildConstitutionType(rule.type, score, matchedFeatures));
      }
    } else {
      break;
    }
  }

  // 4. 如果没有匹配到足够置信度的体质，判定为平和或气虚（最常见偏颇体质）
  if (!primary) {
    // 检查是否有任何基本特征
    const hasAnyFeature = 
      features.tongueColor || 
      features.tongueShape !== '正常' || 
      features.teethMark || 
      features.crack ||
      features.coatingColor !== '薄白';
    
    if (hasAnyFeature) {
      // 有特征但不足以确定体质，默认气虚（临床最常见）
      primary = buildConstitutionType('气虚', 0.3, ['舌象特征不足以确定特定体质']);
    } else {
      // 无明显特征，判定为平和
      primary = buildConstitutionType('平和', 0.8, ['舌色淡红，苔薄白，舌形正常']);
    }
  }

  // 5. 构建复合体质结果
  const compound: CompoundConstitution = {
    primary,
    summary: secondary.length > 0 
      ? `${primary.name}为主，兼有${secondary.map(s => s.name.replace('体质', '')).join('、')}倾向`
      : primary.name,
  };

  if (secondary.length > 0) {
    compound.secondary = secondary;
  }

  // 6. 生成健康提示
  const healthTips: string[] = [];
  
  if (primary.type === '平和') {
    healthTips.push('继续保持良好的生活习惯');
    healthTips.push('饮食均衡，适度运动');
  } else {
    healthTips.push(`体质偏颇，建议针对性调理`);
    healthTips.push(`调理原则：${primary.carePrinciple}`);
    if (primary.dietary禁忌.length > 0 && primary.dietary禁忌[0] !== '无特殊禁忌') {
      healthTips.push(`饮食禁忌：${primary.dietary禁忌.slice(0, 2).join('、')}`);
    }
  }

  return {
    constitution: compound,
    isBalanced: primary.type === '平和',
    healthTips,
  };
}

/**
 * 兼容旧接口：从证型推断体质（仅作为后备）
 */
export function inferConstitutionFromSyndrome(syndrome: string): ConstitutionType | null {
  const syndromeMap: Record<string, ConstitutionEnum> = {
    '湿热': '湿热',
    '痰湿': '痰湿',
    '血瘀': '血瘀',
    '气郁': '气郁',
    '阴虚': '阴虚',
    '阳虚': '阳虚',
    '气虚': '气虚',
    '气血': '气虚',
  };

  for (const [key, value] of Object.entries(syndromeMap)) {
    if (syndrome.includes(key)) {
      return buildConstitutionType(value, 0.6, [`证型包含${key}`]);
    }
  }

  return null;
}
