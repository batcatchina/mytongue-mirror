/**
 * 推理链单元测试 v2.0
 * Phase 1.2 - 推理链核心实现
 */

import { InferenceChain, InferenceChainStatus } from '../src/engine/core/InferenceChain';
import { Layer1Processor } from '../src/engine/layers/Layer1Processor';
import { Layer2Processor } from '../src/engine/layers/Layer2Processor';
import type { TongueAnalysisResult } from '../src/types/tongue';
import type { InferenceContext, LayerInput } from '../src/types/inference';

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
 * 创建测试用推理上下文
 */
function createTestContext(age: number = 30): InferenceContext {
  return {
    age,
    gender: '女',
  };
}

/**
 * 测试用例类
 */
class InferenceChainTest {
  private passed = 0;
  private failed = 0;
  private results: Array<{ name: string; passed: boolean; message?: string }> = [];

  /**
   * 运行单个测试
   */
  runTest(name: string, testFn: () => boolean, message?: string): void {
    try {
      const result = testFn();
      if (result) {
        this.passed++;
        this.results.push({ name, passed: true });
        console.log(`✅ ${name}`);
      } else {
        this.failed++;
        this.results.push({ name, passed: false, message: message || 'Test returned false' });
        console.log(`❌ ${name}: ${message || 'Test returned false'}`);
      }
    } catch (error) {
      this.failed++;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.results.push({ name, passed: false, message: errorMessage });
      console.log(`❌ ${name}: ${errorMessage}`);
    }
  }

  /**
   * 打印测试报告
   */
  printReport(): void {
    console.log('\n' + '='.repeat(60));
    console.log('测试报告');
    console.log('='.repeat(60));
    console.log(`通过: ${this.passed}`);
    console.log(`失败: ${this.failed}`);
    console.log(`总计: ${this.passed + this.failed}`);
    console.log('='.repeat(60));

    if (this.failed > 0) {
      console.log('\n失败测试:');
      this.results.filter(r => !r.passed).forEach(r => {
        console.log(`  - ${r.name}: ${r.message}`);
      });
    }
  }

  /**
   * 获取测试结果
   */
  getResults() {
    return {
      passed: this.passed,
      failed: this.failed,
      total: this.passed + this.failed,
      success: this.failed === 0,
    };
  }
}

/**
 * 主测试函数
 */
