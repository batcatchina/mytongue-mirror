'use strict';

/**
 * 舌诊辨证规则决策表 v1.0
 * 基于主人的辨证规则树v2.0构建
 * 100%忠实于主人临床规则，不含AI自由发挥
 * CommonJS格式
 */

// ==================== 单特征辨证规则 ====================

// 2.1 舌色辨证规则表（6条）
const tongueColorRules = [
  {
    id: 'TC-001',
    name: '淡红舌辨证',
    conditions: { tongueColor: '淡红' },
    result: {
      syndrome: '正常/健康态',
      pathogenesis: '气血调和，阴阳平衡',
      treatment: '保健调理',
      mainPoints: ['足三里', '关元'],
      secondaryPoints: ['气海', '三阴交'],
      organLocation: ['脾胃'],
      priority: 'normal',
      weight: 10
    }
  },
  {
    id: 'TC-002',
    name: '淡白舌辨证',
    conditions: { tongueColor: '淡白' },
    result: {
      syndrome: '气血两虚证/阳虚证',
      pathogenesis: '阳气不足，血失温煦',
      treatment: '补益气血、温阳散寒',
      mainPoints: ['足三里', '气海'],
      secondaryPoints: ['三阴交', '命门'],
      organLocation: ['脾', '肾'],
      priority: 'high',
      weight: 30
    }
  },
  {
    id: 'TC-003',
    name: '红舌辨证',
    conditions: { tongueColor: '红' },
    result: {
      syndrome: '热证',
      pathogenesis: '里热炽盛，熏蒸于舌',
      treatment: '清热泻火/滋阴降火',
      mainPoints: ['大椎', '曲池'],
      secondaryPoints: ['合谷', '太溪'],
      organLocation: ['胃', '心'],
      priority: 'high',
      weight: 35
    }
  },
  {
    id: 'TC-004',
    name: '绛舌辨证',
    conditions: { tongueColor: '绛' },
    result: {
      syndrome: '热入营血证',
      pathogenesis: '热入营血，阴虚火旺',
      treatment: '清营凉血、养阴清热',
      mainPoints: ['曲泽', '膈俞'],
      secondaryPoints: ['委中', '太溪'],
      organLocation: ['心', '肝'],
      priority: 'critical',
      weight: 45
    }
  },
  {
    id: 'TC-005',
    name: '紫舌辨证',
    conditions: { tongueColor: '紫' },
    result: {
      syndrome: '血瘀证',
      pathogenesis: '寒凝血瘀/热盛血瘀',
      treatment: '活血化瘀、温经散寒',
      mainPoints: ['血海', '膈俞'],
      secondaryPoints: ['三阴交', '关元'],
      organLocation: ['肝', '心'],
      priority: 'high',
      weight: 40
    }
  },
  {
    id: 'TC-006',
    name: '青紫舌辨证',
    conditions: { tongueColor: '青紫' },
    result: {
      syndrome: '寒凝血瘀证',
      pathogenesis: '阳虚寒盛，肝郁血瘀',
      treatment: '温经活血、疏肝解郁',
      mainPoints: ['关元', '肝俞'],
      secondaryPoints: ['太冲', '血海'],
      organLocation: ['肝', '肾'],
      priority: 'critical',
      weight: 50
    }
  }
];

// 2.2 舌色分布辨证规则（6条）
const tongueColorDistributionRules = [
  {
    id: 'TCD-001',
    name: '舌尖红辨证',
    conditions: { 
      tongueColor: '红',
      regionFeatures: [{ region: '舌尖', color: '红' }]
    },
    result: {
      syndrome: '心火上炎证',
      pathogenesis: '心肺热盛，上炎舌端',
      treatment: '清心泻火',
      mainPoints: ['少府', '神门'],
      secondaryPoints: ['尺泽'],
      organLocation: ['心', '肺'],
      priority: 'high',
      weight: 38
    }
  },
  {
    id: 'TCD-002',
    name: '舌边红辨证',
    conditions: { 
      tongueColor: '红',
      regionFeatures: [{ region: '舌边', color: '红' }]
    },
    result: {
      syndrome: '肝火炽盛证',
      pathogenesis: '肝胆热盛，上炎舌侧',
      treatment: '清肝泻火',
      mainPoints: ['太冲', '行间'],
      secondaryPoints: ['阳陵泉'],
      organLocation: ['肝', '胆'],
      priority: 'high',
      weight: 38
    }
  },
  {
    id: 'TCD-003',
    name: '舌边青辨证',
    conditions: { 
      tongueColor: '青紫',
      regionFeatures: [{ region: '舌边', color: '青' }]
    },
    result: {
      syndrome: '肝郁血瘀证',
      pathogenesis: '气滞血瘀，肝经郁结',
      treatment: '疏肝解郁、活血化瘀',
      mainPoints: ['太冲', '血海'],
      secondaryPoints: ['三阴交'],
      organLocation: ['肝'],
      priority: 'high',
      weight: 42
    }
  },
  {
    id: 'TCD-004',
    name: '舌中红辨证',
    conditions: { 
      tongueColor: '红',
      regionFeatures: [{ region: '舌中', color: '红' }]
    },
    result: {
      syndrome: '胃火亢盛证',
      pathogenesis: '脾胃湿热，胃火上炎',
      treatment: '清胃泻火',
      mainPoints: ['内庭', '梁丘'],
      secondaryPoints: ['阴陵泉'],
      organLocation: ['胃', '脾'],
      priority: 'high',
      weight: 38
    }
  },
  {
    id: 'TCD-005',
    name: '舌根红辨证',
    conditions: { 
      tongueColor: '红',
      regionFeatures: [{ region: '舌根', color: '红' }]
    },
    result: {
      syndrome: '肾热下注证',
      pathogenesis: '下焦湿热/虚火下注',
      treatment: '清热利湿、滋阴降火',
      mainPoints: ['太溪', '照海'],
      secondaryPoints: ['肾俞'],
      organLocation: ['肾', '膀胱'],
      priority: 'medium',
      weight: 32
    }
  },
  {
    id: 'TCD-006',
    name: '全舌红辨证',
    conditions: { 
      tongueColor: '红',
      regionFeatures: [{ region: '全舌', color: '红' }]
    },
    result: {
      syndrome: '实热/阴虚火旺证',
      pathogenesis: '热盛全身/虚火上炎',
      treatment: '清热泻火/滋阴降火',
      mainPoints: ['大椎', '曲池'],
      secondaryPoints: ['合谷'],
      organLocation: ['心', '肝'],
      priority: 'high',
      weight: 35
    }
  }
];

