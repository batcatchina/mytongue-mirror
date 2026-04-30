// 辨证依据类型
export interface DiagnosisEvidence {
  feature: string;
  weight: number;
  contribution: string;
  matchDegree: number;
  ruleId?: string;
}

// 次要证型
export interface SecondarySyndrome {
  syndrome: string;
  score: number;
  confidence: number;
  matchedFeatures?: string[];
}

// 辨证结果
export interface DiagnosisResult {
  primarySyndrome: string;
  syndromeScore: number;
  confidence: number;
  secondarySyndromes: SecondarySyndrome[];
  pathogenesis: string;
  organLocation: string[];
  diagnosisEvidence: DiagnosisEvidence[];
  priority: '高' | '中' | '低';
  diagnosisTime: string;
}

// ==================== 八大体质类型定义 ====================

// 八大体质枚举
export type ConstitutionEnum = 
  | '气虚' 
  | '阴虚' 
  | '阳虚' 
  | '血瘀' 
  | '痰湿' 
  | '湿热' 
  | '气郁' 
  | '平和';

// 体质特点
export interface ConstitutionCharacteristic {
  description: string;      // 描述
  commonSymptoms: string[]; // 常见症状
  tongueFeatures: string[]; // 舌象特征
}

// 体质判断结果（单一体质）
export interface ConstitutionType {
  type: ConstitutionEnum;           // 体质类型
  name: string;                     // 体质名称（含"体质"二字）
  description: string;              // 体质特征描述
  characteristics: string[];        // 体质特点列表
  carePrinciple: string;           // 调理原则
  careMethod: string;              // 调理方法
  dietary禁忌: string[];           // 饮食禁忌
  lifestyle建议: string[];          // 生活建议
  matchedFeatures: string[];       // 匹配的舌象特征（用于说明判断依据）
  confidence: number;              // 匹配置信度 0-1
}

// 复合体质（主体质 + 兼夹体质）
export interface CompoundConstitution {
  primary: ConstitutionType;        // 主体质
  secondary?: ConstitutionType[];   // 兼夹体质（可多个）
  summary: string;                  // 体质综合描述
}

// 完整体质评估结果
export interface ConstitutionAssessment {
  constitution: CompoundConstitution;
  isBalanced: boolean;              // 是否为平和体质
  healthTips: string[];             // 健康提示
}

// 穴位信息
export interface AcupuncturePoint {
  point: string;
  meridian: string;
  effect: string;
  location?: string;
  technique: string;
  precautions?: string;
  techniqueDescription?: string;
  pairedPoints?: string[];
}

// 治疗建议
export interface TreatmentAdvice {
  techniquePrinciple: string;
  needleRetentionTime: string;
  treatmentFrequency: string;
  treatmentSessions: string;
  sessionInterval: string;
  stimulationSuggestion?: string;
  moxibustionSuggestion?: string;
}

// 针灸方案
export interface AcupuncturePlan {
  treatmentPrinciple: string;
  mainPoints: AcupuncturePoint[];
  secondaryPoints: AcupuncturePoint[];
  contraindications: string[];
  treatmentAdvice: TreatmentAdvice;
}

// 生活调护建议
export interface LifeCareAdvice {
  dietSuggestions: string[];
  dailyRoutine: string[];
  precautions: string[];
}

// 系统信息
export interface SystemInfo {
  knowledgeBaseVersion: string;
  skillVersion: string;
  reasoningRulesCount: number;
  updateTime: string;
}

// 完整输出数据
export interface DiagnosisOutput {
  diagnosisResult: DiagnosisResult;
  acupuncturePlan: AcupuncturePlan;
  lifeCareAdvice: LifeCareAdvice;
  systemInfo: SystemInfo;
  // 新增：体质评估
  constitutionAssessment?: ConstitutionAssessment;
}

// 置信度等级
export type ConfidenceLevel = '极高' | '高' | '中' | '低';

export function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.9) return '极高';
  if (confidence >= 0.7) return '高';
  if (confidence >= 0.5) return '中';
  return '低';
}

// 优先级颜色映射
export const priorityColorMap: Record<string, string> = {
  '高': 'text-red-600 bg-red-50',
  '中': 'text-yellow-600 bg-yellow-50',
  '低': 'text-green-600 bg-green-50',
};

// ==================== 八大体质数据定义 ====================

