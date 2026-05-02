/**
 * Layer4 处理器：综合推理层 v2.0
 * 职责：综合推理 → 传变关系+配穴方案
 * 
 * 子盗母气 / 相克传变 / 经脉辨证 / 配穴组合
 * 
 * v2.1 修复：锚定脏腑定位、根因归因不指向"心"
 */

import type { LayerInput, LayerOutput, InferenceNode, OrganPattern, Prescription } from '@/types/inference';
import type { TongueAnalysisResult } from '@/types/tongue';
import { BaseLayerProcessor } from '../core/LayerProcessor';
import { createPrescriptionNode, createPatternNode } from '../core/InferenceNode';
import { TransmissionEngine } from '../core/TransmissionEngine';

/**
 * 证型推理规则配置 v2.1 - 多特征加权评分机制
 * 
 * 设计原则：
 * 1. 多特征综合评分，而非单特征一票否决
 * 2. 特征协同增强：多个特征指向同一证型，置信度提升
 * 3. 特征冲突衰减：单一特征指向某证型，置信度打折
 * 4. 齿痕是脾虚标志，不应作为肝郁的唯一依据
 */
const SYNDROME_RULES: Array<{
  pattern: string | RegExp;
  /** 舌色特征检查 */
  tongueColorCheck?: (analysis: TongueAnalysisResult) => boolean;
  /** 舌形特征检查 */
  tongueShapeCheck?: (analysis: TongueAnalysisResult) => boolean;
  /** 苔质特征检查 */
  coatingCheck?: (analysis: TongueAnalysisResult) => boolean;
  /** 脏腑特征检查 */
  organCheck?: (patterns: OrganPattern[]) => boolean;
  /** 特征权重（用于多特征评分） */
  featureWeights?: {
    tongueColor?: number;
    tongueShape?: number;
    coating?: number;
    organ?: number;
    specialFeature?: number;
  };
  /** 特殊特征（如齿痕、裂纹等） */
  specialFeatures?: Array<{
    check: (analysis: TongueAnalysisResult) => boolean;
    weight: number;
  }>;
  label: string;
  description: string;
  rootCause: string;
  method: string;
  baseConfidence: number;
}> = [
  // ===== 脾虚湿盛证 =====
  // 核心特征：胖大舌 + 齿痕 + 白厚苔/腻苔
  {
    pattern: /脾.*虚|脾湿/i,
    tongueShapeCheck: (analysis) => analysis.shape === '胖大' || analysis.hasTeethMark,
    coatingCheck: (analysis) => 
      analysis.coatingColor === '白厚' || 
      analysis.coatingTexture === '腻' ||
      analysis.coatingTexture === '厚',
    organCheck: (patterns) => patterns.some(p => p.organ === '脾'),
    featureWeights: { tongueShape: 0.35, organ: 0.30, coating: 0.25, specialFeature: 0.10 },
    specialFeatures: [
      { check: (a) => a.hasTeethMark, weight: 0.85 }, // 齿痕是脾虚的标志
      { check: (a) => a.shape === '胖大', weight: 0.80 }, // 胖大舌
    ],
    label: '脾虚湿盛证',
    description: '脾失健运，水湿内停',
    rootCause: '脾气虚弱，运化失常',
    method: '健脾化湿',
    baseConfidence: 0.82,
  },

  // ===== 气血两虚证 =====
  // 核心特征：淡白舌 + 半透明/淡白 + 瘦薄
  {
    pattern: /气血.*虚|虚.*证/i,
    tongueColorCheck: (analysis) => analysis.bodyColor === '淡白',
    tongueShapeCheck: (analysis) => analysis.isSemitransparent || analysis.shape === '瘦薄',
    organCheck: (patterns) => patterns.some(p => p.organ === '脾' || p.organ === '心' || p.organ === '肾'),
    featureWeights: { tongueColor: 0.40, tongueShape: 0.35, organ: 0.25 },
    specialFeatures: [
      { check: (a) => a.isSemitransparent, weight: 0.95 }, // 半透明 = 气血亏虚严重
      { check: (a) => a.bodyColor === '淡白', weight: 0.85 },
    ],
    label: '气血两虚证',
    description: '三焦气血亏虚，脏腑失养',
    rootCause: '三焦气血亏虚，脏腑失养',
    method: '补益气血，调理脏腑',
    baseConfidence: 0.85,
  },

  // ===== 寒凝血瘀证 =====
  // 核心特征：青紫舌 + 瘀斑
  {
    pattern: /血瘀|瘀/i,
    tongueColorCheck: (analysis) => analysis.bodyColor === '青紫' || analysis.bodyColor === '紫',
    tongueShapeCheck: (analysis) => analysis.hasEcchymosis,
    organCheck: (patterns) => patterns.some(p => p.organ === '肝' || p.organ === '心'),
    featureWeights: { tongueColor: 0.45, tongueShape: 0.35, organ: 0.20 },
    specialFeatures: [
      { check: (a) => a.hasEcchymosis, weight: 0.90 },
      { check: (a) => a.bodyColor === '青紫', weight: 0.95 }, // 青紫是寒凝的特征
    ],
    label: '寒凝血瘀证',
    description: '寒凝经脉，血行瘀滞',
    rootCause: '寒凝血瘀，运行不畅',
    method: '温经活血，化瘀止痛',
    baseConfidence: 0.88,
  },

  // ===== 气滞血瘀证 =====
  // 核心特征：紫舌 + 无寒象（但非青紫）
  {
    pattern: /血瘀|瘀/i,
    tongueColorCheck: (analysis) => analysis.bodyColor === '紫' && !analysis.bodyColor.includes('青'),
    tongueShapeCheck: (analysis) => analysis.hasEcchymosis || analysis.coatingTexture === '腻',
    organCheck: (patterns) => patterns.some(p => p.organ === '肝'),
    featureWeights: { tongueColor: 0.40, tongueShape: 0.30, organ: 0.30 },
    specialFeatures: [
      { check: (a) => a.hasEcchymosis, weight: 0.85 },
    ],
    label: '气滞血瘀证',
    description: '气行不畅，血行瘀滞',
    rootCause: '气滞血瘀，运行不畅',
    method: '活血化瘀，行气止痛',
    baseConfidence: 0.85,
  },

  // ===== 肝郁化火证 =====
  // 核心特征：舌红 + 肝区热/火（不能仅凭齿痕）
  {
    pattern: /肝.*热|热.*肝|肝火/i,
    tongueColorCheck: (analysis) => analysis.bodyColor === '红',
    organCheck: (patterns) => patterns.some(p => p.organ === '肝' && (p.pattern.includes('热') || p.pattern.includes('火'))),
    featureWeights: { tongueColor: 0.40, organ: 0.50, specialFeature: 0.10 },
    specialFeatures: [
      { check: (a) => a.zoneFeatures?.some(z => z.color === '红' || z.colorIntensity === '偏红'), weight: 0.75 },
    ],
    label: '肝郁化火证',
    description: '肝气郁结，久而化火',
    rootCause: '肝气郁结，疏泄失常',
    method: '疏肝解郁，清热泻火',
    baseConfidence: 0.82,
  },

  // ===== 肝郁血虚证 =====
  // 核心特征：肝区异常 + 淡红/淡白（不能仅凭齿痕）
  {
    pattern: /肝.*虚|肝郁/i,
    tongueColorCheck: (analysis) => analysis.bodyColor === '淡红' || analysis.bodyColor === '淡白',
    organCheck: (patterns) => patterns.some(p => p.organ === '肝' && p.pattern.includes('虚')),
    featureWeights: { tongueColor: 0.35, organ: 0.50, specialFeature: 0.15 },
    specialFeatures: [
      { check: (a) => a.zoneFeatures?.some(z => z.color === '淡红' && (z.side === 'left' || z.side === 'right')), weight: 0.60 },
    ],
    label: '肝郁血虚证',
    description: '肝气郁结，血液生化不足',
    rootCause: '肝气郁结，血液生化不足',
    method: '疏肝解郁，养血柔肝',
    baseConfidence: 0.80,
  },

  // ===== 阴虚火旺证 =====
  // 核心特征：红舌/绛舌 + 裂纹
  {
    pattern: /阴虚|虚火/i,
    tongueColorCheck: (analysis) => analysis.bodyColor === '红' || analysis.bodyColor === '绛',
    tongueShapeCheck: (analysis) => analysis.hasCrack || analysis.coatingColor === '少苔',
    organCheck: (patterns) => patterns.some(p => 
      p.organ === '肾' || p.organ === '心' || p.organ === '胃'
    ),
    featureWeights: { tongueColor: 0.40, tongueShape: 0.35, organ: 0.25 },
    specialFeatures: [
      { check: (a) => a.hasCrack, weight: 0.85 }, // 裂纹是阴虚的标志
      { check: (a) => a.bodyColor === '绛', weight: 0.90 }, // 绛舌是热入营血
      { check: (a) => a.coatingColor === '少苔' || a.coatingColor === '无苔', weight: 0.80 },
    ],
    label: '阴虚火旺证',
    description: '阴液不足，虚火内生',
    rootCause: '阴虚火旺，虚火灼津',
    method: '滋阴降火',
    baseConfidence: 0.85,
  },

  // ===== 脾胃湿热证 =====
  // 核心特征：黄苔 + 腻苔 + 脾胃区热
  {
    pattern: /湿热|脾胃.*热/i,
    tongueColorCheck: (analysis) => analysis.coatingColor === '黄',
    coatingCheck: (analysis) => analysis.coatingTexture === '腻' || analysis.coatingTexture === '厚',
    organCheck: (patterns) => patterns.some(p => (p.organ === '脾' || p.organ === '胃') && p.pattern.includes('热')),
    featureWeights: { tongueColor: 0.35, coating: 0.35, organ: 0.30 },
    specialFeatures: [
      { check: (a) => a.coatingColor === '黄', weight: 0.90 },
      { check: (a) => a.coatingTexture === '腻', weight: 0.85 },
    ],
    label: '脾胃湿热证',
    description: '湿热内蕴，脾胃不和',
    rootCause: '湿热内蕴，脾胃运化失常',
    method: '清热利湿，健脾和胃',
    baseConfidence: 0.82,
  },

  // ===== 下焦湿热证 =====
  // 核心特征：黄苔 + 腻苔 + 下焦区异常
  {
    pattern: /湿热|下焦.*湿/i,
    tongueColorCheck: (analysis) => analysis.coatingColor === '黄',
    coatingCheck: (analysis) => analysis.coatingTexture === '腻' || analysis.coatingTexture === '厚',
    organCheck: (patterns) => patterns.some(p => p.organ === '肾' || p.organ === '膀胱' || p.organ === '大肠'),
    featureWeights: { tongueColor: 0.35, coating: 0.35, organ: 0.30 },
    specialFeatures: [
      { check: (a) => a.coatingColor === '黄', weight: 0.90 },
      { check: (a) => a.coatingTexture === '腻', weight: 0.85 },
    ],
    label: '下焦湿热证',
    description: '湿热下注，膀胱/大肠失司',
    rootCause: '湿热下注，膀胱/大肠气化不利',
    method: '清热利湿，通利下焦',
    baseConfidence: 0.80,
  },

  // ===== 胃阴不足证 =====
  // 核心特征：剥苔/无苔 + 裂纹/红舌
  {
    pattern: /胃阴|阴虚|不足/i,
    tongueColorCheck: (analysis) => analysis.bodyColor === '红' || analysis.bodyColor === '淡红',
    tongueShapeCheck: (analysis) => analysis.coatingColor === '剥落' || analysis.coatingColor === '无苔' || analysis.hasCrack,
    organCheck: (patterns) => patterns.some(p => p.organ === '胃'),
    featureWeights: { tongueColor: 0.30, tongueShape: 0.45, organ: 0.25 },
    specialFeatures: [
      { check: (a) => a.coatingColor === '剥落' || a.coatingColor === '无苔', weight: 0.95 }, // 剥苔/无苔是胃阴不足的标志
      { check: (a) => a.hasCrack, weight: 0.70 },
    ],
    label: '胃阴不足证',
    description: '胃阴亏虚，胃失濡润',
    rootCause: '胃阴不足，胃失濡润',
    method: '滋阴养胃',
    baseConfidence: 0.82,
  },

  // ===== 气阴两虚证 =====
  // 核心特征：淡白/淡红 + 薄黄苔 + 气虚特征
  {
    pattern: /气阴.*虚|气虚.*阴虚/i,
    tongueColorCheck: (analysis) => analysis.bodyColor === '淡白' || analysis.bodyColor === '淡红' || analysis.bodyColor === '红',
    coatingCheck: (analysis) => analysis.coatingColor === '少苔' || analysis.coatingTexture === '薄',
    organCheck: (patterns) => patterns.some(p => p.organ === '脾' || p.organ === '肺' || p.organ === '肾'),
    featureWeights: { tongueColor: 0.35, coating: 0.35, organ: 0.30 },
    specialFeatures: [
      { check: (a) => a.coatingColor === '少苔' || a.coatingColor === '薄黄', weight: 0.85 },
      { check: (a) => a.hasTeethMark, weight: 0.60 }, // 可能有气虚
    ],
    label: '气阴两虚证',
    description: '气阴两虚，脏腑失养',
    rootCause: '气阴两虚，脏腑失养',
    method: '益气养阴',
    baseConfidence: 0.82,
  },

  // ===== 热入营血证 =====
  // 核心特征：绛舌 + 裂纹
  {
    pattern: /热入.*营血|营血.*热/i,
    tongueColorCheck: (analysis) => analysis.bodyColor === '绛',
    tongueShapeCheck: (analysis) => analysis.hasCrack,
    organCheck: (patterns) => patterns.some(p => p.organ === '心'),
    featureWeights: { tongueColor: 0.50, tongueShape: 0.30, organ: 0.20 },
    specialFeatures: [
      { check: (a) => a.bodyColor === '绛', weight: 0.95 }, // 绛舌是热入营血的标志
      { check: (a) => a.hasCrack, weight: 0.80 },
    ],
    label: '热入营血证',
    description: '热邪深入营血，耗伤营阴',
    rootCause: '热邪深入营血，灼伤营阴',
    method: '清营凉血，透热养阴',
    baseConfidence: 0.88,
  },
];

