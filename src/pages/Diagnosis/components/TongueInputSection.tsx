/**
 * 舌象输入区组件
 * 包含舌象采集、特征选择、提交诊断等功能
 */
import React from 'react';
import { useDiagnosisStore } from '@/stores/diagnosisStore';
import { TONGUE_CATEGORY_COLORS, getStructuredTongueDisplay } from '@/pages/Diagnosis/DiagnosisPage';
import {
  TongueColorSelector,
  TongueShapeSelector,
  TongueCoatingSelector,
  TongueStateSelector,
  TongueColorDistribution,
} from '@/components/tongue-input/TongueFeatureSelectors';
import ImageUpload from '@/components/tongue-input/ImageUpload';
import DiagnosisProgress from '@/components/diagnosis/DiagnosisProgress';
import { DiagnosisStep } from '@/services/DiagnosisService';
import toast from 'react-hot-toast';

interface TongueInputSectionProps {
  isAnalyzing: boolean;
  currentStep: DiagnosisStep;
  isAIRecognized: boolean;
  useLocalEngine: boolean;
  onRecognize: (imageData: string) => void;
  onFallbackToLocal: () => void;
}

export default function TongueInputSection({
  isAnalyzing,
  currentStep,
  isAIRecognized,
  useLocalEngine,
  onRecognize,
  onFallbackToLocal,
}: TongueInputSectionProps) {
  const {
    inputFeatures,
    patientInfo,
    setImageData,
    setTongueColor,
    setTongueShape,
    setTongueState,
    setCoating,
    setCrack,
    setTeethMark,
    setDistributionFeatures,
    setShapeDistribution,
    setPatientInfo,
    resetInput,
  } = useDiagnosisStore();

  // 年龄输入状态（直接使用 patientInfo.age，默认30）
  const [ageInput, setAgeInput] = React.useState<string>(
    patientInfo.age !== null ? String(patientInfo.age) : '30'
  );
  const [showEngineSwitch, setShowEngineSwitch] = React.useState(false);

  // 清空输入
  const handleReset = () => {
    resetInput();
    setAgeInput('30');
    toast.success('已清空所有输入');
  };

  return (
    <div className="space-y-4">
      {/* ========== 性别 + 年龄输入 - 紧凑一行 ==========*/}
      <div className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-stone-100">
        {/* 性别选择 */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-stone-500">性别</span>
          <div className="flex gap-1">
            {(['男', '女'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setPatientInfo({ gender: g })}
                className={`
                  px-2.5 py-1 text-xs font-medium rounded-full transition-all
                  ${patientInfo.gender === g
                    ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }
                `}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
        
        {/* 分隔线 */}
        <div className="w-px h-5 bg-stone-200"></div>
        
        {/* 年龄数字输入 */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-stone-500">年龄</span>
          <input
            type="number"
            min="1"
            max="120"
            value={ageInput}
            onChange={(e) => {
              const val = e.target.value;
              setAgeInput(val);
              const numVal = parseInt(val, 10);
              setPatientInfo({ age: isNaN(numVal) ? 30 : numVal });
            }}
            onBlur={(e) => {
              const numVal = parseInt(e.target.value, 10);
              if (isNaN(numVal) || numVal < 1) setAgeInput('30');
              else if (numVal > 120) setAgeInput('120');
            }}
            className="w-14 px-2 py-1 text-xs text-center border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400"
            placeholder="30"
          />
          <span className="text-xs text-stone-400">岁</span>
        </div>
      </div>

      {/* ========== 舌象采集卡片 ========== */}
      <div className="tcm-card p-4 bg-gradient-to-br from-primary-50 to-secondary-50 border-2 border-primary-200">
        <ImageUpload 
          onChange={(imageData) => setImageData(imageData)} 
          onRecognize={onRecognize}
          useLocalEngine={useLocalEngine}
        />
        
        {/* 引擎切换按钮 */}
        <div className="mt-3 pt-3 border-t border-primary-100">
          <button
            onClick={() => setShowEngineSwitch(!showEngineSwitch)}
            className="flex items-center gap-2 text-xs text-stone-500 hover:text-stone-700 transition-colors"
          >
            <span className="text-sm">⚙️</span>
            <span>{showEngineSwitch ? '收起' : '切换辨证引擎'}</span>
            <svg className={`w-3 h-3 transition-transform ${showEngineSwitch ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showEngineSwitch && (
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => onFallbackToLocal()}
                className={`flex-1 px-3 py-2 text-xs rounded-lg transition-colors ${
                  useLocalEngine
                    ? 'bg-primary-500 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                本地规则引擎{useLocalEngine ? ' ✓' : ''}
              </button>
              <button
                onClick={() => {}}
                className={`flex-1 px-3 py-2 text-xs rounded-lg transition-colors ${
                  !useLocalEngine
                    ? 'bg-secondary-500 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                AI Bot推理{!useLocalEngine ? ' ✓' : ''}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========== 识别结果展示 ========== */}
      <div className="tcm-card p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-medium text-stone-700 flex items-center gap-2">
            <span>🔍</span> 识别结果
            {isAIRecognized && (
              <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">AI</span>
            )}
          </h2>
          <button 
            onClick={() => {
              const el = document.getElementById('feature-edit');
              if (el) el.classList.toggle('hidden');
            }}
            className="text-xs text-stone-400 hover:text-stone-600"
          >
            修改
          </button>
        </div>

        {/* 结构化展示 */}
        <div className="space-y-2">
          <div className="text-xs text-stone-600 bg-stone-50 rounded-lg p-2 px-3 font-mono leading-relaxed">
            {(() => {
              const display = getStructuredTongueDisplay(inputFeatures, isAIRecognized, inputFeatures.aiConfidence || 0.8);
              return display.rawText ? <span>{display.rawText}</span> : <span className="text-stone-400">未识别</span>;
            })()}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {(() => {
              const display = getStructuredTongueDisplay(inputFeatures, isAIRecognized, inputFeatures.aiConfidence || 0.8);
              if (display.categories?.length ?? 0 === 0) return null;
              return display.categories.map((cat, catIdx) => (
                <div key={catIdx} className="flex items-center gap-1.5">
                  <span className="text-xs text-stone-400">{cat.label}:</span>
                  {cat.items.map((item, itemIdx) => {
                    const colors = TONGUE_CATEGORY_COLORS[item.category] || TONGUE_CATEGORY_COLORS.special;
                    return (
                      <span key={itemIdx} className={`px-2 py-0.5 text-xs rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>
                        {item.name}
                      </span>
                    );
                  })}
                </div>
              ));
            })()}
          </div>
        </div>

        {/* 特征编辑区 */}
        <div id="feature-edit" className="hidden mt-3 pt-3 border-t border-stone-200 space-y-1">
          {/* 舌色 */}
          <details className="group" open={!inputFeatures.tongueColor.value}>
            <summary className="flex items-center justify-between cursor-pointer text-sm text-stone-600 hover:text-stone-800 py-1">
              <span>舌色</span>
              <div className="flex items-center gap-2">
                {inputFeatures.tongueColor.value && <span className="text-xs text-stone-400">{inputFeatures.tongueColor.value}</span>}
                <svg className="w-3.5 h-3.5 text-stone-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </summary>
            <div className="mt-2"><TongueColorSelector value={inputFeatures.tongueColor.value} onChange={setTongueColor} /></div>
          </details>

          {/* 舌苔 */}
          <details className="group" open={!inputFeatures.coating.color}>
            <summary className="flex items-center justify-between cursor-pointer text-sm text-stone-600 hover:text-stone-800 py-1">
              <span>舌苔</span>
              <div className="flex items-center gap-2">
                {inputFeatures.coating.color && <span className="text-xs text-stone-400">{[inputFeatures.coating.color, inputFeatures.coating.texture, inputFeatures.coating.moisture].filter(Boolean).join('·')}</span>}
                <svg className="w-3.5 h-3.5 text-stone-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </summary>
            <div className="mt-2">
              <TongueCoatingSelector
                color={inputFeatures.coating.color} texture={inputFeatures.coating.texture} moisture={inputFeatures.coating.moisture}
                onColorChange={(c) => setCoating(c, inputFeatures.coating.texture, inputFeatures.coating.moisture)}
                onTextureChange={(t) => setCoating(inputFeatures.coating.color, t, inputFeatures.coating.moisture)}
                onMoistureChange={(m) => setCoating(inputFeatures.coating.color, inputFeatures.coating.texture, m)}
              />
            </div>
          </details>

          {/* 舌形 */}
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer text-sm text-stone-600 hover:text-stone-800 py-1">
              <span>舌形</span>
              <div className="flex items-center gap-2">
                {inputFeatures.tongueShape.value && <span className="text-xs text-stone-400">{inputFeatures.tongueShape.value}</span>}
                <svg className="w-3.5 h-3.5 text-stone-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </summary>
            <div className="mt-2">
              <TongueShapeSelector 
                value={inputFeatures.tongueShape.value} 
                onChange={setTongueShape} 
                teethMark={inputFeatures.teethMark?.value === '是'} 
                crack={inputFeatures.crack?.value === '是'} 
                onTeethMarkChange={(checked) => {
                  if (checked) {
                    setTeethMark('是');
                  } else {
                    setTeethMark('否');
                    const currentShape = inputFeatures.shapeDistribution || { depression: [], bulge: [] };
                    const newDepression = currentShape.depression.filter(d => d !== '齿痕');
                    if (newDepression.length !== currentShape.depression?.length ?? 0) {
                      setShapeDistribution({ ...currentShape, depression: newDepression });
                    }
                  }
                }} 
                onCrackChange={(checked) => {
                  if (checked) {
                    setCrack('是');
                  } else {
                    setCrack('否');
                    const currentShape = inputFeatures.shapeDistribution || { depression: [], bulge: [] };
                    const newDepression = currentShape.depression.filter(d => d !== '裂纹');
                    if (newDepression.length !== currentShape.depression?.length ?? 0) {
                      setShapeDistribution({ ...currentShape, depression: newDepression });
                    }
                  }
                }} 
              />
            </div>
          </details>

          {/* 舌态 */}
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer text-sm text-stone-600 hover:text-stone-800 py-1">
              <span>舌态</span>
              <div className="flex items-center gap-2">
                {inputFeatures.tongueState.value && <span className="text-xs text-stone-400">{inputFeatures.tongueState.value}</span>}
                <svg className="w-3.5 h-3.5 text-stone-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </summary>
            <div className="mt-2"><TongueStateSelector value={inputFeatures.tongueState.value} onChange={setTongueState} shapeValue={inputFeatures.shapeDistribution} onShapeChange={setShapeDistribution} /></div>
          </details>

          {/* 区域诊断 */}
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer text-sm text-stone-600 hover:text-stone-800 py-1">
              <span>区域诊断</span>
              <svg className="w-3.5 h-3.5 text-stone-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </summary>
            <div className="mt-2"><TongueColorDistribution onChange={setDistributionFeatures} /></div>
          </details>
        </div>
      </div>

      {/* 主诉输入 */}
      <div className="p-4 bg-white rounded-xl shadow-sm border border-stone-100">
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-500">主诉</span>
          <span className="text-xs text-stone-400">(选填，不填不影响辨证)</span>
        </div>
        <input
          type="text"
          value={patientInfo.chiefComplaint}
          onChange={(e) => setPatientInfo({ chiefComplaint: e.target.value })}
          placeholder="简单描述主要不适，如：头痛、胃胀..."
          className="mt-2 w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all"
        />
      </div>

      {/* 进度显示 */}
      {isAnalyzing && (
        <DiagnosisProgress 
          currentStep={currentStep}
          isLocalEngine={useLocalEngine}
          onFallbackToLocal={onFallbackToLocal}
        />
      )}

      {/* 清空按钮 */}
      <button
        onClick={handleReset}
        className="w-full py-2.5 rounded-xl text-sm text-stone-500 hover:text-stone-700 hover:bg-stone-100 transition-colors"
      >
        清空重填
      </button>
    </div>
  );
}
