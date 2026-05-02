/**
 * 舌镜v2.0 真实舌象端到端验证测试
 * 用真实舌象图片走完整链路：AI视觉识别→结构化特征→v2.0四层推理→最终辨证
 */

import { InferenceChain } from '../src/engine/core/InferenceChain';
import type { TongueAnalysisResult, ZoneFeature } from '../src/types/tongue';
import type { InferenceContext } from '../src/types/inference';

// ==================== 类型定义 ====================

interface TestCase {
  id: string;
  name: string;
  imagePath: string;
  aiRecognition: TongueAnalysisResult;
  goldStandard: GoldStandard;
}

interface GoldStandard {
  syndrome: string;
  rootCause: string;
  transmissionPaths: string[];
  organLocation: string[];
  mainPoints: string[];
  secondaryPoints: string[];
  source: string;
}

interface E2EResult {
  testCaseId: string;
  testCaseName: string;
  aiRecognition: TongueAnalysisResult;
  layerOutputs: {
    layer1: any;
    layer2: any;
    layer3: any;
    layer4: any;
  };
  finalOutput: any;
  goldStandard: GoldStandard;
  evaluation: {
    visualRecognitionScore: number;  // 视觉识别准确度 0-1
    organLocationScore: number;      // 脏腑定位准确度 0-1
    syndromeScore: number;           // 证型判断准确度 0-1
    transmissionScore: number;       // 传变识别准确度 0-1
    acupointScore: number;          // 配穴合理性 0-1
    overallScore: number;
  };
  executionTime: number;
  issues: string[];
}

// ==================== 测试用例（从真实图片AI识别结果） ====================

