// MCP协议路由 - 舌镜辨证能力引擎
// 支持 JSON-RPC 2.0 协议
// 使用 CommonJS 格式以兼容 Vercel Serverless Functions

// ==================== 穴位数据 ====================
const ACUPOINT_MERIDIAN_MAP = {
  '关元': '任脉', '气海': '任脉', '中脘': '任脉', '神阙': '任脉', '膻中': '任脉',
  '中极': '任脉', '下脘': '任脉', '上脘': '任脉', '巨阙': '任脉', '鸠尾': '任脉',
  '足三里': '足阳明胃经', '天枢': '足阳明胃经', '梁丘': '足阳明胃经', '犊鼻': '足阳明胃经',
  '上巨虚': '足阳明胃经', '下巨虚': '足阳明胃经', '丰隆': '足阳明胃经', '解溪': '足阳明胃经',
  '冲阳': '足阳明胃经', '内庭': '足阳明胃经',
  '三阴交': '足太阴脾经', '阴陵泉': '足太阴脾经', '血海': '足太阴脾经', '地机': '足太阴脾经',
  '商丘': '足太阴脾经', '公孙': '足太阴脾经', '太白': '足太阴脾经', '隐白': '足太阴脾经',
  '尺泽': '手太阴肺经', '孔最': '手太阴肺经', '列缺': '手太阴肺经', '经渠': '手太阴肺经',
  '太渊': '手太阴肺经', '鱼际': '手太阴肺经', '少商': '手太阴肺经',
  '合谷': '手阳明大肠经', '曲池': '手阳明大肠经', '手三里': '手阳明大肠经', '偏历': '手阳明大肠经',
  '温溜': '手阳明大肠经', '肩髃': '手阳明大肠经', '迎香': '手阳明大肠经',
  '委中': '足太阳膀胱经', '承山': '足太阳膀胱经', '昆仑': '足太阳膀胱经', '申脉': '足太阳膀胱经',
  '至阴': '足太阳膀胱经', '肾俞': '足太阳膀胱经', '肝俞': '足太阳膀胱经', '脾俞': '足太阳膀胱经',
  '胃俞': '足太阳膀胱经', '肺俞': '足太阳膀胱经', '心俞': '足太阳膀胱经', '膈俞': '足太阳膀胱经',
  '胆俞': '足太阳膀胱经', '大肠俞': '足太阳膀胱经', '膀胱俞': '足太阳膀胱经', '秩边': '足太阳膀胱经',
  '天宗': '足太阳膀胱经',
  '太溪': '足少阴肾经', '涌泉': '足少阴肾经', '照海': '足少阴肾经', '复溜': '足少阴肾经',
  '阴谷': '足少阴肾经', '大钟': '足少阴肾经', '水泉': '足少阴肾经',
  '内关': '手厥阴心包经', '曲泽': '手厥阴心包经', '间使': '手厥阴心包经', '郄门': '手厥阴心包经',
  '大陵': '手厥阴心包经', '劳宫': '手厥阴心包经', '中冲': '手厥阴心包经',
  '外关': '手少阳三焦经', '支沟': '手少阳三焦经', '肩髎': '手少阳三焦经', '翳风': '手少阳三焦经',
  '耳门': '手少阳三焦经', '丝竹空': '手少阳三焦经',
  '阳陵泉': '足少阳胆经', '风池': '足少阳胆经', '肩井': '足少阳胆经', '环跳': '足少阳胆经',
  '风市': '足少阳胆经', '光明': '足少阳胆经', '悬钟': '足少阳胆经', '丘墟': '足少阳胆经',
  '足临泣': '足少阳胆经', '侠溪': '足少阳胆经',
  '太冲': '足厥阴肝经', '行间': '足厥阴肝经', '曲泉': '足厥阴肝经', '蠡沟': '足厥阴肝经',
  '章门': '足厥阴肝经', '期门': '足厥阴肝经',
  '神门': '手少阴心经', '少府': '手少阴心经', '通里': '手少阴心经', '阴郄': '手少阴心经',
  '灵道': '手少阴心经', '少海': '手少阴心经', '极泉': '手少阴心经',
  '百会': '督脉', '大椎': '督脉', '命门': '督脉', '至阳': '督脉', '长强': '督脉',
  '腰阳关': '督脉', '风府': '督脉', '印堂': '督脉', '水沟': '督脉',
  '太阳': '经外奇穴', '十宣': '经外奇穴', '四缝': '经外奇穴', '胆囊穴': '经外奇穴',
  '阑尾穴': '经外奇穴', '八风': '经外奇穴', '八邪': '经外奇穴', '安眠': '经外奇穴',
};

