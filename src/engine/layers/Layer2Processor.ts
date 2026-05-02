/**
 * Layer2 处理器：舌形反直觉层 v2.0
 * 职责：舌形 → 虚实本质（反直觉层）
 * 
 * 核心原则：胖大≠实，瘦小红≠单纯虚
 * 要看到表象下的本质
 */

import type { LayerInput, LayerOutput, InferenceNode, LayerOutput as PreviousLayerOutput } from '@/types/inference';
import type { TongueAnalysisResult, TongueShapeValue, TongueColorValue } from '@/types/tongue';
import { BaseLayerProcessor } from '../core/LayerProcessor';
import { createPatternNode } from '../core/InferenceNode';
import {
  Layer2Rules,
  tongueShapeRules,
  essenceRules,
  matchTongueShapeRule,
  determineEssence,
  type TongueShapeRule
} from '../rules/tongueShape.rules';

/**
 * Layer2 输出类型
 */
export interface Layer2Result {
  /** 舌形本质结论 */
  shapeEssenceConclusion: InferenceConclusion;
  /** 齿痕本质结论 */
  teethMarkEssence?: InferenceConclusion;
  /** 裂纹本质结论 */
  crackEssence?: InferenceConclusion;
  /** 虚实判断 */
  deficiencyExcessJudgment: {
    essenceLabel: string;
    description: string;
    confidence: number;
    isAntiIntuitive: boolean;
  };
  /** 综合置信度 */
  overallConfidence: number;
  /** 推理链 */
  reasoningChain: string[];
}

/**
 * 结论类型
 */
interface InferenceConclusion {
  label: string;
  description: string;
  confidence: number;
  evidence: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Layer2 舌形反直觉处理器
 */
export class Layer2Processor extends BaseLayerProcessor {
  readonly layer = 2;
  readonly name = '舌形反直觉层';
  readonly description = '舌形 → 虚实本质（胖大≠实，瘦小红≠单纯虚）';
  
  /**
   * 处理舌形特征
   */
  process(input: LayerInput): LayerOutput {
    const tongueAnalysis = input.tongueAnalysis;
    
    if (!tongueAnalysis) {
      return this.createEmptyOutput();
    }
    
    const nodes: InferenceNode[] = [];
    const { shape, bodyColor, hasTeethMark, hasCrack, teethMarkDegree, crackDegree, crackDistribution } = tongueAnalysis;
    
    // 1. 分析舌形本质
    const shapeAnalysis = this.analyzeShapeEssence(tongueAnalysis);
    nodes.push(shapeAnalysis);
    
    // 2. 分析齿痕本质
    let teethMarkNode: InferenceNode | undefined;
    if (hasTeethMark) {
      teethMarkNode = this.analyzeTeethMark(tongueAnalysis);
      nodes.push(teethMarkNode);
    }
    
    // 3. 分析裂纹本质
    let crackNode: InferenceNode | undefined;
    if (hasCrack) {
      crackNode = this.analyzeCrack(tongueAnalysis);
      nodes.push(crackNode);
    }
    
    // 4. 综合虚实判断
    const essenceSynthesis = this.synthesizeEssence(shapeAnalysis, teethMarkNode, crackNode);
    nodes.push(essenceSynthesis);
    
    return {
      layer: 2,
      nodes,
      summary: {
        label: essenceSynthesis.conclusion.label,
        description: essenceSynthesis.conclusion.description,
        confidence: essenceSynthesis.conclusion.confidence,
      },
      validationQuestions: this.generateValidationQuestions(essenceSynthesis),
    };
  }
  
