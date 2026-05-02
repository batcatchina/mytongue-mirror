/**
 * 修正规则库 v2.0
 * 管理问诊回答到推理节点修正的映射规则
 * 
 * 精问→修正映射表（30+条规则）：
 * | 舌象特征 | 精问问题 | 用户回答 | 修正动作 |
 * 
 * 修正动作类型：
 * - increase：增加某结论的置信度
 * - decrease：降低某结论的置信度
 * - replace：替换某结论
 * - invalidate：使某结论失效
 */

import type { CorrectionRule } from '@/types/inference';

/**
 * 修正规则库
 */
export class CorrectionRules {
  /** 规则库 */
  private rules: Map<string, CorrectionRule[]>;
  
  constructor() {
    this.rules = new Map();
    this.initializeDefaultRules();
  }

  /**
   * 初始化默认规则库（30+条规则）
   */
  private initializeDefaultRules(): void {
    // ==================== 舌尖凹陷相关规则 ====================
    this.addRule({
      id: 'CR-001',
      questionId: 'q-sleep',
      answers: [
        {
          answer: '失眠',
          adjustmentType: 'increase',
          targetNodeId: 'L3-heart-fire',
          modification: { confidenceDelta: 0.15, label: '心火旺' },
        },
        {
          answer: '睡眠差',
          adjustmentType: 'increase',
          targetNodeId: 'L3-heart-yin-deficiency',
          modification: { confidenceDelta: 0.12, label: '心阴虚' },
        },
        {
          answer: '正常',
          adjustmentType: 'decrease',
          targetNodeId: 'L3-heart-qi-deficiency',
          modification: { confidenceDelta: -0.1, label: '心气虚' },
        },
      ],
    });

    this.addRule({
      id: 'CR-002',
      questionId: 'q-fatigue',
      answers: [
        {
          answer: '是',
          adjustmentType: 'increase',
          targetNodeId: 'L3-heart-qi-deficiency',
          modification: { confidenceDelta: 0.2, label: '心气虚' },
        },
        {
          answer: '否',
          adjustmentType: 'decrease',
          targetNodeId: 'L3-heart-qi-deficiency',
          modification: { confidenceDelta: -0.15 },
        },
      ],
    });

    // ==================== 舌边红凸相关规则 ====================
    this.addRule({
      id: 'CR-003',
      questionId: 'q-chest-abdomen',
      answers: [
        {
          answer: '经常烦躁',
          adjustmentType: 'increase',
          targetNodeId: 'L3-liver-fire',
          modification: { confidenceDelta: 0.2, label: '肝郁化火' },
        },
        {
          answer: '偶尔胁胀',
          adjustmentType: 'increase',
          targetNodeId: 'L3-liver-qi-stagnation',
          modification: { confidenceDelta: 0.12, label: '肝气郁结' },
        },
        {
          answer: '都没有',
          adjustmentType: 'decrease',
          targetNodeId: 'L3-liver-fire',
          modification: { confidenceDelta: -0.15 },
        },
        {
          answer: '都有',
          adjustmentType: 'increase',
          targetNodeId: 'L3-liver-fire',
          modification: { confidenceDelta: 0.25, label: '肝胆郁热' },
        },
      ],
    });

    this.addRule({
      id: 'CR-004',
      questionId: 'q-head-body',
      answers: [
        {
          answer: '头痛',
          adjustmentType: 'increase',
          targetNodeId: 'L3-liver-yang',
          modification: { confidenceDelta: 0.18, label: '肝阳上亢' },
        },
        {
          answer: '头晕',
          adjustmentType: 'increase',
          targetNodeId: 'L2-blood-deficiency',
          modification: { confidenceDelta: 0.12, label: '血虚头晕' },
        },
      ],
    });

    // ==================== 舌中凹陷相关规则 ====================
    this.addRule({
      id: 'CR-005',
      questionId: 'q-diet',
      answers: [
        {
          answer: '食欲不振',
          adjustmentType: 'increase',
          targetNodeId: 'L3-spleen-qi-deficiency',
          modification: { confidenceDelta: 0.2, label: '脾气虚' },
        },
        {
          answer: '口苦',
          adjustmentType: 'replace',
          targetNodeId: 'L2-spleen-deficiency',
          modification: { 
            confidenceDelta: 0.1, 
            label: '肝郁犯脾',
            description: '口苦+食欲不振，提示肝郁克脾' 
          },
        },
        {
          answer: '腹胀',
          adjustmentType: 'increase',
          targetNodeId: 'L3-spleen-damp',
          modification: { confidenceDelta: 0.15, label: '脾虚湿困' },
        },
      ],
    });

    this.addRule({
      id: 'CR-006',
      questionId: 'q-stool',
      answers: [
        {
          answer: '便溏',
          adjustmentType: 'increase',
          targetNodeId: 'L3-spleen-qi-deficiency',
          modification: { confidenceDelta: 0.2, label: '脾虚湿盛' },
        },
        {
          answer: '便秘',
          adjustmentType: 'replace',
          targetNodeId: 'L2-qi-deficiency',
          modification: { 
            confidenceDelta: 0.1, 
            label: '气阴两虚',
            description: '便干可能提示阴虚或气虚推动无力' 
          },
        },
        {
          answer: '正常',
          adjustmentType: 'decrease',
          targetNodeId: 'L3-spleen-damp',
          modification: { confidenceDelta: -0.1 },
        },
      ],
    });

    // ==================== 舌根苔黄腻相关规则 ====================
    this.addRule({
      id: 'CR-007',
      questionId: 'q-urine',
      answers: [
        {
          answer: '小便黄',
          adjustmentType: 'increase',
          targetNodeId: 'L3-lower-jiao-damp-heat',
          modification: { confidenceDelta: 0.15, label: '下焦湿热' },
        },
        {
          answer: '夜尿多',
          adjustmentType: 'increase',
          targetNodeId: 'L3-kidney-yang-deficiency',
          modification: { confidenceDelta: 0.15, label: '肾阳虚' },
        },
        {
          answer: '小便清长',
          adjustmentType: 'invalidate',
          targetNodeId: 'L3-lower-jiao-damp-heat',
          modification: { description: '小便清长提示肾阳虚，非湿热' },
        },
      ],
    });

    this.addRule({
      id: 'CR-008',
      questionId: 'q-ear-thirst',
      answers: [
        {
          answer: '腰酸明显',
          adjustmentType: 'increase',
          targetNodeId: 'L3-kidney-deficiency',
          modification: { confidenceDelta: 0.18, label: '肾虚' },
        },
        {
          answer: '耳鸣',
          adjustmentType: 'increase',
          targetNodeId: 'L3-kidney-yin-deficiency',
          modification: { confidenceDelta: 0.15, label: '肾阴虚' },
        },
      ],
    });

    // ==================== 舌淡胖大相关规则 ====================
    this.addRule({
      id: 'CR-009',
      questionId: 'q-fatigue',
      answers: [
        {
          answer: '是',
          adjustmentType: 'increase',
          targetNodeId: 'L2-qi-deficiency',
          modification: { confidenceDelta: 0.2, label: '气虚' },
        },
        {
          answer: '经常疲劳',
          adjustmentType: 'increase',
          targetNodeId: 'L2-qi-deficiency',
          modification: { confidenceDelta: 0.25, label: '气虚湿盛' },
        },
        {
          answer: '否',
          adjustmentType: 'decrease',
          targetNodeId: 'L2-qi-deficiency',
          modification: { confidenceDelta: -0.12 },
        },
      ],
    });

    this.addRule({
      id: 'CR-010',
      questionId: 'q-cold-heat',
      answers: [
        {
          answer: '怕冷',
          adjustmentType: 'increase',
          targetNodeId: 'L2-yang-deficiency',
          modification: { confidenceDelta: 0.2, label: '阳虚' },
        },
        {
          answer: '正常',
          adjustmentType: 'decrease',
          targetNodeId: 'L2-yang-deficiency',
          modification: { confidenceDelta: -0.1 },
        },
      ],
    });

    // ==================== 舌红裂纹相关规则 ====================
    this.addRule({
      id: 'CR-011',
      questionId: 'q-thirsty',
      answers: [
        {
          answer: '是',
          adjustmentType: 'increase',
          targetNodeId: 'L2-yin-deficiency',
          modification: { confidenceDelta: 0.2, label: '阴虚火旺' },
        },
        {
          answer: '口干明显，想喝水',
          adjustmentType: 'increase',
          targetNodeId: 'L3-empty-heat',
          modification: { confidenceDelta: 0.18, label: '阴虚火旺' },
        },
        {
          answer: '渴不欲饮',
          adjustmentType: 'replace',
          targetNodeId: 'L2-yin-deficiency',
          modification: { 
            confidenceDelta: 0.1, 
            label: '瘀血内阻',
            description: '渴不欲饮可能提示瘀血' 
          },
        },
      ],
    });

    this.addRule({
      id: 'CR-012',
      questionId: 'q-cold-heat',
      answers: [
        {
          answer: '怕热',
          adjustmentType: 'increase',
          targetNodeId: 'L2-yin-deficiency',
          modification: { confidenceDelta: 0.18, label: '阴虚内热' },
        },
        {
          answer: '手足寒热',
          adjustmentType: 'increase',
          targetNodeId: 'L3-empty-heat',
          modification: { confidenceDelta: 0.15, label: '阴虚火旺' },
        },
      ],
    });

    // ==================== 齿痕舌相关规则 ====================
    this.addRule({
      id: 'CR-013',
      questionId: 'q-diet',
      answers: [
        {
          answer: '腹胀明显',
          adjustmentType: 'increase',
          targetNodeId: 'L3-spleen-damp',
          modification: { confidenceDelta: 0.18, label: '脾虚湿盛' },
        },
        {
          answer: '大便溏稀',
          adjustmentType: 'increase',
          targetNodeId: 'L3-spleen-qi-deficiency',
          modification: { confidenceDelta: 0.2, label: '脾气虚' },
        },
      ],
    });

    this.addRule({
      id: 'CR-014',
      questionId: 'q-stool',
      answers: [
        {
          answer: '便溏',
          adjustmentType: 'increase',
          targetNodeId: 'L2-spleen-deficiency',
          modification: { confidenceDelta: 0.22, label: '脾虚湿盛' },
        },
      ],
    });

    // ==================== 舌紫相关规则 ====================
    this.addRule({
      id: 'CR-015',
      questionId: 'q-chest-abdomen',
      answers: [
        {
          answer: '有疼痛',
          adjustmentType: 'increase',
          targetNodeId: 'L4-blood-stasis',
          modification: { confidenceDelta: 0.25, label: '血瘀' },
        },
        {
          answer: '面色晦暗',
          adjustmentType: 'increase',
          targetNodeId: 'L4-blood-stasis',
          modification: { confidenceDelta: 0.2, label: '气滞血瘀' },
        },
        {
          answer: '都没有',
          adjustmentType: 'decrease',
          targetNodeId: 'L4-blood-stasis',
          modification: { confidenceDelta: -0.15 },
        },
      ],
    });

    // ==================== 年龄相关规则 ====================
    this.addRule({
      id: 'CR-016',
      questionId: 'q-age',
      answers: [
        {
          answer: '少年',
          adjustmentType: 'increase',
          targetNodeId: 'L2-congenital-deficiency',
          modification: { confidenceDelta: 0.2, label: '先天不足' },
        },
        {
          answer: '青年',
          adjustmentType: 'increase',
          targetNodeId: 'L3-liver-qi-stagnation',
          modification: { confidenceDelta: 0.15, label: '肝郁' },
        },
        {
          answer: '中年',
          adjustmentType: 'increase',
          targetNodeId: 'L3-liver-spleen-disharmony',
          modification: { confidenceDelta: 0.15, label: '肝郁脾虚' },
        },
        {
          answer: '老年',
          adjustmentType: 'increase',
          targetNodeId: 'L3-kidney-deficiency',
          modification: { confidenceDelta: 0.2, label: '肾虚' },
        },
      ],
    });

    // ==================== 寒热相关规则 ====================
    this.addRule({
      id: 'CR-017',
      questionId: 'q-cold-heat',
      answers: [
        {
          answer: '怕冷',
          adjustmentType: 'replace',
          targetNodeId: 'L2-yang-deficiency',
          modification: { confidenceDelta: 0.25, label: '阳虚' },
        },
        {
          answer: '怕热',
          adjustmentType: 'replace',
          targetNodeId: 'L2-yin-deficiency',
          modification: { confidenceDelta: 0.25, label: '阴虚内热' },
        },
        {
          answer: '正常',
          adjustmentType: 'invalidate',
          targetNodeId: 'L2-yang-deficiency',
          modification: { description: '寒热正常，阳虚可能性降低' },
        },
      ],
    });

    // ==================== 睡眠相关规则 ====================
    this.addRule({
      id: 'CR-018',
      questionId: 'q-sleep',
      answers: [
        {
          answer: '失眠',
          adjustmentType: 'increase',
          targetNodeId: 'L3-heart-fire',
          modification: { confidenceDelta: 0.2, label: '心火旺' },
        },
        {
          answer: '睡眠差',
          adjustmentType: 'increase',
          targetNodeId: 'L2-yin-deficiency',
          modification: { confidenceDelta: 0.15, label: '阴虚睡眠差' },
        },
        {
          answer: '嗜睡',
          adjustmentType: 'replace',
          targetNodeId: 'L2-qi-deficiency',
          modification: { confidenceDelta: 0.2, label: '气虚嗜睡' },
        },
      ],
    });

    // ==================== 头身相关规则 ====================
    this.addRule({
      id: 'CR-019',
      questionId: 'q-head-body',
      answers: [
        {
          answer: '头晕',
          adjustmentType: 'increase',
          targetNodeId: 'L2-blood-deficiency',
          modification: { confidenceDelta: 0.18, label: '血虚头晕' },
        },
        {
          answer: '头痛',
          adjustmentType: 'increase',
          targetNodeId: 'L3-liver-yang',
          modification: { confidenceDelta: 0.18, label: '肝阳头痛' },
        },
        {
          answer: '身痛',
          adjustmentType: 'increase',
          targetNodeId: 'L2-blood-stasis',
          modification: { confidenceDelta: 0.15, label: '血瘀身痛' },
        },
        {
          answer: '无',
          adjustmentType: 'decrease',
          targetNodeId: 'L3-liver-yang',
          modification: { confidenceDelta: -0.1 },
        },
      ],
    });

    // ==================== 饮食相关规则 ====================
    this.addRule({
      id: 'CR-020',
      questionId: 'q-diet',
      answers: [
        {
          answer: '食欲不振',
          adjustmentType: 'increase',
          targetNodeId: 'L3-spleen-qi-deficiency',
          modification: { confidenceDelta: 0.2, label: '脾气虚' },
        },
        {
          answer: '口苦',
          adjustmentType: 'increase',
          targetNodeId: 'L3-liver-fire',
          modification: { confidenceDelta: 0.18, label: '肝胆湿热' },
        },
        {
          answer: '腹胀',
          adjustmentType: 'increase',
          targetNodeId: 'L3-spleen-damp',
          modification: { confidenceDelta: 0.15, label: '脾虚湿困' },
        },
      ],
    });

    // ==================== 胸腹相关规则 ====================
    this.addRule({
      id: 'CR-021',
      questionId: 'q-chest-abdomen',
      answers: [
        {
          answer: '胸闷',
          adjustmentType: 'increase',
          targetNodeId: 'L3-liver-qi-stagnation',
          modification: { confidenceDelta: 0.18, label: '肝气郁结' },
        },
        {
          answer: '胁胀',
          adjustmentType: 'increase',
          targetNodeId: 'L3-liver-qi-stagnation',
          modification: { confidenceDelta: 0.22, label: '肝郁胁胀' },
        },
        {
          answer: '腹痛',
          adjustmentType: 'increase',
          targetNodeId: 'L2-blood-stasis',
          modification: { confidenceDelta: 0.12, label: '血瘀腹痛' },
        },
      ],
    });

    // ==================== 耳渴相关规则 ====================
    this.addRule({
      id: 'CR-022',
      questionId: 'q-ear-thirst',
      answers: [
        {
          answer: '耳鸣',
          adjustmentType: 'increase',
          targetNodeId: 'L3-kidney-deficiency',
          modification: { confidenceDelta: 0.2, label: '肾虚耳鸣' },
        },
        {
          answer: '口渴',
          adjustmentType: 'increase',
          targetNodeId: 'L2-yin-deficiency',
          modification: { confidenceDelta: 0.18, label: '阴虚口渴' },
        },
        {
          answer: '渴不欲饮',
          adjustmentType: 'increase',
          targetNodeId: 'L4-blood-stasis',
          modification: { confidenceDelta: 0.15, label: '瘀血' },
        },
      ],
    });

    // ==================== 小便相关规则 ====================
    this.addRule({
      id: 'CR-023',
      questionId: 'q-urine',
      answers: [
        {
          answer: '小便黄',
          adjustmentType: 'increase',
          targetNodeId: 'L2-damp-heat',
          modification: { confidenceDelta: 0.2, label: '湿热下注' },
        },
        {
          answer: '小便清长',
          adjustmentType: 'increase',
          targetNodeId: 'L3-kidney-yang-deficiency',
          modification: { confidenceDelta: 0.2, label: '肾阳虚' },
        },
        {
          answer: '夜尿多',
          adjustmentType: 'increase',
          targetNodeId: 'L3-kidney-yang-deficiency',
          modification: { confidenceDelta: 0.18, label: '肾阳不固' },
        },
      ],
    });

    // ==================== 汗相关规则 ====================
    this.addRule({
      id: 'CR-024',
      questionId: 'q-sweat',
      answers: [
        {
          answer: '自汗',
          adjustmentType: 'increase',
          targetNodeId: 'L2-qi-deficiency',
          modification: { confidenceDelta: 0.22, label: '气虚自汗' },
        },
        {
          answer: '盗汗',
          adjustmentType: 'increase',
          targetNodeId: 'L2-yin-deficiency',
          modification: { confidenceDelta: 0.22, label: '阴虚盗汗' },
        },
        {
          answer: '无汗',
          adjustmentType: 'invalidate',
          targetNodeId: 'L2-yin-deficiency',
          modification: { description: '无汗提示非阴虚' },
        },
      ],
    });

    // ==================== 综合验证规则 ====================
    this.addRule({
      id: 'CR-025',
      questionId: 'q-fatigue',
      answers: [
        {
          answer: '是',
          adjustmentType: 'increase',
          targetNodeId: 'L2-qi-deficiency',
          modification: { confidenceDelta: 0.2, label: '气虚' },
        },
        {
          answer: '偶尔',
          adjustmentType: 'decrease',
          targetNodeId: 'L2-qi-deficiency',
          modification: { confidenceDelta: -0.05 },
        },
        {
          answer: '否',
          adjustmentType: 'decrease',
          targetNodeId: 'L2-qi-deficiency',
          modification: { confidenceDelta: -0.15 },
        },
      ],
    });

    // ==================== 口干相关规则 ====================
    this.addRule({
      id: 'CR-026',
      questionId: 'q-thirsty',
      answers: [
        {
          answer: '是',
          adjustmentType: 'increase',
          targetNodeId: 'L2-yin-deficiency',
          modification: { confidenceDelta: 0.2, label: '阴虚' },
        },
        {
          answer: '渴不欲饮',
          adjustmentType: 'replace',
          targetNodeId: 'L2-yin-deficiency',
          modification: { 
            confidenceDelta: 0.1, 
            label: '瘀血内停',
            description: '渴不欲饮可能提示瘀血' 
          },
        },
        {
          answer: '否',
          adjustmentType: 'decrease',
          targetNodeId: 'L2-yin-deficiency',
          modification: { confidenceDelta: -0.12 },
        },
      ],
    });

    // ==================== 疲劳相关规则（补充） ====================
    this.addRule({
      id: 'CR-027',
      questionId: 'q-fatigue',
      answers: [
        {
          answer: '经常疲劳',
          adjustmentType: 'increase',
          targetNodeId: 'L2-qi-deficiency',
          modification: { confidenceDelta: 0.25, label: '气虚' },
        },
        {
          answer: '四肢发沉',
          adjustmentType: 'increase',
          targetNodeId: 'L2-dampness',
          modification: { confidenceDelta: 0.2, label: '湿盛' },
        },
        {
          answer: '都有',
          adjustmentType: 'increase',
          targetNodeId: 'L2-qi-deficiency',
          modification: { confidenceDelta: 0.3, label: '气虚湿盛' },
        },
      ],
    });

    // ==================== 肝郁验证规则 ====================
    this.addRule({
      id: 'CR-028',
      questionId: 'q-chest-abdomen',
      answers: [
        {
          answer: '经常烦躁',
          adjustmentType: 'increase',
          targetNodeId: 'L3-liver-fire',
          modification: { confidenceDelta: 0.2, label: '肝郁化火' },
        },
        {
          answer: '都没有',
          adjustmentType: 'decrease',
          targetNodeId: 'L3-liver-qi-stagnation',
          modification: { confidenceDelta: -0.15, label: '肝郁' },
        },
        {
          answer: '都有',
          adjustmentType: 'increase',
          targetNodeId: 'L3-liver-fire',
          modification: { confidenceDelta: 0.25, label: '肝胆郁热' },
        },
      ],
    });

    // ==================== 脾虚验证规则 ====================
    this.addRule({
      id: 'CR-029',
      questionId: 'q-diet',
      answers: [
        {
          answer: '胃口差+便溏',
          adjustmentType: 'increase',
          targetNodeId: 'L2-spleen-deficiency',
          modification: { confidenceDelta: 0.3, label: '脾虚湿盛' },
        },
        {
          answer: '胃口差+便干',
          adjustmentType: 'replace',
          targetNodeId: 'L2-spleen-deficiency',
          modification: { 
            confidenceDelta: 0.1, 
            label: '脾虚胃热',
            description: '胃口差+便干可能提示脾虚胃热' 
          },
        },
        {
          answer: '胃口尚可',
          adjustmentType: 'decrease',
          targetNodeId: 'L3-spleen-qi-deficiency',
          modification: { confidenceDelta: -0.12 },
        },
      ],
    });

    // ==================== 湿热验证规则 ====================
    this.addRule({
      id: 'CR-030',
      questionId: 'q-stool',
      answers: [
        {
          answer: '便溏',
          adjustmentType: 'increase',
          targetNodeId: 'L2-damp-heat',
          modification: { confidenceDelta: 0.15, label: '湿热便溏' },
        },
        {
          answer: '便秘',
          adjustmentType: 'increase',
          targetNodeId: 'L2-damp-heat',
          modification: { confidenceDelta: 0.1, label: '湿热便秘' },
        },
      ],
    });

    // ==================== 阴虚验证规则 ====================
    this.addRule({
      id: 'CR-031',
      questionId: 'q-thirsty',
      answers: [
        {
          answer: '口干明显',
          adjustmentType: 'increase',
          targetNodeId: 'L2-yin-deficiency',
          modification: { confidenceDelta: 0.22, label: '阴虚' },
        },
        {
          answer: '手脚心热',
          adjustmentType: 'increase',
          targetNodeId: 'L3-empty-heat',
          modification: { confidenceDelta: 0.2, label: '阴虚火旺' },
        },
        {
          answer: '都有',
          adjustmentType: 'increase',
          targetNodeId: 'L2-yin-deficiency',
          modification: { confidenceDelta: 0.3, label: '阴虚火旺' },
        },
      ],
    });

    // ==================== 睡眠与心火规则 ====================
    this.addRule({
      id: 'CR-032',
      questionId: 'q-sleep',
      answers: [
        {
          answer: '失眠',
          adjustmentType: 'increase',
          targetNodeId: 'L3-heart-fire',
          modification: { confidenceDelta: 0.2, label: '心火旺' },
        },
        {
          answer: '容易醒/多梦',
          adjustmentType: 'increase',
          targetNodeId: 'L3-heart-yin-deficiency',
          modification: { confidenceDelta: 0.15, label: '心阴虚' },
        },
      ],
    });
  }