const ACUPOINT_EFFECT_MAP = {
  '关元': '培元固本、补益下焦', '气海': '益气助阳、调经固经', '中脘': '和胃健脾、降逆利水',
  '神阙': '回阳救逆、健脾和胃', '膻中': '理气宽胸、清肺止咳', '足三里': '健脾和胃、扶正培元',
  '三阴交': '健脾益血、调肝补肾', '阴陵泉': '健脾利湿、通利下焦', '血海': '活血化瘀、健脾利湿',
  '太溪': '滋肾阴、补肾气', '涌泉': '苏厥开窍、滋阴益肾', '照海': '滋阴益肾、清热利湿',
  '太冲': '疏肝解郁、理气调血', '行间': '疏肝理气、清热利湿', '肝俞': '疏肝利胆、理气明目',
  '肾俞': '补肾益精、强腰利水', '脾俞': '健脾利湿、和胃降逆', '心俞': '宁心安神、宽胸理气',
  '肺俞': '宣肺止咳、降逆平喘', '内关': '宁心安神、理气止痛', '合谷': '镇静止痛、通经活络',
  '曲池': '清热解表、调和气血', '大椎': '解表清热、截疟止痫', '百会': '升阳举陷、安神醒脑',
  '命门': '补肾壮阳、强腰利水', '阳陵泉': '疏肝利胆、清热利湿', '委中': '清热利湿、舒筋活络',
  '悬钟': '补髓壮骨、清热通络', '风池': '疏风清热、明目益聪', '列缺': '宣肺止咳、通经活络',
  '尺泽': '清热降逆、止咳平喘', '少府': '清心泻火、活血行气', '神门': '宁心安神、清心热',
};