// 2.3 舌形辨证规则表（7条）
const tongueShapeRules = [
  {
    id: 'TS-001',
    name: '胖大舌辨证',
    conditions: { tongueShape: '胖大' },
    result: {
      syndrome: '水湿停滞证',
      pathogenesis: '脾虚湿盛/阳虚水泛',
      treatment: '健脾祛湿、利水渗湿',
      mainPoints: ['足三里', '阴陵泉'],
      secondaryPoints: ['脾俞', '水分'],
      organLocation: ['脾', '肾'],
      priority: 'high',
      weight: 32
    }
  },
  {
    id: 'TS-002',
    name: '瘦薄舌辨证',
    conditions: { tongueShape: '瘦薄' },
    result: {
      syndrome: '阴血不足证',
      pathogenesis: '气血两虚/阴虚火旺',
      treatment: '益气养血、滋阴降火',
      mainPoints: ['三阴交', '太溪'],
      secondaryPoints: ['足三里', '照海'],
      organLocation: ['肝', '肾'],
      priority: 'high',
      weight: 35
    }
  },
  {
    id: 'TS-003',
    name: '裂纹舌辨证',
    conditions: { tongueShape: '正常', crack: true },
    result: {
      syndrome: '阴血亏虚证',
      pathogenesis: '阴虚内热/血虚失养',
      treatment: '滋阴养血、润燥生津',
      mainPoints: ['三阴交', '血海'],
      secondaryPoints: ['太溪', '照海'],
      organLocation: ['肝', '肾', '脾'],
      priority: 'medium',
      weight: 30
    }
  },
  {
    id: 'TS-004',
    name: '齿痕舌辨证',
    conditions: { tongueShape: '胖大', teethMark: true },
    result: {
      syndrome: '脾虚湿盛证',
      pathogenesis: '脾虚不运/水湿内停',
      treatment: '健脾益气、化湿和中',
      mainPoints: ['足三里', '阴陵泉'],
      secondaryPoints: ['脾俞', '公孙'],
      organLocation: ['脾', '胃'],
      priority: 'high',
      weight: 34
    }
  },
  {
    id: 'TS-005',
    name: '点刺舌辨证',
    conditions: { tongueShape: '正常', crack: true },
    result: {
      syndrome: '热盛血瘀证',
      pathogenesis: '脏腑热极/血分郁热',
      treatment: '清热凉血、活血化瘀',
      mainPoints: ['大椎', '曲泽'],
      secondaryPoints: ['委中', '膈俞'],
      organLocation: ['心', '肝'],
      priority: 'high',
      weight: 38
    }
  },
  {
    id: 'TS-006',
    name: '老舌辨证',
    conditions: { tongueShape: '正常' },
    result: {
      syndrome: '实证',
      pathogenesis: '热结/痰凝/瘀阻',
      treatment: '泻实攻邪',
      mainPoints: ['合谷', '太冲'],
      secondaryPoints: ['曲池', '丰隆'],
      organLocation: ['肝', '胃'],
      priority: 'medium',
      weight: 25
    }
  },
  {
    id: 'TS-007',
    name: '嫩舌辨证',
    conditions: { tongueShape: '瘦薄' },
    result: {
      syndrome: '虚证',
      pathogenesis: '气虚/阳虚/血虚',
      treatment: '补益正气',
      mainPoints: ['足三里', '气海'],
      secondaryPoints: ['三阴交', '脾俞'],
      organLocation: ['脾', '肾'],
      priority: 'medium',
      weight: 25
    }
  }
];

// 2.4 苔色辨证规则表（8条）
const coatingColorRules = [
  {
    id: 'CC-001',
    name: '薄白苔辨证',
    conditions: { coatingColor: '薄白' },
    result: {
      syndrome: '表证/轻证',
      pathogenesis: '风寒束表/胃气未伤',
      treatment: '解表散寒/扶正调理',
      mainPoints: ['列缺', '合谷'],
      secondaryPoints: ['风池', '足三里'],
      organLocation: ['肺', '胃'],
      priority: 'normal',
      weight: 15
    }
  },
  {
    id: 'CC-002',
    name: '白厚苔辨证',
    conditions: { coatingColor: '白厚' },
    result: {
      syndrome: '里寒/湿浊证',
      pathogenesis: '寒湿内停/痰湿壅盛',
      treatment: '温阳化湿/健脾燥湿',
      mainPoints: ['关元', '阴陵泉'],
      secondaryPoints: ['脾俞', '丰隆'],
      organLocation: ['脾', '肾'],
      priority: 'medium',
      weight: 28
    }
  },
  {
    id: 'CC-003',
    name: '白腻苔辨证',
    conditions: { coatingColor: '白厚', coatingTexture: '厚' },
    result: {
      syndrome: '痰湿内蕴证',
      pathogenesis: '脾阳不振/湿浊内停',
      treatment: '化痰祛湿、健脾理气',
      mainPoints: ['中脘', '丰隆'],
      secondaryPoints: ['阴陵泉', '足三里'],
      organLocation: ['脾', '胃'],
      priority: 'high',
      weight: 35
    }
  },
  {
    id: 'CC-004',
    name: '薄黄苔辨证',
    conditions: { coatingColor: '黄', coatingTexture: '薄' },
    result: {
      syndrome: '表邪化热证',
      pathogenesis: '表邪入里/热势轻浅',
      treatment: '疏风清热、解表透邪',
      mainPoints: ['曲池', '合谷'],
      secondaryPoints: ['外关', '风池'],
      organLocation: ['肺', '胃'],
      priority: 'medium',
      weight: 25
    }
  },
  {
    id: 'CC-005',
    name: '黄厚苔辨证',
    conditions: { coatingColor: '黄', coatingTexture: '厚' },
    result: {
      syndrome: '里热炽盛证',
      pathogenesis: '胃肠实热/湿热蕴结',
      treatment: '清热泻火、通腑导滞',
      mainPoints: ['天枢', '内庭'],
      secondaryPoints: ['曲池', '上巨虚'],
      organLocation: ['胃', '大肠'],
      priority: 'high',
      weight: 38
    }
  },
  {
    id: 'CC-006',
    name: '黄腻苔辨证',
    conditions: { coatingColor: '黄', coatingTexture: '厚' },
    result: {
      syndrome: '湿热内蕴证',
      pathogenesis: '脾胃湿热/肝胆湿热',
      treatment: '清热化湿、健脾和胃',
      mainPoints: ['阴陵泉', '太冲'],
      secondaryPoints: ['中脘', '阳陵泉'],
      organLocation: ['脾', '肝', '胆'],
      priority: 'high',
      weight: 40
    }
  },
  {
    id: 'CC-007',
    name: '灰黑干苔辨证',
    conditions: { coatingColor: '灰黑', coatingMoisture: '燥' },
    result: {
      syndrome: '热极伤阴证',
      pathogenesis: '阴液枯竭/热毒炽盛',
      treatment: '清热解毒、养阴生津',
      mainPoints: ['太溪', '照海'],
      secondaryPoints: ['曲泽', '大椎放血'],
      organLocation: ['肾', '心'],
      priority: 'critical',
      weight: 55
    }
  },
  {
    id: 'CC-008',
    name: '灰黑滑苔辨证',
    conditions: { coatingColor: '灰黑', coatingMoisture: '润' },
    result: {
      syndrome: '阳虚寒盛证',
      pathogenesis: '脾肾阳虚/寒湿内盛',
      treatment: '温阳散寒、健脾化湿',
      mainPoints: ['关元', '命门'],
      secondaryPoints: ['神阙灸', '肾俞'],
      organLocation: ['脾', '肾'],
      priority: 'critical',
      weight: 50
    }
  }
];

