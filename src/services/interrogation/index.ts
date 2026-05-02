/**
 * 问诊服务导出 v2.0
 * 
 * 问诊模块实现"望→问→知"闭环中的"问"
 * - 根据舌象和推理结果初始化问诊会话
 * - 动态生成验证性问题
 * - 根据用户回答应用修正规则
 * - 输出修正后的推理结论
 */

// 核心引擎
export { 
  InterrogationEngine, 
  InterrogationEngineStatus,
  createInterrogationSession,
} from './InterrogationEngine';

export type { 
  InterrogationResult,
} from './InterrogationEngine';

// 动态问题树
export { 
  QuestionTree,
  createQuestionTree,
} from './QuestionTree';

// 年龄权重计算器
export { 
  AgeWeightCalculator,
  createAgeWeightCalculator,
  getAgeGroup,
} from './AgeWeightCalculator';

// 十问歌
export { 
  TenQuestions,
  tenQuestions,
} from './TenQuestions';

// 修正规则库
export { 
  CorrectionRules,
  correctionRules,
  getCorrectionAction,
} from './CorrectionRules';

// 类型导出
export type {
  InterrogationSession,
  InterrogationEngineConfig,
  AnsweredQuestion,
  AccumulatedCorrection,
  Question,
  AgeGroup,
  AgeWeight,
  AgeWeightResult,
} from '@/types/interrogation';