// ==================== 辨证规则 ====================
const DIAGNOSIS_RULES = [
  { id: 'TC-001', name: '淡红舌辨证', conditions: { tongueColor: '淡红' }, result: { syndrome: '正常/健康态', pathogenesis: '气血调和，阴阳平衡', treatment: '保健调理', mainPoints: ['足三里', '关元'], secondaryPoints: ['气海', '三阴交'], organLocation: ['脾胃'], priority: 'normal', weight: 10 }},
  { id: 'TC-002', name: '淡白舌辨证', conditions: { tongueColor: '淡白' }, result: { syndrome: '气血两虚证/阳虚证', pathogenesis: '阳气不足，血失温煦', treatment: '补益气血、温阳散寒', mainPoints: ['足三里', '气海'], secondaryPoints: ['三阴交', '命门'], organLocation: ['脾', '肾'], priority: 'high', weight: 30 }},
  { id: 'TC-003', name: '红舌辨证', conditions: { tongueColor: '红' }, result: { syndrome: '热证', pathogenesis: '里热炽盛，熏蒸于舌', treatment: '清热泻火/滋阴降火', mainPoints: ['大椎', '曲池'], secondaryPoints: ['合谷', '太溪'], organLocation: ['胃', '心'], priority: 'high', weight: 35 }},
  { id: 'TC-004', name: '绛舌辨证', conditions: { tongueColor: '绛' }, result: { syndrome: '热入营血证', pathogenesis: '热入营血，阴虚火旺', treatment: '清营凉血、养阴清热', mainPoints: ['曲泽', '膈俞'], secondaryPoints: ['委中', '太溪'], organLocation: ['心', '肝'], priority: 'critical', weight: 45 }},
  { id: 'TC-005', name: '紫舌辨证', conditions: { tongueColor: '紫' }, result: { syndrome: '血瘀证', pathogenesis: '寒凝血瘀/热盛血瘀', treatment: '活血化瘀、温经散寒', mainPoints: ['血海', '膈俞'], secondaryPoints: ['三阴交', '关元'], organLocation: ['肝', '心'], priority: 'high', weight: 40 }},
  { id: 'TC-006', name: '青紫舌辨证', conditions: { tongueColor: '青紫' }, result: { syndrome: '寒凝血瘀证', pathogenesis: '阳虚寒盛，肝郁血瘀', treatment: '温经活血、疏肝解郁', mainPoints: ['关元', '肝俞'], secondaryPoints: ['太冲', '血海'], organLocation: ['肝', '肾'], priority: 'critical', weight: 50 }},
  { id: 'TS-001', name: '胖大舌辨证', conditions: { tongueShape: '胖大' }, result: { syndrome: '水湿停滞证', pathogenesis: '脾虚湿盛/阳虚水泛', treatment: '健脾祛湿、利水渗湿', mainPoints: ['足三里', '阴陵泉'], secondaryPoints: ['脾俞', '水分'], organLocation: ['脾', '肾'], priority: 'high', weight: 32 }},
  { id: 'TS-002', name: '瘦薄舌辨证', conditions: { tongueShape: '瘦薄' }, result: { syndrome: '阴血不足证', pathogenesis: '气血两虚/阴虚火旺', treatment: '益气养血、滋阴降火', mainPoints: ['三阴交', '太溪'], secondaryPoints: ['足三里', '照海'], organLocation: ['肝', '肾'], priority: 'high', weight: 35 }},
  { id: 'TS-003', name: '裂纹舌辨证', conditions: { crack: true }, result: { syndrome: '阴血亏虚证', pathogenesis: '阴虚内热/血虚失养', treatment: '滋阴养血、润燥生津', mainPoints: ['三阴交', '血海'], secondaryPoints: ['太溪', '照海'], organLocation: ['肝', '肾', '脾'], priority: 'medium', weight: 30 }},
  { id: 'TS-004', name: '齿痕舌辨证', conditions: { tongueShape: '胖大', teethMark: true }, result: { syndrome: '脾虚湿盛证', pathogenesis: '脾虚不运/水湿内停', treatment: '健脾益气、化湿和中', mainPoints: ['足三里', '阴陵泉'], secondaryPoints: ['脾俞', '公孙'], organLocation: ['脾', '胃'], priority: 'high', weight: 34 }},
  { id: 'TCoat-001', name: '薄白苔辨证', conditions: { coatingColor: '薄白', coatingTexture: '薄' }, result: { syndrome: '正常/表证初期', pathogenesis: '胃气充足，邪气轻微', treatment: '无需特殊处理/解表散寒', mainPoints: ['合谷', '足三里'], secondaryPoints: ['风池'], organLocation: ['肺', '脾'], priority: 'normal', weight: 10 }},
  { id: 'TCoat-002', name: '白厚苔辨证', conditions: { coatingColor: '白厚' }, result: { syndrome: '寒湿内盛证', pathogenesis: '寒湿内停，胃气夹湿浊上蒸', treatment: '温阳散寒、健脾祛湿', mainPoints: ['阴陵泉', '足三里'], secondaryPoints: ['脾俞', '中脘'], organLocation: ['脾', '胃'], priority: 'high', weight: 32 }},
  { id: 'TCoat-003', name: '黄苔辨证', conditions: { coatingColor: '黄' }, result: { syndrome: '里热证', pathogenesis: '热邪内盛，熏蒸舌苔', treatment: '清热泻火', mainPoints: ['大椎', '曲池'], secondaryPoints: ['合谷', '内庭'], organLocation: ['胃', '大肠'], priority: 'high', weight: 35 }},
  { id: 'TCoat-004', name: '灰黑苔辨证', conditions: { coatingColor: '灰黑' }, result: { syndrome: '阴虚火旺/阳虚寒盛', pathogenesis: '阴虚火旺灼津/阳虚寒盛水湿上泛', treatment: '滋阴降火/温阳散寒', mainPoints: ['太溪', '照海'], secondaryPoints: ['关元', '命门'], organLocation: ['肾'], priority: 'critical', weight: 45 }},
  { id: 'TCoat-005', name: '剥落苔辨证', conditions: { coatingColor: '剥落' }, result: { syndrome: '胃阴亏虚证', pathogenesis: '胃阴不足，舌苔失养', treatment: '滋阴养胃', mainPoints: ['三阴交', '太溪'], secondaryPoints: ['足三里', '中脘'], organLocation: ['胃', '肾'], priority: 'high', weight: 38 }},
  { id: 'TState-001', name: '强硬舌辨证', conditions: { tongueState: '强硬' }, result: { syndrome: '热陷心包证/肝风内动证', pathogenesis: '热邪炽盛，扰及心神/肝风内动', treatment: '清热开窍/平肝息风', mainPoints: ['百会', '水沟'], secondaryPoints: ['合谷', '太冲'], organLocation: ['心', '肝'], priority: 'critical', weight: 48 }},
  { id: 'TState-002', name: '痿软舌辨证', conditions: { tongueState: '痿软' }, result: { syndrome: '气血两虚证', pathogenesis: '气血两虚，舌肌失养', treatment: '益气养血', mainPoints: ['足三里', '三阴交'], secondaryPoints: ['气海', '血海'], organLocation: ['脾', '心'], priority: 'high', weight: 36 }},
  { id: 'TState-003', name: '颤动舌辨证', conditions: { tongueState: '颤动' }, result: { syndrome: '肝风内动证', pathogenesis: '肝阴不足，肝风内动', treatment: '平肝息风、滋阴潜阳', mainPoints: ['太冲', '风池'], secondaryPoints: ['肝俞', '肾俞'], organLocation: ['肝', '肾'], priority: 'high', weight: 40 }},
  { id: 'TState-004', name: '歪斜舌辨证', conditions: { tongueState: '歪斜' }, result: { syndrome: '中风证/肝风夹痰证', pathogenesis: '风痰阻络，气血不畅', treatment: '祛风化痰、活血通络', mainPoints: ['百会', '风池'], secondaryPoints: ['合谷', '足三里'], organLocation: ['肝', '脾'], priority: 'critical', weight: 50 }},
  { id: 'COMBO-001', name: '淡白胖大舌辨证', conditions: { tongueColor: '淡白', tongueShape: '胖大' }, result: { syndrome: '脾肾阳虚证', pathogenesis: '脾肾阳虚，水湿内停', treatment: '温补脾肾、利水渗湿', mainPoints: ['足三里', '肾俞'], secondaryPoints: ['阴陵泉', '命门'], organLocation: ['脾', '肾'], priority: 'high', weight: 40 }},
  { id: 'COMBO-002', name: '红瘦裂纹舌辨证', conditions: { tongueColor: '红', tongueShape: '瘦薄', crack: true }, result: { syndrome: '阴虚火旺证', pathogenesis: '阴液亏虚，虚火内炽', treatment: '滋阴降火', mainPoints: ['太溪', '照海'], secondaryPoints: ['三阴交', '肾俞'], organLocation: ['肾', '心'], priority: 'high', weight: 42 }},
  { id: 'COMBO-003', name: '紫暗舌辨证', conditions: { tongueColor: '紫' }, result: { syndrome: '血瘀证', pathogenesis: '气血瘀滞，运行不畅', treatment: '活血化瘀', mainPoints: ['血海', '膈俞'], secondaryPoints: ['三阴交', '太冲'], organLocation: ['肝', '心'], priority: 'high', weight: 40 }},
  { id: 'COMBO-004', name: '红黄苔辨证', conditions: { tongueColor: '红', coatingColor: '黄' }, result: { syndrome: '实热证', pathogenesis: '里热炽盛，湿热内蕴', treatment: '清热泻火、燥湿', mainPoints: ['大椎', '曲池'], secondaryPoints: ['阴陵泉', '内庭'], organLocation: ['胃', '大肠'], priority: 'high', weight: 38 }},
  { id: 'COMBO-005', name: '淡白薄苔辨证', conditions: { tongueColor: '淡白', coatingColor: '薄白' }, result: { syndrome: '气血两虚证', pathogenesis: '气血不足，舌失荣养', treatment: '益气养血', mainPoints: ['足三里', '三阴交'], secondaryPoints: ['气海', '血海'], organLocation: ['脾', '心'], priority: 'medium', weight: 28 }},
  { id: 'COMBO-006', name: '胖大齿痕白厚苔辨证', conditions: { tongueShape: '胖大', teethMark: true, coatingColor: '白厚' }, result: { syndrome: '脾虚湿盛证', pathogenesis: '脾虚运化失常，湿浊内停', treatment: '健脾祛湿', mainPoints: ['足三里', '阴陵泉'], secondaryPoints: ['脾俞', '中脘'], organLocation: ['脾', '胃'], priority: 'high', weight: 38 }},
  { id: 'COMBO-007', name: '绛紫舌辨证', conditions: { tongueColor: '绛' }, result: { syndrome: '热入营血证', pathogenesis: '热入营血，阴伤血瘀', treatment: '清营凉血、养阴活血', mainPoints: ['曲泽', '膈俞'], secondaryPoints: ['血海', '太溪'], organLocation: ['心', '肝'], priority: 'critical', weight: 48 }},
  { id: 'COMBO-008', name: '红瘦少苔辨证', conditions: { tongueColor: '红', tongueShape: '瘦薄', coatingColor: '剥落' }, result: { syndrome: '胃阴亏虚证', pathogenesis: '胃阴耗伤，舌失所养', treatment: '滋阴养胃', mainPoints: ['三阴交', '太溪'], secondaryPoints: ['中脘', '足三里'], organLocation: ['胃', '肾'], priority: 'high', weight: 42 }},
];