// 2.5 苔质辨证规则表（7条）
const coatingTextureRules = [
  {
    id: 'CT-001',
    name: '薄苔辨证',
    conditions: { coatingTexture: '薄' },
    result: {
      syndrome: '病轻证',
      pathogenesis: '胃气未伤/邪气轻浅',
      treatment: '轻浅调理',
      mainPoints: ['足三里', '气海'],
      secondaryPoints: ['三阴交'],
      organLocation: ['脾胃'],
      priority: 'normal',
      weight: 12
    }
  },
  {
    id: 'CT-002',
    name: '厚苔辨证',
    conditions: { coatingTexture: '厚' },
    result: {
      syndrome: '里实证',
      pathogenesis: '邪盛入里/积滞内停',
      treatment: '通腑导滞',
      mainPoints: ['中脘', '天枢'],
      secondaryPoints: ['丰隆', '上巨虚'],
      organLocation: ['胃', '大肠'],
      priority: 'medium',
      weight: 28
    }
  },
  {
    id: 'CT-003',
    name: '润苔辨证',
    conditions: { coatingMoisture: '润' },
    result: {
      syndrome: '津液未伤证',
      pathogenesis: '病轻/正常/寒湿',
      treatment: '辨证调理',
      mainPoints: ['中脘', '足三里'],
      secondaryPoints: ['阴陵泉', '丰隆'],
      organLocation: ['肺', '胃'],
      priority: 'normal',
      weight: 10
    }
  },
  {
    id: 'CT-004',
    name: '燥苔辨证',
    conditions: { coatingMoisture: '燥' },
    result: {
      syndrome: '津液亏损证',
      pathogenesis: '热盛/阴虚/阳虚津不上承',
      treatment: '生津润燥/滋阴清热',
      mainPoints: ['太溪', '照海'],
      secondaryPoints: ['三阴交', '承浆'],
      organLocation: ['肾', '肺'],
      priority: 'high',
      weight: 35
    }
  },
  {
    id: 'CT-005',
    name: '腻苔辨证',
    conditions: { coatingTexture: '厚' },
    result: {
      syndrome: '痰湿内蕴证',
      pathogenesis: '湿浊/痰饮/食积',
      treatment: '化湿祛痰',
      mainPoints: ['中脘', '丰隆'],
      secondaryPoints: ['阴陵泉', '足三里'],
      organLocation: ['脾', '胃'],
      priority: 'high',
      weight: 35
    }
  },
  {
    id: 'CT-006',
    name: '腐苔辨证',
    conditions: { coatingTexture: '厚' },
    result: {
      syndrome: '食积/痰浊证',
      pathogenesis: '胃气实/邪气盛',
      treatment: '消食导滞、化痰祛浊',
      mainPoints: ['中脘', '建里'],
      secondaryPoints: ['足三里', '内庭'],
      organLocation: ['胃', '脾'],
      priority: 'medium',
      weight: 30
    }
  },
  {
    id: 'CT-007',
    name: '剥落苔辨证',
    conditions: { coatingColor: '剥落' },
    result: {
      syndrome: '胃阴/胃气大伤证',
      pathogenesis: '阴虚/气阴两虚',
      treatment: '养阴益胃',
      mainPoints: ['三阴交', '太溪'],
      secondaryPoints: ['胃俞', '足三里'],
      organLocation: ['胃', '脾'],
      priority: 'high',
      weight: 40
    }
  }
];

// 2.6 舌态辨证规则表（6条）
const tongueStateRules = [
  {
    id: 'TST-001',
    name: '颤动舌辨证',
    conditions: { tongueState: '颤动' },
    result: {
      syndrome: '肝风内动证',
      pathogenesis: '血虚动风/热极生风/阴虚动风',
      treatment: '平肝熄风、养血柔肝',
      mainPoints: ['太冲', '风池'],
      secondaryPoints: ['辨证配穴'],
      organLocation: ['肝'],
      priority: 'critical',
      weight: 48
    }
  },
  {
    id: 'TST-002',
    name: '歪斜舌辨证',
    conditions: { tongueState: '歪斜' },
    result: {
      syndrome: '风中经络证',
      pathogenesis: '肝风夹痰/气虚血瘀',
      treatment: '祛风化痰、活血通络',
      mainPoints: ['颊车', '地仓', '合谷'],
      secondaryPoints: ['太冲', '丰隆'],
      organLocation: ['肝', '胃'],
      priority: 'critical',
      weight: 50
    }
  },
  {
    id: 'TST-003',
    name: '萎软舌辨证',
    conditions: { tongueState: '痿软' },
    result: {
      syndrome: '气血亏极证',
      pathogenesis: '气血两虚/阴虚火旺/热盛伤津',
      treatment: '补益气血、滋阴润燥',
      mainPoints: ['足三里', '三阴交'],
      secondaryPoints: ['太溪', '百会'],
      organLocation: ['脾', '肾'],
      priority: 'critical',
      weight: 45
    }
  },
  {
    id: 'TST-004',
    name: '强硬舌辨证',
    conditions: { tongueState: '强硬' },
    result: {
      syndrome: '热闭/风痰证',
      pathogenesis: '热入心包/风痰阻络',
      treatment: '醒脑开窍、清热化痰',
      mainPoints: ['水沟', '内关'],
      secondaryPoints: ['丰隆', '百会'],
      organLocation: ['心', '脑'],
      priority: 'critical',
      weight: 55
    }
  },
  {
    id: 'TST-005',
    name: '短缩舌辨证',
    conditions: { tongueState: '强硬' },
    result: {
      syndrome: '危重证',
      pathogenesis: '寒凝筋脉/热极伤津/痰浊内阻',
      treatment: '回阳救逆/清热养阴/豁痰开窍',
      mainPoints: ['廉泉', '通里'],
      secondaryPoints: ['辨证配穴'],
      organLocation: ['心', '肾'],
      priority: 'critical',
      weight: 60
    }
  },
  {
    id: 'TST-006',
    name: '吐弄舌辨证',
    conditions: { tongueState: '颤动' },
    result: {
      syndrome: '心脾热盛证',
      pathogenesis: '心火亢盛/脾热上蒸',
      treatment: '清心泻火、清热健脾',
      mainPoints: ['少府', '大都'],
      secondaryPoints: ['神门', '内庭'],
      organLocation: ['心', '脾'],
      priority: 'medium',
      weight: 32
    }
  }
];

