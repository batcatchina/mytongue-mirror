/**
 * 问诊引擎 v2.0
 * 管理问诊流程、问题生成、用户反馈处理
 * 
 * 核心定位：问诊不是填问卷，是与推理引擎联动的动态验证
 * 推理引擎四层推理出初步结论 → 问诊验证 → 修正推理 → 输出最终方案
 */

import type {
  InterrogationSession,
  InterrogationEngineConfig,
  AnsweredQuestion,
  AccumulatedCorrection,
  Question,
} from '@/types/interrogation';
import type { InferenceNode } from '@/types/inference';
import type { TongueAnalysisResult } from '@/types/tongue';
import { AgeWeightCalculator } from './AgeWeightCalculator';
import { QuestionTree } from './QuestionTree';
import { getCorrectionAction } from './CorrectionRules';

/**
 * 问诊引擎状态
 */
export enum InterrogationEngineStatus {
  Idle = 'idle',
  Initializing = 'initializing',
  InProgress = 'in_progress',
  Completed = 'completed',
  Skipped = 'skipped',
}

/**
 * 问诊结果
 */
export interface InterrogationResult {
  /** 是否完成 */
  isComplete: boolean;
  /** 修正后的推理节点 */
  correctedNodes: InferenceNode[];
  /** 累积的修正 */
  corrections: AccumulatedCorrection[];
  /** 最终证型结论 */
  finalSyndrome: string;
  /** 置信度变化 */
  confidenceChanges: Record<string, number>;
  /** 问诊摘要 */
  summary: string;
}

/**
 * 问诊引擎
 * 负责管理整个问诊流程
 */
export class InterrogationEngine {
  /** 引擎配置 */
  private config: InterrogationEngineConfig;
  /** 年龄权重计算器 */
  private ageCalculator: AgeWeightCalculator;
  /** 问题树 */
  private questionTree: QuestionTree;
  /** 当前会话 */
  private currentSession?: InterrogationSession;
  /** 原始推理节点（用于修正） */
  private originalNodes: Map<string, InferenceNode>;
  /** 当前推理节点（已修正） */
  private currentNodes: Map<string, InferenceNode>;
  /** 引擎状态 */
  private status: InterrogationEngineStatus;

  constructor(config?: Partial<InterrogationEngineConfig>) {
    this.config = {
      maxQuestions: 10,
      confidenceThreshold: 0.7,
      enableAgeWeight: true,
      enableDynamicTree: true,
      ...config,
    };

    this.ageCalculator = new AgeWeightCalculator();
    this.questionTree = new QuestionTree();
    this.originalNodes = new Map();
    this.currentNodes = new Map();
    this.status = InterrogationEngineStatus.Idle;
  }

  /**
   * 根据舌象和推理结果初始化问诊会话
   * @param tongueResult 舌象分析结果
   * @param inferenceNodes 推理节点列表
   * @param age 患者年龄（可选）
   * @returns 初始问题
   */
  startSession(
    tongueResult: TongueAnalysisResult,
    inferenceNodes: InferenceNode[],
    age?: number
  ): Question | undefined {
    // 设置状态
    this.status = InterrogationEngineStatus.Initializing;

    // 初始化年龄权重
    if (age !== undefined && this.config.enableAgeWeight) {
      this.ageCalculator.setAge(age);
    }

    // 保存原始推理节点
    this.originalNodes = new Map();
    this.currentNodes = new Map();
    for (const node of inferenceNodes) {
      this.originalNodes.set(node.id, { ...node });
      this.currentNodes.set(node.id, { ...node });
    }

    // 创建问诊会话
    this.currentSession = {
      id: `session-${Date.now()}`,
      age: age || this.ageCalculator.getAge(),
      ageGroup: this.ageCalculator.getAgeGroup(),
      ageWeight: this.ageCalculator.getConfig(),
      questionQueue: [],
      answeredQuestions: [],
      corrections: [],
      status: 'init',
      startTime: new Date().toISOString(),
      skipped: false,
    };

    // 构建问题树
    const questions = this.questionTree.buildTree(
      tongueResult,
      inferenceNodes,
      age
    );

    // 筛选需要验证的问题（置信度低于阈值）
    const validationQuestions = this.filterValidationQuestions(
      inferenceNodes,
      questions
    );

    // 设置问题队列
    this.currentSession.questionQueue = validationQuestions.map(q => q.id);

    // 更新状态
    this.currentSession.status = 'in_progress';
    this.status = InterrogationEngineStatus.InProgress;

    // 返回第一个问题
    return validationQuestions[0];
  }

