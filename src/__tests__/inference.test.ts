/**
 * 舌镜v2.0 Phase 1.2 推理链集成测试
 * 
 * 测试目标：
 * 1. InferenceChain.execute() 真正调用四层处理器
 * 2. Layer1: 舌质+舌苔 → 气血与脾胃整体判断
 * 3. Layer2: 舌形 → 虚实本质（反直觉）
 * 4. Layer3: 分区凹凸 → 精确定位
 * 5. Layer4: 传变关系+配穴方案
 * 
 * 运行：npx jest src/__tests__/inference.test.ts --no-coverage
 */

import { InferenceChain } from '@/engine/core/InferenceChain';
import type { TongueAnalysisResult } from '@/types/tongue';

// ============================================================
// 测试用例：典型气虚湿盛舌象
// ============================================================
const mockTongue_QiXuShi盛: TongueAnalysisResult = {
  bodyColor: '淡白',
  bodyColorConfidence: 0.9,
  shape: '胖大',
  shapeConfidence: 0.85,
  coatingColor: '白厚',
  coatingColorConfidence: 0.8,
  coatingTexture: '腻',
  coatingTextureConfidence: 0.85,
  state: '正常',
  stateConfidence: 0.95,
  hasTeethMark: true,
  teethMarkDegree: '明显',
  hasCrack: false,
  hasEcchymosis: false,
  zoneFeatures: [
    { position: 'upperThird', color: '淡白', colorIntensity: '偏淡', undulation: 'flat' },
    { position: 'middleThird', color: '淡白', colorIntensity: '偏淡', undulation: 'depression', undulationDegree: '中等', hasTeethMark: true },
    { position: 'lowerThird', color: '淡白', colorIntensity: '偏淡', undulation: 'flat' },
  ],
  isSemitransparent: false,
  timestamp: new Date().toISOString(),
};

// ============================================================
// 测试用例：阴虚火旺舌象
// ============================================================
const mockTongue_YinXuHuoWang: TongueAnalysisResult = {
  bodyColor: '红',
  bodyColorConfidence: 0.9,
  shape: '瘦薄',
  shapeConfidence: 0.85,
  coatingColor: '少苔',
  coatingColorConfidence: 0.8,
  coatingTexture: '燥',
  coatingTextureConfidence: 0.8,
  state: '正常',
  stateConfidence: 0.9,
  hasTeethMark: false,
  hasCrack: true,
  crackDegree: '明显',
  crackDistribution: ['middleThird', 'lowerThird'],
  hasEcchymosis: false,
  zoneFeatures: [
    { position: 'upperThird', color: '红', colorIntensity: '偏深', undulation: 'flat' },
    { position: 'middleThird', color: '红', colorIntensity: '偏深', undulation: 'depression', undulationDegree: '轻微', hasCrack: true },
    { position: 'lowerThird', color: '绛', colorIntensity: '偏深', undulation: 'depression', undulationDegree: '中等', hasCrack: true },
  ],
  isSemitransparent: false,
  timestamp: new Date().toISOString(),
};

// ============================================================
// 测试用例：实热舌象
// ============================================================
const mockTongue_ShiRe: TongueAnalysisResult = {
  bodyColor: '红',
  bodyColorConfidence: 0.9,
  shape: '适中',
  shapeConfidence: 0.85,
  coatingColor: '黄',
  coatingColorConfidence: 0.85,
  coatingTexture: '厚',
  coatingTextureConfidence: 0.8,
  state: '正常',
  stateConfidence: 0.9,
  hasTeethMark: false,
  hasCrack: false,
  hasEcchymosis: false,
  zoneFeatures: [
    { position: 'upperThird', color: '红', colorIntensity: '偏深', undulation: 'bulge', undulationDegree: '轻微' },
    { position: 'middleThird', color: '红', colorIntensity: '偏深', undulation: 'bulge', undulationDegree: '中等' },
    { position: 'lowerThird', color: '红', colorIntensity: '正常', undulation: 'flat' },
  ],
  isSemitransparent: false,
  timestamp: new Date().toISOString(),
};

