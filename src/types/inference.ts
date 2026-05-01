/**
 * 推理链类型定义 v2.0
 * 定义推理节点、推理链、修正规则、传变关系等核心类型
 */

import type { TongueAnalysisResult, ZoneFeature } from './tongue';

/**
 * 推理层级枚举
 */
export type InferenceLayer = 1 | 2 | 3 | 4;

/**
 * 节点类型枚举
 */
export type InferenceNodeType = 
  | 'tongue_feature'   // 舌象特征节点
  | 'pattern'          // 证型节点
  | 'organ'            // 脏腑节点
  | 'transmission'     // 传变节点
  | 'prescription';    // 配穴节点

/**
 * 推理输入项
 */
export interface InferenceInput {
  /** 输入来源类型 */
  sourceType: 'tongue_analysis' | 'previous_node' | 'interrogation' | 'age_weight';
  /** 来源ID */
  sourceId: string;
  /** 输入值 */
  value: string | number | boolean | object;
  /** 权重 */
  weight: number;
}

/**
 * 推理结论
 */
export interface InferenceConclusion {
  /** 结论标签 */
  label: string;
  /** 描述 */
  description: string;
  /** 置信度 0-1 */
  confidence: number;
  /** 支撑证据列表 */
  evidence: string[];
  /** 优先级 */
  priority: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * 修正规则（用于问诊验证）
 */
export interface CorrectionRule {
  /** 规则ID */
  id: string;
  /** 对应的问诊问题ID */
  questionId: string;
  /** 匹配的答案 */
  answers: CorrectionAnswer[];
}

/**
 * 修正答案映射
 */
export interface CorrectionAnswer {
  /** 用户回答 */
  answer: string;
  /** 调整类型 */
  adjustmentType: 'increase' | 'decrease' | 'replace' | 'invalidate' | 'split';
  /** 调整目标节点ID */
  targetNodeId: string;
  /** 具体修改内容 */
  modification: {
    /** 修改标签 */
    label?: string;
    /** 修改置信度 */
    confidence?: number;
    /** 修改描述 */
    description?: string;
    /** 置信度调整量 */
    confidenceDelta?: number;
    /** 替换为新的结论 */
    newConclusion?: InferenceConclusion;
  };
}

/**
 * 推理节点
 */
export interface InferenceNode {
  /** 节点唯一标识 */
  id: string;
  /** 节点名称 */
  name: string;
  /** 所属层级 */
  layer: InferenceLayer;
  /** 节点类型 */
  type: InferenceNodeType;
  /** 触发此节点的输入 */
  inputs: InferenceInput[];
  /** 推理结论 */
  conclusion: InferenceConclusion;
  /** 此节点的因（前置节点IDs） */
  causes: string[];
  /** 此节点的果（后续节点IDs） */
  effects: string[];
  /** 修正规则 */
  corrections: CorrectionRule[];
  /** 创建时间 */
  createdAt: string;
  /** 元数据 */
  metadata?: {
    /** 脏腑定位 */
    organLocation?: string[];
    /** 病性 */
    pathogenicNature?: string;
    /** 病位 */
    diseaseLocation?: string;
  };
}

/**
 * 层级处理输入
 */
export interface LayerInput {
  /** 舌象分析结果 */
  tongueAnalysis?: TongueAnalysisResult;
  /** 分区特征 */
  zoneFeatures?: ZoneFeature[];
  /** 前一层推理结果 */
  previousLayerOutput?: LayerOutput;
  /** 年龄 */
  age?: number;
  /** 上下文数据 */
  context?: Record<string, any>;
}

/**
 * 层级处理输出
 */
export interface LayerOutput {
  /** 层号 */
  layer: InferenceLayer;
  /** 本层生成的节点 */
  nodes: InferenceNode[];
  /** 本层综合结论 */
  summary: {
    label: string;
    description: string;
    confidence: number;
  };
  /** 需要验证的问题 */
  validationQuestions: string[];
}

/**
 * 传变类型枚举
 */
export type TransmissionType = 
  | '子盗母气'   // 子系统虚弱，消耗母系统资源
  | '母病及子'   // 母系统病变，影响子系统
  | '相克传变'   // 木克土/土克水/水克火/火克金/金克木
  | '相生传变'   // 木生火/火生土/土生金/金生水/水生木
  | '表里传变'   // 太阳→少阳→阳明→太阴→少阴→厥阴
  | '脏腑传变';  // 脏腑之间的直接传变

/**
 * 传变关系
 */
export interface TransmissionRelation {
  /** 传变ID */
  id: string;
  /** 传变类型 */
  type: TransmissionType;
  /** 源脏腑/系统 */
  sourceOrgan: string;
  /** 目标脏腑/系统 */
  targetOrgan: string;
  /** 传变条件 */
  condition: {
    /** 触发特征 */
    triggerFeatures: string[];
    /** 置信度阈值 */
    confidenceThreshold: number;
  };
  /** 传变结果 */
  result: {
    /** 传变描述 */
    description: string;
    /** 传变机制 */
    mechanism: string;
    /** 置信度 */
    confidence: number;
  };
}

/**
 * 推理链执行结果
 */
export interface InferenceChainOutput {
  /** 推理链ID */
  chainId: string;
  /** 执行状态 */
  status: 'success' | 'partial' | 'failed';
  /** 推理节点映射 */
  nodes: Map<string, InferenceNode>;
  /** 拓扑排序后的执行顺序 */
  executionOrder: string[];
  /** 证型结论 */
  syndrome: string;
  /** 根本原因 */
  rootCause: string;
  /** 传变路径描述 */
  transmissionPaths: string[];
  /** 脏腑辨证详情 */
  organPatterns: OrganPattern[];
  /** 配穴方案（可选，由Layer4生成） */
  prescription?: Prescription;
  /** 执行耗时 */
  executionTime?: number;
  /** 错误信息 */
  errorMessage?: string;
}

/**
 * 脏腑辨证详情
 */
export interface OrganPattern {
  /** 脏腑名称 */
  organ: string;
  /** 证型 */
  pattern: string;
  /** 病性 */
  nature: string;
  /** 置信度 */
  confidence: number;
  /** 主要症状 */
  mainSymptoms: string[];
  /** 相关节点ID */
  relatedNodeIds: string[];
}

/**
 * 配穴方案
 */
export interface Prescription {
  /** 方案ID */
  id: string;
  /** 主要穴位 */
  mainPoints: string[];
  /** 配穴 */
  secondaryPoints: string[];
  /** 特定穴 */
  specialPoints?: {
    yuanSource?: string;    // 原穴
    luoConnecting?: string; // 络穴
    xiCleft?: string;       // 郄穴
    backMu?: string;        // 背俞穴
    frontMu?: string;      // 募穴
    huiMeeting?: string;   // 会穴
  };
  /** 针法 */
  technique: '补法' | '泻法' | '平补平泻';
  /** 留针时间（分钟） */
  needleRetention: number;
  /** 艾灸建议 */
  moxibustion: string;
  /** 治疗频率 */
  frequency: string;
  /** 疗程 */
  course: string;
  /** 注意事项 */
  precautions: string[];
  /** 生成依据 */
  basis: string[];
  /** 置信度 */
  confidence: number;
}

/**
 * 推理上下文
 */
export interface InferenceContext {
  /** 患者年龄 */
  age: number;
  /** 患者性别 */
  gender?: '男' | '女' | '其他';
  /** 问诊反馈 */
  interrogationFeedback?: InterrogationFeedback[];
  /** 修正后的节点 */
  correctedNodes?: Map<string, InferenceNode>;
  /** 额外上下文 */
  extras?: Record<string, any>;
}

/**
 * 问诊反馈
 */
export interface InterrogationFeedback {
  /** 问题ID */
  questionId: string;
  /** 用户回答 */
  answer: string;
  /** 回答时间 */
  timestamp: string;
}

/**
 * 推理链可视化数据
 */
export interface ChainVisualization {
  /** 节点列表 */
  nodes: Array<{
    id: string;
    label: string;
    layer: number;
    type: string;
    confidence: number;
  }>;
  /** 边列表 */
  edges: Array<{
    source: string;
    target: string;
    label?: string;
  }>;
}

/**
 * 创建空推理节点的工厂函数
 */
export function createEmptyInferenceNode(
  id: string,
  name: string,
  layer: InferenceLayer,
  type: InferenceNodeType
): InferenceNode {
  return {
    id,
    name,
    layer,
    type,
    inputs: [],
    conclusion: {
      label: '',
      description: '',
      confidence: 0,
      evidence: [],
      priority: 'medium',
    },
    causes: [],
    effects: [],
    corrections: [],
    createdAt: new Date().toISOString(),
  };
}

/**
 * 层级名称映射
 */
export const LAYER_NAMES: Record<InferenceLayer, string> = {
  1: '舌质舌苔层',
  2: '舌形反直觉层',
  3: '分区凹凸层',
  4: '综合推理层',
};

/**
 * 层级描述映射
 */
export const LAYER_DESCRIPTIONS: Record<InferenceLayer, string> = {
  1: '舌质+舌苔 → 气血与脾胃整体判断',
  2: '舌形 → 虚实本质（反直觉层）',
  3: '分区凹凸 → 精确定位（"神"之层）',
  4: '综合推理 → 传变关系+配方案',
};
