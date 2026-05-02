/**
 * 拓扑排序诊断脚本
 */
import { InferenceChain } from '@/engine/core/InferenceChain';
import type { TongueAnalysisResult } from '@/types/tongue';

const mock: TongueAnalysisResult = {
  bodyColor: '淡白',
  shape: '胖大',
  coatingColor: '白厚',
  coatingTexture: '腻',
  state: '正常',
  hasTeethMark: true,
  teethMarkDegree: '明显',
  hasCrack: false,
  hasEcchymosis: false,
  zoneFeatures: [
    { position: 'upperThird', color: '淡白', undulation: 'flat' },
    { position: 'middleThird', color: '淡白', undulation: 'depression', hasTeethMark: true },
    { position: 'lowerThird', color: '淡白', undulation: 'flat' },
  ],
  isSemitransparent: false,
  timestamp: new Date().toISOString(),
};

async function main() {
  const chain = new InferenceChain();
  await chain.execute(mock, { age: 45 });

  console.log('=== 拓扑排序诊断 ===');
  console.log('nodes.size:', chain.getNodes().size);
  
  for (const [id, node] of chain.getNodes()) {
    if (node.causes.length > 0) {
      console.log(`[${node.layer}] ${node.name} (${id.slice(-10)}) causes:`, 
        node.causes.map(c => c.slice(-10)));
    } else {
      console.log(`[${node.layer}] ${node.name} (${id.slice(-10)}) - 无前置节点 (root)`);
    }
  }
}

main();
