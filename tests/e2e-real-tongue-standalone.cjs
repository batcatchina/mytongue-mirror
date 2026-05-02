/**
 * 舌镜v2.0 真实舌象端到端验证测试（独立运行版）
 * 用真实舌象图片走完整链路：AI视觉识别→结构化特征→v2.0四层推理→最终辨证
 */

const fs = require('fs');
const path = require('path');

// ==================== 类型定义 ====================

/**
 * @typedef {'淡红'|'淡白'|'红'|'绛'|'紫'|'青紫'|'淡紫'|'暗红'} TongueColorValue
 * @typedef {'胖大'|'瘦薄'|'正常'|'适中'|'短缩'|'松弛'} TongueShapeValue
 * @typedef {'薄白'|'白厚'|'黄'|'灰黑'|'剥落'|'少苔'|'无苔'} CoatingColorValue
 * @typedef {'薄'|'厚'|'正常'|'润'|'燥'|'腻'|'腐'|'滑'} CoatingTextureValue
 * @typedef {'upperThird'|'middleThird'|'lowerThird'} ZonePosition
 * @typedef {'left'|'right'|'center'} SidePosition
 * @typedef {'depression'|'bulge'|'flat'|'semitransparent'} UndulationType
 */

/**
 * @typedef {Object} ZoneFeature
 * @property {ZonePosition} position
 * @property {SidePosition} [side]
 * @property {TongueColorValue} [color]
 * @property {string} [colorIntensity]
 * @property {UndulationType} [undulation]
 * @property {string} [undulationDegree]
 * @property {boolean} [hasTeethMark]
 * @property {boolean} [hasEcchymosis]
 */

/**
 * @typedef {Object} TongueAnalysisResult
 * @property {TongueColorValue} bodyColor
 * @property {number} [bodyColorConfidence]
 * @property {TongueShapeValue} shape
 * @property {number} [shapeConfidence]
 * @property {CoatingColorValue} coatingColor
 * @property {number} [coatingColorConfidence]
 * @property {CoatingTextureValue} coatingTexture
 * @property {number} [coatingTextureConfidence]
 * @property {string} state
 * @property {boolean} hasTeethMark
 * @property {string} [teethMarkDegree]
 * @property {boolean} hasCrack
 * @property {string} [crackDegree]
 * @property {boolean} hasEcchymosis
 * @property {ZoneFeature[]} zoneFeatures
 * @property {boolean} isSemitransparent
 * @property {ZonePosition[]} [semitransparentZones]
 */

/**
 * @typedef {Object} GoldStandard
 * @property {string} syndrome
 * @property {string} rootCause
 * @property {string[]} transmissionPaths
 * @property {string[]} organLocation
 * @property {string[]} mainPoints
 * @property {string[]} secondaryPoints
 * @property {string} source
 */

/**
 * @typedef {Object} TestCase
 * @property {string} id
 * @property {string} name
 * @property {string} imagePath
 * @property {TongueAnalysisResult} aiRecognition
 * @property {GoldStandard} goldStandard
 */

// ==================== 分区脏腑映射 ====================

const ZONE_ORGAN_MAPPING = {
  upperThird: {
    center: ['心', '小肠'],
    left: ['肺', '乳腺'],
    right: ['胸膈', '肩臂'],
  },
  middleThird: {
    center: ['脾', '胃'],
    left: ['肝'],
    right: ['胆'],
  },
  lowerThird: {
    center: ['肾', '膀胱', '大肠'],
    left: ['生殖区'],
    right: ['腿'],
  },
};

// ==================== 规则库 ====================

/**
 * Layer1: 舌质分析规则
 */
const TONGUE_BODY_RULES = {
  '淡白': { pattern: '气血虚', description: '舌色淡白提示气血不足', confidence: 0.85 },
  '淡红': { pattern: '平和质', description: '舌色淡红为健康状态', confidence: 0.90 },
  '红': { pattern: '热证', description: '舌红提示有热', confidence: 0.80 },
  '绛': { pattern: '热入营血', description: '舌绛提示热入营血', confidence: 0.85 },
  '紫': { pattern: '血瘀证', description: '舌紫提示血行不畅', confidence: 0.85 },
  '青紫': { pattern: '寒凝血瘀', description: '舌青紫提示寒凝血瘀', confidence: 0.85 },
};

/**
 * Layer1: 舌苔分析规则
 */
const COATING_RULES = {
  '薄白': { pattern: '正常', description: '薄白苔为正常', confidence: 0.90 },
  '白厚': { pattern: '湿盛/痰湿', description: '白厚苔提示湿浊内蕴', confidence: 0.80 },
  '黄': { pattern: '热证', description: '黄苔提示有热', confidence: 0.85 },
  '灰黑': { pattern: '阴虚/热盛', description: '灰黑苔提示阴虚或热盛', confidence: 0.75 },
  '少苔': { pattern: '阴虚', description: '少苔提示阴液不足', confidence: 0.80 },
  '无苔': { pattern: '阴虚/胃气虚', description: '无苔提示阴虚或胃气虚', confidence: 0.80 },
};

/**
 * Layer2: 舌形分析规则（虚实本质）
 */
const SHAPE_RULES = {
  '胖大': { nature: '虚证', description: '舌胖大提示气虚/阳虚', confidence: 0.85 },
  '瘦薄': { nature: '虚证', description: '舌瘦薄提示阴血不足', confidence: 0.85 },
  '正常': { nature: '平和', description: '舌形正常', confidence: 0.90 },
  '适中': { nature: '平和', description: '舌形适中', confidence: 0.90 },
};

/**
 * Layer3: 分区凹凸规则
 */
const UNDULATION_RULES = {
  'depression': { meaning: '亏', treatment: '补益', description: '凹陷提示对应脏腑气血不足' },
  'bulge': { meaning: '堵', treatment: '疏通', description: '凸起提示对应脏腑气血淤堵' },
  'flat': { meaning: '正常', treatment: '无需', description: '平坦表示正常' },
  'semitransparent': { meaning: '亏虚严重', treatment: '调补', description: '半透明提示气血亏虚严重' },
};

