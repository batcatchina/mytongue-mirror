/**
 * 问诊引擎 v2.0
 * 管理问诊流程、问题生成、用户反馈处理
 */

import type {
  InterrogationSession,
  InterrogationEngineConfig,
  AnsweredQuestion,
  AccumulatedCorrection,
  Question,
} from '@/types/interrogation';
import { AgeWeightCalculator } from './AgeWeightCalculator';
import { QuestionTree } from './QuestionTree';
import { TEN_QUESTIONS } from '@/types/interrogation';

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
  }
  
  /**
   * 初始化问诊会话
   */
  initialize(age: number, tongueAnalysis: any): InterrogationSession {
    // 计算年龄权重
    const ageWeight = this.ageCalculator.calculate(age);
    
    // 获取年龄段
    const ageGroup = this.ageCalculator.getAgeGroup(age);
    
    // 生成初始问题
    const initialQuestions = this.generateInitialQuestions(age, tongueAnalysis);
    
    // 创建会话
    const session: InterrogationSession = {
      id: `session-${Date.now()}`,
      age,
      ageGroup,
      ageWeight,
      questionQueue: initialQuestions.map(q => q.id),
      answeredQuestions: [],
      corrections: [],
      status: 'init',
      startTime: new Date().toISOString(),
      skipped: false,
    };
    
    this.currentSession = session;
    return session;
  }
  
  /**
   * 生成初始问题
   */
  private generateInitialQuestions(age: number, tongueAnalysis: any): Question[] {
    const questions: Question[] = [];
    
    // 根据舌象特征生成相关问题
    if (tongueAnalysis) {
      // 根据舌色
      if (tongueAnalysis.bodyColor === '淡白') {
        questions.push(this.createQuestion('q-cold', '是否怕冷？', ['怕冷', '不怕冷']));
      }
      if (tongueAnalysis.bodyColor === '红') {
        questions.push(this.createQuestion('q-hot', '是否怕热？', ['怕热', '不怕热']));
      }
      
      // 根据舌形
      if (tongueAnalysis.shape === '胖大') {
        questions.push(this.createQuestion('q-fatigue', '是否容易疲劳？', ['容易疲劳', '不太疲劳']));
      }
      if (tongueAnalysis.shape === '瘦薄') {
        questions.push(this.createQuestion('q-thirsty', '是否口干？', ['口干明显', '口干不明显']));
      }
      
      // 根据苔色
      if (tongueAnalysis.coatingColor === '黄') {
        questions.push(this.createQuestion('q-bitter', '是否口苦？', ['口苦', '口不苦']));
      }
      if (tongueAnalysis.coatingColor === '腻') {
        questions.push(this.createQuestion('q-stool', '大便情况如何？', ['便溏', '大便正常', '便秘']));
      }
    }
    
    // 添加十问歌相关问题
    for (const q of TEN_QUESTIONS.slice(1, 5)) { // 二便、寒热、睡眠、头身
      const relatedQuestion = this.createQuestion(
        `q-ten-${q.order}`,
        q.questionTemplates[0],
        ['有', '无', '不确定']
      );
      if (!questions.find(q => q.id === relatedQuestion.id)) {
        questions.push(relatedQuestion);
      }
    }
    
    return questions.slice(0, this.config.maxQuestions);
  }
  
  /**
   * 创建问题
   */
  private createQuestion(id: string, content: string, options: string[]): Question {
    return {
      id,
      content,
      type: 'single_choice',
      options: options.map((opt, idx) => ({
        id: `opt-${idx}`,
        text: opt,
        value: opt,
      })),
      trigger: {},
      priority: 1,
      required: true,
    };
  }
  
  /**
   * 获取下一个问题
   */
  getNextQuestion(session?: InterrogationSession): Question | null {
    const s = session || this.currentSession;
    if (!s) return null;
    
    if (s.questionQueue.length === 0) {
      return null;
    }
    
    // 返回队列中的下一个问题
    const nextQuestionId = s.questionQueue[0];
    return this.questionTree.getQuestion(nextQuestionId) ?? null;
  }
  
  /**
   * 处理用户回答
   */
  processAnswer(
    session: InterrogationSession,
    questionId: string,
    selectedOption: string
  ): InterrogationSession {
    // 查找问题
    const question = this.questionTree.getQuestion(questionId);
    if (!question) {
      return session;
    }
    
    // 查找选项
    const option = question.options.find(o => o.value === selectedOption);
    
    // 创建回答记录
    const answered: AnsweredQuestion = {
      questionId,
      selectedOption,
      answerText: option?.text || selectedOption,
      timestamp: new Date().toISOString(),
    };
    
    // 获取修正规则并转换为累积修正格式
    const rawCorrections = this.questionTree.getCorrections(questionId, selectedOption);
    const corrections: AccumulatedCorrection[] = rawCorrections.map(rule => ({
      targetNodeId: rule.targetNodeId,
      type: rule.correctionType,
      confidenceDelta: rule.confidenceDelta,
      newLabel: rule.newLabel,
      newDescription: rule.newDescription,
      sourceQuestionId: questionId,
      sourceAnswer: selectedOption,
    }));
    
    // 更新会话
    const updatedSession: InterrogationSession = {
      ...session,
      answeredQuestions: [...session.answeredQuestions, answered],
      corrections: [...session.corrections, ...corrections],
      questionQueue: session.questionQueue.filter(id => id !== questionId),
    };
    
    // 检查是否完成
    if (updatedSession.questionQueue.length === 0) {
      updatedSession.status = 'completed';
      updatedSession.endTime = new Date().toISOString();
    }
    
    this.currentSession = updatedSession;
    return updatedSession;
  }
  
  /**
   * 跳过问诊
   */
  skipInterrogation(session: InterrogationSession): InterrogationSession {
    return {
      ...session,
      status: 'skipped',
      skipped: true,
      endTime: new Date().toISOString(),
    };
  }
  
  /**
   * 判断是否可以结束问诊
   */
  isComplete(session: InterrogationSession): boolean {
    return session.status === 'completed' || 
           session.status === 'skipped' ||
           session.questionQueue.length === 0;
  }
  
  /**
   * 获取累积的修正指令
   */
  getCorrections(session: InterrogationSession): AccumulatedCorrection[] {
    return session.corrections;
  }
  
  /**
   * 应用修正到推理链
   */
  applyCorrectionsToChain(corrections: AccumulatedCorrection[], chain: any): void {
    for (const correction of corrections) {
      chain.correct(correction.sourceQuestionId, correction.sourceAnswer);
    }
  }
  
  /**
   * 获取问诊进度
   */
  getProgress(session: InterrogationSession): {
    total: number;
    answered: number;
    remaining: number;
    percentage: number;
  } {
    const total = session.answeredQuestions.length + session.questionQueue.length;
    const answered = session.answeredQuestions.length;
    return {
      total,
      answered,
      remaining: session.questionQueue.length,
      percentage: total > 0 ? Math.round((answered / total) * 100) : 0,
    };
  }
  
  /**
   * 重置引擎
   */
  reset(): void {
    this.currentSession = undefined;
  }
}