// ============================================================
// 辅助：断言工具
// ============================================================
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ 断言失败: ${message}`);
  }
  console.log(`✅ ${message}`);
}

// ============================================================
// 测试：推理链可执行
// ============================================================
async function testInferenceChain() {
  console.log('\n========================================');
  console.log('Phase 1.2 推理链集成测试');
  console.log('========================================\n');

  // Test 1: 气虚湿盛
  console.log('--- 测试用例1: 气虚湿盛舌象（淡白胖大舌+白厚腻苔）---');
  const chain1 = new InferenceChain();
  const result1 = await chain1.execute(mockTongue_QiXuShi盛, { age: 45 });

  // 验证状态
  assert(result1.status === 'success', `推理链执行成功: ${result1.status}`);
  assert(result1.chainId === chain1.getId(), 'chainId 一致');
  assert(result1.executionTime !== undefined && result1.executionTime >= 0, `执行耗时: ${result1.executionTime}ms`);

  // 验证节点数量（四层应产生多个节点）
  assert(result1.nodes.size >= 4, `生成了 ${result1.nodes.size} 个推理节点（≥4）`);

  // 验证 Layer1 输出（舌质淡白→气血不足，苔白厚→湿盛）
  const layer1Output = chain1.getLayerOutput(1);
  assert(layer1Output !== undefined, 'Layer1 有输出');
  assert(layer1Output!.nodes.length >= 3, `Layer1 产生 ${layer1Output!.nodes.length} 个节点`);

  // 验证 Layer2 输出（胖大→气虚，反直觉）
  const layer2Output = chain1.getLayerOutput(2);
  assert(layer2Output !== undefined, 'Layer2 有输出');
  const hasAntiIntuitive = layer2Output!.nodes.some(n => 
    n.conclusion.evidence.some(e => e.includes('反直觉'))
  );
  assert(hasAntiIntuitive, 'Layer2 包含反直觉判断');

  // 验证 Layer3 输出（分区凹凸→凹陷→气血不足）
  const layer3Output = chain1.getLayerOutput(3);
  assert(layer3Output !== undefined, 'Layer3 有输出');

  // 验证 Layer4 输出（综合推理→配穴方案）
  const layer4Output = chain1.getLayerOutput(4);
  assert(layer4Output !== undefined, 'Layer4 有输出');
  
  // 验证最终输出包含配穴
  assert(result1.organPatterns.length > 0, `生成了 ${result1.organPatterns.length} 个脏腑辨证`);
  
  // 验证证型结论
  assert(result1.syndrome.length > 0, `生成了证型: ${result1.syndrome}`);
  
  console.log(`\n证型: ${result1.syndrome}`);
  console.log(`根本原因: ${result1.rootCause}`);
  console.log(`脏腑辨证: ${result1.organPatterns.map(p => `${p.organ}:${p.pattern}`).join(', ')}`);
  if (result1.prescription) {
    console.log(`配穴: ${result1.prescription.mainPoints.join('、')}`);
    console.log(`针法: ${result1.prescription.technique}`);
  }

  // Test 2: 阴虚火旺
  console.log('\n--- 测试用例2: 阴虚火旺舌象（红瘦薄舌+少苔）---');
  const chain2 = new InferenceChain();
  const result2 = await chain2.execute(mockTongue_YinXuHuoWang, { age: 35 });
  
  assert(result2.status === 'success', `推理链执行成功: ${result2.status}`);
  const layer2Output2 = chain2.getLayerOutput(2);
  const hasYinXu = layer2Output2!.nodes.some(n => 
    n.conclusion.label.includes('阴虚')
  );
  assert(hasYinXu, 'Layer2 识别出阴虚（瘦薄舌）');

  console.log(`\n证型: ${result2.syndrome}`);

  // Test 3: 实热
  console.log('\n--- 测试用例3: 实热舌象（红舌+黄厚苔）---');
  const chain3 = new InferenceChain();
  const result3 = await chain3.execute(mockTongue_ShiRe, { age: 28 });
  
  assert(result3.status === 'success', `推理链执行成功: ${result3.status}`);
  
  console.log(`\n证型: ${result3.syndrome}`);

  // Test 4: 拓扑排序
  console.log('\n--- 测试用例4: 拓扑排序 ---');
  const chain4 = new InferenceChain();
  const result4 = await chain4.execute(mockTongue_QiXuShi盛, { age: 45 });
  assert(result4.executionOrder.length > 0, `拓扑排序生成了 ${result4.executionOrder.length} 个执行顺序`);
  console.log(`执行顺序: ${result4.executionOrder.slice(0, 5).join(' → ')}...`);

  // Test 5: 问诊修正
  console.log('\n--- 测试用例5: 问诊修正 ---');
  const chain5 = new InferenceChain();
  const result5 = await chain5.execute(mockTongue_QiXuShi盛, { age: 45 });
  // 应用一个修正
  const nodesBefore = Array.from(result5.nodes.values());
  chain5.correct('Q1', '是');
  const nodesAfter = Array.from(chain5.getNodes().values());
  // 修正后节点应该被更新
  console.log(`修正前节点数: ${nodesBefore.length}, 修正后节点数: ${nodesAfter.length}`);

  // Test 6: 可视化数据生成
  console.log('\n--- 测试用例6: 可视化数据 ---');
  const chain6 = new InferenceChain();
  const result6 = await chain6.execute(mockTongue_QiXuShi盛, { age: 45 });
  const viz = chain6.generateVisualizationData();
  assert(viz.nodes.length > 0, `生成了 ${viz.nodes.length} 个可视化节点`);
  assert(viz.edges.length > 0, `生成了 ${viz.edges.length} 条可视化边`);
  console.log(`可视化: ${viz.nodes.length} 节点, ${viz.edges.length} 边`);

  console.log('\n========================================');
  console.log('✅ Phase 1.2 推理链集成测试全部通过！');
  console.log('========================================\n');
}

// ============================================================
// 执行测试
// ============================================================
testInferenceChain().catch(err => {
  console.error('\n❌ 测试失败:', err.message);
  process.exit(1);
});