// ==================== 复合特征辨证规则 ====================

// 3.1 舌质+舌苔复合辨证（15条）
const tongueBodyCoatingRules = [
  {
    id: 'TBC-001',
    name: '淡白舌+白苔',
    conditions: { tongueColor: '淡白', coatingColor: '薄白' },
    result: {
      syndrome: '气血两虚证',
      pathogenesis: '阳气不足，血失温煦',
      treatment: '益气养血、温阳散寒',
      mainPoints: ['足三里', '三阴交'],
      secondaryPoints: ['气海', '关元'],
      organLocation: ['脾', '胃'],
      priority: 'high',
      weight: 42
    }
  },
  {
    id: 'TBC-002',
    name: '淡白舌+白腻苔',
    conditions: { tongueColor: '淡白', coatingColor: '白厚', coatingTexture: '厚' },
    result: {
      syndrome: '脾虚湿盛证',
      pathogenesis: '脾失健运，湿浊内停',
      treatment: '健脾祛湿、利水渗湿',
      mainPoints: ['足三里', '阴陵泉'],
      secondaryPoints: ['脾俞', '中脘'],
      organLocation: ['脾', '胃'],
      priority: 'high',
      weight: 45
    }
  },
  {
    id: 'TBC-003',
    name: '淡白舌+胖大',
    conditions: { tongueColor: '淡白', tongueShape: '胖大' },
    result: {
      syndrome: '脾肾阳虚证',
      pathogenesis: '阳气衰微，水湿内停',
      treatment: '温补脾肾、利水消肿',
      mainPoints: ['关元', '命门'],
      secondaryPoints: ['肾俞', '足三里'],
      organLocation: ['脾', '肾'],
      priority: 'high',
      weight: 48
    }
  },
  {
    id: 'TBC-004',
    name: '淡白舌+齿痕',
    conditions: { tongueColor: '淡白', teethMark: true },
    result: {
      syndrome: '脾虚气弱证',
      pathogenesis: '脾气亏虚，运化失司',
      treatment: '健脾益气、和中调胃',
      mainPoints: ['足三里', '脾俞'],
      secondaryPoints: ['公孙', '中脘'],
      organLocation: ['脾', '胃'],
      priority: 'high',
      weight: 46
    }
  },
  {
    id: 'TBC-005',
    name: '淡白舌+瘦薄',
    conditions: { tongueColor: '淡白', tongueShape: '瘦薄' },
    result: {
      syndrome: '气血两虚证',
      pathogenesis: '气血不足，失于濡养',
      treatment: '补益气血、健脾养胃',
      mainPoints: ['三阴交', '足三里'],
      secondaryPoints: ['气海', '血海'],
      organLocation: ['脾', '胃', '肝'],
      priority: 'high',
      weight: 48
    }
  },
  {
    id: 'TBC-006',
    name: '红舌+黄苔',
    conditions: { tongueColor: '红', coatingColor: '黄' },
    result: {
      syndrome: '实热证',
      pathogenesis: '里热炽盛，熏灼舌体',
      treatment: '清热泻火、凉血解毒',
      mainPoints: ['大椎', '曲池'],
      secondaryPoints: ['合谷', '内庭'],
      organLocation: ['胃', '大肠'],
      priority: 'high',
      weight: 45
    }
  },
  {
    id: 'TBC-007',
    name: '红舌+黄腻苔',
    conditions: { tongueColor: '红', coatingColor: '黄', coatingTexture: '厚' },
    result: {
      syndrome: '湿热蕴结证',
      pathogenesis: '湿热中阻，脾胃运化失常',
      treatment: '清热化湿、健脾和胃',
      mainPoints: ['中脘', '阴陵泉'],
      secondaryPoints: ['天枢', '阳陵泉'],
      organLocation: ['脾', '胃', '肝'],
      priority: 'high',
      weight: 50
    }
  },
  {
    id: 'TBC-008',
    name: '红舌+薄黄苔',
    conditions: { tongueColor: '红', coatingColor: '黄', coatingTexture: '薄' },
    result: {
      syndrome: '热在气分证',
      pathogenesis: '表邪入里，热势轻浅',
      treatment: '清热透邪、疏风散热',
      mainPoints: ['曲池', '外关'],
      secondaryPoints: ['合谷', '风池'],
      organLocation: ['肺', '胃'],
      priority: 'medium',
      weight: 38
    }
  },
  {
    id: 'TBC-009',
    name: '红绛舌+无苔',
    conditions: { tongueColor: '绛', coatingColor: '剥落' },
    result: {
      syndrome: '阴虚火旺证',
      pathogenesis: '阴液亏耗，虚火上炎',
      treatment: '滋阴降火、养阴清热',
      mainPoints: ['太溪', '照海'],
      secondaryPoints: ['三阴交', '复溜'],
      organLocation: ['肾', '心'],
      priority: 'critical',
      weight: 55
    }
  },
  {
    id: 'TBC-010',
    name: '红绛舌+黄燥苔',
    conditions: { tongueColor: '绛', coatingColor: '灰黑', coatingMoisture: '燥' },
    result: {
      syndrome: '热盛伤津证',
      pathogenesis: '热入营血，津液大伤',
      treatment: '清营凉血、生津润燥',
      mainPoints: ['曲泽', '膈俞'],
      secondaryPoints: ['太溪', '照海'],
      organLocation: ['心', '肝', '肾'],
      priority: 'critical',
      weight: 58
    }
  },
  {
    id: 'TBC-011',
    name: '绛舌+焦黑苔',
    conditions: { tongueColor: '绛', coatingColor: '灰黑' },
    result: {
      syndrome: '热毒炽盛证',
      pathogenesis: '热极阴竭，毒火内盛',
      treatment: '清热解毒、凉血救阴',
      mainPoints: ['大椎', '曲泽放血'],
      secondaryPoints: ['十宣放血'],
      organLocation: ['心', '肝'],
      priority: 'critical',
      weight: 60
    }
  },
  {
    id: 'TBC-012',
    name: '紫舌+白苔',
    conditions: { tongueColor: '紫', coatingColor: '薄白' },
    result: {
      syndrome: '寒凝血瘀证',
      pathogenesis: '寒凝经脉，血行不畅',
      treatment: '温经活血、散寒化瘀',
      mainPoints: ['关元', '血海'],
      secondaryPoints: ['膈俞', '三阴交'],
      organLocation: ['肝', '心'],
      priority: 'high',
      weight: 48
    }
  },
  {
    id: 'TBC-013',
    name: '紫舌+黄苔',
    conditions: { tongueColor: '紫', coatingColor: '黄' },
    result: {
      syndrome: '热结血瘀证',
      pathogenesis: '热结肠道，瘀热互结',
      treatment: '清热化瘀、通腑散结',
      mainPoints: ['天枢', '上巨虚'],
      secondaryPoints: ['曲池', '膈俞'],
      organLocation: ['大肠', '肝'],
      priority: 'high',
      weight: 50
    }
  },
  {
    id: 'TBC-014',
    name: '紫舌+瘀斑',
    conditions: { tongueColor: '紫', tongueShape: '正常', crack: true },
    result: {
      syndrome: '气滞血瘀证',
      pathogenesis: '气机郁滞，瘀血内停',
      treatment: '行气活血、化瘀通络',
      mainPoints: ['太冲', '血海'],
      secondaryPoints: ['膈俞', '三阴交'],
      organLocation: ['肝', '心'],
      priority: 'high',
      weight: 48
    }
  },
  {
    id: 'TBC-015',
    name: '青舌+白苔',
    conditions: { tongueColor: '青紫', coatingColor: '薄白' },
    result: {
      syndrome: '阳虚寒凝证',
      pathogenesis: '阳气衰微，寒凝血瘀',
      treatment: '温阳散寒、活血化瘀',
      mainPoints: ['关元', '命门'],
      secondaryPoints: ['神阙灸', '血海'],
      organLocation: ['肾', '肝'],
      priority: 'critical',
      weight: 52
    }
  }
];

