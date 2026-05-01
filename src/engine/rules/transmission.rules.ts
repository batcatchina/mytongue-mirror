/**
 * 传变辨证规则
 * Layer 4 专用
 * 
 * 五脏六腑之间的传变关系：
 * - 子盗母气
 * - 母病及子
 * - 相克传变
 * - 相生传变
 * - 脏腑传变
 */

/**
 * 传变类型枚举
 */
export type TransmissionType = 
  | '子盗母气'
  | '母病及子'
  | '相克传变'
  | '相生传变'
  | '脏腑传变';

/**
 * 子盗母气规则
 * 子脏虚弱，消耗母脏资源
 */
export const childConsumesParentRules = [
  {
    id: 'child-parent-001',
    type: '子盗母气' as TransmissionType,
    sourceOrgan: '肝',
    targetOrgan: '肾',
    triggerFeatures: ['舌边红', '舌根凹陷', '腰酸'],
    pattern: '肝郁化火，耗伤肾阴',
    mechanism: '肝木为肾水之子，肝火亢盛则耗伤肾阴，导致肾虚',
    treatment: '清肝火，滋肾阴',
    confidence: 0.7,
  },
  {
    id: 'child-parent-002',
    type: '子盗母气' as TransmissionType,
    sourceOrgan: '心',
    targetOrgan: '肝',
    triggerFeatures: ['舌尖红', '舌边红', '失眠'],
    pattern: '心火亢盛，引动肝火',
    mechanism: '心为肝木之子，心火旺则肝火随之亢盛',
    treatment: '清心火，泻肝火',
    confidence: 0.65,
  },
  {
    id: 'child-parent-003',
    type: '子盗母气' as TransmissionType,
    sourceOrgan: '脾',
    targetOrgan: '心',
    triggerFeatures: ['舌中凹陷', '舌尖淡'],
    pattern: '脾土不足，子耗母气',
    mechanism: '脾为心之子，脾虚则子耗母气',
    treatment: '健脾益气',
    confidence: 0.6,
  },
  {
    id: 'child-parent-004',
    type: '子盗母气' as TransmissionType,
    sourceOrgan: '肺',
    targetOrgan: '脾',
    triggerFeatures: ['肺区异常', '舌中凹陷'],
    pattern: '肺病及脾，子盗母气',
    mechanism: '肺为脾之子，肺虚则脾运失常',
    treatment: '补肺健脾',
    confidence: 0.6,
  },
];

/**
 * 母病及子规则
 * 母脏病变，影响子脏
 */
export const parentAffectsChildRules = [
  {
    id: 'parent-child-001',
    type: '母病及子' as TransmissionType,
    sourceOrgan: '肾',
    targetOrgan: '肝',
    triggerFeatures: ['舌根凹陷', '舌边淡'],
    pattern: '肾水不足，肝木失养',
    mechanism: '肾水为肝木之母，肾水不足则肝木失于滋养',
    treatment: '滋水涵木',
    confidence: 0.7,
  },
  {
    id: 'parent-child-002',
    type: '母病及子' as TransmissionType,
    sourceOrgan: '脾',
    targetOrgan: '肺',
    triggerFeatures: ['舌中凹陷', '肺区异常'],
    pattern: '脾土虚弱，肺金失养',
    mechanism: '脾土为肺金之母，脾虚则肺气不足',
    treatment: '健脾补肺',
    confidence: 0.7,
  },
  {
    id: 'parent-child-003',
    type: '母病及子' as TransmissionType,
    sourceOrgan: '肝',
    targetOrgan: '心',
    triggerFeatures: ['舌边红', '舌尖红'],
    pattern: '肝木生心火，肝旺助心火',
    mechanism: '肝木生心火，肝火亢盛则助心火',
    treatment: '清肝泻火',
    confidence: 0.65,
  },
  {
    id: 'parent-child-004',
    type: '母病及子' as TransmissionType,
    sourceOrgan: '心',
    targetOrgan: '小肠',
    triggerFeatures: ['心区异常', '舌前端异常'],
    pattern: '心热移于小肠',
    mechanism: '心火下移小肠',
    treatment: '清心火，利小便',
    confidence: 0.6,
  },
];

/**
 * 相克传变规则
 */
export const controlTransmissionRules = [
  {
    id: 'control-001',
    type: '相克传变' as TransmissionType,
    sourceOrgan: '肝',
    targetOrgan: '脾',
    triggerFeatures: ['舌边红凸', '舌中凹陷', '胁胀'],
    pattern: '肝木克脾土',
    mechanism: '肝气郁结，横逆犯脾，导致脾虚',
    treatment: '疏肝健脾',
    confidence: 0.75,
  },
  {
    id: 'control-002',
    type: '相克传变' as TransmissionType,
    sourceOrgan: '脾',
    targetOrgan: '肾',
    triggerFeatures: ['舌中苔腻', '舌根略凸'],
    pattern: '脾土克肾水',
    mechanism: '脾虚湿盛，湿邪下注，困阻肾气',
    treatment: '健脾利湿，补肾',
    confidence: 0.65,
  },
  {
    id: 'control-003',
    type: '相克传变' as TransmissionType,
    sourceOrgan: '心',
    targetOrgan: '肺',
    triggerFeatures: ['舌尖红', '苔黄', '咳嗽'],
    pattern: '心火刑金',
    mechanism: '心火亢盛，灼伤肺阴，导致肺热',
    treatment: '清心泻火，清肺热',
    confidence: 0.7,
  },
  {
    id: 'control-004',
    type: '相克传变' as TransmissionType,
    sourceOrgan: '肺',
    targetOrgan: '肝',
    triggerFeatures: ['肺区异常', '舌边红'],
    pattern: '金不制木',
    mechanism: '肺气不足，不能制肝',
    treatment: '补肺疏肝',
    confidence: 0.6,
  },
  {
    id: 'control-005',
    type: '相克传变' as TransmissionType,
    sourceOrgan: '肾',
    targetOrgan: '心',
    triggerFeatures: ['肾区异常', '舌尖红'],
    pattern: '水不制火',
    mechanism: '肾水不足，不能上济心火',
    treatment: '滋肾水，降心火',
    confidence: 0.7,
  },
];

