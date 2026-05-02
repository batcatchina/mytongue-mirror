/**
 * 舌诊辨证规则引擎 (v1.0)
 * 实现"舌象特征→辨证评分→证型判断→选穴推荐"的完整推理链路
 */

// ==================== 类型定义 ====================

/** 舌色枚举 */
export type TongueColor = 
  | '淡白舌' | '淡红舌' | '红舌' | '绛舌' | '紫舌' | '青紫舌'
  | '舌尖红' | '舌边红' | '舌红少津';

/** 舌形枚举 */
export type TongueShape = 
  | '胖大舌' | '瘦薄舌' | '裂纹舌' | '齿痕舌' | '点刺舌' | '芒刺舌' | '正常舌形';

/** 舌体特征枚举 */
export type TongueBodyFeature = 
  | '正常' | '水滑' | '瘀斑' | '干燥' | '少津';

/** 苔色枚举 */
export type CoatingColor = 
  | '薄白苔' | '白苔' | '黄苔' | '灰苔' | '黑苔' | '绿苔';

/** 苔质枚举 */
export type CoatingTexture = 
  | '薄苔' | '厚苔' | '润苔' | '滑苔' | '燥苔' | '腻苔' | '腐苔' | '剥落苔';

/** 舌苔分布枚举 */
export type Distribution = 
  | '全苔' | '偏苔' | '中苔' | '根苔';

/** 舌态类型枚举 */
export type MovementType = 
  | '正常' | '颤动舌' | '歪斜舌' | '萎软舌' | '强硬舌' | '短缩舌' | '吐弄舌';

/** 舌态程度枚举 */
export type MovementDegree = 
  | '无' | '轻微' | '中等' | '明显' | '重度';

/** 优先级类型 */
export type PriorityLevel = '急症' | '重症' | '实证' | '综合';

/** 冲突类型 */
export type ConflictType = '寒热' | '虚实' | '燥湿' | '多证型';

/** 治法类型 */
export type TreatmentMethod = '补法' | '泻法' | '平补平泻';

/** 舌象特征输入结构 */
export interface TongueFeatures {
  tongueBody: {
    color: TongueColor;
    shape: TongueShape;
    body: TongueBodyFeature;
  };
  coating: {
    color: CoatingColor;
    texture: CoatingTexture;
    distribution: Distribution;
  };
  movement: {
    type: MovementType;
    degree: MovementDegree;
  };
}

/** 三维评分结果 */
export interface ScoringResult {
  tongueBody: {
    score: number;
    maxScore: number;
    breakdown: {
      colorScore: number;
      shapeScore: number;
      bodyScore: number;
    };
  };
  coating: {
    score: number;
    maxScore: number;
    breakdown: {
      colorScore: number;
      textureScore: number;
      distributionScore: number;
    };
  };
  movement: {
    score: number;
    maxScore: number;
    breakdown: {
      typeScore: number;
      degreeScore: number;
    };
  };
  total: {
    score: number;
    maxScore: number;
    percentage: number;
  };
}

/** 匹配的规则 */
export interface MatchedRule {
  ruleId: string;
  ruleName: string;
  matchScore: number;
  confidence: number;
  matchedFeatures: string[];
}

/** 冲突处理信息 */
export interface ConflictInfo {
  conflictType: ConflictType;
  resolution: string;
  finalDecision: string;
}

/** 证型判断结果 */
export interface SyndromeDiagnosis {
  priority: PriorityLevel;
  primarySyndrome: string;
  syndromeScore: number;
  matchedRules: MatchedRule[];
  pathogenesis: string;
  treatment: {
    principle: string;
    method: string;
  };
  conflictResolution?: ConflictInfo;
}

/** 穴位信息 */
export interface Acupoint {
  name: string;
  meridian: string;
  function: string;
}