// 标准化映射
const VALUE_MAP = {
  tongue_color: { '淡红': '淡红', '淡红色': '淡红', '粉红': '淡红', '淡白': '淡白', '淡白色': '淡白', '苍白': '淡白', '红': '红', '红色': '红', '鲜红': '红', '绛': '绛', '绛红': '绛', '深红': '绛', '暗红': '绛', '紫': '紫', '紫暗': '紫', '青紫': '青紫', '青': '青紫' },
  tongue_shape: { '胖大': '胖大', '胖': '胖大', '肿胀': '胖大', '瘦薄': '瘦薄', '瘦': '瘦薄', '瘦小': '瘦薄', '正常': '正常' },
  tongue_state: { '强硬': '强硬', '痿软': '痿软', '歪斜': '歪斜', '颤动': '颤动', '颤抖': '颤动', '正常': '正常' },
  coating_color: { '薄白': '薄白', '白': '薄白', '白色': '薄白', '白厚': '白厚', '厚白': '白厚', '黄': '黄', '黄色': '黄', '黄苔': '黄', '薄黄': '黄', '灰黑': '灰黑', '灰': '灰黑', '黑': '灰黑', '剥落': '剥落', '无苔': '剥落', '镜面': '剥落' },
  coating_texture: { '薄': '薄', '厚': '厚', '正常': '正常' },
  coating_moisture: { '润': '润', '湿润': '润', '燥': '燥', '干燥': '燥', '正常': '正常' }
};

