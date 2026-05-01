/**
 * 分区辨证规则
 * Layer 3 专用
 * 
 * 三焦三等分 + 左右对称
 * - 凹陷=亏
 * - 凸起=堵
 * - 半透明=气血亏虚严重
 */

/**
 * 分区位置枚举
 */
export type ZonePosition = 'upperThird' | 'middleThird' | 'lowerThird';

/**
 * 凹凸形态枚举
 */
export type UndulationType = 'depression' | 'bulge' | 'flat' | 'semitransparent';

/**
 * 分区脏腑映射
 */
export const ZONE_ORGAN_MAP: Record<ZonePosition, {
  left: string[];
  right: string[];
  center: string[];
  description: string;
}> = {
  upperThird: {
    left: ['肺', '乳腺'],
    right: ['胸膈', '肩臂'],
    center: ['心', '小肠'],
    description: '上焦：心肺区',
  },
  middleThird: {
    left: ['肝'],
    right: ['胆'],
    center: ['脾', '胃'],
    description: '中焦：肝胆脾胃区',
  },
  lowerThird: {
    left: ['生殖区'],
    right: ['腿'],
    center: ['肾', '膀胱', '大肠'],
    description: '下焦：肾膀胱区',
  },
};

/**
 * 凹陷辨证规则
 */
export const depressionRules = [
  {
    id: 'depression-001',
    zone: 'upperThird',
    organ: '心',
    pattern: '心气血不足',
    essence: '亏（气血不足）',
    mechanism: '心气血虚，心失所养',
    symptoms: ['心慌', '失眠', '头晕'],
    treatment: '补益心气心血',
    confidence: 0.75,
  },
  {
    id: 'depression-002',
    zone: 'middleThird',
    organ: '脾',
    pattern: '脾胃虚弱',
    essence: '亏（气血不足）',
    mechanism: '脾气虚/胃阴虚',
    symptoms: ['食欲不振', '腹胀', '便溏'],
    treatment: '健脾益气/养胃阴',
    confidence: 0.75,
  },
  {
    id: 'depression-003',
    zone: 'lowerThird',
    organ: '肾',
    pattern: '肾精亏虚',
    essence: '亏（精气不足）',
    mechanism: '肾阴虚/肾阳虚',
    symptoms: ['腰酸', '耳鸣', '夜尿频'],
    treatment: '补肾填精',
    confidence: 0.8,
  },
  {
    id: 'depression-004',
    zone: 'middleThird',
    side: 'left',
    organ: '肝',
    pattern: '肝血不足',
    essence: '亏（血虚）',
    mechanism: '肝血虚，肝体失养',
    symptoms: ['胁胀', '视力减退', '眩晕'],
    treatment: '养血柔肝',
    confidence: 0.75,
  },
  {
    id: 'depression-005',
    zone: 'middleThird',
    side: 'right',
    organ: '胆',
    pattern: '胆气不足',
    essence: '亏（气虚）',
    mechanism: '胆气虚，疏泄失常',
    symptoms: ['胆怯', '易惊', '口苦'],
    treatment: '温胆益气',
    confidence: 0.7,
  },
];

/**
 * 凸起辨证规则
 */
export const bulgeRules = [
  {
    id: 'bulge-001',
    zone: 'upperThird',
    organ: '心',
    pattern: '心肺郁热',
    essence: '堵（热邪郁结）',
    mechanism: '热邪上扰',
    symptoms: ['口疮', '咽痛', '心烦'],
    treatment: '清热泻火',
    confidence: 0.75,
  },
  {
    id: 'bulge-002',
    zone: 'middleThird',
    organ: '脾',
    pattern: '脾胃湿热/肝胆郁结',
    essence: '堵（湿热/气郁）',
    mechanism: '湿热蕴结或气机郁滞',
    symptoms: ['胃胀', '嗳气', '胁胀'],
    treatment: '清热化湿/疏肝理气',
    confidence: 0.75,
  },
  {
    id: 'bulge-003',
    zone: 'lowerThird',
    organ: '肾',
    pattern: '下焦湿热/瘀血',
    essence: '堵（湿热/瘀阻）',
    mechanism: '湿热下注或瘀血阻滞',
    symptoms: ['小便黄', '腰酸', '下肢沉重'],
    treatment: '清热利湿/活血化瘀',
    confidence: 0.75,
  },
  {
    id: 'bulge-004',
    zone: 'middleThird',
    side: 'left',
    organ: '肝',
    pattern: '肝郁化火',
    essence: '堵（气郁化火）',
    mechanism: '肝气郁结化火',
    symptoms: ['烦躁', '口苦', '胁痛'],
    treatment: '清肝泻火',
    confidence: 0.8,
  },
  {
    id: 'bulge-005',
    zone: 'middleThird',
    side: 'right',
    organ: '胆',
    pattern: '胆经郁结',
    essence: '堵（气郁）',
    mechanism: '胆经气机郁结',
    symptoms: ['胁胀', '口苦', '消化不良'],
    treatment: '疏肝利胆',
    confidence: 0.75,
  },
];