/**
 * 相生传变规则
 */
export const generatingTransmissionRules = [
  {
    id: 'generating-001',
    type: '相生传变' as TransmissionType,
    sourceOrgan: '脾',
    targetOrgan: '心',
    triggerFeatures: ['舌中凹陷', '舌尖淡'],
    pattern: '脾土生心火，子盗母气',
    mechanism: '脾虚则气血生化不足，心失所养',
    treatment: '健脾养心',
    confidence: 0.7,
  },
  {
    id: 'generating-002',
    type: '相生传变' as TransmissionType,
    sourceOrgan: '肾',
    targetOrgan: '肝',
    triggerFeatures: ['舌根凹陷', '舌边淡'],
    pattern: '肾水生肝木',
    mechanism: '肾阴不足，水不涵木，肝阳上亢',
    treatment: '滋水涵木',
    confidence: 0.7,
  },
  {
    id: 'generating-003',
    type: '相生传变' as TransmissionType,
    sourceOrgan: '肝',
    targetOrgan: '心',
    triggerFeatures: ['肝区异常', '心区异常'],
    pattern: '木生火',
    mechanism: '肝血不足，不能养心',
    treatment: '养血柔肝，补心血',
    confidence: 0.65,
  },
  {
    id: 'generating-004',
    type: '相生传变' as TransmissionType,
    sourceOrgan: '肺',
    targetOrgan: '肾',
    triggerFeatures: ['肺区异常', '肾区异常'],
    pattern: '金生水',
    mechanism: '肺气不足，不能生肾气',
    treatment: '补肺益肾',
    confidence: 0.65,
  },
];

/**
 * 脏腑直接传变规则
 */
export const organDirectTransmissionRules = [
  {
    id: 'direct-001',
    type: '脏腑传变' as TransmissionType,
    sourceOrgan: '肝',
    targetOrgan: '胆',
    triggerFeatures: ['舌边红', '舌边略鼓'],
    pattern: '肝郁化火，胆郁',
    mechanism: '肝气郁结化火，胆腑疏泄失常',
    treatment: '疏肝利胆',
    confidence: 0.8,
  },
  {
    id: 'direct-002',
    type: '脏腑传变' as TransmissionType,
    sourceOrgan: '胃',
    targetOrgan: '脾',
    triggerFeatures: ['胃脘不适', '舌中苔厚'],
    pattern: '胃病及脾',
    mechanism: '胃气上逆，影响脾的运化功能',
    treatment: '和胃健脾',
    confidence: 0.7,
  },
  {
    id: 'direct-003',
    type: '脏腑传变' as TransmissionType,
    sourceOrgan: '大肠',
    targetOrgan: '肺',
    triggerFeatures: ['大肠区异常', '肺区异常'],
    pattern: '肠病及肺',
    mechanism: '大肠实热，上逆犯肺',
    treatment: '清大肠热，降肺气',
    confidence: 0.65,
  },
  {
    id: 'direct-004',
    type: '脏腑传变' as TransmissionType,
    sourceOrgan: '心',
    targetOrgan: '小肠',
    triggerFeatures: ['心区热象', '小便异常'],
    pattern: '心热移小肠',
    mechanism: '心火亢盛，下移小肠',
    treatment: '清心火，利小便',
    confidence: 0.7,
  },
];

/**
 * 组合传变规则（多脏器传变）
 */
export const combinedTransmissionRules = [
  {
    id: 'combined-001',
    path: ['肝', '脾', '肾'],
    pattern: '肝郁→克脾→脾虚→生化不足→气血虚',
    mechanism: '肝脾肾三脏传变',
    treatment: '疏肝健脾补肾',
    confidence: 0.85,
  },
  {
    id: 'combined-002',
    path: ['脾', '肺', '卫'],
    pattern: '脾虚→肺气不足→卫外不固',
    mechanism: '脾胃虚弱影响肺卫',
    treatment: '健脾益肺',
    confidence: 0.8,
  },
  {
    id: 'combined-003',
    path: ['肾', '肝', '心'],
    pattern: '肾阴虚→水不涵木→肝阳上亢→心火亢盛',
    mechanism: '心肾不交，肝火上炎',
    treatment: '滋肾阴，清肝火，安心神',
    confidence: 0.8,
  },
];

/**
 * 获取所有传变规则
 */
export function getAllTransmissionRules() {
  return [
    ...childConsumesParentRules,
    ...parentAffectsChildRules,
    ...controlTransmissionRules,
    ...generatingTransmissionRules,
    ...organDirectTransmissionRules,
    ...combinedTransmissionRules,
  ];
}
