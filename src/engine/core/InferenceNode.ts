/**
 * 推理节点定义 v2.0
 * 定义推理节点的类型、接口和工厂函数
 */

import type { 
  InferenceNode, 
  InferenceNodeType, 
  InferenceLayer,
  InferenceConclusion,
  CorrectionRule,
  InferenceInput 
} from '@/types/inference';

/**
 * 创建基础推理节点
 */
export function createInferenceNode(
  id: string,
  name: string,
  layer: InferenceLayer,
  type: InferenceNodeType
): InferenceNode {
  return {
    id,
    name,
    layer,
    type,
    inputs: [],
    conclusion: {
      label: '',
      description: '',
      confidence: 0,
      evidence: [],
      priority: 'medium',
    },
    causes: [],
    effects: [],
    corrections: [],
    createdAt: new Date().toISOString(),
  };
}

/**
 * 创建舌象特征节点
 */
export function createTongueFeatureNode(
  id: string,
  featureName: string,
  featureValue: string,
  layer: InferenceLayer
): InferenceNode {
  const node = createInferenceNode(id, featureName, layer, 'tongue_feature');
  node.conclusion = {
    label: featureValue,
    description: `舌象特征：${featureName} = ${featureValue}`,
    confidence: 1.0,
    evidence: [`从舌象分析结果中提取：${featureName}`],
    priority: 'medium',
  };
  return node;
}

/**
 * 创建证型节点
 */
export function createPatternNode(
  id: string,
  patternName: string,
  description: string,
  confidence: number,
  evidence: string[],
  layer: InferenceLayer
): InferenceNode {
  const node = createInferenceNode(id, patternName, layer, 'pattern');
  node.conclusion = {
    label: patternName,
    description,
    confidence,
    evidence,
    priority: confidence > 0.7 ? 'high' : confidence > 0.4 ? 'medium' : 'low',
  };
  return node;
}

/**
 * 创建脏腑节点
 */
export function createOrganNode(
  id: string,
  organName: string,
  pattern: string,
  nature: string,
  confidence: number,
  layer: InferenceLayer
): InferenceNode {
  const node = createInferenceNode(id, `${organName}-${pattern}`, layer, 'organ');
  node.conclusion = {
    label: pattern,
    description: `${organName}：${nature}（${pattern}）`,
    confidence,
    evidence: [`脏腑定位：${organName}`],
    priority: 'medium',
  };
  node.metadata = {
    organLocation: [organName],
    pathogenicNature: nature,
  };
  return node;
}

/**
 * 创建传变节点
 */
export function createTransmissionNode(
  id: string,
  transmissionType: string,
  sourceOrgan: string,
  targetOrgan: string,
  mechanism: string,
  confidence: number,
  layer: InferenceLayer
): InferenceNode {
  const node = createInferenceNode(id, `${sourceOrgan}→${targetOrgan}`, layer, 'transmission');
  node.conclusion = {
    label: transmissionType,
    description: `${sourceOrgan}→${targetOrgan}：${mechanism}`,
    confidence,
    evidence: [`传变类型：${transmissionType}`],
    priority: 'medium',
  };
  return node;
}

/**
 * 创建配穴节点
 */
export function createPrescriptionNode(
  id: string,
  mainPoints: string[],
  technique: string,
  confidence: number,
  layer: InferenceLayer
): InferenceNode {
  const node = createInferenceNode(id, '配穴方案', layer, 'prescription');
  node.conclusion = {
    label: mainPoints.join('、'),
    description: `主穴：${mainPoints.join('、')}，针法：${technique}`,
    confidence,
    evidence: [`配穴方案，共${mainPoints.length}个主穴`],
    priority: 'high',
  };
  return node;
}

/**
 * 为节点添加输入
 */
export function addInputToNode(
  node: InferenceNode,
  sourceType: InferenceInput['sourceType'],
  sourceId: string,
  value: string | number | boolean | object,
  weight: number
): InferenceNode {
  const input: InferenceInput = {
    sourceType,
    sourceId,
    value,
    weight,
  };
  node.inputs.push(input);
  return node;
}

/**
 * 为节点添加前置依赖
 */
export function addCauseToNode(node: InferenceNode, causeId: string): InferenceNode {
  if (!node.causes.includes(causeId)) {
    node.causes.push(causeId);
  }
  return node;
}

/**
 * 为节点添加后续影响
 */
export function addEffectToNode(node: InferenceNode, effectId: string): InferenceNode {
  if (!node.effects.includes(effectId)) {
    node.effects.push(effectId);
  }
  return node;
}

/**
 * 为节点添加修正规则
 */
export function addCorrectionToNode(node: InferenceNode, rule: CorrectionRule): InferenceNode {
  node.corrections.push(rule);
  return node;
}

/**
 * 更新节点结论
 */
export function updateNodeConclusion(
  node: InferenceNode,
  conclusion: Partial<InferenceConclusion>
): InferenceNode {
  node.conclusion = {
    ...node.conclusion,
    ...conclusion,
  };
  return node;
}

/**
 * 计算节点的加权置信度（基于输入权重）
 */
export function calculateWeightedConfidence(node: InferenceNode): number {
  if (node.inputs.length === 0) {
    return node.conclusion.confidence;
  }
  
  const totalWeight = node.inputs.reduce((sum, input) => sum + input.weight, 0);
  if (totalWeight === 0) {
    return node.conclusion.confidence;
  }
  
  // 加权平均置信度
  const weightedSum = node.inputs.reduce((sum, input) => {
    const inputConfidence = typeof input.value === 'number' ? input.value : 
                           typeof input.value === 'boolean' ? (input.value ? 1 : 0) : 0.5;
    return sum + inputConfidence * input.weight;
  }, 0);
  
  return Math.min(1, weightedSum / totalWeight);
}