  /**
   * 获取Layer2完整结果
   */
  getLayer2Result(input: LayerInput): Layer2Result {
    const output = this.process(input);
    
    const shapeNode = output.nodes.find(n => n.name.includes('舌形'));
    const teethNode = output.nodes.find(n => n.name.includes('齿痕'));
    const crackNode = output.nodes.find(n => n.name.includes('裂纹'));
    const essenceNode = output.nodes.find(n => n.name.includes('虚实') || n.name.includes('本质'));
    
    return {
      shapeEssenceConclusion: shapeNode?.conclusion || {
        label: '',
        description: '',
        confidence: 0,
        evidence: [],
        priority: 'medium',
      },
      teethMarkEssence: teethNode?.conclusion ? {
        ...teethNode.conclusion,
        priority: 'medium',
      } : undefined,
      crackEssence: crackNode?.conclusion ? {
        ...crackNode.conclusion,
        priority: 'medium',
      } : undefined,
      deficiencyExcessJudgment: {
        essenceLabel: essenceNode?.conclusion.label || '',
        description: essenceNode?.conclusion.description || '',
        confidence: essenceNode?.conclusion.confidence || 0,
        isAntiIntuitive: output.nodes.some(n => 
          n.conclusion.evidence.some(e => e.includes('反直觉'))
        ),
      },
      overallConfidence: essenceNode?.conclusion.confidence || 0,
      reasoningChain: this.extractReasoningChain(output.nodes),
    };
  }
  
  /**
   * 分析舌形本质
   */
  private analyzeShapeEssence(analysis: TongueAnalysisResult): InferenceNode {
    const { shape, bodyColor, hasTeethMark, hasCrack } = analysis;
    
    // 使用规则匹配
    const matchedRule = matchTongueShapeRule(shape, bodyColor, hasTeethMark, hasCrack);
    
    let essenceLabel = '';
    let essenceDesc = '';
    let confidence = 0.5;
    let isAntiIntuitive = false;
    const evidence: string[] = [];
    
    if (matchedRule) {
      essenceLabel = matchedRule.essence;
      essenceDesc = matchedRule.description;
      confidence = matchedRule.confidence;
      isAntiIntuitive = matchedRule.isAntiIntuitive;
      evidence.push(...matchedRule.evidence);
    } else {
      // 默认处理
      switch (shape) {
        case '胖大':
          // 反直觉：胖大 ≠ 实，而是气虚
          isAntiIntuitive = true;
          if (bodyColor === '淡白') {
            essenceLabel = '气虚（阳虚倾向）';
            essenceDesc = '舌体胖大为气虚或阳虚，水湿运化失常所致';
            confidence = 0.8;
          } else if (bodyColor === '淡红') {
            essenceLabel = '气虚湿盛';
            essenceDesc = '舌体胖大为气虚，水湿运化无力';
            confidence = 0.75;
          } else if (bodyColor === '红' || bodyColor === '绛') {
            essenceLabel = '湿热蕴结';
            essenceDesc = '舌体胖大舌色红为湿热内蕴';
            confidence = 0.75;
            isAntiIntuitive = false;
          } else {
            essenceLabel = '气虚';
            essenceDesc = '舌体胖大为气虚表现';
            confidence = 0.7;
          }
          evidence.push('反直觉判断：胖大≠实，而是气虚');
          break;
          
        case '瘦薄':
          // 反直觉：瘦薄 ≠ 单纯虚
          isAntiIntuitive = true;
          if (bodyColor === '红' || bodyColor === '绛') {
            essenceLabel = '阴虚火旺';
            essenceDesc = '舌体瘦薄为阴虚，舌红为火旺，阴虚火旺';
            confidence = 0.85;
          } else if (bodyColor === '淡白') {
            essenceLabel = '气血两虚';
            essenceDesc = '舌体瘦薄为阴血亏虚，舌淡为气血不足';
            confidence = 0.8;
          } else {
            essenceLabel = '阴虚';
            essenceDesc = '舌体瘦薄为阴虚，津液耗损';
            confidence = 0.7;
          }
          evidence.push('反直觉判断：瘦薄需结合舌色判断阴虚/气虚');
          break;
          
        case '正常':
        case '适中':
          essenceLabel = '舌形正常';
          essenceDesc = '舌体大小正常，无明显虚实偏颇';
          confidence = 0.9;
          break;
          
        case '短缩':
          essenceLabel = '危急重症';
          essenceDesc = '舌体短缩为危重证候，提示热盛伤津或寒凝筋脉';
          confidence = 0.9;
          evidence.push('短缩舌为危急表现，需高度重视');
          break;
          
        case '松弛':
          essenceLabel = '气虚（松弛）';
          essenceDesc = '舌体松弛为气虚表现';
          confidence = 0.7;
          evidence.push('松弛舌=气虚');
          break;
          
        default:
          essenceLabel = '待定';
          essenceDesc = '舌形待进一步分析';
          confidence = 0.3;
      }
    }
    
    evidence.push(`舌形：${shape}`);
    if (bodyColor) {
      evidence.push(`舌色：${bodyColor}`);
    }
    
    const patternNode = createPatternNode(
      this.generateNodeId('shape-essence'),
      essenceLabel,
      essenceDesc,
      confidence,
      evidence,
      2
    );
    
    return patternNode;
  }
  
