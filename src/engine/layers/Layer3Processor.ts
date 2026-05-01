/**
 * Layer3 处理器：分区凹凸层 v2.0
 * 职责：分区凹凸 → 精确定位（"神"之层）
 * 
 * 三焦三等分 + 左右对称
 * - 凹陷=亏
 * - 凸起=堵
 * - 半透明=气血亏虚严重
 */

import type { LayerInput, LayerOutput, InferenceNode } from '@/types/inference';
import type { TongueAnalysisResult, ZoneFeature, ZonePosition, UndulationType } from '@/types/tongue';
import { BaseLayerProcessor } from '../core/LayerProcessor';
import { createOrganNode, createPatternNode } from '../core/InferenceNode';
import { getOrgansForZone } from '@/types/tongue';

/**
 * 分区凹凸辨证规则
 */
const ZONE_UNDULATION_RULES: Record<UndulationType, {
  meaning: string;
  treatment: string;
  baseConfidence: number;
}> = {
  depression: {
    meaning: '亏（气血不足）',
    treatment: '补益',
    baseConfidence: 0.75,
  },
  bulge: {
    meaning: '堵（气血淤堵）',
    treatment: '疏通',
    baseConfidence: 0.75,
  },
  flat: {
    meaning: '正常',
    treatment: '无需特别处理',
    baseConfidence: 0.9,
  },
  semitransparent: {
    meaning: '气血亏虚严重',
    treatment: '调补并重',
    baseConfidence: 0.85,
  },
};

/**
 * 分区脏腑映射
 */
const ZONE_ORGAN_RULES: Record<ZonePosition, {
  left: string[];
  right: string[];
  center: string[];
}> = {
  upperThird: {
    left: ['肺', '乳腺'],
    right: ['胸膈', '肩臂'],
    center: ['心', '小肠'],
  },
  middleThird: {
    left: ['肝'],
    right: ['胆'],
    center: ['脾', '胃'],
  },
  lowerThird: {
    left: ['生殖区'],
    right: ['腿'],
    center: ['肾', '膀胱', '大肠'],
  },
};

/**
 * Layer3 分区凹凸处理器
 */
export class Layer3Processor extends BaseLayerProcessor {
  readonly layer = 3;
  readonly name = '分区凹凸层';
  readonly description = '凹陷=亏 / 凸起=堵 / 半透明=气血亏虚';
  
  /**
   * 处理分区凹凸特征
   */
  process(input: LayerInput): LayerOutput {
    const tongueAnalysis = input.tongueAnalysis;
    
    if (!tongueAnalysis) {
      return this.createEmptyOutput();
    }
    
    const nodes: InferenceNode[] = [];
    const { zoneFeatures, isSemitransparent, semitransparentZones } = tongueAnalysis;
    
    // 1. 分析半透明
    if (isSemitransparent) {
      const semitransparentNode = this.analyzeSemitransparent(semitransparentZones);
      nodes.push(semitransparentNode);
    }
    
    // 2. 分析各分区凹凸
    const zoneNodes: InferenceNode[] = [];
    for (const zone of zoneFeatures) {
      const zoneNode = this.analyzeZone(zone);
      zoneNodes.push(zoneNode);
      nodes.push(zoneNode);
    }
    
    // 3. 生成脏腑定位
    const organNodes = this.generateOrganPatterns(zoneNodes);
    nodes.push(...organNodes);
    
    // 4. 综合分区辨证
    const synthesisNode = this.synthesizeZones(zoneNodes, isSemitransparent);
    nodes.push(synthesisNode);
    
    return {
      layer: 3,
      nodes,
      summary: {
        label: synthesisNode.conclusion.label,
        description: synthesisNode.conclusion.description,
        confidence: synthesisNode.conclusion.confidence,
      },
      validationQuestions: this.generateValidationQuestions(zoneNodes),
    };
  }
  