// 3.2 舌形+舌苔复合辨证（8条）
const tongueShapeCoatingRules = [
  {
    id: 'TSC-001',
    name: '胖大舌+齿痕+白腻苔',
    conditions: { tongueShape: '胖大', teethMark: true, coatingColor: '白厚', coatingTexture: '厚' },
    result: {
      syndrome: '脾虚湿盛证',
      pathogenesis: '脾失健运，湿浊内停',
      treatment: '健脾祛湿、利水渗湿',
      mainPoints: ['足三里', '阴陵泉'],
      secondaryPoints: ['脾俞', '水分'],
      organLocation: ['脾', '胃'],
      priority: 'high',
      weight: 50
    }
  },
  {
    id: 'TSC-002',
    name: '胖大舌+水滑苔',
    conditions: { tongueShape: '胖大', coatingColor: '薄白', coatingMoisture: '润' },
    result: {
      syndrome: '阳虚水泛证',
      pathogenesis: '阳气不足，水湿内停',
      treatment: '温阳化气、利水消肿',
      mainPoints: ['关元', '肾俞'],
      secondaryPoints: ['命门', '水分'],
      organLocation: ['肾', '脾'],
      priority: 'high',
      weight: 48
    }
  },
  {
    id: 'TSC-003',
    name: '瘦薄舌+红绛+无苔',
    conditions: { tongueShape: '瘦薄', tongueColor: '绛', coatingColor: '剥落' },
    result: {
      syndrome: '阴虚火旺证',
      pathogenesis: '阴液亏耗，虚火上炎',
      treatment: '滋阴降火、养阴清热',
      mainPoints: ['太溪', '照海'],
      secondaryPoints: ['三阴交', '复溜'],
      organLocation: ['肾', '心'],
      priority: 'critical',
      weight: 55
    }
  },
  {
    id: 'TSC-004',
    name: '瘦薄舌+淡白+薄白苔',
    conditions: { tongueShape: '瘦薄', tongueColor: '淡白', coatingColor: '薄白' },
    result: {
      syndrome: '气血两虚证',
      pathogenesis: '气血不足，失于濡养',
      treatment: '补益气血、健脾养胃',
      mainPoints: ['三阴交', '足三里'],
      secondaryPoints: ['气海', '血海'],
      organLocation: ['脾', '胃', '肝'],
      priority: 'high',
      weight: 48
    }
  },
  {
    id: 'TSC-005',
    name: '裂纹舌+红绛+少苔',
    conditions: { tongueShape: '正常', crack: true, tongueColor: '绛', coatingColor: '剥落' },
    result: {
      syndrome: '阴虚内热证',
      pathogenesis: '阴液亏耗，虚火灼津',
      treatment: '滋阴清热、养阴生津',
      mainPoints: ['太溪', '三阴交'],
      secondaryPoints: ['照海', '血海'],
      organLocation: ['肾', '肝'],
      priority: 'high',
      weight: 50
    }
  },
  {
    id: 'TSC-006',
    name: '裂纹舌+淡白+薄苔',
    conditions: { tongueShape: '正常', crack: true, tongueColor: '淡白', coatingColor: '薄白' },
    result: {
      syndrome: '血虚失养证',
      pathogenesis: '血液亏虚，舌面失养',
      treatment: '养血生津、健脾益气',
      mainPoints: ['血海', '三阴交'],
      secondaryPoints: ['足三里', '脾俞'],
      organLocation: ['肝', '脾'],
      priority: 'medium',
      weight: 42
    }
  },
  {
    id: 'TSC-007',
    name: '点刺舌+黄苔',
    conditions: { tongueShape: '正常', crack: true, coatingColor: '黄' },
    result: {
      syndrome: '热入营血证',
      pathogenesis: '热入营血，血分郁热',
      treatment: '清热凉血、活血化瘀',
      mainPoints: ['大椎', '曲泽'],
      secondaryPoints: ['委中', '膈俞'],
      organLocation: ['心', '肝'],
      priority: 'high',
      weight: 50
    }
  },
  {
    id: 'TSC-008',
    name: '点刺舌+绛舌',
    conditions: { tongueShape: '正常', crack: true, tongueColor: '绛' },
    result: {
      syndrome: '血热瘀滞证',
      pathogenesis: '血分热盛，瘀血内停',
      treatment: '凉血活血、清热解毒',
      mainPoints: ['曲泽', '膈俞'],
      secondaryPoints: ['委中', '血海'],
      organLocation: ['心', '肝'],
      priority: 'high',
      weight: 52
    }
  }
];

