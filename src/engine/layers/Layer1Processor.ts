/**
 * Layer1 处理器：舌质舌苔层 v2.0
 * 职责：舌质+舌苔 → 气血与脾胃整体判断
 * 
 * 第一层推理：
 * - 舌质=脏腑气血底子
 * - 舌苔=脾胃运化状态
 */

import type { LayerInput, LayerOutput, InferenceNode } from '@/types/inference';
import type { TongueAnalysisResult } from '@/types/tongue';
import { BaseLayerProcessor } from '../core/LayerProcessor';
import { createTongueFeatureNode, createPatternNode } from '../core/InferenceNode';

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
    
    // 3. 综合判断节点
    const synthesisNode = this.synthesize(bodyColorNode, coatingNode);
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
   * 分析舌质
   */
  private analyzeTongueBody(analysis: TongueAnalysisResult): InferenceNode {
    const { bodyColor, shape, hasTeethMark, hasCrack, state } = analysis;
    
    // 舌质特征节点
    const featureNode = createTongueFeatureNode(
      this.generateNodeId('body'),
      '舌质',
      bodyColor,
      1
    );
    
    // 舌质辨证
    let patternLabel = '';
    let patternDesc = '';
    let confidence = 0.5;
    
    switch (bodyColor) {
      case '淡红':
        patternLabel = '气血调和';
        patternDesc = '舌质淡红为正常舌象，气血调和，阴阳平衡';
        confidence = 0.9;
        break;
      case '淡白':
        patternLabel = '气血不足/阳虚';
        patternDesc = '舌质淡白主气血不足或阳虚，血失温煦';
        confidence = 0.75;
        break;
      case '红':
        patternLabel = '热证';
        patternDesc = '舌质红主热证，里热炽盛或阴虚火旺';
        confidence = 0.7;
        break;
      case '绛':
        patternLabel = '热入营血';
        patternDesc = '舌质绛主热入营血，阴虚火旺';
        confidence = 0.8;
        break;
      case '紫':
      case '青紫':
      case '淡紫':
        patternLabel = '血瘀证';
        patternDesc = '舌质紫主血瘀，气血运行不畅';
        confidence = 0.75;
        break;
      case '暗红':
        patternLabel = '瘀血/阴虚';
        patternDesc = '舌质暗红主瘀血或阴虚';
        confidence = 0.7;
        break;
    }
    
    const patternNode = createPatternNode(
      this.generateNodeId('pattern-body'),
      patternLabel,
      patternDesc,
      confidence,
      [`舌色：${bodyColor}`, `舌形：${shape}`, `齿痕：${hasTeethMark ? '有' : '无'}`],
      1
    );
    
    featureNode.effects.push(patternNode.id);
    patternNode.causes.push(featureNode.id);
    
    return patternNode;
  }
  
  /**
   * 分析舌苔
   */
  private analyzeCoating(analysis: TongueAnalysisResult): InferenceNode {
    const { coatingColor, coatingTexture } = analysis;
    
    // 苔色辨证
    let coatingPattern = '';
    let coatingDesc = '';
    let coatingConfidence = 0.5;
    
    switch (coatingColor) {
      case '薄白':
        coatingPattern = '胃气充和';
        coatingDesc = '苔薄白为正常，胃气充和';
        coatingConfidence = 0.9;
        break;
      case '白厚':
        coatingPattern = '寒湿/痰湿';
        coatingDesc = '苔白厚主寒湿内蕴或痰湿困脾';
        coatingConfidence = 0.75;
        break;
      case '黄':
        coatingPattern = '热证';
        coatingDesc = '苔黄主热证，热邪内蕴';
        coatingConfidence = 0.7;
        break;
      case '灰黑':
        coatingPattern = '阴寒/热极';
        coatingDesc = '苔灰黑主阴寒内盛或热极伤阴';
        coatingConfidence = 0.8;
        break;
      case '剥落':
      case '少苔':
      case '无苔':
        coatingPattern = '胃阴亏虚';
        coatingDesc = '苔少或剥落主胃阴亏虚';
        coatingConfidence = 0.75;
        break;
    }
    
    // 结合苔质
    if (coatingTexture === '腻' || coatingTexture === '厚') {
      coatingPattern += '（苔腻/厚）';
      coatingDesc += '，苔质厚腻提示湿浊内蕴';
    } else if (coatingTexture === '燥') {
      coatingPattern += '（苔燥）';
      coatingDesc += '，苔质干燥提示津液耗伤';
    }
    
    return createPatternNode(
      this.generateNodeId('pattern-coating'),
      coatingPattern,
      coatingDesc,
      coatingConfidence,
      [`苔色：${coatingColor}`, `苔质：${coatingTexture}`],
      1
    );
  }
  
  /**
   * 综合舌质舌苔判断
   */
  private synthesize(bodyNode: InferenceNode, coatingNode: InferenceNode): InferenceNode {
    const bodyConfidence = bodyNode.conclusion.confidence;
    const coatingConfidence = coatingNode.conclusion.confidence;
    const overallConfidence = (bodyConfidence + coatingConfidence) / 2;
    
    // 综合结论
    let summaryLabel = '';
    let summaryDesc = '';
    
    // 气血+脾胃综合判断
    if (bodyNode.conclusion.label.includes('气血不足') && 
        coatingNode.conclusion.label.includes('湿')) {
      summaryLabel = '气血两虚，湿浊内蕴';
      summaryDesc = '气血不足为本，湿浊内蕴为标';
    } else if (bodyNode.conclusion.label.includes('热证')) {
      summaryLabel = '热证';
      summaryDesc = `舌质${bodyNode.conclusion.label}，舌苔${coatingNode.conclusion.label}`;
    } else if (bodyNode.conclusion.label.includes('气血调和')) {
      summaryLabel = '平和质倾向';
      summaryDesc = '舌质舌苔基本正常';
    } else {
      summaryLabel = `${bodyNode.conclusion.label}，${coatingNode.conclusion.label}`;
      summaryDesc = bodyNode.conclusion.description + '；' + coatingNode.conclusion.description;
    }
    
    const synthesisNode = createPatternNode(
      this.generateNodeId('synthesis'),
      summaryLabel,
      summaryDesc,
      overallConfidence,
      [...bodyNode.conclusion.evidence, ...coatingNode.conclusion.evidence],
      1
    );
    
    synthesisNode.causes.push(bodyNode.id, coatingNode.id);
    
    return synthesisNode;
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
