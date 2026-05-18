import React, { useState } from 'react';
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
import SymptomInput from '@/components/tongue-input/SymptomInput';
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
const DiagnosisPage: React.FC = () => {
  const navigate = useNavigate();
  const isUnlocked = usePaymentStatus();
  const [resultTab, setResultTab] = useState<'pathogenesis' | 'acupuncture' | 'care'>('pathogenesis');
  const [uiMode, setUiMode] = useState<'v1' | 'v2'>('v1');
  const [useLocalEngine, setUseLocalEngine] = useState(true);
  const [showEngineSwitch, setShowEngineSwitch] = useState(false);
  const [isAIRecognized, setIsAIRecognized] = useState(false);
  const [inferenceChain, setInferenceChain] = useState<any>(null);
  
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
    inquiryQuestions,
    inquiryConversationId,
    preliminaryResult,
    handleSubmit,
    handleRefineDiagnosis,
    handleInquirySubmit,
    cancelInquiry,
  } = useDiagnosisFlow({ inputFeatures, patientInfo });

  
  const structuredDisplay = getStructuredTongueDisplay(inputFeatures, isAIRecognized);

  

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

              <ImageUpload
                onFeaturesExtracted={(features, imageData) => {
                  setInputFeatures(features);
                  setTongueImage(imageData || null);
                }}
              />

              <TongueColorSelector value={inputFeatures.tongueColor.value} onChange={(value) => setInputFeatures({ ...inputFeatures, tongueColor: { value } as any })} />
              <TongueShapeSelector value={inputFeatures.tongueShape.value} onChange={(value) => setInputFeatures({ ...inputFeatures, tongueShape: { value } as any })} />
              <TongueStateSelector value={inputFeatures.tongueState.value} onChange={(value) => setInputFeatures({ ...inputFeatures, tongueState: { value } as any })} />
              <TongueCoatingSelector value={inputFeatures.coating} onChange={(coating) => setInputFeatures({ ...inputFeatures, coating })} />
              <TongueColorDistribution value={inputFeatures.distributionFeatures || []} onChange={(distributionFeatures) => setInputFeatures({ ...inputFeatures, distributionFeatures })} />

              <SymptomInput value={currentSymptoms || ''} onChange={setCurrentSymptoms} />
              {/* 引擎切换选项 */}
              <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                <span className="text-xs text-stone-500">辨证引擎:</span>
                <button
                  onClick={() => setUseLocalEngine(!useLocalEngine)}
                  className={`px-2 py-1 text-xs rounded ${
                    useLocalEngine 
                      ? 'bg-primary-100 text-primary-700' 
                      : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {useLocalEngine ? '🟢 本地规则' : '🔵 AI推理'}
                </button>
              </div>


              <button
                onClick={handleSubmit}
                disabled={isAnalyzing}
                className="w-full py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium disabled:opacity-60"
              >
                {isAnalyzing ? '辨证分析中...' : '开始辨证'}
              </button>
            </div>

            {((structuredDisplay.categories || []).length) > 0 && (
              <div className="tcm-card p-4">
                <h3 className="text-sm font-medium text-stone-600 mb-3">结构化舌象</h3>
                <div className="space-y-2">
                  {structuredDisplay.categories.map((cat) => (
                    <div key={cat.label}>
                      <div className="text-xs text-stone-500 mb-1">{cat.label}</div>
                      <div className="flex flex-wrap gap-2">
                        {cat.items.map((item, i) => {
                          const c = TONGUE_CATEGORY_COLORS[item.category] || TONGUE_CATEGORY_COLORS.special;
                          return (
                            <span key={`${item.name}-${i}`} className={`px-2 py-1 rounded-full text-xs border ${c.bg} ${c.text} ${c.border}`}>
                              {item.name}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {isAnalyzing && (
              <DiagnosisProgress currentStep={currentStep as any} />
            )}

            {diagnosisResult ? (
              <div className="space-y-4">
                <DiagnosisResultDisplay result={diagnosisResult.diagnosisResult} />

                <div className="flex gap-2">
                  <button onClick={() => setResultTab('pathogenesis')} className="px-3 py-1.5 rounded-lg bg-stone-100 text-xs">病机</button>
                  <button onClick={() => setResultTab('acupuncture')} className="px-3 py-1.5 rounded-lg bg-stone-100 text-xs">针灸</button>
                  <button onClick={() => setResultTab('care')} className="px-3 py-1.5 rounded-lg bg-stone-100 text-xs">调理</button>
                </div>

                {resultTab === 'pathogenesis' && (
                  <div className="tcm-card p-4 text-sm text-stone-700">
                    {diagnosisResult.diagnosisResult.pathogenesis || '-'}
                  </div>
                )}
                {resultTab === 'acupuncture' && (
                  isUnlocked ? <AcupunctureDisplay plan={diagnosisResult.acupuncturePlan} /> : <PaidDiagnosisSection />
                )}
                {resultTab === 'care' && (
                  isUnlocked ? <LifeCareDisplay advice={diagnosisResult.lifeCareAdvice} /> : <PaidDiagnosisSection />
                )}

                {!showRefineButton && (
                  <button
                    onClick={handleRefineDiagnosis}
                    disabled={isRefiningDiagnosis}
                    className="w-full py-2 rounded-xl bg-amber-500 text-white text-sm font-medium disabled:opacity-60"
                  >
                    {isRefiningDiagnosis ? '生成问诊中...' : '问而确之（提升准确率）'}
                  </button>
                )}

                <button onClick={handleSaveCase} className="w-full py-2 rounded-xl bg-stone-100 text-stone-600 text-sm">保存此病例</button>

                {!isUnlocked && (
                  <div className="tcm-card p-4 text-center space-y-2">
                    <div className="text-sm text-stone-600">🔒 针灸方案和生活调理需解锁查看</div>
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
        isLoadingInquiry ? (
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
            isLoading={isLoadingInquiry}
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
    parts.push(`舌色:${inputFeatures.tongueColor.value}`);
  }

  // 舌苔
  const coatItems: Array<{ name: string; confidence: string; category: string }> = [];
  if (inputFeatures.coating.color) {
    coatItems.push({ name: inputFeatures.coating.color, confidence, category: 'coating' });
    parts.push(`苔色:${inputFeatures.coating.color}`);
  }
  if (inputFeatures.coating.texture && inputFeatures.coating.texture !== '正常') {
    coatItems.push({ name: inputFeatures.coating.texture, confidence, category: 'coating' });
    parts.push(`苔质:${inputFeatures.coating.texture}`);
  }
  if (inputFeatures.coating.moisture && inputFeatures.coating.moisture !== '正常') {
    coatItems.push({ name: inputFeatures.coating.moisture, confidence, category: 'moisture' });
    parts.push(`润燥:${inputFeatures.coating.moisture}`);
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
    parts.push(`舌形:${inputFeatures.tongueShape.value}`);
  }

  // 舌态
  if (inputFeatures.tongueState.value && inputFeatures.tongueState.value !== '正常') {
    categories.push({
      label: '舌态',
      items: [{ name: inputFeatures.tongueState.value, confidence, category: 'tongueState' }]
    });
    parts.push(`舌态:${inputFeatures.tongueState.value}`);
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
    regionFeatureItems.forEach((item) => parts.push(item.name));
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
