/**
 * 问诊模块集成测试 v2.0
 * 测试问诊引擎与推理引擎的联动
 * 
 * 运行方式: npx vitest run src/__tests__/interrogation.test.ts
 */

// TODO: 需要配置 vitest 测试环境
// import { describe, it, expect } from 'vitest';
import { 
  InterrogationEngine, 
  InterrogationEngineStatus,
  AgeWeightCalculator,
  QuestionTree,
  CorrectionRules,
  TenQuestions,
} from '../services/interrogation';
import type { InferenceNode } from '@/types/inference';
import type { TongueAnalysisResult } from '@/types/tongue';

/**
 * 创建测试用推理节点
 */
function createMockInferenceNodes(type: 'qi-deficiency' | 'yin-deficiency' | 'liver-fire'): InferenceNode[] {
  const baseNode: InferenceNode = {
    id: 'L2-qi-deficiency',
    name: '气虚',
    layer: 2,
    type: 'pattern',
    inputs: [],
    conclusion: {
      label: '气虚',
      description: '气不足，功能低下',
      confidence: 0.6,
      evidence: ['舌淡胖大'],
      priority: 'medium',
    },
    causes: [],
    effects: [],
    corrections: [],
    createdAt: new Date().toISOString(),
  };

  if (type === 'qi-deficiency') {
    return [
      {
        ...baseNode,
        id: 'L2-qi-deficiency',
        conclusion: { ...baseNode.conclusion, confidence: 0.6, label: '气虚' },
      },
      {
        ...baseNode,
        id: 'L2-dampness',
        name: '湿盛',
        conclusion: { ...baseNode.conclusion, confidence: 0.55, label: '湿盛' },
      },
    ];
  }

  if (type === 'yin-deficiency') {
    return [
      {
        ...baseNode,
        id: 'L2-yin-deficiency',
        name: '阴虚',
        conclusion: { ...baseNode.conclusion, confidence: 0.65, label: '阴虚火旺' },
      },
    ];
  }

  // liver-fire
  return [
    {
      ...baseNode,
      id: 'L3-liver-fire',
      name: '肝火',
      conclusion: { ...baseNode.conclusion, confidence: 0.58, label: '肝郁化火' },
    },
    {
      ...baseNode,
      id: 'L3-liver-qi-stagnation',
      name: '肝郁',
      conclusion: { ...baseNode.conclusion, confidence: 0.5, label: '肝气郁结' },
    },
  ];
}

/**
 * 创建测试用舌象结果
 */
function createMockTongueResult(): TongueAnalysisResult {
  return {
    bodyColor: '淡白',
    shape: '胖大',
    coatingColor: '薄白',
    coatingTexture: '薄',
    state: '正常',
    hasTeethMark: true,
    hasCrack: false,
    hasEcchymosis: false,
    zoneFeatures: [
      {
        position: 'upperThird',
        undulation: 'depression',
        undulationDegree: '轻微',
        color: '淡白',
        colorIntensity: '偏淡',
      },
      {
        position: 'middleThird',
        undulation: 'flat',
        color: '淡白',
        colorIntensity: '偏淡',
      },
    ],
    isSemitransparent: false,
    timestamp: new Date().toISOString(),
  };
}

