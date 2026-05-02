/**
 * 动态问题树 v2.0
 * 管理问诊问题的树形结构和动态导航
 * 
 * 核心特性：
 * - 根据舌象特征和已获信息实时生成问诊路径
 * - 不是固定问卷，而是动态树形结构
 * - 根据用户回答决定下一个问题节点
 */

import type { Question } from '@/types/interrogation';
import type { TongueAnalysisResult } from '@/types/tongue';
import type { InferenceNode } from '@/types/inference';
import { AgeWeightCalculator } from './AgeWeightCalculator';

/**
 * 舌象特征到问题的映射
 */
const TONGUE_FEATURE_QUESTIONS: Record<string, {
  question: string;
  options: string[];
  relatedNodeIds: string[];
}> = {
  '舌尖凹陷': {
    question: '最近有心慌、失眠或头晕的症状吗？',
    options: ['有心慌', '有失眠', '有头晕', '都没有'],
    relatedNodeIds: ['L3-heart-qi-deficiency', 'L3-heart-yin-deficiency'],
  },
  '舌尖红': {
    question: '容易心烦或口舌生疮吗？',
    options: ['经常心烦', '有口疮', '都没有', '偶尔'],
    relatedNodeIds: ['L3-heart-fire', 'L2-yin-deficiency'],
  },
  '舌边红凸': {
    question: '平时容易烦躁或胁肋胀痛吗？',
    options: ['经常烦躁', '偶尔胁胀', '都没有', '都有'],
    relatedNodeIds: ['L3-liver-fire', 'L3-liver-qi-stagnation'],
  },
  '舌边色深': {
    question: '有口苦或眼睛干涩吗？',
    options: ['有口苦', '眼干', '都没有', '都有'],
    relatedNodeIds: ['L3-liver-fire', 'L2-yin-deficiency'],
  },
  '舌中凹陷': {
    question: '胃口怎么样？大便成形吗？',
    options: ['胃口差+便溏', '胃口差+便干', '胃口尚可', '都正常'],
    relatedNodeIds: ['L3-spleen-qi-deficiency', 'L2-spleen-deficiency'],
  },
  '舌中苔腻': {
    question: '口中有黏腻感吗？',
    options: ['很黏腻', '有点', '不明显', '无'],
    relatedNodeIds: ['L2-dampness', 'L3-spleen-damp'],
  },
  '舌根凹陷': {
    question: '有腰酸、耳鸣或夜尿多吗？',
    options: ['腰酸明显', '耳鸣', '夜尿多', '都没有'],
    relatedNodeIds: ['L3-kidney-deficiency', 'L2-kidney-yin-deficiency'],
  },
  '舌根苔黄腻': {
    question: '有小便黄、腰酸或下肢沉重吗？',
    options: ['小便黄', '腰酸', '下肢沉重', '都没有'],
    relatedNodeIds: ['L3-lower-jiao-damp-heat', 'L2-damp-heat'],
  },
  '舌淡胖大': {
    question: '平时容易疲劳或四肢发沉吗？',
    options: ['容易疲劳', '四肢发沉', '都有', '都没有'],
    relatedNodeIds: ['L2-qi-deficiency', 'L2-dampness'],
  },
  '舌红裂纹': {
    question: '口干、手脚心热吗？',
    options: ['口干明显', '手脚心热', '都有', '都没有'],
    relatedNodeIds: ['L2-yin-deficiency', 'L3-empty-heat'],
  },
  '齿痕舌': {
    question: '平时容易腹胀或大便不成形吗？',
    options: ['腹胀明显', '大便溏稀', '都有', '都没有'],
    relatedNodeIds: ['L2-spleen-deficiency', 'L3-spleen-damp'],
  },
  '舌紫': {
    question: '有固定部位疼痛或面色晦暗吗？',
    options: ['有疼痛', '面色晦暗', '都没有', '都有'],
    relatedNodeIds: ['L4-blood-stasis', 'L2-blood-stasis'],
  },
};

/**
 * 问题树
 */
export class QuestionTree {
  /** 问题映射 */
  private questionMap: Map<string, Question>;
  /** 已添加问题的ID集合 */
  private addedQuestionIds: Set<string>;
  
  constructor() {
    this.questionMap = new Map();
    this.addedQuestionIds = new Set();
    this.initializeDefaultQuestions();
  }

