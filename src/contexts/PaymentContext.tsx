/**
 * 支付上下文 - 付费解锁状态管理
 * 成交第一：拆分不能破坏付费流程
 */
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { setGlobalUnlocked, unlockReport, generateReportId, PaymentConfig, getPaymentConfig } from '@/services/PaymentService';
import toast from 'react-hot-toast';

interface PaymentContextValue {
  // 状态
  isUnlocked: boolean;
  currentReportId: string | null;
  paymentConfig: PaymentConfig;
  
  // 方法
  handleUnlock: () => Promise<void>;
  resetPayment: () => void;
}

const PaymentContext = createContext<PaymentContextValue | null>(null);

export function PaymentProvider({ children }: { children: React.ReactNode }) {
  // 临时开放，后续恢复付费墙
  const [isUnlocked, setIsUnlocked] = useState(true);
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  const paymentConfig = useMemo(() => getPaymentConfig(), []);
  
  // 临时全量开放：始终维持解锁态
  useEffect(() => {
    setIsUnlocked(true);
    setGlobalUnlocked(true);
    setCurrentReportId(generateReportId());
  }, []);
  
  // 解锁付费内容
  const handleUnlock = useCallback(async () => {
    if (isUnlocked) {
      toast.success('已解锁');
      return;
    }
    
    try {
      await unlockReport();
      setIsUnlocked(true);
      setGlobalUnlocked(true);
      setCurrentReportId(generateReportId());
    } catch (error) {
      console.error('解锁失败:', error);
      toast.error('解锁失败，请重试');
    }
  }, [isUnlocked]);
  
  // 重置支付状态
  const resetPayment = useCallback(() => {
    setIsUnlocked(true);
    setGlobalUnlocked(true);
    setCurrentReportId(generateReportId());
  }, []);
  
  const value = useMemo(() => ({
    isUnlocked,
    currentReportId,
    paymentConfig,
    handleUnlock,
    resetPayment,
  }), [isUnlocked, currentReportId, paymentConfig, handleUnlock, resetPayment]);
  
  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
}

export function usePaymentContext() {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePaymentContext must be used within PaymentProvider');
  }
  return context;
}