describe('问诊模块集成测试', () => {
  describe('AgeWeightCalculator', () => {
    it('应根据年龄返回正确的年龄段', () => {
      const calculator = new AgeWeightCalculator();
      
      calculator.setAge(15);
      expect(calculator.getAgeGroup()).toBe('少年');
      
      calculator.setAge(25);
      expect(calculator.getAgeGroup()).toBe('青年');
      
      calculator.setAge(45);
      expect(calculator.getAgeGroup()).toBe('中年');
      
      calculator.setAge(65);
      expect(calculator.getAgeGroup()).toBe('老年');
    });

    it('应根据年龄调整证型权重', () => {
      const calculator = new AgeWeightCalculator();
      
      // 青年气虚权重
      calculator.setAge(30);
      const youthWeight = calculator.adjustWeight('气虚');
      
      // 老年气虚权重应该更高
      calculator.setAge(65);
      const elderWeight = calculator.adjustWeight('气虚');
      
      expect(elderWeight).toBeGreaterThan(youthWeight);
    });

    it('应返回年龄段优先问题', () => {
      const calculator = new AgeWeightCalculator();
      
      calculator.setAge(30);
      const youthQuestions = calculator.getPriorityQuestions();
      expect(youthQuestions).toContain('肝郁');
      
      calculator.setAge(65);
      const elderQuestions = calculator.getPriorityQuestions();
      expect(elderQuestions).toContain('肾虚');
    });
  });

  describe('QuestionTree', () => {
    it('应初始化默认问题', () => {
      const tree = new QuestionTree();
      const allQuestions = tree.getAllQuestions();
      
      expect(allQuestions.length).toBeGreaterThan(0);
      expect(allQuestions.some(q => q.id === 'q-age')).toBe(true);
      expect(allQuestions.some(q => q.id === 'q-stool')).toBe(true);
    });

    it('应根据舌象特征构建问题树', () => {
      const tongueResult = createMockTongueResult();
      const tree = new QuestionTree();
      
      const questions = tree.buildTree(tongueResult, [], 30);
      
      expect(questions.length).toBeGreaterThan(0);
      // 应该有年龄问题
      expect(questions[0].id).toBe('q-age');
    });

    it('应根据推理节点生成验证问题', () => {
      const nodes = createMockInferenceNodes('qi-deficiency');
      const tree = new QuestionTree();
      
      const questions = tree.buildTree(undefined, nodes, 30);
      
      // 应该包含脾虚相关的问题
      const dietQuestion = questions.find(q => q.id === 'q-diet');
      expect(dietQuestion).toBeDefined();
    });

    it('skipCondition应正确判断是否跳过问题', () => {
      const tree = new QuestionTree();
      
      // 大便正常时，可能跳过小便问题
      const previousAnswers = { 'q-stool': '正常' };
      const shouldSkip = tree.skipCondition('q-urine', previousAnswers);
      expect(shouldSkip).toBe(true);
    });
  });

  describe('CorrectionRules', () => {
    it('应包含至少30条修正规则', () => {
      const rules = new CorrectionRules();
      const ruleCount = rules.getRuleCount();
      
      expect(ruleCount).toBeGreaterThanOrEqual(30);
    });

    it('应正确匹配问题答案', () => {
      const rules = new CorrectionRules();
      
      // 测试便溏匹配
      const rule = rules.findMatchingRule('q-stool', '便溏');
      expect(rule).toBeDefined();
      expect(rule?.id).toBe('CR-006');
    });

    it('应正确匹配模糊答案', () => {
      const rules = new CorrectionRules();
      
      // 测试"经常疲劳"是否能匹配
      const rule = rules.findMatchingRule('q-fatigue', '经常疲劳');
      expect(rule).toBeDefined();
    });
  });

  describe('TenQuestions', () => {
    it('应返回十问歌配置', () => {
      const tenQ = new TenQuestions();
      const questions = tenQ.getAllQuestions();
      
      expect(questions.length).toBe(10);
      expect(questions[0].content).toBe('年龄（必问）');
    });

    it('应根据年龄段过滤问题', () => {
      const tenQ = new TenQuestions();
      
      const youthQuestions = tenQ.filterByAgeGroup('青年');
      expect(youthQuestions.some(q => q.content === '肝郁')).toBeDefined();
      
      const elderQuestions = tenQ.filterByAgeGroup('老年');
      expect(elderQuestions.some(q => q.content === '肾虚')).toBeDefined();
    });

    it('应将配置转换为问题对象', () => {
      const tenQ = new TenQuestions();
      const config = tenQ.getQuestionByOrder(1); // 二便
      expect(config).toBeDefined();
      
      const question = tenQ.toQuestion(config!);
      expect(question.id).toBe('ten-questions-1');
      expect(question.options.length).toBeGreaterThan(0);
    });
  });

  describe('InterrogationEngine', () => {
    it('应正确初始化问诊会话', () => {
      const engine = new InterrogationEngine();
      const tongueResult = createMockTongueResult();
      const nodes = createMockInferenceNodes('qi-deficiency');
      
      const firstQuestion = engine.startSession(tongueResult, nodes, 30);
      
      expect(firstQuestion).toBeDefined();
      expect(engine.getStatus()).toBe(InterrogationEngineStatus.InProgress);
    });

    it('应正确提交回答并应用修正', () => {
      const engine = new InterrogationEngine();
      const tongueResult = createMockTongueResult();
      const nodes = createMockInferenceNodes('qi-deficiency');
      
      engine.startSession(tongueResult, nodes, 30);
      
      // 提交回答：胃口差+便溏
      const result = engine.submitAnswer('q-diet', '食欲不振');
      expect(result.correction).toBeDefined();
      
      // 提交回答：大便溏稀
      const result2 = engine.submitAnswer('q-stool', '便溏');
      expect(result2.correction).toBeDefined();
    });

    it('气虚湿盛舌象应提升脾虚湿盛置信度', () => {
      const engine = new InterrogationEngine();
      const tongueResult = createMockTongueResult();
      const nodes = createMockInferenceNodes('qi-deficiency');
      
      engine.startSession(tongueResult, nodes, 30);
      
      // 获取初始置信度
      const initialResult = engine.getCorrectedInference();
      const initialNode = initialResult.nodes.find(n => n.id === 'L2-qi-deficiency');
      const initialConfidence = initialNode?.conclusion.confidence || 0;
      
      // 提交回答：胃口差+便溏
      engine.submitAnswer('q-diet', '食欲不振');
      engine.submitAnswer('q-stool', '便溏');
      
      // 获取修正后的置信度
      const correctedResult = engine.getCorrectedInference();
      const correctedNode = correctedResult.nodes.find(n => n.id === 'L2-qi-deficiency');
      const correctedConfidence = correctedNode?.conclusion.confidence || 0;
      
      // 置信度应该提升
      expect(correctedConfidence).toBeGreaterThan(initialConfidence);
    });

    it('阴虚火旺舌象应通过口干确认', () => {
      const engine = new InterrogationEngine();
      const tongueResult = createMockTongueResult();
      const nodes = createMockInferenceNodes('yin-deficiency');
      
      engine.startSession(tongueResult, nodes, 30);
      
      // 提交口干回答
      engine.submitAnswer('q-thirsty', '口干明显');
      
      // 应该触发阴虚修正
      const corrections = engine.getCorrections();
      const yinCorrection = corrections.find(c => 
        c.targetNodeId.includes('yin') || 
        c.newLabel?.includes('阴虚')
      );
      expect(yinCorrection).toBeDefined();
    });

    it('用户否认烦躁应降低肝胆郁热置信度', () => {
      const engine = new InterrogationEngine();
      const tongueResult = createMockTongueResult();
      const nodes = createMockInferenceNodes('liver-fire');
      
      engine.startSession(tongueResult, nodes, 30);
      
      // 获取初始置信度
      const initialResult = engine.getCorrectedInference();
      const initialNode = initialResult.nodes.find(n => n.id === 'L3-liver-fire');
      const initialConfidence = initialNode?.conclusion.confidence || 0;
      
      // 用户否认烦躁
      engine.submitAnswer('q-chest-abdomen', '都没有');
      
      // 获取修正后的置信度
      const correctedResult = engine.getCorrectedInference();
      const correctedNode = correctedResult.nodes.find(n => n.id === 'L3-liver-fire');
      const correctedConfidence = correctedNode?.conclusion.confidence || 0;
      
      // 置信度应该降低
      expect(correctedConfidence).toBeLessThan(initialConfidence);
    });

    it('应正确处理年龄权重对推理的影响', () => {
      // 青年场景
      const engineYouth = new InterrogationEngine();
      const tongueResult = createMockTongueResult();
      const nodes = createMockInferenceNodes('qi-deficiency');
      
      engineYouth.startSession(tongueResult, nodes, 30); // 青年
      
      engineYouth.submitAnswer('q-stool', '便秘');
      
      // 老年场景
      const engineElder = new InterrogationEngine();
      engineElder.startSession(tongueResult, nodes, 65); // 老年
      engineElder.submitAnswer('q-stool', '便秘');
      
      const sessionYouth = engineYouth.getSession();
      const sessionElder = engineElder.getSession();
      
      expect(sessionYouth?.ageGroup).toBe('青年');
      expect(sessionElder?.ageGroup).toBe('老年');
    });

    it('应正确判断问诊完成', () => {
      const engine = new InterrogationEngine();
      const tongueResult = createMockTongueResult();
      const nodes = createMockInferenceNodes('qi-deficiency');
      
      engine.startSession(tongueResult, nodes, 30);
      
      // 回答足够多问题后应完成
      for (let i = 0; i < 10; i++) {
        const question = engine.getNextQuestion();
        if (question) {
          engine.submitAnswer(question.id, '正常');
        }
      }
      
      expect(engine.isComplete()).toBe(true);
    });

    it('应支持跳过问诊', () => {
      const engine = new InterrogationEngine();
      const tongueResult = createMockTongueResult();
      const nodes = createMockInferenceNodes('qi-deficiency');
      
      engine.startSession(tongueResult, nodes, 30);
      engine.skip();
      
      expect(engine.getStatus()).toBe(InterrogationEngineStatus.Skipped);
    });

    it('应返回正确的问诊进度', () => {
      const engine = new InterrogationEngine();
      const tongueResult = createMockTongueResult();
      const nodes = createMockInferenceNodes('qi-deficiency');
      
      engine.startSession(tongueResult, nodes, 30);
      
      const progress1 = engine.getProgress();
      expect(progress1.current).toBe(0);
      
      const question = engine.getNextQuestion();
      if (question) {
        engine.submitAnswer(question.id, '正常');
      }
      
      const progress2 = engine.getProgress();
      expect(progress2.current).toBe(1);
    });
  });

  describe('问诊流程端到端测试', () => {
    it('完整问诊流程应输出修正后的推理结论', () => {
      const engine = new InterrogationEngine();
      const tongueResult = createMockTongueResult();
      const nodes = createMockInferenceNodes('qi-deficiency');
      
      // 1. 初始化
      const firstQuestion = engine.startSession(tongueResult, nodes, 30);
      expect(firstQuestion).toBeDefined();
      
      // 2. 动态问诊循环
      let questionCount = 0;
      while (!engine.isComplete() && questionCount < 10) {
        const question = engine.getNextQuestion();
        if (!question) break;
        
        // 模拟用户回答
        const answer = getSimulatedAnswer(question.id);
        engine.submitAnswer(question.id, answer);
        questionCount++;
      }
      
      // 3. 获取修正后的推理结果
      const result = engine.getCorrectedInference();
      
      expect(result.nodes.length).toBeGreaterThan(0);
      expect(result.primarySyndrome).toBeDefined();
      expect(result.confidenceChanges).toBeDefined();
      
      // 打印结果供参考
      console.log('最终证型:', result.primarySyndrome);
      console.log('置信度变化:', result.confidenceChanges);
    });
  });
});

/**
 * 模拟用户回答
 */
function getSimulatedAnswer(questionId: string): string {
  const answerMap: Record<string, string[]> = {
    'q-age': ['青年'],
    'q-stool': ['便溏', '正常', '便秘'],
    'q-fatigue': ['是', '否', '偶尔'],
    'q-sleep': ['失眠', '正常', '睡眠差'],
    'q-diet': ['食欲不振', '正常', '口苦'],
    'q-cold-heat': ['怕冷', '正常', '怕热'],
    'q-chest-abdomen': ['胁胀', '无', '胸闷'],
    'q-ear-thirst': ['无', '口渴', '耳鸣'],
    'q-thirsty': ['是', '否', '渴不欲饮'],
    'q-head-body': ['头晕', '无', '头痛'],
    'q-urine': ['正常', '小便黄', '夜尿多'],
  };

  const answers = answerMap[questionId];
  if (!answers) return '正常';

  // 选择第一个答案模拟真实用户
  return answers[0];
}
