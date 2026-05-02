/**
 * 推理链功能验证脚本 (ESM)
 * 用于验证Phase 1.2实现的推理链核心功能
 */

import { InferenceChain } from './src/engine/core/InferenceChain.ts';
import { Layer1Processor } from './src/engine/layers/Layer1Processor.ts';
import { Layer2Processor } from './src/engine/layers/Layer2Processor.ts';

console.log('\n舌镜v2.0 Phase 1.2 功能验证');
console.log('='.repeat(50) + '\n');

// 测试用例定义
const testCases = [
  {
    name: 'InferenceChain: 创建推理链',
    test: () => {
      const chain = new InferenceChain();
      return chain.getId().startsWith('chain-');
    }
  },
  {
    name: 'InferenceChain: 添加并获取节点',
    test: () => {
      const chain = new InferenceChain();
      chain.addNode({
        id: 'test-node',
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
      const node = chain.getNode('test-node');
      return node?.name === '测试节点';
    }
  },
  {
    name: 'Layer1: 舌质淡+苔白腻 → 气血不足/湿盛',
    test: () => {
      const processor = new Layer1Processor();
      const output = processor.process({
        tongueAnalysis: {
          bodyColor: '淡白',
          shape: '正常',
          coatingColor: '白厚',
          coatingTexture: '腻',
          state: '正常',
          hasTeethMark: false,
          hasCrack: false,
          hasEcchymosis: false,
          zoneFeatures: [],
          isSemitransparent: false,
          timestamp: new Date().toISOString(),
        }
      });
      return output.summary.label.includes('气血') || output.summary.label.includes('不足') || output.summary.label.includes('湿');
    }
  },
  {
    name: 'Layer1: 舌质红+苔黄 → 实热',
    test: () => {
      const processor = new Layer1Processor();
      const output = processor.process({
        tongueAnalysis: {
          bodyColor: '红',
          shape: '正常',
          coatingColor: '黄',
          coatingTexture: '厚',
          state: '正常',
          hasTeethMark: false,
          hasCrack: false,
          hasEcchymosis: false,
          zoneFeatures: [],
          isSemitransparent: false,
          timestamp: new Date().toISOString(),
        }
      });
      return output.summary.label.includes('热');
    }
  },
  {
    name: 'Layer1: 舌质红+无苔 → 阴虚火旺',
    test: () => {
      const processor = new Layer1Processor();
      const output = processor.process({
        tongueAnalysis: {
          bodyColor: '红',
          shape: '正常',
          coatingColor: '无苔',
          coatingTexture: '薄',
          state: '正常',
          hasTeethMark: false,
          hasCrack: false,
          hasEcchymosis: false,
          zoneFeatures: [],
          isSemitransparent: false,
          timestamp: new Date().toISOString(),
        }
      });
      return output.summary.label.includes('阴虚') || output.summary.label.includes('火旺');
    }
  },
  {
    name: 'Layer2: 胖大+齿痕 → 气虚湿盛（反直觉验证）',
    test: () => {
      const processor = new Layer2Processor();
      const output = processor.process({
        tongueAnalysis: {
          bodyColor: '淡红',
          shape: '胖大',
          coatingColor: '薄白',
          coatingTexture: '薄',
          state: '正常',
          hasTeethMark: true,
          teethMarkDegree: '明显',
          hasCrack: false,
          hasEcchymosis: false,
          zoneFeatures: [],
          isSemitransparent: false,
          timestamp: new Date().toISOString(),
        }
      });
      // 检查是否有反直觉的证据
      const hasAntiIntuitive = output.nodes.some(n => 
        n.conclusion.evidence && n.conclusion.evidence.some(e => e.includes('反直觉'))
      );
      // 检查是否有气虚相关结论
      const hasQiDeficiency = output.nodes.some(n => 
        n.conclusion.label.includes('气虚')
      );
      return hasAntiIntuitive && hasQiDeficiency;
    }
  },
  {
    name: 'Layer2: 瘦薄+红 → 阴虚火旺',
    test: () => {
      const processor = new Layer2Processor();
      const output = processor.process({
        tongueAnalysis: {
          bodyColor: '红',
          shape: '瘦薄',
          coatingColor: '薄白',
          coatingTexture: '薄',
          state: '正常',
          hasTeethMark: false,
          hasCrack: false,
          hasEcchymosis: false,
          zoneFeatures: [],
          isSemitransparent: false,
          timestamp: new Date().toISOString(),
        }
      });
      // 检查舌形节点是否有阴虚火旺结论
      const shapeNode = output.nodes.find(n => n.conclusion.label.includes('津液耗损') || n.conclusion.label.includes('阴虚'));
      return shapeNode?.conclusion.label.includes('阴虚') && 
             shapeNode?.conclusion.label.includes('火旺');
    }
  },
  {
    name: 'Layer2: 裂纹舌 → 阴虚/血虚',
    test: () => {
      const processor = new Layer2Processor();
      const output = processor.process({
        tongueAnalysis: {
          bodyColor: '淡白',
          shape: '瘦薄',
          coatingColor: '薄白',
          coatingTexture: '薄',
          state: '正常',
          hasTeethMark: false,
          hasCrack: true,
          crackDegree: '中等',
          hasEcchymosis: false,
          zoneFeatures: [],
          isSemitransparent: false,
          timestamp: new Date().toISOString(),
        }
      });
      return output.summary.label.includes('虚');
    }
  },
  {
    name: '组合推理: Layer1+Layer2链式推理',
    test: () => {
      const layer1 = new Layer1Processor();
      const layer2 = new Layer2Processor();
      
      const input = {
        tongueAnalysis: {
          bodyColor: '淡白',
          shape: '胖大',
          coatingColor: '白厚',
          coatingTexture: '腻',
          state: '正常',
          hasTeethMark: true,
          teethMarkDegree: '明显',
          hasCrack: false,
          hasEcchymosis: false,
          zoneFeatures: [],
          isSemitransparent: false,
          timestamp: new Date().toISOString(),
        }
      };
      
      const l1Output = layer1.process(input);
      const l2Output = layer2.process({
        ...input,
        previousLayerOutput: l1Output
      });
      
      return l1Output.nodes.length >= 4 && l2Output.nodes.length >= 2;
    }
  },
  {
    name: '推理节点依赖关系',
    test: () => {
      const processor = new Layer2Processor();
      const output = processor.process({
        tongueAnalysis: {
          bodyColor: '淡红',
          shape: '胖大',
          coatingColor: '薄白',
          coatingTexture: '薄',
          state: '正常',
          hasTeethMark: true,
          hasCrack: false,
          hasEcchymosis: false,
          zoneFeatures: [],
          isSemitransparent: false,
          timestamp: new Date().toISOString(),
        }
      });
      return output.nodes.some(n => n.causes && n.causes.length > 0);
    }
  },
];

// 运行测试
console.log('【核心功能测试】\n');

let passed = 0;
let failed = 0;

for (const tc of testCases) {
  try {
    const result = tc.test();
    if (result) {
      console.log(`✅ PASS - ${tc.name}`);
      passed++;
    } else {
      console.log(`❌ FAIL - ${tc.name}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ERROR - ${tc.name}: ${error.message}`);
    failed++;
  }
}

// 总结
console.log('\n' + '='.repeat(50));
console.log(`测试结果: ${passed} 通过, ${failed} 失败`);
console.log('='.repeat(50) + '\n');

process.exit(failed > 0 ? 1 : 0);
