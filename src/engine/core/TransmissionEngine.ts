/**
 * 传变关系引擎 v2.0
 * 处理五脏六腑之间的传变关系
 */

import type { 
  TransmissionRelation, 
  TransmissionType,
  InferenceNode,
  OrganPattern
} from '@/types/inference';

/**
 * 传变关系引擎
 * 管理脏腑间的传变关系并生成传变推理
 */
export class TransmissionEngine {
  /** 传变关系规则库 */
  private transmissionRules: TransmissionRelation[];
  
  constructor() {
    this.transmissionRules = this.initializeTransmissionRules();
  }
  
  /**
   * 初始化传变规则库
   */
  private initializeTransmissionRules(): TransmissionRelation[] {
    return [
      // 子盗母气
      {
        id: 'trans-001',
        type: '子盗母气',
        sourceOrgan: '肝',
        targetOrgan: '肾',
        condition: {
          triggerFeatures: ['舌边红', '舌根凹陷', '腰酸'],
          confidenceThreshold: 0.6,
        },
        result: {
          description: '肝郁化火，耗伤肾阴',
          mechanism: '肝木为肾水之子，肝火亢盛则耗伤肾阴，导致肾虚',
          confidence: 0.7,
        },
      },
      {
        id: 'trans-002',
        type: '子盗母气',
        sourceOrgan: '心',
        targetOrgan: '肝',
        condition: {
          triggerFeatures: ['舌尖红', '舌边红', '失眠'],
          confidenceThreshold: 0.6,
        },
        result: {
          description: '心火亢盛，引动肝火',
          mechanism: '心为肝木之子，心火旺则肝火随之亢盛',
          confidence: 0.65,
        },
      },
      
      // 母病及子
      {
        id: 'trans-003',
        type: '母病及子',
        sourceOrgan: '肾',
        targetOrgan: '肝',
        condition: {
          triggerFeatures: ['舌根凹陷', '舌边淡', '腰酸'],
          confidenceThreshold: 0.6,
        },
        result: {
          description: '肾水不足，肝木失养',
          mechanism: '肾水为肝木之母，肾水不足则肝木失于滋养',
          confidence: 0.7,
        },
      },
      {
        id: 'trans-004',
        type: '母病及子',
        sourceOrgan: '脾',
        targetOrgan: '肺',
        condition: {
          triggerFeatures: ['舌中凹陷', '苔薄', '易感冒'],
          confidenceThreshold: 0.6,
        },
        result: {
          description: '脾土虚弱，肺金失养',
          mechanism: '脾土为肺金之母，脾虚则肺气不足',
          confidence: 0.7,
        },
      },
      
      // 相克传变
      {
        id: 'trans-005',
        type: '相克传变',
        sourceOrgan: '肝',
        targetOrgan: '脾',
        condition: {
          triggerFeatures: ['舌边红凸', '舌中凹陷', '胁胀'],
          confidenceThreshold: 0.65,
        },
        result: {
          description: '肝木克脾土',
          mechanism: '肝气郁结，横逆犯脾，导致脾虚',
          confidence: 0.75,
        },
      },
      {
        id: 'trans-006',
        type: '相克传变',
        sourceOrgan: '脾',
        targetOrgan: '肾',
        condition: {
          triggerFeatures: ['舌中苔腻', '舌根略凸', '便溏'],
          confidenceThreshold: 0.6,
        },
        result: {
          description: '脾土克肾水',
          mechanism: '脾虚湿盛，湿邪下注，困阻肾气',
          confidence: 0.65,
        },
      },
      {
        id: 'trans-007',
        type: '相克传变',
        sourceOrgan: '心',
        targetOrgan: '肺',
        condition: {
          triggerFeatures: ['舌尖红', '苔黄', '咳嗽'],
          confidenceThreshold: 0.6,
        },
        result: {
          description: '心火刑金',
          mechanism: '心火亢盛，灼伤肺阴，导致肺热',
          confidence: 0.7,
        },
      },
      
      // 相生传变
      {
        id: 'trans-008',
        type: '相生传变',
        sourceOrgan: '脾',
        targetOrgan: '心',
        condition: {
          triggerFeatures: ['舌中凹陷', '舌尖淡', '心悸'],
          confidenceThreshold: 0.6,
        },
        result: {
          description: '脾土生心火',
          mechanism: '脾虚则气血生化不足，心失所养',
          confidence: 0.7,
        },
      },
      {
        id: 'trans-009',
        type: '相生传变',
        sourceOrgan: '肾',
        targetOrgan: '肝',
        condition: {
          triggerFeatures: ['舌根凹陷', '舌边淡', '眩晕'],
          confidenceThreshold: 0.6,
        },
        result: {
          description: '肾水生肝木',
          mechanism: '肾阴不足，水不涵木，肝阳上亢',
          confidence: 0.7,
        },
      },
      
      // 脏腑直接传变
      {
        id: 'trans-010',
        type: '脏腑传变',
        sourceOrgan: '肝',
        targetOrgan: '胆',
        condition: {
          triggerFeatures: ['舌边红', '舌边略鼓'],
          confidenceThreshold: 0.7,
        },
        result: {
          description: '肝郁化火，胆郁',
          mechanism: '肝气郁结化火，胆腑疏泄失常',
          confidence: 0.8,
        },
      },
      {
        id: 'trans-011',
        type: '脏腑传变',
        sourceOrgan: '胃',
        targetOrgan: '脾',
        condition: {
          triggerFeatures: ['胃脘不适', '舌中苔厚'],
          confidenceThreshold: 0.6,
        },
        result: {
          description: '胃病及脾',
          mechanism: '胃气上逆，影响脾的运化功能',
          confidence: 0.7,
        },
      },
    ];
  }
  
