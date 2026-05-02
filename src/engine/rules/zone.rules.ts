/**
 * 分区辨证规则 v2.0
 * Layer 3 专用规则配置
 * 凹陷=亏 / 凸起=堵 / 半透明=气血亏虚
 * 三焦三等分 + 左右对称
 */

import type { ZonePosition, SidePosition, UndulationType } from '@/types/tongue';

/**
 * 分区辨证规则
 */
export interface ZoneRule {
  id: string;
  zone: ZonePosition;
  side?: SidePosition | 'both';
  undulation?: UndulationType | UndulationType[];
  colorPattern?: 'deep' | 'light' | 'normal';
  pattern: string;
  essence: string;
  description: string;
  mechanism: string;
  organs: string[];
  confidence: number;
  evidence: string[];
}

export const zoneRules: ZoneRule[] = [
  // ========== 舌尖/上焦 规则 ==========
  {
    id: 'L3-R01',
    zone: 'upperThird',
    side: 'center',
    undulation: 'depression',
    pattern: '心气血不足',
    essence: '虚',
    description: '舌尖凹陷为心气血不足',
    mechanism: '心气虚→心血不足→舌失所养→凹陷',
    organs: ['心', '小肠'],
    confidence: 0.7,
    evidence: ['舌尖凹陷=心气血不足'],
  },
  {
    id: 'L3-R02',
    zone: 'upperThird',
    side: 'center',
    undulation: 'bulge',
    pattern: '心肺郁热',
    essence: '实',
    description: '舌尖凸起为心肺郁热',
    mechanism: '热邪上炎→熏灼舌尖→凸起',
    organs: ['心', '肺'],
    confidence: 0.7,
    evidence: ['舌尖凸起=心肺郁热'],
  },
  {
    id: 'L3-R03',
    zone: 'upperThird',
    side: 'left',
    undulation: 'depression',
    pattern: '肺气血不足',
    essence: '虚',
    description: '舌左上焦凹陷为肺气血不足',
    mechanism: '肺气虚→宣发肃降失常→舌左前失养',
    organs: ['肺'],
    confidence: 0.65,
    evidence: ['舌左上焦凹陷=肺虚'],
  },
  {
    id: 'L3-R04',
    zone: 'upperThird',
    side: 'right',
    undulation: 'bulge',
    pattern: '胸膈郁结',
    essence: '实',
    description: '舌右上焦凸起为胸膈郁结',
    mechanism: '气机郁结→郁于胸膈→舌右前凸起',
    organs: ['胸膈'],
    confidence: 0.6,
    evidence: ['舌右上焦凸起=胸膈郁结'],
  },
  
  // ========== 舌中/中焦 规则 ==========
  {
    id: 'L3-R10',
    zone: 'middleThird',
    side: 'center',
    undulation: 'depression',
    pattern: '脾胃虚弱',
    essence: '虚',
    description: '舌中凹陷为脾胃虚弱',
    mechanism: '脾虚→运化失司→气血生化不足→舌中失养',
    organs: ['脾', '胃'],
    confidence: 0.75,
    evidence: ['舌中凹陷=脾胃虚弱'],
  },
  {
    id: 'L3-R11',
    zone: 'middleThird',
    side: 'center',
    undulation: 'bulge',
    pattern: '脾胃湿热/食积',
    essence: '实',
    description: '舌中凸起为脾胃湿热或食积',
    mechanism: '湿热/食积→中焦气机不畅→舌中凸起',
    organs: ['脾', '胃'],
    confidence: 0.7,
    evidence: ['舌中凸起=脾胃湿热/食积'],
  },
  {
    id: 'L3-R12',
    zone: 'middleThird',
    side: 'left',
    undulation: 'depression',
    pattern: '肝血不足',
    essence: '虚',
    description: '舌左中焦凹陷为肝血不足',
    mechanism: '肝血虚→目失所养→舌左肝区失养',
    organs: ['肝'],
    confidence: 0.65,
    evidence: ['舌左中焦凹陷=肝血不足'],
  },
  {
    id: 'L3-R13',
    zone: 'middleThird',
    side: 'left',
    undulation: 'bulge',
    colorPattern: 'deep',
    pattern: '肝郁化火',
    essence: '实',
    description: '舌左中焦色深凸起为肝郁化火',
    mechanism: '肝郁→气郁化火→灼伤舌左肝区',
    organs: ['肝'],
    confidence: 0.7,
    evidence: ['舌左中焦色深凸起=肝郁化火'],
  },
  {
    id: 'L3-R14',
    zone: 'middleThird',
    side: 'right',
    undulation: 'bulge',
    pattern: '胆郁',
    essence: '实',
    description: '舌右中焦凸起为胆郁',
    mechanism: '胆气郁结→郁于舌右胆区',
    organs: ['胆'],
    confidence: 0.65,
    evidence: ['舌右中焦凸起=胆郁'],
  },
  
  // ========== 舌根/下焦 规则 ==========
  {
    id: 'L3-R20',
    zone: 'lowerThird',
    side: 'center',
    undulation: 'depression',
    pattern: '肾精亏虚',
    essence: '虚',
    description: '舌根凹陷为肾精亏虚',
    mechanism: '肾精亏虚→腰膝酸软→舌根失养',
    organs: ['肾', '膀胱'],
    confidence: 0.75,
    evidence: ['舌根凹陷=肾精亏虚'],
  },
  {
    id: 'L3-R21',
    zone: 'lowerThird',
    side: 'center',
    undulation: 'bulge',
    pattern: '下焦湿热/瘀血',
    essence: '实',
    description: '舌根凸起为下焦湿热或瘀血',
    mechanism: '湿热/瘀血→郁于下焦→舌根凸起',
    organs: ['肾', '膀胱', '大肠'],
    confidence: 0.7,
    evidence: ['舌根凸起=下焦湿热/瘀血'],
  },
  {
    id: 'L3-R22',
    zone: 'lowerThird',
    side: 'left',
    undulation: 'depression',
    pattern: '生殖区虚损',
    essence: '虚',
    description: '舌左下焦凹陷为生殖区虚损',
    mechanism: '肾精不足→生殖功能下降→舌左下焦失养',
    organs: ['生殖区'],
    confidence: 0.6,
    evidence: ['舌左下焦凹陷=生殖区虚损'],
  },
  {
    id: 'L3-R23',
    zone: 'lowerThird',
    side: 'right',
    undulation: 'depression',
    pattern: '腿足虚损',
    essence: '虚',
    description: '舌右下焦凹陷为腿足虚损',
    mechanism: '肾气不足→腿足失养→舌右下焦失养',
    organs: ['腿'],
    confidence: 0.55,
    evidence: ['舌右下焦凹陷=腿足虚损'],
  },
  
  // ========== 半透明规则 ==========
  {
    id: 'L3-R30',
    zone: 'upperThird',
    undulation: 'semitransparent',
    pattern: '上焦气血大亏',
    essence: '虚（重）',
    description: '舌尖半透明为上焦气血大亏',
    mechanism: '气血严重亏虚→心肺功能下降→舌尖失养呈半透明',
    organs: ['心', '肺'],
    confidence: 0.8,
    evidence: ['舌尖半透明=上焦气血大亏'],
  },
  {
    id: 'L3-R31',
    zone: 'middleThird',
    undulation: 'semitransparent',
    pattern: '中焦气血大亏',
    essence: '虚（重）',
    description: '舌中半透明为中焦气血大亏',
    mechanism: '气血严重亏虚→脾胃运化失常→舌中失养呈半透明',
    organs: ['脾', '胃', '肝', '胆'],
    confidence: 0.8,
    evidence: ['舌中半透明=中焦气血大亏'],
  },
  {
    id: 'L3-R32',
    zone: 'lowerThird',
    undulation: 'semitransparent',
    pattern: '下焦气血大亏',
    essence: '虚（重）',
    description: '舌根半透明为下焦气血大亏',
    mechanism: '气血严重亏虚→肾精亏耗→舌根失养呈半透明',
    organs: ['肾', '膀胱'],
    confidence: 0.8,
    evidence: ['舌根半透明=下焦气血大亏'],
  },
  {
    id: 'L3-R33',
    zone: 'upperThird',
    side: 'both',
    undulation: 'semitransparent',
    pattern: '三焦气血亏虚',
    essence: '虚（极重）',
    description: '全舌半透明为三焦气血亏虚严重',
    mechanism: '气血不足脏腑功能下降，提示三高/体虚/危重',
    organs: ['心', '肝', '脾', '肺', '肾'],
    confidence: 0.9,
    evidence: ['全舌半透明=三焦气血亏虚严重'],
  },
];

