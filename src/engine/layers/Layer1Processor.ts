/**
 * Layer1 处理器：舌质舌苔层 v2.0
 * 职责：舌质+舌苔 → 气血与脾胃整体判断
 * 
 * 第一层推理：
 * - 舌质=脏腑气血底子
 * - 舌苔=脾胃运化状态
 * - 舌质+舌苔组合推理
 */

import type { LayerInput, LayerOutput, InferenceNode, InferenceConclusion } from '@/types/inference';
import type { TongueAnalysisResult, TongueColorValue, CoatingColorValue, CoatingTextureValue } from '@/types/tongue';
import { BaseLayerProcessor } from '../core/LayerProcessor';
import { createTongueFeatureNode, createPatternNode } from '../core/InferenceNode';
import {
  Layer1Rules,
  tongueBodyRules,
  coatingRules,
  coatingTextureRules,
  compoundRules,
  matchTongueBodyRule,
  matchCoatingRule,
  matchCompoundRule,
  type TongueBodyRule,
  type CoatingRule,
  type CompoundRule
} from '../rules/tongueBody.rules';

/**
 * Layer1 输出类型（带置信度修正）
 */
export interface Layer1Result {
  /** 舌质分析结论 */
  tongueBodyConclusion: InferenceConclusion;
  /** 舌苔分析结论 */
  coatingConclusion: InferenceConclusion;
  /** 组合推理结论 */
  compoundConclusion: InferenceConclusion;
  /** 气血判断 */
  qiBloodJudgment: {
    label: string;
    confidence: number;
    description: string;
  };
  /** 脾胃状态 */
  spleenStomachState: {
    label: string;
    confidence: number;
    description: string;
  };
  /** 综合置信度 */
  overallConfidence: number;
  /** 推理链 */
  reasoningChain: string[];
}

/**
 * Layer1 舌质舌苔处理器
 */
export class Layer1Processor extends BaseLayerProcessor {
  readonly layer = 1;
  readonly name = '舌质舌苔层';
  readonly description = '舌质=脏腑气血底子 / 舌苔=脾胃运化状态';
  
  /**
   * 处理舌质舌苔特征
   */
  process(input: LayerInput): LayerOutput {
    const tongueAnalysis = input.tongueAnalysis;
    if (!tongueAnalysis) {
      return this.createEmptyOutput();
    }
    
    const nodes: InferenceNode[] = [];
    
    // 1. 舌质分析节点
    const bodyColorNode = this.analyzeTongueBody(tongueAnalysis);
    nodes.push(bodyColorNode);
    
    // 2. 舌苔分析节点
    const coatingNode = this.analyzeCoating(tongueAnalysis);
    nodes.push(coatingNode);
    
    // 3. 苔质分析节点
    const textureNode = this.analyzeCoatingTexture(tongueAnalysis);
    nodes.push(textureNode);
    
    // 4. 组合推理节点
    const compoundNode = this.analyzeCompound(tongueAnalysis);
    nodes.push(compoundNode);
    
    // 5. 综合判断节点
    const synthesisNode = this.synthesize(bodyColorNode, coatingNode, textureNode, compoundNode);
    nodes.push(synthesisNode);
    
    return {
      layer: 1,
      nodes,
      summary: {
        label: synthesisNode.conclusion.label,
        description: synthesisNode.conclusion.description,
        confidence: synthesisNode.conclusion.confidence,
      },
      validationQuestions: this.generateValidationQuestions(nodes),
    };
  }
  
