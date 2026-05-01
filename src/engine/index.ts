/**
 * 推理引擎导出 v2.0
 * 统一导出所有引擎相关模块
 */

// 核心模块
export { InferenceChain, InferenceChainStatus } from './core/InferenceChain';
export * from './core/InferenceNode';
export * from './core/LayerProcessor';
export { TransmissionEngine } from './core/TransmissionEngine';

// 各层处理器
export { Layer1Processor } from './layers/Layer1Processor';
export { Layer2Processor } from './layers/Layer2Processor';
export { Layer3Processor } from './layers/Layer3Processor';
export { Layer4Processor } from './layers/Layer4Processor';

// 规则配置
export * from './rules';

// 类型重新导出
export type { InferenceChainOutput, InferenceNode, LayerInput, LayerOutput } from '@/types/inference';
export type { TongueAnalysisResult } from '@/types/tongue';

/**
 * 创建完整推理链的工厂函数
 */
export function createInferenceEngine() {
  const chain = new InferenceChain();
  const layer1 = new Layer1Processor();
  const layer2 = new Layer2Processor();
  const layer3 = new Layer3Processor();
  const layer4 = new Layer4Processor();
  const transmissionEngine = new TransmissionEngine();
  
  return {
    chain,
    layer1,
    layer2,
    layer3,
    layer4,
    transmissionEngine,
  };
}

/**
 * 执行完整四层推理
 */
export async function executeFullInference(
  tongueAnalysis: TongueAnalysisResult,
  context: any
) {
  const engine = createInferenceEngine();
  
  // Layer 1: 舌质舌苔
  const layer1Output = engine.layer1.process({
    tongueAnalysis,
    context,
  });
  
  // Layer 2: 舌形反直觉
  const layer2Output = engine.layer2.process({
    tongueAnalysis,
    previousLayerOutput: layer1Output,
    context,
  });
  
  // Layer 3: 分区凹凸
  const layer3Output = engine.layer3.process({
    tongueAnalysis,
    previousLayerOutput: layer2Output,
    context,
  });
  
  // Layer 4: 综合推理
  const layer4Output = engine.layer4.process({
    previousLayerOutput: layer3Output,
    context,
  });
  
  // 合并所有节点
  const allNodes = [
    ...layer1Output.nodes,
    ...layer2Output.nodes,
    ...layer3Output.nodes,
    ...layer4Output.nodes,
  ];
  
  for (const node of allNodes) {
    engine.chain.addNode(node);
  }
  
  return {
    chain: engine.chain,
    layer1Output,
    layer2Output,
    layer3Output,
    layer4Output,
    allNodes,
  };
}
