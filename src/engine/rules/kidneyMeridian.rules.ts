/**
 * 肾经辨证规则 v2.0
 * 足少阴肾经经脉辨证规则（K01-K22）
 * 来源：《少阴肾经辨证大全》
 */

/**
 * 肾经规则接口
 */
export interface KidneyMeridianRule {
  id: string;
  code: string;
  name: string;
  tongueFeatures: string;
  pulseFeatures: string;
  symptoms: string;
  treatment: string;
  primaryPoints: string[];
  auxiliaryPoints: string;
  confidence: number;
  mechanism: string;
  category: '虚证' | '实证' | '寒证' | '热证' | '虚实夹杂';
  organ: string[];
}

/**
 * 肾经辨证规则集合
 */
export const kidneyMeridianRules: KidneyMeridianRule[] = [
  // ========== 脑髓病候 ==========
  {
    id: 'kidney-001',
    code: 'K01',
    name: '脑髓病候虚证',
    tongueFeatures: '舌淡苔薄',
    pulseFeatures: '脉细弱',
    symptoms: '头重眩晕，失眠健忘，精神恍惚，智力低下，痴呆，髓病肌肉萎缩，肢体麻木',
    treatment: '滋阴补肾，补益气血',
    primaryPoints: ['大钟', '关元', '足三里', '三阴交', '太溪', '肾俞', '肝俞'],
    auxiliaryPoints: '随症加减',
    confidence: 0.85,
    mechanism: '肾精不足→髓海失养→脑转耳鸣→健忘痴呆',
    category: '虚证',
    organ: ['肾', '脑'],
  },
  {
    id: 'kidney-002',
    code: 'K02',
    name: '脑髓病候实证',
    tongueFeatures: '舌红苔黄',
    pulseFeatures: '脉数',
    symptoms: '惊痫，癫痫，惊风，脐风撮口，发狂，呆痴',
    treatment: '益肾清热，化痰止痉',
    primaryPoints: ['涌泉', '复溜', '丰隆', '太冲', '太溪', '然谷', '肾俞'],
    auxiliaryPoints: '随症加减',
    confidence: 0.80,
    mechanism: '外邪侵袭→痰热扰神→惊痫发狂→神志异常',
    category: '实证',
    organ: ['肾', '脑'],
  },

  // ========== 肾阴阳虚证 ==========
  {
    id: 'kidney-003',
    code: 'K03',
    name: '肾阳虚证',
    tongueFeatures: '舌淡苔白',
    pulseFeatures: '脉沉弱',
    symptoms: '形寒肢冷，面色黧黑，精神萎靡，腰膝酸冷，夜尿清长，阳痿遗精，完谷不化',
    treatment: '温补肾阳，填精益髓',
    primaryPoints: ['太溪', '肾俞', '命门', '关元', '气海', '复溜'],
    auxiliaryPoints: '随症加减',
    confidence: 0.85,
    mechanism: '肾阳不足→温煦失职→形寒肢冷→阳虚精亏',
    category: '虚证',
    organ: ['肾'],
  },
  {
    id: 'kidney-004',
    code: 'K04',
    name: '肾阴虚证',
    tongueFeatures: '舌红少津',
    pulseFeatures: '脉细数',
    symptoms: '腰膝酸软，头晕耳鸣，失眠多梦，五心烦热，潮热盗汗，咽干口燥，遗精',
    treatment: '滋阴补肾，清热降火',
    primaryPoints: ['太溪', '肾俞', '复溜', '照海', '三阴交', '然谷'],
    auxiliaryPoints: '随症加减',
    confidence: 0.85,
    mechanism: '肾阴不足→虚火内生→五心烦热→腰膝酸软',
    category: '虚证',
    organ: ['肾'],
  },

  // ========== 男科妇科病候 ==========
  {
    id: 'kidney-005',
    code: 'K05',
    name: '男科妇科病候虚证',
    tongueFeatures: '舌淡苔薄',
    pulseFeatures: '脉细弱',
    symptoms: '阳痿，遗精，不孕，崩漏，带下，阴挺，少气漏血',
    treatment: '滋补肾气，补益气血',
    primaryPoints: ['照海', '曲泉', '交信', '阴谷', '关元', '足三里', '三阴交', '太溪', '肾俞', '肝俞'],
    auxiliaryPoints: '随症加减',
    confidence: 0.85,
    mechanism: '肾精不足→冲任不固→阳痿不孕→崩漏带下',
    category: '虚证',
    organ: ['肾', '肝'],
  },
  {
    id: 'kidney-006',
    code: 'K06',
    name: '男科妇科病候实证',
    tongueFeatures: '舌红苔黄腻',
    pulseFeatures: '脉数',
    symptoms: '淋浊，寒疝腹痛，小便频数，遗精白浊，阴汗出，阴茎痛',
    treatment: '清热利湿，通淋止痛',
    primaryPoints: ['关元', '中极', '肓俞', '横骨', '次髎', '小肠俞'],
    auxiliaryPoints: '随症加减',
    confidence: 0.80,
    mechanism: '下焦湿热→气滞不通→淋浊癃闭→寒疝腹痛',
    category: '实证',
    organ: ['肾', '膀胱'],
  },
  {
    id: 'kidney-007',
    code: 'K07',
    name: '男科妇科病候热证',
    tongueFeatures: '舌红苔黄',
    pulseFeatures: '脉数',
    symptoms: '阴肿，小便淋沥，尿血，五淋，水蛊，腹胀肿',
    treatment: '清利湿热，凉血止淋',
    primaryPoints: ['中极', '曲泉', '太溪', '阴陵泉', '然谷', '膀胱俞', '合谷'],
    auxiliaryPoints: '随症加减',
    confidence: 0.80,
    mechanism: '湿热下注→伤及膀胱→小便淋沥→尿血水蛊',
    category: '热证',
    organ: ['肾', '膀胱'],
  },

  // ========== 腰背痛 ==========
  {
    id: 'kidney-008',
    code: 'K08',
    name: '腰背痛虚证',
    tongueFeatures: '舌淡苔薄',
    pulseFeatures: '脉沉细',
    symptoms: '腰痛隐隐，喜温喜按，腰膝酸软，乏力，脊股内后廉痛',
    treatment: '补益精气，活络止痛',
    primaryPoints: ['肾俞', '命门', '委中', '昆仑', '太溪'],
    auxiliaryPoints: '随症加减',
    confidence: 0.85,
    mechanism: '肾精不足→经脉失养→腰脊疼痛→喜按喜温',
    category: '虚证',
    organ: ['肾'],
  },
  {
    id: 'kidney-009',
    code: 'K09',
    name: '腰背痛实证',
    tongueFeatures: '舌红苔黄',
    pulseFeatures: '脉弦数',
    symptoms: '腰脊疼痛剧烈，拒按，转侧困难，腰脊如弓',
    treatment: '舒筋活络，祛邪止痛',
    primaryPoints: ['肾俞', '命门', '委中', '昆仑', '后溪', '天柱'],
    auxiliaryPoints: '随症加减',
    confidence: 0.80,
    mechanism: '经气郁滞→瘀血阻络→腰脊剧痛→俯仰不利',
    category: '实证',
    organ: ['肾'],
  },
  {
    id: 'kidney-010',
    code: 'K10',
    name: '腰背痛寒证',
    tongueFeatures: '舌淡苔白',
    pulseFeatures: '脉沉紧',
    symptoms: '腰脊冷痛如坐冷水中，背脊发凉，遇寒加重，肢冷浮肿',
    treatment: '温阳散寒，活络止痛',
    primaryPoints: ['肾俞', '命门', '委中', '复溜', '大钟', '昆仑'],
    auxiliaryPoints: '温针灸',
    confidence: 0.80,
    mechanism: '寒邪侵袭→经脉拘急→腰脊冷痛→遇寒加重',
    category: '寒证',
    organ: ['肾'],
  },
  {
    id: 'kidney-011',
    code: 'K11',
    name: '腰背痛热证',
    tongueFeatures: '舌红苔黄',
    pulseFeatures: '脉数',
    symptoms: '腰背痛，发热，红肿，口苦',
    treatment: '清热消肿，活络止痛',
    primaryPoints: ['委中', '昆仑', '承山', '阿是穴'],
    auxiliaryPoints: '放血法',
    confidence: 0.80,
    mechanism: '热邪郁结→经脉不通→腰背发热→红肿疼痛',
    category: '热证',
    organ: ['肾'],
  },

  // ========== 咽喉病候 ==========
  {
    id: 'kidney-012',
    code: 'K12',
    name: '咽喉虚证',
    tongueFeatures: '舌红少津',
    pulseFeatures: '脉细数',
    symptoms: '咽痛经久不愈，舌强，音哑，口中热如胶，咽干',
    treatment: '补益精气，滋阴降火',
    primaryPoints: ['大椎', '肾俞', '复溜', '太溪'],
    auxiliaryPoints: '随症加减',
    confidence: 0.85,
    mechanism: '肾阴不足→虚火上炎→咽干音哑→虚热咽痛',
    category: '虚证',
    organ: ['肾'],
  },
  {
    id: 'kidney-013',
    code: 'K13',
    name: '咽喉实证',
    tongueFeatures: '舌红苔黄',
    pulseFeatures: '脉数',
    symptoms: '咽喉疼痛，红肿热痛，喉风，口噤不语，痰涎壅塞',
    treatment: '清热消肿，豁痰利咽，降火',
    primaryPoints: ['大椎', '照海', '合谷', '曲池'],
    auxiliaryPoints: '随症加减',
    confidence: 0.80,
    mechanism: '热邪郁结→咽喉红肿→痰涎壅滞→喉风不语',
    category: '实证',
    organ: ['肾'],
  },

  // ========== 肾与肺病候 ==========
  {
    id: 'kidney-014',
    code: 'K14',
    name: '肾不纳气虚喘证',
    tongueFeatures: '舌淡苔白',
    pulseFeatures: '脉沉弱',
    symptoms: '咳喘气逆，少气乏力，动则喘甚，呼多吸少',
    treatment: '补益精气，固肾纳气',
    primaryPoints: ['关元', '太溪', '肾俞', '鱼际', '风门', '肺俞'],
    auxiliaryPoints: '随症加减',
    confidence: 0.85,
    mechanism: '肾气不足→摄纳无权→气浮于上→虚喘咳逆',
    category: '虚证',
    organ: ['肾', '肺'],
  },
  {
    id: 'kidney-015',
    code: 'K15',
    name: '肾寒水犯之痰喘',
    tongueFeatures: '舌淡苔白滑',
    pulseFeatures: '脉沉滑',
    symptoms: '下为浮肿，上为喘呼，痰涎壅盛，不得卧',
    treatment: '温肾散寒，利水化痰',
    primaryPoints: ['风门', '肺俞', '太溪', '阴谷', '复溜', '关元', '丰隆'],
    auxiliaryPoints: '温针灸',
    confidence: 0.80,
    mechanism: '肾寒水冷→水气上泛→喘呼痰壅→不得平卧',
    category: '寒证',
    organ: ['肾', '肺'],
  },
  {
    id: 'kidney-016',
    code: 'K16',
    name: '肾虚肺乘之腰痛',
    tongueFeatures: '舌淡苔薄',
    pulseFeatures: '脉沉细',
    symptoms: '腰痛牵及腰背，咳喘并作，少气乏力',
    treatment: '补益肾气，活络止痛',
    primaryPoints: ['肾俞', '肺俞', '命门', '委中', '昆仑', '太溪'],
    auxiliaryPoints: '随症加减',
    confidence: 0.80,
    mechanism: '肾气不足→肺气乘之→经脉不利→腰痛咳喘',
    category: '虚实夹杂',
    organ: ['肾', '肺'],
  },

  // ========== 肾与心脾胃病候 ==========
  {
    id: 'kidney-017',
    code: 'K17',
    name: '肾精血不足之心痛',
    tongueFeatures: '舌淡苔薄',
    pulseFeatures: '脉细弱',
    symptoms: '心痛引腰背，欲呕，心悸怔忡，失眠健忘',
    treatment: '补益精气，养心止痛',
    primaryPoints: ['肾俞', '心俞', '命门', '通谷', '太溪'],
    auxiliaryPoints: '大钟',
    confidence: 0.85,
    mechanism: '肾精不足→心血亏虚→心脉失养→心痛引背',
    category: '虚证',
    organ: ['肾', '心'],
  },
  {
    id: 'kidney-018',
    code: 'K18',
    name: '肾与脾胃病候阳虚证',
    tongueFeatures: '舌淡苔白',
    pulseFeatures: '脉沉弱',
    symptoms: '下利清谷，呕吐，虚满，腹痛喜温喜按',
    treatment: '温补肾阳，健脾和胃',
    primaryPoints: ['肾俞', '命门', '内关', '足三里', '昆仑', '阴谷', '陷谷', '阴陵泉', '复溜', '太溪'],
    auxiliaryPoints: '随症加减',
    confidence: 0.85,
    mechanism: '肾阳虚衰→不能温脾→升降失常→呕利腹痛',
    category: '虚证',
    organ: ['肾', '脾', '胃'],
  },
  {
    id: 'kidney-019',
    code: 'K19',
    name: '肾与脾胃病候实证',
    tongueFeatures: '舌红苔黄',
    pulseFeatures: '脉数',
    symptoms: '腹满，大便秘结不通，腹中有积块',
    treatment: '清热通便，行气活血',
    primaryPoints: ['曲池', '照海', '膈俞', '肝俞', '合谷'],
    auxiliaryPoints: '随症加减',
    confidence: 0.80,
    mechanism: '肾热内盛→下传脾胃→腑气不通→腹满便秘',
    category: '实证',
    organ: ['肾', '胃'],
  },
  {
    id: 'kidney-020',
    code: 'K20',
    name: '肾与脾胃病候寒证',
    tongueFeatures: '舌淡苔白',
    pulseFeatures: '脉沉紧',
    symptoms: '小腹胀满疼痛，呕吐，寒疝，大便难',
    treatment: '温补肾阳，健脾和胃',
    primaryPoints: ['肾俞', '命门', '中封', '大钟', '然谷', '内庭', '大敦', '太溪'],
    auxiliaryPoints: '温针灸',
    confidence: 0.80,
    mechanism: '肾阳不足→寒凝中焦→气机阻滞→腹胀寒疝',
    category: '寒证',
    organ: ['肾', '胃'],
  },
  {
    id: 'kidney-021',
    code: 'K21',
    name: '肾与脾胃病候热证',
    tongueFeatures: '舌红苔黄腻',
    pulseFeatures: '脉数',
    symptoms: '肠澼下血，痢疾，小便赤涩，尿血，五淋，水蛊',
    treatment: '清利湿热，凉血止淋',
    primaryPoints: ['横骨', '关元', '中极', '曲泉', '太溪', '阴谷', '肾俞', '气海', '然谷', '承山', '复溜', '膀胱俞', '合谷'],
    auxiliaryPoints: '随症加减',
    confidence: 0.80,
    mechanism: '肾热内郁→下注肠胃→湿热痢疾→便脓尿血',
    category: '热证',
    organ: ['肾', '膀胱', '胃', '肠'],
  },
  {
    id: 'kidney-022',
    code: 'K22',
    name: '肾精不足之消渴便秘',
    tongueFeatures: '舌红少津',
    pulseFeatures: '脉细数',
    symptoms: '肾消，口渴引饮，小便频数，大便秘结',
    treatment: '补益精气，滋阴润肠',
    primaryPoints: ['肾俞', '承山', '照海', '太冲', '支沟', '涌泉', '行间', '太溪'],
    auxiliaryPoints: '随症加减',
    confidence: 0.80,
    mechanism: '肾精枯竭→津液亏损→消渴便秘→阴虚燥结',
    category: '虚证',
    organ: ['肾'],
  },
];

/**
 * 根据舌象特征获取匹配规则
 */
export function getKidneyRulesByTongueFeatures(tongue: string): KidneyMeridianRule[] {
  return kidneyMeridianRules.filter(rule => 
    rule.tongueFeatures.includes(tongue) || tongue.includes(rule.tongueFeatures)
  );
}

/**
 * 根据证型获取规则
 */
export function getKidneyRulesByCategory(category: KidneyMeridianRule['category']): KidneyMeridianRule[] {
  return kidneyMeridianRules.filter(rule => rule.category === category);
}

/**
 * 获取肾经规则统计
 */
export function getKidneyMeridianStats() {
  return {
    total: kidneyMeridianRules.length,
    byCategory: {
      虚证: kidneyMeridianRules.filter(r => r.category === '虚证').length,
      实证: kidneyMeridianRules.filter(r => r.category === '实证').length,
      热证: kidneyMeridianRules.filter(r => r.category === '热证').length,
      寒证: kidneyMeridianRules.filter(r => r.category === '寒证').length,
      虚实夹杂: kidneyMeridianRules.filter(r => r.category === '虚实夹杂').length,
    },
  };
}