  /**
   * 获取Layer1完整结果
   */
  getLayer1Result(input: LayerInput): Layer1Result {
    const output = this.process(input);
    
    // 从节点中提取结论
    const bodyNode = output.nodes.find(n => n.name.includes('舌质') || n.id.includes('body'));
    const coatingNode = output.nodes.find(n => n.name.includes('苔') && n.type === 'pattern');
    const compoundNode = output.nodes.find(n => n.id.includes('compound'));
    const synthesisNode = output.nodes.find(n => n.id.includes('synthesis'));
    
    return {
      tongueBodyConclusion: bodyNode?.conclusion || {
        label: '',
        description: '',
        confidence: 0,
        evidence: [],
        priority: 'medium',
      },
      coatingConclusion: coatingNode?.conclusion || {
        label: '',
        description: '',
        confidence: 0,
        evidence: [],
        priority: 'medium',
      },
      compoundConclusion: compoundNode?.conclusion || {
        label: '',
        description: '',
        confidence: 0,
        evidence: [],
        priority: 'medium',
      },
      qiBloodJudgment: {
        label: synthesisNode?.conclusion.label || '',
        confidence: synthesisNode?.conclusion.confidence || 0,
        description: synthesisNode?.conclusion.description || '',
      },
      spleenStomachState: {
        label: coatingNode?.conclusion.label || '',
        confidence: coatingNode?.conclusion.confidence || 0,
        description: coatingNode?.conclusion.description || '',
      },
      overallConfidence: synthesisNode?.conclusion.confidence || 0,
      reasoningChain: this.extractReasoningChain(output.nodes),
    };
  }
  
  /**
   * 分析舌质
   */
  private analyzeTongueBody(analysis: TongueAnalysisResult): InferenceNode {
    const { bodyColor } = analysis;
    
    // 舌质特征节点
    const featureNode = createTongueFeatureNode(
      this.generateNodeId('body'),
      '舌质',
      bodyColor,
      1
    );
    
    // 使用规则匹配
    const matchedRule = matchTongueBodyRule(bodyColor);
    
    let patternLabel = '';
    let patternDesc = '';
    let confidence = 0.5;
    const evidence: string[] = [];
    
    if (matchedRule) {
      patternLabel = matchedRule.pattern;
      patternDesc = matchedRule.description;
      confidence = matchedRule.confidence;
      evidence.push(...matchedRule.evidence);
    } else {
      // 默认处理
      switch (bodyColor) {
        case '淡红':
          patternLabel = '气血调和';
          patternDesc = '舌质淡红为正常舌象，气血调和，阴阳平衡';
          confidence = 0.9;
          evidence.push('舌色淡红为健康标志');
          break;
        case '淡白':
          patternLabel = '气血不足';
          patternDesc = '舌质淡白主气血不足或阳虚，血失温煦';
          confidence = 0.75;
          evidence.push('舌色淡白=血色不足=气血亏虚');
          break;
        case '红':
          patternLabel = '热证';
          patternDesc = '舌质红主热证，里热炽盛或阴虚火旺';
          confidence = 0.7;
          evidence.push('舌色红=热迫血行');
          break;
        case '绛':
          patternLabel = '热入营血';
          patternDesc = '舌质绛主热入营血，阴虚火旺';
          confidence = 0.8;
          evidence.push('舌色绛=热入营血');
          break;
        case '紫':
        case '青紫':
        case '淡紫':
          patternLabel = '血瘀';
          patternDesc = '舌质紫主血瘀，气血运行不畅';
          confidence = 0.75;
          evidence.push('舌色紫=气血运行不畅');
          break;
        case '暗红':
          patternLabel = '瘀血/阴虚';
          patternDesc = '舌质暗红主瘀血或阴虚';
          confidence = 0.7;
          evidence.push('舌色暗红=血行不畅');
          break;
      }
    }
    
    evidence.push(`舌色：${bodyColor}`);
    
    const patternNode = createPatternNode(
      this.generateNodeId('pattern-body'),
      patternLabel,
      patternDesc,
      confidence,
      evidence,
      1
    );
    
    featureNode.effects.push(patternNode.id);
    patternNode.causes.push(featureNode.id);
    
    return patternNode;
  }
  