  /**
   * 分析齿痕本质
   */
  private analyzeTeethMark(analysis: TongueAnalysisResult): InferenceNode {
    const { hasTeethMark, teethMarkDegree, shape, bodyColor } = analysis;
    
    if (!hasTeethMark) {
      return createPatternNode(
        this.generateNodeId('teeth-mark'),
        '无齿痕',
        '舌边无明显齿印',
        1.0,
        [],
        2
      );
    }
    
    let label = '脾虚湿盛';
    let desc = '舌边有齿痕为脾虚湿盛表现';
    let confidence = 0.75;
    let isAntiIntuitive = false;
    const evidence: string[] = [];
    
    // 结合胖大舌判断（反直觉）
    if (shape === '胖大') {
      label = '气虚湿盛（本虚标实）';
      desc = '胖大+齿痕=气虚为本，湿盛为标';
      confidence = 0.85;
      isAntiIntuitive = true;
      evidence.push('反直觉判断：胖大+齿痕=气虚为本，湿盛为标');
    } else if (shape === '正常' || shape === '适中') {
      label = '脾虚湿盛';
      desc = '舌边有齿痕为脾虚湿盛';
      confidence = 0.75;
      evidence.push('齿痕=脾虚湿盛');
    }
    
    // 结合舌色调整置信度
    if (bodyColor === '淡白' || bodyColor === '淡红') {
      if (shape === '胖大') {
        label = '气虚湿盛（阳虚倾向）';
        desc = '胖大+齿痕+舌淡=气虚/阳虚为本，湿盛为标';
        confidence = 0.85;
      }
      confidence = Math.min(1, confidence + 0.05);
    }
    
    evidence.push('齿痕程度：' + (teethMarkDegree || '中等'));
    
    const patternNode = createPatternNode(
      this.generateNodeId('teeth-mark'),
      label,
      desc,
      confidence,
      evidence,
      2
    );
    
    return patternNode;
  }
  
  /**
   * 分析裂纹本质
   */
  private analyzeCrack(analysis: TongueAnalysisResult): InferenceNode {
    const { hasCrack, crackDegree, bodyColor, crackDistribution } = analysis;
    
    if (!hasCrack) {
      return createPatternNode(
        this.generateNodeId('crack'),
        '无裂纹',
        '舌面无明显裂纹',
        1.0,
        [],
        2
      );
    }
    
    let label = '阴虚/血虚/精亏';
    let desc = '舌面有裂纹提示阴虚、血虚或精亏';
    let confidence = 0.7;
    const evidence: string[] = [];
    
    // 结合舌色精确判断
    if (bodyColor === '红' || bodyColor === '绛') {
      label = '阴虚火旺';
      desc = '舌红+裂纹=阴虚火旺，津液耗伤';
      confidence = 0.85;
      evidence.push('裂纹+舌红=阴虚火旺');
    } else if (bodyColor === '淡白' || bodyColor === '淡红') {
      label = '血虚';
      desc = '舌淡+裂纹=血虚，组织失养';
      confidence = 0.75;
      evidence.push('裂纹+舌淡=血虚');
    } else {
      label = '精亏';
      desc = '舌有裂纹为精亏表现';
      confidence = 0.65;
      evidence.push('裂纹=精亏');
    }
    
    evidence.push('裂纹程度：' + (crackDegree || '中等'));
    if (crackDistribution && crackDistribution.length > 0) {
      evidence.push('裂纹分布：' + crackDistribution.join('、'));
    }
    
    const patternNode = createPatternNode(
      this.generateNodeId('crack'),
      label,
      desc,
      confidence,
      evidence,
      2
    );
    
    return patternNode;
  }
  
