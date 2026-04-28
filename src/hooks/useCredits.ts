/**
 * 用户积分管理 Hook
 * 提供积分余额查询、余额检查、积分消费等能力
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  zhengheClient,
  TONGUE_DIAGNOSIS_SERVICE,
  AccountInfo,
  PoolPrice,
  ServiceOrder,
  TongueDiagnosisMetadata,
} from '@/services/zhenghe';

// ============================================
// 类型定义
// ============================================

export interface CreditsState {
  // 账户信息
  account: AccountInfo | null;
  // 实时价格
  poolPrice: PoolPrice | null;
  // 加载状态
  isLoading: boolean;
  // 错误信息
  error: string | null;
  // 是否已初始化配置
  isConfigured: boolean;
}

export interface CreditsActions {
  // 初始化配置（从存储或外部传入）
  initConfig: (config: {
    apiKey?: string;
    apiSecret?: string;
    userId?: string;
    accountId?: string;
  }) => void;
  
  // 刷新账户余额
  refreshBalance: () => Promise<void>;
  
  // 刷新资金池价格
  refreshPoolPrice: () => Promise<void>;
  
  // 刷新全部数据
  refreshAll: () => Promise<void>;
  
  // 检查余额是否足够
  checkBalance: (requiredTokens: number) => boolean;
  
  // 估算服务所需积分
  estimateServiceCost: (pricingUsdt?: number) => {
    estimatedTokens: string;
    estimatedUsdt: string;
    consumerReward: string;
  };
  
  // 创建服务订单
  createServiceOrder: (params: {
    pricingUsdt?: string;
    metadata?: TongueDiagnosisMetadata;
    referenceId?: string;
  }) => Promise<ServiceOrder | null>;
  
  // 清除错误
  clearError: () => void;
  
  // 登出
  logout: () => void;
}

export type UseCreditsReturn = CreditsState & CreditsActions;

// ============================================
// Hook 实现
// ============================================

export function useCredits(): UseCreditsReturn {
  // 状态
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [poolPrice, setPoolPrice] = useState<PoolPrice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  
  // 用于防止重复刷新
  const refreshLock = useRef(false);
  // 自动刷新定时器
  const autoRefreshTimer = useRef<number | null>(null);

  // ============================================
  // 初始化
  // ============================================

  // 从存储加载配置
  useEffect(() => {
    zhengheClient.loadFromStorage();
    setIsConfigured(zhengheClient.isConfigured());
  }, []);

  // 自动刷新余额（每30秒）
  useEffect(() => {
    if (isConfigured && !refreshLock.current) {
      // 初始加载
      refreshBalance();
      refreshPoolPrice();

      // 设置定时刷新
      autoRefreshTimer.current = window.setInterval(() => {
        if (!isLoading) {
          refreshBalance();
        }
      }, 30000);
    }

    return () => {
      if (autoRefreshTimer.current) {
        clearInterval(autoRefreshTimer.current);
      }
    };
  }, [isConfigured]);

  // ============================================
  // 操作方法
  // ============================================

  /**
   * 初始化配置
   */
  const initConfig = useCallback((config: {
    apiKey?: string;
    apiSecret?: string;
    userId?: string;
    accountId?: string;
  }) => {
    zhengheClient.configure(config);
    zhengheClient.saveToStorage();
    setIsConfigured(zhengheClient.isConfigured());
    
    // 配置完成后立即刷新
    if (config.accountId) {
      refreshBalance();
      refreshPoolPrice();
    }
  }, []);

  /**
   * 刷新账户余额
   */
  const refreshBalance = useCallback(async () => {
    if (!zhengheClient.isConfigured()) return;
    if (refreshLock.current) return;
    
    refreshLock.current = true;
    setIsLoading(true);
    
    try {
      const balance = await zhengheClient.getAccountBalance();
      if (balance) {
        setAccount(balance);
        setError(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取余额失败';
      setError(message);
    } finally {
      setIsLoading(false);
      refreshLock.current = false;
    }
  }, []);

  /**
   * 刷新资金池价格
   */
  const refreshPoolPrice = useCallback(async () => {
    try {
      const price = await zhengheClient.getPoolPrice();
      if (price) {
        setPoolPrice(price);
      }
    } catch (err) {
      console.error('Failed to refresh pool price:', err);
    }
  }, []);

  /**
   * 刷新全部数据
   */
  const refreshAll = useCallback(async () => {
    await Promise.all([refreshBalance(), refreshPoolPrice()]);
  }, [refreshBalance, refreshPoolPrice]);

  /**
   * 检查余额是否足够
   */
  const checkBalance = useCallback((requiredTokens: number): boolean => {
    if (!account) return false;
    const available = parseFloat(account.available_balance);
    return available >= requiredTokens;
  }, [account]);

  /**
   * 估算服务费用
   */
  const estimateServiceCost = useCallback((pricingUsdt?: number): {
    estimatedTokens: string;
    estimatedUsdt: string;
    consumerReward: string;
  } => {
    const pricing = parseFloat(pricingUsdt || TONGUE_DIAGNOSIS_SERVICE.DEFAULT_PRICING);
    const currentPrice = poolPrice ? parseFloat(poolPrice.current_price) : 1;
    
    const estimatedTokens = (pricing / currentPrice * 1.009).toFixed(8);
    const consumerReward = (pricing * 0.005).toFixed(8); // 0.5%消费奖励
    
    return {
      estimatedTokens,
      estimatedUsdt: pricing.toFixed(8),
      consumerReward,
    };
  }, [poolPrice]);

  /**
   * 创建服务订单
   */
  const createServiceOrder = useCallback(async (params: {
    pricingUsdt?: string;
    metadata?: TongueDiagnosisMetadata;
    referenceId?: string;
  }): Promise<ServiceOrder | null> => {
    if (!zhengheClient.isConfigured()) {
      setError('请先登录并配置账户');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const order = await zhengheClient.createServiceOrder({
        agentId: TONGUE_DIAGNOSIS_SERVICE.AGENT_ID,
        serviceType: TONGUE_DIAGNOSIS_SERVICE.SERVICE_TYPE,
        pricingUsdt: params.pricingUsdt || TONGUE_DIAGNOSIS_SERVICE.DEFAULT_PRICING,
        metadata: params.metadata,
        referenceId: params.referenceId,
      });

      if (order) {
        // 刷新余额
        await refreshBalance();
        return order;
      }
      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : '创建订单失败';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [refreshBalance]);

  /**
   * 清除错误
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * 登出
   */
  const logout = useCallback(() => {
    zhengheClient.clearConfig();
    setAccount(null);
    setPoolPrice(null);
    setIsConfigured(false);
    setError(null);
  }, []);

  // ============================================
  // 导出
  // ============================================

  return {
    // 状态
    account,
    poolPrice,
    isLoading,
    error,
    isConfigured,
    
    // 操作
    initConfig,
    refreshBalance,
    refreshPoolPrice,
    refreshAll,
    checkBalance,
    estimateServiceCost,
    createServiceOrder,
    clearError,
    logout,
  };
}

// ============================================
// 便捷工具：获取当前积分显示信息
// ============================================

export function formatCreditsInfo(account: AccountInfo | null): {
  balance: string;
  available: string;
  locked: string;
  rewards: string;
  isLowBalance: boolean;
} {
  if (!account) {
    return {
      balance: '0.00',
      available: '0.00',
      locked: '0.00',
      rewards: '0.00',
      isLowBalance: true,
    };
  }

  const balance = parseFloat(account.balance);
  const available = parseFloat(account.available_balance);
  const locked = parseFloat(account.locked_balance);
  const rewards = parseFloat(account.cumulative_rewards);

  return {
    balance: balance.toFixed(2),
    available: available.toFixed(2),
    locked: locked.toFixed(2),
    rewards: rewards.toFixed(2),
    isLowBalance: available < 10, // 低于10积分提示
  };
}

// ============================================
// 便捷工具：生成唯一引用ID
// ============================================

export function generateReferenceId(prefix: string = 'tongue'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}_${timestamp}_${random}`;
}