/** 针灸处方 */
export interface AcupuncturePrescription {
  syndrome: string;
  treatment: {
    principle: string;
    method: TreatmentMethod;
  };
  acupoints: {
    mainPoints: Acupoint[];
    secondaryPoints: Acupoint[];
    localPoints?: Acupoint[];
  };
  technique: {
    method: TreatmentMethod;
    moxibustion?: string;
    needleRetention: number;
  };
  course: {
    frequency: string;
    duration: string;
  };
}

/** 完整辨证结果 */
export interface DiagnosisResult {
  features: TongueFeatures;
  scoring: ScoringResult;
  syndrome: SyndromeDiagnosis;
  prescription: AcupuncturePrescription;
  timestamp: string;
}

// ==================== 评分规则表 ====================

/** 舌色评分表 */
const TONGUE_COLOR_SCORES: Record<TongueColor, number> = {
  '淡白舌': 4,
  '淡红舌': 3,
  '红舌': 6,
  '绛舌': 8,
  '紫舌': 10,
  '青紫舌': 10,
  '舌尖红': 6,
  '舌边红': 7,
  '舌红少津': 8
};

/** 舌形评分表 */
const TONGUE_SHAPE_SCORES: Record<TongueShape, number> = {
  '正常舌形': 0,
  '胖大舌': 5,
  '瘦薄舌': 6,
  '裂纹舌': 5,
  '齿痕舌': 4,
  '点刺舌': 6,
  '芒刺舌': 8
};

/** 舌体特征评分表 */
const TONGUE_BODY_SCORES: Record<TongueBodyFeature, number> = {
  '正常': 0,
  '水滑': 6,
  '瘀斑': 8,
  '干燥': 5,
  '少津': 8
};

/** 苔色评分表 */
const COATING_COLOR_SCORES: Record<CoatingColor, number> = {
  '薄白苔': 5,
  '白苔': 5,
  '黄苔': 7,
  '灰苔': 6,
  '黑苔': 8,
  '绿苔': 7
};

/** 苔质评分表 */
const COATING_TEXTURE_SCORES: Record<CoatingTexture, number> = {
  '薄苔': 3,
  '厚苔': 5,
  '润苔': 4,
  '滑苔': 6,
  '燥苔': 7,
  '腻苔': 7,
  '腐苔': 8,
  '剥落苔': 8
};

/** 舌苔分布评分表 */
const DISTRIBUTION_SCORES: Record<Distribution, number> = {
  '全苔': 5,
  '偏苔': 3,
  '中苔': 4,
  '根苔': 4
};

/** 舌态类型评分表 */
const MOVEMENT_TYPE_SCORES: Record<MovementType, number> = {
  '正常': 0,
  '颤动舌': 8,
  '歪斜舌': 10,
  '萎软舌': 8,
  '强硬舌': 10,
  '短缩舌': 12,
  '吐弄舌': 7
};

/** 舌态程度评分表 */
const MOVEMENT_DEGREE_SCORES: Record<MovementDegree, number> = {
  '无': 0,
  '轻微': 5,
  '中等': 7,
  '明显': 9,
  '重度': 12
};

// ==================== 证型规则库 ====================

/** 复合证型规则 */
interface CompositeRule {
  id: string;
  name: string;
  features: Partial<{
    tongueColor: TongueColor;
    tongueShape: TongueShape;
    tongueBody: TongueBodyFeature;
    coatingColor: CoatingColor;
    coatingTexture: CoatingTexture;
    movementType: MovementType;
  }>;
  threshold: number;
  pathogenesis: string;
  treatment: {
    principle: string;
    method: TreatmentMethod;
  };
  acupoints: {
    main: string[];
    secondary: string[];
  };
}