  /**
   * 分析传变关系
   * @param organPatterns 脏腑辨证列表
   * @param triggerFeatures 触发的特征列表
   * @returns 可能的传变关系
   */
  analyzeTransmission(
    organPatterns: OrganPattern[],
    triggerFeatures: string[]
  ): TransmissionRelation[] {
    const sourceOrgans = organPatterns.map(op => op.organ);
    const matchedTransmissions: TransmissionRelation[] = [];
    
    for (const rule of this.transmissionRules) {
      // 检查源脏腑是否在当前辨证中
      if (!sourceOrgans.includes(rule.sourceOrgan)) {
        continue;
      }
      
      // 检查触发特征是否匹配
      const featureMatchCount = rule.condition.triggerFeatures.filter(
        feature => triggerFeatures.some(tf => tf.includes(feature) || feature.includes(tf))
      ).length;
      
      const featureMatchRatio = featureMatchCount / rule.condition.triggerFeatures.length;
      
      // 检查置信度阈值
      const organConfidence = organPatterns.find(op => op.organ === rule.sourceOrgan)?.confidence || 0;
      
      if (featureMatchRatio >= 0.5 && organConfidence >= rule.condition.confidenceThreshold) {
        matchedTransmissions.push({
          ...rule,
          result: {
            ...rule.result,
            confidence: rule.result.confidence * (0.8 + featureMatchRatio * 0.2),
          },
        });
      }
    }
    
    // 按置信度排序
    return matchedTransmissions.sort((a, b) => b.result.confidence - a.result.confidence);
  }
  
  /**
   * 构建传变推理链
   */
  buildTransmissionChain(
    organPatterns: OrganPattern[],
    transmissions: TransmissionRelation[]
  ): InferenceNode[] {
    return transmissions.map(trans => ({
      id: `trans-${trans.id}`,
      name: `${trans.sourceOrgan}→${trans.targetOrgan}`,
      layer: 4 as const,
      type: 'transmission' as const,
      inputs: [],
      conclusion: {
        label: trans.type,
        description: trans.result.description,
        confidence: trans.result.confidence,
        evidence: [trans.result.mechanism],
        priority: 'medium',
      },
      causes: organPatterns
        .filter(op => op.organ === trans.sourceOrgan)
        .map(op => op.relatedNodeIds[0]),
      effects: [],
      corrections: [],
      createdAt: new Date().toISOString(),
      metadata: {
        organLocation: [trans.sourceOrgan, trans.targetOrgan],
      },
    }));
  }
  
  /**
   * 生成传变路径描述
   */
  generateTransmissionPaths(transmissions: TransmissionRelation[]): string[] {
    return transmissions.map(trans => {
      const mechanism = trans.result.mechanism;
      return `${trans.sourceOrgan}（${trans.type}）→ ${trans.targetOrgan}：${mechanism}`;
    });
  }
  
  /**
   * 获取所有传变类型
   */
  getTransmissionTypes(): TransmissionType[] {
    return ['子盗母气', '母病及子', '相克传变', '相生传变', '表里传变', '脏腑传变'];
  }
  
  /**
   * 获取特定传变类型的规则
   */
  getRulesByType(type: TransmissionType): TransmissionRelation[] {
    return this.transmissionRules.filter(r => r.type === type);
  }
  
  /**
   * 添加自定义传变规则
   */
  addRule(rule: TransmissionRelation): void {
    const existingIndex = this.transmissionRules.findIndex(r => r.id === rule.id);
    if (existingIndex >= 0) {
      this.transmissionRules[existingIndex] = rule;
    } else {
      this.transmissionRules.push(rule);
    }
  }
}