/**
 * 颜色深浅辨证规则
 */
export interface ZoneColorRule {
  id: string;
  zone: ZonePosition;
  colorPattern: 'deep' | 'light';
  pattern: string;
  essence: string;
  mechanism: string;
  confidence: number;
}

export const zoneColorRules: ZoneColorRule[] = [
  {
    id: 'L3-C01',
    zone: 'upperThird',
    colorPattern: 'deep',
    pattern: '上焦郁热',
    essence: '热',
    mechanism: '热邪上炎，郁于上焦',
    confidence: 0.65,
  },
  {
    id: 'L3-C02',
    zone: 'middleThird',
    colorPattern: 'deep',
    pattern: '肝胆郁热',
    essence: '热',
    mechanism: '肝郁化火，胆热郁结',
    confidence: 0.7,
  },
  {
    id: 'L3-C03',
    zone: 'lowerThird',
    colorPattern: 'deep',
    pattern: '下焦湿热/瘀血',
    essence: '热/瘀',
    mechanism: '湿热下注，瘀血郁结',
    confidence: 0.65,
  },
  {
    id: 'L3-C04',
    zone: 'upperThird',
    colorPattern: 'light',
    pattern: '上焦气血不足',
    essence: '虚',
    mechanism: '气血不足，不能上荣',
    confidence: 0.6,
  },
  {
    id: 'L3-C05',
    zone: 'middleThird',
    colorPattern: 'light',
    pattern: '脾胃虚弱',
    essence: '虚',
    mechanism: '脾胃虚弱，气血生化不足',
    confidence: 0.65,
  },
  {
    id: 'L3-C06',
    zone: 'lowerThird',
    colorPattern: 'light',
    pattern: '肾虚',
    essence: '虚',
    mechanism: '肾精亏虚，不能充养',
    confidence: 0.6,
  },
];