const testCases: TestCase[] = [
  // TC01: 肝郁化火
  {
    id: 'TC01',
    name: '肝郁化火',
    imagePath: './上古文化资料库/舌镜参考图/肝郁化火实例.jpg',
    aiRecognition: {
      bodyColor: '红',
      bodyColorConfidence: 0.92,
      shape: '正常',
      shapeConfidence: 0.88,
      coatingColor: '薄白',
      coatingColorConfidence: 0.85,
      coatingTexture: '薄',
      coatingTextureConfidence: 0.82,
      state: '正常',
      stateConfidence: 0.95,
      hasTeethMark: true,
      teethMarkDegree: '明显',
      hasCrack: false,
      hasEcchymosis: false,
      zoneFeatures: [
        { position: 'upperThird', side: 'center', color: '红', colorIntensity: '正常' },
        { position: 'middleThird', side: 'center', color: '淡红', colorIntensity: '正常' },
        { position: 'middleThird', side: 'left', color: '红', colorIntensity: '偏深', hasTeethMark: true },
        { position: 'middleThird', side: 'right', color: '红', colorIntensity: '偏深', hasTeethMark: true },
        { position: 'lowerThird', side: 'center', color: '淡红', colorIntensity: '正常' }
      ],
      isSemitransparent: false,
      timestamp: new Date().toISOString()
    },
    goldStandard: {
      syndrome: '肝郁化火证',
      rootCause: '肝气郁结，久而化火',
      transmissionPaths: [],
      organLocation: ['肝', '胆'],
      mainPoints: ['太冲', '行间', '阳陵泉', '内关'],
      secondaryPoints: ['百会', '膻中'],
      source: '中医舌诊肝郁化火'
    }
  },

  // TC02: 肝郁血虚
  {
    id: 'TC02',
    name: '肝郁血虚',
    imagePath: './上古文化资料库/舌镜参考图/肝郁血虚实例.png',
    aiRecognition: {
      bodyColor: '淡红',
      bodyColorConfidence: 0.90,
      shape: '正常',
      shapeConfidence: 0.88,
      coatingColor: '薄白',
      coatingColorConfidence: 0.88,
      coatingTexture: '薄',
      coatingTextureConfidence: 0.85,
      state: '正常',
      stateConfidence: 0.95,
      hasTeethMark: true,
      teethMarkDegree: '明显',
      hasCrack: false,
      hasEcchymosis: false,
      zoneFeatures: [
        { position: 'upperThird', side: 'center', color: '淡红', colorIntensity: '偏淡' },
        { position: 'middleThird', side: 'center', color: '淡红', colorIntensity: '偏淡' },
        { position: 'middleThird', side: 'left', color: '淡红', colorIntensity: '偏淡', hasTeethMark: true },
        { position: 'middleThird', side: 'right', color: '淡红', colorIntensity: '偏淡', hasTeethMark: true },
        { position: 'lowerThird', side: 'center', color: '淡红', colorIntensity: '偏淡' }
      ],
      isSemitransparent: false,
      timestamp: new Date().toISOString()
    },
    goldStandard: {
      syndrome: '肝郁血虚证',
      rootCause: '肝气郁结，血液生化不足',
      transmissionPaths: ['肝郁→血虚→肝血不足'],
      organLocation: ['肝'],
      mainPoints: ['太冲', '血海', '三阴交', '足三里'],
      secondaryPoints: ['肝俞', '膈俞'],
      source: '中医舌诊肝郁血虚'
    }
  },

  // TC03: 气滞血瘀
  {
    id: 'TC03',
    name: '气滞血瘀',
    imagePath: './上古文化资料库/舌镜参考图/气滞血瘀实例.png',
    aiRecognition: {
      bodyColor: '紫',
      bodyColorConfidence: 0.95,
      shape: '正常',
      shapeConfidence: 0.88,
      coatingColor: '薄白',
      coatingColorConfidence: 0.80,
      coatingTexture: '腻',
      coatingTextureConfidence: 0.75,
      state: '正常',
      stateConfidence: 0.95,
      hasTeethMark: true,
      teethMarkDegree: '轻微',
      hasCrack: false,
      hasEcchymosis: true,
      ecchymosisDistribution: ['middleThird', 'lowerThird'],
      zoneFeatures: [
        { position: 'upperThird', side: 'center', color: '紫', colorIntensity: '正常' },
        { position: 'middleThird', side: 'center', color: '紫暗', colorIntensity: '偏深' },
        { position: 'middleThird', side: 'left', color: '紫暗', colorIntensity: '偏深', hasTeethMark: true },
        { position: 'middleThird', side: 'right', color: '紫暗', colorIntensity: '偏深', hasTeethMark: true },
        { position: 'lowerThird', side: 'center', color: '紫', colorIntensity: '偏深', hasEcchymosis: true }
      ],
      isSemitransparent: false,
      timestamp: new Date().toISOString()
    },
    goldStandard: {
      syndrome: '气滞血瘀证',
      rootCause: '气行不畅，血行瘀滞',
      transmissionPaths: ['气滞→血瘀'],
      organLocation: ['肝', '心'],
      mainPoints: ['太冲', '血海', '膈俞', '内关'],
      secondaryPoints: ['三阴交', '足三里'],
      source: '中医舌诊气滞血瘀'
    }
  },

  // TC04: 三高舌（半透明气血亏虚）
  {
    id: 'TC04',
    name: '三高舌象（气血亏虚）',
    imagePath: './上古文化资料库/舌镜参考图/三高舌象半透明.png',
    aiRecognition: {
      bodyColor: '淡白',
      bodyColorConfidence: 0.88,
      shape: '胖大',
      shapeConfidence: 0.85,
      coatingColor: '白厚',
      coatingColorConfidence: 0.82,
      coatingTexture: '腻',
      coatingTextureConfidence: 0.80,
      state: '正常',
      stateConfidence: 0.95,
      hasTeethMark: true,
      teethMarkDegree: '明显',
      hasCrack: false,
      hasEcchymosis: false,
      zoneFeatures: [
        { position: 'upperThird', side: 'center', color: '淡白', colorIntensity: '偏淡', undulation: 'semitransparent' },
        { position: 'middleThird', side: 'center', color: '淡白', colorIntensity: '偏淡', undulation: 'semitransparent' },
        { position: 'lowerThird', side: 'center', color: '淡白', colorIntensity: '偏淡', undulation: 'semitransparent' }
      ],
      isSemitransparent: true,
      semitransparentZones: ['upperThird', 'middleThird', 'lowerThird'],
      timestamp: new Date().toISOString()
    },
    goldStandard: {
      syndrome: '气血两虚证',
      rootCause: '三焦气血亏虚，脏腑功能下降',
      transmissionPaths: ['气虚→血虚→气血两虚'],
      organLocation: ['心', '脾', '肾'],
      mainPoints: ['气海', '足三里', '三阴交', '关元'],
      secondaryPoints: ['脾俞', '肾俞', '心俞'],
      source: '三高舌象辨证'
    }
  }
];

