/**
 * 支付宝支付按钮组件
 * 支持 PC 端表单支付和移动端 WAP 跳转支付
 * 支付成功后通过 return_url 带回 paid_order 参数
 */

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

interface PayButtonProps {
  /** 商品名称，默认 "舌镜深度辨证" */
  title?: string;
  /** 支付金额，默认 9.9 */
  amount?: number;
  /** 支付成功回调 */
  onSuccess?: () => void;
  /** 自定义类名 */
  className?: string;
  /** 是否显示价格标签，默认 true */
  showPrice?: boolean;
  /** 按钮尺寸: small | medium | large */
  size?: 'small' | 'medium' | 'large';
}

/**
 * 检测是否为移动端设备
 */
const isMobileDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /Android|iPhone|iPad|iPod|Mobile|mobile/i.test(ua) || 
         /MicroMessenger|WeChat/i.test(ua);
};

/**
 * 支付宝支付按钮组件
 * 
 * @example
 * // 基础用法
 * <PayButton />
 * 
 * // 自定义金额和标题
 * <PayButton amount={19.9} title="舌镜高级辨证" />
 * 
 * // 监听支付成功
 * <PayButton onSuccess={() => setUnlocked(true)} />
 */
const PayButton: React.FC<PayButtonProps> = ({
  title = '舌镜深度辨证',
  amount = 9.9,
  onSuccess,
  className = '',
  showPrice = true,
  size = 'medium',
}) => {
  const [loading, setLoading] = useState(false);

  // 尺寸样式映射
  const sizeStyles = {
    small: 'px-3 py-1.5 text-xs',
    medium: 'px-5 py-2.5 text-sm',
    large: 'px-6 py-3 text-base',
  };

  // 发起支付
  const handlePay = async () => {
    if (loading) return;
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/alipay/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: title,
          total_amount: amount.toString(),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.error || '发起支付失败，请重试');
        setLoading(false);
        return;
      }

      // 移动端：跳转 WAP 支付页面
      if (isMobileDevice()) {
        // 从返回数据获取 WAP 支付 URL
        const payUrl = data.payUrl || data.formHtml;
        if (payUrl) {
          // WAP 支付直接跳转
          window.location.href = payUrl;
        } else {
          toast.error('支付链接生成失败，请重试');
          setLoading(false);
        }
      } else {
        // PC 端：渲染支付表单并自动提交
        if (data.formHtml) {
          // 创建临时容器渲染表单
          const container = document.createElement('div');
          container.innerHTML = data.formHtml;
          document.body.appendChild(container);
          
          const form = container.querySelector('form');
          if (form) {
            // 设置 return_url 带回支付状态
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.set('paid_order', data.outTradeNo || 'paid');
            const returnUrl = currentUrl.toString();
            
            // 创建隐藏的 return_url 字段
            const returnInput = document.createElement('input');
            returnInput.type = 'hidden';
            returnInput.name = 'return_url';
            returnInput.value = returnUrl;
            form.appendChild(returnInput);
            
            // 自动提交表单
            form.style.display = 'none';
            form.submit();
          } else {
            toast.error('支付表单生成异常，请重试');
            setLoading(false);
          }
        } else {
          toast.error('支付表单生成失败，请重试');
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('支付请求失败:', error);
      toast.error('网络错误，请检查网络后重试');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className={`
        relative flex items-center justify-center gap-2
        font-medium rounded-xl
        bg-gradient-to-r from-primary-500 to-secondary-500
        text-white
        hover:from-primary-600 hover:to-secondary-600
        shadow-md hover:shadow-lg
        transition-all duration-200
        disabled:opacity-60 disabled:cursor-not-allowed
        disabled:hover:shadow-md
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {loading ? (
        <>
          <svg 
            className="animate-spin w-4 h-4" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4" 
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" 
            />
          </svg>
          <span>跳转支付...</span>
        </>
      ) : (
        <>
          <span className="text-lg">💳</span>
          <span>解锁深度辨证</span>
          {showPrice && (
            <span className="opacity-90">¥{amount.toFixed(1)}</span>
          )}
        </>
      )}
    </button>
  );
};

export default PayButton;

/**
 * 支付状态钩子
 * 用于检测 URL 中的 paid_order 参数判断支付是否成功
 */
export const usePaymentStatus = () => {
  const [isPaid, setIsPaid] = useState(false);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paidOrder = params.get('paid_order');
    if (paidOrder) {
      setIsPaid(true);
      // 清除 URL 参数，避免刷新重复触发
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }
  }, []);

  return isPaid;
};
