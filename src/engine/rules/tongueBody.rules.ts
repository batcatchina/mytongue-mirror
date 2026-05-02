/**
 * 舌质舌苔辨证规则 v2.0
 * Layer 1 专用规则配置
 * 包含舌质、舌苔及其组合规则
 */

import type { TongueColorValue, CoatingColorValue, CoatingTextureValue } from '@/types/tongue';

/**
 * 舌质辨证规则
 * 舌质=脏腑气血底子
 */
export interface TongueBodyRule {
  id: string;
  tongueColor: TongueColorValue | TongueColorValue[];
  pattern: string;
  description: string;
  mechanism: string;
  confidence: number;
  evidence: string[];
}

export const tongueBodyRules: TongueBodyRule[] = [
  {
    id: 'L1-R01',
    tongueColor: '淡红',
    pattern: '气血调和',
    description: '舌质淡红为正常舌象',
    mechanism: '气血调和，阴阳平衡',
    confidence: 0.9,
    evidence: ['舌色淡红为健康标志'],
  },
  {
    id: 'L1-R02',
    tongueColor: '淡白',
    pattern: '气血不足/阳虚',
    description: '舌质淡白主气血两虚或阳虚',
    mechanism: '血失温煦，气血亏虚',
    confidence: 0.75,
    evidence: ['舌色淡白=血色不足'],
  },
  {
    id: 'L1-R03',
    tongueColor: '红',
    pattern: '热证/阴虚',
    description: '舌质红主热证',
    mechanism: '热迫血行/阴虚火旺',
    confidence: 0.7,
    evidence: ['舌色红=热邪内蕴'],
  },
  {
    id: 'L1-R04',
    tongueColor: '绛',
    pattern: '热入营血',
    description: '舌质绛主热入营血',
    mechanism: '热入营血，阴虚火旺',
    confidence: 0.8,
    evidence: ['舌色绛=热入营血'],
  },
  {
    id: 'L1-R05',
    tongueColor: ['紫', '青紫', '淡紫'],
    pattern: '血瘀',
    description: '舌质紫主血瘀证',
    mechanism: '气滞血瘀/寒凝血瘀',
    confidence: 0.75,
    evidence: ['舌色紫=气血运行不畅'],
  },
  {
    id: 'L1-R06',
    tongueColor: '暗红',
    pattern: '瘀血/阴虚',
    description: '舌质暗红主瘀血或阴虚',
    mechanism: '血行不畅/阴虚内热',
    confidence: 0.7,
    evidence: ['舌色暗红=血行不畅'],
  },
];

/**
 * 舌苔辨证规则
 * 舌苔=脾胃运化状态
 */
export interface CoatingRule {
  id: string;
  coatingColor?: CoatingColorValue | CoatingColorValue[];
  coatingTexture?: CoatingTextureValue | CoatingTextureValue[];
  pattern: string;
  description: string;
  mechanism: string;
  confidence: number;
  evidence: string[];
}

export const coatingRules: CoatingRule[] = [
  {
    id: 'L1-R10',
    coatingColor: '薄白',
    pattern: '正常/胃气充和',
    description: '苔薄白为正常',
    mechanism: '胃气充和，正气充足',
    confidence: 0.9,
    evidence: ['苔薄白为常'],
  },
  {
    id: 'L1-R11',
    coatingColor: '白厚',
    pattern: '寒湿/表证',
    description: '苔白厚主寒湿内蕴或表证',
    mechanism: '寒邪/痰湿内蕴',
    confidence: 0.75,
    evidence: ['苔白=寒邪/未化热'],
  },
  {
    id: 'L1-R12',
    coatingColor: '黄',
    pattern: '热证',
    description: '苔黄主热证',
    mechanism: '热邪已聚',
    confidence: 0.7,
    evidence: ['苔黄=热邪已聚'],
  },
  {
    id: 'L1-R13',
    coatingColor: '灰黑',
    pattern: '阴寒/热极',
    description: '苔灰黑主阴寒或热极',
    mechanism: '阴寒内盛或热极伤阴',
    confidence: 0.8,
    evidence: ['苔灰黑为危重'],
  },
  {
    id: 'L1-R14',
    coatingColor: ['剥落', '少苔'],
    pattern: '阴虚/胃阴亏',
    description: '苔剥落主阴虚或胃阴亏',
    mechanism: '胃气受损/阴液耗伤',
    confidence: 0.75,
    evidence: ['苔剥=胃气受损'],
  },
  {
    id: 'L1-R15',
    coatingColor: '无苔',
    pattern: '阴虚/胃气大伤',
    description: '无苔主阴虚或胃气枯竭',
    mechanism: '胃气枯竭/镜面舌',
    confidence: 0.8,
    evidence: ['无苔=胃气枯竭'],
  },
];

