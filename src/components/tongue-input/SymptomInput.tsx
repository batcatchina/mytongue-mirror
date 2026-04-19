import React from 'react';
import clsx from 'clsx';
import { COMMON_SYMPTOMS, FREQUENCY_LEVELS, DEGREE_LEVELS } from '@/types';
import type { Symptom } from '@/types';

interface SymptomInputProps {
  symptoms: Symptom[];
  onAdd: (symptom: Symptom) => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, symptom: Partial<Symptom>) => void;
}

export const SymptomInput: React.FC<SymptomInputProps> = ({
  symptoms,
  onAdd,
  onRemove,
  onUpdate,
}) => {
  const [isAdding, setIsAdding] = React.useState(false);
  const [newSymptom, setNewSymptom] = React.useState('');

  const handleAdd = () => {
    if (newSymptom.trim()) {
      onAdd({ symptom: newSymptom.trim() });
      setNewSymptom('');
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-stone-700">伴随症状</label>
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          添加症状
        </button>
      </div>

      {/* 添加症状表单 */}
      {isAdding && (
        <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 animate-in">
          <div className="space-y-2">
            {/* 常用症状快捷选择 */}
            <div className="flex flex-wrap gap-1.5">
              {COMMON_SYMPTOMS.slice(0, 8).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setNewSymptom(s)}
                  className={clsx(
                    'px-2 py-1 text-xs rounded-full transition-colors',
                    newSymptom === s
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            
            <input
              type="text"
              value={newSymptom}
              onChange={(e) => setNewSymptom(e.target.value)}
              placeholder="输入症状名称"
              className="tcm-input text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="tcm-btn-secondary text-sm"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleAdd}
                className="tcm-btn-primary text-sm"
              >
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 症状列表 */}
      {symptoms.length > 0 ? (
        <div className="space-y-2">
          {symptoms.map((symptom, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-white rounded-lg border border-stone-200 hover:border-stone-300 transition-colors"
            >
              <div className="flex-1">
                <div className="font-medium text-stone-700">{symptom.symptom}</div>
                {(symptom.degree || symptom.frequency) && (
                  <div className="flex gap-2 mt-1 text-xs text-stone-500">
                    {symptom.degree && <span className="tcm-tag-primary">{symptom.degree}</span>}
                    {symptom.frequency && <span className="tcm-tag">{symptom.frequency}</span>}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="p-1 text-stone-400 hover:text-red-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state py-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm">暂无伴随症状</p>
        </div>
      )}
    </div>
  );
};

export default SymptomInput;
