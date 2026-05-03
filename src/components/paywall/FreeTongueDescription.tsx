/**
 * 免费区展示组件 v2
 * 设计理念：免费版已经足够好 - 用户看完"真准"不是"只给一半"
 * 
 * 免费展示：
 * - 舌色、舌形、舌苔基础描述
 * - 体质倾向识别
 * - 一句话健康建议
 * - 自然引导向深度方案
 */

import React from 'react';
import clsx from 'clsx';
import type { ConstitutionAssessment, ConstitutionEnum } from '@/types/output';

interface FreeTongueDescriptionProps {
  // 舌象特征
  tongueColor?: string;
  tongueShape?: string;
  tongueState?: string;
  coatingColor?: string;
  coatingTexture?: string;
  coatingMoisture?: string;
  
  // 体质评估
  constitutionAssessment?: ConstitutionAssessment;
  
  // 体质主题配置
  constitutionTheme?: Record<ConstitutionEnum, {
    bgGradient: string;
    border: string;
    text: string;
    badge: string;
    icon: string;
  }>;
}

// 默认体质主题
const DEFAULT_CONSTITUTION_THEME: Record<ConstitutionEnum, {
  bgGradient: string;
  border: string;
  text: string;
  badge: string;
  icon: string;
}> = {
  '气虚': { bgGradient: 'from-amber-50 to-orange-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700', icon: '💨' },
  '阴虚': { bgGradient: 'from-red-50 to-pink-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700', icon: '🔥' },
  '阳虚': { bgGradient: 'from-blue-50 to-cyan-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700', icon: '❄️' },
  '血瘀': { bgGradient: 'from-purple-50 to-violet-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700', icon: '🩸' },
  '痰湿': { bgGradient: 'from-yellow-50 to-green-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700', icon: '💧' },
  '湿热': { bgGradient: 'from-orange-50 to-red-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700', icon: '🌡️' },
  '气郁': { bgGradient: 'from-green-50 to-teal-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-700', icon: '🌿' },
  '平和': { bgGradient: 'from-emerald-50 to-teal-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', icon: '✨' },
};

// 舌色描述映射
const TONGUE_COLOR_MAP: Record<string, { desc: string; emoji: string; bgColor: string }> = {
  '淡白': { desc: '血色偏淡，提示气血稍有不足', emoji: '🌸', bgColor: 'bg-pink-50' },
  '淡红': { desc: '舌色淡红润泽，气血调和', emoji: '🌺', bgColor: 'bg-rose-50' },
  '红': { desc: '舌色偏红，体内有热', emoji: '🔥', bgColor: 'bg-red-50' },
  '绛红': { desc: '舌色深红，热盛津伤', emoji: '🍅', bgColor: 'bg-orange-50' },
  '紫': { desc: '舌色带紫，提示气血运行不畅', emoji: '🍇', bgColor: 'bg-purple-50' },
  '青紫': { desc: '舌色青紫，血瘀明显', emoji: '🥀', bgColor: 'bg-violet-50' },
  '淡紫': { desc: '舌色淡紫，阳气稍弱', emoji: '🫧', bgColor: 'bg-slate-50' },
};

// 舌形描述映射
const TONGUE_SHAPE_MAP: Record<string, { desc: string; emoji: string }> = {
  '胖大': { desc: '舌体偏胖，水湿内停', emoji: '🎈' },
  '瘦薄': { desc: '舌体偏瘦，阴血不足', emoji: '🍃' },
  '正常': { desc: '舌体大小适中', emoji: '✓' },
};

// 一句话建议生成
const generateAdvice = (constitution?: ConstitutionAssessment['constitution']): string => {
  if (!constitution?.primary) return '建议保持良好生活习惯';
  
  const adviceMap: Record<ConstitutionEnum, string> = {
    '气虚': '注意休息适度运动，补气养气',
    '阴虚': '避免熬夜伤阴，多食滋阴润燥',
    '阳虚': '注意保暖防寒，少食生冷',
    '痰湿': '清淡饮食，适度运动化痰湿',
    '湿热': '忌辛辣油腻，保持二便通畅',
    '血瘀': '适度运动活血行瘀，情志舒畅',
    '气郁': '调节情绪放松心情，疏肝解郁',
    '平和': '保持现状，阴阳平衡养生',
  };
  
  return adviceMap[constitution.primary.type] || '建议咨询专业中医师';
};