  /**
   * 初始化默认问题
   */
  private initializeDefaultQuestions(): void {
    // 年龄问题（必问）
    this.addQuestion(this.createAgeQuestion());
    
    // 二便问题（高优先级）
    this.addQuestion(this.createStoolQuestion());
    this.addQuestion(this.createUrineQuestion());
    
    // 寒热问题
    this.addQuestion(this.createColdHeatQuestion());
    
    // 睡眠问题
    this.addQuestion(this.createSleepQuestion());
    
    // 头身问题
    this.addQuestion(this.createHeadBodyQuestion());
    
    // 饮食问题
    this.addQuestion(this.createDietQuestion());
    
    // 胸腹问题
    this.addQuestion(this.createChestAbdomenQuestion());
    
    // 耳渴问题
    this.addQuestion(this.createEarThirstQuestion());
    
    // 疲劳问题
    this.addQuestion(this.createFatigueQuestion());
    
    // 口干问题
    this.addQuestion(this.createThirstyQuestion());
  }

  /**
   * 创建年龄问题
   */
  private createAgeQuestion(): Question {
    return {
      id: 'q-age',
      content: '请告诉我您的年龄',
      type: 'single_choice',
      options: [
        { id: 'opt-young', text: '18岁以下', value: '少年' },
        { id: 'opt-adult', text: '19-35岁', value: '青年' },
        { id: 'opt-middle', text: '36-55岁', value: '中年' },
        { id: 'opt-elder', text: '56岁以上', value: '老年' },
      ],
      trigger: {},
      priority: 0,
      required: true,
      validationPurpose: '年龄是辨证的第一权重，调节所有后续推理',
    };
  }

  /**
   * 创建大便问题
   */
  private createStoolQuestion(): Question {
    return {
      id: 'q-stool',
      content: '大便情况怎么样？',
      type: 'single_choice',
      options: [
        { id: 'opt-loose', text: '大便溏稀', value: '便溏' },
        { id: 'opt-normal', text: '大便正常', value: '正常' },
        { id: 'opt-constipated', text: '便秘/大便干', value: '便秘' },
        { id: 'opt-unsure', text: '不太规律', value: '不规律' },
      ],
      trigger: {},
      priority: 1,
      required: true,
      validationPurpose: '大便异常直接反映脾胃和肠道状态',
    };
  }

  /**
   * 创建小便问题
   */
  private createUrineQuestion(): Question {
    return {
      id: 'q-urine',
      content: '小便情况怎么样？',
      type: 'single_choice',
      options: [
        { id: 'opt-yellow', text: '小便黄', value: '小便黄' },
        { id: 'opt-clear', text: '小便清长', value: '小便清长' },
        { id: 'opt-normal', text: '小便正常', value: '正常' },
        { id: 'opt-night', text: '夜尿多', value: '夜尿多' },
      ],
      trigger: {},
      priority: 2,
      required: false,
      validationPurpose: '小便反映肾和膀胱功能',
    };
  }

  /**
   * 创建寒热问题
   */
  private createColdHeatQuestion(): Question {
    return {
      id: 'q-cold-heat',
      content: '您怕冷还是怕热？',
      type: 'single_choice',
      options: [
        { id: 'opt-cold', text: '怕冷', value: '怕冷' },
        { id: 'opt-hot', text: '怕热', value: '怕热' },
        { id: 'opt-neutral', text: '无明显感觉', value: '正常' },
        { id: 'opt-hands-feet', text: '手脚心热/凉', value: '手足寒热' },
      ],
      trigger: {},
      priority: 3,
      required: true,
      validationPurpose: '寒热辨别阴阳虚实',
    };
  }

  /**
   * 创建睡眠问题
   */
  private createSleepQuestion(): Question {
    return {
      id: 'q-sleep',
      content: '睡眠质量怎么样？',
      type: 'single_choice',
      options: [
        { id: 'opt-insomnia', text: '失眠/难入睡', value: '失眠' },
        { id: 'opt-light', text: '容易醒/多梦', value: '睡眠差' },
        { id: 'opt-good', text: '睡眠良好', value: '正常' },
        { id: 'opt-sleepy', text: '嗜睡/总想睡', value: '嗜睡' },
      ],
      trigger: {},
      priority: 4,
      required: true,
      validationPurpose: '睡眠反映心肝和阴阳平衡',
    };
  }

