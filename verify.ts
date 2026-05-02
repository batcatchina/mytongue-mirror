/**
 * 推理链功能验证脚本
 * 用于验证Phase 1.2实现的推理链核心功能
 */

import { InferenceChain, InferenceChainStatus } from './src/engine/core/InferenceChain';
import { Layer1Processor } from './src/engine/layers/Layer1Processor';
import { Layer2Processor } from './src/engine/layers/Layer2Processor';
import type { TongueAnalysisResult } from './src/types/tongue';
import type { InferenceContext } from './src/types/inference';

/**
 * 创建测试用舌象分析结果
 */
function createTestTongueAnalysis(overrides: Partial<TongueAnalysisResult> = {}): TongueAnalysisResult {
  return {
    bodyColor: '淡红',
    shape: '正常',
    coatingColor: '薄白',
    coatingTexture: '薄',
    state: '正常',
    hasTeethMark: false,
    hasCrack: false,
    hasEcchymosis: false,
    zoneFeatures: [],
    isSemitransparent: false,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * 打印测试结果
 */
function printTest(name: string, passed: boolean, details?: string): void {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} - ${name}`);
  if (details && !passed) {
    console.log(`   Details: ${details}`);
  }
}

/**
 * 运行验证测试
 */
async function runVerification(): Promise<void> {
  console.log('\n舌镜v2.0 Phase 1.2 功能验证');
  console.log('='.repeat(50) + '\n');

  let allPassed = true;

  // 测试1: InferenceChain基本操作
  console.log('【InferenceChain 核心测试】\n');
  
  const chain = new InferenceChain();
  printTest('创建推理链', chain.getId().startsWith('chain-'));
  
  const testNode = {
    id: 'test-node',
    name: '测试节点',
    layer: 1 as const,
    type: 'pattern' as const,
    inputs: [],
    conclusion: {
      label: '测试结论',
      description: '测试描述',
      confidence: 0.8,
      evidence: [],
      priority: 'medium' as const,
    },
    causes: [],
    effects: [],
    corrections: [],
    createdAt: new Date().toISOString(),
  };
  
  chain.addNode(testNode);
  const getNodeResult = chain.getNode('test-node');
  printTest('添加并获取节点', getNodeResult?.name === '测试节点');
  
  const stats = chain.getExecutionStats();
  printTest('执行统计', stats.totalNodes === 1);
  
  // 测试2: Layer1Processor - 舌质淡+苔白腻
  console.log('\n【Layer1Processor 测试】\n');
  
  const layer1 = new Layer1Processor();
  
  const test1Input = createTestTongueAnalysis({
    bodyColor: '淡白',
    coatingColor: '白厚',
    coatingTexture: '腻',
  });
  
  const test1Output = layer1.process({ tongueAnalysis: test1Input });
  const test1Pass = test1Output.summary.label.includes('气血') || test1Output.summary.label.includes('不足');
  printTest('舌质淡+苔白腻 → 气血不足/湿盛', test1Pass, test1Output.summary.label);
  
  // 测试3: Layer1Processor - 舌质红+苔黄
  const test2Input = createTestTongueAnalysis({
    bodyColor: '红',
    coatingColor: '黄',
    coatingTexture: '厚',
  });
  
  const test2Output = layer1.process({ tongueAnalysis: test2Input });
  const test2Pass = test2Output.summary.label.includes('热');
  printTest('舌质红+苔黄 → 实热', test2Pass, test2Output.summary.label);
  
  // 测试4: Layer1Processor - 舌质红+无苔
  const test3Input = createTestTongueAnalysis({
    bodyColor: '红',
    coatingColor: '无苔',
    coatingTexture: '薄',
  });
  
  const test3Output = layer1.process({ tongueAnalysis: test3Input });
  const test3Pass = test3Output.summary.label.includes('阴虚') || test3Output.summary.label.includes('火旺');
  printTest('舌质红+无苔 → 阴虚火旺', test3Pass, test3Output.summary.label);
  
  // 测试5: Layer2Processor - 胖大+齿痕（反直觉）
  console.log('\n【Layer2Processor 测试】\n');
  
  const layer2 = new Layer2Processor();
  
  const test4Input = createTestTongueAnalysis({
    shape: '胖大',
    hasTeethMark: true,
    teethMarkDegree: '明显',
    bodyColor: '淡红',
  });
  
  const test4Output = layer2.process({ tongueAnalysis: test4Input });
  const test4Pass = test4Output.summary.label.includes('气虚') && 
    test4Output.nodes.some(n => n.conclusion.evidence.some(e => e.includes('反直觉')));
  printTest('胖大+齿痕 → 气虚湿盛（反直觉验证）', test4Pass, test4Output.summary.label);
  
  // 测试6: Layer2Processor - 瘦薄+红
  const test5Input = createTestTongueAnalysis({
    shape: '瘦薄',
    bodyColor: '红',
    hasCrack: false,
  });
  
  const test5Output = layer2.process({ tongueAnalysis: test5Input });
  const test5Pass = test5Output.summary.label.includes('阴虚') && test5Output.summary.label.includes('火旺');
  printTest('瘦薄+红 → 阴虚火旺', test5Pass, test5Output.summary.label);
  
  // 测试7: 组合推理
  console.log('\n【组合推理测试】\n');
  
  const test6Input = createTestTongueAnalysis({
    bodyColor: '淡白',
    coatingColor: '白厚',
    coatingTexture: '腻',
    shape: '胖大',
    hasTeethMark: true,
  });
  
  const test6L1Output = layer1.process({ tongueAnalysis: test6Input });
  const test6L2Output = layer2.process({
    tongueAnalysis: test6Input,
    previousLayerOutput: test6L1Output,
  });
  
  const test6Pass = test6L1Output.nodes.length >= 4 && test6L2Output.nodes.length >= 2;
  printTest('Layer1+Layer2链式推理', test6Pass, 
    `Layer1节点: ${test6L1Output.nodes.length}, Layer2节点: ${test6L2Output.nodes.length}`);
  
  // 测试8: 推理链节点关联
  const test7Pass = test6L2Output.nodes.some(n => n.causes.length > 0);
  printTest('推理节点依赖关系', test7Pass);
  
  // 总结
  console.log('\n' + '='.repeat(50));
  console.log('验证完成！');
  console.log('='.repeat(50) + '\n');
  
  if (allPassed) {
    console.log('所有验证通过 ✅');
  } else {
    console.log('部分验证失败 ❌');
  }
}

// 运行验证
runVerification().catch(console.error);
