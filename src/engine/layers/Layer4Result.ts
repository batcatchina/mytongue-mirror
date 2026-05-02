/**
 * Layer4 综合推理层结果类型 v2.0
 * 职责：综合推理 → 传变关系+配穴方案
 * 
 * 子盗母气 / 相克传变 / 经脉辨证 / 配穴组合
 */

import type { OrganPattern, Prescription, TransmissionType } from '@/types/inference';

/**
 * 传变路径描述
 */
export interface TransmissionPath {
  /** 传变ID */
  id: string;
  /** 传变类型 */
  type: TransmissionType;
  /** 源脏腑 */
  sourceOrgan: string;
  /** 目标脏腑 */
  targetOrgan: string;
  /** 传变描述 */
  description: string;
  /** 传变机制 */
  mechanism: string;
  /** 置信度 */
  confidence: number;
  /** 是否为主要传变路径 */
  isPrimary: boolean;
}

/**
 * 根本原因分析
 */
export interface RootCauseAnalysis {
  /** 主要证型 */
  primarySyndrome: string;
  /** 根本原因 */
  rootCause: string;
  /** 根本原因描述 */
  rootCauseDescription: string;
  /** 病机分析 */
  pathogenesis: string;
  /** 置信度 */
  confidence: number;
}

/**
 * 调理建议
 */
export interface TreatmentAdvice {
  /** 调理原则 */
  principle: string;
  /** 调理顺序 */
  sequence: string[];
  /** 注意事项 */
  precautions: string[];
  /** 生活方式建议 */
  lifestyleAdvice?: string[];
}

/**
 * Layer4 完整结果类型
 */
export interface Layer4Result {
  /** 脏腑辨证详情 */
  organPatterns: OrganPattern[];
  /** 传变路径 */
  transmissionPaths: TransmissionPath[];
  /** 根本原因分析 */
  rootCauseAnalysis: RootCauseAnalysis;
  /** 配穴方案 */
  prescription: Prescription;
  /** 调理建议 */
  treatmentAdvice: TreatmentAdvice;
  /** 最终证型 */
  finalSyndrome: string;
  /** 证型描述 */
  syndromeDescription: string;
  /** 综合置信度 */
  overallConfidence: number;
  /** 推理链 */
  reasoningChain: string[];
  /** 验证问题 */
  validationQuestions: string[];
}

/**
 * 传变类型描述映射
 */
export const TRANSMISSION_TYPE_DESC: Record<TransmissionType, {
  meaning: string;
  example: string;
}> = {
  '子盗母气': {
    meaning: '子脏虚弱，耗伤母脏资源',
    example: '肝阴虚→肾阴虚（肝为肾之子）',
  },
  '母病及子': {
    meaning: '母脏病变，影响子脏功能',
    example: '脾虚→肺气不足（脾为肺之母）',
  },
  '相克传变': {
    meaning: '木→土→水→火→金→木循环相克',
    example: '肝郁→克脾→脾虚湿盛',
  },
  '相生传变': {
    meaning: '木→火→土→金→水→木循环相生',
    example: '脾虚→心气不足',
  },
  '表里传变': {
    meaning: '脏腑表里相传',
    example: '心火→小肠热',
  },
  '脏腑传变': {
    meaning: '脏腑直接传变',
    example: '肝郁→胆郁',
  },
};

/**
 * 创建传变路径描述
 */
export function createTransmissionPathDescription(
  type: TransmissionType,
  sourceOrgan: string,
  targetOrgan: string,
  mechanism: string
): string {
  return `${sourceOrgan}（${TRANSMISSION_TYPE_DESC[type].meaning}）→ ${targetOrgan}：${mechanism}`;
}

/**
 * 针法选择依据
 */
export const TECHNIQUE_GUIDE: Record<string, {
  description: string;
  applicablePatterns: string[];
}> = {
  '补法': {
    description: '顺经而刺，浅入久留，轻刺激',
    applicablePatterns: ['气虚', '血虚', '阴虚', '阳虚', '气血两虚', '脾虚', '肾虚'],
  },
  '泻法': {
    description: '逆经而刺，深入疾出，重刺激',
    applicablePatterns: ['气滞', '血瘀', '湿热', '实热', '肝郁', '痰湿', '食积'],
  },
  '平补平泻': {
    description: '平调气血，不补不泻',
    applicablePatterns: ['虚实夹杂', '阴虚火旺', '肝肾阴虚', '心肾不交'],
  },
};

/**
 * 主要配穴规则
 */
