export * from './input';
export * from './output';

// 导出新的 v2.0 类型系统
export * from './tongue';
export * from './inference';
export * from './interrogation';

// 通用类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

export interface CaseRecord {
  id: string;
  patientInfo: import('./input').PatientInfo;
  inputFeatures: import('./input').InputFeatures;
  symptoms?: import('./input').Symptom[];
  diagnosisResult: import('./output').DiagnosisResult;
  acupuncturePlan: import('./output').AcupuncturePlan;
  createdAt: string;
  updatedAt: string;
}

// 枚举选项
export const TONGUE_COLORS = ['淡红', '淡白', '红', '绛', '紫', '青紫'] as const;
export const TONGUE_SHAPES = ['胖大', '瘦薄', '正常'] as const;
export const TONGUE_STATES = ['强硬', '痿软', '歪斜', '颤动', '正常'] as const;
export const COATING_COLORS = ['薄白', '白厚', '黄', '灰黑', '剥落'] as const;
export const COATING_TEXTURES = ['薄', '厚', '正常'] as const;
export const MOISTURE_LEVELS = ['润', '燥', '正常'] as const;
export const GREASY_TYPES = ['腻', '腐', '否'] as const;
export const TONGUE_PARTS = ['舌尖', '舌边', '舌中', '舌根'] as const;
export const DEGREE_LEVELS = ['轻微', '中等', '明显', '严重'] as const;
export const FREQUENCY_LEVELS = ['持续', '间歇', '偶尔'] as const;

export const COMMON_SYMPTOMS = [
  '口干咽燥',
  '失眠多梦',
  '心烦易怒',
  '头晕耳鸣',
  '腰膝酸软',
  '胃脘胀满',
  '嗳气反酸',
  '食欲不振',
  '大便干结',
  '小便短黄',
  '畏寒肢冷',
  '自汗盗汗',
  '面色萎黄',
  '神疲乏力',
] as const;