/**
 * 半透明辨证规则
 */
export const semitransparentRules = [
  {
    id: 'semi-001',
    zone: 'all',
    scope: '全舌',
    pattern: '三焦气血亏虚',
    essence: '气血亏虚严重',
    mechanism: '脏腑功能整体下降',
    symptoms: ['体虚', '抵抗力差', '三高倾向'],
    treatment: '调补并重',
    confidence: 0.85,
  },
  {
    id: 'semi-002',
    zone: 'upperThird',
    scope: '舌尖',
    pattern: '心肺气血大虚',
    essence: '气血严重亏虚',
    mechanism: '心肺气血不足',
    symptoms: ['心悸', '气短', '易感冒'],
    treatment: '补益心肺气血',
    confidence: 0.8,
  },
  {
    id: 'semi-003',
    zone: 'middleThird',
    scope: '舌中',
    pattern: '脾胃气血大虚',
    essence: '气血严重亏虚',
    mechanism: '脾胃运化失常',
    symptoms: ['食欲不振', '消瘦', '便溏'],
    treatment: '健脾养胃',
    confidence: 0.8,
  },
  {
    id: 'semi-004',
    zone: 'lowerThird',
    scope: '舌根',
    pattern: '肾精严重亏虚',
    essence: '精气大虚',
    mechanism: '肾精耗伤',
    symptoms: ['腰酸膝软', '记忆力减退', '性功能下降'],
    treatment: '补肾填精',
    confidence: 0.85,
  },
];

/**
 * 左右对称辨证规则
 */
export const symmetryRules = [
  {
    id: 'sym-001',
    leftDeeper: true,
    zone: 'middleThird',
    pattern: '肝火/肝郁更重',
    mechanism: '左侧肝经气血更郁滞',
    confidence: 0.7,
  },
  {
    id: 'sym-002',
    rightDeeper: true,
    zone: 'middleThird',
    pattern: '胆热/胆郁更重',
    mechanism: '右侧胆经气血更郁滞',
    confidence: 0.7,
  },
  {
    id: 'sym-003',
    leftDeeper: true,
    zone: 'upperThird',
    pattern: '左乳/左肩气血不畅',
    mechanism: '左侧上焦气血郁滞',
    confidence: 0.65,
  },
  {
    id: 'sym-004',
    rightDeeper: true,
    zone: 'upperThird',
    pattern: '右肩/右手气血不畅',
    mechanism: '右侧上焦气血郁滞',
    confidence: 0.65,
  },
];

/**
 * 分区综合辨证规则
 */
export const zoneSynthesisRules = [
  {
    id: 'synth-001',
    features: ['upperThird-depression', 'lowerThird-depression'],
    pattern: '心肾不交',
    mechanism: '上焦心虚+下焦肾虚，水火不济',
    treatment: '交通心肾',
    confidence: 0.8,
  },
  {
    id: 'synth-002',
    features: ['middleThird-depression', 'lowerThird-depression'],
    pattern: '脾肾两虚',
    mechanism: '中焦脾虚+下焦肾虚',
    treatment: '健脾补肾',
    confidence: 0.85,
  },
  {
    id: 'synth-003',
    features: ['upperThird-bulge', 'middleThird-bulge'],
    pattern: '上焦郁热，中焦湿阻',
    mechanism: '热郁上焦，湿阻中焦',
    treatment: '清热化湿',
    confidence: 0.75,
  },
  {
    id: 'synth-004',
    features: ['middleThird-depression-left', 'middleThird-bulge-right'],
    pattern: '肝郁脾虚',
    mechanism: '左侧肝郁+右侧脾虚',
    treatment: '疏肝健脾',
    confidence: 0.8,
  },
];