/**
 * 根本原因归因映射表
 * 锚定脏腑：根据Layer3识别的脏腑定位根本原因
 */
const ROOT_CAUSE_MAPPING: Record<string, string> = {
  '肝': '肝气郁结，疏泄失常',
  '胆': '胆气郁结，疏泄不利',
  '心': '心火亢盛或心阴不足',
  '脾': '脾气虚弱，运化失常',
  '胃': '胃气上逆或胃阴不足',
  '肺': '肺气不宣或肺阴不足',
  '肾': '肾精不足或肾阴亏虚',
  '小肠': '小肠泌别清浊功能失常',
  '大肠': '大肠传导功能失常',
  '膀胱': '膀胱气化功能失常',
};

/**
 * 证型特异性配穴规则 v2.1
 * 覆盖ACUPOINT_RULES的默认配穴逻辑
 */
const SYNDROME_PRESCRIPTION_RULES: Record<string, {
  mainPoints: string[];
  secondaryPoints: string[];
  technique: '补法' | '泻法' | '平补平泻';
  basis: string[];
}> = {
  '肝郁化火证': {
    mainPoints: ['太冲', '行间', '阳陵泉'],
    secondaryPoints: ['期门', '合谷', '曲池'],
    technique: '泻法',
    basis: ['太冲疏肝理气', '行间清肝火', '阳陵泉疏肝利胆'],
  },
  '肝郁血虚证': {
    mainPoints: ['太冲', '血海', '三阴交'],
    secondaryPoints: ['肝俞', '膈俞', '足三里'],
    technique: '平补平泻',
    basis: ['太冲疏肝解郁', '血海活血养血', '三阴交健脾养血'],
  },
  '气滞血瘀证': {
    mainPoints: ['血海', '膈俞', '三阴交'],
    secondaryPoints: ['太冲', '肝俞', '内关'],
    technique: '泻法',
    basis: ['血海活血化瘀', '膈俞为血会', '三阴交活血调经'],
  },
  '寒凝血瘀证': {
    mainPoints: ['血海', '膈俞', '三阴交'],
    secondaryPoints: ['太冲', '肝俞', '关元'],
    technique: '泻法',
    basis: ['血海活血化瘀', '膈俞为血会', '关元温经散寒'],
  },
  '气血两虚证': {
    mainPoints: ['气海', '足三里', '三阴交'],
    secondaryPoints: ['关元', '膈俞', '脾俞'],
    technique: '补法',
    basis: ['气海补气', '足三里益气健脾', '三阴交健脾养血'],
  },
  '脾虚湿盛证': {
    mainPoints: ['足三里', '阴陵泉', '中脘'],
    secondaryPoints: ['脾俞', '三阴交', '胃俞'],
    technique: '补法',
    basis: ['足三里益气健脾', '阴陵泉利湿', '中脘和胃化湿'],
  },
  '阴虚火旺证': {
    mainPoints: ['太溪', '照海', '三阴交'],
    secondaryPoints: ['肾俞', '心俞', '内关'],
    technique: '平补平泻',
    basis: ['太溪滋阴补肾', '照海清热降火', '三阴交健脾养阴'],
  },
  '脾胃湿热证': {
    mainPoints: ['足三里', '阴陵泉', '内庭'],
    secondaryPoints: ['脾俞', '胃俞', '合谷'],
    technique: '泻法',
    basis: ['足三里健脾清热', '阴陵泉利湿', '内庭清胃火'],
  },
  '下焦湿热证': {
    mainPoints: ['阴陵泉', '三阴交', '膀胱俞'],
    secondaryPoints: ['肾俞', '中极', '太溪'],
    technique: '泻法',
    basis: ['阴陵泉利下焦湿', '三阴交健脾利湿', '膀胱俞通利下焦'],
  },
  '胃阴不足证': {
    mainPoints: ['足三里', '三阴交', '中脘'],
    secondaryPoints: ['胃俞', '内关', '公孙'],
    technique: '平补平泻',
    basis: ['足三里和胃养阴', '三阴交健脾养阴', '中脘和胃'],
  },
  '气阴两虚证': {
    mainPoints: ['气海', '太溪', '三阴交'],
    secondaryPoints: ['关元', '肾俞', '足三里'],
    technique: '补法',
    basis: ['气海补气', '太溪滋阴', '三阴交健脾养阴'],
  },
  '热入营血证': {
    mainPoints: ['曲泽', '委中', '血海'],
    secondaryPoints: ['心俞', '膈俞', '内关'],
    technique: '泻法',
    basis: ['曲泽清营热', '委中凉血', '血海活血凉血'],
  },
};

