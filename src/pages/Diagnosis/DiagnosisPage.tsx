import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import NavBar from '@/components/common/NavBar';
import { PaidDiagnosisSection } from '@/components/paywall/PaidDiagnosisSection';
import {
  TongueColorSelector,
  TongueShapeSelector,
  TongueCoatingSelector,
  TongueStateSelector,
  TongueColorDistribution,
} from '@/components/tongue-input/TongueFeatureSelectors';
import ImageUpload from '@/components/tongue-input/ImageUpload';
import DiagnosisResultDisplay from '@/components/result-display/DiagnosisResultDisplay';
import AcupunctureDisplay from '@/components/result-display/AcupunctureDisplay';
import LifeCareDisplay from '@/components/result-display/LifeCareDisplay';
import PayButton, { usePaymentStatus } from '@/components/payment/PayButton';
import InquiryDialog from '@/components/InquiryDialog';
import DiagnosisProgress from '@/components/diagnosis/DiagnosisProgress';
import { useDiagnosisStore } from '@/stores/diagnosisStore';
import { getRegionChineseName } from '@/config/tongueDisplay';
import { useDiagnosisFlow } from './hooks/useDiagnosisFlow';
import InferenceChainView from '@/components/inference/InferenceChainView';
import { DiagnosisInput, DiagnosisOutput, InputFeatures, DistributionFeature } from '@/services/diagnosisEngine';
import { COMMON_SYMPTOMS } from '@/types';
const DiagnosisPage: React.FC = () => {
  const navigate = useNavigate();
  const isUnlocked = usePaymentStatus();
  const [resultTab, setResultTab] = useState<'pathogenesis' | 'acupuncture' | 'care'>('pathogenesis');
  const [uiMode, setUiMode] = useState<'v1' | 'v2'>('v1');
  const [useLocalEngine, setUseLocalEngine] = useState(true);
  const [showEngineSwitch, setShowEngineSwitch] = useState(false);
  const [isAIRecognized, setIsAIRecognized] = useState(false);
  const [recognitionExpanded, setRecognitionExpanded] = useState(false);
  const [symptomSelectorExpanded, setSymptomSelectorExpanded] = useState(false);
  const [inferenceChain, setInferenceChain] = useState<any>(null);
  const [customSymptomInput, setCustomSymptomInput] = useState('');
  
  // 年龄组选项
  const ageGroups = [
    { label: '30以下', value: 25 },
    { label: '30-50', value: 40 },
    { label: '50-65', value: 57 },
    { label: '65以上', value: 72 },
  ] as const;

  const {
    inputFeatures,
    patientInfo,
    currentSymptoms,
    saveCase,
    setInputFeatures,
    setPatientInfo,
    setCurrentSymptoms,
    setTongueImage,
  } = useDiagnosisStore();

  const {
    diagnosisResult,
    currentStep,
    isAnalyzing,
    showRefineButton,
    isRefiningDiagnosis,
    showInquiry,
    isLoadingInquiry,
    isSubmittingInquiry,
    inquiryQuestions,
    inquiryConversationId,
    preliminaryResult,
    handleSubmit,
    handleRefineDiagnosis,
    handleInquirySubmit,
    cancelInquiry,
  } = useDiagnosisFlow({ inputFeatures, patientInfo });

  
  const structuredDisplay = getStructuredTongueDisplay(inputFeatures, isAIRecognized);
  const selectedSymptoms = useMemo(
    () => (currentSymptoms || '').split(/[，,、\s]+/).map((s) => s.trim()).filter(Boolean),
    [currentSymptoms]
  );
  const commonSymptoms = COMMON_SYMPTOMS.slice(0, 6);

  const updateSelectedSymptoms = (nextSymptoms: string[]) => {
    const normalized = Array.from(new Set(nextSymptoms.map((item) => item.trim()).filter(Boolean)));
    setCurrentSymptoms(normalized.join('、'));
  };

  const toggleSymptom = (symptom: string) => {
    if (selectedSymptoms.includes(symptom)) {
      updateSelectedSymptoms(selectedSymptoms.filter((item) => item !== symptom));
      return;
    }
    updateSelectedSymptoms([...selectedSymptoms, symptom]);
  };

  const addCustomSymptom = () => {
    const value = customSymptomInput.trim();
    if (!value || selectedSymptoms.includes(value)) {
      setCustomSymptomInput('');
      return;
    }
    updateSelectedSymptoms([...selectedSymptoms, value]);
    setCustomSymptomInput('');
  };

  const handleSaveCase = () => {
    if (diagnosisResult) {
      saveCase(diagnosisResult);
      toast.success('病例已保存');
    }
  };

  

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50">
      <Toaster position="top-center" />
      <NavBar title="舌镜辨证" onBack={() => navigate('/')} />

      <main className="max-w-6xl mx-auto px-4 py-4 md:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <div className="space-y-4">
            <div className="tcm-card p-4 md:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-stone-700">舌象输入</h2>
                <button
                  onClick={() => setUiMode((prev) => (prev === 'v1' ? 'v2' : 'v1'))}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200"
                >
                  {uiMode === 'v1' ? '🔮 推理链模式' : '📋 简化模式'}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-stone-600">性别:</span>
                <select
                  className="px-2 py-1 border rounded"
                  value={patientInfo.gender || '男'}
                  onChange={(e) => setPatientInfo({ gender: e.target.value as '男' | '女' })}
                >
                  <option value="男">男</option>
                  <option value="女">女</option>
                </select>

                <span className="text-sm text-stone-600">年龄:</span>
                <input
                  type="number"
                  className="w-24 px-2 py-1 border rounded"
                  value={patientInfo.age ?? ''}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setPatientInfo({ age: raw === '' ? null : Number(raw) || 0 });
                  }}
                />
              </div>

              <div className="flex items-center justify-center gap-2 p-2 bg-stone-100 rounded-lg mb-4">
                <span className="text-xs text-stone-500">辨证引擎:</span>
                <button onClick={() => setUseLocalEngine(true)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${useLocalEngine ? 'bg-green-500 text-white shadow-lg' : 'bg-stone-200 text-stone-500'}`}>
                  🟢 本地引擎
                </button>
                <button onClick={() => setUseLocalEngine(false)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${!useLocalEngine ? 'bg-blue-500 text-white shadow-lg' : 'bg-stone-200 text-stone-500'}`}>
                  ☁️ AI推理
                </button>
              </div>

              <ImageUpload
                onFeaturesExtracted={(features, imageData) => {
                  setInputFeatures(features);
                  setTongueImage(imageData || null);
                }}
              />



              {recognitionExpanded ? (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setRecognitionExpanded(false)}
                    className="w-full flex items-center justify-between text-sm text-stone-600 px-3 py-2 rounded-lg bg-stone-50 border border-stone-200"
                  >
                    <span>舌象特征选择区</span>
                    <span>▲</span>
                  </button>
                  <TongueColorSelector value={inputFeatures.tongueColor.value} onChange={(value) => setInputFeatures({ ...inputFeatures, tongueColor: { value } as any })} />
                  <TongueShapeSelector
                    value={inputFeatures.tongueShape.value}
                    onChange={(value) => setInputFeatures({ ...inputFeatures, tongueShape: { value } as any })}
                    teethMark={inputFeatures.teethMark?.value === '是'}
                    crack={inputFeatures.crack?.value === '是'}
                    onTeethMarkChange={(checked) => setInputFeatures({ ...inputFeatures, teethMark: { value: checked ? '是' : '否' } as any })}
                    onCrackChange={(checked) => setInputFeatures({ ...inputFeatures, crack: { value: checked ? '是' : '否' } as any })}
                  />
                  <TongueStateSelector
                    value={inputFeatures.tongueState.value}
                    onChange={(value) => setInputFeatures({ ...inputFeatures, tongueState: { value } as any })}
                    shapeValue={inputFeatures.shapeDistribution || { depression: [], bulge: [] }}
                    onShapeChange={(shapeValue) => setInputFeatures({ ...inputFeatures, shapeDistribution: shapeValue })}
                    ecchymosis={inputFeatures.ecchymosis?.value === '是'}
                    tongueSurface={inputFeatures.tongueSurface?.value === '是'}
                    onEcchymosisChange={(checked) => setInputFeatures({ ...inputFeatures, ecchymosis: { value: checked ? '是' : '否' } as any })}
                    onTongueSurfaceChange={(checked) => setInputFeatures({ ...inputFeatures, tongueSurface: { value: checked ? '是' : '否' } as any })}
                  />
                  <TongueCoatingSelector
                    color={inputFeatures.coating.color}
                    texture={inputFeatures.coating.texture}
                    moisture={inputFeatures.coating.moisture}
                    onColorChange={(c) =>
                      setInputFeatures({
                        ...inputFeatures,
                        coating: { ...inputFeatures.coating, color: c },
                      })
                    }
                    onTextureChange={(t) =>
                      setInputFeatures({
                        ...inputFeatures,
                        coating: { ...inputFeatures.coating, texture: t },
                      })
                    }
                    onMoistureChange={(m) =>
                      setInputFeatures({
                        ...inputFeatures,
                        coating: { ...inputFeatures.coating, moisture: m },
                      })
                    }
                  />
                  <TongueColorDistribution value={inputFeatures.distributionFeatures || []} onChange={(distributionFeatures) => setInputFeatures({ ...inputFeatures, distributionFeatures })} />

                  <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-stone-600">伴随症状</span>
                      <button
                        type="button"
                        onClick={() => setSymptomSelectorExpanded((prev) => !prev)}
                        className="h-5 w-5 rounded-md border border-stone-300 text-xs text-stone-600 hover:bg-stone-100"
                        aria-label="切换伴随症状输入"
                      >
                        {symptomSelectorExpanded ? '−' : '+'}
                      </button>
                    </div>

                    {!symptomSelectorExpanded && selectedSymptoms.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {selectedSymptoms.map((symptom, index) => (
                          <span key={`${symptom}-${index}`} className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-[11px] text-primary-700 border border-primary-200">
                            {symptom}
                            <button type="button" onClick={() => toggleSymptom(symptom)} className="ml-1 text-primary-500 hover:text-primary-700" aria-label={`删除${symptom}`}>
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {symptomSelectorExpanded && (
                      <div className="mt-2 space-y-2">
                        <div className="flex flex-wrap gap-1.5">
                          {commonSymptoms.map((symptom) => {
                            const active = selectedSymptoms.includes(symptom);
                            return (
                              <button
                                key={symptom}
                                type="button"
                                onClick={() => toggleSymptom(symptom)}
                                className={`rounded-full border px-2 py-0.5 text-[11px] transition-colors ${active ? 'border-primary-300 bg-primary-50 text-primary-700' : 'border-stone-300 bg-white text-stone-600 hover:bg-stone-100'}`}
                              >
                                {symptom}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={customSymptomInput}
                            onChange={(e) => setCustomSymptomInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addCustomSymptom();
                              }
                            }}
                            placeholder="自定义症状"
                            className="h-7 flex-1 rounded-md border border-stone-300 bg-white px-2 text-xs text-stone-700 focus:border-primary-400 focus:outline-none"
                          />
                          <button type="button" onClick={addCustomSymptom} className="h-7 rounded-md border border-stone-300 px-2 text-xs text-stone-600 hover:bg-stone-100">
                            添加
                          </button>
                        </div>
                        {selectedSymptoms.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {selectedSymptoms.map((symptom, index) => (
                              <span key={`${symptom}-${index}`} className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-[11px] text-primary-700 border border-primary-200">
                                {symptom}
                                <button type="button" onClick={() => toggleSymptom(symptom)} className="ml-1 text-primary-500 hover:text-primary-700" aria-label={`删除${symptom}`}>
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setRecognitionExpanded(true)}
                  className="w-full flex items-center justify-between text-sm text-stone-600 px-3 py-2 rounded-lg bg-stone-50 border border-stone-200"
                >
                  <span>舌象特征选择区</span>
                  <span>▼</span>
                </button>
              )}



              {/* 舌象智能识别区 - 独立显示已选特征 */}
              {(inputFeatures.tongueColor.value || inputFeatures.coating.color || inputFeatures.tongueShape.value || inputFeatures.tongueState.value) ? (
                <div className="px-3 py-2.5 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="text-xs font-medium text-blue-600 mb-1">舌象智能识别</div>
                  <div className="flex flex-wrap gap-1.5">
                    {inputFeatures.tongueColor.value && (
                      <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-xs text-stone-700 border border-stone-200">舌色 {inputFeatures.tongueColor.value}</span>
                    )}
                    {inputFeatures.tongueShape.value && inputFeatures.tongueShape.value !== '正常' && (
                      <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-xs text-stone-700 border border-stone-200">舌形 {inputFeatures.tongueShape.value}</span>
                    )}
                    {(inputFeatures.teethMark?.value === '是') && (
                      <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-xs text-stone-700 border border-stone-200">齿痕</span>
                    )}
                    {(inputFeatures.crack?.value === '是') && (
                      <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-xs text-stone-700 border border-stone-200">裂纹</span>
                    )}
                    {inputFeatures.tongueState.value && inputFeatures.tongueState.value !== '正常' && (
                      <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-xs text-stone-700 border border-stone-200">舌态 {inputFeatures.tongueState.value}</span>
                    )}
                    {inputFeatures.coating.color && (
                      <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-xs text-stone-700 border border-stone-200">苔色 {inputFeatures.coating.color}</span>
                    )}
                    {inputFeatures.coating.texture && inputFeatures.coating.texture !== '正常' && (
                      <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-xs text-stone-700 border border-stone-200">苔质 {inputFeatures.coating.texture}</span>
                    )}
                    {inputFeatures.coating.moisture && inputFeatures.coating.moisture !== '正常' && (
                      <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-xs text-stone-700 border border-stone-200">润燥 {inputFeatures.coating.moisture}</span>
                    )}
                    {selectedSymptoms.length > 0 && selectedSymptoms.map((s, i) => (
                      <span key={i} className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-xs text-primary-700 border border-primary-200">{s}</span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="px-3 py-2 rounded-lg bg-stone-50 border border-dashed border-stone-300 text-center">
                  <span className="text-xs text-stone-400">请在上方选择舌象特征，识别结果将显示在此处</span>
                </div>
              )}
              <button
                onClick={handleSubmit}
                disabled={isAnalyzing}
                className="w-full py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium disabled:opacity-60"
              >
                {isAnalyzing ? '望诊辨证中...' : '望诊·辨证'}
              </button>
            </div>


          </div>

          <div className="space-y-4">
            {isAnalyzing && (
              <DiagnosisProgress currentStep={currentStep as any} />
            )}

            {diagnosisResult ? (
              <div className="space-y-4">
                <DiagnosisResultDisplay result={diagnosisResult.diagnosisResult} />

                <div className="bg-stone-50 rounded-xl p-1.5 flex gap-2">
                  <button onClick={() => setResultTab('pathogenesis')} className={`flex-1 text-sm font-medium py-2.5 px-4 rounded-lg transition-all ${resultTab === 'pathogenesis' ? 'bg-primary-50 border-b-2 border-primary-500 text-primary-700' : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'}`}>病机病理</button>
                  <button onClick={() => setResultTab('acupuncture')} className={`flex-1 text-sm font-medium py-2.5 px-4 rounded-lg transition-all ${resultTab === 'acupuncture' ? 'bg-primary-50 border-b-2 border-primary-500 text-primary-700' : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'}`}>针方穴位</button>
                  <button onClick={() => setResultTab('care')} className={`flex-1 text-sm font-medium py-2.5 px-4 rounded-lg transition-all ${resultTab === 'care' ? 'bg-primary-50 border-b-2 border-primary-500 text-primary-700' : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'}`}>生活调理</button>
                </div>

                {resultTab === 'pathogenesis' && (
                  <div className="tcm-card p-4 text-sm text-stone-700">
                    {diagnosisResult.diagnosisResult.pathogenesis || '-'}
                  </div>
                )}
                {resultTab === 'acupuncture' && (
                  isUnlocked
                    ? (diagnosisResult.acupuncturePlan?.mainPoints?.length || diagnosisResult.acupuncturePlan?.secondaryPoints?.length
                      ? <AcupunctureDisplay plan={diagnosisResult.acupuncturePlan} />
                      : <div className="tcm-card p-4 text-sm text-stone-600">暂无针方穴位数据</div>)
                    : <PaidDiagnosisSection />
                )}
                {resultTab === 'care' && (
                  isUnlocked ? <LifeCareDisplay advice={diagnosisResult.lifeCareAdvice} /> : <PaidDiagnosisSection />
                )}

                {showRefineButton && (
                  <button
                    onClick={handleRefineDiagnosis}
                    disabled={isRefiningDiagnosis}
                    className="w-full py-2 rounded-xl bg-amber-500 text-white text-sm font-medium disabled:opacity-60"
                  >
                    {isRefiningDiagnosis ? '智能问诊生成中...' : '智能问诊（望问合参）'}
                  </button>
                )}

                <button onClick={handleSaveCase} className="w-full py-2 rounded-xl bg-stone-100 text-stone-600 text-sm">保存此病例</button>

                {!isUnlocked && (
                  <div className="tcm-card p-4 text-center space-y-2">
                    <div className="text-sm text-stone-600">🔒 针方穴位和生活调理需解锁查看</div>
                    <div className="flex justify-center"><PayButton amount={9.9} title="舌镜深度辨证方案" size="medium" /></div>
                  </div>
                )}
              </div>
            ) : (
              <div className="tcm-card p-8 text-center text-stone-500">等待辨证分析</div>
            )}
          </div>
        </div>
      </main>

      {showInquiry && (
        (isLoadingInquiry && inquiryQuestions.length === 0) ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl">
              <p className="text-stone-600 font-medium">正在生成问诊问题...</p>
              <button onClick={cancelInquiry} className="text-sm text-stone-400 hover:text-stone-600">取消</button>
            </div>
          </div>
        ) : (
          <InquiryDialog
            questions={inquiryQuestions}
            conversationId={inquiryConversationId || ''}
            preliminaryResult={preliminaryResult}
            onSubmit={handleInquirySubmit as any}
            onCancel={cancelInquiry}
            isLoading={isSubmittingInquiry}
          />
        )
      )}
    </div>
  );
};

export default DiagnosisPage;


// ========== 辨证结果缓存 ==========
const DIAG_CACHE = 'tcm_diag_cache_v3';
const MAX_CACHE = 50;
function diagCacheKey(f: DiagnosisInput['input_features'], _i: DiagnosisInput): string {
  // 只用核心舌象字段生成key，忽略年龄/性别/主诉等非核心字段
  const core = {
    tongueColor: f.tongueColor?.value,
    tongueShape: f.tongueShape?.value,
    tongueState: f.tongueState?.value,
    coatingColor: f.coating?.color,
    coatingTexture: f.coating?.texture,
    coatingMoisture: f.coating?.moisture,
    teethMark: f.teethMark?.value,
    crack: f.crack?.value,
  };
  const s = JSON.stringify(core); let h = 0;
  for (let c = 0; c < s.length; c++) { h = ((h << 5) - h) + s.charCodeAt(c); h |= 0; }
  return String(h);
}
function diagCacheGet(k: string): DiagnosisOutput | null {
  try { const c = JSON.parse(localStorage.getItem(DIAG_CACHE) || '{}'); return c[k]?.v || null; } catch { return null; }
}
function diagCacheSet(k: string, v: DiagnosisOutput): void {
  try {
    const c = JSON.parse(localStorage.getItem(DIAG_CACHE) || '{}');
    c[k] = { v, t: Date.now() };
    const ks = Object.keys(c);
    if (ks.length > MAX_CACHE) { ks.sort((a, b) => c[a].t - c[b].t); ks.slice(0, ks.length - MAX_CACHE).forEach(x => delete c[x]); }
    localStorage.setItem(DIAG_CACHE, JSON.stringify(c));
  } catch {}
}
// ========== 缓存结束 ==========


// ========== 舌象特征结构化展示 ==========
// 分类颜色配置
const TONGUE_CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  tongueColor: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },      // 舌色-红色系
  tongueShape: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' }, // 舌形-橙色系
  tongueState: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' }, // 舌态-紫色系
  coating: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },      // 苔色/苔质-绿色系
  moisture: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },       // 润燥-蓝色系
  special: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },     // 齿痕裂纹-琥珀色系
};

// 生成结构化展示数据
function getStructuredTongueDisplay(inputFeatures: InputFeatures, isAIRecognized: boolean, aiConfidence: number = 0.8): {
  categories: Array<{
    label: string;
    items: Array<{ name: string; confidence: string; category: string }>;
  }>;
  rawText: string;
} {
  const categories: Array<{
    label: string;
    items: Array<{ name: string; confidence: string; category: string }>;
  }> = [];
  const parts: string[] = [];
  const confidence = isAIRecognized ? `AI ${Math.round(aiConfidence * 100)}%` : '手动选择';

  // 舌色
  if (inputFeatures.tongueColor.value) {
    categories.push({
      label: '舌色',
      items: [{ name: inputFeatures.tongueColor.value, confidence, category: 'tongueColor' }]
    });
    parts.push(`舌色`);
  }

  // 舌苔
  const coatItems: Array<{ name: string; confidence: string; category: string }> = [];
  if (inputFeatures.coating.color) {
    coatItems.push({ name: inputFeatures.coating.color, confidence, category: 'coating' });
    const coatTexture = inputFeatures.coating.texture && inputFeatures.coating.texture !== '正常'
      ? inputFeatures.coating.texture
      : '';
    parts.push(`苔`);
  }
  if (inputFeatures.coating.texture && inputFeatures.coating.texture !== '正常') {
    coatItems.push({ name: inputFeatures.coating.texture, confidence, category: 'coating' });
  }
  if (inputFeatures.coating.moisture && inputFeatures.coating.moisture !== '正常') {
    coatItems.push({ name: inputFeatures.coating.moisture, confidence, category: 'moisture' });
    parts.push(`苔`);
  }
  if (coatItems.length > 0) {
    categories.push({ label: '舌苔', items: coatItems });
  }

  // 舌形
  if (inputFeatures.tongueShape.value && inputFeatures.tongueShape.value !== '正常') {
    categories.push({
      label: '舌形',
      items: [{ name: inputFeatures.tongueShape.value, confidence, category: 'tongueShape' }]
    });
    parts.push(`舌形`);
  }

  // 舌态
  if (inputFeatures.tongueState.value && inputFeatures.tongueState.value !== '正常') {
    categories.push({
      label: '舌态',
      items: [{ name: inputFeatures.tongueState.value, confidence, category: 'tongueState' }]
    });
    parts.push(`舌态`);
  }

  // 特殊特征（齿痕、裂纹等）
  const specialItems: Array<{ name: string; confidence: string; category: string }> = [];
  if (inputFeatures.teethMark?.value === '是' || inputFeatures.shapeDistribution?.depression?.includes('齿痕')) {
    specialItems.push({ name: '齿痕', confidence, category: 'special' });
    parts.push('齿痕');
  }
  if (inputFeatures.crack?.value === '是' || inputFeatures.shapeDistribution?.depression?.includes('裂纹')) {
    specialItems.push({ name: '裂纹', confidence, category: 'special' });
    parts.push('裂纹');
  }
  if (specialItems.length > 0) {
    categories.push({ label: '特殊', items: specialItems });
  }

  // 舌色分布特征（舌尖红点、舌边瘀斑等）
  if (inputFeatures.distributionFeatures && inputFeatures.distributionFeatures.length > 0) {
    const regionFeatureItems = inputFeatures.distributionFeatures?.map((item: DistributionFeature) => {
      const regionName = getRegionChineseName(item.part);
      const displayName = `${regionName}${item.feature}`;
      return { name: displayName, confidence, category: 'distribution' };
    });
    categories.push({ label: '舌色分布', items: regionFeatureItems });
    regionFeatureItems.forEach((item) => parts.push(`明显`));
  }

  // 凹凸形态
  const shapeItems: Array<{ name: string; confidence: string; category: string }> = [];
  const otherDepression = inputFeatures.shapeDistribution?.depression?.filter((d: string) => !d.includes('齿痕') && !d.includes('裂纹')) || [];
  // 凹陷项加"凹陷"后缀，先映射region为中文
  otherDepression.forEach((rawItem: string) => {
    const regionName = getRegionChineseName(rawItem.replace('凹陷', ''));
    const displayItem = regionName.includes('凹陷') ? regionName : regionName + '凹陷';
    shapeItems.push({ name: displayItem, confidence, category: 'special' });
    parts.push(displayItem);
  });
  // 鼓胀项加"鼓胀"后缀，先映射region为中文
  inputFeatures.shapeDistribution?.bulge?.forEach((rawItem: string) => {
    const regionName = getRegionChineseName(rawItem.replace('鼓胀', ''));
    const displayItem = regionName.includes('鼓胀') ? regionName : regionName + '鼓胀';
    shapeItems.push({ name: displayItem, confidence, category: 'special' });
    parts.push(displayItem);
  });
  if (shapeItems.length > 0) {
    categories.push({ label: '形态', items: shapeItems });
  }

  return { categories, rawText: parts.join('·') };
}
// ========== 结构化展示结束 ==========
