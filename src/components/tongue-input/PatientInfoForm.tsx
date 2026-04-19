import React from 'react';
import clsx from 'clsx';
import type { PatientInfo } from '@/types';

interface PatientInfoFormProps {
  patientInfo: PatientInfo;
  onChange: (info: Partial<PatientInfo>) => void;
}

export const PatientInfoForm: React.FC<PatientInfoFormProps> = ({
  patientInfo,
  onChange,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="tcm-section-title">患者信息</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {/* 姓名 */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">姓名</label>
          <input
            type="text"
            value={patientInfo.age || ''}
            onChange={(e) => onChange({ age: parseInt(e.target.value) || 0 })}
            placeholder="年龄"
            className="tcm-input"
          />
        </div>
        
        {/* 性别 */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">性别</label>
          <div className="flex gap-3">
            {(['男', '女', '其他'] as const).map((gender) => (
              <label
                key={gender}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all',
                  patientInfo.gender === gender
                    ? 'border-primary-400 bg-primary-50 text-primary-700'
                    : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                )}
              >
                <input
                  type="radio"
                  name="gender"
                  value={gender}
                  checked={patientInfo.gender === gender}
                  onChange={() => onChange({ gender })}
                  className="sr-only"
                />
                <span className="text-sm font-medium">{gender}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* 主诉 */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">
          主诉 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={patientInfo.chiefComplaint}
          onChange={(e) => onChange({ chiefComplaint: e.target.value })}
          placeholder="请描述患者主要不适症状"
          rows={2}
          className="tcm-input resize-none"
        />
      </div>

      {/* 病史 */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">病史</label>
        <textarea
          value={patientInfo.medicalHistory || ''}
          onChange={(e) => onChange({ medicalHistory: e.target.value })}
          placeholder="请描述相关疾病历史"
          rows={2}
          className="tcm-input resize-none"
        />
      </div>

      {/* 可选信息 */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer text-sm text-stone-500 hover:text-stone-700">
          <span>更多患者信息（可选）</span>
          <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">体质</label>
              <select
                value={patientInfo.constitution || ''}
                onChange={(e) => onChange({ constitution: e.target.value })}
                className="tcm-select text-sm"
              >
                <option value="">请选择</option>
                <option value="平和质">平和质</option>
                <option value="气虚质">气虚质</option>
                <option value="阳虚质">阳虚质</option>
                <option value="阴虚质">阴虚质</option>
                <option value="痰湿质">痰湿质</option>
                <option value="湿热质">湿热质</option>
                <option value="血瘀质">血瘀质</option>
                <option value="气郁质">气郁质</option>
                <option value="特禀质">特禀质</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">过敏史</label>
              <input
                type="text"
                value={patientInfo.allergyHistory || ''}
                onChange={(e) => onChange({ allergyHistory: e.target.value })}
                placeholder="如有请填写"
                className="tcm-input text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">用药史</label>
            <input
              type="text"
              value={patientInfo.medicationHistory || ''}
              onChange={(e) => onChange({ medicationHistory: e.target.value })}
              placeholder="当前或近期用药情况"
              className="tcm-input text-sm"
            />
          </div>
        </div>
      </details>
    </div>
  );
};

export default PatientInfoForm;