function normalizeValue(category, rawValue) {
  if (!rawValue || typeof rawValue !== 'string') return rawValue;
  const trimmed = rawValue.trim();
  const map = VALUE_MAP[category];
  if (!map) return trimmed;
  if (map[trimmed]) return map[trimmed];
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  for (const key of keys) { if (trimmed.includes(key)) return map[key]; }
  return trimmed;
}

function matchConditions(conditions, features) {
  for (const [key, value] of Object.entries(conditions)) {
    if (features[key] !== value) return false;
  }
  return true;
}

function calculateMatchScore(rule, features) {
  let score = 0, matchedCount = 0;
  const totalConditions = Object.keys(rule.conditions).length;
  for (const [key, value] of Object.entries(rule.conditions)) {
    if (features[key] === value) {
      score += rule.result.weight / totalConditions;
      matchedCount++;
    }
  }
  return { score, matchedCount, totalConditions };
}

// 舌诊辨证引擎
function diagnoseTongue(tongueFeatures) {
  const normalized = {
    tongueColor: normalizeValue('tongue_color', tongueFeatures.tongue_color || tongueFeatures.tongueColor),
    tongueShape: normalizeValue('tongue_shape', tongueFeatures.tongue_shape || tongueFeatures.tongueShape),
    tongueState: normalizeValue('tongue_state', tongueFeatures.tongue_state || tongueFeatures.tongueState),
    coatingColor: normalizeValue('coating_color', tongueFeatures.coating_color || tongueFeatures.coatingColor),
    coatingTexture: normalizeValue('coating_texture', tongueFeatures.coating_texture || tongueFeatures.coatingTexture),
    coatingMoisture: normalizeValue('coating_moisture', tongueFeatures.coating_moisture || tongueFeatures.coatingMoisture),
    teethMark: tongueFeatures.teeth_mark ?? tongueFeatures.teethMark ?? false,
    crack: tongueFeatures.crack ?? false,
  };

  const sortedRules = [...DIAGNOSIS_RULES].sort((a, b) => b.result.weight - a.result.weight || a.id.localeCompare(b.id));
  let bestMatch = null, bestScore = 0;

  for (const rule of sortedRules) {
    const { score, matchedCount, totalConditions } = calculateMatchScore(rule, normalized);
    if (matchedCount / totalConditions >= 0.8 && score > bestScore) {
      bestMatch = rule;
      bestScore = score;
    }
  }

  if (!bestMatch && normalized.tongueColor) {
    const colorRule = sortedRules.find(r => r.conditions.tongueColor === normalized.tongueColor);
    if (colorRule) { bestMatch = colorRule; bestScore = colorRule.result.weight * 0.6; }
  }

  const baseFeatures = {
    tongueColor: normalized.tongueColor || '未知',
    tongueShape: normalized.tongueShape || '正常',
    tongueState: normalized.tongueState || '正常',
    coatingColor: normalized.coatingColor || '薄白',
    coatingTexture: normalized.coatingTexture || '薄',
    coatingMoisture: normalized.coatingMoisture || '润',
    teethMark: normalized.teethMark,
    crack: normalized.crack,
  };

  if (bestMatch) {
    return {
      features: baseFeatures,
      diagnosis: {
        syndrome: bestMatch.result.syndrome,
        pathogenesis: bestMatch.result.pathogenesis,
        treatment: bestMatch.result.treatment,
        organLocation: bestMatch.result.organLocation,
        confidence: Math.min(0.95, bestScore / 100 + 0.3),
        priority: bestMatch.result.priority,
        matchedRule: bestMatch.name,
      },
      acupuncture: {
        mainPoints: bestMatch.result.mainPoints,
        secondaryPoints: bestMatch.result.secondaryPoints,
        method: { technique: '平补平泻', needleRetention: 30, moxibustion: '酌情使用', frequency: '每周2-3次', course: '4-8周' }
      },
      notes: `基于舌色${normalized.tongueColor || '未知'}、舌形${normalized.tongueShape || '正常'}、舌苔${normalized.coatingColor || '薄白'}的辨证分析`
    };
  }

  return {
    features: baseFeatures,
    diagnosis: { syndrome: '需进一步辨证', pathogenesis: '信息不足，无法确定', treatment: '建议结合其他四诊信息', organLocation: [], confidence: 0.3, priority: 'normal', matchedRule: '无匹配规则' },
    acupuncture: { mainPoints: ['足三里'], secondaryPoints: ['三阴交'], method: { technique: '平补平泻', needleRetention: 20, moxibustion: '可选用', frequency: '每周1-2次', course: '2-4周' } },
    notes: '舌象特征不典型，建议补充更多信息以提高辨证准确性'
  };
}