  /**
   * 分析半透明
   */
  private analyzeSemitransparent(zones?: ZonePosition[]): InferenceNode {
    const zoneList = zones || ['upperThird', 'middleThird', 'lowerThird'];
    
    let scope = '全舌';
    if (zoneList.length === 1) {
      scope = this.getZoneName(zoneList[0]);
    } else if (zoneList.length === 2) {
      scope = `${this.getZoneName(zoneList[0])}、${this.getZoneName(zoneList[1])}`;
    }
    
    const label = '气血亏虚严重';
    const desc = `${scope}半透明，提示三焦气血亏虚，脏腑功能下降`;
    
    return createPatternNode(
      this.generateNodeId('semitransparent'),
      label,
      desc,
      0.85,
      [`半透明区域：${scope}`],
      3
    );
  }
  
  /**
   * 分析单个分区
   */
  private analyzeZone(zone: ZoneFeature): InferenceNode {
    const zoneName = this.getZoneName(zone.position);
    const undulationRule = zone.undulation 
      ? ZONE_UNDULATION_RULES[zone.undulation] 
      : ZONE_UNDULATION_RULES.flat;
    
    // 获取脏腑对应
    const organs = this.getOrgansForZone(zone);
    
    let label = '';
    let desc = '';
    let confidence = undulationRule.baseConfidence;
    const evidence: string[] = [`区域：${zoneName}`];
    
    if (zone.undulation === 'depression') {
      // 凹陷=亏
      if (organs.length > 0) {
        label = `${organs.join('、')}气血不足`;
        desc = `${zoneName}凹陷提示${organs.join('、')}${undulationRule.meaning}`;
      } else {
        label = `${zoneName}亏虚`;
        desc = `${zoneName}凹陷提示局部气血不足`;
      }
      evidence.push('凹凸形态：凹陷');
    } else if (zone.undulation === 'bulge') {
      // 凸起=堵
      if (organs.length > 0) {
        label = `${organs.join('、')}郁结`;
        desc = `${zoneName}凸起提示${organs.join('、')}${undulationRule.meaning}`;
      } else {
        label = `${zoneName}瘀堵`;
        desc = `${zoneName}凸起提示局部气血淤堵`;
      }
      evidence.push('凹凸形态：凸起');
    } else if (zone.undulation === 'semitransparent') {
      label = `${zoneName}气血大虚`;
      desc = `${zoneName}半透明提示该区域气血严重亏虚`;
      confidence = 0.85;
      evidence.push('凹凸形态：半透明');
    } else {
      label = `${zoneName}正常`;
      desc = `${zoneName}形态正常`;
      evidence.push('凹凸形态：平坦');
    }
    
    // 结合颜色分析
    if (zone.color) {
      evidence.push(`舌色：${zone.color}`);
      if (zone.colorIntensity) {
        evidence.push(`颜色深浅：${zone.colorIntensity}`);
      }
    }
    
    // 结合特殊特征
    if (zone.hasCrack) {
      evidence.push('有裂纹');
    }
    if (zone.hasTeethMark) {
      evidence.push('有齿痕');
    }
    if (zone.hasEcchymosis) {
      evidence.push('有瘀斑');
    }
    
    const node = createPatternNode(
      this.generateNodeId(`zone-${zone.position}`),
      label,
      desc,
      confidence,
      evidence,
      3
    );
    
    return node;
  }
  
  /**
   * 生成脏腑定位
   */
  private generateOrganPatterns(zoneNodes: InferenceNode[]): InferenceNode[] {
    const organNodes: InferenceNode[] = [];
    const organConfidenceMap = new Map<string, { confidence: number; evidence: string[] }>();
    
    for (const node of zoneNodes) {
      if (node.conclusion.label.includes('气血不足') || 
          node.conclusion.label.includes('亏虚') ||
          node.conclusion.label.includes('郁结') ||
          node.conclusion.label.includes('瘀堵')) {
        
        // 从节点描述中提取脏腑
        const organs = this.extractOrgansFromDescription(node.conclusion.description);
        
        for (const organ of organs) {
          const existing = organConfidenceMap.get(organ) || { confidence: 0, evidence: [] };
          organConfidenceMap.set(organ, {
            confidence: Math.max(existing.confidence, node.conclusion.confidence),
            evidence: [...existing.evidence, ...node.conclusion.evidence],
          });
        }
      }
    }
    
    // 创建脏腑节点
    for (const [organ, data] of organConfidenceMap) {
      const isDeficiency = data.evidence.some(e => e.includes('不足') || e.includes('亏虚'));
      const nature = isDeficiency ? '虚证' : '实证';
      
      const organNode = createOrganNode(
        this.generateNodeId(`organ-${organ}`),
        organ,
        data.evidence[0] || organ,
        nature,
        data.confidence,
        3
      );
      organNodes.push(organNode);
    }
    
    return organNodes;
  }
  