  /**
   * 分析舌苔（苔色）
   */
  private analyzeCoating(analysis: TongueAnalysisResult): InferenceNode {
    const { coatingColor } = analysis;
    
    // 使用规则匹配
    const matchedRule = matchCoatingRule(coatingColor);
    
    let coatingPattern = '';
    let coatingDesc = '';
    let coatingConfidence = 0.5;
    const evidence: string[] = [];
    
    if (matchedRule) {
      coatingPattern = matchedRule.pattern;
      coatingDesc = matchedRule.description;
      coatingConfidence = matchedRule.confidence;
      evidence.push(...matchedRule.evidence);
    } else {
      // 默认处理
      switch (coatingColor) {
        case '薄白':
          coatingPattern = '胃气充和';
          coatingDesc = '苔薄白为正常，胃气充和';
          coatingConfidence = 0.9;
          evidence.push('苔薄白为常');
          break;
        case '白厚':
          coatingPattern = '寒湿/痰湿';
          coatingDesc = '苔白厚主寒湿内蕴或痰湿困脾';
          coatingConfidence = 0.75;
          evidence.push('苔白=寒邪/未化热');
          break;
        case '黄':
          coatingPattern = '热证';
          coatingDesc = '苔黄主热证，热邪内蕴';
          coatingConfidence = 0.7;
          evidence.push('苔黄=热邪已聚');
          break;
        case '灰黑':
          coatingPattern = '阴寒/热极';
          coatingDesc = '苔灰黑主阴寒内盛或热极伤阴';
          coatingConfidence = 0.8;
          evidence.push('苔灰黑为危重');
          break;
        case '剥落':
        case '少苔':
          coatingPattern = '阴虚/胃阴亏';
          coatingDesc = '苔少或剥落主阴虚或胃阴亏';
          coatingConfidence = 0.75;
          evidence.push('苔剥=胃气受损');
          break;
        case '无苔':
          coatingPattern = '阴虚/胃气大伤';
          coatingDesc = '无苔主阴虚或胃气枯竭';
          coatingConfidence = 0.8;
          evidence.push('无苔=胃气枯竭');
          break;
      }
    }
    
    evidence.push(`苔色：${coatingColor}`);
    
    return createPatternNode(
      this.generateNodeId('pattern-coating'),
      coatingPattern,
      coatingDesc,
      coatingConfidence,
      evidence,
      1
    );
  }
  
  /**
   * 分析苔质
   */
  private analyzeCoatingTexture(analysis: TongueAnalysisResult): InferenceNode {
    const { coatingTexture } = analysis;
    
    let texturePattern = '';
    let textureDesc = '';
    let textureConfidence = 0.5;
    const evidence: string[] = [];
    
    switch (coatingTexture) {
      case '薄':
        texturePattern = '正常/表证';
        textureDesc = '苔薄为正常或表证';
        textureConfidence = 0.8;
        evidence.push('苔薄=邪气轻浅');
        break;
      case '厚':
        texturePattern = '邪气盛';
        textureDesc = '苔厚主邪气内蕴';
        textureConfidence = 0.7;
        evidence.push('苔厚=邪气内蕴');
        break;
      case '腻':
        texturePattern = '湿浊';
        textureDesc = '苔腻主湿浊内蕴';
        textureConfidence = 0.8;
        evidence.push('苔腻=湿浊内蕴');
        break;
      case '燥':
        texturePattern = '津液耗伤';
        textureDesc = '苔燥主津液耗伤';
        textureConfidence = 0.75;
        evidence.push('苔燥=津液不足');
        break;
      case '腐':
        texturePattern = '食积/痰浊';
        textureDesc = '苔腐主食积或痰浊';
        textureConfidence = 0.7;
        evidence.push('苔腐=食积痰浊');
        break;
      case '滑':
        texturePattern = '寒湿/痰饮';
        textureDesc = '苔滑主寒湿或痰饮';
        textureConfidence = 0.75;
        evidence.push('苔滑=寒湿痰饮');
        break;
      case '润':
        texturePattern = '正常';
        textureDesc = '苔润为正常';
        textureConfidence = 0.9;
        evidence.push('苔润=正常');
        break;
      default:
        texturePattern = '正常';
        textureDesc = '苔质正常';
        textureConfidence = 0.8;
    }
    
    evidence.push(`苔质：${coatingTexture}`);
    
    return createPatternNode(
      this.generateNodeId('pattern-texture'),
      texturePattern,
      textureDesc,
      textureConfidence,
      evidence,
      1
    );
  }
  