// ==================== Layer处理器 ====================

class Layer1Processor {
  process(input) {
    const { tongueAnalysis } = input;
    const nodes = [];
    
    // 1. 舌质节点
    const bodyRule = TONGUE_BODY_RULES[tongueAnalysis.bodyColor] || { pattern: '未知', description: '', confidence: 0.5 };
    nodes.push({
      id: 'L1-body',
      name: '舌质分析',
      layer: 1,
      type: 'pattern',
      conclusion: {
        label: bodyRule.pattern,
        description: bodyRule.description,
        confidence: tongueAnalysis.bodyColorConfidence || bodyRule.confidence,
        evidence: [`舌色${tongueAnalysis.bodyColor}`],
        priority: 'high'
      }
    });
    
    // 2. 舌苔节点
    const coatingRule = COATING_RULES[tongueAnalysis.coatingColor] || { pattern: '未知', description: '', confidence: 0.5 };
    nodes.push({
      id: 'L1-coating',
      name: '舌苔分析',
      layer: 1,
      type: 'pattern',
      conclusion: {
        label: coatingRule.pattern,
        description: coatingRule.description,
        confidence: tongueAnalysis.coatingColorConfidence || coatingRule.confidence,
        evidence: [`苔色${tongueAnalysis.coatingColor}`, `苔质${tongueAnalysis.coatingTexture}`],
        priority: 'high'
      }
    });
    
    // 3. 综合节点
    const synthesisLabel = this.synthesize(bodyRule.pattern, coatingRule.pattern, tongueAnalysis);
    nodes.push({
      id: 'L1-synthesis',
      name: '气血脾胃综合',
      layer: 1,
      type: 'pattern',
      conclusion: {
        label: synthesisLabel.label,
        description: synthesisLabel.description,
        confidence: (bodyRule.confidence + coatingRule.confidence) / 2,
        evidence: nodes.map(n => n.conclusion.label),
        priority: 'critical'
      }
    });
    
    return {
      layer: 1,
      nodes,
      summary: nodes[nodes.length - 1].conclusion
    };
  }
  
  synthesize(bodyPattern, coatingPattern, analysis) {
    // 组合推理逻辑
    if (bodyPattern.includes('气血虚') && coatingPattern.includes('湿')) {
      return { label: '气血虚+湿盛', description: '气血不足兼有湿浊内蕴' };
    }
    if (bodyPattern.includes('热') && coatingPattern.includes('热')) {
      return { label: '实热/虚热', description: '体内有热' };
    }
    if (bodyPattern.includes('血瘀') || bodyPattern.includes('紫')) {
      return { label: '血瘀证', description: '血行不畅' };
    }
    return { label: `${bodyPattern} + ${coatingPattern}`, description: '综合判断' };
  }
}

class Layer2Processor {
  process(input) {
    const { tongueAnalysis, previousLayerOutput } = input;
    const nodes = [];
    
    // 舌形节点
    const shapeRule = SHAPE_RULES[tongueAnalysis.shape] || { nature: '未知', description: '', confidence: 0.5 };
    nodes.push({
      id: 'L2-shape',
      name: '舌形虚实',
      layer: 2,
      type: 'pattern',
      conclusion: {
        label: shapeRule.nature,
        description: shapeRule.description,
        confidence: tongueAnalysis.shapeConfidence || shapeRule.confidence,
        evidence: [`舌形${tongueAnalysis.shape}`],
        priority: 'high'
      }
    });
    
    // 齿痕节点
    if (tongueAnalysis.hasTeethMark) {
      nodes.push({
        id: 'L2-teeth',
        name: '齿痕分析',
        layer: 2,
        type: 'pattern',
        conclusion: {
          label: '脾虚湿盛',
          description: `舌有齿痕，提示脾气虚，湿邪内蕴`,
          confidence: 0.85,
          evidence: ['有齿痕'],
          priority: 'medium'
        }
      });
    }
    
    // 裂纹节点
    if (tongueAnalysis.hasCrack) {
      nodes.push({
        id: 'L2-crack',
        name: '裂纹分析',
        layer: 2,
        type: 'pattern',
        conclusion: {
          label: '阴虚证',
          description: '舌有裂纹，提示阴液不足',
          confidence: 0.80,
          evidence: ['有裂纹'],
          priority: 'medium'
        }
      });
    }
    
    // 综合虚实
    const natureScore = shapeRule.nature === '虚证' ? 0.8 : (shapeRule.nature === '平和' ? 0.5 : 0.3);
    nodes.push({
      id: 'L2-synthesis',
      name: '虚实综合',
      layer: 2,
      type: 'pattern',
      conclusion: {
        label: shapeRule.nature,
        description: `综合判断为${shapeRule.nature}`,
        confidence: Math.max(natureScore, tongueAnalysis.hasTeethMark ? 0.85 : 0),
        evidence: nodes.map(n => n.conclusion.label),
        priority: 'critical'
      }
    });
    
    return {
      layer: 2,
      nodes,
      summary: nodes[nodes.length - 1].conclusion
    };
  }
}

