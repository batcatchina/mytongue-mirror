/**
 * 穴位服务 - 穴位名称处理
 * 从 acupointKnowledge 中获取穴位详情
 */
import { AcupuncturePlan, AcupuncturePoint } from '@/types';
import { acupointKnowledge } from '@/config/acupointKnowledge';

/**
 * 穴位名称中英文映射（常用穴位）
 */
const POINT_NAME_MAP: Record<string, string> = {
  'ST36': '足三里', 'ST6': '颊车', 'SP6': '三阴交', 'SP10': '血海',
  'LR3': '太冲', 'LR2': '行间', 'GB20': '风池', 'GB34': '阳陵泉',
  'PC6': '内关', 'PC5': '郄门', 'HT7': '神门', 'HT5': '通里',
  'LU9': '太渊', 'LU5': '尺泽', 'SI3': '后溪', 'SI4': '腕骨',
  'BL20': '脾俞', 'BL23': '肾俞', 'BL15': '心俞', 'BL18': '肝俞',
  'BL10': '天柱', 'BL40': '委中', 'BL60': '昆仑', 'BL2': '攒竹',
  'GB1': '瞳子髎', 'GB14': '阳白', 'GB8': '率谷', 'GB30': '环跳',
  'LI4': '合谷', 'LI11': '曲池', 'LI10': '手三里', 'LI3': '三间',
  'SJ5': '外关', 'SJ10': '天井', 'SJ3': '中渚', 'SJ4': '阳池',
  'CV12': '中脘', 'CV6': '气海', 'CV4': '关元', 'CV17': '膻中',
  'CV22': '天突', 'CV10': '下脘', 'RN4': '中极', 'RN6': '气海',
  'GV14': '大椎', 'GV12': '身柱', 'GV9': '至阳', 'GV6': '脊中',
  'EX-HN3': '印堂', 'EX-CA1': '利尿', 'EX-LE3': '阑尾',
  'YINTANG': '印堂', 'TAICHONG': '太冲', 'ZUSANLI': '足三里',
  'HEGU': '合谷', 'NEIGUAN': '内关', 'SANJIAO': '三阴交',
  'FENGLU': '风府', 'FENGCHI': '风池', 'BAIHUI': '百会',
  'SHENSHU': '肾俞', 'XINSHU': '心俞', 'PISHU': '脾俞', 'GANYU': '肝俞',
};

/**
 * 获取穴位中文名称
 */
export function getPointChineseName(pointCode: string): string {
  if (!pointCode) return '待确认';
  // 直接匹配中文
  if (/[\u4e00-\u9fa5]/.test(pointCode)) return pointCode;
  // 查找映射表
  return POINT_NAME_MAP[pointCode.toUpperCase()] || pointCode;
}

/**
 * 格式化主穴列表 - 保留代码用于详情展示
 */
export function formatMainPoints(mainPoints: string[]): string {
  if (!mainPoints || mainPoints.length === 0) return '待确认';
  return mainPoints.map(p => getPointChineseName(p)).join('、');
}

/**
 * 格式化配穴列表
 */
export function formatSecondaryPoints(secondaryPoints: string[]): string {
  if (!secondaryPoints || secondaryPoints.length === 0) return '待确认';
  return secondaryPoints.map(p => getPointChineseName(p)).join('、');
}

/**
 * 从 acupointKnowledge 获取穴位详情
 */
export function getPointDetails(pointCode: string): AcupuncturePoint | undefined {
  const code = pointCode.toUpperCase();
  return acupointKnowledge[code];
}

/**
 * 批量获取穴位详情列表
 */
export function getPointsDetails(pointCodes: string[]): AcupuncturePoint[] {
  return pointCodes.map(code => getPointDetails(code)).filter((p): p is AcupuncturePoint => !!p);
}

/**
 * 生成穴位报告文本（用于HealthReport）
 */
export function generateAcupunctureReportText(plan: AcupuncturePlan): string {
  const lines: string[] = [];
  
  lines.push(`【治疗原则】${plan.treatmentPrinciple || '待确认'}`);
  lines.push('');
  lines.push(`【主穴】${formatMainPoints(plan.mainPoints)}`);
  lines.push('');
  
  if (plan.secondaryPoints && plan.secondaryPoints.length > 0) {
    lines.push(`【配穴】${formatSecondaryPoints(plan.secondaryPoints)}`);
    lines.push('');
  }
  
  if (plan.contraindications && plan.contraindications.length > 0) {
    lines.push(`【禁忌】${plan.contraindications.join('、')}`);
    lines.push('');
  }
  
  if (plan.treatmentAdvice) {
    lines.push(`【治疗建议】${plan.treatmentAdvice}`);
  }
  
  return lines.join('\n');
}
