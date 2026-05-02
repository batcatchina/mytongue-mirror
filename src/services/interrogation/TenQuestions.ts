/**
 * 十问歌实现 v2.0
 * 经典问诊十问歌的数字化实现
 * 
 * 经典十问歌：一问寒热二问汗，三问头身四问便，
 *            五问饮食六问胸，七聋八渴俱当辨，
 *            九问旧病十问因
 * 
 * v2.0问诊顺序调整（按优先级）：
 * 1. 年龄（必问，调节所有后续推理权重）
 * 2. 二便（高优先级，脾胃肾的直接指标）
 * 3. 寒热（区分阴阳）
 * 4. 睡眠（心肝辨证的重要参考）
 * 5. 头身（肝阳/血虚）
 * 6. 饮食（脾胃辨证）
 * 7. 其他（按需问）
 */

import type { Question, TenQuestionsConfig, QuestionOption } from '@/types/interrogation';

/**
 * 十问歌问诊系统
 */
export class TenQuestions {
  /** 问诊配置 */
  private config: TenQuestionsConfig[];
  
  constructor() {
    this.config = this.getDefaultConfig();
  }

  /**
   * 获取默认十问歌配置
   */
  private getDefaultConfig(): TenQuestionsConfig[] {
    return [
      {
        order: 0,
        content: '年龄（必问）',
        dialecticalMapping: '权重调节器',
        priority: 5,
        relatedTongueFeatures: [],
        questionTemplates: ['请告诉我您的年龄'],
      },
      {
        order: 1,
        content: '二便',
        dialecticalMapping: '脾虚/肾虚/湿热',
        priority: 5,
        relatedTongueFeatures: ['苔腻', '舌淡', '舌红', '齿痕', '胖大'],
        questionTemplates: ['大便情况怎么样？'],
      },
      {
        order: 2,
        content: '寒热',
        dialecticalMapping: '阳虚/阴虚/少阳证',
        priority: 4,
        relatedTongueFeatures: ['舌淡', '舌红'],
        questionTemplates: ['怕冷还是怕热？'],
      },
      {
        order: 3,
        content: '睡眠',
        dialecticalMapping: '心肝辨证',
        priority: 4,
        relatedTongueFeatures: ['舌尖凹陷', '舌尖红', '舌边红'],
        questionTemplates: ['睡眠质量怎么样？'],
      },
      {
        order: 4,
        content: '头身',
        dialecticalMapping: '肝阳/血虚/风湿',
        priority: 4,
        relatedTongueFeatures: ['舌边色深', '舌淡'],
        questionTemplates: ['有头晕头痛吗？', '身体容易酸痛吗？'],
      },
      {
        order: 5,
        content: '饮食',
        dialecticalMapping: '脾胃/肝胆',
        priority: 4,
        relatedTongueFeatures: ['舌中凹陷', '苔腻', '齿痕'],
        questionTemplates: ['胃口怎么样？'],
      },
      {
        order: 6,
        content: '汗',
        dialecticalMapping: '表虚/里热/阴虚盗汗',
        priority: 3,
        relatedTongueFeatures: ['舌淡', '舌红'],
        questionTemplates: ['容易出汗吗？'],
      },
      {
        order: 7,
        content: '胸腹',
        dialecticalMapping: '肝郁/气滞/瘀血',
        priority: 3,
        relatedTongueFeatures: ['舌边红凸', '舌紫'],
        questionTemplates: ['有胸闷胁胀吗？'],
      },
      {
        order: 8,
        content: '耳/渴',
        dialecticalMapping: '肾虚/阴虚',
        priority: 2,
        relatedTongueFeatures: ['舌根凹陷', '舌红少苔', '裂纹'],
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
  }
  
  /**
   * 获取所有十问问题配置
   */
  getAllQuestions(): TenQuestionsConfig[] {
    return this.config;
  }
  
  /**
   * 获取指定顺序的问题
   */
  getQuestionByOrder(order: number): TenQuestionsConfig | undefined {
    return this.config.find(q => q.order === order);
  }
  
  /**
   * 根据年龄段过滤问题
   * @param ageGroup 年龄段
   * @returns 适合该年龄段的问题配置
   */
  filterByAgeGroup(ageGroup: string): TenQuestionsConfig[] {
    const filters: Record<string, string[]> = {
      '少年': ['年龄（必问）', '二便', '饮食', '寒热', '汗', '旧病/病因'],
      '青年': ['年龄（必问）', '二便', '寒热', '睡眠', '头身', '饮食', '胸腹'],
      '中年': ['年龄（必问）', '二便', '寒热', '睡眠', '饮食', '汗', '头身', '胸腹'],
      '老年': ['年龄（必问）', '二便', '寒热', '睡眠', '耳/渴', '头身', '旧病/病因'],
    };
    
    const relevant = filters[ageGroup] || filters['中年'];
    return this.config.filter(q => relevant.includes(q.content));
  }
  
  /**
   * 根据舌象特征过滤问题
   * @param features 舌象特征列表
   * @returns 相关问题配置
   */
  filterByTongueFeatures(features: string[]): TenQuestionsConfig[] {
    return this.config.filter(q => {
      // 年龄问题总是包含
      if (q.order === 0) return true;
      
      // 检查是否有相关特征
      return q.relatedTongueFeatures.some(f =>
        features.some(feat => 
          feat.includes(f) || f.includes(feat) || this.fuzzyMatch(feat, f)
        )
      );
    });
  }

  /**
   * 模糊匹配
   */
  private fuzzyMatch(feat: string, f: string): boolean {
    const featNorm = feat.toLowerCase();
    const fNorm = f.toLowerCase();
    // 检查关键词重叠
    const keywords = ['淡', '红', '苔', '腻', '黄', '胖', '大', '齿', '痕', '裂', '边', '尖', '中', '根'];
    return keywords.some(k => featNorm.includes(k) && fNorm.includes(k));
  }
  
  /**
   * 根据推理结论过滤问题
   * @param conclusions 推理结论列表（节点ID或标签）
   * @returns 相关问题配置
   */
  filterByConclusions(conclusions: string[]): TenQuestionsConfig[] {
    // 结论到问题的映射
    const conclusionQuestionMap: Record<string, string[]> = {
      '气虚': ['疲劳', '汗', '头身'],
      '脾虚': ['饮食', '二便'],
      '湿热': ['二便', '饮食', '口苦'],
      '阴虚': ['口渴', '睡眠', '寒热'],
      '阳虚': ['寒热', '二便', '四肢'],
      '肝郁': ['胸腹', '睡眠', '情绪'],
      '肝火': ['口苦', '睡眠', '头身'],
      '心火': ['睡眠', '舌尖'],
      '肾虚': ['耳/渴', '二便', '头身'],
      '血虚': ['睡眠', '头身', '面色'],
    };

    const relevantContents = new Set<string>();
    
    for (const conclusion of conclusions) {
      for (const [pattern, questions] of Object.entries(conclusionQuestionMap)) {
        if (conclusion.includes(pattern) || pattern.includes(conclusion)) {
          questions.forEach(q => relevantContents.add(q));
        }
      }
    }

    if (relevantContents.size === 0) {
      // 默认返回基础问题
      return this.filterByAgeGroup('中年');
    }

    return this.config.filter(q => relevantContents.has(q.content));
  }
  
  /**
   * 将十问配置转换为问题对象
   * @param config 十问配置
   * @param additionalOptions 额外选项
   * @returns 问题对象
   */
  toQuestion(config: TenQuestionsConfig, additionalOptions?: Record<string, string[]>): Question {
    const defaultOptions: Record<string, string[]> = {
      '年龄（必问）': ['18岁以下', '19-35岁', '36-55岁', '56岁以上'],
      '二便': ['大便溏稀', '大便正常', '大便干结', '便秘', '小便黄', '小便清长', '夜尿多'],
      '寒热': ['怕冷明显', '怕热明显', '无明显感觉', '手脚心热', '手脚冰凉'],
      '睡眠': ['失眠/难入睡', '容易醒/多梦', '睡眠良好', '嗜睡/总想睡'],
      '头身': ['头晕', '头痛', '身体酸痛', '四肢沉重', '无明显不适'],
      '饮食': ['食欲不振', '胃口好', '口苦', '口干', '消化不良', '胃胀'],
      '汗': ['自汗（不动也出）', '盗汗（睡觉出汗）', '不出汗', '汗多'],
      '胸腹': ['胸闷', '胁胀/胁痛', '腹痛', '腹胀', '无明显不适'],
      '耳/渴': ['耳鸣', '听力下降', '口渴想喝水', '口渴不想喝', '无口渴'],
      '旧病/病因': ['无明显诱因', '有慢性病史', '有手术史', '有过敏史', '情绪压力'],
    };
    
    const options = additionalOptions?.[config.content] || defaultOptions[config.content] || ['有', '无'];
    
    return {
      id: `ten-questions-${config.order}`,
      content: config.questionTemplates[0],
      type: 'single_choice',
      options: options.map((opt, idx) => this.createOption(opt, idx)),
      trigger: {
        ageRange: config.order === 0 ? undefined : [0, 150],
      },
      priority: config.priority,
      required: config.order === 0,
      validationPurpose: `${config.content}对应${config.dialecticalMapping}`,
    };
  }

  /**
   * 创建选项对象
   */
  private createOption(text: string, index: number): QuestionOption {
    // 标准化值
    const valueMap: Record<string, string> = {
      '18岁以下': '少年',
      '19-35岁': '青年',
      '36-55岁': '中年',
      '56岁以上': '老年',
      '大便溏稀': '便溏',
      '大便正常': '正常',
      '大便干结': '便干',
      '怕冷明显': '怕冷',
      '怕热明显': '怕热',
      '无明显感觉': '正常',
      '手脚心热': '手足心热',
      '手脚冰凉': '四肢凉',
      '失眠/难入睡': '失眠',
      '容易醒/多梦': '睡眠差',
      '睡眠良好': '正常',
      '嗜睡/总想睡': '嗜睡',
      '无明显不适': '无',
      '自汗（不动也出）': '自汗',
      '盗汗（睡觉出汗）': '盗汗',
      '不出汗': '无汗',
      '口渴想喝水': '口渴',
      '口渴不想喝': '渴不欲饮',
      '无口渴': '无',
      '无明显诱因': '无',
      '情绪压力': '情志',
    };

    return {
      id: `opt-${index}`,
      text: text,
      value: valueMap[text] || text,
    };
  }
  
  /**
   * 根据问题ID获取配置
   */
  getConfigById(id: string): TenQuestionsConfig | undefined {
    return this.config.find(q => `ten-questions-${q.order}` === id);
  }

  /**
   * 获取问题的标准答案值
   */
  getStandardizedAnswer(questionId: string, answerText: string): string {
    const config = this.getConfigById(questionId);
    if (!config) return answerText;

    const question = this.toQuestion(config);
    const option = question.options.find(o => o.text === answerText);
    return option?.value || answerText;
  }
}

/**
 * 导出单例
 */
export const tenQuestions = new TenQuestions();

/**
 * 十问歌标准问题配置
 */
export { TEN_QUESTIONS } from '@/types/interrogation';
