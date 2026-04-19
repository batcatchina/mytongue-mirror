import React from 'react';
import type { LifeCareAdvice } from '@/types';

interface LifeCareDisplayProps {
  advice: LifeCareAdvice;
}

export const LifeCareDisplay: React.FC<LifeCareDisplayProps> = ({ advice }) => {
  const { dietSuggestions, dailyRoutine, precautions } = advice;

  return (
    <div className="space-y-4 animate-in">
      {/* 饮食建议 */}
      <div className="tcm-card p-4">
        <h4 className="tcm-section-title text-base">
          <span className="text-xl">🍽️</span> 饮食建议
        </h4>
        <ul className="space-y-2">
          {dietSuggestions.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-stone-700">
              <span className="text-primary-400 mt-0.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* 生活起居 */}
      <div className="tcm-card p-4">
        <h4 className="tcm-section-title text-base">
          <span className="text-xl">🏃</span> 生活起居
        </h4>
        <ul className="space-y-2">
          {dailyRoutine.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-stone-700">
              <span className="text-secondary-400 mt-0.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* 注意事项 */}
      {precautions.length > 0 && (
        <div className="tcm-card p-4 bg-amber-50 border-amber-200">
          <h4 className="tcm-section-title text-base text-amber-700">
            <span className="text-xl">📢</span> 注意事项
          </h4>
          <ul className="space-y-2">
            {precautions.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-amber-800">
                <span className="text-amber-500 mt-0.5">!</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LifeCareDisplay;