  /**
   * 筛选需要验证的问题
   */
  private filterValidationQuestions(
    nodes: InferenceNode[],
    questions: Question[]
  ): Question[] {
    const validationQuestions: Question[] = [];

    for (const node of nodes) {
      // 只验证置信度在 0.3-0.7 之间的问题
      if (node.conclusion.confidence >= 0.3 && node.conclusion.confidence < this.config.confidenceThreshold) {
        // 查找相关问题
        const relatedQuestion = questions.find(
          q => q.relatedNodeId === node.id ||
               node.conclusion.label.includes(this.getQuestionPattern(q.id))
        );
        if (relatedQuestion) {
          validationQuestions.push(relatedQuestion);
        }
      }
    }

    // 如果没有需要验证的问题，添加基础问题
    if (validationQuestions.length === 0) {
      // 按优先级添加基础问题
      const baseQuestions = questions.filter(q => q.required || q.priority <= 5);
      validationQuestions.push(...baseQuestions.slice(0, 3));
    }

    // 按优先级排序
    return validationQuestions.sort((a, b) => a.priority - b.priority);
  }

  /**
   * 从问题ID获取模式
   */
  private getQuestionPattern(questionId: string): string {
    const patternMap: Record<string, string> = {
      'q-sleep': '心',
      'q-fatigue': '气虚',
      'q-stool': '脾',
      'q-diet': '脾',
      'q-cold-heat': '虚',
      'q-chest-abdomen': '肝',
      'q-ear-thirst': '肾',
      'q-thirsty': '阴虚',
      'q-head-body': '血虚',
    };
    return patternMap[questionId] || '';
  }

  /**
   * 获取下一个动态问题
   * @returns 下一个问题，如果没有更多问题则返回 undefined
   */
  getNextQuestion(): Question | undefined {
    if (!this.currentSession || this.isComplete()) {
      return undefined;
    }

    // 获取已回答的问题ID
    const answeredIds = this.currentSession.answeredQuestions.map(a => a.questionId);

    // 获取下一个未回答的问题
    const nextQuestion = this.questionTree.getNextUnansweredQuestion(answeredIds);

    // 如果没有未回答的问题，尝试动态生成
    if (!nextQuestion && this.currentSession.questionQueue.length > 0) {
      const nextId = this.currentSession.questionQueue[0];
      return this.questionTree.getQuestion(nextId);
    }

    return nextQuestion;
  }

  /**
   * 提交用户回答
   * @param questionId 问题ID
   * @param answer 用户回答
   * @returns 修正结果
   */
  submitAnswer(questionId: string, answer: string): {
    correction: AccumulatedCorrection | null;
    nextQuestion: Question | undefined;
  } {
    if (!this.currentSession) {
      throw new Error('问诊会话未初始化');
    }

    // 记录回答
    const answeredQuestion: AnsweredQuestion = {
      questionId,
      selectedOption: answer,
      answerText: answer,
      timestamp: new Date().toISOString(),
    };
    this.currentSession.answeredQuestions.push(answeredQuestion);

    // 查找匹配的修正规则
    const correctionAction = getCorrectionAction(questionId, answer);

    let correction: AccumulatedCorrection | null = null;

    if (correctionAction) {
      // 应用修正
      correction = this.applyCorrection(
        correctionAction.targetNodeId,
        correctionAction.type as 'increase' | 'decrease' | 'replace' | 'invalidate' | 'split',
        correctionAction.modification,
        questionId,
        answer
      );
      this.currentSession.corrections.push(correction);
    }

    // 获取下一个问题
    const nextQuestion = this.getNextQuestion();

    // 检查是否完成
    if (this.shouldComplete()) {
      this.currentSession.status = 'completed';
      this.status = InterrogationEngineStatus.Completed;
      this.currentSession.endTime = new Date().toISOString();
    }

    return { correction, nextQuestion };
  }

