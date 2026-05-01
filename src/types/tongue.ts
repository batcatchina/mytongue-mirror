/**
 * 舌象类型定义 v2.0
 * 扩展支持分区特征：舌尖/舌中/舌根/舌边
 * 每区包含：颜色/形态/凹凸状态
 */

/**
 * 舌色枚举
 */
export type TongueColorValue = 
  | '淡红' 
  | '淡白' 
  | '红' 
  | '绛' 
  | '紫' 
  | '青紫' 
  | '淡紫' 
  | '暗红';

/**
 * 舌形枚举
 */
export type TongueShapeValue = 
  | '胖大' 
  | '瘦薄' 
  | '正常' 
  | '适中' 
  | '短缩' 
  | '松弛';

/**
 * 苔色枚举
 */
export type CoatingColorValue = 
  | '薄白' 
  | '白厚' 
  | '黄' 
  | '灰黑' 
  | '剥落' 
  | '少苔' 
  | '无苔';

/**
 * 苔质枚举
 */
export type CoatingTextureValue = 
  | '薄' 
  | '厚' 
  | '正常' 
  | '润' 
  | '燥' 
  | '腻' 
  | '腐' 
  | '滑';

/**
 * 舌态枚举
 */
export type TongueStateValue = 
  | '强硬' 
  | '痿软' 
  | '歪斜' 
  | '颤动' 
  | '正常' 
  | '短缩' 
  | '吐弄';

/**
 * 区域位置枚举（三焦分区）
 */
export type ZonePosition = 
  | 'upperThird'   // 舌尖/上焦：心肺区
  | 'middleThird'  // 舌中/中焦：肝胆脾胃区
  | 'lowerThird';  // 舌根/下焦：肾膀胱区

/**
 * 左右对称位置
 */
export type SidePosition = 'left' | 'right' | 'center';

/**
 * 凹凸形态
 */
export type UndulationType = 
  | 'depression'   // 凹陷：气血不足/亏
  | 'bulge'        // 凸起：气血淤堵/堵
  | 'flat'         // 平坦：正常
  | 'semitransparent'; // 半透明：气血亏虚严重

/**
 * 区域特征（单个分区）
 */
export interface ZoneFeature {
  /** 区域位置 */
  position: ZonePosition;
  /** 左右对称位置 */
  side?: SidePosition;
  /** 该区域舌色 */
  color?: TongueColorValue;
  /** 该区域舌色深浅程度（相对整体） */
  colorIntensity?: '偏淡' | '正常' | '偏深';
  /** 凹凸形态 */
  undulation?: UndulationType;
  /** 凹凸程度 */
  undulationDegree?: '轻微' | '中等' | '明显' | '严重';
  /** 该区域特殊特征 */
  specialFeatures?: string[];
  /** 该区域裂纹 */
  hasCrack?: boolean;
  /** 该区域齿痕 */
  hasTeethMark?: boolean;
  /** 该区域瘀斑/瘀点 */
  hasEcchymosis?: boolean;
  /** 备注 */
  note?: string;
}

/**
 * 完整舌象分析结果（来自AI识别）
 */
export interface TongueAnalysisResult {
  /** 舌体整体颜色 */
  bodyColor: TongueColorValue;
  /** 舌体整体颜色置信度 */
  bodyColorConfidence?: number;
  /** 舌形 */
  shape: TongueShapeValue;
  /** 舌形置信度 */
  shapeConfidence?: number;
  /** 苔色 */
  coatingColor: CoatingColorValue;
  /** 苔色置信度 */
  coatingColorConfidence?: number;
  /** 苔质 */
  coatingTexture: CoatingTextureValue;
  /** 苔质置信度 */
  coatingTextureConfidence?: number;
  /** 舌态 */
  state: TongueStateValue;
  /** 舌态置信度 */
  stateConfidence?: number;
  /** 是否有齿痕 */
  hasTeethMark: boolean;
  /** 齿痕程度 */
  teethMarkDegree?: '轻微' | '中等' | '明显' | '严重';
  /** 是否有裂纹 */
  hasCrack: boolean;
  /** 裂纹程度 */
  crackDegree?: '轻微' | '中等' | '明显' | '严重';
  /** 裂纹分布 */
  crackDistribution?: ZonePosition[];
  /** 是否有瘀斑瘀点 */
  hasEcchymosis: boolean;
  /** 分区特征（三焦三等分+左右对称） */
  zoneFeatures: ZoneFeature[];
  /** 是否半透明（气血亏虚严重） */
  isSemitransparent: boolean;
  /** 半透明区域 */
  semitransparentZones?: ZonePosition[];
  /** AI分析置信度 */
  overallConfidence?: number;
  /** 分析时间戳 */
  timestamp: string;
  /** 原始图片URL（可选） */
  imageUrl?: string;
}

/**
 * 分区到脏腑的映射
 */
export const ZONE_ORGAN_MAPPING: Record<ZonePosition, Record<SidePosition | 'center', string[]>> = {
  upperThird: {
    center: ['心', '小肠'],
    left: ['肺', '乳腺'],
    right: ['胸膈', '肩臂'],
  },
  middleThird: {
    center: ['脾', '胃'],
    left: ['肝'],
    right: ['胆'],
  },
  lowerThird: {
    center: ['肾', '膀胱', '大肠'],
    left: ['生殖区'],
    right: ['腿'],
  },
};

/**
 * 获取分区的脏腑对应
 */
export function getOrgansForZone(zone: ZoneFeature): string[] {
  const organs = ZONE_ORGAN_MAPPING[zone.position];
  if (!organs) return [];
  
  const side = zone.side || 'center';
  return organs[side] || organs.center || [];
}

/**
 * 判断舌象严重程度
 */
export function evaluateTongueSeverity(analysis: TongueAnalysisResult): 'normal' | 'mild' | 'moderate' | 'severe' {
  let score = 0;
  
  // 舌色异常
  if (['淡白', '绛', '紫', '青紫'].includes(analysis.bodyColor)) {
    score += 2;
  } else if (analysis.bodyColor === '红') {
    score += 1;
  }
  
  // 舌形异常
  if (['胖大', '瘦薄'].includes(analysis.shape)) {
    score += 2;
  }
  
  // 苔色异常
  if (['白厚', '灰黑', '剥落', '少苔', '无苔'].includes(analysis.coatingColor)) {
    score += 2;
  } else if (analysis.coatingColor === '黄') {
    score += 1;
  }
  
  // 苔质异常
  if (['厚', '腻', '腐', '燥'].includes(analysis.coatingTexture)) {
    score += 2;
  }
  
  // 齿痕
  if (analysis.hasTeethMark) {
    score += 1;
  }
  
  // 裂纹
  if (analysis.hasCrack) {
    score += 1;
  }
  
  // 半透明
  if (analysis.isSemitransparent) {
    score += 3;
  }
  
  // 分区凹凸异常
  for (const zone of analysis.zoneFeatures) {
    if (zone.undulation === 'depression') {
      score += 1;
    } else if (zone.undulation === 'bulge') {
      score += 1;
    }
  }
  
  if (score <= 2) return 'normal';
  if (score <= 4) return 'mild';
  if (score <= 6) return 'moderate';
  return 'severe';
}