  /**
   * 创建头身问题
   */
  private createHeadBodyQuestion(): Question {
    return {
      id: 'q-head-body',
      content: '有头晕头痛或身体酸痛吗？',
      type: 'single_choice',
      options: [
        { id: 'opt-dizzy', text: '头晕', value: '头晕' },
        { id: 'opt-headache', text: '头痛', value: '头痛' },
        { id: 'opt-pain', text: '身体酸痛', value: '身痛' },
        { id: 'opt-none', text: '无明显不适', value: '无' },
      ],
      trigger: {},
      priority: 5,
      required: false,
      validationPurpose: '头身不适反映肝阳和血虚状态',
    };
  }

  /**
   * 创建饮食问题
   */
  private createDietQuestion(): Question {
    return {
      id: 'q-diet',
      content: '胃口和消化情况怎么样？',
      type: 'single_choice',
      options: [
        { id: 'opt-poor', text: '食欲不振', value: '食欲不振' },
        { id: 'opt-good', text: '胃口好', value: '正常' },
        { id: 'opt-bitter', text: '口苦', value: '口苦' },
        { id: 'opt-bloated', text: '胃胀/腹胀', value: '腹胀' },
      ],
      trigger: {},
      priority: 6,
      required: false,
      validationPurpose: '饮食反映脾胃运化功能',
    };
  }

  /**
   * 创建胸腹问题
   */
  private createChestAbdomenQuestion(): Question {
    return {
      id: 'q-chest-abdomen',
      content: '有胸闷胁胀或腹痛吗？',
      type: 'single_choice',
      options: [
        { id: 'opt-chest', text: '胸闷', value: '胸闷' },
        { id: 'opt-flank', text: '胁胀/胁痛', value: '胁胀' },
        { id: 'opt-abdominal', text: '腹痛/腹胀', value: '腹痛' },
        { id: 'opt-none', text: '无明显不适', value: '无' },
      ],
      trigger: {},
      priority: 7,
      required: false,
      validationPurpose: '胸腹不适反映肝郁和气滞',
    };
  }

  /**
   * 创建耳渴问题
   */
  private createEarThirstQuestion(): Question {
    return {
      id: 'q-ear-thirst',
      content: '有没有耳鸣或口渴？',
      type: 'single_choice',
      options: [
        { id: 'opt-tinnitus', text: '有耳鸣', value: '耳鸣' },
        { id: 'opt-thirsty', text: '口渴想喝水', value: '口渴' },
        { id: 'opt-thirsty-not', text: '口渴不想喝', value: '渴不欲饮' },
        { id: 'opt-none', text: '都没有', value: '无' },
      ],
      trigger: {},
      priority: 8,
      required: false,
      validationPurpose: '耳渴反映肾虚和阴虚状态',
    };
  }

  /**
   * 创建疲劳问题
   */
  private createFatigueQuestion(): Question {
    return {
      id: 'q-fatigue',
      content: '平时容易疲劳或乏力吗？',
      type: 'single_choice',
      options: [
        { id: 'opt-yes', text: '是的，经常疲劳', value: '是' },
        { id: 'opt-sometimes', text: '偶尔', value: '偶尔' },
        { id: 'opt-no', text: '精力充沛', value: '否' },
      ],
      trigger: {},
      priority: 9,
      required: false,
      validationPurpose: '疲劳反映气虚状态',
    };
  }

  /**
   * 创建口干问题
   */
  private createThirstyQuestion(): Question {
    return {
      id: 'q-thirsty',
      content: '口干明显吗？喝水多吗？',
      type: 'single_choice',
      options: [
        { id: 'opt-dry', text: '口干明显，想喝水', value: '是' },
        { id: 'opt-dry-not', text: '口干但不想喝', value: '渴不欲饮' },
        { id: 'opt-normal', text: '正常', value: '否' },
      ],
      trigger: {},
      priority: 10,
      required: false,
      validationPurpose: '口干反映阴虚火旺',
    };
  }

  /**
   * 添加问题到树中
   */
  addQuestion(question: Question): void {
    this.questionMap.set(question.id, question);
    this.addedQuestionIds.add(question.id);
  }

