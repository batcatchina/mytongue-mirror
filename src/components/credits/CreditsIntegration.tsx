/**
 * 舌诊页面积分模块集成示例
 * 
 * 本文件展示如何在 DiagnosisPage 中集成积分消费功能
 * 实际使用时，请将相关代码整合到 DiagnosisPage.tsx 中
 */

import React, { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useCredits, formatCreditsInfo } from '@/hooks/useCredits';
import {
  diagnosisCreditService,
  calculateExpectedReward,
} from '@/services/diagnosisCredit';
import { TONGUE_DIAGNOSIS_SERVICE } from '@/services/zhenghe';

// ============================================
// 组件Props
// ============================================

interface CreditsIntegrationProps {
  onDiagnosisReady?: () => void;  // 余额检查通过，准备开始诊断
  onInsufficientBalance?: () => void;  // 余额不足
}

// ============================================
// 积分余额显示组件
// ============================================

export const CreditsBalance: React.FC = () => {
  const { account, poolPrice, isLoading, refreshBalance, isConfigured } = useCredits();

  if (!isConfigured) {
    return (
      <div className="credits-balance credits-unconfigured">
        <span>请先登录正和账户</span>
      </div>
    );
  }

  if (isLoading && !account) {
    return (
      <div className="credits-balance credits-loading">
        <span>加载中...</span>
      </div>
    );
  }

  const info = formatCreditsInfo(account);

  return (
    <div className={`credits-balance ${info.isLowBalance ? 'credits-low' : ''}`}>
      <div className="balance-main">
        <span className="balance-label">可用积分</span>
        <span className="balance-value">{info.available}</span>
      </div>
      {parseFloat(info.locked) > 0 && (
        <div className="balance-locked">
          <span>锁定: {info.locked}</span>
        </div>
      )}
      {poolPrice && (
        <div className="balance-price">
          <span>积分价格: {poolPrice.current_price}</span>
          <span className="price-change">{poolPrice.price_change_24h}</span>
        </div>
      )}
      <button 
        className="balance-refresh"
        onClick={refreshBalance}
        disabled={isLoading}
      >
        刷新
      </button>
    </div>
  );
};

// ============================================
// 服务费用预览组件
// ============================================

export const ServiceCostPreview: React.FC<{
  pricing?: string;
}> = ({ pricing }) => {
  const { estimateServiceCost } = useCredits();

  const cost = estimateServiceCost(pricing);
  const rewards = calculateExpectedReward(parseFloat(cost.estimatedUsdt));

  return (
    <div className="service-cost-preview">
      <div className="cost-row">
        <span className="cost-label">服务费用</span>
        <span className="cost-value">{cost.estimatedUsdt} USDT</span>
      </div>
      <div className="cost-row">
        <span className="cost-label">预计消耗积分</span>
        <span className="cost-value">{cost.estimatedTokens}</span>
      </div>
      <div className="cost-reward">
        <span className="reward-label">消费奖励</span>
        <span className="reward-value">+{rewards.consumerReward} USDT</span>
      </div>
      <p className="cost-note">
        * 实际消耗积分因价格波动可能略有差异
      </p>
    </div>
  );
};

// ============================================
// 积分检查对话框
// ============================================

