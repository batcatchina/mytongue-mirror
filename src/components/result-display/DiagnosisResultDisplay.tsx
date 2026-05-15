import React, { useState } from 'react';
import clsx from 'clsx';
import type { DiagnosisResult } from '@/types';

interface DiagnosisResultDisplayProps {
  result: DiagnosisResult;
}

/**
 * 用户视角的结果展示
 * 用户只关心三件事：我怎么了？严重吗？怎么办？
 */
export const DiagnosisResultDisplay: React.FC<DiagnosisResultDisplayProps> = ({ result }) => {
  const {
    primarySyndrome,
    confidence,
    pathogenesis,
    organLocation,
    priority,
  } = result;

  const [showDetails, setShowDetails] = useState(false);

  // 严重程度转用户语言
  const severityText = priority === '高' ? '需要重视' : priority === '中' ? '适度调理' : '轻微问题';
  const severityEmoji = priority === '高' ? '⚠️' : priority === '中' ? '💡' : '✅';
  
  // 置信度转用户语言（不说"置信度"，说"匹配程度"）
  const matchText = confidence >= 0.8 ? '高度匹配' : confidence >= 0.6 ? '较好匹配' : '初步判断';

  return (
    <div className="space-y-3 animate-in" style={{animationDelay: '0ms'}}>
      {/* ===== 核心结论：用户第一眼看到的 ===== */}
      <div className="tcm-card p-5 bg-gradient-to-br from-primary-50 to-secondary-50 border-2 border-primary-200">
        {/* 证型名称 - 最醒目 */}
        <div className="text-center mb-3">
          <h3 className="text-2xl font-chinese font-bold text-primary-700 mb-2">
            {primarySyndrome}
          </h3>
          <p className="text-sm text-stone-500">
            {pathogenesis}
          </p>
        </div>
        
        {/* 两个关键信息：病位 + 严重程度 */}
        <div className="flex items-center justify-center gap-3 mt-3">
          <span className="px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium">
            🎯 {organLocation.slice(0, 3).join(' · ')}
          </span>
          <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
            priority === '高' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
            priority === '中' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
            'bg-green-50 text-green-600 border border-green-200'
          }`}>
            {severityEmoji} {severityText}
          </span>
        </div>
      </div>

      {/* ===== 展开/收起详细分析 ===== */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full tcm-card p-3 flex items-center justify-between text-sm text-stone-500 hover:text-stone-700 transition-colors"
      >
        <span>{showDetails ? '收起详细分析' : '查看详细分析'}</span>
        <svg 
          className={clsx('w-4 h-4 transition-transform', showDetails && 'rotate-180')} 
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showDetails && (
        <div className="tcm-card p-4 space-y-3 animate-in">
          {/* 匹配程度 - 用户能理解的说法 */}
          <div>
            <span className="text-xs text-stone-500 block mb-1">分析可靠度</span>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    confidence >= 0.8 ? 'bg-green-500' : confidence >= 0.6 ? 'bg-yellow-500' : 'bg-orange-400'
                  }`}
                  style={{ width: `${confidence * 100}%` }}
                />
              </div>
              <span className="text-xs text-stone-600 font-medium">{matchText}</span>
            </div>
          </div>

          {/* 备选证型 */}
          {result.secondarySyndromes && result.secondarySyndromes.length > 0 && (
            <div>
              <span className="text-xs text-stone-500 block mb-1">也需关注</span>
              <div className="space-y-1">
                {result.secondarySyndromes.slice(0, 2).map((s, i) => (
                  <div key={i} className="text-sm text-stone-600">
                    · {s.syndrome}
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-stone-400 text-center pt-2 border-t border-stone-100">
            结果由规则引擎分析生成，仅供参考
          </p>
        </div>
      )}
    </div>
  );
};

export default DiagnosisResultDisplay;
