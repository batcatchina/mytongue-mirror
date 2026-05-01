/**
 * 推理链核心类 v2.0
 * 管理推理节点、拓扑排序、执行推理链
 */

import type { 
  InferenceChainOutput, 
  InferenceNode, 
  LayerInput,
  LayerOutput,
  InferenceContext,
  OrganPattern,
  Prescription,
  ChainVisualization
} from '@/types/inference';
import type { TongueAnalysisResult } from '@/types/tongue';

/**
 * 推理链状态
 */
export enum InferenceChainStatus {
  Idle = 'idle',
  Initialized = 'initialized',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
}

/**
 * 推理链核心类
 */
export class InferenceChain {
  /** 推理链ID */
  private chainId: string;
  /** 节点映射 */
  private nodes: Map<string, InferenceNode>;
  /** 拓扑排序后的执行顺序 */
  private executionOrder: string[];
  /** 当前状态 */
  private status: InferenceChainStatus;
  /** 错误信息 */
  private errorMessage?: string;
  /** 执行开始时间 */
  private startTime?: number;
  /** 执行结束时间 */
  private endTime?: number;
  
  /**
   * 构造函数
   */
  constructor(chainId?: string) {
    this.chainId = chainId || `chain-${Date.now()}`;
    this.nodes = new Map();
    this.executionOrder = [];
    this.status = InferenceChainStatus.Idle;
  }
  
  /**
   * 获取链ID
   */
  getId(): string {
    return this.chainId;
  }
  
  /**
   * 获取当前状态
   */
  getStatus(): InferenceChainStatus {
    return this.status;
  }
  
  /**
   * 获取所有节点
   */
  getNodes(): Map<string, InferenceNode> {
    return this.nodes;
  }
  
  /**
   * 获取节点
   */
  getNode(id: string): InferenceNode | undefined {
    return this.nodes.get(id);
  }
  
  /**
   * 添加节点
   */
  addNode(node: InferenceNode): void {
    this.nodes.set(node.id, node);
  }
  
  /**
   * 添加多个节点
   */
  addNodes(nodes: InferenceNode[]): void {
    for (const node of nodes) {
      this.addNode(node);
    }
  }
  
  /**
   * 移除节点
   */
  removeNode(id: string): boolean {
    return this.nodes.delete(id);
  }
  
  /**
   * 拓扑排序确定执行顺序
   * 使用Kahn算法
   */
  topologicalSort(): string[] {
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();
    
    // 初始化
    for (const [id] of this.nodes) {
      inDegree.set(id, 0);
      adjacency.set(id, []);
    }
    
    // 计算入度和构建邻接表
    for (const [id, node] of this.nodes) {
      for (const causeId of node.causes) {
        // causeId -> id 的边
        adjacency.get(causeId)?.push(id);
        inDegree.set(id, (inDegree.get(id) || 0) + 1);
      }
    }
    
    // BFS拓扑排序
    const queue: string[] = [];
    const result: string[] = [];
    
    // 入度为0的节点入队
    for (const [id, degree] of inDegree) {
      if (degree === 0) {
        queue.push(id);
      }
    }
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);
      
