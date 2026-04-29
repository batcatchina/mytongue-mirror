/**
 * 舌诊辨证本地规则引擎 v1.0
 * 基于主人的辨证规则树v2.0构建
 * 100%忠实于主人临床规则，不含AI自由发挥
 */

import {
  TongueFeatures,
  DiagnosisRule,
  SyndromeResult,
  AcupointSelection,
  AcupunctureMethod,
  tongueColorRules,
  tongueColorDistributionRules,
  tongueShapeRules,
  coatingColorRules,
  coatingTextureRules,
  tongueStateRules,
  tongueBodyCoatingRules,
  tongueShapeCoatingRules,
  tongueStateBodyRules,
  threeDimensionalRules,
  huiXiRules,
  allRuleCategories,
  getTotalRuleCount,
} from './diagnosisRules';

// ==================== 规则匹配引擎核心 ====================

/**
 * 规则匹配引擎类
 * 实现从复合规则到单特征规则的逐级匹配
 */
export class DiagnosisEngine {
  private rules: DiagnosisRule[] = [];
  
  constructor() {
    this.loadAllRules();
  }
  
  /**
   * 加载所有规则（按优先级排序）
   */
  private loadAllRules(): void {
    // 按优先级从高到低加载规则
    this.rules = [
      ...threeDimensionalRules,           // 三维综合（最高权重）
      ...tongueStateBodyRules,            // 舌态+舌质复合
      ...tongueBodyCoatingRules,          // 舌质+舌苔复合
      ...tongueShapeCoatingRules,          // 舌形+舌苔复合
      ...tongueStateRules,                // 舌态单特征
      ...tongueColorRules,                // 舌色单特征
      ...tongueColorDistributionRules,     // 舌色分布
      ...tongueShapeRules,                 // 舌形单特征
      ...coatingColorRules,               // 苔色单特征
      ...coatingTextureRules,             // 苔质单特征
    ];
    
    console.log(`[规则引擎] 加载了 ${this.rules.length} 条辨证规则`);
  }
  
  /**
   * 检查单条件是否匹配
   */
  private matchCondition(
    conditionValue: string | boolean | undefined,
    featureValue: string | boolean | undefined
  ): boolean {
    if (conditionValue === undefined) return true; // 条件未定义，匹配
    if (featureValue === undefined) return false;
    
    if (typeof conditionValue === 'boolean' && typeof featureValue === 'boolean') {
      return conditionValue === featureValue;
    }
    
    if (typeof conditionValue === 'string' && typeof featureValue === 'string') {
      return conditionValue === featureValue;
    }
    
    return false;
  }
  