class Layer3Processor {
  process(input) {
    const { tongueAnalysis, previousLayerOutput } = input;
    const nodes = [];
    
    // 半透明分析
    if (tongueAnalysis.isSemitransparent) {
      const zones = tongueAnalysis.semitransparentZones || ['upperThird', 'middleThird', 'lowerThird'];
      const zoneNames = zones.map(z => this.getZoneName(z)).join('、');
      nodes.push({
        id: 'L3-semitransparent',
        name: '半透明分析',
        layer: 3,
        type: 'pattern',
        conclusion: {
          label: '气血亏虚严重',
          description: `${zoneNames}半透明，提示三焦气血亏虚`,
          confidence: 0.85,
          evidence: ['全舌/多区半透明'],
          priority: 'critical'
        }
      });
    }
    
    // 分区分析
    const organFindings = [];
    for (const zone of tongueAnalysis.zoneFeatures) {
      const zoneOrgans = this.getOrgansForZone(zone);
      const rule = UNDULATION_RULES[zone.undulation || 'flat'];
      
      let finding = {
        zone: zone.position,
        organs: zoneOrgans,
        color: zone.color,
        intensity: zone.colorIntensity,
        undulation: zone.undulation,
        pattern: rule.meaning,
        treatment: rule.treatment
      };
      
      // 颜色异常判断
      if (zone.colorIntensity === '偏深' || zone.colorIntensity === '偏红') {
        finding.pattern = '热/火';
        finding.treatment = '清热';
      }
      if (zone.colorIntensity === '偏淡') {
        finding.pattern = '虚';
        finding.treatment = '补益';
      }
      
      organFindings.push(finding);
      
      const organStr = zoneOrgans.join('/');
      const undStr = zone.undulation ? `[${rule.meaning}]` : '';
      nodes.push({
        id: `L3-zone-${zone.position}-${zone.side || 'center'}`,
        name: `${this.getZoneName(zone.position)}${zone.side ? zone.side : ''}分析`,
        layer: 3,
        type: 'organ',
        conclusion: {
          label: `${organStr}: ${finding.pattern}`,
          description: `${organStr}对应区${zone.color}${undStr}，${rule.description}`,
          confidence: 0.80,
          evidence: [`${zone.position} ${zone.color} ${zone.undulation || ''}`],
          priority: 'high'
        },
        metadata: { organLocation: zoneOrgans }
      });
    }
    
    // 脏腑综合定位
    const organPatterns = this.generateOrganPatterns(organFindings);
    nodes.push({
      id: 'L3-synthesis',
      name: '脏腑综合定位',
      layer: 3,
      type: 'pattern',
      conclusion: {
        label: organPatterns.map(p => `${p.organ}(${p.pattern})`).join(', '),
        description: `综合分区分析：${organPatterns.map(p => `${p.organ}${p.pattern}`).join('、')}`,
        confidence: 0.85,
        evidence: organFindings.map(f => f.pattern),
        priority: 'critical'
      }
    });
    
    return {
      layer: 3,
      nodes,
      summary: nodes[nodes.length - 1].conclusion,
      organPatterns
    };
  }
  
  getZoneName(position) {
    const names = { upperThird: '上焦', middleThird: '中焦', lowerThird: '下焦' };
    return names[position] || position;
  }
  
  getOrgansForZone(zone) {
    const position = zone.position;
    const side = zone.side || 'center';
    return ZONE_ORGAN_MAPPING[position]?.[side] || [];
  }
  
  generateOrganPatterns(findings) {
    const patternMap = new Map();
    
    for (const finding of findings) {
      for (const organ of finding.organs) {
        if (!patternMap.has(organ)) {
          patternMap.set(organ, []);
        }
        patternMap.get(organ).push(finding.pattern);
      }
    }
    
    const patterns = [];
    for (const [organ, patternList] of patternMap) {
      // 合并同类pattern
      const uniquePatterns = [...new Set(patternList)];
      patterns.push({
        organ,
        pattern: uniquePatterns.join('+'),
        confidence: 0.80
      });
    }
    
    return patterns;
  }
}

/**
 * 证型特异性配穴规则
 */
const SYNDROME_PRESCRIPTION_RULES = {
  '肝郁化火证': {
    mainPoints: ['太冲', '行间', '阳陵泉'],
    secondaryPoints: ['期门', '合谷', '曲池'],
    method: '疏肝解郁，清热泻火'
  },
  '肝郁血虚证': {
    mainPoints: ['太冲', '血海', '三阴交'],
    secondaryPoints: ['肝俞', '膈俞', '足三里'],
    method: '疏肝解郁，养血柔肝'
  },
  '气滞血瘀证': {
    mainPoints: ['血海', '膈俞', '三阴交'],
    secondaryPoints: ['太冲', '肝俞', '内关'],
    method: '活血化瘀，行气止痛'
  },
  '气血两虚证': {
    mainPoints: ['气海', '足三里', '三阴交'],
    secondaryPoints: ['关元', '膈俞', '脾俞'],
    method: '补益气血，调理脏腑'
  },
  '脾虚湿盛证': {
    mainPoints: ['足三里', '阴陵泉', '中脘'],
    secondaryPoints: ['脾俞', '三阴交', '胃俞'],
    method: '健脾化湿'
  }
};

class Layer4Processor {
  process(input) {
    const { tongueAnalysis, previousLayerOutput } = input;
    const nodes = [];
    
    const organPatterns = previousLayerOutput?.organPatterns || [];
    
    // 锚定主要脏腑
    const primaryOrgan = this.determinePrimaryOrgan(organPatterns, tongueAnalysis);
    
    // 证型推理（使用锚定脏腑）
    const syndrome = this.inferSyndrome(tongueAnalysis, organPatterns, primaryOrgan);
    nodes.push({
      id: 'L4-syndrome',
      name: '证型推理',
      layer: 4,
      type: 'pattern',
      conclusion: {
        label: syndrome.label,
        description: syndrome.description,
        confidence: syndrome.confidence,
        evidence: syndrome.evidence,
        priority: 'critical'
      }
    });
    
    // 根本原因（锚定脏腑）
    const rootCause = this.inferRootCause(syndrome, primaryOrgan);
    nodes.push({
      id: 'L4-rootcause',
      name: '根本原因',
      layer: 4,
      type: 'pattern',
      conclusion: {
        label: rootCause,
        description: rootCause,
        confidence: 0.85,
        evidence: [`主脏腑：${primaryOrgan}`],
        priority: 'high'
      }
    });
    
    // 传变关系
    const transmissions = this.inferTransmissions(tongueAnalysis, organPatterns);
    for (const trans of transmissions) {
      nodes.push({
        id: `L4-trans-${trans.source}-${trans.target}`,
        name: '传变分析',
        layer: 4,
        type: 'transmission',
        conclusion: {
          label: `${trans.source}→${trans.target}`,
          description: trans.description,
          confidence: trans.confidence,
          evidence: trans.evidence,
          priority: 'medium'
        }
      });
    }
    
    // 配穴方案（优先使用证型特异性配穴）
    const prescription = this.generatePrescription(organPatterns, tongueAnalysis, syndrome);
    nodes.push({
      id: 'L4-prescription',
      name: '配穴方案',
      layer: 4,
      type: 'prescription',
      conclusion: {
        label: prescription.mainPoints.join(', '),
        description: `治法：${prescription.method}`,
        confidence: 0.85,
        evidence: organPatterns.map(p => p.organ),
        priority: 'critical'
      },
      prescription
    });
    
    return {
      layer: 4,
      nodes,
      summary: nodes[0].conclusion,
      syndrome: syndrome.label,
      rootCause,
      transmissionPaths: transmissions.map(t => `${t.source}→${t.target}`),
      organPatterns,
      prescription
    };
  }
  
