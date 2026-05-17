/**
 * 养生服务 - 生活方式调理建议
 */
import { DiagnosisResult, LifeCareAdvice } from '@/types';
import { getLifeCareAdvice as engineGetLifeCareAdvice } from '@/engine/lifeCareEngine';

/**
 * 根据诊断结果获取完整的养生建议
 */
export function generateLifeCareAdvice(diagnosisResult: DiagnosisResult): LifeCareAdvice {
  return engineGetLifeCareAdvice(diagnosisResult);
}

/**
 * 格式化饮食建议为展示文本
 */
export function formatDietSuggestions(advice: LifeCareAdvice): string[] {
  if (!advice?.dietSuggestions) return [];
  return Array.isArray(advice.dietSuggestions) 
    ? advice.dietSuggestions 
    : [advice.dietSuggestions];
}

/**
 * 格式化日常调理建议为展示文本
 */
export function formatDailyRoutine(advice: LifeCareAdvice): string[] {
  if (!advice?.dailyRoutine) return [];
  return Array.isArray(advice.dailyRoutine) 
    ? advice.dailyRoutine 
    : [advice.dailyRoutine];
}

/**
 * 格式化注意事项为展示文本
 */
export function formatPrecautions(advice: LifeCareAdvice): string[] {
  if (!advice?.precautions) return [];
  return Array.isArray(advice.precautions) 
    ? advice.precautions 
    : [advice.precautions];
}

/**
 * 生成养生建议报告文本（用于 HealthReport）
 */
export function generateLifeCareReportText(advice: LifeCareAdvice): string {
  const lines: string[] = [];
  
  const diets = formatDietSuggestions(advice);
  if (diets.length > 0) {
    lines.push('【饮食调理】');
    diets.forEach((item, i) => lines.push(`${i + 1}. ${item}`));
    lines.push('');
  }
  
  const routines = formatDailyRoutine(advice);
  if (routines.length > 0) {
    lines.push('【日常调理】');
    routines.forEach((item, i) => lines.push(`${i + 1}. ${item}`));
    lines.push('');
  }
  
  const precautions = formatPrecautions(advice);
  if (precautions.length > 0) {
    lines.push('【注意事项】');
    precautions.forEach((item, i) => lines.push(`${i + 1}. ${item}`));
  }
  
  return lines.join('\n') || '暂无详细建议';
}

/**
 * 获取建议优先级标签
 */
export function getAdvicePriorityLabel(priority: '高' | '中' | '低'): { label: string; color: string } {
  const map = {
    高: { label: '重点关注', color: 'text-red-600 bg-red-50' },
    中: { label: '一般建议', color: 'text-amber-600 bg-amber-50' },
    低: { label: '日常调理', color: 'text-green-600 bg-green-50' },
  };
  return map[priority] || map['中'];
}