/** 复合证型规则库 */
const COMPOSITE_RULES: CompositeRule[] = [
  {
    id: 'CF01',
    name: '气血两虚证',
    features: {
      tongueColor: '淡白舌',
      coatingColor: '薄白苔'
    },
    threshold: 9,
    pathogenesis: '阳气不足，血失温煦',
    treatment: {
      principle: '益气养血，健脾和胃',
      method: '补法'
    },
    acupoints: {
      main: ['足三里', '中脘', '膈俞'],
      secondary: ['脾俞', '胃俞', '血海']
    }
  },
  {
    id: 'CF02',
    name: '脾虚湿盛证',
    features: {
      tongueColor: '淡白舌',
      tongueShape: '胖大舌',
      coatingTexture: '腻苔'
    },
    threshold: 13,
    pathogenesis: '脾失健运，湿浊内停',
    treatment: {
      principle: '健脾祛湿，化浊和中',
      method: '补法'
    },
    acupoints: {
      main: ['中脘', '阴陵泉', '足三里'],
      secondary: ['脾俞', '丰隆', '三阴交']
    }
  },
  {
    id: 'CF03',
    name: '脾虚湿盛证（典型）',
    features: {
      tongueShape: '胖大舌',
      tongueBody: '齿痕',
      coatingTexture: '腻苔',
      coatingColor: '白苔'
    },
    threshold: 16,
    pathogenesis: '脾虚不运，湿邪困阻',
    treatment: {
      principle: '健脾益气，燥湿化浊',
      method: '补法'
    },
    acupoints: {
      main: ['中脘', '阴陵泉', '足三里'],
      secondary: ['脾俞', '丰隆', '三阴交']
    }
  },
  {
    id: 'CF04',
    name: '实热证',
    features: {
      tongueColor: '红舌',
      coatingColor: '黄苔'
    },
    threshold: 13,
    pathogenesis: '里热炽盛，熏蒸于舌',
    treatment: {
      principle: '清热泻火，凉血解毒',
      method: '泻法'
    },
    acupoints: {
      main: ['曲池', '合谷', '大椎'],
      secondary: ['内庭', '行间', '太冲']
    }
  },
  {
    id: 'CF05',
    name: '肝胆湿热证',
    features: {
      tongueColor: '舌边红',
      coatingColor: '黄苔',
      coatingTexture: '腻苔'
    },
    threshold: 15,
    pathogenesis: '湿热蕴结肝胆，疏泄失常',
    treatment: {
      principle: '清热利湿，疏肝利胆',
      method: '泻法'
    },
    acupoints: {
      main: ['太冲', '行间', '期门'],
      secondary: ['阴陵泉', '曲泉', '阳陵泉']
    }
  },
  {
    id: 'CF06',
    name: '肝风内动证',
    features: {
      tongueColor: '红舌',
      movementType: '颤动舌'
    },
    threshold: 14,
    pathogenesis: '肝阳化风，热极生风',
    treatment: {
      principle: '平肝熄风，滋阴潜阳',
      method: '泻法'
    },
    acupoints: {
      main: ['太冲', '风池', '合谷'],
      secondary: ['曲池', '足三里', '三阴交']
    }
  },
  {
    id: 'CF07',
    name: '阴虚火旺证',
    features: {
      tongueColor: '舌红少津',
      coatingTexture: '少苔'
    },
    threshold: 12,
    pathogenesis: '阴液亏虚，虚火内扰',
    treatment: {
      principle: '滋阴降火，润燥生津',
      method: '平补平泻'
    },
    acupoints: {
      main: ['太溪', '照海', '三阴交'],
      secondary: ['肾俞', '心俞', '内关']
    }
  },
  {
    id: 'CF08',
    name: '血瘀证',
    features: {
      tongueColor: '紫舌',
      tongueBody: '瘀斑'
    },
    threshold: 16,
    pathogenesis: '气血运行不畅，瘀血内停',
    treatment: {
      principle: '活血化瘀，通络止痛',
      method: '泻法'
    },
    acupoints: {
      main: ['血海', '膈俞', '太冲'],
      secondary: ['三阴交', '合谷', '足三里']
    }
  },
  {
    id: 'CF09',
    name: '心肾不交证',
    features: {
      tongueColor: '舌尖红',
      coatingTexture: '少苔'
    },
    threshold: 10,
    pathogenesis: '心火亢盛，肾水不足，水火不济',
    treatment: {
      principle: '滋阴降火，交通心肾',
      method: '平补平泻'
    },
    acupoints: {
      main: ['神门', '太溪', '心俞'],
      secondary: ['肾俞', '内关', '三阴交']
    }
  },
  {
    id: 'CF10',
    name: '气阴两虚证',
    features: {
      tongueColor: '舌红少津',
      coatingTexture: '剥落苔'
    },
    threshold: 14,
    pathogenesis: '气阴两亏，津液耗伤',
    treatment: {
      principle: '益气养阴，生津润燥',
      method: '补法'
    },
    acupoints: {
      main: ['足三里', '太溪', '三阴交'],
      secondary: ['气海', '关元', '阴郄']
    }
  }
];

