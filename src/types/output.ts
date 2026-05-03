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

// 八大体质枚举
export type ConstitutionEnum = '气虚' | '阴虚' | '阳虚' | '血瘀' | '痰湿' | '湿热' | '气郁' | '平和';

// 体质判断结果（单一体质）
export interface ConstitutionType {
  type: ConstitutionEnum;
  name: string;
  description: string;
  characteristics: string[];
  carePrinciple: string;
  careMethod: string;
  dietary禁忌: string[];
  lifestyle建议: string[];
  matchedFeatures: string[];
  confidence: number;
}

// 复合体质（主体质 + 兼夹体质）
export interface CompoundConstitution {
  primary: ConstitutionType;
  secondary?: ConstitutionType[];
  summary: string;
}

// 完整体质评估结果
export interface ConstitutionAssessment {
  constitution: CompoundConstitution;
  isBalanced: boolean;
  healthTips: string[];
}

// 完整输出数据
export interface DiagnosisOutput {
  diagnosisResult: DiagnosisResult;
  acupuncturePlan: AcupuncturePlan;
  lifeCareAdvice: LifeCareAdvice;
  systemInfo: SystemInfo;
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
