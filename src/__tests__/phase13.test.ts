/**
 * 舌镜v2.0 Phase 1.3 集成测试
 * 
 * 测试目标：
 * 1. Layer3 分区凹凸 → 精确定位（"神"之层）
 * 2. Layer4 综合推理 → 传变关系+配穴方案
 * 3. 四层推理链完整执行
 * 4. 传变路径正确
 * 5. 配穴有逻辑
 * 
 * 运行：cd mytongue-mirror && npx ts-node src/__tests__/phase13.test.ts
 */

import { InferenceChain } from '../engine/core/InferenceChain';
import type { TongueAnalysisResult } from '../types/tongue';

// ============================================================
// 测试用例1: 气虚湿盛舌象
// 特征：舌淡+胖大+齿痕+中焦凹陷 → 脾虚湿盛 → 肝郁克脾传变
// ============================================================
const mockTongue_QiXuShiSheng: TongueAnalysisResult = {
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
// 测试用例2: 阴虚火旺舌象
// 特征：舌红+瘦薄+舌尖红 → 心肾不交 → 子盗母气传变
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
    { position: 'upperThird', color: '红', colorIntensity: '偏深', undulation: 'bulge', undulationDegree: '轻微' },
    { position: 'middleThird', color: '红', colorIntensity: '偏深', undulation: 'depression', undulationDegree: '轻微', hasCrack: true },
    { position: 'lowerThird', color: '绛', colorIntensity: '偏深', undulation: 'depression', undulationDegree: '中等', hasCrack: true },
  ],
  isSemitransparent: false,
  timestamp: new Date().toISOString(),
};

// ============================================================
// 测试用例3: 实热舌象
// 特征：舌红+苔黄+舌中凸起 → 脾胃实热 → 配穴方案
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
    { position: 'upperThird', color: '红', colorIntensity: '偏深', undulation: 'flat' },
    { position: 'middleThird', color: '红', colorIntensity: '偏深', undulation: 'bulge', undulationDegree: '中等' },
    { position: 'lowerThird', color: '红', colorIntensity: '正常', undulation: 'flat' },
  ],
  isSemitransparent: false,
  timestamp: new Date().toISOString(),
};

// ============================================================
// 测试用例4: 肝郁化火舌象
// 特征：舌边色深+中焦凸起 → 肝郁化火 → 相克传变
// ============================================================
const mockTongue_GanYuHuaHuo: TongueAnalysisResult = {
  bodyColor: '红',
  bodyColorConfidence: 0.85,
  shape: '适中',
  shapeConfidence: 0.8,
  coatingColor: '黄',
  coatingColorConfidence: 0.75,
  coatingTexture: '薄',
  coatingTextureConfidence: 0.7,
  state: '正常',
  stateConfidence: 0.9,
  hasTeethMark: false,
  hasCrack: false,
  hasEcchymosis: false,
  zoneFeatures: [
    { position: 'upperThird', color: '淡红', colorIntensity: '正常', undulation: 'flat' },
    { position: 'middleThird', color: '红', colorIntensity: '偏深', undulation: 'bulge', undulationDegree: '明显', side: 'left' },
    { position: 'lowerThird', color: '淡红', colorIntensity: '正常', undulation: 'flat' },
  ],
  isSemitransparent: false,
  timestamp: new Date().toISOString(),
};

