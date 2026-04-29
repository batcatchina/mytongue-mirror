import React from 'react';
import clsx from 'clsx';
import { 
  TONGUE_SHAPES, 
  TONGUE_STATES,
  COATING_COLORS,
  COATING_TEXTURES,
  MOISTURE_LEVELS
} from '@/types';

interface AIIdentifyBadgeProps {
  className?: string;
}

const AIIdentifyBadge: React.FC<AIIdentifyBadgeProps> = ({ className = '' }) => (
  <span className={clsx('text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-medium', className)}>
    AI
  </span>
);

// 舌色选项
const tongueColorOptions = [
  { value: '淡红', color: 'bg-red-100', border: 'border-red-300', text: '淡红' },
  { value: '淡白', color: 'bg-stone-100', border: 'border-stone-300', text: '淡白' },
  { value: '红', color: 'bg-red-300', border: 'border-red-400', text: '红' },
  { value: '绛', color: 'bg-red-500', border: 'border-red-600', text: '绛' },
  { value: '紫', color: 'bg-purple-400', border: 'border-purple-500', text: '紫' },
  { value: '青紫', color: 'bg-blue-400', border: 'border-blue-500', text: '青紫' },
];

interface TongueColorSelectorProps {
  value: string;
  onChange: (value: string, confidence?: number) => void;
  isAI?: boolean; // 是否由AI识别
}

export const TongueColorSelector: React.FC<TongueColorSelectorProps> = ({ value, onChange, isAI }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-stone-700">舌色</label>
        {isAI && value && <AIIdentifyBadge />}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tongueColorOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value, 0.9)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-200',
              value === option.value
                ? 'border-primary-400 bg-primary-50 shadow-sm'
                : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50'
            )}
          >
            <span className={clsx('w-3 h-3 rounded-full shrink-0', option.color)} />
            <span className={clsx(
              'text-xs font-medium',
              value === option.value ? 'text-primary-700' : 'text-stone-600'
            )}>{option.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// 舌形选择器
interface TongueShapeSelectorProps {
  value: string;
  onChange: (value: string, confidence?: number) => void;
  isAI?: boolean;
}

export const TongueShapeSelector: React.FC<TongueShapeSelectorProps> = ({ value, onChange, isAI }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-stone-700">舌形</label>
        {isAI && value && <AIIdentifyBadge />}
      </div>
      <div className="flex flex-wrap gap-2">
        {TONGUE_SHAPES.map((shape) => (
          <button
            key={shape}
            type="button"
            onClick={() => onChange(shape, 0.9)}
            className={clsx(
              'px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all duration-200',
              value === shape
                ? 'border-primary-400 bg-primary-50 text-primary-700'
                : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50'
            )}
          >
            {shape}
          </button>
        ))}
      </div>
      {/* 齿痕和裂纹 - 默认折叠 */}
      <details className="group">
        <summary className="flex items-center gap-2 text-xs text-stone-500 cursor-pointer hover:text-stone-700">
          <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span>齿痕 / 裂纹</span>
          {isAI && <AIIdentifyBadge className="ml-auto" />}
        </summary>
        <div className="flex gap-4 mt-2 pl-4">
          <label className="flex items-center gap-2 text-sm text-stone-600">
            <input type="checkbox" className="rounded border-stone-300 text-primary-500 focus:ring-primary-400" />
            齿痕
          </label>
          <label className="flex items-center gap-2 text-sm text-stone-600">
            <input type="checkbox" className="rounded border-stone-300 text-primary-500 focus:ring-primary-400" />
            裂纹
          </label>
        </div>
      </details>
    </div>
  );
};

// 舌苔选择器
interface TongueCoatingSelectorProps {
  color: string;
  texture: string;
  moisture: string;
  onColorChange: (color: string) => void;
  onTextureChange: (texture: string) => void;
  onMoistureChange: (moisture: string) => void;
  isAI?: boolean;
}