// 八大体质完整数据（舌象特征映射）
export const CONSTITUTION_DATA: Record<ConstitutionEnum, {
  name: string;
  description: string;
  characteristics: string[];
  carePrinciple: string;
  careMethod: string;
  dietary禁忌: string[];
  lifestyle建议: string[];
  tongueFeatures: string[];
}> = {
  '气虚': {
    name: '气虚体质',
    description: '一身之气不足，容易疲劳、气息低弱',
    characteristics: [
      '气短懒言、易疲乏',
      '面色萎黄或淡白',
      '声音低弱、精神不振',
      '容易出汗、抵抗力差',
    ],
    carePrinciple: '补气养气，健脾益肺肾',
    careMethod: '以补气健脾为主，艾灸关元、气海、足三里',
    dietary禁忌: ['辛辣耗气食物', '生冷寒凉', '油腻厚味'],
    lifestyle建议: ['适度运动', '充足睡眠', '避免过度劳累'],
    tongueFeatures: ['舌边齿痕', '舌苔厚', '舌体胖大', '中间裂纹', '苔极薄或无苔'],
  },
  '阴虚': {
    name: '阴虚体质',
    description: '阴液亏少，口燥咽干、手足心热',
    characteristics: [
      '手足心热、口燥咽干',
      '大便干燥、面色潮红',
      '舌红少津或剥苔',
      '睡眠差、眩晕耳鸣',
    ],
    carePrinciple: '补阴清热，滋养肝肾',
    careMethod: '以滋阴降火为主，针刺太溪、三阴交、照海',
    dietary禁忌: ['辛辣温热', '煎炸烧烤', '烟酒'],
    lifestyle建议: ['早睡养阴', '避免熬夜', '适度静养'],
    tongueFeatures: ['舌红', '苔少或剥苔', '镜面舌', '裂纹'],
  },
  '阳虚': {
    name: '阳虚体质',
    description: '阳气不足，畏寒怕冷、手足不温',
    characteristics: [
      '畏冷手足不温',
      '喜热饮食、精神不振',
      '舌淡胖边有齿痕',
      '大便溏薄、小便清长',
    ],
    carePrinciple: '补阳祛寒，温补脾肾',
    careMethod: '以温阳散寒为主，重灸关元、命门、肾俞',
    dietary禁忌: ['生冷寒凉', '清热解毒', '冰冷饮品'],
    lifestyle建议: ['保暖防寒', '适度晒太阳', '艾灸养生'],
    tongueFeatures: ['舌淡', '苔白', '舌体胖大', '齿痕'],
  },
  '血瘀': {
    name: '血瘀体质',
    description: '体内有瘀血，面色晦暗、皮肤色素沉着',
    characteristics: [
      '面色晦暗易出瘀斑',
      '口唇暗淡或紫',
      '舌下静脉曲张',
      '女性多见痛经血块',
    ],
    carePrinciple: '理气疏肝，活血化瘀',
    careMethod: '以活血化瘀为主，针刺血海、膈俞、三阴交',
    dietary禁忌: ['寒凉凝血', '油腻黏滞', '生冷'],
    lifestyle建议: ['适度运动', '情志舒畅', '避免久坐'],
    tongueFeatures: ['舌紫', '青紫', '瘀点', '舌下静脉曲张', '瘀斑'],
  },
  '痰湿': {
    name: '痰湿体质',
    description: '痰湿凝聚，形体肥胖、口黏苔腻',
    characteristics: [
      '体形肥胖腹部肥满',
      '面部油脂较多',
      '口黏腻或甜',
      '身重不爽、大便黏滞',
    ],
    carePrinciple: '健脾祛湿，化痰泻浊',
    careMethod: '以健脾化痰为主，泻阴陵泉、丰隆',
    dietary禁忌: ['甜腻厚味', '肥甘油腻', '生冷饮料'],
    lifestyle建议: ['清淡饮食', '适度运动', '规律作息'],
    tongueFeatures: ['舌胖大', '苔白腻', '白厚腻', '苔厚'],
  },
  '湿热': {
    name: '湿热体质',
    description: '湿热内蕴，面垢油光、口苦苔黄腻',
    characteristics: [
      '面垢油光易生痤疮',
      '口苦口干身重困倦',
      '大便黏滞或燥结',
      '小便短赤、男性阴囊潮湿',
    ],
    carePrinciple: '疏肝利胆，清热祛湿',
    careMethod: '以清热利湿为主，针刺曲池、阴陵泉',
    dietary禁忌: ['辛辣刺激', '煎炸烧烤', '烟酒', '甜腻'],
    lifestyle建议: ['清淡饮食', '充足睡眠', '避免湿热环境'],
    tongueFeatures: ['舌红', '苔黄腻', '黄厚腻', '舌边红'],
  },
  '气郁': {
    name: '气郁体质',
    description: '气机郁滞，神情抑郁、忧虑脆弱',
    characteristics: [
      '神情烦闷不乐',
      '胸胁胀满走窜痛',
      '善太息、嗳气',
      '女性多见乳房胀痛',
    ],
    carePrinciple: '疏肝解郁，理气行滞',
    careMethod: '以疏肝理气为主，针刺太冲、肝俞、膻中',
    dietary禁忌: ['辛辣刺激', '生冷寒凉', '胀气食物'],
    lifestyle建议: ['情绪疏导', '适度运动', '社交活动'],
    tongueFeatures: ['舌形偏尖', '舌边红', '舌边略鼓', '舌尖红'],
  },
  '平和': {
    name: '平和体质',
    description: '体态适中、面色红润、精力充沛',
    characteristics: [
      '面色肤色润泽',
      '精力充沛不易疲劳',
      '舌淡红苔薄白',
      '睡眠安和、二便正常',
    ],
    carePrinciple: '阴阳平衡，合理调摄',
    careMethod: '以养生保健为主，适度调理即可',
    dietary禁忌: ['无特殊禁忌', '避免偏食'],
    lifestyle建议: ['均衡饮食', '适度运动', '规律作息'],
    tongueFeatures: ['舌淡红', '苔薄白', '舌体大小正常'],
  },
};

// 体质颜色主题（用于UI）
export const CONSTITUTION_THEME: Record<ConstitutionEnum, {
  bgGradient: string;
  border: string;
  text: string;
  badge: string;
}> = {
  '气虚': { bgGradient: 'from-amber-50 to-orange-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100' },
  '阴虚': { bgGradient: 'from-red-50 to-pink-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100' },
  '阳虚': { bgGradient: 'from-blue-50 to-cyan-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100' },
  '血瘀': { bgGradient: 'from-purple-50 to-violet-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100' },
  '痰湿': { bgGradient: 'from-yellow-50 to-green-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100' },
  '湿热': { bgGradient: 'from-orange-50 to-red-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100' },
  '气郁': { bgGradient: 'from-green-50 to-teal-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100' },
  '平和': { bgGradient: 'from-emerald-50 to-teal-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100' },
};