// 3.3 舌态+舌质复合辨证（8条）
const tongueStateBodyRules = [
  {
    id: 'TSB-001',
    name: '颤动舌+淡白',
    conditions: { tongueState: '颤动', tongueColor: '淡白' },
    result: {
      syndrome: '血虚动风证',
      pathogenesis: '血液亏虚，肝风内动',
      treatment: '养血熄风、柔肝止痉',
      mainPoints: ['血海', '膈俞'],
      secondaryPoints: ['太冲', '风池'],
      organLocation: ['肝', '血'],
      priority: 'critical',
      weight: 55
    }
  },
  {
    id: 'TSB-002',
    name: '颤动舌+红绛',
    conditions: { tongueState: '颤动', tongueColor: '绛' },
    result: {
      syndrome: '热极生风证',
      pathogenesis: '热盛伤津，肝风内动',
      treatment: '清热熄风、凉血解毒',
      mainPoints: ['大椎', '曲池'],
      secondaryPoints: ['太冲', '风府'],
      organLocation: ['肝', '心'],
      priority: 'critical',
      weight: 58
    }
  },
  {
    id: 'TSB-003',
    name: '颤动舌+少苔',
    conditions: { tongueState: '颤动', coatingColor: '剥落' },
    result: {
      syndrome: '阴虚动风证',
      pathogenesis: '阴液亏虚，肝风内动',
      treatment: '滋阴熄风、养血柔肝',
      mainPoints: ['太溪', '照海'],
      secondaryPoints: ['太冲', '风池'],
      organLocation: ['肝', '肾'],
      priority: 'critical',
      weight: 55
    }
  },
  {
    id: 'TSB-004',
    name: '萎软舌+淡白',
    conditions: { tongueState: '痿软', tongueColor: '淡白' },
    result: {
      syndrome: '气血两虚证',
      pathogenesis: '气血大亏，筋脉失养',
      treatment: '大补元气、养血生津',
      mainPoints: ['足三里', '气海'],
      secondaryPoints: ['三阴交', '百会'],
      organLocation: ['脾', '胃'],
      priority: 'critical',
      weight: 52
    }
  },
  {
    id: 'TSB-005',
    name: '萎软舌+红绛',
    conditions: { tongueState: '痿软', tongueColor: '绛' },
    result: {
      syndrome: '阴虚至极证',
      pathogenesis: '真阴枯竭，虚火内扰',
      treatment: '峻补真阴、引火归元',
      mainPoints: ['太溪', '照海'],
      secondaryPoints: ['三阴交', '涌泉'],
      organLocation: ['肾', '心'],
      priority: 'critical',
      weight: 58
    }
  },
  {
    id: 'TSB-006',
    name: '强硬舌+红绛',
    conditions: { tongueState: '强硬', tongueColor: '绛' },
    result: {
      syndrome: '热闭心包证',
      pathogenesis: '热入心包，神昏谵语',
      treatment: '清心开窍、凉血解毒',
      mainPoints: ['水沟', '内关'],
      secondaryPoints: ['曲泽', '十宣'],
      organLocation: ['心', '脑'],
      priority: 'critical',
      weight: 60
    }
  },
  {
    id: 'TSB-007',
    name: '强硬舌+胖大苔厚',
    conditions: { tongueState: '强硬', tongueShape: '胖大', coatingTexture: '厚' },
    result: {
      syndrome: '风痰阻络证',
      pathogenesis: '风痰壅盛，阻滞经络',
      treatment: '化痰熄风、通络开窍',
      mainPoints: ['丰隆', '中脘'],
      secondaryPoints: ['风池', '百会'],
      organLocation: ['胃', '脑'],
      priority: 'critical',
      weight: 55
    }
  },
  {
    id: 'TSB-008',
    name: '歪斜舌+紫暗',
    conditions: { tongueState: '歪斜', tongueColor: '紫' },
    result: {
      syndrome: '风痰瘀阻证',
      pathogenesis: '风痰夹瘀，阻滞经络',
      treatment: '祛风化痰、活血通络',
      mainPoints: ['颊车', '地仓'],
      secondaryPoints: ['丰隆', '血海'],
      organLocation: ['肝', '胃'],
      priority: 'critical',
      weight: 58
    }
  }
];

