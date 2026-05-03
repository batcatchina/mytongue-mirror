/**
 * 支付弹窗组件 (Mock版)
 * 支持微信支付、支付宝，后续可接入真实支付
 */

import React, { useState } from 'react';
import clsx from 'clsx';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  price?: number;
}

type PaymentMethod = 'wechat' | 'alipay';

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  price = 9.9,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('wechat');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);

  if (!isOpen) return null;

  // Mock支付成功
  const handlePayment = async () => {
    setIsProcessing(true);
    
    // 模拟支付过程
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsProcessing(false);
    setShowQRCode(false);
    onSuccess();
  };

  // 关闭弹窗
  const handleClose = () => {
    if (!isProcessing) {
      setShowQRCode(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* 弹窗内容 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-4 text-white">
          {/* 测试阶段标识 */}
          <div className="absolute top-0 left-0 right-0 bg-amber-500 text-white text-center py-1 text-xs font-medium">
            🔧 测试阶段 - 点击即可解锁体验完整功能
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">
                🔓
              </div>
              <div>
                <h3 className="font-semibold">解锁完整辨证报告</h3>
                <p className="text-sm text-white/80">一次付费，永久查看</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center disabled:opacity-50"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 价格展示 */}
        <div className="p-4 bg-stone-50 border-b border-stone-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-stone-500">支付金额</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-emerald-600">¥{price}</span>
                <span className="text-sm text-stone-400 line-through">¥29.9</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                限时优惠
              </p>
            </div>
          </div>
        </div>

        {/* 支付方式选择 */}
        {!showQRCode ? (
          <div className="p-4 space-y-4">
            <p className="text-sm font-medium text-stone-700">选择支付方式</p>
            
            <div className="space-y-2">
              {/* 微信支付 */}
              <button
                onClick={() => setSelectedMethod('wechat')}
                className={clsx(
                  "w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4",
                  selectedMethod === 'wechat'
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-stone-200 hover:border-stone-300"
                )}
              >
                <div className="w-10 h-10 rounded-lg bg-[#07C160] flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.045c.134 0 .24-.11.24-.245 0-.06-.024-.12-.04-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.87c-.135-.004-.272-.012-.407-.012zm-1.84 2.877c.536 0 .97.44.97.983a.976.976 0 0 1-.97.983.976.976 0 0 1-.97-.983c0-.542.434-.983.97-.983zm4.857 0c.536 0 .97.44.97.983a.976.976 0 0 1-.97.983.976.976 0 0 1-.97-.983c0-.542.434-.983.97-.983z"/>
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-stone-800">微信支付</p>
                  <p className="text-xs text-stone-500">推荐</p>
                </div>
                <div className={clsx(
                  "w-5 h-5 rounded-full border-2 transition-colors flex items-center justify-center",
                  selectedMethod === 'wechat'
                    ? "border-emerald-500 bg-emerald-500"
                    : "border-stone-300"
                )}>
                  {selectedMethod === 'wechat' && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>

              {/* 支付宝 */}
              <button
                onClick={() => setSelectedMethod('alipay')}
                className={clsx(
                  "w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4",
                  selectedMethod === 'alipay'
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-stone-200 hover:border-stone-300"
                )}
              >
                <div className="w-10 h-10 rounded-lg bg-[#1677FF] flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-stone-800">支付宝</p>
                  <p className="text-xs text-stone-500">银行卡支付</p>
                </div>
                <div className={clsx(
                  "w-5 h-5 rounded-full border-2 transition-colors flex items-center justify-center",
                  selectedMethod === 'alipay'
                    ? "border-emerald-500 bg-emerald-500"
                    : "border-stone-300"
                )}>
                  {selectedMethod === 'alipay' && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            </div>

            {/* 确认支付按钮 */}
            <button
              onClick={() => setShowQRCode(true)}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 active:scale-[0.98] transition-all"
            >
              确认支付 ¥{price}
            </button>

            {/* 注意事项 */}
            <p className="text-xs text-stone-400 text-center">
              点击支付即表示您同意《用户服务协议》
            </p>
          </div>
        ) : (
          /* 二维码展示（Mock） */
          <div className="p-6 space-y-4">
            <div className="text-center">
              <p className="text-sm text-stone-600 mb-2">
                请使用{selectedMethod === 'wechat' ? '微信' : '支付宝'}扫码支付
              </p>
              {/* Mock二维码 */}
              <div className="w-48 h-48 mx-auto bg-stone-100 rounded-xl flex items-center justify-center border-2 border-dashed border-stone-300">
                <div className="text-center">
                  <div className="text-5xl mb-2">📱</div>
                  <p className="text-xs text-stone-500">
                    {selectedMethod === 'wechat' ? '微信' : '支付宝'}二维码
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 text-xs text-stone-500">
              <span>支付金额：¥{price}</span>
              <span>|</span>
              <span>订单有效期：15分钟</span>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowQRCode(false)}
                disabled={isProcessing}
                className="flex-1 py-3 rounded-xl border border-stone-200 text-stone-600 font-medium hover:bg-stone-50 transition-colors disabled:opacity-50"
              >
                返回选择
              </button>
              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    模拟支付中...
                  </>
                ) : (
                  <>
                    <span>模拟支付成功</span>
                    <span className="text-xs opacity-80">(测试)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* 底部保障 */}
        <div className="p-3 bg-stone-50 border-t border-stone-100">
          <div className="flex items-center justify-center gap-4 text-xs text-stone-400">
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>安全支付</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>7×24h服务</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
