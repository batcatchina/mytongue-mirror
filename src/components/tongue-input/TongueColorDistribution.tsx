import React, { useState } from 'react';
import clsx from 'clsx';
import { TONGUE_PARTS, DEGREE_LEVELS } from '@/types';

interface TongueColorDistributionProps {
  onChange: (distribution: TongueColorDistribution[]) => void;
}

export interface TongueColorDistribution {
  part: string;
  feature: string;
  degree: string;
}

const FEATURE_OPTIONS = ['红点', '瘀斑', '齿痕', '裂纹', '齿痕裂纹'];

export const TongueColorDistribution: React.FC<TongueColorDistributionProps> = ({ onChange }) => {
  const [distributions, setDistributions] = useState<TongueColorDistribution[]>([]);
  const [newDist, setNewDist] = useState({
    part: TONGUE_PARTS[0],
    feature: FEATURE_OPTIONS[0],
    degree: DEGREE_LEVELS[2],
  });

  const handleAdd = () => {
    const updated = [...distributions, newDist];
    setDistributions(updated);
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    const updated = distributions.filter((_, i) => i !== index);
    setDistributions(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-stone-700">
        舌色分布特征 (可选)
      </label>
      
      {/* 添加新的分布特征 */}
      <div className="flex flex-wrap gap-2 p-3 bg-stone-50 rounded-lg">
        <select
          value={newDist.part}
          onChange={(e) => setNewDist({ ...newDist, part: e.target.value })}
          className="tcm-select flex-1 min-w-[100px]"
        >
          {TONGUE_PARTS.map((part) => (
            <option key={part} value={part}>{part}</option>
          ))}
        </select>
        <select
          value={newDist.feature}
          onChange={(e) => setNewDist({ ...newDist, feature: e.target.value })}
          className="tcm-select flex-1 min-w-[100px]"
        >
          {FEATURE_OPTIONS.map((feature) => (
            <option key={feature} value={feature}>{feature}</option>
          ))}
        </select>
        <select
          value={newDist.degree}
          onChange={(e) => setNewDist({ ...newDist, degree: e.target.value })}
          className="tcm-select flex-1 min-w-[80px]"
        >
          {DEGREE_LEVELS.map((degree) => (
            <option key={degree} value={degree}>{degree}</option>
          ))}
        </select>
        <button
          onClick={handleAdd}
          className="px-3 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors flex items-center gap-1"
        >
          <span>+</span> 添加
        </button>
      </div>

      {/* 已添加的分布特征列表 */}
      {distributions.length > 0 && (
        <div className="space-y-2">
          {distributions.map((dist, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-primary-50 rounded-lg border border-primary-100"
            >
              <div className="flex items-center gap-3 text-sm">
                <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded">
                  {dist.part}
                </span>
                <span className="text-stone-600">{dist.feature}</span>
                <span className="text-stone-400">|</span>
                <span className={clsx(
                  'px-2 py-0.5 rounded text-xs',
                  dist.degree === '严重' && 'bg-red-100 text-red-700',
                  dist.degree === '明显' && 'bg-orange-100 text-orange-700',
                  dist.degree === '中等' && 'bg-yellow-100 text-yellow-700',
                  dist.degree === '轻微' && 'bg-stone-100 text-stone-600'
                )}>
                  {dist.degree}
                </span>
              </div>
              <button
                onClick={() => handleRemove(index)}
                className="text-stone-400 hover:text-red-500 transition-colors p-1"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TongueColorDistribution;