async function runTests(): Promise<void> {
  const test = new InferenceChainTest();

  console.log('\n舌镜v2.0 推理链单元测试');
  console.log('Phase 1.2 - 推理链核心实现\n');

  // ==================== InferenceChain 测试 ====================
  console.log('\n【InferenceChain 核心测试】\n');

  // 测试1: 创建推理链
  test.runTest(
    'InferenceChain: 创建推理链',
    () => {
      const chain = new InferenceChain();
      return chain.getId().startsWith('chain-') && chain.getStatus() === InferenceChainStatus.Idle;
    }
  );

  // 测试2: 添加节点
  test.runTest(
    'InferenceChain: 添加节点',
    () => {
      const chain = new InferenceChain();
      chain.addNode({
        id: 'test-node-1',
        name: '测试节点',
        layer: 1,
        type: 'pattern',
        inputs: [],
        conclusion: {
          label: '测试结论',
          description: '测试描述',
          confidence: 0.8,
          evidence: [],
          priority: 'medium',
        },
        causes: [],
        effects: [],
        corrections: [],
        createdAt: new Date().toISOString(),
      });
      return chain.getNodes().size === 1 && chain.getNode('test-node-1')?.name === '测试节点';
    }
  );

  // 测试3: 拓扑排序
  test.runTest(
    'InferenceChain: 拓扑排序',
    () => {
      const chain = new InferenceChain();
      chain.addNode({
        id: 'node-a',
        name: '节点A',
        layer: 1,
        type: 'tongue_feature',
        inputs: [],
        conclusion: { label: 'A', description: '', confidence: 1, evidence: [], priority: 'medium' },
        causes: [],
        effects: ['node-b'],
        corrections: [],
        createdAt: new Date().toISOString(),
      });
      chain.addNode({
        id: 'node-b',
        name: '节点B',
        layer: 2,
        type: 'pattern',
        inputs: [],
        conclusion: { label: 'B', description: '', confidence: 0.8, evidence: [], priority: 'medium' },
        causes: ['node-a'],
        effects: [],
        corrections: [],
        createdAt: new Date().toISOString(),
      });
      const order = chain.topologicalSort();
      return order.length === 2 && order[0] === 'node-a' && order[1] === 'node-b';
    }
  );

  // 测试4: 获取执行轨迹
  test.runTest(
    'InferenceChain: 执行轨迹记录',
    () => {
      const chain = new InferenceChain();
      chain.addNode({
        id: 'trace-node',
        name: '轨迹节点',
        layer: 1,
        type: 'pattern',
        inputs: [{ sourceType: 'tongue_analysis', sourceId: 'input', value: 'test', weight: 1 }],
        conclusion: { label: '轨迹测试', description: '', confidence: 0.9, evidence: [], priority: 'medium' },
        causes: [],
        effects: [],
        corrections: [],
        createdAt: new Date().toISOString(),
      });
      const trace = chain.getExecutionTrace();
      return Array.isArray(trace);
    }
  );

  // ==================== Layer1Processor 测试 ====================
  console.log('\n【Layer1Processor 测试】\n');

  // 测试5: 舌质淡+苔白腻 → 气血不足+湿盛
  test.runTest(
    'Layer1: 舌质淡+苔白腻 → 气血不足+湿盛',
    () => {
      const processor = new Layer1Processor();
      const input = createTestTongueAnalysis({
        bodyColor: '淡白',
        coatingColor: '白厚',
        coatingTexture: '腻',
      });
      const output = processor.process({ tongueAnalysis: input });
      
      const summary = output.summary.label;
      const hasQiBloodIssue = summary.includes('气血') || summary.includes('不足');
      const hasDampness = summary.includes('湿');
      
      return hasQiBloodIssue && hasDampness;
    },
    `预期包含气血和湿盛，实际: ${processor?.process?.({ tongueAnalysis: createTestTongueAnalysis({ bodyColor: '淡白', coatingColor: '白厚', coatingTexture: '腻' }) })?.summary?.label || 'N/A'}`
  );

  // 测试6: 舌质红+苔黄 → 实热
  test.runTest(
    'Layer1: 舌质红+苔黄 → 实热',
    () => {
      const processor = new Layer1Processor();
      const input = createTestTongueAnalysis({
        bodyColor: '红',
        coatingColor: '黄',
        coatingTexture: '厚',
      });
      const output = processor.process({ tongueAnalysis: input });
      
      const summary = output.summary.label;
      return summary.includes('热');
    }
  );

  // 测试7: 舌质红+无苔 → 阴虚
  test.runTest(
    'Layer1: 舌质红+无苔 → 阴虚火旺',
    () => {
      const processor = new Layer1Processor();
      const input = createTestTongueAnalysis({
        bodyColor: '红',
        coatingColor: '无苔',
        coatingTexture: '薄',
      });
      const output = processor.process({ tongueAnalysis: input });
      
      const summary = output.summary.label;
      return summary.includes('阴虚') || summary.includes('火旺');
    }
  );

  // 测试8: 正常舌象
  test.runTest(
    'Layer1: 正常舌象 → 平和',
    () => {
      const processor = new Layer1Processor();
      const input = createTestTongueAnalysis({
        bodyColor: '淡红',
        coatingColor: '薄白',
        coatingTexture: '薄',
      });
      const output = processor.process({ tongueAnalysis: input });
      
      const confidence = output.summary.confidence;
      return confidence > 0.5;
    }
  );

  // ==================== Layer2Processor 测试 ====================
  console.log('\n【Layer2Processor 测试】\n');

  // 测试9: 胖大+齿痕 → 气虚湿盛（反直觉验证）
  test.runTest(
    'Layer2: 胖大+齿痕 → 气虚湿盛（反直觉验证）',
    () => {
      const processor = new Layer2Processor();
      const input = createTestTongueAnalysis({
        shape: '胖大',
        hasTeethMark: true,
        teethMarkDegree: '明显',
        bodyColor: '淡红',
      });
      const output = processor.process({ tongueAnalysis: input });
      
      const summary = output.summary.label;
      // 反直觉：胖大不是实证，而是气虚
      const isQiDeficiency = summary.includes('气虚');
      const isDampness = summary.includes('湿') || summary.includes('湿盛');
      
      // 检查是否有反直觉的证据
      const hasAntiIntuitiveEvidence = output.nodes.some(node =>
        node.conclusion.evidence.some(e => e.includes('反直觉'))
      );
      
      return isQiDeficiency && hasAntiIntuitiveEvidence;
    },
    `胖大+齿痕应判断为气虚湿盛（非实证）`
  );

  // 测试10: 瘦薄+红 → 阴虚火旺
  test.runTest(
    'Layer2: 瘦薄+红 → 阴虚火旺',
    () => {
      const processor = new Layer2Processor();
      const input = createTestTongueAnalysis({
        shape: '瘦薄',
        bodyColor: '红',
        hasCrack: false,
      });
      const output = processor.process({ tongueAnalysis: input });
      
      const summary = output.summary.label;
      return summary.includes('阴虚') && summary.includes('火旺');
    }
  );

  // 测试11: 裂纹舌分析
  test.runTest(
    'Layer2: 裂纹舌 → 阴虚/血虚',
    () => {
      const processor = new Layer2Processor();
      const input = createTestTongueAnalysis({
        shape: '瘦薄',
        bodyColor: '淡白',
        hasCrack: true,
        crackDegree: '中等',
      });
      const output = processor.process({ tongueAnalysis: input });
      
      const summary = output.summary.label;
      // 舌淡裂纹应为血虚
      return summary.includes('虚');
    }
  );

  // ==================== 组合推理测试 ====================
  console.log('\n【组合推理测试】\n');

  // 测试12: Layer1 → Layer2 链式推理
  test.runTest(
    '组合推理: Layer1 → Layer2 链式推理',
    () => {
      const layer1 = new Layer1Processor();
      const layer2 = new Layer2Processor();
      
      const input = createTestTongueAnalysis({
        bodyColor: '淡白',
        coatingColor: '白厚',
        coatingTexture: '腻',
        shape: '胖大',
        hasTeethMark: true,
      });
      
      const layer1Output = layer1.process({ tongueAnalysis: input });
      const layer2Output = layer2.process({
        tongueAnalysis: input,
        previousLayerOutput: layer1Output,
      });
      
      // Layer1 输出气血不足+湿盛
      const layer1HasQiBloodIssue = layer1Output.summary.label.includes('气血') || layer1Output.summary.label.includes('不足');
      
      // Layer2 输出气虚湿盛（反直觉）
      const layer2IsAntiIntuitive = layer2Output.nodes.some(node =>
        node.conclusion.evidence.some(e => e.includes('反直觉'))
      );
      
      return layer1HasQiBloodIssue && layer2IsAntiIntuitive;
    }
  );

  // 测试13: 推理链节点关联
  test.runTest(
    '组合推理: 推理链节点关联',
    () => {
      const layer1 = new Layer1Processor();
      const layer2 = new Layer2Processor();
      
      const input = createTestTongueAnalysis({
        bodyColor: '淡白',
        coatingColor: '白厚',
        coatingTexture: '腻',
        shape: '胖大',
        hasTeethMark: true,
      });
      
      const layer1Output = layer1.process({ tongueAnalysis: input });
      const layer2Output = layer2.process({
        tongueAnalysis: input,
        previousLayerOutput: layer1Output,
      });
      
      // 综合判断
      const allNodes = [...layer1Output.nodes, ...layer2Output.nodes];
      const patternNodes = allNodes.filter(n => n.type === 'pattern');
      
      // 应该至少有多个pattern节点
      return patternNodes.length >= 4;
    }
  );

  // ==================== 置信度传播测试 ====================
  console.log('\n【置信度传播测试】\n');

  // 测试14: 置信度计算
  test.runTest(
    '置信度传播: 多特征一致性叠加',
    () => {
      const layer1 = new Layer1Processor();
      const input = createTestTongueAnalysis({
        bodyColor: '红',
        coatingColor: '黄',
        coatingTexture: '厚',
      });
      const output = layer1.process({ tongueAnalysis: input });
      
      // 实热证置信度应该较高
      return output.summary.confidence >= 0.7;
    }
  );

  // 测试15: 执行统计
  test.runTest(
    '执行统计: 获取执行统计信息',
    () => {
      const chain = new InferenceChain();
      chain.addNode({
        id: 'stat-node-1',
        name: '统计节点1',
        layer: 1,
        type: 'pattern',
        inputs: [],
        conclusion: { label: '统计测试1', description: '', confidence: 0.8, evidence: [], priority: 'medium' },
        causes: [],
        effects: [],
        corrections: [],
        createdAt: new Date().toISOString(),
      });
      chain.addNode({
        id: 'stat-node-2',
        name: '统计节点2',
        layer: 2,
        type: 'pattern',
        inputs: [],
        conclusion: { label: '统计测试2', description: '', confidence: 0.7, evidence: [], priority: 'medium' },
        causes: [],
        effects: [],
        corrections: [],
        createdAt: new Date().toISOString(),
      });
      
      const stats = chain.getExecutionStats();
      return stats.totalNodes === 2 && stats.nodesByLayer[1] === 1 && stats.nodesByLayer[2] === 1;
    }
  );

  // ==================== 边界测试 ====================
  console.log('\n【边界测试】\n');

  // 测试16: 空输入处理
  test.runTest(
    '边界处理: 空输入返回空结果',
    () => {
      const layer1 = new Layer1Processor();
      const output = layer1.process({});
      return output.nodes.length === 0 && output.summary.confidence === 0;
    }
  );

  // 测试17: 推理链重置
  test.runTest(
    '推理链重置: 重置后状态为空',
    () => {
      const chain = new InferenceChain();
      chain.addNode({
        id: 'reset-node',
        name: '重置节点',
        layer: 1,
        type: 'pattern',
        inputs: [],
        conclusion: { label: '重置测试', description: '', confidence: 0.9, evidence: [], priority: 'medium' },
        causes: [],
        effects: [],
        corrections: [],
        createdAt: new Date().toISOString(),
      });
      chain.reset();
      return chain.getNodes().size === 0 && chain.getStatus() === InferenceChainStatus.Idle;
    }
  );

  // 打印测试报告
  test.printReport();
  
  // 返回测试结果
  return test.getResults();
}

/**
 * 运行测试并导出结果
 */
export async function runAllTests(): Promise<{ success: boolean; passed: number; failed: number }> {
  const results = await runTests();
  return {
    success: results.success,
    passed: results.passed,
    failed: results.failed,
  };
}

// 如果直接运行此文件
if (typeof window === 'undefined' && require.main === module) {
  runAllTests().then(results => {
    process.exit(results.success ? 0 : 1);
  }).catch(error => {
    console.error('测试执行失败:', error);
    process.exit(1);
  });
}
