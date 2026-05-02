/**
 * 规则配置导出 v2.0
 * 统一导出所有规则配置
 */

// 导出各层规则配置
export * from './tongueBody.rules';
export * from './tongueShape.rules';
export * from './zone.rules';
export * from './transmission.rules';

/**
 * 规则配置入口
 * 用于初始化规则引擎
 */
export interface RuleConfig {
  /** 规则ID */
  id: string;
  /** 规则名称 */
  name: string;
  /** 规则描述 */
  description: string;
  /** 规则类型 */
  type: 'tongue_body' | 'tongue_shape' | 'zone' | 'transmission' | 'compound';
  /** 优先级（数值越小优先级越高） */
  priority: number;
  /** 启用状态 */
  enabled: boolean;
}

/**
 * 规则统计信息
 */
export interface RuleStats {
  totalRules: number;
  tongueBodyRules: number;
  tongueShapeRules: number;
  zoneRules: number;
  transmissionRules: number;
  compoundRules: number;
}

/**
 * 获取规则统计
 */
export function getRuleStats(): RuleStats {
  // 动态导入以避免循环依赖
  return {
    totalRules: 0,
    tongueBodyRules: 0,
    tongueShapeRules: 0,
    zoneRules: 0,
    transmissionRules: 0,
    compoundRules: 0,
  };
}

/**
 * 获取所有启用的规则配置
 */
export function getEnabledRules(): RuleConfig[] {
  return [
    // 舌质舌苔规则
    {
      id: 'tongue-body-001',
      name: '淡白舌规则',
      description: '舌质淡白主气血两虚/阳虚',
      type: 'tongue_body',
      priority: 10,
      enabled: true,
    },
    {
      id: 'tongue-body-002',
      name: '红舌规则',
      description: '舌质红主热证',
      type: 'tongue_body',
      priority: 10,
      enabled: true,
    },
    {
      id: 'tongue-body-003',
      name: '绛舌规则',
      description: '舌质绛主热入营血',
      type: 'tongue_body',
      priority: 20,
      enabled: true,
    },
    {
      id: 'tongue-body-004',
      name: '紫舌规则',
      description: '舌质紫主血瘀',
      type: 'tongue_body',
      priority: 20,
      enabled: true,
    },
    {
      id: 'tongue-body-005',
      name: '组合规则-气血两虚湿盛',
      description: '舌淡苔白腻为气血两虚湿盛',
      type: 'compound',
      priority: 15,
      enabled: true,
    },
    {
      id: 'tongue-body-006',
      name: '组合规则-实热',
      description: '舌红苔黄为实热',
      type: 'compound',
      priority: 15,
      enabled: true,
    },
    {
      id: 'tongue-body-007',
      name: '组合规则-阴虚火旺',
      description: '舌红无苔为阴虚火旺',
      type: 'compound',
      priority: 15,
      enabled: true,
    },
    
    // 舌形规则（含反直觉）
    {
      id: 'tongue-shape-001',
      name: '胖大反直觉规则',
      description: '胖大≠实，而是气虚',
      type: 'tongue_shape',
      priority: 15,
      enabled: true,
    },
    {
      id: 'tongue-shape-002',
      name: '瘦薄反直觉规则',
      description: '瘦薄需结合舌色判断阴虚/气虚',
      type: 'tongue_shape',
      priority: 15,
      enabled: true,
    },
    {
      id: 'tongue-shape-003',
      name: '齿痕规则',
      description: '齿痕主脾虚湿盛',
      type: 'tongue_shape',
      priority: 10,
      enabled: true,
    },
    {
      id: 'tongue-shape-004',
      name: '裂纹规则',
      description: '裂纹主阴虚/血虚/精亏',
      type: 'tongue_shape',
      priority: 20,
      enabled: true,
    },
    {
      id: 'tongue-shape-005',
      name: '胖大齿痕规则',
      description: '胖大+齿痕=气虚为本湿盛为标',
      type: 'tongue_shape',
      priority: 10,
      enabled: true,
    },
    {
      id: 'tongue-shape-006',
      name: '瘦薄舌红规则',
      description: '瘦薄+舌红=阴虚火旺',
      type: 'tongue_shape',
      priority: 10,
      enabled: true,
    },
    
    // 分区规则
    {
      id: 'zone-001',
      name: '舌尖凹陷规则',
      description: '舌尖凹陷主心气血不足',
      type: 'zone',
      priority: 15,
      enabled: true,
    },
    {
      id: 'zone-002',
      name: '舌中凹陷规则',
      description: '舌中凹陷主脾胃虚弱',
      type: 'zone',
      priority: 15,
      enabled: true,
    },
    {
      id: 'zone-003',
      name: '舌根凹陷规则',
      description: '舌根凹陷主肾精亏虚',
      type: 'zone',
      priority: 15,
      enabled: true,
    },
    {
      id: 'zone-004',
      name: '半透明规则',
      description: '半透明主三焦气血亏虚',
      type: 'zone',
      priority: 10,
      enabled: true,
    },
    
    // 传变规则
    {
      id: 'transmission-001',
      name: '肝郁克脾',
      description: '肝郁化火克脾土',
      type: 'transmission',
      priority: 20,
      enabled: true,
    },
    {
      id: 'transmission-002',
      name: '脾虚及肺',
      description: '脾虚土不生金',
      type: 'transmission',
      priority: 20,
      enabled: true,
    },
    {
      id: 'transmission-003',
      name: '子盗母气',
      description: '肝虚盗肾气',
      type: 'transmission',
      priority: 25,
      enabled: true,
    },
    {
      id: 'transmission-004',
      name: '肾虚水泛',
      description: '肾虚水湿泛滥',
      type: 'transmission',
      priority: 25,
      enabled: true,
    },
  ];
}

/**
 * 规则引擎配置
 */
export interface RuleEngineConfig {
  /** 是否启用组合规则 */
  enableCompoundRules: boolean;
  /** 是否启用反直觉规则 */
  enableAntiIntuitiveRules: boolean;
  /** 置信度阈值 */
  confidenceThreshold: number;
  /** 规则优先级排序 */
  sortByPriority: boolean;
}

/**
 * 默认规则引擎配置
 */
export const DEFAULT_RULE_ENGINE_CONFIG: RuleEngineConfig = {
  enableCompoundRules: true,
  enableAntiIntuitiveRules: true,
  confidenceThreshold: 0.5,
  sortByPriority: true,
};