/**
 * Layer4 综合推理处理器
 */
export class Layer4Processor extends BaseLayerProcessor {
  readonly layer = 4;
  readonly name = '综合推理层';
  readonly description = '传变关系 + 配穴方案';
  
  /** 传变引擎 */
  private transmissionEngine: TransmissionEngine;
  
  /** 当前识别的证型 */
  private currentSyndrome: { label: string; description: string; rootCause: string; method: string } | null = null;
  
  constructor() {
    super();
    this.transmissionEngine = new TransmissionEngine();
  }
  
  /**
   * 处理综合推理
   */
  process(input: LayerInput): LayerOutput {
    const previousLayerOutput = input.previousLayerOutput;
    const tongueAnalysis = input.tongueAnalysis;
    
    if (!previousLayerOutput) {
      return this.createEmptyOutput();
    }
    
    const nodes: InferenceNode[] = [];
    
    // 1. 收集前三层的辨证结果
    const previousNodes = previousLayerOutput.nodes;
    
    // 2. 生成脏腑辨证汇总（按置信度排序，但保留所有脏腑）
    const organPatterns = this.generateOrganPatterns(previousNodes);
    
    // 3. 锚定主要脏腑：根据Layer3识别结果确定主脏腑
    const primaryOrgan = this.determinePrimaryOrgan(organPatterns, tongueAnalysis);
    
    // 4. 证型推理：使用锚定脏腑 + 舌象特征
    this.currentSyndrome = this.inferSyndrome(organPatterns, tongueAnalysis, primaryOrgan);
    
    // 5. 生成证型节点
    const syndromeNode = createPatternNode(
      this.generateNodeId('final-syndrome'),
      this.currentSyndrome.label,
      this.currentSyndrome.description,
      this.currentSyndrome.confidence || 0.80,
      this.generateSyndromeEvidence(organPatterns, tongueAnalysis),
      4
    );
    nodes.push(syndromeNode);
    
    // 6. 生成根本原因节点（锚定脏腑）
    const rootCauseNode = createPatternNode(
      this.generateNodeId('root-cause'),
      this.currentSyndrome.rootCause,
      `根本原因：${this.currentSyndrome.rootCause}`,
      0.85,
      [`主脏腑：${primaryOrgan}`],
      4
    );
    nodes.push(rootCauseNode);
    
    // 7. 分析传变关系
    const triggerFeatures = this.extractTriggerFeatures(previousNodes);
    const transmissions = this.transmissionEngine.analyzeTransmission(organPatterns, triggerFeatures);
    const transmissionNodes = this.transmissionEngine.buildTransmissionChain(organPatterns, transmissions);
    nodes.push(...transmissionNodes);
    
    // 8. 生成传变路径描述
    const transmissionPaths = this.transmissionEngine.generateTransmissionPaths(transmissions);
    
    // 9. 生成配穴方案（优先使用证型特异性配穴）
    const prescription = this.generatePrescription(organPatterns, tongueAnalysis);
    if (prescription) {
      const prescriptionNode = createPrescriptionNode(
        this.generateNodeId('prescription'),
        prescription.mainPoints,
        prescription.technique,
        prescription.confidence,
        4
      );
      nodes.push(prescriptionNode);
    }
    
    return {
      layer: 4,
      nodes,
      summary: {
        label: this.currentSyndrome.label,
        description: `${this.currentSyndrome.description}；根本原因：${this.currentSyndrome.rootCause}`,
        confidence: this.currentSyndrome.confidence || 0.80,
      },
      validationQuestions: this.generateValidationQuestions(organPatterns),
    };
  }
  
