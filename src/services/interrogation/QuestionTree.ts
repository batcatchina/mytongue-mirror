/**
 * 动态问题树 v2.0
 * 管理问诊问题的树形结构和导航
 */

import type { Question, QuestionNode, QuestionCorrection, QuestionOption } from '@/types/interrogation';

/**
 * 问题树节点
 */
interface TreeNode {
  question: Question;
  children: Map<string, TreeNode>;
  corrections: QuestionCorrection[];
}

/**
 * 问题树
 */
export class QuestionTree {
  /** 根节点 */
  private root: Map<string, TreeNode>;
  /** 问题映射 */
  private questionMap: Map<string, Question>;
  
  constructor() {
    this.root = new Map();
    this.questionMap = new Map();
    this.initializeDefaultTree();
  }
  
  /**
   * 初始化默认问题树
   */
  private initializeDefaultTree(): void {
    // 年龄问题
    const ageQuestion: Question = {
      id: 'q-age',
      content: '请告诉我您的年龄',
      type: 'single_choice',
      options: [
        { id: 'opt-young', text: '18岁以下', value: '少年', isDefault: false },
        { id: 'opt-adult', text: '18-35岁', value: '青年', isDefault: true },
        { id: 'opt-middle', text: '36-55岁', value: '中年', isDefault: false },
        { id: 'opt-elder', text: '56岁以上', value: '老年', isDefault: false },
      ],
      trigger: {},
      priority: 0,
      required: true,
    };
    this.addQuestion(ageQuestion);
    
    // 二便问题
    const stoolQuestion: Question = {
      id: 'q-stool',
      content: '大便情况怎么样？',
      type: 'single_choice',
      options: [
        { id: 'opt-loose', text: '大便溏稀', value: '便溏' },
        { id: 'opt-normal', text: '大便正常', value: '正常' },
        { id: 'opt-constipated', text: '便秘', value: '便秘' },
      ],
      trigger: {
        ageRange: [0, 100],
      },
      priority: 1,
      required: true,
    };
    this.addQuestion(stoolQuestion);
    
    // 寒热问题
    const coldHeatQuestion: Question = {
      id: 'q-cold-heat',
      content: '怕冷还是怕热？',
      type: 'single_choice',
      options: [
        { id: 'opt-cold', text: '怕冷', value: '怕冷' },
        { id: 'opt-hot', text: '怕热', value: '怕热' },
        { id: 'opt-neutral', text: '无明显感觉', value: '正常' },
      ],
      trigger: {
        ageRange: [0, 100],
      },
      priority: 2,
      required: true,
    };
    this.addQuestion(coldHeatQuestion);
    
    // 睡眠问题
    const sleepQuestion: Question = {
      id: 'q-sleep',
      content: '睡眠质量怎么样？',
      type: 'single_choice',
      options: [
        { id: 'opt-insomnia', text: '失眠/难入睡', value: '失眠' },
        { id: 'opt-light', text: '容易醒/多梦', value: '睡眠差' },
        { id: 'opt-good', text: '睡眠良好', value: '正常' },
      ],
      trigger: {
        ageRange: [0, 100],
      },
      priority: 3,
      required: false,
    };
    this.addQuestion(sleepQuestion);
    
    // 疲劳问题
    const fatigueQuestion: Question = {
      id: 'q-fatigue',
      content: '是否容易疲劳？',
      type: 'single_choice',
      options: [
        { id: 'opt-yes', text: '容易疲劳', value: '是' },
        { id: 'opt-no', text: '不太疲劳', value: '否' },
      ],
      trigger: {
        tongueFeature: ['胖大', '淡白'],
      },
      priority: 4,
      required: false,
    };
    this.addQuestion(fatigueQuestion);
    
    // 口干问题
    const thirstyQuestion: Question = {
      id: 'q-thirsty',
      content: '是否口干？',
      type: 'single_choice',
      options: [
        { id: 'opt-dry', text: '口干明显', value: '是' },
        { id: 'opt-normal', text: '口干不明显', value: '否' },
      ],
      trigger: {
        tongueFeature: ['瘦薄', '红', '裂纹'],
      },
      priority: 4,
      required: false,
    };
    this.addQuestion(thirstyQuestion);
    
    // 情绪问题
    const emotionQuestion: Question = {
      id: 'q-emotion',
      content: '情绪和睡眠如何？',
      type: 'single_choice',
      options: [
        { id: 'opt-irritable', text: '容易烦躁', value: '烦躁' },
        { id: 'opt-depressed', text: '情绪低落', value: '抑郁' },
        { id: 'opt-normal', text: '情绪稳定', value: '正常' },
      ],
      trigger: {
        tongueFeature: ['舌边红', '肝'],
      },
      priority: 5,
      required: false,
    };
    this.addQuestion(emotionQuestion);
  }
  