// 3.4 三维综合辨证（7条核心规则）- 最高权重
const threeDimensionalRules = [
  {
    id: '3D-001',
    name: '淡白胖大+白腻苔综合辨证',
    conditions: { tongueColor: '淡白', tongueShape: '胖大', coatingColor: '白厚', coatingTexture: '厚' },
    result: {
      syndrome: '脾虚湿盛证',
      pathogenesis: '脾失健运，湿浊内停，气化失司',
      treatment: '健脾祛湿、利水渗湿',
      mainPoints: ['足三里', '阴陵泉', '脾俞'],
      secondaryPoints: ['中脘', '水分'],
      organLocation: ['脾', '胃'],
      priority: 'high',
      weight: 70
    }
  },
  {
    id: '3D-002',
    name: '淡白瘦薄+薄白苔+萎软综合辨证',
    conditions: { tongueColor: '淡白', tongueShape: '瘦薄', coatingColor: '薄白', tongueState: '痿软' },
    result: {
      syndrome: '气血两虚证',
      pathogenesis: '气血不足，筋脉失养，脏腑亏虚',
      treatment: '补益气血、健脾养胃',
      mainPoints: ['足三里', '三阴交', '气海'],
      secondaryPoints: ['血海', '百会'],
      organLocation: ['脾', '胃', '肝'],
      priority: 'critical',
      weight: 75
    }
  },
  {
    id: '3D-003',
    name: '红绛少津+黄燥+颤动综合辨证',
    conditions: { tongueColor: '绛', tongueState: '颤动', coatingColor: '灰黑', coatingMoisture: '燥' },
    result: {
      syndrome: '热盛动风证',
      pathogenesis: '热入营血，津液大伤，肝风内动',
      treatment: '清热熄风、凉血生津',
      mainPoints: ['大椎', '曲池', '太冲', '风池'],
      secondaryPoints: ['曲泽', '照海'],
      organLocation: ['肝', '心', '肾'],
      priority: 'critical',
      weight: 85
    }
  },
  {
    id: '3D-004',
    name: '红绛裂纹+剥落+萎软综合辨证',
    conditions: { tongueColor: '绛', tongueState: '痿软', coatingColor: '剥落', tongueShape: '正常' },
    result: {
      syndrome: '阴虚火旺证',
      pathogenesis: '阴液亏耗，虚火灼津，筋脉失养',
      treatment: '滋阴降火、养阴生津',
      mainPoints: ['太溪', '照海', '三阴交'],
      secondaryPoints: ['复溜', '涌泉'],
      organLocation: ['肾', '心', '肝'],
      priority: 'critical',
      weight: 80
    }
  },
  {
    id: '3D-005',
    name: '紫暗瘀斑+厚腻综合辨证',
    conditions: { tongueColor: '紫', coatingColor: '白厚', coatingTexture: '厚', tongueShape: '正常' },
    result: {
      syndrome: '痰瘀互结证',
      pathogenesis: '气滞血瘀，痰凝互结，阻滞经络',
      treatment: '活血化瘀、化痰散结',
      mainPoints: ['血海', '膈俞', '丰隆', '阴陵泉'],
      secondaryPoints: ['三阴交', '中脘'],
      organLocation: ['肝', '脾', '胃'],
      priority: 'critical',
      weight: 75
    }
  },
  {
    id: '3D-006',
    name: '紫暗水滑+灰黑苔综合辨证',
    conditions: { tongueColor: '紫', coatingColor: '灰黑', coatingMoisture: '润' },
    result: {
      syndrome: '阳虚寒凝证',
      pathogenesis: '脾肾阳虚，寒湿内盛，气血凝滞',
      treatment: '温阳散寒、健脾化湿',
      mainPoints: ['关元', '命门', '神阙灸'],
      secondaryPoints: ['肾俞', '脾俞'],
      organLocation: ['肾', '脾'],
      priority: 'critical',
      weight: 80
    }
  },
  {
    id: '3D-007',
    name: '红边黄腻+黄厚腻+歪斜综合辨证',
    conditions: { tongueColor: '红', coatingColor: '黄', coatingTexture: '厚', tongueState: '歪斜' },
    result: {
      syndrome: '肝胆湿热+风痰证',
      pathogenesis: '湿热蕴结肝胆，热盛生风，痰湿互结',
      treatment: '清肝利胆、化痰熄风',
      mainPoints: ['太冲', '阳陵泉', '丰隆', '中脘'],
      secondaryPoints: ['行间', '胆俞'],
      organLocation: ['肝', '胆', '胃'],
      priority: 'critical',
      weight: 85
    }
  }
];

// ==================== 会穴郗穴配穴规则 ====================

const huiXiRules = [
  { id: 'HX-001', tongueFeature: '舌淡胖+齿痕+苔白腻', pathogenesis: '脾虚湿盛（气虚+湿）', huiPoint: '膻中（气会）', xiPoint: '地机（脾经）', explanation: '补气健脾化湿' },
  { id: 'HX-002', tongueFeature: '舌紫暗+瘀斑', pathogenesis: '血瘀证', huiPoint: '膈俞（血会）', xiPoint: '郄门（心包经）', explanation: '活血化瘀' },
  { id: 'HX-003', tongueFeature: '舌红+颤动', pathogenesis: '肝风内动（筋病）', huiPoint: '阳陵泉（筋会）', xiPoint: '中都（肝经）', explanation: '平肝熄风舒筋' },
  { id: 'HX-004', tongueFeature: '舌痿软+淡白', pathogenesis: '气血阴液亏极', huiPoint: '绝骨（髓会）+膻中（气会）', xiPoint: '水泉（肾经）', explanation: '填精补髓益气' },
  { id: 'HX-005', tongueFeature: '舌强硬+绛', pathogenesis: '热入心包（脉病）', huiPoint: '太渊（脉会）', xiPoint: '郄门（心包经）', explanation: '清心开窍通脉' },
  { id: 'HX-006', tongueFeature: '舌边红+苔黄', pathogenesis: '肝胆湿热（腑病）', huiPoint: '中脘（腑会）', xiPoint: '外丘（胆经）', explanation: '清利肝胆湿热' },
  { id: 'HX-007', tongueFeature: '舌瘦薄+红', pathogenesis: '阴虚火旺（脏病）', huiPoint: '章门（脏会）', xiPoint: '水泉（肾经）', explanation: '滋阴降火' }
];

// ==================== 特殊舌象特效穴 ====================

const specialAcupointRules = [
  { tongueType: '全舌红绛', acupoints: ['曲泽', '委中'], effect: '清营凉血', application: '点刺放血，热入营血' },
  { tongueType: '裂纹舌', acupoints: ['三阴交', '血海'], effect: '养血生津', application: '补法，滋阴养血' },
  { tongueType: '胖大齿痕', acupoints: ['阴陵泉', '水分'], effect: '利水渗湿', application: '健脾利湿消肿' },
  { tongueType: '点刺舌', acupoints: ['大椎', '曲池'], effect: '清热泻火', application: '刺血拔罐，清气分热' },
  { tongueType: '颤动舌', acupoints: ['风池', '太冲'], effect: '平肝熄风', application: '平补平泻，肝风内动' },
  { tongueType: '歪斜舌', acupoints: ['颊车', '地仓'], effect: '祛风通络', application: '局部取穴，面瘫必用' },
  { tongueType: '萎软舌', acupoints: ['百会', '气海'], effect: '升阳举陷', application: '补法，重症虚证' },
  { tongueType: '强硬舌', acupoints: ['水沟', '内关'], effect: '醒脑开窍', application: '泻法，热闭痰蒙' },
  { tongueType: '短缩舌', acupoints: ['廉泉', '通里'], effect: '急救开音', application: '舌三针，急危重症' },
  { tongueType: '吐弄舌', acupoints: ['少府', '大都'], effect: '清心泻脾', application: '荥穴，清热' }
];

// ==================== 脏腑分区选穴 ====================