  /**
   * 生成脏腑辨证汇总
   */
  private generateOrganPatterns(nodes: InferenceNode[]): OrganPattern[] {
    const patterns: OrganPattern[] = [];
    
    // 从节点中提取脏腑辨证
    const organMap = new Map<string, OrganPattern>();
    
    for (const node of nodes) {
      if (node.type === 'organ') {
        const organ = node.metadata?.organLocation?.[0] || '';
        const existing = organMap.get(organ);
        
        if (!existing || node.conclusion.confidence > existing.confidence) {
          organMap.set(organ, {
            organ,
            pattern: node.conclusion.label,
            nature: node.metadata?.pathogenicNature || '',
            confidence: node.conclusion.confidence,
            mainSymptoms: node.conclusion.evidence,
            relatedNodeIds: [node.id],
          });
        }
      } else if (node.type === 'pattern') {
        // 从pattern节点中提取脏腑信息
        const description = node.conclusion.description;
        const organs = ['心', '肝', '脾', '肺', '肾', '胃', '胆', '小肠', '大肠', '膀胱'];
        
        for (const organ of organs) {
          if (description.includes(organ)) {
            const existing = organMap.get(organ);
            if (!existing || node.conclusion.confidence > existing.confidence) {
              organMap.set(organ, {
                organ,
                pattern: node.conclusion.label,
                nature: this.inferNatureFromPattern(node.conclusion.label),
                confidence: node.conclusion.confidence,
                mainSymptoms: node.conclusion.evidence,
                relatedNodeIds: [node.id],
              });
            }
          }
        }
      }
    }
    
    patterns.push(...Array.from(organMap.values()));
    
    // 按置信度排序
    return patterns.sort((a, b) => b.confidence - a.confidence);
  }
  