// 获取穴位信息
function getAcupointInfo(name) {
  const meridian = ACUPOINT_MERIDIAN_MAP[name];
  const effect = ACUPOINT_EFFECT_MAP[name];
  if (!meridian && !effect) return null;
  return { name, meridian: meridian || '未知经脉', effect: effect || '功效未知' };
}

// Coze API配置
const COZE_CONFIG = {
  botId: '7634049322782785572',
  chatApiUrl: 'https://api.coze.cn/v3/chat',
  uploadApiUrl: 'https://api.coze.cn/v1/files/upload',
  token: 'pat_cT0kGwXPwioWz69z65sLufTqcr1PJNorzO4EJbymAfbMM7uWC2W2qDCvdEqiK1l6'
};

// 工具定义
const TOOLS = [
  {
    name: "tongue_analyze",
    description: "舌诊辨证分析 - 传入舌象特征（舌色、舌形、舌苔等），返回中医辨证结果、证型判断、脏腑定位和针灸选穴建议",
    inputSchema: {
      type: "object",
      required: ["tongue_color", "tongue_shape"],
      properties: {
        tongue_color: { type: "string", description: "舌色", enum: ["淡红", "淡白", "红", "绛", "紫", "青紫"] },
        tongue_shape: { type: "string", description: "舌形", enum: ["胖大", "瘦薄", "正常"] },
        tongue_state: { type: "string", description: "舌态", enum: ["强硬", "痿软", "歪斜", "颤动", "正常"], default: "正常" },
        coating_color: { type: "string", description: "苔色", enum: ["薄白", "白厚", "黄", "灰黑", "剥落"], default: "薄白" },
        coating_texture: { type: "string", description: "苔质", enum: ["薄", "厚", "正常"], default: "薄" },
        coating_moisture: { type: "string", description: "润燥", enum: ["润", "燥", "正常"], default: "润" },
        teeth_mark: { type: "boolean", description: "是否有齿痕", default: false },
        crack: { type: "boolean", description: "是否有裂纹", default: false },
        chief_complaint: { type: "string", description: "主诉症状（可选）" },
        patient_age: { type: "number", description: "患者年龄（可选）" },
        patient_gender: { type: "string", description: "患者性别", enum: ["男", "女"] }
      }
    }
  },
  {
    name: "tongue_image_analyze",
    description: "上传舌象图片进行AI识别与辨证 - 传入base64编码的舌象图片，自动识别舌象特征并返回完整辨证结果",
    inputSchema: {
      type: "object",
      required: ["image"],
      properties: {
        image: { type: "string", description: "base64编码的舌象图片（data URL格式或纯base64）" },
        patient_age: { type: "number", description: "患者年龄（可选）" },
        patient_gender: { type: "string", description: "患者性别（可选）", enum: ["男", "女"] }
      }
    }
  },
  {
    name: "query_acupoint",
    description: "查询穴位信息 - 传入穴位名称，返回定位、经脉归属、功效等详细信息",
    inputSchema: {
      type: "object",
      required: ["name"],
      properties: {
        name: { type: "string", description: "穴位名称，如'足三里'、'太溪'、'合谷'等" }
      }
    }
  },
  {
    name: "list_acupoints",
    description: "列出常用穴位 - 返回所有支持的穴位名称列表",
    inputSchema: { type: "object", properties: {} }
  }
];