  /**
   * 添加问题到树
   */
  addQuestion(question: Question): void {
    this.questionMap.set(question.id, question);
    
    const node: TreeNode = {
      question,
      children: new Map(),
      corrections: this.generateCorrections(question),
    };
    
    this.root.set(question.id, node);
  }
  
  /**
   * 添加子问题
   */
  addChildQuestion(parentId: string, parentAnswer: string, childQuestion: Question): void {
    const parentNode = this.root.get(parentId);
    if (!parentNode) return;
    
    this.addQuestion(childQuestion);
    
    const childNode: TreeNode = {
      question: childQuestion,
      children: new Map(),
      corrections: this.generateCorrections(childQuestion),
    };
    
    parentNode.children.set(parentAnswer, childNode);
  }
  
  /**
   * 获取问题
   */
  getQuestion(questionId: string): Question | undefined {
    return this.questionMap.get(questionId);
  }
  
  /**
   * 获取子问题
   */
  getChildQuestion(parentId: string, parentAnswer: string): Question | undefined {
    const parentNode = this.root.get(parentId);
    if (!parentNode) return undefined;
    
    const childNode = parentNode.children.get(parentAnswer);
    return childNode?.question;
  }
  
  /**
   * 获取所有问题
   */
  getAllQuestions(): Question[] {
    return Array.from(this.questionMap.values());
  }
  
  /**
   * 获取问题树结构
   */
  getTreeStructure(): Record<string, { children: string[] }> {
    const structure: Record<string, { children: string[] }> = {};
    
    for (const [id, node] of this.root) {
      structure[id] = {
        children: Array.from(node.children.keys()),
      };
    }
    
    return structure;
  }
  
  /**
   * 生成问题的修正规则
   */
  private generateCorrections(question: Question): QuestionCorrection[] {
    const corrections: QuestionCorrection[] = [];
    
    for (const option of question.options) {
      // 根据选项生成修正规则
      const correction: QuestionCorrection = {
        id: `correction-${question.id}-${option.id}`,
        triggerAnswer: option.value,
        correctionType: 'increase',
        targetNodeId: '', // 将在运行时确定
        confidenceDelta: 0.1,
      };
      
      // 根据问题类型设置不同的修正策略
      if (question.id.includes('cold') || question.id.includes('heat')) {
        if (option.value === '怕冷') {
          correction.correctionType = 'increase';
          correction.newLabel = '阳虚';
        } else if (option.value === '怕热') {
          correction.correctionType = 'increase';
          correction.newLabel = '阴虚/热证';
        }
      }
      
      if (question.id.includes('fatigue') && option.value === '是') {
        correction.correctionType = 'increase';
        correction.newLabel = '气虚';
      }
      
      if (question.id.includes('thirsty') && option.value === '是') {
        correction.correctionType = 'increase';
        correction.newLabel = '阴虚';
      }
      
      corrections.push(correction);
    }
    
    return corrections;
  }
  
  /**
   * 获取修正规则
   */
  getCorrections(questionId: string, answer: string): QuestionCorrection[] {
    const node = this.root.get(questionId);
    if (!node) return [];
    
    return node.corrections.filter(c => c.triggerAnswer === answer);
  }
  
  /**
   * 根据特征过滤问题
   */
  filterByFeatures(features: string[]): Question[] {
    const filtered: Question[] = [];
    
    for (const question of this.questionMap.values()) {
      // 如果问题没有触发条件，则总是显示
      if (!question.trigger.tongueFeature || question.trigger.tongueFeature.length === 0) {
        filtered.push(question);
        continue;
      }
      
      // 检查是否有匹配的特征
      const hasMatch = question.trigger.tongueFeature.some(f =>
        features.some(feat => feat.includes(f) || f.includes(feat))
      );
      
      if (hasMatch) {
        filtered.push(question);
      }
    }
    
    return filtered.sort((a, b) => a.priority - b.priority);
  }
  
  /**
   * 根据年龄过滤问题
   */
  filterByAge(age: number): Question[] {
    const filtered: Question[] = [];
    
    for (const question of this.questionMap.values()) {
      // 如果问题没有年龄条件，则总是显示
      if (!question.trigger.ageRange) {
        filtered.push(question);
        continue;
      }
      
      // 检查年龄是否在范围内
      const [minAge, maxAge] = question.trigger.ageRange;
      if (age >= minAge && age <= maxAge) {
        filtered.push(question);
      }
    }
    
    return filtered.sort((a, b) => a.priority - b.priority);
  }
}