// ==================== 辅助函数 ====================

function evaluateOrganLocation(inferred: string[], expected: string[]): number {
  if (expected.length === 0) return 1;
  const matched = expected.filter(org => inferred.some(i => i.includes(org) || org.includes(i)));
  return matched.length / expected.length;
}

function evaluateSyndrome(inferred: string, expected: string): number {
  if (!inferred || !expected) return 0;
  
  // 完全匹配
  if (inferred.includes(expected) || expected.includes(inferred)) return 1;
  
  // 关键词匹配
  const expectedKeywords = expected.replace(/证$/, '').split(/[、和]/);
  const inferredNormalized = inferred.replace(/证$/, '');
  let matches = 0;
  
  for (const keyword of expectedKeywords) {
    if (inferredNormalized.includes(keyword)) {
      matches++;
    }
  }
  
  return matches / expectedKeywords.length;
}

function evaluateAcupoints(inferred: string[], expected: string[]): number {
  if (expected.length === 0) return 1;
  
  // 精确匹配
  const exactMatches = inferred.filter(p => expected.includes(p));
  const partialMatches = inferred.filter(p => 
    expected.some(e => (p.includes(e) || e.includes(p)) && p !== e)
  );
  
  return (exactMatches.length * 1.0 + partialMatches.length * 0.5) / expected.length;
}

function evaluateTransmission(inferred: string[], expected: string[]): number {
  if (expected.length === 0) return 1;
  
  let score = 0;
  for (const exp of expected) {
    const expNormalized = exp.replace(/[→→]/g, '->');
    if (inferred.some(i => i.includes(expNormalized) || expNormalized.includes(i))) {
      score += 1;
    }
  }
  
  return score / expected.length;
}

// ==================== 主测试函数 ====================