  /**
   * 综合分区辨证
   */
  private synthesizeZones(zoneNodes: InferenceNode[], isSemitransparent: boolean): InferenceNode {
    const descriptions = zoneNodes.map(n => n.conclusion.label).filter(l => !l.includes('正常'));
    
    let label = '';
    let desc = '';
    let confidence = 0.5;
    
    if (isSemitransparent) {
      label = '三焦气血亏虚';
      desc = '舌象半透明，提示全身气血亏虚较重';
      confidence = 0.85;
    } else if (descriptions.length === 0) {
      label = '分区无明显异常';
      desc = '舌面各分区形态基本正常';
      confidence = 0.8;
    } else if (descriptions.length === 1) {
      label = descriptions[0];
      desc = `主要问题：${zoneNodes.find(n => n.conclusion.label === descriptions[0])?.conclusion.description || ''}`;
      confidence = 0.75;
    } else {
      label = descriptions.slice(0, 2).join('，');
      desc = `主要问题：${descriptions.join('；')}`;
      confidence = 0.7;
    }
    
    const synthesisNode = createPatternNode(
      this.generateNodeId('zone-synthesis'),
      label,
      desc,
      confidence,
      zoneNodes.flatMap(n => n.conclusion.evidence),
      3
    );
    
    return synthesisNode;
  }
  
  /**
   * 生成验证问题
   */
  private generateValidationQuestions(zoneNodes: InferenceNode[]): string[] {
    const questions: string[] = [];
    
    for (const node of zoneNodes) {
      if (node.conclusion.label.includes('心')) {
        questions.push('是否有心慌、失眠或头晕的症状？');
      }
      if (node.conclusion.label.includes('肝')) {
        questions.push('是否有胁胀、烦躁或情绪问题？');
      }
      if (node.conclusion.label.includes('脾') || node.conclusion.label.includes('胃')) {
        questions.push('胃口怎么样？大便成形吗？');
      }
      if (node.conclusion.label.includes('肾')) {
        questions.push('是否有腰酸、耳鸣或夜尿多？');
      }
      if (node.conclusion.label.includes('肺')) {
        questions.push('是否有咳嗽、气短或易感冒？');
      }
    }
    
    return [...new Set(questions)];
  }
  
  /**
   * 获取区域名称
   */
  private getZoneName(position: ZonePosition): string {
    const names: Record<ZonePosition, string> = {
      upperThird: '舌尖/上焦',
      middleThird: '舌中/中焦',
      lowerThird: '舌根/下焦',
    };
    return names[position] || position;
  }
  
  /**
   * 获取分区的脏腑对应
   */
  private getOrgansForZone(zone: ZoneFeature): string[] {
    const side = zone.side || 'center';
    const rules = ZONE_ORGAN_RULES[zone.position];
    if (!rules) return [];
    
    if (side === 'left' && rules.left) return rules.left;
    if (side === 'right' && rules.right) return rules.right;
    return rules.center;
  }
  
  /**
   * 从描述中提取脏腑
   */
  private extractOrgansFromDescription(description: string): string[] {
    const organs = ['心', '肝', '脾', '肺', '肾', '胃', '胆', '小肠', '大肠', '膀胱'];
    return organs.filter(o => description.includes(o));
  }
  
  /**
   * 创建空输出
   */
  private createEmptyOutput(): LayerOutput {
    return {
      layer: 3,
      nodes: [],
      summary: {
        label: '',
        description: '分区分析数据不足',
        confidence: 0,
      },
      validationQuestions: [],
    };
  }
}
