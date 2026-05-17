/**
 * 支付服务 - 报告解锁逻辑
 * 成交第一：拆分不能破坏付费流程
 */
import toast from 'react-hot-toast';

// 报告ID前缀
const REPORT_ID_PREFIX = 'RPT';
// 解锁状态存储key
const UNLOCK_KEY = 'tcm_diag_unlocked_v2';
// 已购买报告ID列表
const PURCHASED_REPORTS_KEY = 'tcm_diag_purchased_reports';

/**
 * 生成报告ID
 */
export function generateReportId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${REPORT_ID_PREFIX}${timestamp}${random}`;
}

/**
 * 检查是否已解锁深度辨证（全局状态）
 */
export function checkGlobalUnlocked(): boolean {
  try {
    return localStorage.getItem(UNLOCK_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * 设置全局解锁状态
 */
export function setGlobalUnlocked(unlocked: boolean): void {
  try {
    localStorage.setItem(UNLOCK_KEY, unlocked ? 'true' : 'false');
  } catch {}
}

/**
 * 检查特定报告是否已购买
 */
export function isReportPurchased(reportId: string): boolean {
  try {
    const purchased = JSON.parse(localStorage.getItem(PURCHASED_REPORTS_KEY) || '[]');
    return purchased.includes(reportId);
  } catch {
    return false;
  }
}

/**
 * 标记报告为已购买
 */
export function markReportPurchased(reportId: string): void {
  try {
    const purchased = JSON.parse(localStorage.getItem(PURCHASED_REPORTS_KEY) || '[]');
    if (!purchased.includes(reportId)) {
      purchased.push(reportId);
      localStorage.setItem(PURCHASED_REPORTS_KEY, JSON.stringify(purchased));
    }
    // 同时设置全局解锁状态（兼容旧逻辑）
    setGlobalUnlocked(true);
  } catch {}
}

/**
 * 解锁报告（支付成功回调）
 */
export function unlockReport(): Promise<void> {
  return new Promise((resolve) => {
    // 模拟支付回调延迟
    setTimeout(() => {
      setGlobalUnlocked(true);
      toast.success('✅ 深度辨证已解锁！');
      resolve();
    }, 800);
  });
}

/**
 * 重置解锁状态（用于测试）
 */
export function resetUnlockedState(): void {
  try {
    localStorage.removeItem(UNLOCK_KEY);
    localStorage.removeItem(PURCHASED_REPORTS_KEY);
  } catch {}
}

/**
 * 获取支付配置
 */
export interface PaymentConfig {
  amount: number;
  title: string;
  description?: string;
}

export function getPaymentConfig(): PaymentConfig {
  return {
    amount: 9.9,
    title: '舌镜深度辨证方案',
    description: '包含完整针灸配穴和个性化生活调理建议',
  };
}
