import React from 'react';
import clsx from 'clsx';
import type { AcupuncturePlan } from '@/types';
import AcupointCard from './AcupointCard';

interface AcupunctureDisplayProps {
  plan: AcupuncturePlan;
}

export const AcupunctureDisplay: React.FC<AcupunctureDisplayProps> = ({ plan }) => {
  const {
    treatmentPrinciple,
    mainPoints,
    secondaryPoints,
    contraindications,
    treatmentAdvice,
  } = plan;

  return (
    <div className="space-y-4 animate-in">
      {/* 治疗原则 */}
      <div className="tcm-card p-4 bg-gradient-to-r from-secondary-50 to-white border-l-4 border-secondary-400">
        <h4 className="tcm-section-title text-base">
          <span className="text-2xl">💡</span> 治疗原则
        </h4>
        <p className="text-secondary-700 font-medium leading-relaxed">
          {treatmentPrinciple}
        </p>
      </div>

      {/* 主穴 */}
      <div className="tcm-card p-4">
        <h4 className="tcm-section-title text-base">
          <span className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">🟢</span>
          主穴 ({mainPoints.length}个)
        </h4>
        <div className="space-y-3">
          {mainPoints.map((point, index) => (
            <AcupointCard
              key={index}
              point={point.point}
              meridian={point.meridian}
              effect={point.effect}
              location={point.location}
              technique={point.technique}
              precautions={point.precautions}
              isMain={true}
              color="green"
            />
          ))}
        </div>
      </div>

      {/* 配穴 */}
      {secondaryPoints.length > 0 && (
        <div className="tcm-card p-4">
          <h4 className="tcm-section-title text-base">
            <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">🔵</span>
            配穴 ({secondaryPoints.length}个)
          </h4>
          <div className="space-y-3">
            {secondaryPoints.map((point, index) => (
              <AcupointCard
                key={index}
                point={point.point}
                meridian={point.meridian}
                effect={point.effect}
                location={point.location}
                technique={point.technique}
                precautions={point.precautions}
                isMain={false}
                color="blue"
              />
            ))}
          </div>
        </div>
      )}

      {/* 配伍禁忌 */}
      {contraindications.length > 0 && (
        <div className="tcm-card p-4 bg-amber-50 border-amber-200 border">
          <h4 className="tcm-section-title text-base text-amber-700">
            <span className="text-2xl">⚠️</span> 配伍禁忌
          </h4>
          <ul className="space-y-2">
            {contraindications.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-amber-800">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 治疗建议 */}
      {treatmentAdvice && (
        <div className="tcm-card p-4 bg-stone-50">
          <h4 className="tcm-section-title text-base">
            <span className="text-2xl">📋</span> 治疗建议
          </h4>
          <p className="text-stone-700 leading-relaxed whitespace-pre-line">
            {treatmentAdvice}
          </p>
        </div>
      )}
    </div>
  );
};

export default AcupunctureDisplay;