const regionAcupointRules = [
  { region: '舌尖', feature: '舌尖红/溃疡/点刺', organ: '心火', acupoints: ['少府', '神门'], explanation: '心经荥穴、原穴' },
  { region: '舌尖', feature: '舌尖凹陷/颤动', organ: '心虚', acupoints: ['通里', '内关'], explanation: '心经络穴、络穴' },
  { region: '舌边', feature: '舌边红/齿痕', organ: '肝郁/脾虚', acupoints: ['太冲', '公孙'], explanation: '疏肝解郁、健脾' },
  { region: '舌边', feature: '舌边青紫/瘀斑', organ: '肝郁血瘀', acupoints: ['血海', '三阴交'], explanation: '活血化瘀' },
  { region: '舌中', feature: '舌中裂纹/溃疡', organ: '胃热', acupoints: ['内庭', '梁丘'], explanation: '清胃泻火' },
  { region: '舌中', feature: '舌中苔厚腻', organ: '脾胃湿浊', acupoints: ['中脘', '阴陵泉'], explanation: '健脾化湿' },
  { region: '舌根', feature: '舌根苔厚/灰黑', organ: '肾虚/下焦湿', acupoints: ['太溪', '肾俞'], explanation: '补肾利湿' }
];

// ==================== 导出所有规则 ====================

const allRuleCategories = {
  threeDimensional: threeDimensionalRules,
  tongueStateBody: tongueStateBodyRules,
  tongueBodyCoating: tongueBodyCoatingRules,
  tongueShapeCoating: tongueShapeCoatingRules,
  tongueState: tongueStateRules,
  tongueColor: tongueColorRules,
  tongueColorDistribution: tongueColorDistributionRules,
  tongueShape: tongueShapeRules,
  coatingColor: coatingColorRules,
  coatingTexture: coatingTextureRules,
};

// 获取规则总数
function getRuleCount() {
  return Object.values(allRuleCategories).reduce((sum, rules) => sum + rules.length, 0);
}

// 获取所有证型
function getAllSyndromes() {
  const syndromes = new Set();
  for (const rules of Object.values(allRuleCategories)) {
    for (const rule of rules) {
      syndromes.add(rule.result.syndrome);
    }
  }
  return Array.from(syndromes);
}

// 获取所有规则
function getAllRules() {
  const allRules = [];
  for (const rules of Object.values(allRuleCategories)) {
    allRules.push(...rules);
  }
  return allRules;
}

// 获取规则总数
function getTotalRuleCount() {
  return getRuleCount();
}

// 匹配条件
function matchCondition(conditions, features) {
  if (!conditions) return true;
  
  // 检查舌色
  if (conditions.tongueColor && features.tongue_color !== conditions.tongueColor) {
    // 特殊处理：淡白可能包含淡白
    if (conditions.tongueColor !== '淡白' || !features.tongue_color?.includes('淡白')) {
      return false;
    }
  }
  
  // 检查舌形
  if (conditions.tongueShape && features.tongue_shape !== conditions.tongueShape) {
    // 特殊处理：正常可能匹配其他
    if (conditions.tongueShape !== '正常' || features.tongue_shape === '正常') {
      return false;
    }
  }
  
  // 检查苔色
  if (conditions.coatingColor && features.tongue_coating_color !== conditions.coatingColor) {
    // 特殊处理：薄白可能匹配白厚
    if (conditions.coatingColor === '薄白' && features.tongue_coating_color?.startsWith('白')) {
      // 允许
    } else if (conditions.coatingColor !== '剥落' || features.tongue_coating_color !== '剥落') {
      return false;
    }
  }
  
  // 检查苔质
  if (conditions.coatingTexture && features.tongue_coating_texture !== conditions.coatingTexture) {
    if (conditions.coatingTexture !== '正常') {
      return false;
    }
  }
  
  // 检查润燥
  if (conditions.coatingMoisture && features.tongue_coating_moisture !== conditions.coatingMoisture) {
    if (conditions.coatingMoisture !== '正常') {
      return false;
    }
  }
  
  // 检查舌态
  if (conditions.tongueState && features.tongue_state !== conditions.tongueState) {
    return false;
  }
  
  // 检查齿痕
  if (conditions.teethMark !== undefined) {
    if (conditions.teethMark && !features.teeth_mark) {
      return false;
    }
    if (!conditions.teethMark && features.teeth_mark) {
      return false;
    }
  }
  
  // 检查裂纹
  if (conditions.crack !== undefined) {
    if (conditions.crack && !features.crack) {
      return false;
    }
    if (!conditions.crack && features.crack) {
      return false;
    }
  }
  
  return true;
}

// 舌诊辨证主函数
function diagnoseTongue(features) {
  const matchedRules = [];
  
  // 遍历所有规则，匹配符合条件的规则
  for (const rules of Object.values(allRuleCategories)) {
    for (const rule of rules) {
      if (matchCondition(rule.conditions, features)) {
        matchedRules.push(rule);
      }
    }
  }
  
  // 按权重排序
  matchedRules.sort((a, b) => b.result.weight - a.result.weight);
  
  // 如果没有匹配，返回默认结果
  if (matchedRules.length === 0) {
    return {
      syndrome: '待进一步诊断',
      pathogenesis: '特征不典型',
      treatment: '建议详细辨证',
      mainPoints: ['足三里', '关元'],
      secondaryPoints: ['三阴交'],
      organLocation: ['脾胃'],
      confidence: 0,
      matchedRuleId: null,
      matchedRuleName: null,
      priority: 'normal',
      isLocalRule: true,
    };
  }
  
  // 返回最高权重规则
  const bestRule = matchedRules[0];
  const confidence = Math.min(bestRule.result.weight / 100, 0.95);
  
  return {
    syndrome: bestRule.result.syndrome,
    pathogenesis: bestRule.result.pathogenesis,
    treatment: bestRule.result.treatment,
    mainPoints: bestRule.result.mainPoints,
    secondaryPoints: bestRule.result.secondaryPoints,
    organLocation: bestRule.result.organLocation,
    confidence: confidence,
    matchedRuleId: bestRule.id,
    matchedRuleName: bestRule.name,
    priority: bestRule.result.priority,
    isLocalRule: true,
    allMatches: matchedRules.slice(0, 5).map(r => ({
      id: r.id,
      name: r.name,
      syndrome: r.result.syndrome,
      weight: r.result.weight,
    })),
  };
}

// CommonJS导出
export {
  // 规则数组
  tongueColorRules,
  tongueColorDistributionRules,
  tongueShapeRules,
  coatingColorRules,
  coatingTextureRules,
  tongueStateRules,
  tongueBodyCoatingRules,
  tongueShapeCoatingRules,
  tongueStateBodyRules,
  threeDimensionalRules,
  huiXiRules,
  specialAcupointRules,
  regionAcupointRules,
  allRuleCategories,
  
  // 函数
  getRuleCount,
  getTotalRuleCount,
  getAllSyndromes,
  getAllRules,
  diagnoseTongue,
};
