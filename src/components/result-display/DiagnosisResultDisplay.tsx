import React, { useState } from 'react';
import clsx from 'clsx';
import type { DiagnosisResult } from '@/types';
import { priorityColorMap } from '@/types';

interface DiagnosisResultDisplayProps {
  result: DiagnosisResult;
}

// 置信度颜色
const confidenceColor = (confidence: number): string => {
  if (confidence >= 0.85) return 'bg-green-500';
  if (confidence >= 0.7) return 'bg-yellow-500';
  return 'bg-red-500';
};

// 置信度文字颜色
const confidenceTextColor = (confidence: number): string => {
  if (confidence >= 0.85) return 'text-green-600';
  if (confidence >= 0.7) return 'text-yellow-600';
  return 'text-red-600';
};

export const DiagnosisResultDisplay: React.FC<DiagnosisResultDisplayProps> = ({ result }) => {
  const {
    primarySyndrome,
    confidence,
    syndromeScore,
    secondarySyndromes,
    pathogenesis,
    organLocation,
    diagnosisEvidence,
    priority,
    diagnosisTime,
  } = result;

  // 分层展开状态
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="space-y-3 animate-in">
      {/* ========== 第一层：核心结果（默认展开） ========== */}
      <div className="tcm-card p-4 bg-gradient-to-br from-primary-50 to-secondary-50 border-2 border-primary-200">
        {/* 证型名称 - 大字醒目 */}
        <div className="text-center mb-4">
          <h3 className="text-2xl font-chinese font-bold text-primary-700 mb-1">
            {primarySyndrome}
          </h3>
          <div className="flex items-center justify-center gap-3">
            <span className={clsx('tcm-tag px-2 py-0.5 text-xs', priorityColorMap[priority])}>
              {priority === '高' && '▲▲▲ '}{priority}
            </span>
            <span className="text-xs text-stone-500">
              辨证得分: {syndromeScore}分
            </span>
          </div>
        </div>
        
        {/* 置信度条 - 简化 */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-stone-500">置信度</span>
            <span className={clsx('font-semibold', confidenceTextColor(confidence))}>
              {(confidence * 100).toFixed(0)}%
            </span>
          </div>
          <div className="confidence-bar h-2">
            <div
              className={clsx('confidence-bar-fill h-full', confidenceColor(confidence))}
              style={{ width: `${confidence * 100}%` }}
            />
          </div>
        </div>
        
        {/* 一句话病机 */}
        <div className="text-sm text-stone-600 text-center">
          <span className="text-xs text-stone-400 mr-1">病机:</span>
          {pathogenesis.split('→').map((item, i, arr) => (
            <React.Fragment key={i}>
              <span className="text-primary-600 font-medium">{item.trim()}</span>
              {i < arr.length - 1 && (
                <span className="mx-1 text-stone-300">→</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 脏腑定位 - 简化展示 */}
      <div className="tcm-card p-3">
        <h4 className="text-xs font-medium text-stone-500 mb-2 flex items-center gap-1">
          <span>🎯</span> 脏腑定位
        </h4>
        <div className="flex flex-wrap gap-2">
          {organLocation.slice(0, 4).map((organ, index) => (
            <span
              key={organ}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-sm font-medium',
                index === 0
                  ? 'bg-red-100 text-red-600 border border-red-200'
                  : index < 2
                    ? 'bg-orange-100 text-orange-600 border border-orange-200'
                    : 'bg-stone-100 text-stone-600 border border-stone-200'
              )}
            >
              {organ}
              {index === 0 && <span className="ml-1 text-xs opacity-75">(主)</span>}
            </span>
          ))}
        </div>
      </div>

      {/* 第二层：次要证型和辨证依据（可折叠） */}
      {(secondarySyndromes.length > 0 || diagnosisEvidence.length > 0) && (
        <div className="tcm-card p-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between text-sm font-medium text-stone-600 hover:text-stone-800 transition-colors"
          >
            <span>📊 详细信息</span>
            <svg 
              className={clsx('w-4 h-4 transition-transform', showDetails && 'rotate-180')} 
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showDetails && (
            <div className="mt-3 space-y-3 animate-in">
              {/* 次要证型 */}
              {secondarySyndromes.length > 0 && (
                <div>
                  <span className="text-xs text-stone-500 mb-1 block">备选证型</span>
                  <div className="space-y-2">
                    {secondarySyndromes.slice(0, 3).map((syndrome, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <span className="text-stone-600">{syndrome.syndrome}</span>
                        <div className="flex-1 confidence-bar h-1.5">
                          <div
                            className={clsx('confidence-bar-fill h-full', confidenceColor(syndrome.confidence))}
                            style={{ width: `${syndrome.confidence * 100}%` }}
                          />
                        </div>
                        <span className={clsx('text-xs font-medium w-10 text-right', confidenceTextColor(syndrome.confidence))}>
                          {(syndrome.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 辨证依据 */}
              {diagnosisEvidence.length > 0 && (
                <div>
                  <span className="text-xs text-stone-500 mb-1 block">辨证依据</span>
                  <div className="space-y-1.5">
                    {diagnosisEvidence.slice(0, 5).map((evidence, index) => (
                      <div key={index} className="flex items-center justify-between text-xs py-1 px-2 bg-stone-50 rounded">
                        <span className="text-stone-600">{evidence.feature}</span>
                        <span className={clsx('font-medium', confidenceTextColor(evidence.matchDegree))}>
                          {Math.round(evidence.matchDegree * 100)}%
                        </span>
                      </div>
                    ))}
                    {diagnosisEvidence.length > 5 && (
                      <div className="text-xs text-stone-400 text-center">
                        还有 {diagnosisEvidence.length - 5} 项依据...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 底部信息 */}
      <p className="text-xs text-stone-400 text-center">
        辨证耗时: {diagnosisTime}
      </p>
    </div>
  );
};

export default DiagnosisResultDisplay;
