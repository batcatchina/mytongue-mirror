/**
 * 推理引擎导出 v2.0
 * 统一导出所有引擎相关模块
 * 
 * Phase 1.2 修复：
 * - 移除有问题的内联 new 调用（isolatedModules: true 要求显式 import）
 * - engine/index.ts 只做类型和类重导出，执行逻辑在各模块内部
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

// 使用示例：
// import { InferenceChain, Layer1Processor, Layer2Processor, Layer3Processor, Layer4Processor } from '@/engine';
// const chain = new InferenceChain();
// const result = await chain.execute(tongueAnalysis, { age: 40 });