/** 穴位信息映射 */
const ACUPOINT_INFO: Record<string, Acupoint> = {
  '足三里': { name: '足三里', meridian: '胃经', function: '益气健脾，强壮要穴' },
  '中脘': { name: '中脘', meridian: '任脉', function: '健脾化湿，胃之募穴' },
  '阴陵泉': { name: '阴陵泉', meridian: '脾经', function: '健脾利湿，脾之合穴' },
  '太冲': { name: '太冲', meridian: '肝经', function: '疏肝泻火，肝之原穴' },
  '行间': { name: '行间', meridian: '肝经', function: '清肝泻火，肝之荥穴' },
  '期门': { name: '期门', meridian: '肝经', function: '疏肝理气，肝之募穴' },
  '太溪': { name: '太溪', meridian: '肾经', function: '滋阴补肾，肾之原穴' },
  '照海': { name: '照海', meridian: '肾经', function: '滋阴清热，八脉交会穴' },
  '三阴交': { name: '三阴交', meridian: '脾经', function: '健脾养血，肝脾肾交汇' },
  '曲池': { name: '曲池', meridian: '大肠经', function: '清热泻火，大肠合穴' },
  '合谷': { name: '合谷', meridian: '大肠经', function: '清热解表，止痛要穴' },
  '血海': { name: '血海', meridian: '脾经', function: '活血化瘀，调血要穴' },
  '膈俞': { name: '膈俞', meridian: '膀胱经', function: '活血化瘀，血会膈俞' },
  '脾俞': { name: '脾俞', meridian: '膀胱经', function: '健脾益气，脾之背俞' },
  '肾俞': { name: '肾俞', meridian: '膀胱经', function: '滋阴补肾，肾之背俞' },
  '丰隆': { name: '丰隆', meridian: '胃经', function: '化痰祛湿，胃经络穴' },
  '风池': { name: '风池', meridian: '胆经', function: '平肝熄风，祛风要穴' },
  '神门': { name: '神门', meridian: '心经', function: '宁心安神，心之原穴' },
  '心俞': { name: '心俞', meridian: '膀胱经', function: '养心安神，心之背俞' },
  '内关': { name: '内关', meridian: '心包经', function: '宽胸理气，安神要穴' },
  '大椎': { name: '大椎', meridian: '督脉', function: '清热解表，诸阳之会' },
  '内庭': { name: '内庭', meridian: '胃经', function: '清胃泻火，胃之荥穴' },
  '血海': { name: '血海', meridian: '脾经', function: '活血化瘀' },
  '曲泉': { name: '曲泉', meridian: '肝经', function: '清利湿热，肝之合穴' },
  '阳陵泉': { name: '阳陵泉', meridian: '胆经', function: '疏肝利胆，筋会' },
  '气海': { name: '气海', meridian: '任脉', function: '补气固本' },
  '关元': { name: '关元', meridian: '任脉', function: '补肾固本，丹田要穴' },
  '阴郄': { name: '阴郄', meridian: '心经', function: '滋阴清热，心之郄穴' },
  '胃俞': { name: '胃俞', meridian: '膀胱经', function: '和胃健脾' },
  '膈俞': { name: '膈俞', meridian: '膀胱经', function: '活血化瘀' }
};