      for (const neighbor of adjacency.get(current) || []) {
        const newDegree = (inDegree.get(neighbor) || 1) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) {
          queue.push(neighbor);
        }
      }
    }
    
    // 检测环
    if (result.length !== this.nodes.size) {
      console.warn('推理链存在环，可能导致部分节点无法执行');
    }
    
    this.executionOrder = result;
    return result;
  }
  
  /**
   * 执行推理链
   * @param input 舌象分析输入
   * @param context 推理上下文
   * @returns 推理链执行结果
   */
  async execute(
    input: TongueAnalysisResult,
    context: InferenceContext
  ): Promise<InferenceChainOutput> {
    this.startTime = Date.now();
    this.status = InferenceChainStatus.Running;
    
    try {
      // 初始化层输入
      const layerInput: LayerInput = {
        tongueAnalysis: input,
        context: context as Record<string, any>,
      };
      
      // 执行拓扑排序
      this.topologicalSort();
      
      // 按顺序执行节点（实际由LayerProcessor处理）
      // 这里仅构建节点间的依赖关系
      
      // 生成最终输出
      const output = this.buildOutput(context);
      
      this.endTime = Date.now();
      this.status = InferenceChainStatus.Completed;
      
      return output;
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.status = InferenceChainStatus.Failed;
      this.endTime = Date.now();
      
      return {
        chainId: this.chainId,
        status: 'failed',
        nodes: this.nodes,
        executionOrder: this.executionOrder,
        syndrome: '',
        rootCause: '',
        transmissionPaths: [],
        organPatterns: [],
        errorMessage: this.errorMessage,
      };
    }
  }
  
  /**
   * 修正推理（基于问诊反馈）
   */
  correct(questionId: string, answer: string): void {
    // 查找相关修正规则
    for (const [id, node] of this.nodes) {
      for (const rule of node.corrections) {
        if (rule.questionId === questionId) {
          const matchingAnswer = rule.answers.find(a => a.answer === answer);
          if (matchingAnswer) {
            this.applyCorrection(id, matchingAnswer);
          }
        }
      }
    }
  }
  
  /**
   * 应用修正
   */
  private applyCorrection(
    nodeId: string,
    correction: { adjustmentType: string; modification: any }
  ): void {
    const node = this.nodes.get(nodeId);
    if (!node) return;
    
    switch (correction.adjustmentType) {
      case 'increase':
        node.conclusion.confidence = Math.min(1, 
          node.conclusion.confidence + (correction.modification.confidenceDelta || 0));
        break;
      case 'decrease':
        node.conclusion.confidence = Math.max(0, 
          node.conclusion.confidence - (correction.modification.confidenceDelta || 0));
        break;
      case 'replace':
        if (correction.modification.newConclusion) {
          node.conclusion = correction.modification.newConclusion;
        }
        break;
      case 'invalidate':
        node.conclusion.confidence = 0;
        break;
    }
  }
  
  /**
   * 构建输出
   */
  private buildOutput(context: InferenceContext): InferenceChainOutput {
    const organNodes = Array.from(this.nodes.values())
      .filter(n => n.type === 'organ');
    
    const organPatterns: OrganPattern[] = organNodes.map(node => ({
      organ: node.metadata?.organLocation?.[0] || '',
      pattern: node.conclusion.label,
      nature: node.metadata?.pathogenicNature || '',
      confidence: node.conclusion.confidence,
      mainSymptoms: node.conclusion.evidence,
      relatedNodeIds: [node.id, ...node.effects],
    }));
    
    const primaryPattern = organPatterns[0];
    
    return {
      chainId: this.chainId,
      status: this.status === InferenceChainStatus.Completed ? 'success' : 'partial',
      nodes: this.nodes,
      executionOrder: this.executionOrder,
      syndrome: primaryPattern?.pattern || '',
      rootCause: this.inferRootCause(),
      transmissionPaths: this.extractTransmissionPaths(),
      organPatterns,
      prescription: this.generatePrescription(),
      executionTime: this.endTime && this.startTime 
        ? this.endTime - this.startTime 
        : undefined,
    };
  }
  
  /**
   * 推断根本原因
   */
  private inferRootCause(): string {
    // 找到置信度最高且无前置节点的证型节点
    const rootNodes = Array.from(this.nodes.values())
      .filter(n => n.type === 'pattern' && n.causes.length === 0)
      .sort((a, b) => b.conclusion.confidence - a.conclusion.confidence);
    
    if (rootNodes.length > 0) {
      return rootNodes[0].conclusion.description;
    }
    return '未能确定根本原因';
  }
  
  /**
   * 提取传变路径
   */
  private extractTransmissionPaths(): string[] {
    return Array.from(this.nodes.values())
      .filter(n => n.type === 'transmission')
      .map(n => n.conclusion.description);
  }
  
  /**
   * 生成配穴方案（占位）
   */
  private generatePrescription(): Prescription | undefined {
    // Layer4 会生成实际的配穴方案
    return undefined;
  }
  
  /**
   * 获取推理链可视化数据
   */
  getVisualizationData(): ChainVisualization {
    const nodes = Array.from(this.nodes.values()).map(n => ({
      id: n.id,
      label: n.name || n.conclusion.label,
      layer: n.layer,
      type: n.type,
      confidence: n.conclusion.confidence,
    }));
    
    const edges: Array<{ source: string; target: string; label?: string }> = [];
    for (const [id, node] of this.nodes) {
      for (const effectId of node.effects) {
        edges.push({ source: id, target: effectId });
      }
    }
    
    return { nodes, edges };
  }
  
  /**
   * 重置推理链
   */
  reset(): void {
    this.nodes.clear();
    this.executionOrder = [];
    this.status = InferenceChainStatus.Idle;
    this.errorMessage = undefined;
    this.startTime = undefined;
    this.endTime = undefined;
  }
  
  /**
   * 从上下文创建推理链
   */
  static fromContext(input: TongueAnalysisResult): InferenceChain {
    const chain = new InferenceChain();
    chain.status = InferenceChainStatus.Initialized;
    return chain;
  }
}