// 处理舌诊辨证分析
async function handleTongueAnalyze(args) {
  try {
    const result = diagnoseTongue({
      tongue_color: args.tongue_color,
      tongue_shape: args.tongue_shape,
      tongue_state: args.tongue_state || '正常',
      coating_color: args.coating_color || '薄白',
      coating_texture: args.coating_texture || '薄',
      coating_moisture: args.coating_moisture || '润',
      teeth_mark: args.teeth_mark || false,
      crack: args.crack || false,
    });
    if (args.chief_complaint) result.chiefComplaint = args.chief_complaint;
    if (args.patient_age) result.patientAge = args.patient_age;
    if (args.patient_gender) result.patientGender = args.patient_gender;
    return result;
  } catch (error) {
    return { error: `辨证分析失败: ${error.message}` };
  }
}

// 处理图片分析
async function handleImageAnalyze(args) {
  try {
    const { image, patient_age, patient_gender } = args;
    if (!image) return { error: '缺少图片数据' };

    let mimeType = 'image/jpeg';
    let pureBase64 = image;
    if (image.startsWith('data:')) {
      const commaIdx = image.indexOf(',');
      if (commaIdx > 0) {
        const meta = image.slice(0, commaIdx);
        const mimeMatch = meta.match(/:(image\/[a-zA-Z0-9.+-]+)/);
        if (mimeMatch) mimeType = mimeMatch[1];
        pureBase64 = image.slice(commaIdx + 1);
      }
    }
    pureBase64 = pureBase64.replace(/\s/g, '');
    const buffer = Buffer.from(pureBase64, 'base64');
    const ext = mimeType.includes('png') ? 'png' : 'jpg';
    const fileName = `tongue_${Date.now()}.${ext}`;

    const boundary = '----CozeUpload' + Date.now().toString(36);
    const header = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${mimeType}\r\n\r\n`);
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
    const payload = Buffer.concat([header, buffer, footer]);

    const uploadRes = await fetch(COZE_CONFIG.uploadApiUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${COZE_CONFIG.token}`, 'Content-Type': `multipart/form-data; boundary=${boundary}` },
      body: payload
    });

    const uploadData = await uploadRes.json();
    if (uploadData.code !== 0 || !uploadData.data?.id) return { error: `图片上传失败: ${uploadData.msg || 'unknown'}` };

    const fileId = uploadData.data.id;

    const TONGUE_PROMPT = `你是一个舌象判断与识别系统。请严格执行以下判断：【判断】图片中是否包含伸出的舌头和口腔？判断标准：必须能清晰看到口腔内伸出的舌头。如果没有舌头和口腔，返回：{"tongueDetected":false,"message":"未检测到舌象"}。如果有舌头和口腔，返回：{"tongueDetected":true,"tongue_color":"","tongue_shape":"","teeth_mark":{"has":false},"crack":{"has":false},"tongue_coating":{"color":"","texture":""}}`;

    const chatRes = await fetch(COZE_CONFIG.chatApiUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${COZE_CONFIG.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bot_id: COZE_CONFIG.botId,
        user_id: `mcp_${Date.now()}`,
        stream: false,
        additional_messages: [{ role: 'user', content_type: 'object_string', content: JSON.stringify([{ type: 'file', file_id: fileId }, { type: 'text', text: TONGUE_PROMPT }]) }]
      })
    });

    const chatData = await chatRes.json();
    if (chatData.code !== 0 || !chatData.data?.id) return { error: `创建对话失败: ${chatData.msg || 'unknown'}` };

    const chatId = chatData.data.id;

    // 轮询等待结果
    for (let i = 0; i < 30; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const statusRes = await fetch(`https://api.coze.cn/v3/chat/retrieve?chat_id=${chatId}&conversation_id=${chatData.data.conversation_id}`, {
        headers: { 'Authorization': `Bearer ${COZE_CONFIG.token}`, 'Content-Type': 'application/json' }
      });

      const statusData = await statusRes.json();

      if (statusData.data?.status === 'completed') {
        const messagesRes = await fetch(`https://api.coze.cn/v3/chat/message/list?chat_id=${chatId}&conversation_id=${chatData.data.conversation_id}`, {
          headers: { 'Authorization': `Bearer ${COZE_CONFIG.token}`, 'Content-Type': 'application/json' }
        });

        const messagesData = await messagesRes.json();
        let tongueFeatures = null;

        for (const msg of (messagesData.data || [])) {
          if (msg.role === 'assistant' && msg.type === 'answer') {
            try {
              const jsonMatch = msg.content.match(/\{[\s\S]*\}/);
              if (jsonMatch) tongueFeatures = JSON.parse(jsonMatch[0]);
            } catch (e) {}
          }
        }

        if (tongueFeatures && tongueFeatures.tongueDetected) {
          const diagnosisResult = diagnoseTongue({
            tongue_color: tongueFeatures.tongue_color || tongueFeatures.tongueColor,
            tongue_shape: tongueFeatures.tongue_shape || tongueFeatures.tongueShape,
            tongue_state: '正常',
            coating_color: tongueFeatures.tongue_coating?.color || '薄白',
            coating_texture: tongueFeatures.tongue_coating?.texture || '薄',
            coating_moisture: '润',
            teeth_mark: tongueFeatures.teeth_mark?.has || false,
            crack: tongueFeatures.crack?.has || false,
          });
          if (patient_age) diagnosisResult.patientAge = patient_age;
          if (patient_gender) diagnosisResult.patientGender = patient_gender;
          diagnosisResult.imageAnalysis = tongueFeatures;
          return diagnosisResult;
        }

        return { error: tongueFeatures?.message || '未能识别舌象特征' };
      }

      if (statusData.data?.status === 'failed') return { error: 'AI识别失败' };
    }

    return { error: '识别超时，请重试' };

  } catch (error) {
    return { error: `图片分析失败: ${error.message}` };
  }
}