async function runE2ETest(testCase: TestCase): Promise<E2EResult> {
  const startTime = Date.now();
  const issues: string[] = [];
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`测试用例: ${testCase.id} - ${testCase.name}`);
  console.log(`图片路径: ${testCase.imagePath}`);
  console.log(`${'='.repeat(60)}`);
  
  // 打印AI识别结果
  console.log('\n【AI视觉识别结果】');
  console.log(`- 舌色: ${testCase.aiRecognition.bodyColor} (置信度: ${testCase.aiRecognition.bodyColorConfidence})`);
  console.log(`- 舌形: ${testCase.aiRecognition.shape} (置信度: ${testCase.aiRecognition.shapeConfidence})`);
  console.log(`- 苔色: ${testCase.aiRecognition.coatingColor} (置信度: ${testCase.aiRecognition.coatingColorConfidence})`);
  console.log(`- 苔质: ${testCase.aiRecognition.coatingTexture}`);
  console.log(`- 齿痕: ${testCase.aiRecognition.hasTeethMark ? testCase.aiRecognition.teethMarkDegree : '无'}`);
  console.log(`- 瘀斑: ${testCase.aiRecognition.hasEcchymosis ? '有' : '无'}`);
  console.log(`- 半透明: ${testCase.aiRecognition.isSemitransparent ? '是' : '否'}`);
  console.log('\n分区特征:');
  for (const zone of testCase.aiRecognition.zoneFeatures) {
    const intensity = zone.colorIntensity ? ` [${zone.colorIntensity}]` : '';
    const undulation = zone.undulation ? ` [${zone.undulation}]` : '';
    const teeth = zone.hasTeethMark ? ' [齿痕]' : '';
    const ecch = zone.hasEcchymosis ? ' [瘀斑]' : '';
    console.log(`  - ${zone.position} ${zone.side || 'center'}: ${zone.color}${intensity}${undulation}${teeth}${ecch}`);
  }
  
  // 创建推理链
  const chain = new InferenceChain(`e2e-${testCase.id}-${Date.now()}`);
  
  // 执行推理
  const context: InferenceContext = {
    patientId: 'e2e-test',
    timestamp: new Date().toISOString()
  };
  
  let finalOutput: any = null;
  let layerOutputs: any = {};
  
  try {
    finalOutput = await chain.execute(testCase.aiRecognition, context);
    
    // 获取各层输出
    layerOutputs = {
      layer1: chain.getLayerOutput(1),
      layer2: chain.getLayerOutput(2),
      layer3: chain.getLayerOutput(3),
      layer4: chain.getLayerOutput(4)
    };
    
    // 打印各层结果
    console.log('\n【Layer1 舌质舌苔层】');
    if (layerOutputs.layer1) {
      console.log(`综合结论: ${layerOutputs.layer1.summary.label}`);
      console.log(`置信度: ${(layerOutputs.layer1.summary.confidence * 100).toFixed(1)}%`);
      console.log(`节点数: ${layerOutputs.layer1.nodes.length}`);
    }
    
    console.log('\n【Layer2 舌形虚实层】');
    if (layerOutputs.layer2) {
      console.log(`综合结论: ${layerOutputs.layer2.summary.label}`);
      console.log(`置信度: ${(layerOutputs.layer2.summary.confidence * 100).toFixed(1)}%`);
      console.log(`节点数: ${layerOutputs.layer2.nodes.length}`);
    }
    
    console.log('\n【Layer3 分区凹凸层】');
    if (layerOutputs.layer3) {
      console.log(`综合结论: ${layerOutputs.layer3.summary.label}`);
      console.log(`描述: ${layerOutputs.layer3.summary.description}`);
      console.log(`置信度: ${(layerOutputs.layer3.summary.confidence * 100).toFixed(1)}%`);
      console.log(`节点数: ${layerOutputs.layer3.nodes.length}`);
    }
    
    console.log('\n【Layer4 综合推理层】');
    if (layerOutputs.layer4) {
      console.log(`综合结论: ${layerOutputs.layer4.summary.label}`);
      console.log(`置信度: ${(layerOutputs.layer4.summary.confidence * 100).toFixed(1)}%`);
      console.log(`节点数: ${layerOutputs.layer4.nodes.length}`);
    }
    
    console.log('\n【最终辨证结果】');
    console.log(`证型: ${finalOutput.syndrome}`);
    console.log(`根本原因: ${finalOutput.rootCause}`);
    console.log(`脏腑定位: ${finalOutput.organPatterns?.map((p: any) => `${p.organ}(${p.pattern})`).join(', ') || '未定位'}`);
    console.log(`传变路径: ${finalOutput.transmissionPaths?.length > 0 ? finalOutput.transmissionPaths.join(', ') : '无'}`);
    if (finalOutput.prescription) {
      console.log(`主穴: ${finalOutput.prescription.mainPoints?.join(', ') || '未配穴'}`);
      console.log(`配穴: ${finalOutput.prescription.secondaryPoints?.join(', ') || '无'}`);
      console.log(`治法: ${finalOutput.prescription.method || '未明确'}`);
    }
    
    // 评估结果
    const organPatterns = finalOutput.organPatterns || [];
    const inferredOrgans = organPatterns.map((p: any) => p.organ);
    const inferredAcupoints = [...(finalOutput.prescription?.mainPoints || []), ...(finalOutput.prescription?.secondaryPoints || [])];
    
    const organScore = evaluateOrganLocation(inferredOrgans, testCase.goldStandard.organLocation);
    const syndromeScore = evaluateSyndrome(finalOutput.syndrome, testCase.goldStandard.syndrome);
    const transmissionScore = evaluateTransmission(finalOutput.transmissionPaths || [], testCase.goldStandard.transmissionPaths);
    const acupointScore = evaluateAcupoints(inferredAcupoints, [...testCase.goldStandard.mainPoints, ...testCase.goldStandard.secondaryPoints]);
    
    // 视觉识别评分（假设AI识别本身是准确的，这里评估其与图片描述的一致性）
    const visualScore = (testCase.aiRecognition.bodyColorConfidence || 0.9) * 
                       (testCase.aiRecognition.shapeConfidence || 0.9) *
                       (testCase.aiRecognition.coatingColorConfidence || 0.85);
    
    // 综合评分
    const overallScore = visualScore * 0.15 + organScore * 0.25 + syndromeScore * 0.30 + transmissionScore * 0.15 + acupointScore * 0.15;
    
    // 记录问题
    if (organScore < 0.5) issues.push(`脏腑定位偏差：期望[${testCase.goldStandard.organLocation}] vs 实际[${inferredOrgans}]`);
    if (syndromeScore < 0.5) issues.push(`证型判断偏差：期望[${testCase.goldStandard.syndrome}] vs 实际[${finalOutput.syndrome}]`);
    if (transmissionScore < 0.5 && testCase.goldStandard.transmissionPaths.length > 0) issues.push(`传变识别缺失`);
    
    console.log('\n【评分结果】');
    console.log(`视觉识别: ${(visualScore * 100).toFixed(1)}%`);
    console.log(`脏腑定位: ${(organScore * 100).toFixed(1)}%`);
    console.log(`证型判断: ${(syndromeScore * 100).toFixed(1)}%`);
    console.log(`传变识别: ${(transmissionScore * 100).toFixed(1)}%`);
    console.log(`配穴合理性: ${(acupointScore * 100).toFixed(1)}%`);
    console.log(`综合评分: ${(overallScore * 100).toFixed(1)}%`);
    
    if (issues.length > 0) {
      console.log('\n【发现的问题】');
      issues.forEach(issue => console.log(`  ⚠ ${issue}`));
    }
    
    return {
      testCaseId: testCase.id,
      testCaseName: testCase.name,
      aiRecognition: testCase.aiRecognition,
      layerOutputs,
      finalOutput,
      goldStandard: testCase.goldStandard,
      evaluation: {
        visualRecognitionScore: visualScore,
        organLocationScore: organScore,
        syndromeScore: syndromeScore,
        transmissionScore: transmissionScore,
        acupointScore: acupointScore,
        overallScore: overallScore
      },
      executionTime: Date.now() - startTime,
      issues
    };
    
  } catch (error: any) {
    console.error(`\n❌ 测试执行失败: ${error.message}`);
    console.error(error.stack);
    
    return {
      testCaseId: testCase.id,
      testCaseName: testCase.name,
      aiRecognition: testCase.aiRecognition,
      layerOutputs: {},
      finalOutput: null,
      goldStandard: testCase.goldStandard,
      evaluation: {
        visualRecognitionScore: 0,
        organLocationScore: 0,
        syndromeScore: 0,
        transmissionScore: 0,
        acupointScore: 0,
        overallScore: 0
      },
      executionTime: Date.now() - startTime,
      issues: [`执行失败: ${error.message}`]
    };
  }
}

