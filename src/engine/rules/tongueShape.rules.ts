/**
 * 舌形辨证规则（含反直觉规则）
 * Layer 2 专用
 * 
 * 核心原则：胖大≠实，瘦小红≠单纯虚
 */

/**
 * 舌形辨证规则
 */
export const tongueShapeRules = [
  {
    id: 'shape-001',
    shape: '胖大',
    mechanism: '气虚→水湿运化失常→湿泛于舌→胖大',
    essence: '气虚（本虚）',
    pattern: '气虚湿盛',
    confidence: 0.75,
  },
  {
    id: 'shape-002',
    shape: '瘦薄',
    mechanism: '阴虚→组织失养→舌体收缩',
    essence: '阴虚（津液耗损）',
    pattern: '阴虚',
    confidence: 0.75,
  },
  {
    id: 'shape-003',
    shape: '正常',
    mechanism: '无明显异常',
    essence: '正常',
    pattern: '舌形正常',
    confidence: 0.9,
  },
  {
    id: 'shape-004',
    shape: '短缩',
    mechanism: '热盛伤津或寒凝筋脉',
    essence: '危重',
    pattern: '危急重症',
    confidence: 0.85,
  },
  {
    id: 'shape-005',
    shape: '松弛',
    mechanism: '气虚导致舌体失养',
    essence: '气虚',
    pattern: '气虚',
    confidence: 0.7,
  },
];

/**
 * 舌形+舌色组合规则（反直觉）
 */
export const shapeColorRules = [
  {
    id: 'shape-color-001',
    shape: '胖大',
    tongueColor: '淡白',
    pattern: '气虚（阳虚倾向）',
    essence: '气虚',
    mechanism: '气虚+阳虚，水湿运化失常',
    confidence: 0.8,
  },
  {
    id: 'shape-color-002',
    shape: '胖大',
    tongueColor: '淡红',
    pattern: '气虚湿盛',
    essence: '气虚为本，湿盛为标',
    mechanism: '气虚为本，湿盛为标',
    confidence: 0.75,
  },
  {
    id: 'shape-color-003',
    shape: '胖大',
    tongueColor: '红',
    pattern: '实热/湿热',
    essence: '湿热内蕴',
    mechanism: '湿热熏蒸',
    confidence: 0.7,
  },
  {
    id: 'shape-color-004',
    shape: '瘦薄',
    tongueColor: '红',
    pattern: '阴虚火旺',
    essence: '阴虚火旺',
    mechanism: '阴虚→虚火灼津→舌红少津',
    confidence: 0.8,
  },
  {
    id: 'shape-color-005',
    shape: '瘦薄',
    tongueColor: '淡白',
    pattern: '气血两虚',
    essence: '气血两虚',
    mechanism: '阴血亏虚+气虚',
    confidence: 0.75,
  },
  {
    id: 'shape-color-006',
    shape: '瘦薄',
    tongueColor: '淡红',
    pattern: '阴虚',
    essence: '阴虚',
    mechanism: '阴虚津液不足',
    confidence: 0.7,
  },
];

/**
 * 齿痕辨证规则
 */
export const teethMarkRules = [
  {
    id: 'teeth-001',
    teethMark: true,
    shape: '胖大',
    pattern: '气虚湿盛（本虚标实）',
    essence: '气虚为本，湿盛为标',
    mechanism: '气虚→运化失司→湿泛于舌→胖大+齿痕',
    confidence: 0.85,
  },
  {
    id: 'teeth-002',
    teethMark: true,
    shape: '正常',
    pattern: '脾虚湿盛',
    essence: '脾虚湿盛',
    mechanism: '脾虚→运化失司→湿泛于舌→齿痕',
    confidence: 0.75,
  },
  {
    id: 'teeth-003',
    teethMark: true,
    tongueColor: '淡白',
    pattern: '脾肾阳虚',
    essence: '阳虚',
    mechanism: '脾肾阳虚，水湿内停',
    confidence: 0.8,
  },
];

/**
 * 裂纹辨证规则
 */
export const crackRules = [
  {
    id: 'crack-001',
    crack: true,
    tongueColor: '红',
    pattern: '阴虚火旺',
    essence: '阴虚火旺',
    mechanism: '阴虚→虚火灼津→舌裂',
    confidence: 0.8,
  },
  {
    id: 'crack-002',
    crack: true,
    tongueColor: '淡白',
    pattern: '血虚',
    essence: '血虚',
    mechanism: '血虚→组织失养→舌裂',
    confidence: 0.75,
  },
  {
    id: 'crack-003',
    crack: true,
    tongueColor: '淡红',
    pattern: '精亏/血虚',
    essence: '精血亏虚',
    mechanism: '精血不足，舌体失养',
    confidence: 0.7,
  },
  {
    id: 'crack-004',
    crack: true,
    coatingColor: '少苔',
    pattern: '胃阴亏虚',
    essence: '阴虚',
    mechanism: '胃阴不足，舌体失养',
    confidence: 0.75,
  },
];

/**
 * 齿痕+裂纹组合规则
 */
export const teethCrackRules = [
  {
    id: 'teeth-crack-001',
    teethMark: true,
    crack: true,
    shape: '胖大',
    pattern: '气阴两虚',
    essence: '气阴两虚',
    mechanism: '气虚+阴虚',
    confidence: 0.8,
  },
  {
    id: 'teeth-crack-002',
    teethMark: true,
    crack: true,
    tongueColor: '淡白',
    pattern: '气血两虚夹瘀',
    essence: '气血两虚',
    mechanism: '气血两虚，舌体失养',
    confidence: 0.75,
  },
];

/**
 * 虚实判断规则
 */
export const deficiencyExcessRules = [
  {
    id: 'de-ex-001',
    features: ['胖大', '齿痕'],
    judgment: '虚实夹杂',
    essence: '本虚标实',
    priority: '以虚为本',
    confidence: 0.85,
  },
  {
    id: 'de-ex-002',
    features: ['瘦薄', '红'],
    judgment: '阴虚火旺',
    essence: '本虚（阴虚）',
    priority: '滋阴降火',
    confidence: 0.8,
  },
  {
    id: 'de-ex-003',
    features: ['裂纹', '红'],
    judgment: '阴虚火旺',
    essence: '本虚（阴虚）',
    priority: '滋阴清热',
    confidence: 0.8,
  },
  {
    id: 'de-ex-004',
    features: ['齿痕'],
    judgment: '脾虚湿盛',
    essence: '本虚标实',
    priority: '健脾祛湿',
    confidence: 0.75,
  },
];
