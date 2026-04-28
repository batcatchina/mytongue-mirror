/**
 * 舌诊服务消费模块
 * 将正和积分消费集成到舌镜诊断流程
 */

import {
  zhengheClient,
  TONGUE_DIAGNOSIS_SERVICE,
  ServiceOrder,
  TongueDiagnosisMetadata,
} from '@/services/zhenghe';
import type { DiagnosisInput, DiagnosisOutput } from '@/types';
import { generateReferenceId } from '@/hooks/useCredits';

// ============================================
// 类型定义
// ============================================

export interface DiagnosisWithCreditsParams {
  // 诊断输入
  diagnosisInput: DiagnosisInput;
  // 用户账户ID
  accountId: string;
  // 服务定价（可选，默认使用配置值）
  pricingUsdt?: string;
  // 回调函数
  callbacks?: {
    onOrderCreated?: (order: ServiceOrder) => void;
    onDiagnosisComplete?: (result: DiagnosisOutput, order: ServiceOrder) => void;
    onError?: (error: Error, order?: ServiceOrder) => void;
    onBalanceCheck?: (hasBalance: boolean, available: string) => void;
  };
}

export interface DiagnosisSession {
  // 会话ID
  sessionId: string;
  // 订单ID
  orderId: string | null;
  // 订单状态
  status: 'idle' | 'checking_balance' | 'creating_order' | 'diagnosing' | 'completed' | 'cancelled' | 'error';
  // 错误信息
  error: string | null;
  // 诊断结果
  result: DiagnosisOutput | null;
}

// ============================================
// 服务消费管理器类
// ============================================

class DiagnosisCreditService {
  private currentSession: DiagnosisSession | null = null;