// ==================== 评分计算函数 ====================

/**
 * 计算舌质得分
 */
export function calculateTongueBodyScore(features: TongueFeatures['tongueBody']): ScoringResult['tongueBody'] {
  const colorScore = TONGUE_COLOR_SCORES[features.color] ?? 0;
  const shapeScore = TONGUE_SHAPE_SCORES[features.shape] ?? 0;
  const bodyScore = TONGUE_BODY_SCORES[features.body] ?? 0;
  
  return {
    score: colorScore + shapeScore + bodyScore,
    maxScore: 40,
    breakdown: {
      colorScore,
      shapeScore,
      bodyScore
    }
  };
}

/**
 * 计算舌苔得分
 */
export function calculateCoatingScore(features: TongueFeatures['coating']): ScoringResult['coating'] {
  const colorScore = COATING_COLOR_SCORES[features.color] ?? 0;
  const textureScore = COATING_TEXTURE_SCORES[features.texture] ?? 0;
  const distributionScore = DISTRIBUTION_SCORES[features.distribution] ?? 0;
  
  return {
    score: colorScore + textureScore + distributionScore,
    maxScore: 35,
    breakdown: {
      colorScore,
      textureScore,
      distributionScore
    }
  };
}

/**
 * 计算舌态得分
 */
export function calculateMovementScore(features: TongueFeatures['movement']): ScoringResult['movement'] {
  const typeScore = MOVEMENT_TYPE_SCORES[features.type] ?? 0;
  const degreeScore = MOVEMENT_DEGREE_SCORES[features.degree] ?? 0;
  
  return {
    score: typeScore + degreeScore,
    maxScore: 25,
    breakdown: {
      typeScore,
      degreeScore
    }
  };
}

/**
 * 计算总分
 */
export function calculateTotalScore(
  tongueBodyScore: number,
  coatingScore: number,
  movementScore: number
): ScoringResult['total'] {
  const score = tongueBodyScore + coatingScore + movementScore;
  return {
    score,
    maxScore: 100,
    percentage: score / 100
  };
}

/**
 * 计算舌象特征评分
 */
export function calculateScoring(features: TongueFeatures): ScoringResult {
  const tongueBody = calculateTongueBodyScore(features.tongueBody);
  const coating = calculateCoatingScore(features.coating);
  const movement = calculateMovementScore(features.movement);
  const total = calculateTotalScore(
    tongueBody.score,
    coating.score,
    movement.score
  );
  
  return {
    tongueBody,
    coating,
    movement,
    total
  };
}

// ==================== 优先级判断 ====================

/**
 * 判断辨证优先级
 * 
 * 决策规则：
 * 1. 舌态总分 > 20 → 急症（颤动/强硬/歪斜/短缩）
 * 2. 舌质总分 ≥ 32 → 重症（绛舌/紫舌/青紫）
 * 3. 舌苔总分 ≥ 28 → 实证（黄腻/白腻/腐苔）
 * 4. 其他 → 综合辨证
 */
export function determinePriority(scores: ScoringResult): PriorityLevel {
  const { tongueBody, coating, movement } = scores;
  
  // 急症判断：舌态异常
  if (movement.score > 20) {
    return '急症';
  }
  
  // 重症判断：舌质深重
  if (tongueBody.score >= 32) {
    return '重症';
  }
  
  // 实证判断：舌苔明显
  if (coating.score >= 28) {
    return '实证';
  }
  
  // 综合辨证
  return '综合';
}

// ==================== 证型匹配 ====================

/**
 * 匹配复合证型
 */