  /**
   * 应用修正到推理节点
   */
  private applyCorrection(
    targetNodeId: string,
    type: 'increase' | 'decrease' | 'replace' | 'invalidate' | 'split',
    modification: { label?: string; description?: string; confidenceDelta?: number },
    sourceQuestionId: string,
    sourceAnswer: string
  ): AccumulatedCorrection {
    const node = this.currentNodes.get(targetNodeId);
    if (!node) {
      // 如果节点不存在，创建一个新的
      const newNode: InferenceNode = {
        id: targetNodeId,
        name: modification.label || targetNodeId,
        layer: 2,
        type: 'pattern',
        inputs: [{
          sourceType: 'interrogation',
          sourceId: sourceQuestionId,
          value: sourceAnswer,
          weight: 1,
        }],
        conclusion: {
          label: modification.label || targetNodeId,
          description: modification.description || '',
          confidence: Math.abs(modification.confidenceDelta || 0.1),
          evidence: [`通过问诊 "${sourceQuestionId}" 验证`],
          priority: 'medium',
        },
        causes: [],
        effects: [],
        corrections: [],
        createdAt: new Date().toISOString(),
      };
      this.currentNodes.set(targetNodeId, newNode);
    } else {
      // 修正现有节点
      switch (type) {
        case 'increase':
          node.conclusion.confidence = Math.min(
            1.0,
            node.conclusion.confidence + (modification.confidenceDelta || 0.1)
          );
          if (modification.label) {
            node.conclusion.label = modification.label;
          }
          node.conclusion.evidence.push(`问诊 "${sourceQuestionId}" 支持`);
          break;

        case 'decrease':
          node.conclusion.confidence = Math.max(
            0,
            node.conclusion.confidence - Math.abs(modification.confidenceDelta || 0.1)
          );
          node.conclusion.evidence.push(`问诊 "${sourceQuestionId}" 不支持`);
          break;

        case 'replace':
          if (modification.label) {
            node.conclusion.label = modification.label;
          }
          if (modification.description) {
            node.conclusion.description = modification.description;
          }
          if (modification.confidenceDelta) {
            node.conclusion.confidence = Math.max(
              0.3,
              Math.min(1.0, node.conclusion.confidence + modification.confidenceDelta)
            );
          }
          node.conclusion.evidence.push(`问诊 "${sourceQuestionId}" 修正为 "${modification.label}"`);
          break;

        case 'invalidate':
          node.conclusion.confidence = 0;
          node.conclusion.evidence.push(`问诊 "${sourceQuestionId}" 否定`);
          break;

        case 'split':
          // 处理分裂（创建新节点）
          if (modification.label) {
            const newNode: InferenceNode = {
              id: `${targetNodeId}-split`,
              name: modification.label,
              layer: node.layer,
              type: node.type,
              inputs: [{
                sourceType: 'interrogation',
                sourceId: sourceQuestionId,
                value: sourceAnswer,
                weight: 1,
              }],
              conclusion: {
                label: modification.label,
                description: modification.description || '',
                confidence: modification.confidenceDelta ? Math.abs(modification.confidenceDelta) : 0.5,
                evidence: [`通过问诊 "${sourceQuestionId}" 分裂`],
                priority: 'medium',
              },
              causes: [targetNodeId],
              effects: [],
              corrections: [],
              createdAt: new Date().toISOString(),
            };
            this.currentNodes.set(newNode.id, newNode);
          }
          break;
      }
    }

    return {
      targetNodeId,
      type,
      confidenceDelta: modification.confidenceDelta,
      newLabel: modification.label,
      newDescription: modification.description,
      sourceQuestionId,
      sourceAnswer,
    };
  }

  /**
   * 根据回答修正推理链
   */
  applyCorrections(): void {
    if (!this.currentSession) return;

    // 所有修正已在 submitAnswer 中应用
    // 这里可以添加额外的批量处理逻辑
  }

