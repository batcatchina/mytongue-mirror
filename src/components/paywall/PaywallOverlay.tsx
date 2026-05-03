/**
 * 付费墙遮罩组件 v2
 * 设计理念：润物细无声 - 渐变模糊 + 自然引导 + 好奇驱动
 * 
 * 核心原则：
 * 1. 免费区足够好 - 用户看完"真准"不是"只给一半"
 * 2. 付费是更深一层 - 不是补全，是更深入
 * 3. 心理模型：好奇→免费→真准→想更深→自然解锁
 */

import React from 'react';
import clsx from 'clsx';

interface PaywallOverlayProps {
  isVisible: boolean;
  onUnlock: () => void;
  price?: number;
  userCount?: number;
  // 露出的内容预览（让用户知道下面有东西）
  previewContent?: {
    syndromeName?: string; // 证型名称的模糊影子
  };
}

export const PaywallOverlay: React.FC<PaywallOverlayProps> = ({
  isVisible,
  onUnlock,
  price = 9.9,
  userCount = 12847,
  previewContent,
}) => {
  if (!isVisible) return null;

  return (
    <div className="relative w-full">
      {/* 渐变模糊遮罩 - 从上到下逐渐模糊 */}
      <div 
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 20%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.95) 80%)',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 20%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.95) 80%)',
        }}
      >
        {/* 装饰性条纹 - 暗示内容存在 */}
        <div className="absolute top-1/4 left-4 right-4 h-px bg-gradient-to-r from-transparent via-stone-300/40 to-transparent" />
        <div className="absolute top-1/3 left-6 right-6 h-px bg-gradient-to-r from-transparent via-stone-300/30 to-transparent" />
        
        {/* 预览内容模糊影子 */}
        {previewContent?.syndromeName && (
          <div className="absolute top-8 left-0 right-0 flex justify-center">
            <div className="px-6 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
              <span className="text-sm font-medium text-white/70 blur-[2px]">
                {previewContent.syndromeName}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 底部引导区域 - 自然过渡 */}
      <div className="relative z-20 pt-24 pb-2 space-y-5">
        {/* 引导语 - 自然好奇驱动 */}
        <div className="text-center space-y-2 px-4">
          <p className="text-sm text-stone-600 leading-relaxed">
            根据您的舌象特征，我们为您准备了
          </p>
          <p className="text-base font-medium text-stone-700">
            个性化的深度辨证方案
          </p>
          <div className="flex items-center justify-center gap-1 text-sm text-emerald-600">
            <span>查看完整方案</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* 解锁按钮 - 邀请而非要挟 */}
        <div className="px-4 space-y-3">
          {/* 按钮 */}
          <button
            onClick={onUnlock}
            className={clsx(
              "w-full py-4 px-6 rounded-2xl",
              "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500",
              "shadow-lg shadow-emerald-500/25",
              "hover:shadow-xl hover:shadow-emerald-500/35 hover:scale-[1.01]",
              "active:scale-[0.99] transition-all duration-200",
              "flex items-center justify-center gap-3"
            )}
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-white font-semibold text-base">
              获取深度辨证方案
            </span>
            <span className="ml-1 px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-white font-bold">
              ¥{price}
            </span>
          </button>

          {/* 按钮说明 - 包含什么 */}
          <p className="text-xs text-stone-500 text-center">
            包含：证型判定 · 病机分析 · 配穴方案 · 调理建议
          </p>

          {/* 信任背书 */}
          <div className="flex items-center justify-center gap-2 text-xs text-stone-400">
            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>已有</span>
            <span className="font-medium text-emerald-600">{userCount.toLocaleString()}</span>
            <span>人获取深度方案</span>
          </div>

          {/* 权益卡片 - 微妙的提示 */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 space-y-2.5 border border-stone-100">
            <p className="text-xs font-medium text-stone-500">深度方案包含</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div className="flex items-center gap-2 text-xs text-stone-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>完整证型判定</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-600">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                <span>病机根源分析</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-600">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                <span>个性化配穴</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-600">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                <span>生活调护方案</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaywallOverlay;
