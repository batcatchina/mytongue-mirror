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
    
    // 分区规则
    {
      id: 'zone-001',
      name: '凹陷规则',
      description: '凹陷=亏，对应区域气血不足',
      type: 'zone',
      priority: 10,
      enabled: true,
    },
    {
      id: 'zone-002',
      name: '凸起规则',
      description: '凸起=堵，对应区域气血淤堵',
      type: 'zone',
      priority: 10,
      enabled: true,
    },
    {
      id: 'zone-003',
      name: '半透明规则',
      description: '半透明=气血亏虚严重',
      type: 'zone',
      priority: 25,
      enabled: true,
    },
    
    // 传变规则
    {
      id: 'transmission-001',
      name: '子盗母气规则',
      description: '子脏虚弱，消耗母脏资源',
      type: 'transmission',
      priority: 20,
      enabled: true,
    },
    {
      id: 'transmission-002',
      name: '母病及子规则',
      description: '母脏病变，影响子脏',
      type: 'transmission',
      priority: 20,
      enabled: true,
    },
    {
      id: 'transmission-003',
      name: '相克传变规则',
      description: '木克土/土克水等相克传变',
      type: 'transmission',
      priority: 15,
      enabled: true,
    },
  ];
}

/**
 * 禁用指定规则
 */
export function disableRule(ruleId: string): void {
  const rules = getEnabledRules();
  const rule = rules.find(r => r.id === ruleId);
  if (rule) {
    rule.enabled = false;
  }
}

/**
 * 启用指定规则
 */
export function enableRule(ruleId: string): void {
  const rules = getEnabledRules();
  const rule = rules.find(r => r.id === ruleId);
  if (rule) {
    rule.enabled = true;
  }
}

/**
 * 获取规则统计信息
 */
export function getRuleStats(): {
  total: number;
  enabled: number;
  disabled: number;
  byType: Record<string, number>;
} {
  const rules = getEnabledRules();
  const byType: Record<string, number> = {};
  
  for (const rule of rules) {
    byType[rule.type] = (byType[rule.type] || 0) + 1;
  }
  
  return {
    total: rules.length,
    enabled: rules.filter(r => r.enabled).length,
    disabled: rules.filter(r => !r.enabled).length,
    byType,
  };
}