/**
 * 匹配分区规则
 */
export function matchZoneRule(
  zone: ZonePosition,
  side?: SidePosition,
  undulation?: UndulationType,
  _colorPattern?: 'deep' | 'light' | 'normal'
): ZoneRule | undefined {
  return zoneRules.find(rule => {
    // 检查区域
    if (rule.zone !== zone) return false;
    
    // 检查左右（如果有要求）
    if (rule.side && rule.side !== 'both' && side) {
      if (rule.side !== side) return false;
    }
    
    // 检查凹凸（如果有要求）
    if (rule.undulation) {
      const undMatch = Array.isArray(rule.undulation)
        ? rule.undulation.includes(undulation || 'flat')
        : rule.undulation === undulation;
      if (!undMatch) return false;
    }
    
    return true;
  });
}

/**
 * 匹配分区颜色规则
 */
export function matchZoneColorRule(
  zone: ZonePosition,
  colorPattern: 'deep' | 'light'
): ZoneColorRule | undefined {
  return zoneColorRules.find(rule =>
    rule.zone === zone && rule.colorPattern === colorPattern
  );
}

/**
 * Layer3 规则导出
 */
export const Layer3Rules = {
  zoneRules,
  zoneColorRules,
  matchZoneRule,
  matchZoneColorRule,
};
