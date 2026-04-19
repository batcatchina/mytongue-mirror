import React from 'react';
import clsx from 'clsx';
import { 
  TONGUE_COLORS, 
  TONGUE_SHAPES, 
  TONGUE_STATES,
  COATING_COLORS,
  COATING_TEXTURES,
  MOISTURE_LEVELS,
  TONGUE_PARTS,
  DEGREE_LEVELS
} from '@/types';
 
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
}

export const TongueColorSelector: React.FC<TongueColorSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-stone-700">舌色</label>
      <div className="grid grid-cols-3 gap-2">
        {tongueColorOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value, 0.9)}
            className={clsx(
              'flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200',
              value === option.value
                ? `${option.border} ${option.color} ring-2 ring-primary-300`
                : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50'
            )}
          >
            <span className={clsx('w-8 h-8 rounded-full', option.color)} />
            <span className="mt-1 text-sm font-medium text-stone-700">{option.text}</span>
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
}

export const TongueShapeSelector: React.FC<TongueShapeSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-stone-700">舌形</label>
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
      {/* 齿痕和裂纹 */}
      <div className="flex gap-4 mt-3">
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input type="checkbox" className="rounded border-stone-300 text-primary-500 focus:ring-primary-400" />
          齿痕
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input type="checkbox" className="rounded border-stone-300 text-primary-500 focus:ring-primary-400" />
          裂纹
        </label>
      </div>
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
}

export const TongueCoatingSelector: React.FC<TongueCoatingSelectorProps> = ({
  color,
  texture,
  moisture,
  onColorChange,
  onTextureChange,
  onMoistureChange,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">苔色</label>
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
          <label className="block text-sm font-medium text-stone-700 mb-2">苔质</label>
          <select
            value={texture}
            onChange={(e) => onTextureChange(e.target.value)}
            className="tcm-select"
          >
            <option value="">请选择</option>
            {COATING_TEXTURES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">润燥</label>
          <select
            value={moisture}
            onChange={(e) => onMoistureChange(e.target.value)}
            className="tcm-select"
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

// 舌态选择器
interface TongueStateSelectorProps {
  value: string;
  onChange: (value: string, degree?: string) => void;
}

export const TongueStateSelector: React.FC<TongueStateSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-stone-700">舌态</label>
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
      {/* 瘀斑 */}
      <div className="flex gap-4 mt-2">
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input type="checkbox" className="rounded border-stone-300 text-primary-500 focus:ring-primary-400" />
          瘀斑
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input type="checkbox" className="rounded border-stone-300 text-primary-500 focus:ring-primary-400" />
          水滑
        </label>
      </div>
    </div>
  );
};

// 导出所有组件
export {
  TongueColorSelector,
  TongueShapeSelector,
  TongueCoatingSelector,
  TongueStateSelector,
};

// 重新导出 ImageUpload 和 TongueColorDistribution
export { ImageUpload } from './ImageUpload';
export { TongueColorDistribution } from './TongueColorDistribution';