// 处理穴位查询
async function handleAcupointQuery(args) {
  const { name } = args;
  if (!name) return { error: '缺少穴位名称' };
  const info = getAcupointInfo(name);
  if (!info) {
    const suggestions = Object.keys(ACUPOINT_MERIDIAN_MAP).filter(a => a.includes(name) || name.includes(a.slice(0, 2))).slice(0, 5);
    return { error: `未找到穴位 "${name}"`, suggestions: suggestions.length > 0 ? suggestions : Object.keys(ACUPOINT_MERIDIAN_MAP).slice(0, 10) };
  }
  return info;
}

// 处理穴位列表
async function handleListAcupoints() {
  return {
    total: Object.keys(ACUPOINT_MERIDIAN_MAP).length,
    acupoints: Object.keys(ACUPOINT_MERIDIAN_MAP).map(name => ({ name, meridian: ACUPOINT_MERIDIAN_MAP[name], effect: ACUPOINT_EFFECT_MAP[name] || '' }))
  };
}

// ==================== MCP主处理器 ====================
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).json({});

  // GET请求返回服务信息
  if (req.method === 'GET') {
    return res.json({
      name: "舌镜辨证能力引擎",
      version: "1.0.0",
      protocol: "MCP",
      endpoint: "https://she-zhen.top/api/mcp",
      description: "基于中医舌诊理论的辨证分析MCP服务",
      capabilities: {
        tools: {
          tongue_analyze: "舌诊辨证分析（基于特征输入）",
          tongue_image_analyze: "舌象图片AI识别与辨证",
          query_acupoint: "穴位信息查询",
          list_acupoints: "穴位列表"
        }
      },
      supportedFeatures: DIAGNOSIS_RULES.map(r => ({ id: r.id, name: r.name, syndrome: r.result.syndrome }))
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ jsonrpc: "2.0", error: { code: -32600, message: "Method not allowed" } });
  }

  try {
    const body = req.body || {};
    const { jsonrpc, method, params, id } = body;

    if (jsonrpc !== "2.0") {
      return res.json({ jsonrpc: "2.0", error: { code: -32600, message: "Invalid JSON-RPC version" }, id });
    }

    if (method === 'initialize') {
      return res.json({
        jsonrpc: "2.0",
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {}, resources: { subscribe: false, listChanged: false } },
          serverInfo: { name: "舌镜辨证能力引擎", version: "1.0.0" }
        },
        id
      });
    }

    if (method === 'tools/list') {
      return res.json({ jsonrpc: "2.0", result: { tools: TOOLS }, id });
    }

    if (method === 'tools/call') {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};

      let result;
      if (toolName === 'tongue_analyze') result = await handleTongueAnalyze(toolArgs);
      else if (toolName === 'tongue_image_analyze') result = await handleImageAnalyze(toolArgs);
      else if (toolName === 'query_acupoint') result = await handleAcupointQuery(toolArgs);
      else if (toolName === 'list_acupoints') result = await handleListAcupoints();
      else return res.json({ jsonrpc: "2.0", error: { code: -32601, message: `未知工具: ${toolName}` }, id });

      const content = typeof result === 'string' ? [{ type: "text", text: result }] : [{ type: "text", text: JSON.stringify(result, null, 2) }];
      return res.json({ jsonrpc: "2.0", result: { content, isError: result.error ? true : false }, id });
    }

    return res.json({ jsonrpc: "2.0", error: { code: -32601, message: `未知方法: ${method}` }, id });

  } catch (error) {
    console.error('MCP Error:', error);
    return res.json({ jsonrpc: "2.0", error: { code: -32603, message: `Internal error: ${error.message}` }, id: req.body?.id });
  }
}
