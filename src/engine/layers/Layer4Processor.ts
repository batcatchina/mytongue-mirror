/**
 * Layer4 处理器：综合推理层 v2.0
 * 职责：综合推理 → 传变关系+配方案
 * 
 * 子盗母气 / 相克传变 / 经脉辨证 / 配穴组合
 */

import type { LayerInput, LayerOutput, InferenceNode, OrganPattern, Prescription } from '@/types/inference';
import { BaseLayerProcessor } from '../core/LayerProcessor';
import { createPrescriptionNode, createPatternNode } from '../core/InferenceNode';
import { TransmissionEngine } from '../core/TransmissionEngine';

/**
 * 配穴规则配置
 */
const ACUPOINT_RULES: Record<string, {
  mainPoints: string[];
  secondaryPoints: string[];
  technique: '补法' | '泻法' | '平补平泻';
  basis: string[];
}> = {
  '气虚': {
    mainPoints: ['足三里', '气海', '中脘'],
    secondaryPoints: ['脾俞', '胃俞', '关元'],
    technique: '补法',
    basis: ['足三里为强壮要穴', '气海补气', '中脘和胃'],
  },
  '气血两虚': {
    mainPoints: ['足三里', '膈俞', '三阴交'],
    secondaryPoints: ['脾俞', '血海', '气海'],
    technique: '补法',
    basis: ['膈俞为血会', '三阴交健脾养血', '足三里益气'],
  },
  '阴虚': {
    mainPoints: ['太溪', '三阴交', '照海'],
    secondaryPoints: ['肾俞', '心俞', '内关'],
    technique: '平补平泻',
    basis: ['太溪为肾经原穴', '照海滋阴', '三阴交健脾滋阴'],
  },
  '阴虚火旺': {
    mainPoints: ['太溪', '照海', '涌泉'],
    secondaryPoints: ['肾俞', '心俞', '神门'],
    technique: '平补平泻',
    basis: ['涌泉引火归元', '太溪滋阴降火', '照海滋阴清热'],
  },
  '阳虚': {
    mainPoints: ['关元', '命门', '肾俞'],
    secondaryPoints: ['足三里', '神阙', '腰阳关'],
    technique: '补法',
    basis: ['关元温阳', '命门补肾阳', '肾俞益肾'],
  },
  '湿盛': {
    mainPoints: ['阴陵泉', '丰隆', '水分'],
    secondaryPoints: ['脾俞', '三阴交', '中脘'],
    technique: '泻法',
    basis: ['阴陵泉利湿', '丰隆化痰湿', '水分分利水湿'],
  },
  '湿热': {
    mainPoints: ['阴陵泉', '曲池', '内庭'],
    secondaryPoints: ['合谷', '足三里', '三阴交'],
    technique: '泻法',
    basis: ['曲池清热', '内庭清胃热', '阴陵泉利湿'],
  },
  '肝郁': {
    mainPoints: ['太冲', '肝俞', '期门'],
    secondaryPoints: ['膻中', '内关', '三阴交'],
    technique: '平补平泻',
    basis: ['太冲疏肝理气', '肝俞调肝', '期门疏肝解郁'],
  },
  '肝郁化火': {
    mainPoints: ['太冲', '行间', '肝俞'],
    secondaryPoints: ['期门', '合谷', '曲池'],
    technique: '泻法',
    basis: ['行间清肝火', '太冲疏肝', '曲池清热'],
  },
  '脾虚': {
    mainPoints: ['足三里', '脾俞', '中脘'],
    secondaryPoints: ['阴陵泉', '三阴交', '胃俞'],
    technique: '补法',
    basis: ['足三里益气健脾', '脾俞健脾', '中脘和胃'],
  },
  '血瘀': {
    mainPoints: ['血海', '膈俞', '三阴交'],
    secondaryPoints: ['太冲', '肝俞', '合谷'],
    technique: '泻法',
    basis: ['血海活血化瘀', '膈俞为血会', '三阴交活血'],
  },
  '痰湿': {
    mainPoints: ['丰隆', '阴陵泉', '中脘'],
    secondaryPoints: ['足三里', '脾俞', '内关'],
    technique: '泻法',
    basis: ['丰隆化痰要穴', '阴陵泉利湿', '中脘化痰和胃'],
  },
};

/**
 * Layer4 综合推理处理器
 */
export class Layer4Processor extends BaseLayerProcessor {
  readonly layer = 4;
  readonly name = '综合推理层';
  readonly description = '传变关系 + 配穴方案';
  
  /** 传变引擎 */
  private transmissionEngine: TransmissionEngine;
  