  /**
   * 锚定主要脏腑
   * 根据Layer3识别结果和舌象特征确定主脏腑
   */
  private determinePrimaryOrgan(patterns: OrganPattern[], analysis: TongueAnalysisResult): string {
    if (patterns.length === 0) {
      // 无脏腑模式时，根据舌象特征推断
      return this.inferPrimaryOrganFromTongue(analysis);
    }
    
    // 1. 优先检查是否有明确的肝区异常（肝郁类证型最常见漏诊）
    const liverPattern = patterns.find(p => p.organ === '肝');
    if (liverPattern && this.hasLiverZoneAbnormality(analysis)) {
      return '肝';
    }
    
    // 2. 检查是否有脾虚特征（齿痕、胖大舌）
    const spleenPattern = patterns.find(p => p.organ === '脾');
    if (spleenPattern && analysis.hasTeethMark) {
      return '脾';
    }
    
    // 3. 检查是否有血瘀特征
    if (analysis.bodyColor === '紫' || analysis.hasEcchymosis) {
      return '肝'; // 肝主疏泄，气滞血瘀常与肝相关
    }
    
    // 4. 检查是否有半透明舌
    if (analysis.isSemitransparent) {
      return '脾'; // 气血亏虚先责之脾
    }
    
    // 5. 默认返回置信度最高的脏腑
    return patterns[0].organ;
  }
  