export const BalanceCheckDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onRecharge: () => void;
  pricing: string;
  availableBalance: string;
}> = ({ isOpen, onClose, onConfirm, onRecharge, pricing, availableBalance }) => {
  if (!isOpen) return null;

  const pricingNum = parseFloat(pricing);
  const availableNum = parseFloat(availableBalance);
  const canAfford = availableNum >= pricingNum;

  return (
    <div className="dialog-overlay">
      <div className="dialog-content">
        <h3>{canAfford ? '开始舌诊服务' : '余额不足'}</h3>
        
        {canAfford ? (
          <>
            <p>您即将使用舌诊服务，将消耗 {pricing} USDT 等值积分。</p>
            <p>完成后可获得消费奖励 {calculateExpectedReward(pricingNum).consumerReward} USDT。</p>
          </>
        ) : (
          <>
            <p>当前余额 {availableBalance} 积分</p>
            <p>服务需要 {pricing} USDT 等值积分</p>
            <p>差额 {Math.abs(availableNum - pricingNum).toFixed(2)} 积分</p>
          </>
        )}

        <div className="dialog-actions">
          {canAfford ? (
            <>
              <button onClick={onConfirm}>确认开始</button>
              <button onClick={onClose}>取消</button>
            </>
          ) : (
            <>
              <button onClick={onRecharge}>去充值</button>
              <button onClick={onClose}>取消</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// 订单状态显示组件
// ============================================

export const OrderStatus: React.FC<{
  orderId: string | null;
  status: string;
  onCancel?: () => void;
}> = ({ orderId, status, onCancel }) => {
  if (!orderId) return null;

  const statusConfig = {
    pending: { label: '订单处理中', color: 'yellow' },
    completed: { label: '已完成', color: 'green' },
    cancelled: { label: '已取消', color: 'gray' },
    error: { label: '出错', color: 'red' },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <div className={`order-status status-${config.color}`}>
      <span className="status-dot"></span>
      <span className="status-label">{config.label}</span>
      {status === 'pending' && onCancel && (
        <button className="cancel-btn" onClick={onCancel}>
          取消订单
        </button>
      )}
    </div>
  );
};

// ============================================
// 积分集成Hook使用示例
// ============================================

/**
 * 使用积分集成的舌诊流程Hook
 * 
 * @example
 * ```tsx
 * const { 
 *   isReady,
 *   currentOrder,
 *   checkAndCreateOrder,
 *   cancelOrder,
 * } = useDiagnosisWithCredits();
 * 
 * const handleDiagnosis = async () => {
 *   const success = await checkAndCreateOrder({
 *     tongueColor: '淡红',
 *     tongueShape: '胖大',
 *     symptoms: ['口干'],
 *   });
 *   
 *   if (success) {
 *     // 开始诊断
 *   }
 * };
 * ```
 */
export function useDiagnosisWithCredits() {
  const { account, createServiceOrder, refreshBalance, isConfigured, checkBalance } = useCredits();
  const [currentOrder, setCurrentOrder] = useState<{
    orderId: string;
    status: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 检查余额并创建订单
  const checkAndCreateOrder = useCallback(async (metadata: {
    tongue_color?: string;
    tongue_shape?: string;
    coating_color?: string;
    symptoms?: string[];
    patient_info?: {
      age?: number;
      gender?: string;
      chief_complaint?: string;
    };
  }) => {
    if (!isConfigured) {
      toast.error('请先登录正和账户');
      return false;
    }

    setIsProcessing(true);

    try {
      // 估算费用
      const pricing = TONGUE_DIAGNOSIS_SERVICE.DEFAULT_PRICING;
      const pricingNum = parseFloat(pricing);
      
      // 检查余额（粗略估算，不含价格波动）
      if (account && !checkBalance(pricingNum)) {
        toast.error('余额不足，请先充值');
        return false;
      }

      // 创建订单
      const order = await createServiceOrder({
        pricingUsdt: pricing,
        metadata,
      });

      if (order) {
        setCurrentOrder({
          orderId: order.order_id,
          status: order.status,
        });
        return true;
      }

      return false;

    } catch (error) {
      const message = error instanceof Error ? error.message : '创建订单失败';
      toast.error(message);
      return false;

    } finally {
      setIsProcessing(false);
    }
  }, [account, isConfigured, createServiceOrder, checkBalance]);

  // 取消订单
  const cancelOrder = useCallback(async () => {
    if (!currentOrder?.orderId) return false;

    try {
      const result = await diagnosisCreditService.cancelCurrentOrder();
      
      if (result.success) {
        toast.success('订单已取消');
        setCurrentOrder(null);
        await refreshBalance();
        return true;
      } else {
        toast.error(result.error || '取消失败');
        return false;
      }

    } catch (error) {
      toast.error('取消订单失败');
      return false;
    }
  }, [currentOrder, refreshBalance]);

  // 确认订单完成
  const confirmOrderComplete = useCallback(async () => {
    if (!currentOrder?.orderId) return false;

    try {
      await diagnosisCreditService.confirmService(currentOrder.orderId);
      await refreshBalance();
      return true;

    } catch (error) {
      console.error('确认订单失败:', error);
      return false;
    }
  }, [currentOrder, refreshBalance]);

  return {
    isReady: isConfigured && account !== null,
    currentOrder,
    isProcessing,
    checkAndCreateOrder,
    cancelOrder,
    confirmOrderComplete,
  };
}
