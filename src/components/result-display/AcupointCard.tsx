import React, { useState } from 'react';
import clsx from 'clsx';

export interface AcupointDetail {
  name: string;
  meridian: string;
  specificPoint?: string;
  effect: string;
  location: string;
  positioningMethod?: string;
  technique: string;
  angle?: string;
  depth?: string;
  manipulation?: string;
  DeqiSensation?: string;
  needleRetention?: string;
  compatibility?: { point: string; effect: string }[];
  precautions?: string[];
}

interface AcupointCardProps {
  point: string;
  meridian: string;
  effect: string;
  location?: string;
  technique: string;
  precautions?: string;
  isMain?: boolean;
  color?: 'green' | 'blue';
}

export const AcupointCard: React.FC<AcupointCardProps> = ({
  point,
  meridian,
  effect,
  location,
  technique,
  precautions,
  isMain = true,
  color = 'green',
}) => {
  const [showModal, setShowModal] = useState(false);

  const baseClasses = {
    green: {
      bg: 'from-green-50 to-white',
      border: 'border-green-100',
      text: 'text-green-700',
      hover: 'hover:shadow-green-md',
      badge: 'bg-green-500',
    },
    blue: {
      bg: 'from-blue-50 to-white',
      border: 'border-blue-100',
      text: 'text-blue-700',
      hover: 'hover:shadow-blue-md',
      badge: 'bg-blue-500',
    },
  };

  const styles = baseClasses[color];

  return (
    <>
      <div
        className={clsx(
          'p-4 rounded-xl bg-gradient-to-r border transition-all duration-300 cursor-pointer',
          styles.bg,
          styles.border,
          styles.hover
        )}
        onClick={() => setShowModal(true)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h5 className={clsx('font-semibold text-lg', styles.text)}>
                {point}
              </h5>
              <span className={clsx('w-2 h-2 rounded-full', styles.badge)} />
              <span className="text-sm text-stone-500">({meridian})</span>
            </div>
            <p className="text-stone-600 text-sm mb-2">{effect}</p>
            
            {location && (
              <p className="text-xs text-stone-500 mb-1">
                <span className="font-medium">定位：</span>{location}
              </p>
            )}
            <p className="text-xs text-stone-500 mb-1">
              <span className="font-medium">刺法：</span>{technique}
            </p>
            {precautions && (
              <p className="text-xs text-amber-600 mt-2">
                <span className="font-medium">⚠️ 注意：</span>{precautions}
              </p>
            )}
          </div>
          
          <div className="flex flex-col gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowModal(true);
              }}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5',
                'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
              )}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              详情
            </button>
          </div>
        </div>
      </div>

      {/* 穴位详情弹窗 */}
      {showModal && (
        <AcupointDetailModal
          point={point}
          meridian={meridian}
          effect={effect}
          location={location || ''}
          technique={technique}
          precautions={precautions}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

interface AcupointDetailModalProps {
  point: string;
  meridian: string;
  effect: string;
  location: string;
  technique: string;
  precautions?: string;
  onClose: () => void;
}

const AcupointDetailModal: React.FC<AcupointDetailModalProps> = ({
  point,
  meridian,
  effect,
  location,
  technique,
  precautions,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden animate-scale-in">
        {/* 头部 */}
        <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-secondary-500 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">
              📍
            </div>
            <div>
              <h3 className="text-xl font-bold">{point}</h3>
              <p className="text-sm text-white/80">{meridian}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center text-white"
          >
            ✕
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(85vh-80px)]">
          {/* 定位图示区域 */}
          <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-primary-700 mb-4">📍 定位图示</h4>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-6xl mb-4">🦶</div>
              <p className="text-stone-600 text-sm">穴位定位示意图</p>
              <p className="text-primary-600 font-medium mt-2">★ {point}</p>
            </div>
          </div>

          {/* 文字定位 */}
          <div className="bg-stone-50 rounded-xl p-4">
            <h4 className="text-lg font-semibold text-stone-700 mb-2">文字定位</h4>
            <p className="text-stone-600 leading-relaxed">{location}</p>
          </div>

          {/* 基本信息 */}
          <div className="bg-stone-50 rounded-xl p-4">
            <h4 className="text-lg font-semibold text-stone-700 mb-3">基本信息</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-stone-500">穴位名称</span>
                <p className="font-medium text-stone-800">{point}</p>
              </div>
              <div>
                <span className="text-sm text-stone-500">经络归属</span>
                <p className="font-medium text-stone-800">{meridian}</p>
              </div>
              <div className="col-span-2">
                <span className="text-sm text-stone-500">主治功效</span>
                <p className="font-medium text-stone-800">{effect}</p>
              </div>
            </div>
          </div>

          {/* 操作方法 */}
          <div className="bg-stone-50 rounded-xl p-4">
            <h4 className="text-lg font-semibold text-stone-700 mb-3">操作方法</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-3">
                <span className="text-xs text-stone-500">刺法</span>
                <p className="font-medium text-stone-800">{technique}</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <span className="text-xs text-stone-500">角度</span>
                <p className="font-medium text-stone-800">直刺（90°）</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <span className="text-xs text-stone-500">深度</span>
                <p className="font-medium text-stone-800">0.5-1寸</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <span className="text-xs text-stone-500">留针</span>
                <p className="font-medium text-stone-800">30分钟</p>
              </div>
            </div>
          </div>

          {/* 注意事项 */}
          {precautions && (
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <h4 className="text-lg font-semibold text-amber-700 mb-2">⚠️ 注意事项</h4>
              <p className="text-amber-800">{precautions}</p>
            </div>
          )}
        </div>

        {/* 底部 */}
        <div className="sticky bottom-0 bg-white border-t border-stone-200 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default AcupointCard;