// ============================================================
// 辅助函数
// ============================================================
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ 断言失败: ${message}`);
  }
  console.log(`✅ ${message}`);
}

// ============================================================
// 测试：Layer3 分区凹凸层
// ============================================================
async function testLayer3() {
  console.log('\n========================================');
  console.log('Phase 1.3 Layer3 分区凹凸层测试');
  console.log('========================================\n');

  // Test 1: 气虚湿盛 - 舌中凹陷
  console.log('--- 测试1: 气虚湿盛舌象（舌中凹陷=脾胃虚弱）---');
  const chain1 = new InferenceChain();
  await chain1.execute(mockTongue_QiXuShiSheng, { age: 45 });

  const layer3Output1 = chain1.getLayerOutput(3);
  assert(layer3Output1 !== undefined, 'Layer3 有输出');
  assert(layer3Output1!.nodes.length >= 2, `Layer3 产生 ${layer3Output1!.nodes.length} 个节点`);

  // 验证凹陷辨证
  const hasDepression = layer3Output1!.nodes.some(n =>
    n.conclusion.label.includes('凹陷') ||
    n.conclusion.label.includes('脾胃虚弱') ||
    n.conclusion.label.includes('气血不足')
  );
  assert(hasDepression, 'Layer3 识别出舌中凹陷→脾胃虚弱');

  // Test 2: 阴虚火旺 - 舌根凹陷
  console.log('\n--- 测试2: 阴虚火旺舌象（舌根凹陷=肾精亏虚）---');
  const chain2 = new InferenceChain();
  await chain2.execute(mockTongue_YinXuHuoWang, { age: 35 });

  const layer3Output2 = chain2.getLayerOutput(3);
  assert(layer3Output2 !== undefined, 'Layer3 有输出');

  // 验证凹陷辨证
  const hasLowerDepression = layer3Output2!.nodes.some(n =>
    n.conclusion.label.includes('凹陷') ||
    n.conclusion.label.includes('肾') ||
    n.conclusion.label.includes('下焦')
  );
  assert(hasLowerDepression, 'Layer3 识别出舌根凹陷→肾精亏虚');

  // Test 3: 实热 - 舌中凸起
  console.log('\n--- 测试3: 实热舌象（舌中凸起=脾胃郁热）---');
  const chain3 = new InferenceChain();
  await chain3.execute(mockTongue_ShiRe, { age: 28 });

  const layer3Output3 = chain3.getLayerOutput(3);
  assert(layer3Output3 !== undefined, 'Layer3 有输出');

  // 验证凸起辨证
  const hasBulge = layer3Output3!.nodes.some(n =>
    n.conclusion.label.includes('凸起') ||
    n.conclusion.label.includes('郁热') ||
    n.conclusion.label.includes('脾胃')
  );
  assert(hasBulge, 'Layer3 识别出舌中凸起→脾胃郁热');

  console.log('\n✅ Layer3 分区凹凸层测试通过');
}

// ============================================================
// 测试：Layer4 综合推理层
// ============================================================
async function testLayer4() {
  console.log('\n========================================');
  console.log('Phase 1.3 Layer4 综合推理层测试');
  console.log('========================================\n');

  // Test 1: 气虚湿盛 - 传变+配穴
  console.log('--- 测试1: 气虚湿盛 → 配穴方案 ---');
  const chain1 = new InferenceChain();
  const result1 = await chain1.execute(mockTongue_QiXuShiSheng, { age: 45 });

  const layer4Output1 = chain1.getLayerOutput(4);
  assert(layer4Output1 !== undefined, 'Layer4 有输出');
  assert(layer4Output1!.nodes.length >= 2, `Layer4 产生 ${layer4Output1!.nodes.length} 个节点`);

  // 验证有配穴节点
  const hasPrescription = layer4Output1!.nodes.some(n => n.type === 'prescription');
  assert(hasPrescription, 'Layer4 生成了配穴节点');

  // 验证有证型节点
  const hasSyndrome = layer4Output1!.nodes.some(n => n.type === 'pattern');
  assert(hasSyndrome, 'Layer4 生成了证型节点');

  // 验证最终输出包含配穴
  assert(result1.prescription !== undefined, '最终输出包含配穴方案');
  assert(result1.prescription!.mainPoints.length > 0, '主穴不为空');
  const technique = result1.prescription!.technique;
  assert(technique === '补法' || technique === '泻法' || technique === '平补平泻', '针法已确定');

  // Test 2: 阴虚火旺 - 传变分析
  console.log('\n--- 测试2: 阴虚火旺 → 传变关系分析 ---');
  const chain2 = new InferenceChain();
  const result2 = await chain2.execute(mockTongue_YinXuHuoWang, { age: 35 });

  assert(result2.organPatterns.length > 0, '生成了脏腑辨证');
  assert(result2.organPatterns.some(p => p.organ === '肾' || p.organ === '心'), '包含心肾辨证');

  // 验证配穴包含滋阴穴位
  if (result2.prescription) {
    const hasZiyinPoints = result2.prescription.mainPoints.some(p =>
      ['太溪', '照海', '三阴交', '涌泉'].includes(p)
    );
    assert(hasZiyinPoints, '配穴包含滋阴穴位');
  }

  // Test 3: 实热 - 清热配穴
  console.log('\n--- 测试3: 实热 → 清热配穴方案 ---');
  const chain3 = new InferenceChain();
  const result3 = await chain3.execute(mockTongue_ShiRe, { age: 28 });

  if (result3.prescription) {
    const technique = result3.prescription.technique;
    assert(technique === '泻法', `实热用泻法，实际为${technique}`);
  }

  console.log('\n✅ Layer4 综合推理层测试通过');
}

// ============================================================
// 测试：四层推理链完整执行
// ============================================================
async function testFullChain() {
  console.log('\n========================================');
  console.log('Phase 1.3 四层推理链完整测试');
  console.log('========================================\n');

  // Test 1: 执行轨迹可追踪
  console.log('--- 测试1: 执行轨迹可追踪 ---');
  const chain = new InferenceChain();
  const result = await chain.execute(mockTongue_QiXuShiSheng, { age: 45 });

  const trace = chain.getExecutionTrace();
  assert(trace.length > 0, `执行轨迹包含 ${trace.length} 条记录`);

  // 验证轨迹包含4层
  const layers = [...new Set(trace.map(t => t.layer))];
  assert(layers.includes(1), '轨迹包含Layer1');
  assert(layers.includes(2), '轨迹包含Layer2');
  assert(layers.includes(3), '轨迹包含Layer3');
  assert(layers.includes(4), '轨迹包含Layer4');

  // Test 2: 证型结论完整
  console.log('\n--- 测试2: 证型结论完整 ---');
  assert(result.syndrome.length > 0, `生成了证型: ${result.syndrome}`);
  assert(result.rootCause.length > 0, `生成了根本原因: ${result.rootCause}`);

  // Test 3: 所有层级输出完整
  console.log('\n--- 测试3: 所有层级输出完整 ---');
  for (let layer = 1; layer <= 4; layer++) {
    const layerOutput = chain.getLayerOutput(layer as 1 | 2 | 3 | 4);
    assert(layerOutput !== undefined, `Layer${layer} 有输出`);
    assert(layerOutput!.nodes.length > 0, `Layer${layer} 产生了 ${layerOutput!.nodes.length} 个节点`);
    assert(layerOutput!.summary.label.length > 0, `Layer${layer} 有综合结论`);
  }

  console.log('\n✅ 四层推理链完整测试通过');
}

// ============================================================
// 测试：传变路径正确
// ============================================================
async function testTransmission() {
  console.log('\n========================================');
  console.log('Phase 1.3 传变路径测试');
  console.log('========================================\n');

  // Test: 肝郁克脾传变
  console.log('--- 测试: 肝郁→克脾→脾虚传变 ---');
  const chain = new InferenceChain();
  const result = await chain.execute(mockTongue_GanYuHuaHuo, { age: 40 });

  // 验证包含肝和脾的辨证
  const hasLiverPattern = result.organPatterns.some(p => p.organ === '肝');
  const hasSpleenPattern = result.organPatterns.some(p => p.organ === '脾' || p.organ === '胃');
  assert(hasLiverPattern, '包含肝辨证');
  assert(hasSpleenPattern, '包含脾胃辨证');

  console.log('\n✅ 传变路径测试通过');
}

// ============================================================
// 主函数
// ============================================================
async function main() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   舌镜v2.0 Phase 1.3 集成测试          ║');
  console.log('║   Layer3 分区凹凸 + Layer4 综合推理    ║');
  console.log('╚════════════════════════════════════════╝');

  try {
    await testLayer3();
    await testLayer4();
    await testFullChain();
    await testTransmission();

    console.log('\n========================================');
    console.log('✅ 所有 Phase 1.3 测试通过！');
    console.log('========================================\n');
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    process.exit(1);
  }
}

// 运行测试
main().catch(console.error);