  /**
   * 根据舌象特征和推理结果构建问题树
   * @param tongueResult 舌象分析结果
   * @param inferenceResult 推理结果节点列表
   * @param age 患者年龄
   * @returns 生成的问题列表
   */
  buildTree(
    tongueResult?: TongueAnalysisResult,
    inferenceResult?: InferenceNode[],
    age?: number
  ): Question[] {
    const questions: Question[] = [];
    const ageCalculator = new AgeWeightCalculator();
    
    if (age !== undefined) {
      ageCalculator.setAge(age);
    }

    // 获取年龄段
    const ageGroup = ageCalculator.getAgeGroup();

    // 1. 年龄问题（必问）
    if (!this.addedQuestionIds.has('q-age')) {
      questions.push(this.questionMap.get('q-age')!);
    }

    // 2. 根据舌象特征添加问题
    if (tongueResult) {
      const tongueQuestions = this.getQuestionsFromTongueFeatures(tongueResult);
      questions.push(...tongueQuestions);
    }

    // 3. 根据推理节点添加验证问题
    if (inferenceResult) {
      const nodeQuestions = this.getQuestionsFromInferenceNodes(inferenceResult);
      questions.push(...nodeQuestions);
    }

    // 4. 根据年龄段添加补充问题
    const ageQuestions = this.getQuestionsByAgeGroup(ageGroup);
    questions.push(...ageQuestions);

    // 去重并按优先级排序
    const uniqueQuestions = this.deduplicateQuestions(questions);
    return this.sortByPriority(uniqueQuestions);
  }

  /**
   * 从舌象特征获取相关问题
   */
  private getQuestionsFromTongueFeatures(tongueResult: TongueAnalysisResult): Question[] {
    const questions: Question[] = [];
    const features = this.extractTongueFeatures(tongueResult);

    for (const feature of features) {
      const mapping = TONGUE_FEATURE_QUESTIONS[feature];
      if (mapping) {
        // 检查是否已添加
        const existingQ = Array.from(this.questionMap.values()).find(
          q => mapping.question.includes(q.content.split('？')[0])
        );
        if (existingQ) {
          questions.push(existingQ);
        } else {
          // 动态创建问题
          questions.push(this.createDynamicQuestion(feature, mapping));
        }
      }
    }

    return questions;
  }

  /**
   * 提取舌象特征
   */
  private extractTongueFeatures(tongueResult: TongueAnalysisResult): string[] {
    const features: string[] = [];

    // 从舌形提取特征
    if (tongueResult.shape === '胖大') {
      features.push('舌淡胖大');
    }
    if (tongueResult.shape === '瘦薄') {
      features.push('舌红裂纹');
    }
    if (tongueResult.hasTeethMark) {
      features.push('齿痕舌');
    }

    // 从苔色苔质提取
    if (tongueResult.coatingColor === '黄' && tongueResult.coatingTexture === '厚') {
      features.push('苔黄腻');
    }
    if (tongueResult.coatingColor === '少苔' || tongueResult.coatingColor === '无苔') {
      features.push('舌红少苔');
    }

    // 从舌色提取
    if (tongueResult.bodyColor === '淡白') {
      features.push('舌淡苔白');
    }
    if (tongueResult.bodyColor === '紫') {
      features.push('舌紫');
    }

    // 从分区特征提取
    if (tongueResult.zoneFeatures) {
      for (const zone of tongueResult.zoneFeatures) {
        if (zone.undulation === 'depression') {
          if (zone.position === 'upperThird') features.push('舌尖凹陷');
          if (zone.position === 'middleThird') features.push('舌中凹陷');
          if (zone.position === 'lowerThird') features.push('舌根凹陷');
        }
        if (zone.undulation === 'bulge') {
          if (zone.position === 'middleThird') features.push('舌边红凸');
        }
        if (zone.color === '红' || zone.colorIntensity === '偏深') {
          if (zone.position === 'upperThird') features.push('舌尖红');
          if (zone.position === 'middleThird') features.push('舌边色深');
        }
      }
    }

    // 裂纹
    if (tongueResult.hasCrack) {
      features.push('舌红裂纹');
    }

    return features;
  }