  /**
   * 检查是否有肝区异常特征 v2.1
   * 【修复】齿痕不是肝区异常的唯一标志，齿痕更应考虑脾虚
   */
  private hasLiverZoneAbnormality(analysis: TongueAnalysisResult): boolean {
    if (!analysis.zoneFeatures) return false;
    
    // 肝区：舌中两侧（middleThird left/right）
    const liverZones = analysis.zoneFeatures.filter(
      z => z.position === 'middleThird' && (z.side === 'left' || z.side === 'right')
    );
    
    // 肝区颜色偏深或偏红 - 这是肝区异常的核心特征
    for (const zone of liverZones) {
      if (zone.colorIntensity === '偏深' || zone.colorIntensity === '偏红') {
        return true;
      }
      if (zone.color === '红' || zone.color === '绛') {
        return true;
      }
      // 【修复】移除齿痕作为肝区异常的唯一标志
      // 齿痕更应考虑脾虚，不能仅凭齿痕判断肝郁
    }
    
    return false;
  }
  
  /**
   * 从舌象特征推断主脏腑 v2.1
   * 【修复】齿痕应指向脾虚，不是肝郁
   */
  private inferPrimaryOrganFromTongue(analysis: TongueAnalysisResult): string {
    // 半透明 → 脾（气血生化之源，优先级最高）
    if (analysis.isSemitransparent) {
      return '脾';
    }
    
    // 齿痕 → 脾虚（舌边属脾，齿痕是脾虚的标志）
    if (analysis.hasTeethMark) {
      return '脾';
    }
    
    // 舌紫/青紫 → 肝（气滞血瘀）
    if (analysis.bodyColor === '紫' || analysis.bodyColor === '青紫') {
      return '肝';
    }
    
    // 绛舌 → 心（热入营血）
    if (analysis.bodyColor === '绛') {
      return '心';
    }
    
    // 红舌 → 需结合其他特征判断，默认心
    if (analysis.bodyColor === '红') {
      return '心';
    }
    
    // 裂纹 → 脾或肾（裂纹多属阴虚）
    if (analysis.hasCrack) {
      return '脾';
    }
    
    return '心';
  }
  
  /**
   * 证型推理 v2.1 - 多特征加权评分机制
   * 【重构】从顺序遍历改为多特征综合评分，避免单一特征一票否决
   */
  private inferSyndrome(
    patterns: OrganPattern[],
    analysis: TongueAnalysisResult,
    primaryOrgan: string
  ): { label: string; description: string; rootCause: string; method: string; confidence: number } {
    // 计算每个证型规则的匹配得分
    const scores: Array<{ rule: typeof SYNDROME_RULES[0]; score: number; matchedFeatures: string[] }> = [];
    
    for (const rule of SYNDROME_RULES) {
      const { score, matchedFeatures } = this.calculateRuleScore(rule, patterns, analysis);
      scores.push({ rule, score, matchedFeatures });
    }
    
    // 按得分排序
    scores.sort((a, b) => b.score - a.score);
    
    // 如果有得分超过阈值的证型，选择得分最高的
    const bestMatch = scores[0];
    if (bestMatch && bestMatch.score > 0.4) {
      // 计算最终置信度：基础置信度 × 特征匹配系数
      const matchRatio = bestMatch.matchedFeatures.length / this.getExpectedFeatureCount(bestMatch.rule);
      const confidence = Math.min(bestMatch.rule.baseConfidence * (0.6 + 0.4 * matchRatio), 0.95);
      
      return {
        label: bestMatch.rule.label,
        description: bestMatch.rule.description,
        rootCause: bestMatch.rule.rootCause,
        method: bestMatch.rule.method,
        confidence: Math.round(confidence * 100) / 100,
      };
    }
    
    // 默认综合判断
    return this.generateDefaultSyndrome(patterns, analysis, primaryOrgan);
  }
  