  /**
   * 开始一次带积分消费诊断
   */
  async startDiagnosis(params: DiagnosisWithCreditsParams): Promise<{
    success: boolean;
    session?: DiagnosisSession;
    order?: ServiceOrder;
    error?: string;
  }> {
    const { diagnosisInput, accountId, pricingUsdt, callbacks } = params;

    // 验证配置
    if (!zhengheClient.isConfigured()) {
      return {
        success: false,
        error: '正和系统未配置，请先登录'
      };
    }

    // 创建会话
    const sessionId = generateReferenceId('session');
    this.currentSession = {
      sessionId,
      orderId: null,
      status: 'checking_balance',
      error: null,
      result: null,
    };

    try {
      // Step 1: 检查余额
      const account = await zhengheClient.getAccountBalance();
      if (!account) {
        throw new Error('无法获取账户信息');
      }

      const pricing = pricingUsdt || TONGUE_DIAGNOSIS_SERVICE.DEFAULT_PRICING;
      const pricingNum = parseFloat(pricing);
      const poolPrice = await zhengheClient.getPoolPrice();
      const currentPrice = poolPrice ? parseFloat(poolPrice.current_price) : 1;
      const tokensNeeded = pricingNum / currentPrice * 1.009;
      
      const availableBalance = parseFloat(account.available_balance);
      
      callbacks?.onBalanceCheck?.(availableBalance >= tokensNeeded, account.available_balance);

      if (availableBalance < tokensNeeded) {
        throw new Error(`余额不足：需要 ${tokensNeeded.toFixed(2)} 积分，当前可用 ${availableBalance.toFixed(2)} 积分`);
      }

      // Step 2: 创建服务订单
      this.currentSession.status = 'creating_order';
      
      const referenceId = generateReferenceId('order');
      const metadata: TongueDiagnosisMetadata = {
        tongue_color: diagnosisInput.tongueColor,
        tongue_shape: diagnosisInput.tongueShape,
        coating_color: diagnosisInput.coatingColor,
        symptoms: diagnosisInput.symptoms,
        patient_info: diagnosisInput.patientInfo ? {
          age: diagnosisInput.patientInfo.age,
          gender: diagnosisInput.patientInfo.gender,
          chief_complaint: diagnosisInput.patientInfo.chiefComplaint,
        } : undefined,
      };

      const order = await zhengheClient.createServiceOrder({
        agentId: TONGUE_DIAGNOSIS_SERVICE.AGENT_ID,
        serviceType: TONGUE_DIAGNOSIS_SERVICE.SERVICE_TYPE,
        pricingUsdt: pricing,
        metadata,
        referenceId,
      });

      if (!order) {
        throw new Error('创建服务订单失败');
      }

      this.currentSession.orderId = order.order_id;
      this.currentSession.status = 'diagnosing';
      callbacks?.onOrderCreated?.(order);

      // Step 3: 执行诊断（实际诊断由前端调用舌诊API完成）
      // 这里记录订单信息，实际诊断完成后需调用 confirmService

      return {
        success: true,
        session: this.currentSession,
        order,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      this.currentSession.status = 'error';
      this.currentSession.error = errorMessage;
      callbacks?.onError?.(new Error(errorMessage));
      
      return {
        success: false,
        session: this.currentSession,
        error: errorMessage,
      };
    }
  }

  /**
   * 确认服务完成（舌诊报告生成后调用）
   * 触发积分销毁和奖励分发
   */
  async confirmService(orderId: string, resultMetadata?: Record<string, unknown>): Promise<{
    success: boolean;
    order?: ServiceOrder;
    error?: string;
  }> {
    if (!orderId) {
      return { success: false, error: '订单ID不能为空' };
    }

    try {
      // 注意：确认接口需要Agent端调用，这里只是记录
      // 实际确认由后端Agent服务完成
      
      const order = await zhengheClient.getOrder(orderId);
      
      if (this.currentSession) {
        this.currentSession.status = order?.status === 'completed' ? 'completed' : 'diagnosing';
      }

      return {
        success: true,
        order: order || undefined,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '确认服务失败';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * 取消服务订单
   */
  async cancelCurrentOrder(): Promise<{
    success: boolean;
    error?: string;
  }> {
    if (!this.currentSession?.orderId) {
      return { success: false, error: '没有待处理的订单' };
    }

    try {
      const result = await zhengheClient.cancelOrder(this.currentSession.orderId);
      
      if (result) {
        this.currentSession.status = 'cancelled';
        return { success: true };
      }
      
      return { success: false, error: '取消订单失败' };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '取消订单失败';
      this.currentSession.status = 'error';
      this.currentSession.error = errorMessage;
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 获取当前会话状态
   */
  getCurrentSession(): DiagnosisSession | null {
    return this.currentSession;
  }

  /**
   * 清除会话
   */
  clearSession(): void {
    this.currentSession = null;
  }
}

// ============================================
// 导出单例
// ============================================

export const diagnosisCreditService = new DiagnosisCreditService();

// ============================================
// 辅助函数
// ============================================

/**
 * 格式化订单状态显示
 */
export function formatOrderStatus(status: ServiceOrder['status']): {
  label: string;
  color: string;
  description: string;
} {
  const statusMap = {
    pending: {
      label: '待处理',
      color: 'yellow',
      description: '订单已创建，等待服务完成',
    },
    completed: {
      label: '已完成',
      color: 'green',
      description: '服务已完成，积分已销毁',
    },
    cancelled: {
      label: '已取消',
      color: 'gray',
      description: '订单已取消，积分已释放',
    },
    expired: {
      label: '已过期',
      color: 'red',
      description: '订单已过期，积分已释放',
    },
  };

  return statusMap[status] || {
    label: '未知',
    color: 'gray',
    description: '',
  };
}

/**
 * 计算消费后预计奖励
 */
export function calculateExpectedReward(pricingUsdt: number): {
  consumerReward: string;
  referralReward: string;
  growthPoolReleased: string;
} {
  return {
    consumerReward: (pricingUsdt * 0.005).toFixed(8), // 0.5% 消费奖励
    referralReward: (pricingUsdt * 0.001).toFixed(8), // 0.1% 推荐奖励
    growthPoolReleased: (pricingUsdt * 0.003).toFixed(8), // 0.3% 释放增值
  };
}

export type { DiagnosisSession, DiagnosisWithCreditsParams };