  /**
   * 从推理节点获取验证问题
   */
  private getQuestionsFromInferenceNodes(nodes: InferenceNode[]): Question[] {
    const questions: Question[] = [];

    for (const node of nodes) {
      // 只验证置信度较低的节点
      if (node.conclusion.confidence < 0.7 && node.conclusion.confidence > 0.3) {
        const relatedQuestion = this.findRelatedQuestion(node);
        if (relatedQuestion) {
          questions.push(relatedQuestion);
        }
      }
    }

    return questions;
  }

  /**
   * 查找与推理节点相关的问题
   */
  private findRelatedQuestion(node: InferenceNode): Question | undefined {
    // 节点ID到问题的映射
    const nodeQuestionMap: Record<string, string> = {
      'L3-heart-qi-deficiency': 'q-sleep',
      'L3-heart-yin-deficiency': 'q-thirsty',
      'L3-heart-fire': 'q-sleep',
      'L3-liver-fire': 'q-chest-abdomen',
      'L3-liver-qi-stagnation': 'q-chest-abdomen',
      'L3-spleen-qi-deficiency': 'q-diet',
      'L3-spleen-damp': 'q-diet',
      'L3-kidney-deficiency': 'q-ear-thirst',
      'L3-lower-jiao-damp-heat': 'q-urine',
      'L2-qi-deficiency': 'q-fatigue',
      'L2-dampness': 'q-stool',
      'L2-yin-deficiency': 'q-thirsty',
      'L2-spleen-deficiency': 'q-diet',
      'L2-damp-heat': 'q-cold-heat',
    };

    const questionId = nodeQuestionMap[node.id];
    if (questionId) {
      return this.questionMap.get(questionId);
    }

    // 基于标签模糊匹配
    const label = node.conclusion.label.toLowerCase();
    if (label.includes('心')) return this.questionMap.get('q-sleep');
    if (label.includes('肝')) return this.questionMap.get('q-chest-abdomen');
    if (label.includes('脾')) return this.questionMap.get('q-diet');
    if (label.includes('肾')) return this.questionMap.get('q-ear-thirst');
    if (label.includes('气虚') || label.includes('疲劳')) return this.questionMap.get('q-fatigue');
    if (label.includes('阴虚') || label.includes('口干')) return this.questionMap.get('q-thirsty');

    return undefined;
  }

  /**
   * 根据年龄段获取问题
   */
  private getQuestionsByAgeGroup(ageGroup: string): Question[] {
    const ageQuestionMap: Record<string, string[]> = {
      '少年': ['q-stool', 'q-diet', 'q-cold-heat'],
      '青年': ['q-stool', 'q-cold-heat', 'q-sleep', 'q-head-body', 'q-diet', 'q-chest-abdomen'],
      '中年': ['q-stool', 'q-cold-heat', 'q-sleep', 'q-diet', 'q-fatigue'],
      '老年': ['q-stool', 'q-cold-heat', 'q-sleep', 'q-ear-thirst', 'q-head-body'],
    };

    const questionIds = ageQuestionMap[ageGroup] || ageQuestionMap['中年'];
    return questionIds
      .filter(id => this.questionMap.has(id))
      .map(id => this.questionMap.get(id)!);
  }

  /**
   * 创建动态问题
   */
  private createDynamicQuestion(feature: string, mapping: typeof TONGUE_FEATURE_QUESTIONS[string]): Question {
    const questionId = `q-dynamic-${feature}`;
    
    // 检查是否已存在
    if (this.questionMap.has(questionId)) {
      return this.questionMap.get(questionId)!;
    }

    const question: Question = {
      id: questionId,
      content: mapping.question,
      type: 'single_choice',
      options: mapping.options.map((opt, idx) => ({
        id: `opt-${idx}`,
        text: opt,
        value: opt.replace('有', ''),
      })),
      trigger: {
        tongueFeature: [feature],
      },
      priority: 5,
      relatedNodeId: mapping.relatedNodeIds[0],
      required: false,
      validationPurpose: `验证${feature}对应的证型`,
    };

    this.addQuestion(question);
    return question;
  }

  /**
   * 去重问题
   */
  private deduplicateQuestions(questions: Question[]): Question[] {
    const seen = new Set<string>();
    return questions.filter(q => {
      if (seen.has(q.id)) return false;
      seen.add(q.id);
      return true;
    });
  }

  /**
   * 按优先级排序
   */
  private sortByPriority(questions: Question[]): Question[] {
    return [...questions].sort((a, b) => a.priority - b.priority);
  }