  /**
   * 综合虚实本质判断
   */
  private synthesizeEssence(
    shapeNode: InferenceNode,
    teethMarkNode?: InferenceNode,
    crackNode?: InferenceNode
  ): InferenceNode {
    // 收集所有本质判断
    const patternLabels: string[] = [shapeNode.conclusion.label];
    
    if (teethMarkNode && teethMarkNode.conclusion.label !== '无齿痕') {
      patternLabels.push(teethMarkNode.conclusion.label);
    }
    
    if (crackNode && crackNode.conclusion.label !== '无裂纹') {
      patternLabels.push(crackNode.conclusion.label);
    }
    
    // 判断虚实倾向
    const essenceResult = determineEssence(patternLabels);
    
    // 检查是否有反直觉判断
    const hasAntiIntuitive = 
      shapeNode.conclusion.evidence.some(e => e.includes('反直觉')) ||
      (teethMarkNode && teethMarkNode.conclusion.evidence.some(e => e.includes('反直觉')));
    
    let summaryLabel = essenceResult.essenceLabel;
    let summaryDesc = essenceResult.description;
    let confidence = essenceResult.confidence;
    
    // 如果有反直觉判断，在描述中强调
    if (hasAntiIntuitive) {
      summaryDesc = `（反直觉）${summaryDesc}`;
      // 反直觉判断加权
      confidence = Math.min(1, confidence + 0.05);
    }
    
    // 结合所有证据
    const allEvidence = [
      ...shapeNode.conclusion.evidence,
      ...(teethMarkNode?.conclusion.evidence || []),
      ...(crackNode?.conclusion.evidence || []),
    ];
    
    const synthesisNode = createPatternNode(
      this.generateNodeId('essence-synthesis'),
      summaryLabel,
      summaryDesc,
      confidence,
      [...new Set(allEvidence)],
      2
    );
    
    const causes: string[] = [shapeNode.id];
    if (teethMarkNode) causes.push(teethMarkNode.id);
    if (crackNode) causes.push(crackNode.id);
    synthesisNode.causes.push(...causes);
    
    return synthesisNode;
  }
  
  /**
   * 提取推理链
   */
  private extractReasoningChain(nodes: InferenceNode[]): string[] {
    const chain: string[] = [];
    
    for (const node of nodes) {
      if (node.conclusion.label) {
        const antiIntuitiveMark = node.conclusion.evidence.some(e => e.includes('反直觉'))
          ? '【反直觉】' 
          : '';
        chain.push(`${node.name}: ${antiIntuitiveMark}${node.conclusion.label} (置信度: ${(node.conclusion.confidence * 100).toFixed(0)}%)`);
      }
    }
    
    return chain;
  }
  
  /**
   * 生成验证问题
   */
  private generateValidationQuestions(essenceNode: InferenceNode): string[] {
    const questions: string[] = [];
    const label = essenceNode.conclusion.label;
    
    if (label.includes('气虚')) {
      questions.push('平时是否容易疲劳、气短？');
      questions.push('是否容易四肢发沉？');
    }
    
    if (label.includes('阴虚')) {
      questions.push('是否有口干、手脚心热？');
      questions.push('睡眠质量如何？');
    }
    
    if (label.includes('湿盛') || label.includes('痰湿')) {
      questions.push('大便是否溏稀或黏滞？');
      questions.push('身体是否困重？');
    }
    
    if (label.includes('血虚')) {
      questions.push('是否容易头晕、眼花？');
      questions.push('面色是否萎黄或苍白？');
    }
    
    return [...new Set(questions)];
  }
  
  /**
   * 创建空输出
   */
  private createEmptyOutput(): LayerOutput {
    return {
      layer: 2,
      nodes: [],
      summary: {
        label: '',
        description: '舌形分析数据不足',
        confidence: 0,
      },
      validationQuestions: [],
    };
  }
}