  /**
   * 组合推理：舌质+舌苔
   */
  private analyzeCompound(analysis: TongueAnalysisResult): InferenceNode {
    const { bodyColor, coatingColor } = analysis;
    
    // 使用组合规则匹配
    const matchedRule = matchCompoundRule(bodyColor, coatingColor);
    
    let compoundLabel = '';
    let compoundDesc = '';
    let compoundConfidence = 0.5;
    const evidence: string[] = [];
    
    if (matchedRule) {
      compoundLabel = matchedRule.pattern;
      compoundDesc = matchedRule.description;
      compoundConfidence = matchedRule.confidence;
      evidence.push(...matchedRule.evidence);
    } else {
      // 默认组合推理
      // 舌质红+苔黄=实热
      if (bodyColor === '红' && coatingColor === '黄') {
        compoundLabel = '实热';
        compoundDesc = '舌质红苔黄为实热证';
        compoundConfidence = 0.8;
        evidence.push('舌红苔黄=实热');
      }
      // 舌质红+无苔/少苔=阴虚火旺
      else if (bodyColor === '红' && (coatingColor === '无苔' || coatingColor === '少苔' || coatingColor === '剥落')) {
        compoundLabel = '阴虚火旺';
        compoundDesc = '舌红少苔为阴虚火旺';
        compoundConfidence = 0.8;
        evidence.push('舌红无苔=阴虚火旺');
      }
      // 舌质淡+苔白腻=气血两虚湿盛
      else if ((bodyColor === '淡白' || bodyColor === '淡红') && coatingColor === '白厚') {
        compoundLabel = '气血不足+湿盛';
        compoundDesc = '舌淡苔白腻为气血两虚湿盛';
        compoundConfidence = 0.75;
        evidence.push('舌淡苔白腻=气血两虚湿盛');
      }
      // 舌质淡+苔薄=气血偏虚
      else if (bodyColor === '淡白' || bodyColor === '淡红') {
        compoundLabel = '气血偏虚';
        compoundDesc = '舌质偏淡提示气血不足';
        compoundConfidence = 0.65;
        evidence.push('舌淡=气血不足');
      }
      // 舌质紫+苔白=血瘀
      else if (bodyColor === '紫' || bodyColor === '青紫' || bodyColor === '淡紫') {
        compoundLabel = '血瘀证';
        compoundDesc = '舌质紫主血瘀';
        compoundConfidence = 0.75;
        evidence.push('舌紫=血瘀');
      }
      // 舌质绛+苔黄=热入营血重
      else if (bodyColor === '绛' && coatingColor === '黄') {
        compoundLabel = '热入营血（重）';
        compoundDesc = '舌绛苔黄为热入营血重证';
        compoundConfidence = 0.85;
        evidence.push('舌绛苔黄=热入营血重证');
      }
    }
    
    evidence.push(`舌色：${bodyColor}，苔色：${coatingColor}`);
    
    return createPatternNode(
      this.generateNodeId('compound'),
      compoundLabel,
      compoundDesc,
      compoundConfidence,
      evidence,
      1
    );
  }
  
