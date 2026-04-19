import React from 'react';
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

  return (
    <div className="space-y-4 animate-in">
      {/* 主要证型卡片 */}
      <div className="tcm-card p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-chinese font-semibold text-primary-700">
              🏷️ {primarySyndrome}
            </h3>
            <p className="text-sm text-stone-500 mt-1">
              辨证得分: {syndromeScore}分
            </p>
          </div>
          <div className={clsx('tcm-tag px-3 py-1', priorityColorMap[priority])}>
            {priority === '高' && '▲▲▲ '}{priority}
          </div>
        </div>
        
        {/* 置信度条 */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-stone-600">置信度</span>
            <span className={clsx('font-semibold', confidenceTextColor(confidence))}>
              {(confidence * 100).toFixed(0)}%
            </span>
          </div>
          <div className="confidence-bar">
            <div
              className={clsx('confidence-bar-fill', confidenceColor(confidence))}
              style={{ width: `${confidence * 100}%` }}
            />
          </div>
        </div>
        
        <p className="text-xs text-stone-400 mt-2">
          辨证耗时: {diagnosisTime}
        </p>
      </div>

      {/* 病机分析 */}
      <div className="tcm-card p-4">
        <h4 className="tcm-section-title text-base">📋 病机分析</h4>
        <p className="text-stone-700 leading-relaxed">
          {pathogenesis.split('→').map((item, i, arr) => (
            <React.Fragment key={i}>
              <span className="text-primary-600 font-medium">{item.trim()}</span>
              {i < arr.length - 1 && (
                <span className="mx-2 text-stone-400">→</span>
              )}
            </React.Fragment>
          ))}
        </p>
      </div>

      {/* 脏腑定位 */}
      <div className="tcm-card p-4">
        <h4 className="tcm-section-title text-base">🎯 脏腑定位</h4>
        <div className="flex flex-wrap gap-3">
          {organLocation.map((organ, index) => (
            <div
              key={organ}
              className={clsx(
                'flex flex-col items-center justify-center w-16 h-16 rounded-xl border-2 transition-all',
                index < 3
                  ? 'bg-red-50 border-red-300 text-red-600'
                  : 'bg-stone-50 border-stone-300 text-stone-500'
              )}
            >
              <span className="text-lg font-semibold">{organ}</span>
              <span className="text-xs opacity-75">
                {index < 3 ? '主要' : '次要'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 次要证型 */}
      {secondarySyndromes.length > 0 && (
        <div className="tcm-card p-4">
          <h4 className="tcm-section-title text-base">📊 次要证型</h4>
          <div className="space-y-3">
            {secondarySyndromes.map((syndrome, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-sm text-stone-600 w-24">{syndrome.syndrome}</span>
                <div className="flex-1 confidence-bar">
                  <div
                    className={clsx('confidence-bar-fill', confidenceColor(syndrome.confidence))}
                    style={{ width: `${syndrome.confidence * 100}%` }}
                  />
                </div>
                <span className={clsx('text-sm font-medium w-12 text-right', confidenceTextColor(syndrome.confidence))}>
                  {(syndrome.confidence * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 辨证依据 */}
      {diagnosisEvidence.length > 0 && (
        <div className="tcm-card p-4">
          <h4 className="tcm-section-title text-base">📝 辨证依据</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="text-left py-2 text-stone-600 font-medium">特征</th>
                  <th className="text-center py-2 text-stone-600 font-medium w-12">权重</th>
                  <th className="text-left py-2 text-stone-600 font-medium">贡献</th>
                  <th className="text-center py-2 text-stone-600 font-medium w-16">匹配度</th>
                </tr>
              </thead>
              <tbody>
                {diagnosisEvidence.map((evidence, index) => (
                  <tr key={index} className="border-b border-stone-100 hover:bg-stone-50">
                    <td className="py-2 text-stone-700">{evidence.feature}</td>
                    <td className="py-2 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-medium">
                        {evidence.weight}
                      </span>
                    </td>
                    <td className="py-2 text-stone-600">{evidence.contribution}</td>
                    <td className="py-2 text-center">
                      <span className={clsx('font-medium', confidenceTextColor(evidence.matchDegree))}>
                        {(evidence.matchDegree * 100).toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiagnosisResultDisplay;
