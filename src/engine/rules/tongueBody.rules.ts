/**
 * 舌质舌苔辨证规则
 * Layer 1 专用
 */

/**
 * 舌质辨证规则
 */
export const tongueBodyRules = [
  {
    id: 'body-001',
    tongueColor: '淡红',
    pattern: '正常/平和',
    description: '气血调和，阴阳平衡',
    confidence: 0.9,
  },
  {
    id: 'body-002',
    tongueColor: '淡白',
    pattern: '气血两虚/阳虚',
    description: '阳气不足，血失温煦',
    confidence: 0.75,
  },
  {
    id: 'body-003',
    tongueColor: '红',
    pattern: '热证',
    description: '里热炽盛，熏蒸于舌',
    confidence: 0.7,
  },
  {
    id: 'body-004',
    tongueColor: '绛',
    pattern: '热入营血证',
    description: '热入营血，阴虚火旺',
    confidence: 0.8,
  },
  {
    id: 'body-005',
    tongueColor: '紫',
    pattern: '血瘀证',
    description: '气血运行不畅',
    confidence: 0.75,
  },
  {
    id: 'body-006',
    tongueColor: '青紫',
    pattern: '血瘀证（重）',
    description: '气血瘀滞严重',
    confidence: 0.8,
  },
  {
    id: 'body-007',
    tongueColor: '淡紫',
    pattern: '气滞血瘀',
    description: '气机郁滞，血行不畅',
    confidence: 0.7,
  },
  {
    id: 'body-008',
    tongueColor: '暗红',
    pattern: '瘀血/阴虚',
    description: '血行不畅或阴虚内热',
    confidence: 0.7,
  },
];

/**
 * 舌苔辨证规则
 */
export const coatingRules = [
  {
    id: 'coating-001',
    coatingColor: '薄白',
    pattern: '胃气充和',
    description: '胃气充和，苔薄白为正常',
    confidence: 0.9,
  },
  {
    id: 'coating-002',
    coatingColor: '白厚',
    pattern: '寒湿/痰湿',
    description: '寒湿内蕴或痰湿困脾',
    confidence: 0.75,
  },
  {
    id: 'coating-003',
    coatingColor: '黄',
    pattern: '热证',
    description: '热邪内蕴',
    confidence: 0.7,
  },
  {
    id: 'coating-004',
    coatingColor: '灰黑',
    pattern: '阴寒/热极',
    description: '阴寒内盛或热极伤阴',
    confidence: 0.8,
  },
  {
    id: 'coating-005',
    coatingColor: '剥落',
    pattern: '胃阴亏虚',
    description: '胃阴耗伤',
    confidence: 0.75,
  },
  {
    id: 'coating-006',
    coatingColor: '少苔',
    pattern: '胃阴不足',
    description: '胃阴亏虚',
    confidence: 0.7,
  },
  {
    id: 'coating-007',
    coatingColor: '无苔',
    pattern: '胃阴大虚',
    description: '胃阴严重亏虚',
    confidence: 0.8,
  },
];

/**
 * 苔质辨证规则
 */
export const coatingTextureRules = [
  {
    id: 'texture-001',
    coatingTexture: '薄',
    pattern: '胃气未伤',
    description: '胃气充和',
    confidence: 0.9,
  },
  {
    id: 'texture-002',
    coatingTexture: '厚',
    pattern: '邪气盛实',
    description: '邪气内盛',
    confidence: 0.75,
  },
  {
    id: 'texture-003',
    coatingTexture: '腻',
    pattern: '湿浊内蕴',
    description: '湿浊内蕴',
    confidence: 0.8,
  },
  {
    id: 'texture-004',
    coatingTexture: '腐',
    pattern: '食积/痰浊',
    description: '食积或痰浊',
    confidence: 0.75,
  },
  {
    id: 'texture-005',
    coatingTexture: '润',
    pattern: '津液未伤',
    description: '津液未伤',
    confidence: 0.85,
  },
  {
    id: 'texture-006',
    coatingTexture: '燥',
    pattern: '津液耗伤',
    description: '津液耗伤',
    confidence: 0.8,
  },
];

/**
 * 舌质舌苔组合规则
 */
export const bodyCoatingRules = [
  {
    id: 'combo-001',
    tongueColor: '淡白',
    coatingColor: '薄白',
    pattern: '气血两虚',
    description: '气血不足',
    confidence: 0.75,
  },
  {
    id: 'combo-002',
    tongueColor: '红',
    coatingColor: '黄',
    pattern: '实热证',
    description: '里热炽盛',
    confidence: 0.8,
  },
  {
    id: 'combo-003',
    tongueColor: '红',
    coatingColor: '少苔/剥落',
    pattern: '阴虚火旺',
    description: '阴虚内热',
    confidence: 0.8,
  },
  {
    id: 'combo-004',
    tongueColor: '淡白',
    coatingColor: '白厚',
    pattern: '阳虚湿盛',
    description: '阳虚水湿内停',
    confidence: 0.8,
  },
  {
    id: 'combo-005',
    tongueColor: '紫',
    coatingColor: '薄白',
    pattern: '气滞血瘀',
    description: '气机郁滞，血行不畅',
    confidence: 0.75,
  },
];