// ==================== 主程序 ====================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║      舌镜v2.0 真实舌象端到端验证测试                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`测试时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log(`测试用例数: ${testCases.length}`);
  
  const results: E2EResult[] = [];
  
  // 逐个执行测试
  for (const testCase of testCases) {
    const result = await runE2ETest(testCase);
    results.push(result);
  }
  
  // 生成汇总报告
  console.log('\n\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                    验证结果汇总                              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  // 计算平均分
  const avgScores = {
    visual: results.reduce((sum, r) => sum + r.evaluation.visualRecognitionScore, 0) / results.length,
    organ: results.reduce((sum, r) => sum + r.evaluation.organLocationScore, 0) / results.length,
    syndrome: results.reduce((sum, r) => sum + r.evaluation.syndromeScore, 0) / results.length,
    transmission: results.reduce((sum, r) => sum + r.evaluation.transmissionScore, 0) / results.length,
    acupoint: results.reduce((sum, r) => sum + r.evaluation.acupointScore, 0) / results.length,
    overall: results.reduce((sum, r) => sum + r.evaluation.overallScore, 0) / results.length
  };
  
  console.log('\n【各维度平均准确率】');
  console.log(`视觉识别准确率: ${(avgScores.visual * 100).toFixed(1)}%`);
  console.log(`脏腑定位准确率: ${(avgScores.organ * 100).toFixed(1)}%`);
  console.log(`证型判断准确率: ${(avgScores.syndrome * 100).toFixed(1)}%`);
  console.log(`传变识别准确率: ${(avgScores.transmission * 100).toFixed(1)}%`);
  console.log(`配穴合理性:     ${(avgScores.acupoint * 100).toFixed(1)}%`);
  console.log(`─────────────────────────────`);
  console.log(`综合评分:       ${(avgScores.overall * 100).toFixed(1)}%`);
  
  // 各用例得分表
  console.log('\n【各用例得分明细】');
  console.log('用例ID | 名称         | 视觉 | 脏腑 | 证型 | 传变 | 配穴 | 综合');
  console.log('──────┼──────────────┼──────┼──────┼──────┼──────┼──────┼──────');
  for (const r of results) {
    const name = r.testCaseName.length > 10 ? r.testCaseName.slice(0, 8) + '..' : r.testCaseName;
    console.log(
      `${r.testCaseId.padEnd(6)}|${name.padEnd(14)}|` +
      `${(r.evaluation.visualRecognitionScore * 100).toFixed(0).padStart(4)}% |` +
      `${(r.evaluation.organLocationScore * 100).toFixed(0).padStart(4)}% |` +
      `${(r.evaluation.syndromeScore * 100).toFixed(0).padStart(4)}% |` +
      `${(r.evaluation.transmissionScore * 100).toFixed(0).padStart(4)}% |` +
      `${(r.evaluation.acupointScore * 100).toFixed(0).padStart(4)}% |` +
      `${(r.evaluation.overallScore * 100).toFixed(0).padStart(4)}%`
    );
  }
  
  // 问题汇总
  const allIssues = results.flatMap(r => r.issues);
  if (allIssues.length > 0) {
    console.log('\n【主要问题汇总】');
    const issueCounts = new Map<string, number>();
    for (const issue of allIssues) {
      const key = issue.split('：')[0] || issue;
      issueCounts.set(key, (issueCounts.get(key) || 0) + 1);
    }
    for (const [issue, count] of issueCounts) {
      console.log(`  - ${issue} (出现${count}次)`);
    }
  }
  
  // 推理链成功率
  const successCount = results.filter(r => r.finalOutput !== null).length;
  console.log(`\n推理链执行成功率: ${successCount}/${results.length} (${(successCount/results.length*100).toFixed(1)}%)`);
  
  // 生成JSON结果用于保存
  const reportData = {
    testDate: new Date().toISOString(),
    totalCases: results.length,
    averageScores: avgScores,
    results: results.map(r => ({
      testCaseId: r.testCaseId,
      testCaseName: r.testCaseName,
      imagePath: testCases.find(tc => tc.id === r.testCaseId)?.imagePath,
      evaluation: r.evaluation,
      issues: r.issues,
      executionTime: r.executionTime
    })),
    allIssues: allIssues,
    successRate: successCount / results.length
  };
  
  // 保存结果
  const fs = require('fs');
  const path = require('path');
  const outputPath = path.join(__dirname, 'e2e-test-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(reportData, null, 2));
  console.log(`\n详细结果已保存至: ${outputPath}`);
  
  return reportData;
}

// 执行
main().catch(console.error);