  /**
   * 计算规则匹配得分 v2.1
   * 多特征加权评分机制
   */
  private calculateRuleScore(
    rule: typeof SYNDROME_RULES[0],
    patterns: OrganPattern[],
    analysis: TongueAnalysisResult
  ): { score: number; matchedFeatures: string[] } {
    let totalWeight = 0;
    let totalScore = 0;
    const matchedFeatures: string[] = [];
    const weights = rule.featureWeights || { tongueColor: 0.3, tongueShape: 0.3, coating: 0.2, organ: 0.2, specialFeature: 0 };
    
    // 1. 舌色特征匹配
    if (rule.tongueColorCheck) {
      const weight = weights.tongueColor || 0.3;
      totalWeight += weight;
      if (rule.tongueColorCheck(analysis)) {
        totalScore += weight;
        matchedFeatures.push(`舌色:${analysis.bodyColor}`);
      }
    }
    
    // 2. 舌形特征匹配
    if (rule.tongueShapeCheck) {
      const weight = weights.tongueShape || 0.3;
      totalWeight += weight;
      if (rule.tongueShapeCheck(analysis)) {
        totalScore += weight;
        matchedFeatures.push(`舌形:${analysis.shape}`);
      }
    }
    
    // 3. 苔质特征匹配
    if (rule.coatingCheck) {
      const weight = weights.coating || 0.2;
      totalWeight += weight;
      if (rule.coatingCheck(analysis)) {
        totalScore += weight;
        matchedFeatures.push(`苔质:${analysis.coatingColor}/${analysis.coatingTexture}`);
      }
    }
    
    // 4. 脏腑特征匹配
    if (rule.organCheck) {
      const weight = weights.organ || 0.2;
      totalWeight += weight;
      if (rule.organCheck(patterns)) {
        totalScore += weight;
        const matchedOrgan = patterns.find(p => {
          if (p.organ === '肝' && rule.label.includes('肝')) return true;
          if (p.organ === '脾' && rule.label.includes('脾')) return true;
          if (p.organ === '肾' && rule.label.includes('肾')) return true;
          if (p.organ === '心' && rule.label.includes('心')) return true;
          if (p.organ === '胃' && rule.label.includes('胃')) return true;
          return false;
        });
        if (matchedOrgan) {
          matchedFeatures.push(`脏腑:${matchedOrgan.organ}`);
        }
      }
    }
    
    // 5. 特殊特征匹配（特征协同增强）
    if (rule.specialFeatures) {
      for (const specialFeature of rule.specialFeatures) {
        if (specialFeature.check(analysis)) {
          const weight = (weights.specialFeature || 0.1) * specialFeature.weight;
          totalWeight += weight;
          totalScore += weight;
        }
      }
    }
    
    // 计算归一化得分
    const score = totalWeight > 0 ? totalScore / totalWeight : 0;
    
    return { score, matchedFeatures };
  }
  
  /**
   * 获取规则期望的特征数量
   */
  private getExpectedFeatureCount(rule: typeof SYNDROME_RULES[0]): number {
    let count = 0;
    if (rule.tongueColorCheck) count++;
    if (rule.tongueShapeCheck) count++;
    if (rule.coatingCheck) count++;
    if (rule.organCheck) count++;
    if (rule.specialFeatures) count += rule.specialFeatures.length;
    return count;
  }
  
  /**
   * 生成默认证型
   */
  private generateDefaultSyndrome(
    patterns: OrganPattern[],
    analysis: TongueAnalysisResult,
    primaryOrgan: string
  ): { label: string; description: string; rootCause: string; method: string; confidence: number } {
    const patternStr = patterns.map(p => `${p.organ}${p.pattern}`).join('、');
    const bodyColorDesc = this.getBodyColorDescription(analysis.bodyColor);
    
    return {
      label: `${bodyColorDesc}舌`,
      description: `舌象特征：${bodyColorDesc}${patternStr ? '；' + patternStr : ''}`,
      rootCause: ROOT_CAUSE_MAPPING[primaryOrgan] || '脏腑气血功能紊乱',
      method: '调理脏腑',
      confidence: 0.70,
    };
  }
  
  /**
   * 获取舌色描述
   */
  private getBodyColorDescription(color: string): string {
    const descriptions: Record<string, string> = {
      '淡红': '淡红',
      '淡白': '淡白',
      '红': '红',
      '绛': '绛红',
      '紫': '紫暗',
      '青紫': '青紫',
      '淡紫': '淡紫',
    };
    return descriptions[color] || color;
  }
  
