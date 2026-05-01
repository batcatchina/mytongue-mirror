/**
 * 各层处理器接口定义 v2.0
 * 定义 Layer1-4 处理器的接口和基类
 */

import type { 
  LayerInput, 
  LayerOutput, 
  InferenceLayer,
  InferenceNode 
} from '@/types/inference';

/**
 * 层处理器接口
 * 所有四层处理器都应实现此接口
 */
export interface LayerProcessor {
  /** 处理器层级 */
  readonly layer: InferenceLayer;
  /** 处理器名称 */
  readonly name: string;
  /** 处理器描述 */
  readonly description: string;
  
  /**
   * 处理输入，输出本层推理结果
   * @param input 层级输入
   * @returns 层级输出
   */
  process(input: LayerInput): LayerOutput;
  
  /**
   * 验证处理结果
   * @param output 层级输出
   * @returns 是否验证通过
   */
  validate?(output: LayerOutput): boolean;
}

/**
 * 抽象层处理器基类
 * 提供通用功能
 */
export abstract class BaseLayerProcessor implements LayerProcessor {
  abstract readonly layer: InferenceLayer;
  abstract readonly name: string;
  abstract readonly description: string;
  
  /**
   * 抽象处理方法，子类必须实现
   */
  abstract process(input: LayerInput): LayerOutput;
  
  /**
   * 生成节点ID
   */
  protected generateNodeId(prefix: string): string {
    return `${prefix}-${this.layer}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * 计算综合置信度
   */
  protected calculateOverallConfidence(nodes: InferenceNode[]): number {
    if (nodes.length === 0) return 0;
    const sum = nodes.reduce((acc, node) => acc + node.conclusion.confidence, 0);
    return sum / nodes.length;
  }
  
  /**
   * 提取关键证据
   */
  protected extractKeyEvidence(nodes: InferenceNode[]): string[] {
    const evidence: string[] = [];
    for (const node of nodes) {
      evidence.push(...node.conclusion.evidence);
    }
    return [...new Set(evidence)]; // 去重
  }
}

/**
 * Layer1 处理器：舌质舌苔层
 * 职责：舌质+舌苔 → 气血与脾胃整体判断
 */
export interface Layer1Processor extends LayerProcessor {
  readonly layer: 1;
  readonly name: '舌质舌苔层';
  readonly description: '舌质=脏腑气血底子 / 舌苔=脾胃运化状态';
}

/**
 * Layer2 处理器：舌形反直觉层
 * 职责：舌形 → 虚实本质（反直觉层）
 * 特点：胖大≠实，瘦小红≠单纯虚
 */
export interface Layer2Processor extends LayerProcessor {
  readonly layer: 2;
  readonly name: '舌形反直觉层';
  readonly description: '舌形 → 虚实本质';
}

/**
 * Layer3 处理器：分区凹凸层
 * 职责：分区凹凸 → 精确定位（"神"之层）
 * 三焦三等分 + 左右对称
 */
export interface Layer3Processor extends LayerProcessor {
  readonly layer: 3;
  readonly name: '分区凹凸层';
  readonly description: '凹陷=亏 / 凸起=堵 / 半透明=气血亏虚';
}

/**
 * Layer4 处理器：综合推理层
 * 职责：综合推理 → 传变关系+配方案
 * 子盗母气 / 相克传变 / 经脉辨证 / 配穴组合
 */
export interface Layer4Processor extends LayerProcessor {
  readonly layer: 4;
  readonly name: '综合推理层';
  readonly description: '传变关系 + 配穴方案';
}

/**
 * 处理器注册表类型
 */
export type LayerProcessorMap = {
  1: Layer1Processor;
  2: Layer2Processor;
  3: Layer3Processor;
  4: Layer4Processor;
};

/**
 * 获取所有层处理器
 */
export function getAllLayerProcessors(): LayerProcessor[] {
  // 动态导入，避免循环依赖
  return [
    // Layer1-4 处理器会在实际使用时导入
  ];
}