  /**
   * 综合舌质舌苔判断
   */
  private synthesize(
    bodyNode: InferenceNode,
    coatingNode: InferenceNode,
    textureNode: InferenceNode,
    compoundNode: InferenceNode
  ): InferenceNode {
    const bodyConfidence = bodyNode.conclusion.confidence;
    const coatingConfidence = coatingNode.conclusion.confidence;
    const textureConfidence = textureNode.conclusion.confidence;
    const compoundConfidence = compoundNode.conclusion.confidence;
    
    // 综合置信度计算
    // 优先使用组合规则的置信度，如果没有组合规则则使用平均
    let overallConfidence: number;
    if (compoundConfidence > 0.6) {
      // 有匹配的组合规则，组合规则权重更高
      overallConfidence = compoundConfidence * 0.5 + (bodyConfidence + coatingConfidence) / 2 * 0.5;
    } else {
      overallConfidence = (bodyConfidence + coatingConfidence + textureConfidence) / 3;
    }
    
    // 综合结论
    let summaryLabel = '';
    let summaryDesc = '';
    const allEvidence = [
      ...bodyNode.conclusion.evidence,
      ...coatingNode.conclusion.evidence,
      ...textureNode.conclusion.evidence,
      ...compoundNode.conclusion.evidence,
    ];
    
    // 气血+脾胃综合判断
    const bodyLabel = bodyNode.conclusion.label;
    const coatingLabel = coatingNode.conclusion.label;
    const textureLabel = textureNode.conclusion.label;
    
    // 判断气血
    let qiBloodLabel = '';
    if (bodyLabel.includes('气血不足') || bodyLabel.includes('气血两虚')) {
      qiBloodLabel = '气血不足';
    } else if (bodyLabel.includes('热') || coatingLabel.includes('热')) {
      qiBloodLabel = '气分/血分有热';
    } else if (bodyLabel.includes('血瘀') || bodyLabel.includes('瘀')) {
      qiBloodLabel = '血行不畅';
    } else if (bodyLabel.includes('调和') || bodyLabel.includes('平和')) {
      qiBloodLabel = '气血调和';
    }
    
    // 判断脾胃
    let spleenLabel = '';
    if (coatingLabel.includes('湿') || textureLabel.includes('湿')) {
      spleenLabel = '湿浊内蕴';
    } else if (coatingLabel.includes('阴虚') || coatingLabel.includes('胃阴')) {
      spleenLabel = '胃阴不足';
    } else if (coatingLabel.includes('寒') || coatingLabel.includes('虚寒')) {
      spleenLabel = '脾胃虚寒';
    } else if (coatingLabel.includes('胃气充和')) {
      spleenLabel = '胃气充和';
    }
    
    // 生成综合结论
    if (qiBloodLabel && spleenLabel) {
      summaryLabel = `${qiBloodLabel}，${spleenLabel}`;
      summaryDesc = `气血方面：${qiBloodLabel}；脾胃方面：${spleenLabel}`;
    } else if (qiBloodLabel) {
      summaryLabel = qiBloodLabel;
      summaryDesc = bodyNode.conclusion.description;
    } else if (spleenLabel) {
      summaryLabel = spleenLabel;
      summaryDesc = coatingNode.conclusion.description;
    } else {
      summaryLabel = compoundNode.conclusion.label;
      summaryDesc = compoundNode.conclusion.description;
    }
    
    // 如果有组合结论且置信度高，优先使用
    if (compoundNode.conclusion.confidence > 0.7 && compoundNode.conclusion.label) {
      summaryLabel = compoundNode.conclusion.label;
      summaryDesc = compoundNode.conclusion.description;
      overallConfidence = Math.min(1, overallConfidence + 0.1);
    }
    
    const synthesisNode = createPatternNode(
      this.generateNodeId('synthesis'),
      summaryLabel,
      summaryDesc,
      overallConfidence,
      [...new Set(allEvidence)],
      1
    );
    
    synthesisNode.causes.push(bodyNode.id, coatingNode.id, textureNode.id, compoundNode.id);
    
    return synthesisNode;
  }
  
  /**
   * 提取推理链
   */
  private extractReasoningChain(nodes: InferenceNode[]): string[] {
    const chain: string[] = [];
    
    for (const node of nodes) {
      if (node.conclusion.label) {
        chain.push(`${node.name}: ${node.conclusion.label} (置信度: ${(node.conclusion.confidence * 100).toFixed(0)}%)`);
      }
    }
    
    return chain;
  }
  
  /**
   * 生成验证问题
   */
  private generateValidationQuestions(nodes: InferenceNode[]): string[] {
    const questions: string[] = [];
    
    for (const node of nodes) {
      if (node.conclusion.confidence < 0.8) {
        // 根据结论生成验证问题
        if (node.conclusion.label.includes('气血')) {
          questions.push('是否有容易疲劳、气短懒言的症状？');
        }
        if (node.conclusion.label.includes('湿')) {
          questions.push('是否有大便溏稀、身体困重的症状？');
        }
        if (node.conclusion.label.includes('热')) {
          questions.push('是否有口干口苦、怕热喜冷的症状？');
        }
        if (node.conclusion.label.includes('阴虚')) {
          questions.push('是否有口干、手脚心热、盗汗的症状？');
        }
        if (node.conclusion.label.includes('血瘀')) {
          questions.push('是否有固定部位疼痛或刺痛的症状？');
        }
      }
    }
    
    return [...new Set(questions)];
  }
  
  /**
   * 创建空输出
   */
  private createEmptyOutput(): LayerOutput {
    return {
      layer: 1,
      nodes: [],
      summary: {
        label: '',
        description: '舌象分析数据不足',
        confidence: 0,
      },
      validationQuestions: [],
    };
  }
}
