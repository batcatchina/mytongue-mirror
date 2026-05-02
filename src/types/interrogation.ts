/**
 * 问诊类型定义 v2.0
 * 定义问题、问题树、问诊会话、年龄权重等核心类型
 */

// 从 inference.ts 重新导出修正规则类型
export type { CorrectionRule, CorrectionAnswer } from '@/types/inference';

/**
 * 年龄段枚举
 */
export type AgeGroup = '少年' | '青年' | '中年' | '老年';

/**
 * 年龄权重配置
 */
export interface AgeWeight {
  /** 年龄段 */
  group: AgeGroup;
  /** 权重系数 */
  coefficient: number;
  /** 辨证倾向 */
  tendency: string;
  /** 问诊重点 */
  focus: string[];
}

/**
 * 问题选项
 */
export interface QuestionOption {
  /** 选项ID */
  id: string;
  /** 选项文本 */
  text: string;
  /** 选项值（用于匹配修正规则） */
  value: string;
  /** 是否为默认选项 */
  isDefault?: boolean;
}

/**
 * 问题触发条件
 */
export interface QuestionTrigger {
  /** 舌象特征触发 */
  tongueFeature?: string[];
  /** 前置回答触发 */
  previousAnswers?: string[];
  /** 年龄范围触发 */
  ageRange?: [number, number];
  /** 置信度阈值触发 */
  confidenceThreshold?: number;
  /** 节点ID触发 */
  nodeId?: string;
}

/**
 * 问题节点
 */
export interface Question {
  /** 问题ID */
  id: string;
  /** 问题内容 */
  content: string;
  /** 问题类型 */
  type: 'single_choice' | 'multiple_choice' | 'confirm';
  /** 选项列表 */
  options: QuestionOption[];
  /** 触发条件 */
  trigger: QuestionTrigger;
  /** 优先级（数值越小优先级越高） */
  priority: number;
  /** 对应的推理节点ID */
  relatedNodeId?: string;
  /** 验证目的说明 */
  validationPurpose?: string;
  /** 是否必答 */
  required: boolean;
}

/**
 * 问题节点（树结构）
 */
export interface QuestionNode {
  /** 节点ID */
  id: string;
  /** 问题内容 */
  content: string;
  /** 选项 */
  options: QuestionOption[];
  /** 触发条件 */
  trigger: QuestionTrigger;
  /** 修正规则 */
  corrections: QuestionCorrection[];
  /** 子问题映射（answer -> child node） */
  children?: Map<string, QuestionNode>;
  /** 优先级 */
  priority: number;
}

/**
 * 问题修正规则
 */
export interface QuestionCorrection {
  /** 规则ID */
  id: string;
  /** 触发答案 */
  triggerAnswer: string;
  /** 修正类型 */
  correctionType: 'increase' | 'decrease' | 'replace' | 'invalidate' | 'split';
  /** 目标节点ID */
  targetNodeId: string;
  /** 置信度调整量 */
  confidenceDelta?: number;
  /** 替换标签 */
  newLabel?: string;
  /** 替换描述 */
  newDescription?: string;
}

/**
 * 问诊会话状态
 */
export interface InterrogationSession {
  /** 会话ID */
  id: string;
  /** 患者年龄 */
  age: number;
  /** 年龄段 */
  ageGroup: AgeGroup;
  /** 年龄权重 */
  ageWeight: AgeWeight;
  /** 当前问题队列 */
  questionQueue: string[];
  /** 已回答的问题 */
  answeredQuestions: AnsweredQuestion[];
  /** 累积的修正指令 */
  corrections: AccumulatedCorrection[];
  /** 会话状态 */
  status: 'init' | 'in_progress' | 'completed' | 'skipped';
  /** 开始时间 */
  startTime: string;
  /** 结束时间 */
  endTime?: string;
  /** 跳过问诊标记 */
  skipped: boolean;
}

/**
 * 已回答的问题
 */
export interface AnsweredQuestion {
  /** 问题ID */
  questionId: string;
  /** 回答的选项值 */
  selectedOption: string;
  /** 回答文本 */
  answerText: string;
  /** 回答时间 */
  timestamp: string;
}

/**
 * 累积修正
 */
export interface AccumulatedCorrection {
  /** 目标节点ID */
  targetNodeId: string;
  /** 修正类型 */
  type: 'increase' | 'decrease' | 'replace' | 'invalidate' | 'split';
  /** 置信度调整量 */
  confidenceDelta?: number;
  /** 新标签 */
  newLabel?: string;
  /** 新描述 */
  newDescription?: string;
  /** 来源问题ID */
  sourceQuestionId: string;
  /** 来源回答 */
  sourceAnswer: string;
}

/**
 * 十问歌问题配置
 */
export interface TenQuestionsConfig {
  /** 序号 */
  order: number;
  /** 问诊内容 */
  content: string;
  /** 辨证对应 */
  dialecticalMapping: string;
  /** v2.0优先级 */
  priority: number;
  /** 相关舌象特征 */
  relatedTongueFeatures: string[];
  /** 问题模板 */
  questionTemplates: string[];
}

/**
 * 问诊引擎配置
 */
export interface InterrogationEngineConfig {
  /** 最大问题数 */
  maxQuestions: number;
  /** 置信度阈值（低于此值不生成问题） */
  confidenceThreshold: number;
  /** 是否启用年龄权重 */
  enableAgeWeight: boolean;
  /** 是否启用动态问题树 */
  enableDynamicTree: boolean;
}