  constructor() {
    super();
    this.transmissionEngine = new TransmissionEngine();
  }
  
  /**
   * 处理综合推理
   */
  process(input: LayerInput): LayerOutput {
    const previousLayerOutput = input.previousLayerOutput;
    
    if (!previousLayerOutput) {
      return this.createEmptyOutput();
    }
    
    const nodes: InferenceNode[] = [];
    
    // 1. 收集前三层的辨证结果
    const previousNodes = previousLayerOutput.nodes;
    
    // 2. 生成脏腑辨证汇总
    const organPatterns = this.generateOrganPatterns(previousNodes);
    
    // 3. 分析传变关系
    const triggerFeatures = this.extractTriggerFeatures(previousNodes);
    const transmissions = this.transmissionEngine.analyzeTransmission(organPatterns, triggerFeatures);
    const transmissionNodes = this.transmissionEngine.buildTransmissionChain(organPatterns, transmissions);
    nodes.push(...transmissionNodes);
    
    // 4. 生成传变路径描述
    const transmissionPaths = this.transmissionEngine.generateTransmissionPaths(transmissions);
    
    // 5. 生成配穴方案
    const prescription = this.generatePrescription(organPatterns);
    if (prescription) {
      const prescriptionNode = createPrescriptionNode(
        this.generateNodeId('prescription'),
        prescription.mainPoints,
        prescription.technique,
        prescription.confidence,
        4
      );
      nodes.push(prescriptionNode);
    }
    
    // 6. 生成最终证型
    const finalSyndrome = this.generateFinalSyndrome(organPatterns, transmissionPaths);
    const syndromeNode = createPatternNode(
      this.generateNodeId('final-syndrome'),
      finalSyndrome,
      this.generateSyndromeDescription(organPatterns, transmissionPaths),
      this.calculateSyndromeConfidence(organPatterns),
      organPatterns.flatMap(p => p.mainSymptoms),
      4
    );
    nodes.push(syndromeNode);
    
    return {
      layer: 4,
      nodes,
      summary: {
        label: syndromeNode.conclusion.label,
        description: syndromeNode.conclusion.description,
        confidence: syndromeNode.conclusion.confidence,
      },
      validationQuestions: this.generateValidationQuestions(organPatterns),
    };
  }
  
  /**
   * 生成脏腑辨证汇总
   */
  private generateOrganPatterns(nodes: InferenceNode[]): OrganPattern[] {
    const patterns: OrganPattern[] = [];
    
    // 从节点中提取脏腑辨证
    const organMap = new Map<string, OrganPattern>();
    
    for (const node of nodes) {
      if (node.type === 'organ') {
        const organ = node.metadata?.organLocation?.[0] || '';
        const existing = organMap.get(organ);
        
        if (!existing || node.conclusion.confidence > existing.confidence) {
          organMap.set(organ, {
            organ,
            pattern: node.conclusion.label,
            nature: node.metadata?.pathogenicNature || '',
            confidence: node.conclusion.confidence,
            mainSymptoms: node.conclusion.evidence,
            relatedNodeIds: [node.id],
          });
        }
      } else if (node.type === 'pattern') {
        // 从pattern节点中提取脏腑信息
        const description = node.conclusion.description;
        const organs = ['心', '肝', '脾', '肺', '肾', '胃', '胆'];
        
        for (const organ of organs) {
          if (description.includes(organ)) {
            const existing = organMap.get(organ);
            if (!existing || node.conclusion.confidence > existing.confidence) {
              organMap.set(organ, {
                organ,
                pattern: node.conclusion.label,
                nature: this.inferNatureFromPattern(node.conclusion.label),
                confidence: node.conclusion.confidence,
                mainSymptoms: node.conclusion.evidence,
                relatedNodeIds: [node.id],
              });
            }
          }
        }
      }
    }
    
    patterns.push(...Array.from(organMap.values()));
    
    // 按置信度排序
    return patterns.sort((a, b) => b.confidence - a.confidence);
  }
  
  /**
   * 从证型推断病性
   */
  private inferNatureFromPattern(pattern: string): string {
    if (pattern.includes('虚') || pattern.includes('不足')) return '虚证';
    if (pattern.includes('实') || pattern.includes('郁') || pattern.includes('热') || pattern.includes('湿')) return '实证';
    return '虚实夹杂';
  }
  
  /**
   * 提取触发特征
   */
  private extractTriggerFeatures(nodes: InferenceNode[]): string[] {
    const features: string[] = [];
    
    for (const node of nodes) {
      features.push(...node.conclusion.evidence);
    }
    
    return [...new Set(features)];
  }
  