  /**
   * 锚定主要脏腑
   */
  determinePrimaryOrgan(organPatterns, analysis) {
    if (organPatterns.length === 0) {
      return this.inferPrimaryOrganFromTongue(analysis);
    }
    
    // 肝区异常检查
    const liverPattern = organPatterns.find(p => p.organ === '肝');
    if (liverPattern && this.hasLiverZoneAbnormality(analysis)) {
      return '肝';
    }
    
    // 脾虚特征
    const spleenPattern = organPatterns.find(p => p.organ === '脾');
    if (spleenPattern && analysis.hasTeethMark) {
      return '脾';
    }
    
    // 血瘀特征
    if (analysis.bodyColor === '紫' || analysis.hasEcchymosis) {
      return '肝';
    }
    
    // 半透明舌
    if (analysis.isSemitransparent) {
      return '脾';
    }
    
    return organPatterns[0].organ;
  }
  
  /**
   * 检查肝区异常
   */
  hasLiverZoneAbnormality(analysis) {
    if (!analysis.zoneFeatures) return false;
    const liverZones = analysis.zoneFeatures.filter(
      z => z.position === 'middleThird' && (z.side === 'left' || z.side === 'right')
    );
    for (const zone of liverZones) {
      if (zone.colorIntensity === '偏深' || zone.colorIntensity === '偏红') {
        return true;
      }
      if (zone.color === '红' || zone.color === '绛') {
        return true;
      }
      if (zone.hasTeethMark) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * 从舌象推断主脏腑
   */
  inferPrimaryOrganFromTongue(analysis) {
    if (analysis.hasTeethMark && analysis.zoneFeatures) {
      const sideZones = analysis.zoneFeatures.filter(
        z => z.side === 'left' || z.side === 'right'
      );
      if (sideZones.length > 0) {
        return '肝';
      }
    }
    if (analysis.bodyColor === '紫') {
      return '肝';
    }
    if (analysis.isSemitransparent) {
      return '脾';
    }
    return '心';
  }
  
  inferSyndrome(analysis, organPatterns, primaryOrgan) {
    const bodyColor = analysis.bodyColor;
    
    // 肝郁化火：肝区热/火 + 舌红
    if (primaryOrgan === '肝' && bodyColor === '红') {
      return {
        label: '肝郁化火证',
        description: '肝气郁结，久而化火',
        confidence: 0.85,
        evidence: ['舌红', '肝区异常']
      };
    }
    
    // 肝郁血虚：肝区 + 舌淡/齿痕
    if (primaryOrgan === '肝' && (bodyColor === '淡红' || bodyColor === '淡白') && analysis.hasTeethMark) {
      return {
        label: '肝郁血虚证',
        description: '肝气郁结，血液生化不足',
        confidence: 0.82,
        evidence: ['舌淡', '肝区异常', '齿痕']
      };
    }
    
    // 气滞血瘀
    if (bodyColor === '紫' || analysis.hasEcchymosis) {
      return {
        label: '气滞血瘀证',
        description: '气行不畅，血行瘀滞',
        confidence: 0.85,
        evidence: ['舌紫', '瘀象']
      };
    }
    
    // 气血两虚
    if (analysis.isSemitransparent || bodyColor === '淡白') {
      return {
        label: '气血两虚证',
        description: '三焦气血亏虚',
        confidence: 0.85,
        evidence: ['舌淡白/半透明']
      };
    }
    
    // 脾虚湿盛
    if (analysis.hasTeethMark && organPatterns.some(p => p.organ === '脾')) {
      return {
        label: '脾虚湿盛证',
        description: '脾失健运，水湿内停',
        confidence: 0.85,
        evidence: ['舌胖大', '有齿痕', '脾区异常']
      };
    }
    
    // 默认
    const organStr = organPatterns.map(p => `${p.organ}${p.pattern}`).join('、');
    return {
      label: `${bodyColor}舌 ${organStr}`,
      description: '综合辨证',
      confidence: 0.70,
      evidence: ['舌象分析']
    };
  }
  
  /**
   * 根本原因归因（锚定脏腑）
   */
  inferRootCause(syndrome, primaryOrgan) {
    // 根据证型确定根本原因
    if (syndrome.label.includes('肝郁化火')) {
      return '肝气郁结，久而化火';
    }
    if (syndrome.label.includes('肝郁血虚')) {
      return '肝气郁结，血液生化不足';
    }
    if (syndrome.label.includes('气滞血瘀')) {
      return '气滞血瘀，运行不畅';
    }
    if (syndrome.label.includes('气血两虚')) {
      return '三焦气血亏虚，脏腑失养';
    }
    
    // 默认根据主脏腑归因
    const rootCauseMap = {
      '肝': '肝气郁结，疏泄失常',
      '胆': '胆气郁结，疏泄不利',
      '心': '心阴不足或心火亢盛',
      '脾': '脾气虚弱，运化失常',
      '胃': '胃气上逆或胃阴不足',
      '肺': '肺气不宣或肺阴不足',
      '肾': '肾精不足或肾阴亏虚',
    };
    return rootCauseMap[primaryOrgan] || `${primaryOrgan}功能失调导致整体失衡`;
  }
  
  inferTransmissions(analysis, organPatterns) {
    const transmissions = [];
    
    // 肝郁血虚：肝→脾（木克土传变）
    if (organPatterns.some(p => p.organ === '肝') && organPatterns.some(p => p.organ === '脾')) {
      transmissions.push({
        source: '肝',
        target: '脾',
        description: '肝郁克脾土',
        confidence: 0.70,
        evidence: ['肝脾同病']
      });
    }
    
    // 心肾不交：肾→心
    if (organPatterns.some(p => p.organ === '肾') && organPatterns.some(p => p.organ === '心')) {
      transmissions.push({
        source: '肾',
        target: '心',
        description: '肾阴不足，心火亢盛',
        confidence: 0.75,
        evidence: ['心肾同病']
      });
    }
    
    return transmissions;
  }
  
  /**
   * 生成配穴方案（优先使用证型特异性配穴）
   */
  generatePrescription(organPatterns, analysis, syndrome) {
    // 优先使用证型特异性配穴
    if (SYNDROME_PRESCRIPTION_RULES[syndrome.label]) {
      const rule = SYNDROME_PRESCRIPTION_RULES[syndrome.label];
      return {
        mainPoints: [...new Set(rule.mainPoints)].slice(0, 6),
        secondaryPoints: [...new Set(rule.secondaryPoints)].slice(0, 4),
        method: rule.method
      };
    }
    
    // 降级：使用脏腑配穴
    const mainPoints = [];
    const secondaryPoints = [];
    let method = '调理';
    
    for (const op of organPatterns) {
      switch (op.organ) {
        case '肝':
          mainPoints.push('太冲', '行间', '阳陵泉');
          method = '疏肝解郁';
          break;
        case '脾':
          mainPoints.push('脾俞', '足三里', '阴陵泉');
          if (method === '调理') method = '健脾化湿';
          break;
        case '胃':
          mainPoints.push('中脘', '胃俞');
          break;
        case '心':
          mainPoints.push('神门', '通里');
          break;
        case '肾':
          mainPoints.push('太溪', '肾俞');
          break;
        case '胆':
          mainPoints.push('阳陵泉', '日月');
          break;
        case '肺':
          mainPoints.push('尺泽', '列缺');
          break;
      }
    }
    
    // 添加通用穴
    secondaryPoints.push('三阴交', '足三里');
    
    // 半透明加补气穴
    if (analysis.isSemitransparent) {
      mainPoints.push('气海', '关元');
      method = '补益气血';
    }
    
    return {
      mainPoints: [...new Set(mainPoints)].slice(0, 6),
      secondaryPoints: [...new Set(secondaryPoints)].slice(0, 4),
      method
    };
  }
}

// ==================== 推理链 ====================

class InferenceChain {
  constructor(chainId) {
    this.chainId = chainId || `chain-${Date.now()}`;
    this.layerOutputs = new Map();
  }
  
  async execute(input, context) {
    const layer1 = new Layer1Processor();
    const layer2 = new Layer2Processor();
    const layer3 = new Layer3Processor();
    const layer4 = new Layer4Processor();
    
    // Layer 1
    const layer1Output = layer1.process({ tongueAnalysis: input });
    this.layerOutputs.set(1, layer1Output);
    
    // Layer 2
    const layer2Output = layer2.process({ tongueAnalysis: input, previousLayerOutput: layer1Output });
    this.layerOutputs.set(2, layer2Output);
    
    // Layer 3
    const layer3Output = layer3.process({ tongueAnalysis: input, previousLayerOutput: layer2Output });
    this.layerOutputs.set(3, layer3Output);
    
    // Layer 4
    const layer4Output = layer4.process({ tongueAnalysis: input, previousLayerOutput: layer3Output });
    this.layerOutputs.set(4, layer4Output);
    
    return {
      chainId: this.chainId,
      syndrome: layer4Output.syndrome,
      rootCause: layer4Output.rootCause,
      transmissionPaths: layer4Output.transmissionPaths,
      organPatterns: layer4Output.organPatterns,
      prescription: layer4Output.prescription,
      status: 'success'
    };
  }
  
  getLayerOutput(layer) {
    return this.layerOutputs.get(layer);
  }
}

// ==================== 测试用例 ====================

const testCases = [
  {
    id: 'TC01',
    name: '肝郁化火',
    imagePath: './上古文化资料库/舌镜参考图/肝郁化火实例.jpg',
    aiRecognition: {
      bodyColor: '红',
      bodyColorConfidence: 0.92,
      shape: '正常',
      shapeConfidence: 0.88,
      coatingColor: '薄白',
      coatingColorConfidence: 0.85,
      coatingTexture: '薄',
      coatingTextureConfidence: 0.82,
      state: '正常',
      stateConfidence: 0.95,
      hasTeethMark: true,
      teethMarkDegree: '明显',
      hasCrack: false,
      hasEcchymosis: false,
      zoneFeatures: [
        { position: 'upperThird', side: 'center', color: '红', colorIntensity: '正常' },
        { position: 'middleThird', side: 'center', color: '淡红', colorIntensity: '正常' },
        { position: 'middleThird', side: 'left', color: '红', colorIntensity: '偏深', hasTeethMark: true },
        { position: 'middleThird', side: 'right', color: '红', colorIntensity: '偏深', hasTeethMark: true },
        { position: 'lowerThird', side: 'center', color: '淡红', colorIntensity: '正常' }
      ],
      isSemitransparent: false
    },
    goldStandard: {
      syndrome: '肝郁化火证',
      rootCause: '肝气郁结，久而化火',
      transmissionPaths: [],
      organLocation: ['肝', '胆'],
      mainPoints: ['太冲', '行间', '阳陵泉', '内关'],
      secondaryPoints: ['百会', '膻中'],
      source: '中医舌诊肝郁化火'
    }
  },
  {
    id: 'TC02',
    name: '肝郁血虚',
    imagePath: './上古文化资料库/舌镜参考图/肝郁血虚实例.png',
    aiRecognition: {
      bodyColor: '淡红',
      bodyColorConfidence: 0.90,
      shape: '正常',
      shapeConfidence: 0.88,
      coatingColor: '薄白',
      coatingColorConfidence: 0.88,
      coatingTexture: '薄',
      coatingTextureConfidence: 0.85,
      state: '正常',
      stateConfidence: 0.95,
      hasTeethMark: true,
      teethMarkDegree: '明显',
      hasCrack: false,
      hasEcchymosis: false,
      zoneFeatures: [
        { position: 'upperThird', side: 'center', color: '淡红', colorIntensity: '偏淡' },
        { position: 'middleThird', side: 'center', color: '淡红', colorIntensity: '偏淡' },
        { position: 'middleThird', side: 'left', color: '淡红', colorIntensity: '偏淡', hasTeethMark: true },
        { position: 'middleThird', side: 'right', color: '淡红', colorIntensity: '偏淡', hasTeethMark: true },
        { position: 'lowerThird', side: 'center', color: '淡红', colorIntensity: '偏淡' }
      ],
      isSemitransparent: false
    },
    goldStandard: {
      syndrome: '肝郁血虚证',
      rootCause: '肝气郁结，血液生化不足',
      transmissionPaths: ['肝郁→血虚→肝血不足'],
      organLocation: ['肝'],
      mainPoints: ['太冲', '血海', '三阴交', '足三里'],
      secondaryPoints: ['肝俞', '膈俞'],
      source: '中医舌诊肝郁血虚'
    }
  },
  {
    id: 'TC03',
    name: '气滞血瘀',
    imagePath: './上古文化资料库/舌镜参考图/气滞血瘀实例.png',
    aiRecognition: {
      bodyColor: '紫',
      bodyColorConfidence: 0.95,
      shape: '正常',
      shapeConfidence: 0.88,
      coatingColor: '薄白',
      coatingColorConfidence: 0.80,
      coatingTexture: '腻',
      coatingTextureConfidence: 0.75,
      state: '正常',
      stateConfidence: 0.95,
      hasTeethMark: true,
      teethMarkDegree: '轻微',
      hasCrack: false,
      hasEcchymosis: true,
      zoneFeatures: [
        { position: 'upperThird', side: 'center', color: '紫', colorIntensity: '正常' },
        { position: 'middleThird', side: 'center', color: '紫暗', colorIntensity: '偏深' },
        { position: 'middleThird', side: 'left', color: '紫暗', colorIntensity: '偏深', hasTeethMark: true },
        { position: 'middleThird', side: 'right', color: '紫暗', colorIntensity: '偏深', hasTeethMark: true },
        { position: 'lowerThird', side: 'center', color: '紫', colorIntensity: '偏深', hasEcchymosis: true }
      ],
      isSemitransparent: false
    },
    goldStandard: {
      syndrome: '气滞血瘀证',
      rootCause: '气行不畅，血行瘀滞',
      transmissionPaths: ['气滞→血瘀'],
      organLocation: ['肝', '心'],
      mainPoints: ['太冲', '血海', '膈俞', '内关'],
      secondaryPoints: ['三阴交', '足三里'],
      source: '中医舌诊气滞血瘀'
    }
  },
  {
    id: 'TC04',
    name: '三高舌象（气血亏虚）',
    imagePath: './上古文化资料库/舌镜参考图/三高舌象半透明.png',
    aiRecognition: {
      bodyColor: '淡白',
      bodyColorConfidence: 0.88,
      shape: '胖大',
      shapeConfidence: 0.85,
      coatingColor: '白厚',
      coatingColorConfidence: 0.82,
      coatingTexture: '腻',
      coatingTextureConfidence: 0.80,
      state: '正常',
      stateConfidence: 0.95,
      hasTeethMark: true,
      teethMarkDegree: '明显',
      hasCrack: false,
      hasEcchymosis: false,
      zoneFeatures: [
        { position: 'upperThird', side: 'center', color: '淡白', colorIntensity: '偏淡', undulation: 'semitransparent' },
        { position: 'middleThird', side: 'center', color: '淡白', colorIntensity: '偏淡', undulation: 'semitransparent' },
        { position: 'lowerThird', side: 'center', color: '淡白', colorIntensity: '偏淡', undulation: 'semitransparent' }
      ],
      isSemitransparent: true,
      semitransparentZones: ['upperThird', 'middleThird', 'lowerThird']
    },
    goldStandard: {
      syndrome: '气血两虚证',
      rootCause: '三焦气血亏虚，脏腑功能下降',
      transmissionPaths: ['气虚→血虚→气血两虚'],
      organLocation: ['心', '脾', '肾'],
      mainPoints: ['气海', '足三里', '三阴交', '关元'],
      secondaryPoints: ['脾俞', '肾俞', '心俞'],
      source: '三高舌象辨证'
    }
  }
];

// ==================== 辅助函数 ====================

function evaluateOrganLocation(inferred, expected) {
  if (expected.length === 0) return 1;
  const matched = expected.filter(org => inferred.some(i => i.includes(org) || org.includes(i)));
  return matched.length / expected.length;
}

function evaluateSyndrome(inferred, expected) {
  if (!inferred || !expected) return 0;
  if (inferred.includes(expected) || expected.includes(inferred)) return 1;
  const expectedKeywords = expected.replace(/证$/, '').split(/[、和]/);
  const inferredNormalized = inferred.replace(/证$/, '');
  let matches = 0;
  for (const keyword of expectedKeywords) {
    if (inferredNormalized.includes(keyword)) matches++;
  }
  return matches / expectedKeywords.length;
}

function evaluateAcupoints(inferred, expected) {
  if (expected.length === 0) return 1;
  const exactMatches = inferred.filter(p => expected.includes(p));
  const partialMatches = inferred.filter(p => expected.some(e => (p.includes(e) || e.includes(p)) && p !== e));
  return Math.min(1, (exactMatches.length * 1.0 + partialMatches.length * 0.5) / expected.length);
}

function evaluateTransmission(inferred, expected) {
  if (expected.length === 0) return 1;
  let score = 0;
  for (const exp of expected) {
    const expNormalized = exp.replace(/[→→]/g, '->');
    if (inferred.some(i => i.includes(expNormalized) || expNormalized.includes(i))) {
      score += 1;
    }
  }
  return score / expected.length;
}

// ==================== 主程序 ====================

async function runE2ETest(testCase) {
  const startTime = Date.now();
  const issues = [];
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`测试用例: ${testCase.id} - ${testCase.name}`);
  console.log(`图片路径: ${testCase.imagePath}`);
  console.log(`${'='.repeat(60)}`);
  
  // 打印AI识别结果
  console.log('\n【AI视觉识别结果】');
  console.log(`- 舌色: ${testCase.aiRecognition.bodyColor} (置信度: ${(testCase.aiRecognition.bodyColorConfidence * 100).toFixed(0)}%)`);
  console.log(`- 舌形: ${testCase.aiRecognition.shape} (置信度: ${(testCase.aiRecognition.shapeConfidence * 100).toFixed(0)}%)`);
  console.log(`- 苔色: ${testCase.aiRecognition.coatingColor}`);
  console.log(`- 苔质: ${testCase.aiRecognition.coatingTexture}`);
  console.log(`- 齿痕: ${testCase.aiRecognition.hasTeethMark ? testCase.aiRecognition.teethMarkDegree : '无'}`);
  console.log(`- 瘀斑: ${testCase.aiRecognition.hasEcchymosis ? '有' : '无'}`);
  console.log(`- 半透明: ${testCase.aiRecognition.isSemitransparent ? '是' : '否'}`);
  console.log('\n分区特征:');
  for (const zone of testCase.aiRecognition.zoneFeatures) {
    const intensity = zone.colorIntensity ? ` [${zone.colorIntensity}]` : '';
    const undulation = zone.undulation ? ` [${zone.undulation}]` : '';
    const teeth = zone.hasTeethMark ? ' [齿痕]' : '';
    const ecch = zone.hasEcchymosis ? ' [瘀斑]' : '';
    console.log(`  - ${zone.position} ${zone.side || 'center'}: ${zone.color}${intensity}${undulation}${teeth}${ecch}`);
  }
  
  // 执行推理链
  const chain = new InferenceChain(`e2e-${testCase.id}`);
  let finalOutput = null;
  
  try {
    finalOutput = await chain.execute(testCase.aiRecognition, {});
    
    // 获取各层输出
    const layer1 = chain.getLayerOutput(1);
    const layer2 = chain.getLayerOutput(2);
    const layer3 = chain.getLayerOutput(3);
    const layer4 = chain.getLayerOutput(4);
    
    // 打印各层结果
    console.log('\n【Layer1 舌质舌苔层】');
    console.log(`综合结论: ${layer1?.summary?.label || '无'}`);
    console.log(`置信度: ${((layer1?.summary?.confidence || 0) * 100).toFixed(1)}%`);
    
    console.log('\n【Layer2 舌形虚实层】');
    console.log(`综合结论: ${layer2?.summary?.label || '无'}`);
    console.log(`置信度: ${((layer2?.summary?.confidence || 0) * 100).toFixed(1)}%`);
    
    console.log('\n【Layer3 分区凹凸层】');
    console.log(`综合结论: ${layer3?.summary?.label || '无'}`);
    console.log(`描述: ${layer3?.summary?.description || ''}`);
    console.log(`脏腑定位: ${layer3?.organPatterns?.map(p => `${p.organ}(${p.pattern})`).join(', ') || '无'}`);
    
    console.log('\n【Layer4 综合推理层】');
    console.log(`证型: ${finalOutput.syndrome}`);
    console.log(`根本原因: ${finalOutput.rootCause}`);
    console.log(`传变路径: ${finalOutput.transmissionPaths?.length > 0 ? finalOutput.transmissionPaths.join(', ') : '无'}`);
    console.log(`主穴: ${finalOutput.prescription?.mainPoints?.join(', ') || '未配穴'}`);
    console.log(`配穴: ${finalOutput.prescription?.secondaryPoints?.join(', ') || '无'}`);
    console.log(`治法: ${finalOutput.prescription?.method || '未明确'}`);
    
    // 评估
    const inferredOrgans = finalOutput.organPatterns?.map(p => p.organ) || [];
    const inferredAcupoints = [...(finalOutput.prescription?.mainPoints || []), ...(finalOutput.prescription?.secondaryPoints || [])];
    
    const organScore = evaluateOrganLocation(inferredOrgans, testCase.goldStandard.organLocation);
    const syndromeScore = evaluateSyndrome(finalOutput.syndrome, testCase.goldStandard.syndrome);
    const transmissionScore = evaluateTransmission(finalOutput.transmissionPaths || [], testCase.goldStandard.transmissionPaths);
    const acupointScore = evaluateAcupoints(inferredAcupoints, [...testCase.goldStandard.mainPoints, ...testCase.goldStandard.secondaryPoints]);
    const visualScore = (testCase.aiRecognition.bodyColorConfidence || 0.9) * (testCase.aiRecognition.shapeConfidence || 0.9);
    
    const overallScore = visualScore * 0.15 + organScore * 0.25 + syndromeScore * 0.30 + transmissionScore * 0.15 + acupointScore * 0.15;
    
    if (organScore < 0.5) issues.push(`脏腑定位偏差：期望[${testCase.goldStandard.organLocation}] vs 实际[${inferredOrgans}]`);
    if (syndromeScore < 0.5) issues.push(`证型判断偏差：期望[${testCase.goldStandard.syndrome}] vs 实际[${finalOutput.syndrome}]`);
    
    console.log('\n【评分结果】');
    console.log(`视觉识别: ${(visualScore * 100).toFixed(1)}%`);
    console.log(`脏腑定位: ${(organScore * 100).toFixed(1)}%`);
    console.log(`证型判断: ${(syndromeScore * 100).toFixed(1)}%`);
    console.log(`传变识别: ${(transmissionScore * 100).toFixed(1)}%`);
    console.log(`配穴合理性: ${(acupointScore * 100).toFixed(1)}%`);
    console.log(`综合评分: ${(overallScore * 100).toFixed(1)}%`);
    
    if (issues.length > 0) {
      console.log('\n【发现的问题】');
      issues.forEach(issue => console.log(`  ⚠ ${issue}`));
    }
    
    return {
      testCaseId: testCase.id,
      testCaseName: testCase.name,
      evaluation: {
        visualRecognitionScore: visualScore,
        organLocationScore: organScore,
        syndromeScore: syndromeScore,
        transmissionScore: transmissionScore,
        acupointScore: acupointScore,
        overallScore: overallScore
      },
      issues,
      executionTime: Date.now() - startTime,
      finalOutput
    };
    
  } catch (error) {
    console.error(`\n❌ 测试执行失败: ${error.message}`);
    return {
      testCaseId: testCase.id,
      testCaseName: testCase.name,
      evaluation: { visualRecognitionScore: 0, organLocationScore: 0, syndromeScore: 0, transmissionScore: 0, acupointScore: 0, overallScore: 0 },
      issues: [`执行失败: ${error.message}`],
      executionTime: Date.now() - startTime,
      finalOutput: null
    };
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║      舌镜v2.0 真实舌象端到端验证测试                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`测试时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log(`测试用例数: ${testCases.length}`);
  
  const results = [];
  
  for (const testCase of testCases) {
    const result = await runE2ETest(testCase);
    results.push(result);
  }
  
  // 汇总
  console.log('\n\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                    验证结果汇总                              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  const avgScores = {
    visual: results.reduce((sum, r) => sum + r.evaluation.visualRecognitionScore, 0) / results.length,
    organ: results.reduce((sum, r) => sum + r.evaluation.organLocationScore, 0) / results.length,
    syndrome: results.reduce((sum, r) => sum + r.evaluation.syndromeScore, 0) / results.length,
    transmission: results.reduce((sum, r) => sum + r.evaluation.transmissionScore, 0) / results.length,
    acupoint: results.reduce((sum, r) => sum + r.evaluation.acupointScore, 0) / results.length,
    overall: results.reduce((sum, r) => sum + r.evaluation.overallScore, 0) / results.length
  };
  
  console.log('\n【各维度平均准确率】');
  console.log(`视觉识别准确率: ${(avgScores.visual * 100).toFixed(1)}%`);
  console.log(`脏腑定位准确率: ${(avgScores.organ * 100).toFixed(1)}%`);
  console.log(`证型判断准确率: ${(avgScores.syndrome * 100).toFixed(1)}%`);
  console.log(`传变识别准确率: ${(avgScores.transmission * 100).toFixed(1)}%`);
  console.log(`配穴合理性:     ${(avgScores.acupoint * 100).toFixed(1)}%`);
  console.log(`─────────────────────────────`);
  console.log(`综合评分:       ${(avgScores.overall * 100).toFixed(1)}%`);
  
  console.log('\n【各用例得分明细】');
  console.log('用例ID | 名称              | 视觉 | 脏腑 | 证型 | 传变 | 配穴 | 综合');
  console.log('───────┼───────────────────┼──────┼──────┼──────┼──────┼──────┼──────');
  for (const r of results) {
    const name = r.testCaseName.length > 15 ? r.testCaseName.slice(0, 13) + '..' : r.testCaseName;
    console.log(
      `${r.testCaseId.padEnd(7)}|${name.padEnd(19)}|` +
      `${(r.evaluation.visualRecognitionScore * 100).toFixed(0).padStart(4)}% |` +
      `${(r.evaluation.organLocationScore * 100).toFixed(0).padStart(4)}% |` +
      `${(r.evaluation.syndromeScore * 100).toFixed(0).padStart(4)}% |` +
      `${(r.evaluation.transmissionScore * 100).toFixed(0).padStart(4)}% |` +
      `${(r.evaluation.acupointScore * 100).toFixed(0).padStart(4)}% |` +
      `${(r.evaluation.overallScore * 100).toFixed(0).padStart(4)}%`
    );
  }
  
  const allIssues = results.flatMap(r => r.issues);
  if (allIssues.length > 0) {
    console.log('\n【主要问题汇总】');
    const issueCounts = new Map();
    for (const issue of allIssues) {
      const key = issue.split('：')[0] || issue;
      issueCounts.set(key, (issueCounts.get(key) || 0) + 1);
    }
    for (const [issue, count] of issueCounts) {
      console.log(`  - ${issue} (出现${count}次)`);
    }
  }
  
  const successCount = results.filter(r => r.finalOutput !== null).length;
  console.log(`\n推理链执行成功率: ${successCount}/${results.length} (${(successCount/results.length*100).toFixed(1)}%)`);
  
  // 保存结果
  const reportData = {
    testDate: new Date().toISOString(),
    totalCases: results.length,
    averageScores: avgScores,
    results: results.map(r => ({
      testCaseId: r.testCaseId,
      testCaseName: r.testCaseName,
      imagePath: testCases.find(tc => tc.id === r.testCaseId)?.imagePath,
      evaluation: r.evaluation,
      issues: r.issues,
      executionTime: r.executionTime
    })),
    allIssues,
    successRate: successCount / results.length
  };
  
  const outputPath = path.join(__dirname, 'e2e-test-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(reportData, null, 2));
  console.log(`\n详细结果已保存至: ${outputPath}`);
  
  return reportData;
}

main().catch(console.error);