/**
 * 苔质辨证规则
 */
export const coatingTextureRules: CoatingRule[] = [
  {
    id: 'L1-R20',
    coatingTexture: '薄',
    pattern: '正常/表证',
    description: '苔薄为正常或表证',
    mechanism: '苔薄为常，薄白为正常',
    confidence: 0.8,
    evidence: ['苔薄=邪气轻浅'],
  },
  {
    id: 'L1-R21',
    coatingTexture: '厚',
    pattern: '邪气盛',
    description: '苔厚主邪气内蕴',
    mechanism: '邪气内蕴',
    confidence: 0.7,
    evidence: ['苔厚=邪气内蕴'],
  },
  {
    id: 'L1-R22',
    coatingTexture: '腻',
    pattern: '湿浊',
    description: '苔腻主湿浊内蕴',
    mechanism: '湿浊内蕴',
    confidence: 0.8,
    evidence: ['苔腻=湿浊内蕴'],
  },
  {
    id: 'L1-R23',
    coatingTexture: '燥',
    pattern: '津液耗伤',
    description: '苔燥主津液耗伤',
    mechanism: '津液耗伤',
    confidence: 0.75,
    evidence: ['苔燥=津液不足'],
  },
  {
    id: 'L1-R24',
    coatingTexture: '腐',
    pattern: '食积/痰浊',
    description: '苔腐主食积或痰浊',
    mechanism: '食积腐烂/痰浊上泛',
    confidence: 0.7,
    evidence: ['苔腐=食积痰浊'],
  },
  {
    id: 'L1-R25',
    coatingTexture: '滑',
    pattern: '寒湿/痰饮',
    description: '苔滑主寒湿或痰饮',
    mechanism: '寒湿内盛/痰饮内停',
    confidence: 0.75,
    evidence: ['苔滑=寒湿痰饮'],
  },
];

/**
 * 舌质+舌苔组合规则
 * 组合推理规则表
 */
export interface CompoundRule {
  id: string;
  tongueColor: TongueColorValue | TongueColorValue[];
  coatingColor: CoatingColorValue | CoatingColorValue[];
  pattern: string;
  description: string;
  mechanism: string;
  confidence: number;
  evidence: string[];
}