  /**
   * 生成配穴方案
   */
  private generatePrescription(patterns: OrganPattern[]): Prescription | undefined {
    if (patterns.length === 0) return undefined;
    
    // 找到主证型
    const primaryPattern = patterns[0];
    
    // 匹配配穴规则
    let matchedRule = ACUPOINT_RULES[primaryPattern.pattern];
    
    // 如果没有精确匹配，尝试模糊匹配
    if (!matchedRule) {
      for (const [key, rule] of Object.entries(ACUPOINT_RULES)) {
        if (primaryPattern.pattern.includes(key) || key.includes(primaryPattern.pattern)) {
          matchedRule = rule;
          break;
        }
      }
    }
    
    // 默认配穴
    if (!matchedRule) {
      matchedRule = {
        mainPoints: ['足三里', '三阴交', '中脘'],
        secondaryPoints: ['脾俞', '胃俞'],
        technique: '平补平泻',
        basis: ['辨证配穴'],
      };
    }
    
    // 根据病性调整针法
    let technique = matchedRule.technique;
    if (primaryPattern.nature === '虚证') {
      technique = '补法';
    } else if (primaryPattern.nature === '实证') {
      technique = '泻法';
    }
    
    return {
      id: `prescription-${Date.now()}`,
      mainPoints: matchedRule.mainPoints,
      secondaryPoints: matchedRule.secondaryPoints,
      technique,
      needleRetention: 30,
      moxibustion: primaryPattern.nature === '虚证' ? '建议艾灸' : '慎用艾灸',
      frequency: '每周2-3次',
      course: '4周为一疗程',
      precautions: ['避开空腹和过饱', '治疗后注意保暖', '保持情绪舒畅'],
      basis: matchedRule.basis,
      confidence: primaryPattern.confidence,
    };
  }
  
  /**
   * 生成最终证型
   */
  private generateFinalSyndrome(patterns: OrganPattern[], transmissionPaths: string[]): string {
    if (patterns.length === 0) return '未能确定证型';
    
    const primaryPattern = patterns[0];
    let syndrome = primaryPattern.pattern;
    
    // 如果有传变，添加传变描述
    if (transmissionPaths.length > 0) {
      const firstTransmission = transmissionPaths[0];
      // 简化传变描述
      if (firstTransmission.includes('→')) {
        syndrome += '，' + this.simplifyTransmission(firstTransmission);
      }
    }
    
    return syndrome;
  }
  
  /**
   * 简化传变描述
   */
  private simplifyTransmission(transmission: string): string {
    // 提取关键信息
    const match = transmission.match(/(\w+)（(\w+)）→ (\w+)：/);
    if (match) {
      return `${match[2]}传变`;
    }
    return '存在传变关系';
  }
  
  /**
   * 生成证型描述
   */
  private generateSyndromeDescription(patterns: OrganPattern[], transmissionPaths: string[]): string {
    const descriptions: string[] = [];
    
    // 脏腑辨证
    for (const pattern of patterns.slice(0, 3)) {
      descriptions.push(`${pattern.organ}：${pattern.pattern}（${pattern.nature}）`);
    }
    
    // 传变关系
    if (transmissionPaths.length > 0) {
      descriptions.push('传变：' + transmissionPaths[0]);
    }
    
    return descriptions.join('；');
  }
  
  /**
   * 计算证型置信度
   */
  private calculateSyndromeConfidence(patterns: OrganPattern[]): number {
    if (patterns.length === 0) return 0;
    
    // 取最高置信度
    const maxConfidence = Math.max(...patterns.map(p => p.confidence));
    
    // 根据传变调整
    // 简单的置信度加权
    return Math.min(1, maxConfidence * 1.1);
  }
  
  /**
   * 生成验证问题
   */
  private generateValidationQuestions(patterns: OrganPattern[]): string[] {
    const questions: string[] = [];
    
    for (const pattern of patterns.slice(0, 2)) {
      if (pattern.organ === '脾') {
        questions.push('大便情况如何？');
      }
      if (pattern.organ === '肝') {
        questions.push('情绪和睡眠如何？');
      }
      if (pattern.organ === '肾') {
        questions.push('腰酸、乏力吗？');
      }
      if (pattern.organ === '心') {
        questions.push('有心慌、失眠吗？');
      }
    }
    
    return [...new Set(questions)];
  }
  
  /**
   * 创建空输出
   */
  private createEmptyOutput(): LayerOutput {
    return {
      layer: 4,
      nodes: [],
      summary: {
        label: '',
        description: '综合推理数据不足',
        confidence: 0,
      },
      validationQuestions: [],
    };
  }
}
