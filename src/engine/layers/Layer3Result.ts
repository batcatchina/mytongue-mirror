/**
 * Layer3 分区凹凸层结果类型 v2.0
 * 职责：分区凹凸 → 精确定位（"神"之层）
 * 
 * 三焦三等分 + 左右对称
 * - 凹陷=亏
 * - 凸起=堵
 * - 半透明=气血亏虚严重
 */

import type { ZoneFeature, ZonePosition, UndulationType } from '@/types/tongue';
import type { InferenceConclusion, OrganPattern } from '@/types/inference';

/**
 * 分区辨证结论
 */
export interface ZoneDiagnosis {
  /** 区域位置 */
  zone: ZonePosition;
  /** 左右位置 */
  side?: 'left' | 'right' | 'center';
  /** 凹凸类型 */
  undulation: UndulationType;
  /** 凹凸程度 */
  undulationDegree?: '轻微' | '中等' | '明显' | '严重';
  /** 颜色分析 */
  colorAnalysis?: {
    color: string;
    intensity: '偏淡' | '正常' | '偏深';
  };
  /** 对应脏腑 */
  organs: string[];
  /** 辨证结论 */
  diagnosis: InferenceConclusion;
  /** 特殊特征 */
  specialFeatures?: string[];
}

/**
 * Layer3 综合辨证结论
 */
export interface Layer3Synthesis {
  /** 主要问题（标签） */
  primaryIssue: string;
  /** 主要问题描述 */
  primaryDescription: string;
  /** 所有分区辨证 */
  zoneDiagnoses: ZoneDiagnosis[];
  /** 脏腑定位列表 */
  organPatterns: OrganPattern[];
  /** 是否半透明 */
  isSemitransparent: boolean;
  /** 半透明区域 */
  semitransparentZones?: ZonePosition[];
  /** 三焦辨证汇总 */
  sanjiaoSummary?: {
    upperJiao: string;    // 上焦问题
    middleJiao: string;   // 中焦问题
    lowerJiao: string;    // 下焦问题
  };
}

/**
 * Layer3 完整结果类型
 */
export interface Layer3Result {
  /** 舌质分析结论 */
  tongueBodyConclusion: InferenceConclusion;
  /** 分区辨证结论 */
  zoneDiagnosis: ZoneDiagnosis[];
  /** 综合辨证结论 */
  synthesis: Layer3Synthesis;
  /** 脏腑辨证详情 */
  organPatterns: OrganPattern[];
  /** 综合置信度 */
  overallConfidence: number;
  /** 推理链 */
  reasoningChain: string[];
  /** 验证问题 */
  validationQuestions: string[];
}

/**
 * 创建分区辨证结论
 */
export function createZoneDiagnosis(
  zone: ZoneFeature,
  organs: string[],
  diagnosis: InferenceConclusion
): ZoneDiagnosis {
  return {
    zone: zone.position,
    side: zone.side,
    undulation: zone.undulation || 'flat',
    undulationDegree: zone.undulationDegree,
    colorAnalysis: zone.color ? {
      color: zone.color,
      intensity: zone.colorIntensity || '正常',
    } : undefined,
    organs,
    diagnosis,
    specialFeatures: zone.specialFeatures,
  };
}

/**
 * 凹凸辨证含义映射
 */
export const UNDULATION_MEANING: Record<UndulationType, {
  meaning: string;
  treatment: string;
  nature: '虚证' | '实证' | '虚实夹杂';
}> = {
  depression: {
    meaning: '亏（气血不足）',
    treatment: '补益',
    nature: '虚证',
  },
  bulge: {
    meaning: '堵（气血淤堵）',
    treatment: '疏通',
    nature: '实证',
  },
  flat: {
    meaning: '正常',
    treatment: '无需特别处理',
    nature: '虚实夹杂',
  },
  semitransparent: {
    meaning: '气血亏虚严重',
    treatment: '调补并重',
    nature: '虚证',
  },
};

/**
 * 三焦分区名称
 */
export const ZONE_NAMES: Record<ZonePosition, string> = {
  upperThird: '舌尖/上焦',
  middleThird: '舌中/中焦',
  lowerThird: '舌根/下焦',
};

/**
 * 获取凹凸辨证的详细描述
 */
export function getUndulationDescription(
  undulation: UndulationType,
  zone: ZonePosition,
  organs: string[]
): string {
  const meaning = UNDULATION_MEANING[undulation];
  const zoneName = ZONE_NAMES[zone];
  
  if (undulation === 'depression') {
    return `${zoneName}凹陷，${organs.join('、')}${meaning.meaning}，宜${meaning.treatment}`;
  }
  if (undulation === 'bulge') {
    return `${zoneName}凸起，${organs.join('、')}${meaning.meaning}，宜${meaning.treatment}`;
  }
  if (undulation === 'semitransparent') {
    return `${zoneName}半透明，${meaning.meaning}，宜${meaning.treatment}`;
  }
  return `${zoneName}形态正常`;
}
