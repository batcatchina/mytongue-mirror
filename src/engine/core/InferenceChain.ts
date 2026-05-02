/**
 * 推理链核心类 v2.0
 * 管理推理节点、拓扑排序、执行推理链
 * 
 * Phase 1.2 核心实现：
 * - execute() 真正按序调用 Layer1→2→3→4 四层处理器
 * - 各层输出通过 previousLayerOutput 链式传递
 */

import type { 
  InferenceChainOutput, 
  InferenceNode, 
  LayerInput,
  LayerOutput,
  InferenceContext,
  OrganPattern,
  Prescription,
  ChainVisualization,
  InferenceLayer
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
 * 执行轨迹项
 */
export interface ExecutionTraceItem {
  timestamp: number;
  nodeId: string;
  layer: InferenceLayer;
  nodeName: string;
  conclusion: {
    label: string;
    confidence: number;
  };
  inputs: string[];
  executionTime?: number;
}

/**
 * 推理链输出（内部使用）
 */
export interface InferenceChainInternalOutput {
  chainId: string;
  status: 'success' | 'partial' | 'failed';
  nodes: Map<string, InferenceNode>;
  executionOrder: string[];
  syndrome: string;
  rootCause: string;
  transmissionPaths: string[];
  organPatterns: OrganPattern[];
  prescription?: Prescription;
  executionTime?: number;
  errorMessage?: string;
}

/**
 * 推理链核心类
 * 
 * 四层推理架构：
 * Layer1 舌质舌苔 → 气血与脾胃整体判断
 * Layer2 舌形 → 虚实本质（反直觉层）
 * Layer3 分区凹凸 → 精确定位（"神"之层）
 * Layer4 综合推理 → 传变关系+配穴方案
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
  /** 执行轨迹 */
  private executionTrace: ExecutionTraceItem[];
  /** 层级输出缓存 */
  private layerOutputs: Map<InferenceLayer, LayerOutput>;
  /** 最终输出 */
  private finalOutput?: InferenceChainInternalOutput;
  
  /**
   * 构造函数
   */
  constructor(chainId?: string) {
    this.chainId = chainId || `chain-${Date.now()}`;
    this.nodes = new Map();
    this.executionOrder = [];
    this.status = InferenceChainStatus.Idle;
    this.executionTrace = [];
    this.layerOutputs = new Map();
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
   * 记录执行轨迹
   */
  private recordTrace(
    nodeId: string,
    layer: InferenceLayer,
    nodeName: string,
    conclusion: { label: string; confidence: number },
    inputs: string[],
    executionTime?: number
  ): void {
    this.executionTrace.push({
      timestamp: Date.now(),
      nodeId,
      layer,
      nodeName,
      conclusion,
      inputs,
      executionTime,
    });
  }
  
  /**
   * 获取执行轨迹
   */
  getExecutionTrace(): ExecutionTraceItem[] {
    return [...this.executionTrace];
  }
  
  /**
   * 获取层级输出
   */
  getLayerOutput(layer: InferenceLayer): LayerOutput | undefined {
    return this.layerOutputs.get(layer);
  }
  
  /**
   * 设置层级输出
   */
  setLayerOutput(layer: InferenceLayer, output: LayerOutput): void {
    this.layerOutputs.set(layer, output);
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
   * ============================================================
   * Phase 1.2 核心实现：execute() 真正调用四层处理器
   * ============================================================
   */
  async execute(
    input: TongueAnalysisResult,
    context: InferenceContext
  ): Promise<InferenceChainOutput> {
    this.startTime = Date.now();
    this.status = InferenceChainStatus.Running;
    this.executionTrace = [];
    this.nodes = new Map();
    this.layerOutputs = new Map();
    
    try {
      // 动态导入四层处理器（避免循环依赖）
      const [{ Layer1Processor }, { Layer2Processor }, { Layer3Processor }, { Layer4Processor }] = 
        await Promise.all([
          import('../layers/Layer1Processor'),
          import('../layers/Layer2Processor'),
          import('../layers/Layer3Processor'),
          import('../layers/Layer4Processor'),
        ]);
      
      const layer1 = new Layer1Processor();
      const layer2 = new Layer2Processor();
      const layer3 = new Layer3Processor();
      const layer4 = new Layer4Processor();
      
      // =====================================================
      // Layer 1: 舌质舌苔 → 气血与脾胃整体判断
      // =====================================================
      const layer1Start = Date.now();
      const layer1Input: LayerInput = {
        tongueAnalysis: input,
        age: context?.age,
        context: context as Record<string, any>,
      };
      const layer1Output = layer1.process(layer1Input);
      this.setLayerOutput(1, layer1Output);
      this.addNodes(layer1Output.nodes);
      
      // 记录 Layer1 轨迹
      for (const node of layer1Output.nodes) {
        this.recordTrace(
          node.id, 1, node.name,
          { label: node.conclusion.label, confidence: node.conclusion.confidence },
          node.inputs.map(i => String(i.value)),
          Date.now() - layer1Start
        );
      }
      
      // =====================================================
      // Layer 2: 舌形 → 虚实本质（反直觉层）
      // =====================================================
      const layer2Start = Date.now();
      const layer2Input: LayerInput = {
        tongueAnalysis: input,
        previousLayerOutput: layer1Output,
        age: context?.age,
        context: context as Record<string, any>,
      };
      const layer2Output = layer2.process(layer2Input);
      this.setLayerOutput(2, layer2Output);
      this.addNodes(layer2Output.nodes);
      
      // 记录 Layer2 轨迹
      for (const node of layer2Output.nodes) {
        this.recordTrace(
          node.id, 2, node.name,
          { label: node.conclusion.label, confidence: node.conclusion.confidence },
          node.inputs.map(i => String(i.value)),
          Date.now() - layer2Start
        );
      }
      
      // =====================================================
      // Layer 3: 分区凹凸 → 精确定位（"神"之层）
      // =====================================================
      const layer3Start = Date.now();
      const layer3Input: LayerInput = {
        tongueAnalysis: input,
        previousLayerOutput: layer2Output,
        zoneFeatures: input.zoneFeatures,
        age: context?.age,
        context: context as Record<string, any>,
      };
      const layer3Output = layer3.process(layer3Input);
      this.setLayerOutput(3, layer3Output);
      this.addNodes(layer3Output.nodes);
      
      // 记录 Layer3 轨迹
      for (const node of layer3Output.nodes) {
        this.recordTrace(
          node.id, 3, node.name,
          { label: node.conclusion.label, confidence: node.conclusion.confidence },
          node.inputs.map(i => String(i.value)),
          Date.now() - layer3Start
        );
      }
      
      // =====================================================
      // Layer 4: 综合推理 → 传变关系+配穴方案
      // =====================================================
      const layer4Start = Date.now();
      const layer4Input: LayerInput = {
        tongueAnalysis: input,
        previousLayerOutput: layer3Output,
        age: context?.age,
        context: context as Record<string, any>,
      };
      const layer4Output = layer4.process(layer4Input);
      this.setLayerOutput(4, layer4Output);
      this.addNodes(layer4Output.nodes);
      
      // 记录 Layer4 轨迹
      for (const node of layer4Output.nodes) {
        this.recordTrace(
          node.id, 4, node.name,
          { label: node.conclusion.label, confidence: node.conclusion.confidence },
          node.inputs.map(i => String(i.value)),
          Date.now() - layer4Start
        );
      }
      
      // 执行拓扑排序（基于节点间的因果关系）
      this.topologicalSort();
      
      // 标记为完成，再构建输出（buildOutput 依赖 status）
      this.status = InferenceChainStatus.Completed;
      this.endTime = Date.now();
      
      // 构建最终输出
      this.finalOutput = this.buildOutput(context);
      
      return {
        chainId: this.finalOutput.chainId,
        status: this.finalOutput.status,
        nodes: this.finalOutput.nodes,
        executionOrder: this.finalOutput.executionOrder,
        syndrome: this.finalOutput.syndrome,
        rootCause: this.finalOutput.rootCause,
        transmissionPaths: this.finalOutput.transmissionPaths,
        organPatterns: this.finalOutput.organPatterns,
        prescription: this.finalOutput.prescription,
        executionTime: this.finalOutput.executionTime,
        errorMessage: this.finalOutput.errorMessage,
      };
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
   * 执行单个层级（供外部调用或调试）
   */
  executeLayer(
    layer: InferenceLayer,
    processor: { process: (input: LayerInput) => LayerOutput },
    input: LayerInput
  ): LayerOutput {
    const layerStartTime = Date.now();
    const output = processor.process(input);
    
    // 记录轨迹
    for (const node of output.nodes) {
      this.recordTrace(
        node.id,
        layer,
        node.name,
        { label: node.conclusion.label, confidence: node.conclusion.confidence },
        node.inputs.map(i => String(i.value)),
        Date.now() - layerStartTime
      );
    }
    
    // 添加节点到链
    this.addNodes(output.nodes);
    
    // 缓存层级输出
    this.setLayerOutput(layer, output);
    
    return output;
  }
  
  /**
   * 获取最终输出
   */
  getOutput(): InferenceChainOutput | undefined {
    if (!this.finalOutput) {
      return undefined;
    }
    
    return {
      chainId: this.finalOutput.chainId,
      status: this.finalOutput.status,
      nodes: this.finalOutput.nodes,
      executionOrder: this.finalOutput.executionOrder,
      syndrome: this.finalOutput.syndrome,
      rootCause: this.finalOutput.rootCause,
      transmissionPaths: this.finalOutput.transmissionPaths,
      organPatterns: this.finalOutput.organPatterns,
      prescription: this.finalOutput.prescription,
      executionTime: this.finalOutput.executionTime,
      errorMessage: this.finalOutput.errorMessage,
    };
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
  private buildOutput(_context: InferenceContext): InferenceChainInternalOutput {
    // 从 Layer4 获取脏腑辨证（如果执行了Layer4）
    const layer4Output = this.layerOutputs.get(4);
    let organPatterns: OrganPattern[] = [];
    let prescription: Prescription | undefined;
    
    if (layer4Output) {
      // 从 Layer4 节点中提取脏腑辨证
      organPatterns = this.extractOrganPatternsFromNodes(layer4Output.nodes);
      // 从 Layer4 节点中提取配穴方案
      const prescriptionNode = layer4Output.nodes.find(n => n.type === 'prescription');
      if (prescriptionNode) {
        // 解析配穴节点构建 Prescription
        prescription = this.parsePrescriptionFromNode(prescriptionNode);
      }
    }
    
    // 从各层输出中生成证型结论
    const layer1Summary = this.layerOutputs.get(1)?.summary.label || '';
    const layer2Summary = this.layerOutputs.get(2)?.summary.label || '';
    const layer3Summary = this.layerOutputs.get(3)?.summary.label || '';
    const layer4Summary = layer4Output?.summary.label || '';
    
    // 生成综合证型：优先使用 Layer4 结论，否则拼接前三层
    let syndrome = '';
    if (layer4Summary) {
      syndrome = layer4Summary;
    } else if (layer3Summary) {
      syndrome = `${layer2Summary}，${layer3Summary}`;
    } else if (layer2Summary) {
      syndrome = layer2Summary;
    } else if (layer1Summary) {
      syndrome = layer1Summary;
    }
    
    return {
      chainId: this.chainId,
      status: this.status === InferenceChainStatus.Completed ? 'success' : 'partial',
      nodes: this.nodes,
      executionOrder: this.executionOrder,
      syndrome,
      rootCause: this.inferRootCause(),
      transmissionPaths: this.extractTransmissionPaths(),
      organPatterns,
      prescription,
      executionTime: this.endTime && this.startTime 
        ? this.endTime - this.startTime 
        : undefined,
    };
  }
  
  /**
   * 从节点列表提取脏腑辨证
   */
  private extractOrganPatternsFromNodes(nodes: InferenceNode[]): OrganPattern[] {
    const organMap = new Map<string, OrganPattern>();
    
    for (const node of nodes) {
      if (node.type === 'organ') {
        const organ = node.metadata?.organLocation?.[0] || '';
        if (organ) {
          organMap.set(organ, {
            organ,
            pattern: node.conclusion.label,
            nature: node.metadata?.pathogenicNature || '',
            confidence: node.conclusion.confidence,
            mainSymptoms: node.conclusion.evidence,
            relatedNodeIds: [node.id, ...node.effects],
          });
        }
      } else if (node.type === 'pattern') {
        // 从 pattern 节点中提取脏腑
        const organs = ['心', '肝', '脾', '肺', '肾', '胃', '胆'];
        for (const organ of organs) {
          if (node.conclusion.description.includes(organ)) {
            const existing = organMap.get(organ);
            if (!existing || node.conclusion.confidence > existing.confidence) {
              organMap.set(organ, {
                organ,
                pattern: node.conclusion.label,
                nature: node.conclusion.label.includes('虚') ? '虚证' : 
                        node.conclusion.label.includes('实') ? '实证' : '虚实夹杂',
                confidence: node.conclusion.confidence,
                mainSymptoms: node.conclusion.evidence,
                relatedNodeIds: [node.id],
              });
            }
          }
        }
      }
    }
    
    return Array.from(organMap.values()).sort((a, b) => b.confidence - a.confidence);
  }
  
  /**
   * 从配穴节点解析配穴方案
   */
  private parsePrescriptionFromNode(node: InferenceNode): Prescription {
    // 从节点结论中提取配穴信息
    const label = node.conclusion.label;
    const mainPoints = label.split('、').filter(p => p.trim());
    
    return {
      id: node.id,
      mainPoints,
      secondaryPoints: [],
      technique: '平补平泻',
      needleRetention: 30,
      moxibustion: '视情况而定',
      frequency: '每周2-3次',
      course: '4周为一疗程',
      precautions: ['避开空腹和过饱', '治疗后注意保暖'],
      basis: node.conclusion.evidence,
      confidence: node.conclusion.confidence,
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
   * 生成可视化数据
   */
  generateVisualizationData(): ChainVisualization {
    const nodes: ChainVisualization['nodes'] = [];
    const edges: ChainVisualization['edges'] = [];
    
    for (const [id, node] of this.nodes) {
      nodes.push({
        id,
        label: node.conclusion.label || node.name,
        layer: node.layer,
        type: node.type,
        confidence: node.conclusion.confidence,
      });
      
      // 添加因果边
      for (const causeId of node.causes) {
        if (this.nodes.has(causeId)) {
          edges.push({ source: causeId, target: id });
        }
      }
    }
    
    return { nodes, edges };
  }
}