/**
 * 年龄权重计算结果
 */
export interface AgeWeightResult {
  /** 年龄段 */
  group: AgeGroup;
  /** 基础权重 */
  baseWeight: number;
  /** 舌色解读映射 */
  tongueColorInterpretation: Record<string, string>;
  /** 辨证倾向调整 */
  patternAdjustment: Record<string, number>;
  /** 问诊重点 */
  interrogationFocus: string[];
}

/**
 * 创建默认年龄权重
 */
export const DEFAULT_AGE_WEIGHTS: Record<AgeGroup, AgeWeight> = {
  少年: {
    group: '少年',
    coefficient: 0.8,
    tendency: '易虚易实，变化快',
    focus: ['先天不足', '外感', '脾胃'],
  },
  青年: {
    group: '青年',
    coefficient: 1.0,
    tendency: '实证多见',
    focus: ['肝郁', '湿热', '气滞'],
  },
  中年: {
    group: '中年',
    coefficient: 1.1,
    tendency: '虚实夹杂',
    focus: ['肝郁脾虚', '肾虚'],
  },
  老年: {
    group: '老年',
    coefficient: 1.2,
    tendency: '虚证为主',
    focus: ['肾虚', '气血双亏'],
  },
};

/**
 * 十问歌标准问题配置
 */
export const TEN_QUESTIONS: TenQuestionsConfig[] = [
  {
    order: 0,
    content: '年龄（必问）',
    dialecticalMapping: '权重调节器',
    priority: 5,
    relatedTongueFeatures: [],
    questionTemplates: ['请输入您的年龄'],
  },
  {
    order: 1,
    content: '二便',
    dialecticalMapping: '脾虚/肾虚/湿热',
    priority: 5,
    relatedTongueFeatures: ['苔腻', '舌淡', '舌红'],
    questionTemplates: ['大便情况怎么样？', '小便情况如何？'],
  },
  {
    order: 2,
    content: '寒热',
    dialecticalMapping: '阳虚/阴虚/少阳证',
    priority: 4,
    relatedTongueFeatures: ['舌淡', '舌红'],
    questionTemplates: ['怕冷还是怕热？', '手脚凉还是手脚心热？'],
  },
  {
    order: 3,
    content: '睡眠',
    dialecticalMapping: '心肝辨证',
    priority: 4,
    relatedTongueFeatures: ['舌尖凹陷', '舌边红'],
    questionTemplates: ['睡眠质量怎么样？', '容易失眠还是嗜睡？'],
  },
  {
    order: 4,
    content: '头身',
    dialecticalMapping: '肝阳/血虚/风湿',
    priority: 4,
    relatedTongueFeatures: ['舌边色深'],
    questionTemplates: ['有头晕头痛吗？', '身体容易酸痛吗？'],
  },
  {
    order: 5,
    content: '饮食',
    dialecticalMapping: '脾胃/肝胆',
    priority: 4,
    relatedTongueFeatures: ['舌中凹陷', '苔腻'],
    questionTemplates: ['胃口怎么样？', '有没有口苦口干？'],
  },
  {
    order: 6,
    content: '汗',
    dialecticalMapping: '表虚/里热/阴虚盗汗',
    priority: 3,
    relatedTongueFeatures: ['舌淡', '舌红'],
    questionTemplates: ['容易出汗吗？', '是自汗还是盗汗？'],
  },
  {
    order: 7,
    content: '胸腹',
    dialecticalMapping: '肝郁/气滞/瘀血',
    priority: 3,
    relatedTongueFeatures: ['舌边红凸', '舌紫'],
    questionTemplates: ['有胸闷胁胀吗？', '腹部有没有不适？'],
  },
  {
    order: 8,
    content: '耳/渴',
    dialecticalMapping: '肾虚/阴虚',
    priority: 2,
    relatedTongueFeatures: ['舌根凹陷', '舌红少苔'],
    questionTemplates: ['有没有耳鸣？', '口渴吗？'],
  },
  {
    order: 9,
    content: '旧病/病因',
    dialecticalMapping: '病因追溯',
    priority: 2,
    relatedTongueFeatures: [],
    questionTemplates: ['有什么旧病吗？', '这次不舒服有什么诱因吗？'],
  },
];

/**
 * 根据年龄段获取问题过滤函数
 */
export function getAgeBasedQuestionFilter(age: number): (q: TenQuestionsConfig) => boolean {
  return (question) => {
    // 年龄是必问的
    if (question.order === 0) return true;
    
    // 根据年龄调整问题优先级
    if (age < 18) {
      // 少年：重点问先天/脾胃/外感
      return ['二便', '饮食', '寒热'].includes(question.content);
    } else if (age < 35) {
      // 青年：重点问肝郁/湿热/气滞
      return ['二便', '寒热', '睡眠', '头身', '饮食'].includes(question.content);
    } else if (age < 56) {
      // 中年：重点问肝郁脾虚/肾虚
      return ['二便', '寒热', '睡眠', '饮食', '汗'].includes(question.content);
    } else {
      // 老年：重点问肾虚/气血双亏
      return ['二便', '寒热', '睡眠', '耳/渴', '头身'].includes(question.content);
    }
  };
}