export function matchCompositeSyndrome(
  features: TongueFeatures,
  scores: ScoringResult
): MatchedRule[] {
  const matchedRules: MatchedRule[] = [];
  
  for (const rule of COMPOSITE_RULES) {
    let matchCount = 0;
    let matchScore = 0;
    const matchedFeatures: string[] = [];
    
    const featureMap = {
      tongueColor: features.tongueBody.color,
      tongueShape: features.tongueBody.shape,
      tongueBody: features.tongueBody.body,
      coatingColor: features.coating.color,
      coatingTexture: features.coating.texture,
      movementType: features.movement.type
    };
    
    // 检查每个特征
    for (const [key, value] of Object.entries(rule.features)) {
      const featureKey = key as keyof typeof featureMap;
      if (value && featureMap[featureKey] === value) {
        matchCount++;
        matchedFeatures.push(`${key}:${value}`);
        
        // 累加对应分数
        if (key === 'tongueColor') matchScore += TONGUE_COLOR_SCORES[featureMap.tongueColor as TongueColor] ?? 0;
        if (key === 'tongueShape') matchScore += TONGUE_SHAPE_SCORES[featureMap.tongueShape as TongueShape] ?? 0;
        if (key === 'tongueBody') matchScore += TONGUE_BODY_SCORES[featureMap.tongueBody as TongueBodyFeature] ?? 0;
        if (key === 'coatingColor') matchScore += COATING_COLOR_SCORES[featureMap.coatingColor as CoatingColor] ?? 0;
        if (key === 'coatingTexture') matchScore += COATING_TEXTURE_SCORES[featureMap.coatingTexture as CoatingTexture] ?? 0;
        if (key === 'movementType') matchScore += MOVEMENT_TYPE_SCORES[featureMap.movementType as MovementType] ?? 0;
      }
    }
    
    // 计算置信度
    const totalFeatures = Object.keys(rule.features).length;
    const confidence = matchCount / totalFeatures;
    
    // 如果匹配度达到阈值
    if (matchScore >= rule.threshold && confidence >= 0.6) {
      matchedRules.push({
        ruleId: rule.id,
        ruleName: rule.name,
        matchScore,
        confidence,
        matchedFeatures
      });
    }
  }
  
  // 按置信度和得分排序
  return matchedRules.sort((a, b) => {
    if (b.confidence !== a.confidence) {
      return b.confidence - a.confidence;
    }
    return b.matchScore - a.matchScore;
  });
}

// ==================== 冲突处理 ====================

/**
 * 寒热冲突检测与处理
 */
export function resolveColdHeatConflict(
  features: TongueFeatures,
  scores: ScoringResult
): ConflictInfo | null {
  const { tongueBody, coating } = features;
  
  // 寒证特征：淡白舌
  const isCold = tongueBody.color === '淡白舌';
  // 热证特征：黄苔
  const isHeat = coating.color === '黄苔' || coating.color === '灰苔';
  
  if (isCold && isHeat) {
    if (tongueBody.body === '水滑') {
      return {
        conflictType: '寒热',
        resolution: '真寒假热证，以温阳为主',
        finalDecision: '阳虚水泛证'
      };
    } else if (scores.tongueBody.breakdown.colorScore > scores.coating.breakdown.colorScore) {
      return {
        conflictType: '寒热',
        resolution: '本寒标热，以温阳为主',
        finalDecision: '虚寒证'
      };
    } else {
      return {
        conflictType: '寒热',
        resolution: '本热标寒，以清热为主',
        finalDecision: '实热证'
      };
    }
  }
  
  return null;
}

/**
 * 虚实冲突检测与处理
 */
export function resolveDeficiencyExcessConflict(
  features: TongueFeatures,
  scores: ScoringResult
): ConflictInfo | null {
  const { movement, coating } = features;
  
  // 虚证特征：萎软/颤动舌
  const isDeficiency = movement.type === '萎软舌' || movement.type === '颤动舌';
  // 实证特征：厚腻苔
  const isExcess = coating.texture === '腻苔' || coating.texture === '腐苔';
  
  if (isDeficiency && isExcess) {
    if (scores.movement.score > scores.coating.score) {
      return {
        conflictType: '虚实',
        resolution: '本虚标实，虚证为主',
        finalDecision: '虚实夹杂证（虚重于实）'
      };
    } else {
      return {
        conflictType: '虚实',
        resolution: '本虚标实，实证为主',
        finalDecision: '虚实夹杂证（实重于虚）'
      };
    }
  }
  
  return null;
}