export const FreeTongueDescription: React.FC<FreeTongueDescriptionProps> = ({
  tongueColor,
  tongueShape,
  tongueState,
  coatingColor,
  coatingTexture,
  coatingMoisture,
  constitutionAssessment,
  constitutionTheme = DEFAULT_CONSTITUTION_THEME,
}) => {
  const constitution = constitutionAssessment?.constitution;
  const primaryConstitution = constitution?.primary;
  const secondaryConstitution = constitution?.secondary;
  
  const theme = primaryConstitution?.type 
    ? constitutionTheme[primaryConstitution.type] 
    : constitutionTheme['平和'];

  // 是否有有效数据
  const hasValidData = tongueColor || tongueShape || coatingColor || primaryConstitution;

  if (!hasValidData) {
    return (
      <div className="tcm-card p-8 text-center">
        <div className="text-5xl mb-4">👅</div>
        <p className="text-stone-500">正在分析您的舌象特征...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 基础舌象分析卡片 */}
      <div className="tcm-card p-5 bg-gradient-to-br from-stone-50 to-white border border-stone-100">
        <h4 className="text-sm font-medium text-stone-500 mb-4 flex items-center gap-2">
          <span className="text-lg">🔬</span>
          <span>基础舌象分析</span>
        </h4>
        
        <div className="space-y-3">
          {/* 舌色 */}
          {tongueColor && TONGUE_COLOR_MAP[tongueColor] && (
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-stone-100 shadow-sm">
              <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center text-lg", TONGUE_COLOR_MAP[tongueColor].bgColor)}>
                {TONGUE_COLOR_MAP[tongueColor].emoji}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-stone-700">舌色</span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs font-medium">
                    {tongueColor}
                  </span>
                </div>
                <p className="text-xs text-stone-500">{TONGUE_COLOR_MAP[tongueColor].desc}</p>
              </div>
            </div>
          )}

          {/* 舌形 */}
          {tongueShape && TONGUE_SHAPE_MAP[tongueShape] && (
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-stone-100 shadow-sm">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-blue-50">
                {TONGUE_SHAPE_MAP[tongueShape].emoji}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-stone-700">舌形</span>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                    {tongueShape}
                  </span>
                </div>
                <p className="text-xs text-stone-500">{TONGUE_SHAPE_MAP[tongueShape].desc}</p>
              </div>
            </div>
          )}

          {/* 舌苔 */}
          {(coatingColor || coatingTexture || coatingMoisture) && (
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-stone-100 shadow-sm">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-amber-50">
                🌫️
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-stone-700">舌苔</span>
                  <div className="flex gap-1">
                    {coatingColor && (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-medium">
                        {coatingColor}苔
                      </span>
                    )}
                    {coatingTexture && (
                      <span className="px-2 py-0.5 bg-orange-50 text-orange-700 rounded text-xs font-medium">
                        {coatingTexture}
                      </span>
                    )}
                    {coatingMoisture && (
                      <span className="px-2 py-0.5 bg-cyan-50 text-cyan-700 rounded text-xs font-medium">
                        {coatingMoisture}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-stone-500">
                  {[coatingColor && `苔色${coatingColor}`, coatingTexture && `质地${coatingTexture}`, coatingMoisture && `湿度${coatingMoisture}`].filter(Boolean).join('，')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 体质倾向识别卡片 - 这个要"真准" */}
      {primaryConstitution && (
        <div className={clsx(
          "rounded-2xl border-2 p-5 bg-gradient-to-br",
          theme.bgGradient,
          theme.border
        )}>
          <div className="flex items-start gap-4">
            <span className="text-4xl">{theme.icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className={clsx("font-bold text-lg", theme.text)}>
                  {primaryConstitution.name}
                </h4>
                <span className={clsx("text-xs px-2 py-0.5 rounded-full", theme.badge)}>
                  体质倾向
                </span>
              </div>
              
              {primaryConstitution.description && (
                <p className="text-sm text-stone-600 leading-relaxed mb-3">
                  {primaryConstitution.description}
                </p>
              )}

              {/* 兼夹体质 */}
              {secondaryConstitution && secondaryConstitution.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {secondaryConstitution.map((s, i) => {
                    const sTheme = constitutionTheme[s.type] || constitutionTheme['平和'];
                    return (
                      <span 
                        key={i} 
                        className={clsx(
                          "text-xs px-2 py-1 rounded-full border",
                          sTheme.border,
                          sTheme.badge
                        )}
                      >
                        兼{s.type}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* 调理方向 */}
              {primaryConstitution.carePrinciple && (
                <div className="pt-3 border-t border-stone-200/50">
                  <p className="text-xs text-stone-500 mb-1">调理方向</p>
                  <p className="text-sm font-semibold text-stone-700">
                    {primaryConstitution.carePrinciple}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 一句话健康建议 - 足够好的结尾 */}
      <div className="tcm-card p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <p className="text-xs text-emerald-600 font-medium mb-1">健康建议</p>
            <p className="text-sm text-stone-700 leading-relaxed">
              {generateAdvice(constitution)}
            </p>
          </div>
        </div>
      </div>

      {/* 自然引导语 - 不是"被锁了"而是"还有更深的" */}
      <div className="text-center py-2 space-y-1">
        <p className="text-sm text-stone-500">
          基于以上分析
        </p>
        <div className="flex items-center justify-center gap-1 text-emerald-600">
          <span className="text-sm font-medium">为您准备了深度辨证方案</span>
          <svg className="w-4 h-4 animate-bounce-x" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default FreeTongueDescription;
