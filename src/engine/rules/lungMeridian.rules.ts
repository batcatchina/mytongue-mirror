/**
 * 肺经辨证规则 v2.0
 * 手太阴肺经经脉辨证规则（L01-L16）
 * 来源：《手太阴肺经经脉辨证》
 */

/**
 * 肺经规则接口
 */
export interface LungMeridianRule {
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
 * 肺经辨证规则集合
 */
export const lungMeridianRules: LungMeridianRule[] = [
  // ========== 肺经基础证候 ==========
  {
    id: 'lung-001',
    code: 'LU-01',
    name: '肺气虚证',
    tongueFeatures: '舌淡苔薄',
    pulseFeatures: '脉细弱',
    symptoms: '喘咳逆气，咳痰清稀，咳声无力，低声语怯，动则喘甚，自汗，面色苍白，少气不足以息',
    treatment: '补益脾肺，止咳平喘',
    primaryPoints: ['太渊', '列缺', '尺泽', '三阴交', '膻中', '气海', '肺俞'],
    auxiliaryPoints: '俞募配穴：肺俞配中府；原络配穴：太渊配列缺',
    confidence: 0.85,
    mechanism: '肺气不足→肃降不及→气上逆而咳喘→自汗少气',
    category: '虚证',
    organ: ['肺', '脾'],
  },
  {
    id: 'lung-002',
    code: 'LU-02',
    name: '肺阴虚证',
    tongueFeatures: '舌红少津',
    pulseFeatures: '脉细数',
    symptoms: '久病经气不足，久咳伤阴，津液亏虚，干咳少痰，口干咽燥，潮热盗汗，五心烦热',
    treatment: '滋养肺肾之阴，清热化痰',
    primaryPoints: ['曲池', '太渊', '太溪', '照海', '三阴交'],
    auxiliaryPoints: '金水相生：太渊（肺原穴）配太溪（肾原穴）配照海（阴跷脉）',
    confidence: 0.85,
    mechanism: '久咳伤阴→津液亏虚→肺肾阴虚→虚热内生',
    category: '虚证',
    organ: ['肺', '肾'],
  },
  {
    id: 'lung-003',
    code: 'LU-03',
    name: '肺实热证',
    tongueFeatures: '舌红苔黄',
    pulseFeatures: '脉数',
    symptoms: '邪热犯肺，热盛于内，咳喘发热，有少量黄痰，胸痛，喉痹，口渴，气粗胸盈仰息',
    treatment: '清肺热，肃降肺气',
    primaryPoints: ['肺俞', '曲池', '孔最', '尺泽', '中府', '膻中', '内庭'],
    auxiliaryPoints: '表里经合郄配合：曲池（阳明合穴）配孔最（太阴郄穴）；俞募配穴：肺俞配中府',
    confidence: 0.80,
    mechanism: '邪热犯肺→肺热郁炽→气逆咳喘→胸闷喉痹',
    category: '热证',
    organ: ['肺'],
  },
  {
    id: 'lung-004',
    code: 'LU-04',
    name: '痰热壅肺证',
    tongueFeatures: '舌红苔黄腻',
    pulseFeatures: '脉滑数',
    symptoms: '外感风热或宿痰积热，痰热互结，壅滞于肺，咳嗽气喘，痰多黄稠，或咳出腥臭脓血痰，胸闷胸痛，烦热口干',
    treatment: '清热化痰，肃降肺金，定喘止咳',
    primaryPoints: ['肺俞', '尺泽', '列缺', '曲池', '少商', '足三里', '丰隆', '膻中', '定喘'],
    auxiliaryPoints: '合络配穴：尺泽配列缺；清肺热：曲池配少商；健脾化痰：肺俞、足三里配丰隆',
    confidence: 0.80,
    mechanism: '痰热互结→壅滞于肺→气失清降→咳喘痰黄稠',
    category: '热证',
    organ: ['肺', '脾'],
  },
  {
    id: 'lung-005',
    code: 'LU-05',
    name: '痰湿阻肺证',
    tongueFeatures: '舌淡苔白腻',
    pulseFeatures: '脉濡滑',
    symptoms: '脾气不足，运化失职，聚湿生痰，上储于肺，肺失宣降，咳嗽痰多，呈泡沫样或色白粘稠，喉中痰鸣，痰多清稀，胸脘痞闷，身重懈怠',
    treatment: '健脾化湿，肃降肺气，止咳化痰',
    primaryPoints: ['太渊', '太白', '尺泽', '肺俞', '脾俞', '足三里', '丰隆', '三阴交'],
    auxiliaryPoints: '俞合相配：肺俞、脾俞配列尺泽；原穴相配：太渊配太白；合络相配：足三里配丰隆',
    confidence: 0.80,
    mechanism: '脾失健运→聚湿生痰→上储于肺→肺失宣降→咳喘痰多',
    category: '虚实夹杂',
    organ: ['肺', '脾'],
  },
  {
    id: 'lung-006',
    code: 'LU-06',
    name: '肺积证（气滞血瘀）',
    tongueFeatures: '舌质暗有瘀斑',
    pulseFeatures: '脉涩',
    symptoms: '肺经经气郁滞，宗气运行受阻，胸部胀闷，胁肋胀痛，情志抑郁，气滞血瘀形成积聚',
    treatment: '消积化滞，活血理气',
    primaryPoints: ['中府', '云门', '膻中', '尺泽', '期门', '膈俞', '孔最', '章门'],
    auxiliaryPoints: '中府透云门（补肺气益中气，软坚散结）；膻中（气会，理气宽胸）；尺泽配膈俞（理气化瘀）；孔最（肺经郄穴，清热凉血）',
    confidence: 0.75,
    mechanism: '肺经经气郁滞→宗气运行受阻→气滞血瘀→形成积聚',
    category: '实证',
    organ: ['肺'],
  },

  // ========== 肺魄相关 ==========
  {
    id: 'lung-007',
    code: 'LU-07',
    name: '肺魄不安虚证',
    tongueFeatures: '舌淡苔薄',
    pulseFeatures: '脉细弱',
    symptoms: '肺经气不足，肺气虚则肺不藏魄，梦见白色之悲惨景象，或梦见杀人流血等，悲忧恐惧，多梦易惊',
    treatment: '补肺益气，安魂定魄',
    primaryPoints: ['列缺', '照海', '肺俞', '魄户', '魂门', '神门', '大陵', '足窍阴', '印堂'],
    auxiliaryPoints: '列缺配照海（八脉会穴，通于任脉阴跷脉，治肺膈气滞，镇静安神）；魄户配魂门（补肺定魂魄）；神门配大陵（安神定志）；足窍阴（壮胆止梦）；印堂（魂魄归心）',
    confidence: 0.80,
    mechanism: '肺气不足→肺不藏魄→魂魄不安→悲恐多梦',
    category: '虚证',
    organ: ['肺'],
  },
  {
    id: 'lung-008',
    code: 'LU-08',
    name: '肺魄不安实症',
    tongueFeatures: '舌红苔黄',
    pulseFeatures: '脉弦数',
    symptoms: '邪气犯肺，肺魄不安，意不存人，神识不清，狂妄躁动，理智失控，对环境丧失记忆，甚则恐惧，噩梦纷纭，哭泣',
    treatment: '清肃肺气，镇静安魂',
    primaryPoints: ['尺泽', '肺俞', '魄户', '魂门', '完骨', '承浆', '人中', '上星', '申脉', '照海'],
    auxiliaryPoints: '尺泽配肺俞（补肺安魄定志）；魂门魄户（安魂定魄）；完骨（镇静安神）；承浆上星（醒神定志）；申脉配照海（定魄调阴阳）',
    confidence: 0.75,
    mechanism: '邪气犯肺→肺魄不安→意不存人→狂妄躁动',
    category: '实证',
    organ: ['肺'],
  },

  // ========== 肺经表证 ==========
  {
    id: 'lung-009',
    code: 'LU-09',
    name: '风寒袭肺证',
    tongueFeatures: '舌淡苔薄白',
    pulseFeatures: '脉浮紧',
    symptoms: '风寒内侵于肺，肺气不宣，肌腠卫气被郁，宣散失职，恶寒发热，头体疼痛，咳嗽，咳出清稀薄痰液',
    treatment: '祛风散寒解表，宣肺止咳',
    primaryPoints: ['云门', '中府', '合谷', '列缺', '外关', '肺俞', '大椎'],
    auxiliaryPoints: '中府配云门（宣发肺气，解表止咳，疏风散寒，先点刺开穴再中府透云门）；俞募配穴：肺俞配中府；原络配穴：合谷配列缺；外关（通阳维脉，疏泄阳邪，解表散寒）；大椎（解表散邪，通诸阳）',
    confidence: 0.85,
    mechanism: '风寒侵肺→肺气不宣→卫气被郁→恶寒发热咳嗽',
    category: '寒证',
    organ: ['肺'],
  },
  {
    id: 'lung-010',
    code: 'LU-10',
    name: '风热袭肺证',
    tongueFeatures: '舌红苔薄黄',
    pulseFeatures: '脉浮数',
    symptoms: '风热犯肺，肺气不宣，热重寒轻，发热微恶风寒，咳嗽，痰黄粘稠，咽喉肿痛，口微渴',
    treatment: '疏风清热，调肺化痰',
    primaryPoints: ['肺俞', '曲池', '尺泽', '列缺', '大椎', '合谷', '少商'],
    auxiliaryPoints: '大椎（清热解表要穴）；列缺（宣肺解表，清热止咳）；曲池配尺泽（表里经相应，疏散热邪）；肺俞（清热化痰）；少商（清热治咽痛）；丰隆（化痰要穴）',
    confidence: 0.85,
    mechanism: '风热犯肺→肺气不宣→热盛津伤→咳痰咽痛',
    category: '热证',
    organ: ['肺'],
  },

  // ========== 循经病候 ==========
  {
    id: 'lung-011',
    code: 'LU-11',
    name: '循经病候虚证',
    tongueFeatures: '舌淡苔薄',
    pulseFeatures: '脉细弱',
    symptoms: '气血虚不能濡养机体，胸痛，缺盆痛，肩背痛，手臂前廉痛，掌中热，疼痛隐隐喜温喜按',
    treatment: '补益肺气，养血通络',
    primaryPoints: ['太渊', '中府', '尺泽', '孔最', '肺俞'],
    auxiliaryPoints: '随症加减',
    confidence: 0.80,
    mechanism: '肺经气虚→不能濡养经脉→不荣则痛→循经疼痛',
    category: '虚证',
    organ: ['肺'],
  },
  {
    id: 'lung-012',
    code: 'LU-12',
    name: '循经病证实证',
    tongueFeatures: '舌红苔黄',
    pulseFeatures: '脉数',
    symptoms: '经气变动，气血不畅，血瘀气滞，胸痛，缺盆痛，肩背痛，臂内前廉痛厥，掌中热，疼痛固定拒按',
    treatment: '清热散瘀，通经活络止痛',
    primaryPoints: ['中府', '尺泽', '曲池', '孔最', '经渠', '鱼际', '少府', '列缺'],
    auxiliaryPoints: '中府（肃降肺气，通肺经）；天府（治上臂痛）；曲池（清热通经络）；孔最（通经凉血活血）；少府（治掌中热）；经渠鱼际（补肺气，清肺热，通经络）；列缺配照海（治疗肺胸病痛）',
    confidence: 0.80,
    mechanism: '经气郁滞→血瘀气滞→不通则痛→循经疼痛',
    category: '实证',
    organ: ['肺'],
  },
  {
    id: 'lung-013',
    code: 'LU-13',
    name: '循经病候寒证',
    tongueFeatures: '舌淡苔白',
    pulseFeatures: '脉沉紧',
    symptoms: '风寒侵袭，肩背痛，遇寒加重，畏寒喜温，臂内前廉痛厥，疼痛拘急',
    treatment: '温经散寒，通络止痛',
    primaryPoints: ['肺俞', '中府', '尺泽', '孔最', '列缺'],
    auxiliaryPoints: '温针灸',
    confidence: 0.80,
    mechanism: '寒邪客肺→寒性凝滞→经脉拘急→疼痛遇寒加重',
    category: '寒证',
    organ: ['肺'],
  },

  // ========== 肺病及他脏 ==========
  {
    id: 'lung-014',
    code: 'LU-14',
    name: '肺病及肾',
    tongueFeatures: '舌淡苔薄',
    pulseFeatures: '脉沉细',
    symptoms: '肺经变动，气逆犯肾，阴股、髀、小腿及足跟痛，腰膝酸软，小便不利',
    treatment: '温肺降逆，益肾养阴，通经活络',
    primaryPoints: ['中府', '阴谷', '经渠', '复溜', '三阴交'],
    auxiliaryPoints: '中府（肺经募穴，开胸顺气）；阴谷（肾经合穴，益肾养阴）；经渠（养肺益肾阴）；局部：髀、阴股痛加居髎、箕门；踹痛加承筋、承山；小腿痛加阴陵泉、交信、筑宾；足跟痛加大钟、仆参',
    confidence: 0.80,
    mechanism: '肺经变动→气逆犯肾→肾经循行部位疼痛',
    category: '虚实夹杂',
    organ: ['肺', '肾'],
  },
  {
    id: 'lung-015',
    code: 'LU-15',
    name: '阴股髀痛证',
    tongueFeatures: '舌淡苔白',
    pulseFeatures: '脉沉紧',
    symptoms: '肺经经气不行，阴股、髀部疼痛，疼痛拘急，遇寒加重',
    treatment: '温经散寒，通络止痛',
    primaryPoints: ['中府', '云门', '尺泽', '列缺', '居髎', '箕门'],
    auxiliaryPoints: '温针灸',
    confidence: 0.80,
    mechanism: '肺经经气不行→阴股髀部筋脉拘急→疼痛拘急',
    category: '寒证',
    organ: ['肺'],
  },
  {
    id: 'lung-016',
    code: 'LU-16',
    name: '小腿踹足痛证',
    tongueFeatures: '舌红苔黄或舌淡苔白',
    pulseFeatures: '脉数或脉沉紧',
    symptoms: '肺经变动，气逆于踹，小腿踹痛，足跟痛，足下热而痛或畏寒喜温',
    treatment: '通经活络止痛',
    primaryPoints: ['中府', '尺泽', '孔最', '经渠', '太溪', '仆参', '申脉'],
    auxiliaryPoints: '踹痛加承筋、承山；足跟痛加大钟、昆仑；寒证加温针灸',
    confidence: 0.80,
    mechanism: '肺经变动→气逆于踹→小腿足跟痛',
    category: '虚实夹杂',
    organ: ['肺'],
  },
];

/**
 * 根据舌象特征获取匹配规则
 */
export function getLungRulesByTongueFeatures(tongue: string): LungMeridianRule[] {
  return lungMeridianRules.filter(rule => 
    rule.tongueFeatures.includes(tongue) || tongue.includes(rule.tongueFeatures)
  );
}

/**
 * 根据证型获取规则
 */
export function getLungRulesByCategory(category: LungMeridianRule['category']): LungMeridianRule[] {
  return lungMeridianRules.filter(rule => rule.category === category);
}

/**
 * 获取肺经规则统计
 */
export function getLungMeridianStats() {
  return {
    total: lungMeridianRules.length,
    byCategory: {
      虚证: lungMeridianRules.filter(r => r.category === '虚证').length,
      实证: lungMeridianRules.filter(r => r.category === '实证').length,
      热证: lungMeridianRules.filter(r => r.category === '热证').length,
      寒证: lungMeridianRules.filter(r => r.category === '寒证').length,
      虚实夹杂: lungMeridianRules.filter(r => r.category === '虚实夹杂').length,
    },
  };
}