// ==================== 选穴匹配 ====================

/**
 * 根据证型获取穴位信息
 */
function getAcupointInfo(name: string): Acupoint {
  return ACUPOINT_INFO[name] || { name, meridian: '', function: '待补充' };
}

/**
 * 根据证型规则生成针灸处方
 */
export function generatePrescription(
  syndrome: string,
  rule?: CompositeRule
): AcupuncturePrescription {
  if (!rule) {
    // 默认处方
    return {
      syndrome,
      treatment: {
        principle: '辨证论治',
        method: '平补平泻'
      },
      acupoints: {
        mainPoints: [],
        secondaryPoints: []
      },
      technique: {
        method: '平补平泻',
        needleRetention: 30
      },
      course: {
        frequency: '每日1次或隔日1次',
        duration: '10日为一疗程'
      }
    };
  }
  
  const mainPoints = rule.acupoints.main.map(getAcupointInfo);
  const secondaryPoints = rule.acupoints.secondary.map(getAcupointInfo);
  
  return {
    syndrome: rule.name,
    treatment: {
      principle: rule.treatment.principle,
      method: rule.treatment.method
    },
    acupoints: {
      mainPoints,
      secondaryPoints
    },
    technique: {
      method: rule.treatment.method,
      needleRetention: rule.treatment.method === '泻法' ? 25 : 30
    },
    course: {
      frequency: rule.treatment.method === '泻法' ? '每日1次' : '隔日1次',
      duration: rule.treatment.method === '泻法' ? '10日为一疗程' : '20日为一疗程'
    }
  };
}

// ==================== 完整辨证流程 ====================

/**
 * 完整辨证分析
 */
export function diagnose(features: TongueFeatures): DiagnosisResult {
  // 1. 计算评分
  const scoring = calculateScoring(features);
  
  // 2. 判断优先级
  const priority = determinePriority(scoring);
  
  // 3. 匹配证型
  const matchedRules = matchCompositeSyndrome(features, scoring);
  const primaryRule = matchedRules[0];
  
  // 4. 冲突检测
  const coldHeatConflict = resolveColdHeatConflict(features, scoring);
  const deficiencyExcessConflict = resolveDeficiencyExcessConflict(features, scoring);
  
  // 5. 生成证型结果
  const primarySyndrome = primaryRule?.ruleName || 
    (coldHeatConflict?.finalDecision) || 
    (deficiencyExcessConflict?.finalDecision) || 
    '待辨证';
  
  const syndromeScore = primaryRule?.matchScore || 0;
  const pathogenesis = primaryRule?.pathogenesis || 
    (coldHeatConflict?.resolution) || 
    (deficiencyExcessConflict?.resolution) || 
    '需要进一步辨证分析';
  
  // 6. 生成处方
  const prescription = generatePrescription(primarySyndrome, primaryRule);
  
  return {
    features,
    scoring,
    syndrome: {
      priority,
      primarySyndrome,
      syndromeScore,
      matchedRules,
      pathogenesis,
      treatment: prescription.treatment,
      conflictResolution: coldHeatConflict || deficiencyExcessConflict
    },
    prescription,
    timestamp: new Date().toISOString()
  };
}

// ==================== 工具函数 ====================

/**
 * 将辨证结果转换为可读文本
 */