export const compoundRules: CompoundRule[] = [
  {
    id: 'L1-R30',
    tongueColor: ['淡白', '淡红'],
    coatingColor: '薄白',
    pattern: '气血两虚（轻）',
    description: '舌淡苔薄提示气血偏虚',
    mechanism: '气血不足，胃气尚可',
    confidence: 0.65,
    evidence: ['舌淡=气血不足', '苔薄=胃气尚可'],
  },
  {
    id: 'L1-R31',
    tongueColor: '淡白',
    coatingColor: '白厚',
    pattern: '气血不足+湿盛',
    description: '舌淡苔白厚提示气血两虚兼湿盛',
    mechanism: '气血亏虚为本，湿浊内蕴为标',
    confidence: 0.75,
    evidence: ['舌淡=气血亏虚', '苔白厚=湿浊内蕴'],
  },
  {
    id: 'L1-R31b',
    tongueColor: '淡白',
    coatingColor: '黄',
    pattern: '虚热/气血虚生热',
    description: '舌淡苔黄提示虚热或气血虚生热',
    mechanism: '气血不足，虚热内生',
    confidence: 0.6,
    evidence: ['舌淡=气血虚', '苔黄=有热'],
  },
  {
    id: 'L1-R32',
    tongueColor: '红',
    coatingColor: '黄',
    pattern: '实热',
    description: '舌红苔黄为实热证',
    mechanism: '里热炽盛',
    confidence: 0.8,
    evidence: ['舌质红=热邪', '苔黄=热已化'],
  },
  {
    id: 'L1-R33',
    tongueColor: '红',
    coatingColor: ['剥落', '少苔', '无苔'],
    pattern: '阴虚火旺',
    description: '舌红少苔为阴虚火旺',
    mechanism: '阴虚→虚火灼津→舌红少苔',
    confidence: 0.8,
    evidence: ['舌红=虚火', '无苔/少苔=阴虚'],
  },
  {
    id: 'L1-R34',
    tongueColor: '绛',
    coatingColor: ['黄', '灰黑'],
    pattern: '热入营血（重）',
    description: '舌绛苔黄或灰黑为热入营血重证',
    mechanism: '热入营血，阴虚火旺',
    confidence: 0.85,
    evidence: ['舌绛=热入营血', '苔色深=热重'],
  },
  {
    id: 'L1-R35',
    tongueColor: ['紫', '青紫'],
    coatingColor: ['薄白', '白厚'],
    pattern: '血瘀证',
    description: '舌紫苔白提示血瘀',
    mechanism: '气滞血瘀/寒凝血瘀',
    confidence: 0.75,
    evidence: ['舌紫=血行不畅', '苔白=寒/湿'],
  },
  {
    id: 'L1-R36',
    tongueColor: ['淡白', '淡红'],
    coatingColor: '黄',
    pattern: '虚热/气血虚生热',
    description: '舌淡苔黄提示虚热或气血虚生热',
    mechanism: '气血不足，虚热内生',
    confidence: 0.6,
    evidence: ['舌淡=气血虚', '苔黄=有热'],
  },
];

/**
 * 根据舌质获取匹配的规则
 */
export function matchTongueBodyRule(color: TongueColorValue): TongueBodyRule | undefined {
  return tongueBodyRules.find(rule => 
    Array.isArray(rule.tongueColor) 
      ? rule.tongueColor.includes(color)
      : rule.tongueColor === color
  );
}

/**
 * 根据舌苔获取匹配的规则
 */
export function matchCoatingRule(
  color?: CoatingColorValue,
  texture?: CoatingTextureValue
): CoatingRule | undefined {
  if (color) {
    const colorRule = coatingRules.find(rule =>
      Array.isArray(rule.coatingColor)
        ? rule.coatingColor.includes(color)
        : rule.coatingColor === color
    );
    if (colorRule) return colorRule;
  }
  
  if (texture) {
    const textureRule = coatingTextureRules.find(rule =>
      Array.isArray(rule.coatingTexture)
        ? rule.coatingTexture.includes(texture)
        : rule.coatingTexture === texture
    );
    return textureRule;
  }
  
  return undefined;
}

/**
 * 根据舌质+舌苔组合获取匹配的规则
 */
export function matchCompoundRule(
  tongueColor: TongueColorValue,
  coatingColor: CoatingColorValue
): CompoundRule | undefined {
  return compoundRules.find(rule => {
    const bodyMatch = Array.isArray(rule.tongueColor)
      ? rule.tongueColor.includes(tongueColor)
      : rule.tongueColor === tongueColor;
    const coatingMatch = Array.isArray(rule.coatingColor)
      ? rule.coatingColor.includes(coatingColor)
      : rule.coatingColor === coatingColor;
    return bodyMatch && coatingMatch;
  });
}

/**
 * Layer1 规则导出
 */
export const Layer1Rules = {
  tongueBodyRules,
  coatingRules,
  coatingTextureRules,
  compoundRules,
  matchTongueBodyRule,
  matchCoatingRule,
  matchCompoundRule,
};