  /**
   * 添加规则
   */
  addRule(rule: CorrectionRule): void {
    const existing = this.rules.get(rule.questionId) || [];
    existing.push(rule);
    this.rules.set(rule.questionId, existing);
  }

  /**
   * 根据问题ID获取规则
   */
  getRules(questionId: string): CorrectionRule[] {
    return this.rules.get(questionId) || [];
  }

  /**
   * 根据问题和回答查找匹配的修正规则
   */
  findMatchingRule(questionId: string, answer: string): CorrectionRule | undefined {
    const rules = this.getRules(questionId);
    
    for (const rule of rules) {
      for (const ans of rule.answers) {
        // 模糊匹配答案
        if (this.answerMatches(answer, ans.answer)) {
          return rule;
        }
      }
    }
    
    return undefined;
  }

  /**
   * 答案匹配（支持模糊匹配）
   */
  private answerMatches(userAnswer: string, ruleAnswer: string): boolean {
    const userNorm = userAnswer.toLowerCase().trim();
    const ruleNorm = ruleAnswer.toLowerCase().trim();
    
    // 完全匹配
    if (userNorm === ruleNorm) return true;
    
    // 包含匹配
    if (userNorm.includes(ruleNorm) || ruleNorm.includes(userNorm)) return true;
    
    // 部分关键词匹配
    const keywords = ['有', '是', '正常', '无', '否', '经常', '偶尔', '都没有', '都有'];
    const userKeywords = keywords.filter(k => userNorm.includes(k));
    const ruleKeywords = keywords.filter(k => ruleNorm.includes(k));
    
    if (userKeywords.length > 0 && ruleKeywords.length > 0) {
      // 检查是否有共同的关键词类别
      const yesWords = ['有', '是', '经常'];
      const noWords = ['无', '否', '正常', '都没有'];
      
      const userIsYes = userKeywords.some(k => yesWords.includes(k));
      const userIsNo = userKeywords.some(k => noWords.includes(k));
      const ruleIsYes = ruleKeywords.some(k => yesWords.includes(k));
      const ruleIsNo = ruleKeywords.some(k => noWords.includes(k));
      
      if ((userIsYes && ruleIsYes) || (userIsNo && ruleIsNo)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * 获取所有规则
   */
  getAllRules(): CorrectionRule[] {
    const allRules: CorrectionRule[] = [];
    for (const rules of this.rules.values()) {
      allRules.push(...rules);
    }
    return allRules;
  }

  /**
   * 获取规则数量
   */
  getRuleCount(): number {
    let count = 0;
    for (const rules of this.rules.values()) {
      count += rules.length;
    }
    return count;
  }
}

/**
 * 导出单例
 */
export const correctionRules = new CorrectionRules();

/**
 * 根据问题ID和回答获取修正动作
 */
export function getCorrectionAction(
  questionId: string, 
  answer: string
): { type: string; targetNodeId: string; modification: any } | undefined {
  const rule = correctionRules.findMatchingRule(questionId, answer);
  if (!rule) return undefined;

  for (const ans of rule.answers) {
    if (answer.includes(ans.answer) || ans.answer.includes(answer)) {
      return {
        type: ans.adjustmentType,
        targetNodeId: ans.targetNodeId,
        modification: ans.modification,
      };
    }
  }

  return undefined;
}