  /**
   * 检查规则条件是否完全匹配
   */
  private matchRule(rule: DiagnosisRule, features: TongueFeatures): boolean {
    const conditions = rule.conditions;
    
    // 检查舌色
    if (!this.matchCondition(conditions.tongueColor, features.tongueColor)) {
      return false;
    }
    
    // 检查舌形
    if (!this.matchCondition(conditions.tongueShape, features.tongueShape)) {
      return false;
    }
    
    // 检查苔色
    if (!this.matchCondition(conditions.coatingColor, features.coatingColor)) {
      return false;
    }
    
    // 检查苔质
    if (!this.matchCondition(conditions.coatingTexture, features.coatingTexture)) {
      return false;
    }
    
    // 检查润燥
    if (!this.matchCondition(conditions.coatingMoisture, features.coatingMoisture)) {
      return false;
    }
    
    // 检查舌态
    if (!this.matchCondition(conditions.tongueState, features.tongueState)) {
      return false;
    }
    
    // 检查齿痕
    if (!this.matchCondition(conditions.teethMark, features.teethMark)) {
      return false;
    }
    
    // 检查裂纹
    if (!this.matchCondition(conditions.crack, features.crack)) {
      return false;
    }
    
    // 检查分区特征
    if (conditions.regionFeatures && features.regionFeatures) {
      for (const condRegion of conditions.regionFeatures) {
        const matchRegion = features.regionFeatures.find(
          f => f.region === condRegion.region
        );
        if (!matchRegion) return false;
        if (condRegion.color && matchRegion.color !== condRegion.color) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  /**
   * 计算规则匹配得分
   */
  private calculateMatchScore(rule: DiagnosisRule, features: TongueFeatures): number {
    let score = 0;
    const conditions = rule.conditions;
    
    // 计算匹配的条件数量
    let totalConditions = 0;
    let matchedConditions = 0;
    
    // 舌色匹配
    if (conditions.tongueColor !== undefined) {
      totalConditions++;
      if (features.tongueColor === conditions.tongueColor) matchedConditions++;
    }
    
    // 舌形匹配
    if (conditions.tongueShape !== undefined) {
      totalConditions++;
      if (features.tongueShape === conditions.tongueShape) matchedConditions++;
    }
    
    // 苔色匹配
    if (conditions.coatingColor !== undefined) {
      totalConditions++;
      if (features.coatingColor === conditions.coatingColor) matchedConditions++;
    }
    
    // 苔质匹配
    if (conditions.coatingTexture !== undefined) {
      totalConditions++;
      if (features.coatingTexture === conditions.coatingTexture) matchedConditions++;
    }
    
    // 润燥匹配
    if (conditions.coatingMoisture !== undefined) {
      totalConditions++;
      if (features.coatingMoisture === conditions.coatingMoisture) matchedConditions++;
    }
    
    // 舌态匹配
    if (conditions.tongueState !== undefined) {
      totalConditions++;
      if (features.tongueState === conditions.tongueState) matchedConditions++;
    }
    
    // 齿痕匹配
    if (conditions.teethMark !== undefined) {
      totalConditions++;
      if (features.teethMark === conditions.teethMark) matchedConditions++;
    }
    
    // 裂纹匹配
    if (conditions.crack !== undefined) {
      totalConditions++;
      if (features.crack === conditions.crack) matchedConditions++;
    }
    
    // 基础匹配度
    if (totalConditions > 0) {
      score = (matchedConditions / totalConditions) * rule.result.weight;
    } else {
      score = rule.result.weight;
    }
    
    // 舌态危急优先加分
    if (features.tongueState === '强硬' || features.tongueState === '痿软' || features.tongueState === '歪斜') {
      score += 10;
    }
    
    return score;
  }
  
  /**
   * 执行规则匹配
   */
  diagnose(features: TongueFeatures, maxResults: number = 3): SyndromeResult[] {
    console.log('[规则引擎] 开始辨证分析...');
    console.log('[规则引擎] 输入特征:', JSON.stringify(features, null, 2));
    
    const matchedRules: { rule: DiagnosisRule; score: number }[] = [];
    
    // 遍历所有规则进行匹配
    for (const rule of this.rules) {
      if (this.matchRule(rule, features)) {
        const score = this.calculateMatchScore(rule, features);
        matchedRules.push({ rule, score });
        console.log(`[规则引擎] 匹配规则: ${rule.name} (权重:${rule.result.weight}, 得分:${score.toFixed(2)})`);
      }
    }
    
    // 按得分排序
    matchedRules.sort((a, b) => b.score - a.score);
    
    // 取top N结果
    const topResults = matchedRules.slice(0, maxResults);
    
    // 转换为结果格式
    const results: SyndromeResult[] = topResults.map(({ rule, score }) => ({
      syndrome: rule.result.syndrome,
      pathogenesis: rule.result.pathogenesis,
      treatment: rule.result.treatment,
      mainPoints: rule.result.mainPoints,
      secondaryPoints: rule.result.secondaryPoints,
      organLocation: rule.result.organLocation,
      confidence: Math.min(score / rule.result.weight, 1) * 100,
      matchedRuleId: rule.id,
      matchedRuleName: rule.name,
      priority: rule.result.priority,
      isLocalRule: true,
    }));
    
    console.log(`[规则引擎] 匹配完成，共找到 ${matchedRules.length} 条匹配规则`);
    console.log('[规则引擎] 最终结果:', JSON.stringify(results, null, 2));
    
    return results;
  }
  
  /**
   * 获取最佳匹配结果
   */
  diagnoseBest(features: TongueFeatures): SyndromeResult | null {
    const results = this.diagnose(features, 1);
    return results.length > 0 ? results[0] : null;
  }
}

// ==================== 选穴方案生成 ====================

/**
 * 根据辨证结果生成完整选穴方案
 */
export function generateAcupointSelection(result: SyndromeResult): AcupointSelection {
  // 根据证型判断刺法
  let technique: '补法' | '泻法' | '平补平泻' = '平补平泻';
  let needleRetention = 25;
  let moxibustion = '一般不灸';
  let frequency = '每日或隔日1次';
  let course = '10次为一疗程';
  let notes = '';
  
  // 根据优先级判断虚实
  if (result.priority === 'critical' || result.priority === 'high') {
    if (result.syndrome.includes('虚') || result.syndrome.includes('不足')) {
      technique = '补法';
      moxibustion = '可灸，重症多灸';
    } else if (result.syndrome.includes('热') || result.syndrome.includes('盛') || result.syndrome.includes('瘀')) {
      technique = '泻法';
      moxibustion = '不灸';
    } else {
      technique = '平补平泻';
    }
  }
  
  // 特殊证型处理
  if (result.syndrome.includes('肝风') || result.syndrome.includes('热闭')) {
    needleRetention = 30;
    notes = '急症处理，强刺激';
  }
  
  if (result.syndrome.includes('阴虚')) {
    moxibustion = '忌灸';
    notes = '滋阴为主';
  }
  
  if (result.syndrome.includes('阳虚') || result.syndrome.includes('寒凝')) {
    needleRetention = 35;
    moxibustion = '重灸';
    notes = '温阳散寒';
  }
  
  // 会穴郗穴配穴
  let huiPoint: string | undefined;
  let xiPoint: string | undefined;
  
  for (const hxRule of huiXiRules) {
    if (result.matchedRuleName.includes(hxRule.tongueFeature) || 
        result.syndrome.includes(hxRule.pathogenesis.split('（')[0])) {
      huiPoint = hxRule.huiPoint;
      xiPoint = hxRule.xiPoint;
      break;
    }
  }
  
  // 如果没有匹配到会穴郗穴，使用默认值
  if (!huiPoint) {
    if (result.syndrome.includes('血瘀')) {
      huiPoint = '膈俞（血会）';
    } else if (result.syndrome.includes('痰湿')) {
      huiPoint = '中脘（腑会）';
    } else if (result.syndrome.includes('气虚') || result.syndrome.includes('气血')) {
      huiPoint = '膻中（气会）';
    }
  }
  
  return {
    mainPoints: result.mainPoints,
    secondaryPoints: result.secondaryPoints,
    huiPoint,
    xiPoint,
    method: {
      technique,
      needleRetention,
      moxibustion,
      frequency,
      course,
      notes,
    },
  };
}

// ==================== 完整辨证流程 ====================

export interface DiagnosisInput {
  tongueColor: string;
  tongueShape: string;
  tongueState: string;
  coatingColor: string;
  coatingTexture: string;
  coatingMoisture: string;
  teethMark?: boolean;
  crack?: boolean;
  regionFeatures?: TongueFeatures['regionFeatures'];
}

export interface DiagnosisOutput {
  primaryResult: SyndromeResult;
  alternativeResults: SyndromeResult[];
  acupointSelection: AcupointSelection;
  clinicalNotes: string[];
  isLocalRuleBased: boolean;
}

/**
 * 完整辨证分析（整合规则引擎）
 */
export function diagnose(
  input: DiagnosisInput,
  useLocalEngine: boolean = true,
  botResult?: any
): DiagnosisOutput {
  console.log('[辨证分析] 开始分析...');
  console.log('[辨证分析] 输入:', JSON.stringify(input, null, 2));
  console.log('[辨证分析] 使用本地规则引擎:', useLocalEngine);
  
  const features: TongueFeatures = {
    tongueColor: input.tongueColor,
    tongueShape: input.tongueShape,
    tongueState: input.tongueState,
    coatingColor: input.coatingColor,
    coatingTexture: input.coatingTexture,
    coatingMoisture: input.coatingMoisture,
    teethMark: input.teethMark || false,
    crack: input.crack || false,
    regionFeatures: input.regionFeatures,
  };
  
  // 创建规则引擎实例
  const engine = new DiagnosisEngine();
  
  // 执行本地规则匹配
  const allResults = engine.diagnose(features, 3);
  
  if (allResults.length === 0) {
    console.warn('[辨证分析] 本地规则未匹配到结果');
    
    // 如果本地规则未匹配，返回默认结果或使用Bot结果
    if (botResult) {
      return {
        primaryResult: {
          syndrome: botResult.syndrome || '待明确',
          pathogenesis: botResult.pathogenesis || '待分析',
          treatment: botResult.treatment || '待确定',
          mainPoints: botResult.mainPoints || [],
          secondaryPoints: botResult.secondaryPoints || [],
          organLocation: botResult.organLocation || [],
          confidence: 50,
          matchedRuleId: 'BOT-FALLBACK',
          matchedRuleName: 'Bot补充推理',
          priority: 'medium',
          isLocalRule: false,
        },
        alternativeResults: [],
        acupointSelection: generateAcupointSelection({
          syndrome: botResult.syndrome || '待明确',
          pathogenesis: botResult.pathogenesis || '待分析',
          treatment: botResult.treatment || '待确定',
          mainPoints: botResult.mainPoints || [],
          secondaryPoints: botResult.secondaryPoints || [],
          organLocation: botResult.organLocation || [],
          confidence: 50,
          matchedRuleId: 'BOT-FALLBACK',
          matchedRuleName: 'Bot补充推理',
          priority: 'medium',
          isLocalRule: false,
        }),
        clinicalNotes: ['本地规则未匹配，请结合临床实际判断'],
        isLocalRuleBased: false,
      };
    }
    
    throw new Error('无法匹配到有效的辨证规则，请检查舌象特征输入');
  }
  
  // 提取主要结果和备选结果
  const [primaryResult, ...alternativeResults] = allResults;
  
  // 生成选穴方案
  const acupointSelection = generateAcupointSelection(primaryResult);
  
  // 生成临床备注
  const clinicalNotes: string[] = [];
  
  if (primaryResult.priority === 'critical') {
    clinicalNotes.push('⚠️ 此为危重证型，需密切观察病情变化');
    clinicalNotes.push('建议及时采取急救措施');
  }
  
  if (primaryResult.priority === 'high') {
    clinicalNotes.push('此证型较重，需积极治疗');
  }
  
  // 根据证型添加特殊注意事项
  if (primaryResult.syndrome.includes('阴虚')) {
    clinicalNotes.push('滋阴为主，忌用温燥药物');
  }
  
  if (primaryResult.syndrome.includes('阳虚')) {
    clinicalNotes.push('温阳为主，可配合艾灸');
  }
  
  if (primaryResult.syndrome.includes('热')) {
    clinicalNotes.push('清热为主，忌用温灸');
  }
  
  console.log('[辨证分析] 分析完成');
  console.log('[辨证分析] 主要结果:', primaryResult.syndrome);
  
  return {
    primaryResult,
    alternativeResults,
    acupointSelection,
    clinicalNotes,
    isLocalRuleBased: true,
  };
}

// ==================== 导出实例 ====================

// 创建单例规则引擎实例
let engineInstance: DiagnosisEngine | null = null;

export function getDiagnosisEngine(): DiagnosisEngine {
  if (!engineInstance) {
    engineInstance = new DiagnosisEngine();
  }
  return engineInstance;
}

// 快速辨证函数
export function quickDiagnose(input: DiagnosisInput): SyndromeResult | null {
  const engine = getDiagnosisEngine();
  const features: TongueFeatures = {
    tongueColor: input.tongueColor,
    tongueShape: input.tongueShape,
    tongueState: input.tongueState,
    coatingColor: input.coatingColor,
    coatingTexture: input.coatingTexture,
    coatingMoisture: input.coatingMoisture,
    teethMark: input.teethMark || false,
    crack: input.crack || false,
    regionFeatures: input.regionFeatures,
  };
  return engine.diagnoseBest(features);
}

// ==================== 规则统计信息 ====================

export interface RuleStatistics {
  totalRules: number;
  categoryCounts: Record<string, number>;
  priorityCounts: Record<string, number>;
}

export function getRuleStatistics(): RuleStatistics {
  const categoryCounts: Record<string, number> = {};
  const priorityCounts: Record<string, number> = {
    normal: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };
  
  for (const [category, rules] of Object.entries(allRuleCategories)) {
    categoryCounts[category] = rules.length;
    for (const rule of rules) {
      priorityCounts[rule.result.priority]++;
    }
  }
  
  return {
    totalRules: getTotalRuleCount(),
    categoryCounts,
    priorityCounts,
  };
}

// 导出类型供外部使用
export type { TongueFeatures, DiagnosisRule, SyndromeResult, AcupointSelection, AcupunctureMethod };