export const PRIMARY_ACUPOINT_RULES: Record<string, {
  meridian: string;
  mainPoints: string[];
  secondaryPoints: string[];
  specialPoints?: {
    yuanSource?: string;
    yuanSource2?: string;
    luoConnecting?: string;
    backShu?: string;
    frontMu?: string;
    yingSpring?: string;
    jingWell?: string;
    heSea?: string;
    xiCleft?: string;
    huiMeeting?: string;
  };
  basis: string[];
}> = {
  '气虚': {
    meridian: '足阳明胃经',
    mainPoints: ['足三里', '气海', '中脘'],
    secondaryPoints: ['脾俞', '胃俞', '关元'],
    specialPoints: {
      yuanSource: '太白',
      backShu: '脾俞',
    },
    basis: ['足三里为强壮要穴', '气海补气', '中脘和胃'],
  },
  '脾虚': {
    meridian: '足太阴脾经',
    mainPoints: ['足三里', '脾俞', '中脘'],
    secondaryPoints: ['阴陵泉', '三阴交', '胃俞'],
    specialPoints: {
      yuanSource: '太白',
      luoConnecting: '公孙',
      backShu: '脾俞',
      frontMu: '章门',
    },
    basis: ['足三里益气健脾', '脾俞健脾', '中脘和胃'],
  },
  '肝郁': {
    meridian: '足厥阴肝经',
    mainPoints: ['太冲', '肝俞', '期门'],
    secondaryPoints: ['膻中', '内关', '三阴交'],
    specialPoints: {
      yuanSource: '太冲',
      backShu: '肝俞',
      frontMu: '期门',
    },
    basis: ['太冲疏肝理气', '肝俞调肝', '期门疏肝解郁'],
  },
  '肝郁化火': {
    meridian: '足厥阴肝经',
    mainPoints: ['太冲', '行间', '肝俞'],
    secondaryPoints: ['期门', '合谷', '曲池'],
    specialPoints: {
      yuanSource: '太冲',
      yingSpring: '行间',
      backShu: '肝俞',
    },
    basis: ['行间清肝火', '太冲疏肝', '曲池清热'],
  },
  '阴虚': {
    meridian: '足少阴肾经',
    mainPoints: ['太溪', '三阴交', '照海'],
    secondaryPoints: ['肾俞', '心俞', '内关'],
    specialPoints: {
      yuanSource: '太溪',
      backShu: '肾俞',
    },
    basis: ['太溪为肾经原穴', '照海滋阴', '三阴交健脾滋阴'],
  },
  '阴虚火旺': {
    meridian: '足少阴肾经',
    mainPoints: ['太溪', '照海', '涌泉'],
    secondaryPoints: ['肾俞', '心俞', '神门'],
    specialPoints: {
      yuanSource: '太溪',
      jingWell: '涌泉',
      backShu: '肾俞',
    },
    basis: ['涌泉引火归元', '太溪滋阴降火', '照海滋阴清热'],
  },
  '湿盛': {
    meridian: '足太阴脾经',
    mainPoints: ['阴陵泉', '丰隆', '水分'],
    secondaryPoints: ['脾俞', '三阴交', '中脘'],
    specialPoints: {
      heSea: '阴陵泉',
      backShu: '脾俞',
    },
    basis: ['阴陵泉利湿', '丰隆化痰湿', '水分分利水湿'],
  },
  '湿热': {
    meridian: '足太阴脾经/手阳明大肠经',
    mainPoints: ['阴陵泉', '曲池', '内庭'],
    secondaryPoints: ['合谷', '足三里', '三阴交'],
    specialPoints: {
      heSea: '阴陵泉',
      yingSpring: '内庭',
    },
    basis: ['曲池清热', '内庭清胃热', '阴陵泉利湿'],
  },
  '血瘀': {
    meridian: '足太阴脾经',
    mainPoints: ['血海', '膈俞', '三阴交'],
    secondaryPoints: ['太冲', '肝俞', '合谷'],
    specialPoints: {
      xiCleft: '血海',
      huiMeeting: '膈俞',
    },
    basis: ['血海活血化瘀', '膈俞为血会', '三阴交活血'],
  },
  '心肾不交': {
    meridian: '足少阴肾经/手少阴心经',
    mainPoints: ['神门', '太溪', '照海'],
    secondaryPoints: ['心俞', '肾俞', '内关'],
    specialPoints: {
      yuanSource: '神门',
      yuanSource2: '太溪',
      backShu: '心俞',
    },
    basis: ['神门安神', '太溪补肾', '照海滋阴交通心肾'],
  },
};
