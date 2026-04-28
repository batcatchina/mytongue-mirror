/**
 * 正和系统 API 对接模块
 * 负责舌镜系统与正和经济模型的积分账户、服务消费等对接
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

// ============================================
// 类型定义
// ============================================

// 正和API响应基础结构
export interface ZhengheResponse<T> {
  code?: string;
  message?: string;
  request_id?: string;
  details?: unknown;
  data?: T;
}

// 账户信息
export interface AccountInfo {
  account_id: string;
  owner_user_id: string;
  account_type: string;
  balance: string;
  locked_balance: string;
  available_balance: string;
  cumulative_earned: string;
  cumulative_consumed: string;
  cumulative_rewards: string;
  updated_at: string;
}

// 资金池价格信息
export interface PoolPrice {
  current_price: string;
  capital_pool: {
    usdt_balance: string;
    description: string;
  };
  growth_pool: {
    usdt_balance: string;
    description: string;
  };
  token_circulation: string;
  price_change_24h: string;
  last_price_update: string;
}

// 订单信息
export interface ServiceOrder {
  order_id: string;
  status: 'pending' | 'completed' | 'cancelled' | 'expired';
  pricing_usdt: string;
  tokens_to_burn?: string;
  tokens_burned?: string;
  price_at_creation: string;
  locked_tokens?: string;
  expires_at: string;
  created_at: string;
  distribution?: {
    provider_usdt: string;
    consumer_reward_usdt: string;
    growth_pool_released_usdt: string;
    referral_reward_usdt: string;
  };
  referral?: {
    referrer_user_id: string;
    reward_usdt: string;
  };
  price_after?: string;
  completed_at?: string;
  tx_id?: string;
}

// 推荐关系
export interface ReferralInfo {
  user_id: string;
  referrer?: {
    user_id: string;
    name: string;
    bound_at: string;
  };
  referred_count: number;
  total_referral_earned: string;
}

// 舌诊元数据
export interface TongueDiagnosisMetadata {
  tongue_image_url?: string;
  tongue_color?: string;
  tongue_shape?: string;
  coating_color?: string;
  symptoms?: string[];
  patient_info?: {
    age?: number;
    gender?: string;
    chief_complaint?: string;
  };
}

// 错误类型
export interface ZhengheError {
  code: string;
  message: string;
  details?: unknown;
}

// ============================================
// 配置
// ============================================

const ZHENGHE_CONFIG = {
  // 使用环境变量或默认测试环境
  baseURL: import.meta.env.VITE_ZHENGHE_API_URL || 'https://api-test.zhenghe.ai/v1',
  timeout: 30000,
};

// 错误码中文映射
export const ERROR_CODE_MESSAGES: Record<string, { message: string; suggestion: string }> = {
  ZH_1001: { message: '签名无效', suggestion: '请检查API密钥配置' },
  ZH_1002: { message: '时间戳无效', suggestion: '请同步系统时间' },
  ZH_1003: { message: 'Nonce无效', suggestion: '请刷新页面后重试' },
  ZH_1004: { message: 'API Key不存在', suggestion: '请检查Agent注册状态' },
  ZH_1005: { message: 'API Key已禁用', suggestion: '请联系管理员' },
  ZH_1006: { message: '权限不足', suggestion: '当前操作需要更高权限' },
  ZH_1007: { message: '请求格式错误', suggestion: '请检查输入参数' },
  ZH_2001: { message: 'Agent不存在', suggestion: '请检查Agent ID' },
  ZH_2002: { message: 'Agent未激活', suggestion: '请等待Agent激活' },
  ZH_3001: { message: '账户不存在', suggestion: '请先创建账户' },
  ZH_3002: { message: '余额不足', suggestion: '请先充值积分' },
  ZH_3003: { message: '金额过小', suggestion: '单笔交易不低于10 USDT' },
  ZH_3004: { message: '金额超限', suggestion: '单笔交易不超过5000 USDT' },
  ZH_4001: { message: '服务不存在', suggestion: '请检查服务类型' },
  ZH_4002: { message: '服务价格已变动', suggestion: '请刷新后重试' },
  ZH_4003: { message: '订单已支付', suggestion: '请勿重复支付' },
  ZH_7001: { message: '推荐人不存在', suggestion: '请检查推荐码是否正确' },
  ZH_7002: { message: '不能推荐自己', suggestion: '推荐码不能是自己的' },
  ZH_7003: { message: '已绑定推荐人', suggestion: '推荐关系已存在' },
  ZH_9001: { message: '系统内部错误', suggestion: '请稍后重试' },
  ZH_9002: { message: '服务不可用', suggestion: '系统维护中，请稍后重试' },
};

// ============================================
// 正和API客户端类
// ============================================

class ZhengheClient {
  private client: AxiosInstance;
  private apiKey: string = '';
  private apiSecret: string = '';
  private userId: string = '';
  private accountId: string = '';

  constructor() {
    this.client = axios.create({
      baseURL: ZHENGHE_CONFIG.baseURL,
      timeout: ZHENGHE_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * 配置用户凭证
   */
  configure(config: {
    apiKey?: string;
    apiSecret?: string;
    userId?: string;
    accountId?: string;
  }) {
    if (config.apiKey) this.apiKey = config.apiKey;
    if (config.apiSecret) this.apiSecret = config.apiSecret;
    if (config.userId) this.userId = config.userId;
    if (config.accountId) this.accountId = config.accountId;
  }

  /**
   * 从本地存储恢复配置
   */
  loadFromStorage() {
    const stored = localStorage.getItem('zhenghe_user');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this.configure(data);
      } catch (e) {
        console.error('Failed to load Zhenghe config from storage', e);
      }
    }
  }

  /**
   * 保存配置到本地存储
   */
  saveToStorage() {
    const data = {
      apiKey: this.apiKey,
      apiSecret: this.apiSecret,
      userId: this.userId,
      accountId: this.accountId,
    };
    localStorage.setItem('zhenghe_user', JSON.stringify(data));
  }

  /**
   * 生成请求签名
   */
  private generateSignature(timestamp: string, method: string, path: string, body: string): string {
    if (!this.apiSecret) return '';
    
    const bodyHash = body ? this.sha256(body) : '';
    const signString = `${timestamp}${method}${path}${bodyHash}`;
    
    // 使用Web Crypto API进行HMAC-SHA256签名
    // 注意：生产环境应使用服务端签名
    return this.hmacSha256(this.apiSecret, signString);
  }

  /**
   * SHA256哈希
   */
  private sha256(str: string): string {
    // 简化的实现，实际应使用Web Crypto API
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }

  /**
   * HMAC-SHA256签名
   */
  private hmacSha256(secret: string, message: string): string {
    // 简化实现，实际应使用Web Crypto API
    // 这里生成一个模拟签名用于演示
    const combined = secret + message;
    return this.sha256(combined);
  }

  /**
   * 生成Nonce
   */
  private generateNonce(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 发送带签名的请求
   */
  private async signedRequest<T>(
    method: 'GET' | 'POST' | 'PATCH',
    path: string,
    data?: unknown
  ): Promise<T> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = this.generateNonce();
    const body = data ? JSON.stringify(data) : '';
    
    // 简化签名逻辑（生产环境需要正确的HMAC-SHA256实现）
    // 由于浏览器环境限制，这里使用简化版本
    const signature = this.apiSecret ? this.hmacSha256(this.apiSecret, timestamp + method + path + body) : '';

    try {
      const response = await this.client.request<T>({
        method,
        url: path,
        data,
        headers: {
          'X-Timestamp': timestamp,
          'X-API-Key': this.apiKey || '',
          'X-Signature': signature,
          'X-Nonce': nonce,
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 处理API错误
   */
  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ZhengheError>;
      const response = axiosError.response?.data;
      
      if (response?.code) {
        const errorInfo = ERROR_CODE_MESSAGES[response.code];
        return new Error(errorInfo?.message || response.message || '正和系统错误');
      }
      
      return new Error(axiosError.message || '网络请求失败');
    }
    return error instanceof Error ? error : new Error('未知错误');
  }

  // ============================================
  // 账户管理接口
  // ============================================

  /**
   * 查询账户余额
   */
  async getAccountBalance(): Promise<AccountInfo | null> {
    if (!this.accountId) {
      console.warn('Account ID not configured');
      return null;
    }

    try {
      const response = await this.signedRequest<ZhengheResponse<AccountInfo>>(
        'GET',
        `/accounts/${this.accountId}`
      );
      return response.data || null;
    } catch (error) {
      console.error('Failed to get account balance:', error);
      return null;
    }
  }

  /**
   * 查询交易历史
   */
  async getTransactionHistory(
    page: number = 1,
    pageSize: number = 50
  ): Promise<{ total: number; transactions: unknown[] } | null> {
    if (!this.accountId) return null;

    try {
      const response = await this.signedRequest<ZhengheResponse<{
        total: number;
        page: number;
        page_size: number;
        transactions: unknown[];
      }>>(
        'GET',
        `/accounts/${this.accountId}/transactions?page=${page}&page_size=${pageSize}`
      );
      return response.data || null;
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      return null;
    }
  }

  // ============================================
  // 服务消费接口
  // ============================================

  /**
   * 创建舌诊服务订单
   */
  async createServiceOrder(params: {
    agentId: string;
    serviceType?: string;
    pricingUsdt: string;
    metadata?: TongueDiagnosisMetadata;
    referenceId?: string;
  }): Promise<ServiceOrder | null> {
    if (!this.accountId) {
      throw new Error('请先配置账户信息');
    }

    try {
      const response = await this.signedRequest<ZhengheResponse<ServiceOrder>>(
        'POST',
        '/orders',
        {
          consumer_account_id: this.accountId,
          agent_id: params.agentId,
          service_type: params.serviceType || 'tongue_diagnosis',
          pricing_usdt: params.pricingUsdt,
          metadata: params.metadata,
          reference_id: params.referenceId,
        }
      );
      return response.data || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 查询订单状态
   */
  async getOrder(orderId: string): Promise<ServiceOrder | null> {
    try {
      const response = await this.signedRequest<ZhengheResponse<ServiceOrder>>(
        'GET',
        `/orders/${orderId}`
      );
      return response.data || null;
    } catch (error) {
      console.error('Failed to get order:', error);
      return null;
    }
  }

  /**
   * 取消服务订单（未完成前）
   */
  async cancelOrder(orderId: string): Promise<{ order_id: string; status: string; released_tokens: string } | null> {
    try {
      const response = await this.signedRequest<ZhengheResponse<{
        order_id: string;
        status: string;
        released_tokens: string;
      }>>(
        'POST',
        `/orders/${orderId}/cancel`
      );
      return response.data || null;
    } catch (error) {
      console.error('Failed to cancel order:', error);
      return null;
    }
  }

  // ============================================
  // 推荐关系接口
  // ============================================

  /**
   * 绑定推荐关系
   */
  async bindReferral(referralCode: string): Promise<ReferralInfo | null> {
    if (!this.userId) {
      throw new Error('请先配置用户信息');
    }

    try {
      const response = await this.signedRequest<ZhengheResponse<ReferralInfo>>(
        'POST',
        '/referrals/bind',
        {
          user_id: this.userId,
          referral_code: referralCode,
        }
      );
      return response.data || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 查询推荐关系
   */
  async getReferralInfo(): Promise<ReferralInfo | null> {
    if (!this.userId) return null;

    try {
      const response = await this.signedRequest<ZhengheResponse<ReferralInfo>>(
        'GET',
        `/referrals/${this.userId}`
      );
      return response.data || null;
    } catch (error) {
      console.error('Failed to get referral info:', error);
      return null;
    }
  }

  // ============================================
  // 资金池接口（公开）
  // ============================================

  /**
   * 查询实时价格（无需认证）
   */
  async getPoolPrice(): Promise<PoolPrice | null> {
    try {
      const response = await this.client.get<PoolPrice>('/pool/price');
      return response.data;
    } catch (error) {
      console.error('Failed to get pool price:', error);
      return null;
    }
  }

  // ============================================
  // 工具方法
  // ============================================

  /**
   * 计算服务所需积分
   */
  calculateTokensNeeded(pricingUsdt: number, currentPrice: number = 1): string {
    const tokensNeeded = (pricingUsdt / currentPrice) * 1.009; // 包含0.9%增值
    return tokensNeeded.toFixed(8);
  }

  /**
   * 格式化余额显示
   */
  formatBalance(balance: string): string {
    const num = parseFloat(balance);
    if (num >= 10000) {
      return (num / 10000).toFixed(2) + '万';
    }
    return num.toFixed(2);
  }

  /**
   * 检查是否已配置
   */
  isConfigured(): boolean {
    return !!(this.apiKey && this.accountId);
  }

  /**
   * 获取当前配置
   */
  getConfig() {
    return {
      apiKey: this.apiKey,
      userId: this.userId,
      accountId: this.accountId,
      isConfigured: this.isConfigured(),
    };
  }

  /**
   * 清除配置
   */
  clearConfig() {
    this.apiKey = '';
    this.apiSecret = '';
    this.userId = '';
    this.accountId = '';
    localStorage.removeItem('zhenghe_user');
  }
}

// ============================================
// 导出单例
// ============================================

export const zhengheClient = new ZhengheClient();

// ============================================
// 舌诊服务常量
// ============================================

export const TONGUE_DIAGNOSIS_SERVICE = {
  // 舌诊服务类型标识
  SERVICE_TYPE: 'tongue_diagnosis',
  
  // 默认定价（USDT）
  DEFAULT_PRICING: '50.00000000',
  
  // Agent ID（舌镜在正和系统注册的Agent）
  AGENT_ID: import.meta.env.VITE_ZHENGHE_AGENT_ID || '',
  
  // 服务名称
  SERVICE_NAME: '中医舌诊服务',
  
  // 服务描述
  SERVICE_DESCRIPTION: '专业AI舌诊分析，包含舌象识别、辨证分析、针灸方案推荐',
};

// 导出类型
export type {
  AccountInfo,
  PoolPrice,
  ServiceOrder,
  ReferralInfo,
  TongueDiagnosisMetadata,
  ZhengheError,
};
