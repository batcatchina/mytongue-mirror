/**
 * Layer2 处理器：舌形反直觉层 v2.0
 * 职责：舌形 → 虚实本质（反直觉层）
 * 
 * 核心原则：胖大≠实，瘦小红≠单纯虚
 * 要看到表象下的本质
 */

import type { LayerInput, LayerOutput, InferenceNode } from '@/types/inference';
import type { TongueAnalysisResult } from '@/types/tongue';
import { BaseLayerProcessor } from '../core/LayerProcessor';
import { createPatternNode } from '../core/InferenceNode';

/**
 * 反直觉规则映射
 * 表面特征 -> 真实本质
 */
const COUNTERINTUITIVE_RULES: Record<string, {
  surface: string;
  essence: string;
  mechanism: string;
  baseConfidence: number;
}> = {
  '胖大-气虚': {
    surface: '胖大',
    essence: '气虚（本虚）',
    mechanism: '气虚→水湿运化失常→湿泛于舌→胖大',
    baseConfidence: 0.75,
  },
  '胖大-齿痕-气虚湿盛': {
    surface: '胖大+齿痕',
    essence: '气虚+湿盛',
    mechanism: '气虚为本，湿盛为标',
    baseConfidence: 0.8,
  },
  '瘦薄-阴虚': {
    surface: '瘦薄',
    essence: '阴虚（津液耗损）',
    mechanism: '阴虚→组织失养→舌体收缩',
    baseConfidence: 0.75,
  },
  '瘦薄-红-阴虚火旺': {
    surface: '瘦薄+红',
    essence: '阴虚火旺',
    mechanism: '阴虚→虚火灼津→舌红少津',
    baseConfidence: 0.8,
  },
  '裂纹-阴虚': {
    surface: '裂纹',
    essence: '阴虚/血虚/精亏',
    mechanism: '裂纹位置对应脏腑+阴血精亏程度',
    baseConfidence: 0.7,
  },
  '齿痕-脾虚湿盛': {
    surface: '齿痕',
    essence: '脾虚湿盛',
    mechanism: '脾虚→运化失司→湿泛于舌→齿痕',
    baseConfidence: 0.75,
  },
};

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
    const previousLayerOutput = input.previousLayerOutput;
    
    if (!tongueAnalysis) {
      return this.createEmptyOutput();
    }
    
    const nodes: InferenceNode[] = [];
    const { shape, bodyColor, hasTeethMark, hasCrack, teethMarkDegree, crackDegree } = tongueAnalysis;
    
    // 1. 分析舌形本质
    const shapeAnalysis = this.analyzeShapeEssence(tongueAnalysis);
    nodes.push(shapeAnalysis);
    
    // 2. 分析齿痕本质
    if (hasTeethMark) {
      const teethMarkAnalysis = this.analyzeTeethMark(tongueAnalysis);
      nodes.push(teethMarkAnalysis);
    }
    
    // 3. 分析裂纹本质
    if (hasCrack) {
      const crackAnalysis = this.analyzeCrack(tongueAnalysis);
      nodes.push(crackAnalysis);
    }
    
    // 4. 综合虚实判断
    const essenceSynthesis = this.synthesizeEssence(shapeAnalysis, nodes);
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
   * 分析舌形本质
   */
  private analyzeShapeEssence(analysis: TongueAnalysisResult): InferenceNode {
    const { shape, bodyColor } = analysis;
    
    let essenceLabel = '';
    let essenceDesc = '';
    let confidence = 0.5;
    const evidence: string[] = [];
    
    switch (shape) {
      case '胖大':
        // 反直觉：胖大 ≠ 实，而是气虚
        if (bodyColor === '淡白') {
          essenceLabel = '气虚（阳虚倾向）';
          essenceDesc = '舌体胖大为气虚或阳虚，水湿运化失常所致';
          confidence = 0.8;
        } else if (bodyColor === '淡红') {
          essenceLabel = '气虚湿盛';
          essenceDesc = '舌体胖大为气虚，水湿运化无力';
          confidence = 0.75;
        } else {
          essenceLabel = '气虚';
          essenceDesc = '舌体胖大为气虚表现';
          confidence = 0.7;
        }
        evidence.push('反直觉判断：胖大≠实，而是气虚');
        break;
        
      case '瘦薄':
        // 反直觉：瘦薄 ≠ 单纯虚
        if (bodyColor === '红' || bodyColor === '绛') {
          essenceLabel = '阴虚火旺';
          essenceDesc = '舌体瘦薄为阴虚，舌红为火旺，阴虚火旺';
          confidence = 0.8;
        } else if (bodyColor === '淡白') {
          essenceLabel = '气血两虚';
          essenceDesc = '舌体瘦薄为阴血亏虚，舌淡为气血不足';
          confidence = 0.75;
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
        confidence = 0.85;
        evidence.push('短缩舌为危急表现，需高度重视');
        break;
        
      case '松弛':
        essenceLabel = '气虚（松弛）';
        essenceDesc = '舌体松弛为气虚表现';
        confidence = 0.7;
        break;
    }
    
    evidence.push(`舌形：${shape}`);
    
    return createPatternNode(
      this.generateNodeId('shape-essence'),
      essenceLabel,
      essenceDesc,
      confidence,
      evidence,
      2
    );
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
    
    // 结合胖大舌判断
    if (shape === '胖大') {
      label = '气虚湿盛（本虚标实）';
      desc = '胖大+齿痕=气虚为本，湿盛为标';
      confidence = 0.85;
    }
    
    // 结合舌色调整置信度
    if (bodyColor === '淡白') {
      confidence = Math.min(1, confidence + 0.1);
    }
    
    return createPatternNode(
      this.generateNodeId('teeth-mark'),
      label,
      desc,
      confidence,
      ['齿痕程度：' + (teethMarkDegree || '中等')],
      2
    );
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
    
    let label = '阴虚/血虚';
    let desc = '舌面有裂纹提示阴虚、血虚或精亏';
    let confidence = 0.7;
    
    // 结合舌色精确判断
    if (bodyColor === '红' || bodyColor === '绛') {
      label = '阴虚火旺';
      desc = '舌红+裂纹=阴虚火旺，津液耗伤';
      confidence = 0.8;
    } else if (bodyColor === '淡白') {
      label = '血虚';
      desc = '舌淡+裂纹=血虚，组织失养';
      confidence = 0.75;
    }
    
    const evidence = ['裂纹程度：' + (crackDegree || '中等')];
    if (crackDistribution && crackDistribution.length > 0) {
      evidence.push('裂纹分布：' + crackDistribution.join('、'));
    }
    
    return createPatternNode(
      this.generateNodeId('crack'),
      label,
      desc,
      confidence,
      evidence,
      2
    );
  }
  
  /**
   * 综合虚实本质判断
   */
  private synthesizeEssence(
    shapeNode: InferenceNode,
    allNodes: InferenceNode[]
  ): InferenceNode {
    // 收集所有本质判断
    const essenceLabels = allNodes
      .filter(n => n.type === 'pattern' && n.conclusion.label !== '无齿痕' && n.conclusion.label !== '无裂纹')
      .map(n => n.conclusion.label);
    
    // 判断虚实倾向
    const isDeficiency = essenceLabels.some(l => 
      l.includes('虚') || l.includes('阴虚') || l.includes('气虚') || l.includes('血虚')
    );
    const isExcess = essenceLabels.some(l => 
      l.includes('实') || l.includes('湿盛') || l.includes('火旺')
    );
    
    let essenceSummary = '';
    let essenceDesc = '';
    let confidence = 0.5;
    
    if (isDeficiency && isExcess) {
      essenceSummary = '虚实夹杂';
      essenceDesc = '本虚标实，以虚为本';
      confidence = 0.75;
    } else if (isDeficiency) {
      essenceSummary = '本虚';
      essenceDesc = essenceLabels.join('，');
      confidence = 0.8;
    } else if (isExcess) {
      essenceSummary = '标实';
      essenceDesc = essenceLabels.join('，');
      confidence = 0.7;
    } else {
      essenceSummary = '虚实平衡';
      essenceDesc = '舌形特征未显示明显虚实偏颇';
      confidence = 0.6;
    }
    
    const synthesisNode = createPatternNode(
      this.generateNodeId('essence-synthesis'),
      essenceSummary,
      essenceDesc,
      confidence,
      allNodes.flatMap(n => n.conclusion.evidence),
      2
    );
    
    synthesisNode.causes.push(shapeNode.id);
    
    return synthesisNode;
  }
  
  /**
   * 生成验证问题
   */
  private generateValidationQuestions(essenceNode: InferenceNode): string[] {
    const questions: string[] = [];
    
    if (essenceNode.conclusion.label.includes('气虚')) {
      questions.push('平时是否容易疲劳、气短？');
      questions.push('是否容易四肢发沉？');
    }
    
    if (essenceNode.conclusion.label.includes('阴虚')) {
      questions.push('是否有口干、手脚心热？');
      questions.push('睡眠质量如何？');
    }
    
    if (essenceNode.conclusion.label.includes('湿盛')) {
      questions.push('大便是否溏稀？');
      questions.push('身体是否困重？');
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