export function formatDiagnosisResult(result: DiagnosisResult): string {
  const lines: string[] = [];
  
  lines.push('【舌诊辨证结果】');
  lines.push('');
  lines.push('一、舌象特征');
  lines.push(`  舌质：${result.features.tongueBody.color} + ${result.features.tongueBody.shape} + ${result.features.tongueBody.body}`);
  lines.push(`  舌苔：${result.features.coating.color} + ${result.features.coating.texture} + ${result.features.coating.distribution}`);
  lines.push(`  舌态：${result.features.movement.type}（${result.features.movement.degree}）`);
  lines.push('');
  
  lines.push('二、三维评分');
  lines.push(`  舌质得分：${result.scoring.tongueBody.score}/${result.scoring.tongueBody.maxScore}分`);
  lines.push(`  舌苔得分：${result.scoring.coating.score}/${result.scoring.coating.maxScore}分`);
  lines.push(`  舌态得分：${result.scoring.movement.score}/${result.scoring.movement.maxScore}分`);
  lines.push(`  总分：${result.scoring.total.score}/${result.scoring.total.maxScore}分（${(result.scoring.total.percentage * 100).toFixed(1)}%）`);
  lines.push('');
  
  lines.push('三、辨证结果');
  lines.push(`  优先级：${result.syndrome.priority}`);
  lines.push(`  主要证型：${result.syndrome.primarySyndrome}`);
  lines.push(`  匹配得分：${result.syndrome.syndromeScore}分`);
  lines.push(`  病机分析：${result.syndrome.pathogenesis}`);
  lines.push('');
  
  lines.push('四、针灸处方');
  lines.push(`  治则：${result.prescription.treatment.principle}`);
  lines.push(`  治法：${result.prescription.treatment.method}`);
  lines.push(`  主穴：${result.prescription.acupoints.mainPoints.map(p => p.name).join('、')}`);
  lines.push(`  配穴：${result.prescription.acupoints.secondaryPoints.map(p => p.name).join('、')}`);
  lines.push(`  留针：${result.prescription.technique.needleRetention}分钟`);
  lines.push(`  疗程：${result.prescription.course.frequency}，${result.prescription.course.duration}`);
  
  if (result.syndrome.conflictResolution) {
    lines.push('');
    lines.push('五、冲突处理');
    lines.push(`  冲突类型：${result.syndrome.conflictResolution.conflictType}`);
    lines.push(`  处理方案：${result.syndrome.conflictResolution.resolution}`);
    lines.push(`  最终判定：${result.syndrome.conflictResolution.finalDecision}`);
  }
  
  return lines.join('\n');
}

// ==================== 示例数据 ====================

/**
 * 脾虚湿盛证示例
 */
export const EXAMPLE_SPLEEN_DAMP: TongueFeatures = {
  tongueBody: {
    color: '淡白舌',
    shape: '胖大舌',
    body: '齿痕'
  },
  coating: {
    color: '白苔',
    texture: '腻苔',
    distribution: '全苔'
  },
  movement: {
    type: '正常',
    degree: '无'
  }
};

/**
 * 肝郁化火证示例
 */
export const EXAMPLE_LIVER_FIRE: TongueFeatures = {
  tongueBody: {
    color: '舌边红',
    shape: '点刺舌',
    body: '少津'
  },
  coating: {
    color: '黄苔',
    texture: '腻苔',
    distribution: '中苔'
  },
  movement: {
    type: '颤动舌',
    degree: '轻微'
  }
};

/**
 * 阴虚火旺证示例
 */
export const EXAMPLE_YIN_DEFICIENCY: TongueFeatures = {
  tongueBody: {
    color: '舌红少津',
    shape: '裂纹舌',
    body: '少津'
  },
  coating: {
    color: '薄白苔',
    texture: '薄苔',
    distribution: '偏苔'
  },
  movement: {
    type: '颤动舌',
    degree: '轻微'
  }
};

// 默认导出
export default {
  diagnose,
  calculateScoring,
  determinePriority,
  matchCompositeSyndrome,
  generatePrescription,
  formatDiagnosisResult,
  // 类型
  TongueFeatures,
  ScoringResult,
  SyndromeDiagnosis,
  AcupuncturePrescription,
  DiagnosisResult
};
