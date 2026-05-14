/**
 * Layer4 处理器：综合推理层 v2.0
 * 职责：综合推理 → 传变关系+配穴方案
 * 
 * 子盗母气 / 相克传变 / 经脉辨证 / 配穴组合
 * 
 * v2.1 修复：锚定脏腑定位、根因归因不指向"心"
 * v2.2 修复：添加ACUPOINT_RULES定义、穴位名校验、新增5个证型配穴规则
 */

import type { LayerInput, LayerOutput, InferenceNode, OrganPattern, Prescription } from '@/types/inference';
import type { TongueAnalysisResult } from '@/types/tongue';
import { BaseLayerProcessor } from '../core/LayerProcessor';
import { createPrescriptionNode, createPatternNode } from '../core/InferenceNode';
import { TransmissionEngine } from '../core/TransmissionEngine';
import { ACUPOINT_MERIDIAN_MAP } from '@/services/acupoint_data';

/**
 * 证型推理规则配置（优先级从高到低）
 * 锚定脏腑：必须与Layer2/Layer3识别的脏腑一致
 */
const SYNDROME_RULES: Array<{
  pattern: string | RegExp;
  organCheck?: (patterns: OrganPattern[]) => boolean;
  tongueCheck?: (analysis: TongueAnalysisResult) => boolean;
  label: string;
  description: string;
  rootCause: string;
  method: string;
  confidence: number;
}> = [
  // 肝郁化火：肝区热/火 + 舌红
  {
    pattern: /肝.*热|热.*肝|肝火/i,
    organCheck: (patterns) => patterns.some(p => p.organ === '肝'),
    tongueCheck: (analysis) => analysis.bodyColor === '红',
    label: '肝郁化火证',
    description: '肝气郁结，久而化火',
    rootCause: '肝气郁结，疏泄失常',
    method: '疏肝解郁，清热泻火',
    confidence: 0.85,
  },
  // 肝郁血虚：肝区虚证
  {
    pattern: /肝.*虚|肝郁/i,
    organCheck: (patterns) => patterns.some(p => p.organ === '肝'),
    tongueCheck: (analysis) => analysis.bodyColor === '淡红' || analysis.bodyColor === '淡白',
    label: '肝郁血虚证',
    description: '肝气郁结，血液生化不足',
    rootCause: '肝气郁结，血液生化不足',
    method: '疏肝解郁，养血柔肝',
    confidence: 0.82,
  },
  // 气滞血瘀：血瘀证
  {
    pattern: /血瘀|瘀/i,
    organCheck: (patterns) => patterns.some(p => 
      p.pattern.includes('瘀') || p.pattern.includes('血瘀')
    ),
    tongueCheck: (analysis) => analysis.bodyColor === '紫' || analysis.hasEcchymosis,
    label: '气滞血瘀证',
    description: '气行不畅，血行瘀滞',
    rootCause: '气滞血瘀，运行不畅',
    method: '活血化瘀，行气止痛',
    confidence: 0.88,
  },
  // 气血两虚：半透明舌
  {
    pattern: /气血.*虚|虚.*证/i,
    organCheck: (patterns) => patterns.some(p => 
      p.pattern.includes('虚') || p.organ === '脾' || p.organ === '肾'
    ),
    tongueCheck: (analysis) => analysis.isSemitransparent || analysis.bodyColor === '淡白',
    label: '气血两虚证',
    description: '三焦气血亏虚，脏腑失养',
    rootCause: '三焦气血亏虚，脏腑失养',
    method: '补益气血，调理脏腑',
    confidence: 0.85,
  },
  // 脾虚湿盛：脾区虚证
  {
    pattern: /脾.*虚|脾湿/i,
    organCheck: (patterns) => patterns.some(p => p.organ === '脾'),
    tongueCheck: (analysis) => analysis.hasTeethMark,
    label: '脾虚湿盛证',
    description: '脾失健运，水湿内停',
    rootCause: '脾气虚弱，运化失常',
    method: '健脾化湿',
    confidence: 0.82,
  },
  // 阳虚证
  {
    pattern: /阳虚/i,
    organCheck: (patterns) => patterns.some(p => 
      p.organ === '肾' || p.organ === '脾' || p.organ === '心'
    ),
    tongueCheck: (analysis) => analysis.bodyColor === '淡白' || analysis.hasTeethMark,
    label: '阳虚证',
    description: '阳气不足，温煦失职',
    rootCause: '肾阳亏虚，命门火衰',
    method: '温阳散寒，补肾助阳',
    confidence: 0.83,
  },
  // 阴虚证
  {
    pattern: /阴虚/i,
    organCheck: (patterns) => patterns.some(p => 
      p.organ === '肾' || p.organ === '心' || p.organ === '肺'
    ),
    tongueCheck: (analysis) => analysis.bodyColor === '红' || analysis.hasCrack,
    label: '阴虚证',
    description: '阴液亏虚，虚热内生',
    rootCause: '肾阴不足，虚火上炎',
    method: '滋阴降火，填精益髓',
    confidence: 0.84,
  },
  // 湿热证
  {
    pattern: /湿热/i,
    organCheck: (patterns) => patterns.some(p => 
      p.organ === '脾' || p.organ === '胃' || p.organ === '肝'
    ),
    tongueCheck: (analysis) => analysis.coatingColor === '黄' || analysis.coatingTexture === '厚',
    label: '湿热证',
    description: '湿热内蕴，熏蒸于舌',
    rootCause: '湿热蕴结，脾胃升降失常',
    method: '清热利湿，健脾和胃',
    confidence: 0.85,
  },
  // 脾胃虚弱证
  {
    pattern: /脾胃.*虚|胃脾.*虚/i,
    organCheck: (patterns) => patterns.some(p => 
      p.organ === '脾' || p.organ === '胃'
    ),
    tongueCheck: (analysis) => analysis.hasTeethMark || analysis.bodyColor === '淡白',
    label: '脾胃虚弱证',
    description: '脾胃纳运失职，气血生化不足',
    rootCause: '脾胃虚弱，运化失常',
    method: '健脾和胃，补益气血',
    confidence: 0.86,
  },
  // 肾虚证
  {
    pattern: /肾虚/i,
    organCheck: (patterns) => patterns.some(p => p.organ === '肾'),
    tongueCheck: (analysis) => analysis.bodyColor === '淡白' || analysis.hasTeethMark,
    label: '肾虚证',
    description: '肾精不足，肾气亏虚',
    rootCause: '肾精亏虚，腰府失养',
    method: '补肾填精，固本培元',
    confidence: 0.85,
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
 * 脏腑基础配穴规则（降级使用）
 * 当证型特异性配穴规则不匹配时使用
 */
const ACUPOINT_RULES: Record<string, {
  mainPoints: string[];
  secondaryPoints: string[];
  technique: '补法' | '泻法' | '平补平泻';
  basis: string[];
}> = {
  '气虚': {
    mainPoints: ['足三里', '气海', '中脘'],
    secondaryPoints: ['脾俞', '胃俞', '关元'],
    technique: '补法',
    basis: ['足三里为强壮要穴', '气海补气', '中脘和胃'],
  },
  '脾虚': {
    mainPoints: ['足三里', '脾俞', '中脘'],
    secondaryPoints: ['阴陵泉', '三阴交', '胃俞'],
    technique: '补法',
    basis: ['足三里益气健脾', '脾俞健脾', '中脘和胃'],
  },
  '肾虚': {
    mainPoints: ['太溪', '肾俞', '关元'],
    secondaryPoints: ['命门', '三阴交', '足三里'],
    technique: '补法',
    basis: ['太溪滋肾阴', '肾俞补肾气', '关元培元固本'],
  },
  '肝郁': {
    mainPoints: ['太冲', '肝俞', '期门'],
    secondaryPoints: ['膻中', '内关', '三阴交'],
    technique: '平补平泻',
    basis: ['太冲疏肝理气', '肝俞调肝', '期门疏肝解郁'],
  },
  '肝火': {
    mainPoints: ['太冲', '行间', '肝俞'],
    secondaryPoints: ['期门', '合谷', '曲池'],
    technique: '泻法',
    basis: ['行间清肝火', '太冲疏肝', '曲池清热'],
  },
  '阴虚': {
    mainPoints: ['太溪', '三阴交', '照海'],
    secondaryPoints: ['肾俞', '心俞', '内关'],
    technique: '补法',
    basis: ['太溪为肾经原穴', '照海滋阴', '三阴交健脾滋阴'],
  },
  '阳虚': {
    mainPoints: ['关元', '气海', '命门'],
    secondaryPoints: ['肾俞', '太溪', '足三里'],
    technique: '补法',
    basis: ['关元温阳', '气海补气', '命门壮阳'],
  },
  '湿盛': {
    mainPoints: ['阴陵泉', '丰隆', '水分'],
    secondaryPoints: ['脾俞', '三阴交', '中脘'],
    technique: '平补平泻',
    basis: ['阴陵泉利湿', '丰隆化痰湿', '水分分利水湿'],
  },
  '湿热': {
    mainPoints: ['阴陵泉', '曲池', '内庭'],
    secondaryPoints: ['合谷', '足三里', '三阴交'],
    technique: '泻法',
    basis: ['曲池清热', '内庭清胃热', '阴陵泉利湿'],
  },
  '血瘀': {
    mainPoints: ['血海', '膈俞', '三阴交'],
    secondaryPoints: ['太冲', '肝俞', '合谷'],
    technique: '泻法',
    basis: ['血海活血化瘀', '膈俞为血会', '三阴交活血'],
  },
  '心肾不交': {
    mainPoints: ['神门', '太溪', '照海'],
    secondaryPoints: ['心俞', '肾俞', '内关'],
    technique: '平补平泻',
    basis: ['神门安神', '太溪补肾', '照海滋阴交通心肾'],
  },
};

/**
 * 非穴位名模式（用于过滤）
 * 这些通常是治疗目的或功效描述，不是真实穴位名
 */
const NON_ACUPOINT_PATTERNS = [
  /^调和/,
  /^解表/,
  /^化湿/,
  /^清热/,
  /^补益/,
  /^疏肝/,
  /^健脾/,
  /^和胃/,
  /^活血/,
  /^滋阴/,
  /^温阳/,
  /^利湿/,
  /^泻火/,
  /^化痰/,
  /XX$/, // 以XX结尾
];

/**
 * 检查是否为有效穴位名
 */
function isValidAcupoint(pointName: string): boolean {
  // 首先检查是否在经脉映射表中
  if (ACUPOINT_MERIDIAN_MAP[pointName]) {
    return true;
  }
  
  // 检查是否匹配非穴位名模式
  for (const pattern of NON_ACUPOINT_PATTERNS) {
    if (pattern.test(pointName)) {
      return false;
    }
  }
  
  // 默认返回false，除非明确在映射表中
  return false;
}

/**
 * 过滤穴位列表，移除非穴位名
 */
function filterValidAcupoints(points: string[]): string[] {
  return points.filter(point => {
    if (!isValidAcupoint(point)) {
      console.warn(`[Layer4] 过滤非穴位名: ${point}`);
      return false;
    }
    return true;
  });
}

/**
 * 证型特异性配穴规则
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
  // ========== 新增证型配穴规则 v2.2 ==========
  '阳虚证': {
    mainPoints: ['关元', '气海', '命门'],
    secondaryPoints: ['肾俞', '太溪', '足三里'],
    technique: '补法',
    basis: ['关元温补肾阳', '气海益气助阳', '命门温肾壮阳'],
  },
  '阴虚证': {
    mainPoints: ['太溪', '照海', '三阴交'],
    secondaryPoints: ['肾俞', '复溜', '阴郄'],
    technique: '补法',
    basis: ['太溪滋肾阴', '照海滋阴清热', '三阴交健脾养阴'],
  },
  '湿热证': {
    mainPoints: ['阴陵泉', '足三里', '中脘'],
    secondaryPoints: ['丰隆', '内庭', '曲池'],
    technique: '泻法',
    basis: ['阴陵泉健脾利湿', '足三里和胃化湿', '中脘和胃化湿'],
  },
  '脾胃虚弱证': {
    mainPoints: ['足三里', '中脘', '脾俞'],
    secondaryPoints: ['胃俞', '三阴交', '关元'],
    technique: '补法',
    basis: ['足三里益气健脾', '中脘和胃健脾', '脾俞健脾益气'],
  },
  '肾虚证': {
    mainPoints: ['太溪', '肾俞', '关元'],
    secondaryPoints: ['命门', '三阴交', '足三里'],
    technique: '补法',
    basis: ['太溪滋肾填精', '肾俞补肾益气', '关元培元固本'],
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
   * 检查是否有肝区异常特征
   */
  private hasLiverZoneAbnormality(analysis: TongueAnalysisResult): boolean {
    if (!analysis.zoneFeatures) return false;
    
    // 肝区：舌中两侧（middleThird left/right）
    const liverZones = analysis.zoneFeatures.filter(
      z => z.position === 'middleThird' && (z.side === 'left' || z.side === 'right')
    );
    
    // 肝区颜色偏深或偏红
    for (const zone of liverZones) {
      if (zone.colorIntensity === '偏深' || zone.colorIntensity === '偏红') {
        return true;
      }
      if (zone.color === '红' || zone.color === '绛') {
        return true;
      }
      if (zone.hasTeethMark) {
        return true; // 舌边齿痕提示肝郁
      }
    }
    
    return false;
  }
  
  /**
   * 从舌象特征推断主脏腑
   */
  private inferPrimaryOrganFromTongue(analysis: TongueAnalysisResult): string {
    // 舌边齿痕 → 肝郁（舌边属肝）
    if (analysis.hasTeethMark && analysis.zoneFeatures) {
      const sideZones = analysis.zoneFeatures.filter(
        z => z.side === 'left' || z.side === 'right'
      );
      if (sideZones.length > 0) {
        return '肝';
      }
    }
    
    // 舌紫 → 肝（气滞血瘀）
    if (analysis.bodyColor === '紫') {
      return '肝';
    }
    
    // 半透明 → 脾（气血生化之源）
    if (analysis.isSemitransparent) {
      return '脾';
    }
    
    return '心';
  }
  
  /**
   * 证型推理（锚定脏腑）
   */
  private inferSyndrome(
    patterns: OrganPattern[],
    analysis: TongueAnalysisResult,
    primaryOrgan: string
  ): { label: string; description: string; rootCause: string; method: string; confidence: number } {
    // 按优先级遍历证型规则
    for (const rule of SYNDROME_RULES) {
      // 检查器官匹配
      const organMatch = rule.organCheck ? rule.organCheck(patterns) : true;
      // 检查舌象匹配
      const tongueMatch = rule.tongueCheck ? rule.tongueCheck(analysis) : true;
      
      if (organMatch && tongueMatch) {
        return {
          label: rule.label,
          description: rule.description,
          rootCause: rule.rootCause,
          method: rule.method,
          confidence: rule.confidence,
        };
      }
    }
    
    // 默认综合判断
    return this.generateDefaultSyndrome(patterns, analysis, primaryOrgan);
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
   * v2.2 修复：添加穴位名校验，过滤非穴位名
   */
  private generatePrescription(patterns: OrganPattern[], analysis: TongueAnalysisResult): Prescription | undefined {
    if (patterns.length === 0) return undefined;
    
    // 找到当前证型对应的配穴规则
    if (this.currentSyndrome && SYNDROME_PRESCRIPTION_RULES[this.currentSyndrome.label]) {
      const syndromeRule = SYNDROME_PRESCRIPTION_RULES[this.currentSyndrome.label];
      
      // 过滤非穴位名
      const mainPoints = filterValidAcupoints(syndromeRule.mainPoints);
      const secondaryPoints = filterValidAcupoints(syndromeRule.secondaryPoints);
      
      return {
        id: `prescription-${Date.now()}`,
        mainPoints,
        secondaryPoints,
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
    
    // 过滤非穴位名
    const mainPoints = filterValidAcupoints(matchedRule.mainPoints);
    const secondaryPoints = filterValidAcupoints(matchedRule.secondaryPoints);
    
    return {
      id: `prescription-${Date.now()}`,
      mainPoints,
      secondaryPoints,
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