  /**
   * 生成证型证据
   */
  private generateSyndromeEvidence(patterns: OrganPattern[], analysis: TongueAnalysisResult): string[] {
    const evidence: string[] = [];
    
    // 舌色
    evidence.push(`舌色${analysis.bodyColor}`);
    
    // 舌形
    if (analysis.hasTeethMark) {
      evidence.push('舌边有齿痕');
    }
    if (analysis.hasCrack) {
      evidence.push('舌有裂纹');
    }
    if (analysis.hasEcchymosis) {
      evidence.push('舌有瘀斑');
    }
    
    // 脏腑模式
    for (const pattern of patterns.slice(0, 3)) {
      evidence.push(`${pattern.organ}区${pattern.pattern}`);
    }
    
    return evidence;
  }
  
  /**
   * 从证型推断病性
   */
  private inferNatureFromPattern(pattern: string): string {
    if (pattern.includes('虚') || pattern.includes('不足')) return '虚证';
    if (pattern.includes('实') || pattern.includes('郁') || pattern.includes('热') || pattern.includes('湿')) return '实证';
    return '虚实夹杂';
  }
  
  /**
   * 提取触发特征
   */
  private extractTriggerFeatures(nodes: InferenceNode[]): string[] {
    const features: string[] = [];
    
    for (const node of nodes) {
      features.push(...node.conclusion.evidence);
    }
    
    return [...new Set(features)];
  }
  
  /**
   * 生成配穴方案（优先使用证型特异性配穴）
   */
  private generatePrescription(patterns: OrganPattern[], analysis: TongueAnalysisResult): Prescription | undefined {
    if (patterns.length === 0) return undefined;
    
    // 找到当前证型对应的配穴规则
    if (this.currentSyndrome && SYNDROME_PRESCRIPTION_RULES[this.currentSyndrome.label]) {
      const syndromeRule = SYNDROME_PRESCRIPTION_RULES[this.currentSyndrome.label];
      return {
        id: `prescription-${Date.now()}`,
        mainPoints: syndromeRule.mainPoints,
        secondaryPoints: syndromeRule.secondaryPoints,
        technique: syndromeRule.technique,
        needleRetention: 30,
        moxibustion: syndromeRule.technique === '补法' ? '建议艾灸' : '慎用艾灸',
        frequency: '每周2-3次',
        course: '4周为一疗程',
        precautions: ['避开空腹和过饱', '治疗后注意保暖', '保持情绪舒畅'],
        basis: syndromeRule.basis,
        confidence: this.currentSyndrome.confidence || 0.80,
      };
    }
    
    // 降级：使用原始的脏腑配穴逻辑
    const primaryPattern = patterns[0];
    
    // 匹配配穴规则
    let matchedRule = ACUPOINT_RULES[primaryPattern.pattern];
    
    // 如果没有精确匹配，尝试模糊匹配
    if (!matchedRule) {
      for (const [key, rule] of Object.entries(ACUPOINT_RULES)) {
        if (primaryPattern.pattern.includes(key) || key.includes(primaryPattern.pattern)) {
          matchedRule = rule;
          break;
        }
      }
    }
    
    // 默认配穴
    if (!matchedRule) {
      matchedRule = {
        mainPoints: ['足三里', '三阴交', '中脘'],
        secondaryPoints: ['脾俞', '胃俞'],
        technique: '平补平泻',
        basis: ['辨证配穴'],
      };
    }
    
    // 根据病性调整针法
    let technique = matchedRule.technique;
    if (primaryPattern.nature === '虚证') {
      technique = '补法';
    } else if (primaryPattern.nature === '实证') {
      technique = '泻法';
    }
    
    return {
      id: `prescription-${Date.now()}`,
      mainPoints: matchedRule.mainPoints,
      secondaryPoints: matchedRule.secondaryPoints,
      technique,
      needleRetention: 30,
      moxibustion: primaryPattern.nature === '虚证' ? '建议艾灸' : '慎用艾灸',
      frequency: '每周2-3次',
      course: '4周为一疗程',
      precautions: ['避开空腹和过饱', '治疗后注意保暖', '保持情绪舒畅'],
      basis: matchedRule.basis,
      confidence: primaryPattern.confidence,
    };
  }
  
  /**
   * 生成验证问题
   */
  private generateValidationQuestions(patterns: OrganPattern[]): string[] {
    const questions: string[] = [];
    
    for (const pattern of patterns.slice(0, 2)) {
      if (pattern.organ === '脾') {
        questions.push('大便情况如何？');
      }
      if (pattern.organ === '肝') {
        questions.push('情绪和睡眠如何？');
      }
      if (pattern.organ === '肾') {
        questions.push('腰酸、乏力吗？');
      }
      if (pattern.organ === '心') {
        questions.push('有心慌、失眠吗？');
      }
    }
    
    return [...new Set(questions)];
  }
  
  /**
   * 创建空输出
   */
  private createEmptyOutput(): LayerOutput {
    return {
      layer: 4,
      nodes: [],
      summary: {
        label: '',
        description: '综合推理数据不足',
        confidence: 0,
      },
      validationQuestions: [],
    };
  }
}
