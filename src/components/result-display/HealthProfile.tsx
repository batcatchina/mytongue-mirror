/**
 * 舌镜健康画像组件 v2.0
 * 
 * 产品理念：围绕用户自己的完整健康画像，六维度认知融合
 * 1. 有无 - 体质识别（我是谁）
 * 2. 难易 - 病机根源（为什么）
 * 3. 长短 - 长期vs短期（时间维度）
 * 4. 高下 - 严重程度和优先级（急缓）
 * 5. 音声 - 个性化共鸣（说的就是我）
 * 6. 先后 - 调理次序（怎么办）
 * 
 * 设计风格：紧凑、信息密度高，参考钱包APP和极客教育的细边框卡片
 */

import React, { useState } from 'react';
import clsx from 'clsx';
import type { 
  DiagnosisResult, 
  ConstitutionAssessment,
  ConstitutionEnum,
} from '@/types/output';

// 引入体质主题
const CONSTITUTION_THEME_MAP: Record<ConstitutionEnum, {
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

interface HealthProfileProps {
  diagnosisResult: DiagnosisResult;
  constitutionAssessment?: ConstitutionAssessment;
  compact?: boolean; // 紧凑模式
}

export const HealthProfile: React.FC<HealthProfileProps> = ({ 
  diagnosisResult, 
  constitutionAssessment,
  compact = false,
}) => {
  const [expanded, setExpanded] = useState(false);

  const { primarySyndrome, confidence, pathogenesis, organLocation, priority } = diagnosisResult;
  
  // 获取体质信息
  const constitution = constitutionAssessment?.constitution;
  const primaryConstitution = constitution?.primary;
  const secondaryConstitution = constitution?.secondary;
  
  // 获取体质主题
  const theme = primaryConstitution?.type 
    ? CONSTITUTION_THEME_MAP[primaryConstitution.type] 
    : CONSTITUTION_THEME_MAP['平和'];

  // 严重程度映射
  const priorityConfig = {
    '高': { label: '需重视', color: 'text-red-600 bg-red-50 border-red-200', icon: '⚠️' },
    '中': { label: '适度调理', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: '💡' },
    '低': { label: '轻微问题', color: 'text-green-600 bg-green-50 border-green-200', icon: '✅' },
  };
  const priorityInfo = priorityConfig[priority] || priorityConfig['中'];

  // 置信度文本
  const matchText = confidence >= 0.8 ? '高度匹配' : confidence >= 0.6 ? '较好匹配' : '初步判断';

  return (
    <div className="space-y-2 animate-in">
      {/* ===== 核心画像区 ===== */}
      <div className={clsx(
        "rounded-xl border bg-gradient-to-br p-4",
        theme.bgGradient,
        theme.border,
        compact ? "space-y-2" : "space-y-3"
      )}>
        
        {/* 第一行：体质底色 + 证型 */}
        <div className="flex items-start justify-between gap-3">
          {/* 体质标签 - 长期身份 */}
          <div className="flex items-center gap-2">
            <span className="text-xl">{theme.icon}</span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className={clsx("font-semibold", theme.text, compact ? "text-sm" : "text-base")}>
                  {primaryConstitution?.name || '体质待定'}
                </span>
                {secondaryConstitution && secondaryConstitution.length > 0 && (
                  <span className={clsx("text-xs px-1.5 py-0.5 rounded", theme.badge)}>
                    兼{secondaryConstitution.map(s => s.type).join('、')}
                  </span>
                )}
              </div>
              {!compact && (
                <p className="text-xs text-stone-500 mt-0.5">
                  {primaryConstitution?.description}
                </p>
              )}
            </div>
          </div>
          
          {/* 严重程度 - 优先级 */}
          <span className={clsx(
            "text-xs px-2 py-1 rounded-lg border whitespace-nowrap",
            priorityInfo.color
          )}>
            {priorityInfo.icon} {priorityInfo.label}
          </span>
        </div>

        {/* 第二行：当前证型 - 短期状态 */}
        <div className={clsx(
          "bg-white/60 rounded-lg border border-stone-200/50 p-3",
          compact ? "space-y-1" : "space-y-2"
        )}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-500">当前证型</span>
            <span className="text-xs text-stone-400">{matchText}</span>
          </div>
          <div className="flex items-center gap-2">
            <h3 className={clsx(
              "font-chinese font-bold text-stone-800",
              compact ? "text-base" : "text-xl"
            )}>
              {primarySyndrome}
            </h3>
            {confidence >= 0.8 && (
              <span className="text-sm">🎯</span>
            )}
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            {pathogenesis}
          </p>
        </div>

        {/* 第三行：脏腑定位 */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-stone-500">病位</span>
          <div className="flex gap-1.5 flex-wrap">
            {organLocation?.slice(0, 4).map((organ, i) => (
              <span 
                key={i} 
                className={clsx(
                  "text-xs px-2 py-0.5 rounded-full border",
                  i === 0 
                    ? "bg-red-50 text-red-600 border-red-200 font-medium" 
                    : "bg-stone-50 text-stone-600 border-stone-200"
                )}
              >
                {organ}{i === 0 && <span className="ml-0.5 opacity-60">(主)</span>}
              </span>
            ))}
          </div>
        </div>

        {/* 第四行：调理原则 - 怎么办 */}
        {!compact && (
          <div className="pt-2 border-t border-stone-200/50">
            <div className="flex items-start gap-2">
              <span className="text-sm">💆</span>
              <div>
                <span className="text-xs text-stone-500 block mb-0.5">调理方向</span>
                <p className="text-sm text-stone-700 font-medium">
                  {primaryConstitution?.carePrinciple || '调理脾胃，扶正祛邪'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== 详细分析区（可展开）===== */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-xs text-stone-400 hover:text-stone-600 transition-colors py-1"
      >
        <span>{expanded ? '收起' : '查看'}详细分析</span>
        <svg 
          className={clsx('w-3.5 h-3.5 transition-transform', expanded && 'rotate-180')} 
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="space-y-2 animate-in">
          {/* 舌象依据 */}
          {primaryConstitution?.matchedFeatures && primaryConstitution.matchedFeatures.length > 0 && (
            <div className="rounded-lg border border-stone-200 bg-white p-3">
              <span className="text-xs text-stone-500 block mb-1.5">🩺 舌象依据</span>
              <div className="flex flex-wrap gap-1">
                {primaryConstitution.matchedFeatures.slice(0, 4).map((feature, i) => (
                  <span key={i} className="text-xs px-1.5 py-0.5 bg-stone-100 text-stone-600 rounded">
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 体质特点（个性化共鸣） */}
          {primaryConstitution?.characteristics && (
            <div className="rounded-lg border border-stone-200 bg-white p-3">
              <span className="text-xs text-stone-500 block mb-1.5">📋 {primaryConstitution.name}特征</span>
              <div className="grid grid-cols-2 gap-1">
                {primaryConstitution.characteristics.slice(0, 4).map((char, i) => (
                  <div key={i} className="text-xs text-stone-600 flex items-start gap-1">
                    <span className="text-stone-300">·</span>
                    <span>{char}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 备选证型 */}
          {diagnosisResult.secondarySyndromes && diagnosisResult.secondarySyndromes.length > 0 && (
            <div className="rounded-lg border border-stone-200 bg-white p-3">
              <span className="text-xs text-stone-500 block mb-1.5">🔄 兼夹证型</span>
              <div className="space-y-1">
                {diagnosisResult.secondarySyndromes.slice(0, 2).map((s, i) => (
                  <div key={i} className="text-xs text-stone-600 flex items-center gap-2">
                    <span className="text-stone-300">{i + 1}.</span>
                    <span>{s.syndrome}</span>
                    <span className="text-stone-400">
                      ({s.confidence >= 0.6 ? '较强' : '较弱'})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 置信度条 */}
          <div className="rounded-lg border border-stone-200 bg-white p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-stone-500">分析可靠度</span>
              <span className="text-xs font-medium text-stone-600">{matchText}</span>
            </div>
            <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <div 
                className={clsx(
                  "h-full rounded-full transition-all",
                  confidence >= 0.8 ? "bg-green-500" : confidence >= 0.6 ? "bg-yellow-500" : "bg-orange-400"
                )}
                style={{ width: `${confidence * 100}%` }}
              />
            </div>
          </div>

          {/* 健康提示 */}
          {constitutionAssessment?.healthTips && constitutionAssessment.healthTips.length > 0 && (
            <div className="rounded-lg border border-stone-200 bg-white p-3">
              <span className="text-xs text-stone-500 block mb-1.5">💡 健康提示</span>
              <div className="space-y-0.5">
                {constitutionAssessment.healthTips.slice(0, 3).map((tip, i) => (
                  <p key={i} className="text-xs text-stone-600">{tip}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HealthProfile;