export const TongueCoatingSelector: React.FC<TongueCoatingSelectorProps> = ({
  color,
  texture,
  moisture,
  onColorChange,
  onTextureChange,
  onMoistureChange,
  isAI,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-stone-700">苔色</label>
          {isAI && color && <AIIdentifyBadge />}
        </div>
        <div className="flex flex-wrap gap-2">
          {COATING_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onColorChange(c)}
              className={clsx(
                'px-3 py-1.5 rounded-lg border text-sm transition-all duration-200',
                color === c
                  ? 'border-primary-400 bg-primary-50 text-primary-700'
                  : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-stone-700">苔质</label>
            {isAI && texture && <AIIdentifyBadge className="text-xs" />}
          </div>
          <select
            value={texture}
            onChange={(e) => onTextureChange(e.target.value)}
            className="tcm-select text-sm"
          >
            <option value="">请选择</option>
            {COATING_TEXTURES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-stone-700">润燥</label>
            {isAI && moisture && <AIIdentifyBadge className="text-xs" />}
          </div>
          <select
            value={moisture}
            onChange={(e) => onMoistureChange(e.target.value)}
            className="tcm-select text-sm"
          >
            <option value="">请选择</option>
            {MOISTURE_LEVELS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

// 舌体凹凸形态类型
export interface TongueShapeValue {
  depression: string[]; // 凹陷区域
  bulge: string[];      // 鼓胀区域
}

interface TongueStateSelectorProps {
  value: string;
  onChange: (value: string, degree?: string) => void;
  shapeValue?: TongueShapeValue;
  onShapeChange?: (value: TongueShapeValue) => void;
  isAI?: boolean;
}

const SHAPE_PARTS = [
  { key: 'tip', label: '舌尖' },
  { key: 'middle', label: '舌中' },
  { key: 'sides', label: '舌边' },
  { key: 'root', label: '舌根' },
];

export const TongueStateSelector: React.FC<TongueStateSelectorProps> = ({ 
  value, 
  onChange,
  shapeValue = { depression: [], bulge: [] },
  onShapeChange,
  isAI,
}) => {
  // 切换凹陷
  const toggleDepression = (part: string) => {
    const newDepression = shapeValue.depression.includes(part)
      ? shapeValue.depression.filter(p => p !== part)
      : [...shapeValue.depression, part];
    onShapeChange?.({ ...shapeValue, depression: newDepression });
  };

  // 切换鼓胀
  const toggleBulge = (part: string) => {
    const newBulge = shapeValue.bulge.includes(part)
      ? shapeValue.bulge.filter(p => p !== part)
      : [...shapeValue.bulge, part];
    onShapeChange?.({ ...shapeValue, bulge: newBulge });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-stone-700">舌态</label>
        {isAI && value && <AIIdentifyBadge />}
      </div>
      <div className="flex flex-wrap gap-2">
        {TONGUE_STATES.map((state) => (
          <button
            key={state}
            type="button"
            onClick={() => onChange(state)}
            className={clsx(
              'px-3 py-1.5 rounded-lg border text-sm transition-all duration-200',
              value === state
                ? 'border-primary-400 bg-primary-50 text-primary-700'
                : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50'
            )}
          >
            {state}
          </button>
        ))}
      </div>
      
      {/* 瘀斑、水滑 - 折叠 */}
      <details className="group">
        <summary className="flex items-center gap-2 text-xs text-stone-500 cursor-pointer hover:text-stone-700">
          <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span>瘀斑 / 水滑</span>
        </summary>
        <div className="flex gap-4 mt-2 pl-4">
          <label className="flex items-center gap-2 text-sm text-stone-600">
            <input type="checkbox" className="rounded border-stone-300 text-primary-500 focus:ring-primary-400" />
            瘀斑
          </label>
          <label className="flex items-center gap-2 text-sm text-stone-600">
            <input type="checkbox" className="rounded border-stone-300 text-primary-500 focus:ring-primary-400" />
            水滑
          </label>
        </div>
      </details>

      {/* 凹凸形态 - 折叠 */}
      <details className="group">
        <summary className="flex items-center gap-2 text-xs text-stone-500 cursor-pointer hover:text-stone-700">
          <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span>舌体凹凸</span>
          {isAI && <AIIdentifyBadge className="ml-auto" />}
        </summary>
        
        <div className="space-y-3 pt-2 pl-4">
          {/* 凹陷 */}
          <div className="space-y-1.5">
            <span className="text-xs text-stone-500">凹陷</span>
            <div className="flex flex-wrap gap-1.5">
              {SHAPE_PARTS.map(({ key, label }) => (
                <button
                  key={`depression-${key}`}
                  type="button"
                  onClick={() => toggleDepression(key)}
                  className={clsx(
                    'px-2.5 py-1 rounded-full text-xs transition-all',
                    shapeValue.depression.includes(key)
                      ? 'bg-blue-500 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  )}
                >
                  {label}凹陷
                </button>
              ))}
              <button
                type="button"
                onClick={() => onShapeChange?.({ ...shapeValue, depression: [] })}
                className={clsx(
                  'px-2.5 py-1 rounded-full text-xs transition-all',
                  shapeValue.depression.length === 0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                )}
              >
                正常
              </button>
            </div>
          </div>

          {/* 鼓胀 */}
          <div className="space-y-1.5">
            <span className="text-xs text-stone-500">鼓胀</span>
            <div className="flex flex-wrap gap-1.5">
              {SHAPE_PARTS.map(({ key, label }) => (
                <button
                  key={`bulge-${key}`}
                  type="button"
                  onClick={() => toggleBulge(key)}
                  className={clsx(
                    'px-2.5 py-1 rounded-full text-xs transition-all',
                    shapeValue.bulge.includes(key)
                      ? 'bg-orange-500 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  )}
                >
                  {label}鼓胀
                </button>
              ))}
              <button
                type="button"
                onClick={() => onShapeChange?.({ ...shapeValue, bulge: [] })}
                className={clsx(
                  'px-2.5 py-1 rounded-full text-xs transition-all',
                  shapeValue.bulge.length === 0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                )}
              >
                正常
              </button>
            </div>
          </div>
        </div>
      </details>
    </div>
  );
};

// 导出组件
export const TongueFeatureSelectors = {
  TongueColorSelector,
  TongueShapeSelector,
  TongueCoatingSelector,
  TongueStateSelector,
};

// 重新导出ImageUpload和TongueColorDistribution
export { ImageUpload } from './ImageUpload';
export { TongueColorDistribution } from './TongueColorDistribution';
