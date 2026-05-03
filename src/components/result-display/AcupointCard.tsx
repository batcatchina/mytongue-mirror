import React, { useState } from 'react';
import clsx from 'clsx';
import { getAcupointInfo } from '@/services/acupoint_data';

interface AcupointCardProps {
  point: string;
  meridian?: string;
  effect?: string;
  location?: string;
  technique?: string;
  precautions?: string;
  isMain?: boolean;
  color?: 'green' | 'blue';
}

export const AcupointCard: React.FC<AcupointCardProps> = ({
  point,
  meridian: propMeridian,
  effect: propEffect,
  location: propLocation,
  technique: propTechnique,
  precautions,
  color = 'green',
}) => {
  const [showModal, setShowModal] = useState(false);

  // 从数据源获取完整穴位信息，prop 作为 fallback
  const info = getAcupointInfo(point);
  const meridian = propMeridian || info.meridian;
  const effect = propEffect || info.effect;
  const location = propLocation || info.location;
  const technique = propTechnique || '常规针刺';
  const indications = info.indications;

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
          location={location}
          technique={technique}
          indications={indications}
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
  indications: string;
  precautions?: string;
  onClose: () => void;
}

const AcupointDetailModal: React.FC<AcupointDetailModalProps> = ({
  point,
  meridian,
  effect,
  location,
  technique,
  indications,
  precautions,
  onClose,
}) => {
  // 从数据源获取完整穴位信息作为备用
  const info = getAcupointInfo(point);
  const finalMeridian = meridian || info.meridian;
  const finalEffect = effect || info.effect;
  const finalLocation = location || info.location;
  const finalIndications = indications || info.indications;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden animate-scale-in">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">
              📍
            </div>
            <div>
              <h3 className="text-lg font-bold">{point}</h3>
              <p className="text-sm text-white/80">{finalMeridian}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center text-white text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* 内容 - 紧凑布局 */}
        <div className="p-4 space-y-3 max-h-[calc(90vh-140px)] overflow-y-auto">
          {/* 定位与基本信息合并 */}
          <div className="bg-stone-50 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-stone-700 mb-2">📍 定位与主治</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-stone-600">定位：</span>
                <span className="text-stone-600">{finalLocation}</span>
              </div>
              <div>
                <span className="font-medium text-stone-600">功效：</span>
                <span className="text-stone-600">{finalEffect}</span>
              </div>
              <div>
                <span className="font-medium text-primary-600">主治：</span>
                <span className="text-stone-600">{finalIndications}</span>
              </div>
            </div>
          </div>

          {/* 操作方法 */}
          <div className="bg-stone-50 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-stone-700 mb-2">💉 操作方法</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-stone-600">刺法：</span>
                <span className="text-stone-600">{technique}</span>
              </div>
              <div>
                <span className="font-medium text-stone-600">角度：</span>
                <span className="text-stone-600">直刺或斜刺</span>
              </div>
              <div>
                <span className="font-medium text-stone-600">深度：</span>
                <span className="text-stone-600">0.5-1寸</span>
              </div>
              <div>
                <span className="font-medium text-stone-600">留针：</span>
                <span className="text-stone-600">15-30分钟</span>
              </div>
            </div>
          </div>

          {/* 注意事项 */}
          {precautions && (
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
              <h4 className="text-sm font-semibold text-amber-700 mb-2">⚠️ 注意事项</h4>
              <p className="text-sm text-amber-600">{precautions}</p>
            </div>
          )}

          {/* 底部关闭按钮 */}
          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 font-medium text-sm transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcupointCard;