  /**
   * 判断问诊是否完成
   */
  isComplete(): boolean {
    if (!this.currentSession) return false;

    // 检查是否已回答足够多的问题
    const answeredCount = this.currentSession.answeredQuestions.length;
    if (answeredCount >= this.config.maxQuestions) {
      return true;
    }

    // 检查问题队列是否为空
    if (this.currentSession.questionQueue.length === 0 && answeredCount > 0) {
      return true;
    }

    // 检查状态
    return this.currentSession.status === 'completed' ||
           this.currentSession.status === 'skipped';
  }

  /**
   * 判断是否应该完成问诊
   */
  private shouldComplete(): boolean {
    if (!this.currentSession) return false;

    const answeredCount = this.currentSession.answeredQuestions.length;
    
    // 已回答足够多问题
    if (answeredCount >= this.config.maxQuestions) {
      return true;
    }

    // 所有问题都已回答
    if (this.currentSession.questionQueue.length === 0) {
      return true;
    }

    // 累积的修正已验证主要结论
    const highConfidenceNodes = Array.from(this.currentNodes.values())
      .filter(n => n.conclusion.confidence >= this.config.confidenceThreshold);
    
    if (highConfidenceNodes.length >= 2) {
      return true;
    }

    return false;
  }

  /**
   * 获取修正后的推理结果
   */
  getCorrectedInference(): InferenceResult {
    if (!this.currentSession) {
      throw new Error('问诊会话未初始化');
    }

    const nodes = Array.from(this.currentNodes.values());
    
    // 按置信度排序
    const sortedNodes = [...nodes].sort(
      (a, b) => b.conclusion.confidence - a.conclusion.confidence
    );

    // 生成最终证型
    const primarySyndrome = sortedNodes
      .filter(n => n.conclusion.confidence >= this.config.confidenceThreshold)
      .map(n => n.conclusion.label)
      .slice(0, 3)
      .join('，');

    // 计算置信度变化
    const confidenceChanges: Record<string, number> = {};
    for (const [nodeId, currentNode] of this.currentNodes) {
      const originalNode = this.originalNodes.get(nodeId);
      if (originalNode) {
        const change = currentNode.conclusion.confidence - originalNode.conclusion.confidence;
        if (Math.abs(change) > 0.01) {
          confidenceChanges[nodeId] = change;
        }
      }
    }

    return {
      nodes: sortedNodes,
      primarySyndrome: primarySyndrome || '待进一步辨证',
      confidenceChanges,
      session: this.currentSession,
    };
  }

  /**
   * 跳过问诊
   */
  skip(): void {
    if (!this.currentSession) return;

    this.currentSession.status = 'skipped';
    this.currentSession.skipped = true;
    this.currentSession.endTime = new Date().toISOString();
    this.status = InterrogationEngineStatus.Skipped;
  }

  /**
   * 获取当前会话状态
   */
  getSession(): InterrogationSession | undefined {
    return this.currentSession;
  }

  /**
   * 获取已回答的问题
   */
  getAnsweredQuestions(): AnsweredQuestion[] {
    return this.currentSession?.answeredQuestions || [];
  }

  /**
   * 获取累积的修正
   */
  getCorrections(): AccumulatedCorrection[] {
    return this.currentSession?.corrections || [];
  }

  /**
   * 获取问诊进度
   */
  getProgress(): { current: number; total: number } {
    const total = this.currentSession?.questionQueue.length || 0;
    const current = this.currentSession?.answeredQuestions.length || 0;
    return { current, total };
  }

  /**
   * 获取引擎状态
   */
  getStatus(): InterrogationEngineStatus {
    return this.status;
  }
}

/**
 * 推理结果类型
 */
interface InferenceResult {
  nodes: InferenceNode[];
  primarySyndrome: string;
  confidenceChanges: Record<string, number>;
  session: InterrogationSession;
}

/**
 * 问诊会话工厂函数
 */
export function createInterrogationSession(
  tongueResult: TongueAnalysisResult,
  inferenceNodes: InferenceNode[],
  age?: number
): {
  engine: InterrogationEngine;
  firstQuestion: Question | undefined;
} {
  const engine = new InterrogationEngine();
  const firstQuestion = engine.startSession(tongueResult, inferenceNodes, age);
  return { engine, firstQuestion };
}