  /**
   * 根据用户回答决定下一个问题节点
   * @param currentNodeId 当前问题ID
   * @param answer 用户回答
   * @returns 下一个问题（如果有）
   */
  getNextNode(currentNodeId: string, answer: string): Question | undefined {
    const currentQuestion = this.questionMap.get(currentNodeId);
    if (!currentQuestion) return undefined;

    // 动态问题树逻辑：根据回答决定下一个问题
    const nextQuestionMap: Record<string, Record<string, string | undefined>> = {
      'q-age': {
        '少年': 'q-stool',
        '青年': 'q-stool',
        '中年': 'q-stool',
        '老年': 'q-stool',
      },
      'q-stool': {
        '便溏': 'q-fatigue',
        '正常': 'q-cold-heat',
        '便秘': 'q-cold-heat',
        '不规律': 'q-diet',
      },
      'q-fatigue': {
        '是': 'q-sleep',
        '偶尔': 'q-sleep',
        '否': 'q-sleep',
      },
      'q-sleep': {
        '失眠': 'q-head-body',
        '睡眠差': 'q-head-body',
        '正常': 'q-cold-heat',
        '嗜睡': 'q-cold-heat',
      },
      'q-cold-heat': {
        '怕冷': 'q-ear-thirst',
        '怕热': 'q-thirsty',
        '正常': 'q-chest-abdomen',
        '手足寒热': 'q-thirsty',
      },
      'q-thirsty': {
        '是': 'q-chest-abdomen',
        '渴不欲饮': 'q-ear-thirst',
        '否': 'q-chest-abdomen',
      },
      'q-ear-thirst': {
        '耳鸣': 'q-chest-abdomen',
        '口渴': 'q-chest-abdomen',
        '无': 'q-chest-abdomen',
      },
      'q-chest-abdomen': {
        '胸闷': undefined,
        '胁胀': undefined,
        '腹痛': undefined,
        '无': undefined,
      },
    };

    const answerNextMap = nextQuestionMap[currentNodeId];
    if (!answerNextMap) return undefined;

    // 模糊匹配答案
    let matchedAnswer = answer;
    for (const key of Object.keys(answerNextMap)) {
      if (answer.includes(key) || key.includes(answer)) {
        matchedAnswer = key;
        break;
      }
    }

    const nextQuestionId = answerNextMap[matchedAnswer];
    if (!nextQuestionId) return undefined;

    return this.questionMap.get(nextQuestionId);
  }

  /**
   * 判断是否跳过某个问题
   * @param questionId 问题ID
   * @param previousAnswers 之前的回答
   * @returns 是否跳过
   */
  skipCondition(questionId: string, previousAnswers: Record<string, string>): boolean {
    // 年龄问题不跳过
    if (questionId === 'q-age') return false;

    // 根据之前的回答判断是否跳过
    const skipRules: Record<string, (answers: Record<string, string>) => boolean> = {
      'q-urine': (ans) => {
        // 如果大便正常，可能跳过小便
        const stool = ans['q-stool'];
        return stool === '正常';
      },
      'q-head-body': () => {
        // 如果已有睡眠问题，头身问题优先级降低
        return false;
      },
      'q-chest-abdomen': () => {
        // 如果肝郁置信度低，可跳过
        return false;
      },
      'q-fatigue': () => {
        // 如果有明确气虚证据，可能跳过
        return false;
      },
    };

    const rule = skipRules[questionId];
    if (rule) {
      return rule(previousAnswers);
    }

    return false;
  }

  /**
   * 获取所有问题
   */
  getAllQuestions(): Question[] {
    return Array.from(this.questionMap.values());
  }

  /**
   * 获取问题by ID
   */
  getQuestion(id: string): Question | undefined {
    return this.questionMap.get(id);
  }

  /**
   * 获取下一个未回答的问题
   * @param answeredIds 已回答的问题ID列表
   */
  getNextUnansweredQuestion(answeredIds: string[]): Question | undefined {
    const allQuestions = this.getAllQuestions()
      .filter(q => !answeredIds.includes(q.id))
      .sort((a, b) => a.priority - b.priority);
    
    return allQuestions[0];
  }
}

/**
 * 创建问题树工厂函数
 */
export function createQuestionTree(): QuestionTree {
  return new QuestionTree();
}
