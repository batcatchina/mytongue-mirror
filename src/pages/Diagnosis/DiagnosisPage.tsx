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

const TONGUE_CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  tongueColor: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
  tongueShape: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  tongueState: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  coating: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  moisture: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  special: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
};

const DiagnosisPage: React.FC = () => {
  const navigate = useNavigate();
  const isUnlocked = usePaymentStatus();
  const [resultTab, setResultTab] = useState<'pathogenesis' | 'acupuncture' | 'care'>('pathogenesis');
  const [uiMode, setUiMode] = useState<'v1' | 'v2'>('v1');

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

  const handleSaveCase = () => {
    if (!diagnosisResult) {
      toast.error('暂无可保存的辨证结果');
      return;
    }
    localStorage.setItem('tcm_saved_case', JSON.stringify(diagnosisResult));
    toast.success('病例已保存');
  };

  const structuredDisplay = (() => {
    const categories: Array<{ label: string; items: Array<{ name: string; confidence: string; category: string }> }> = [];
    const parts: string[] = [];
    const confidence = '手动选择';

    if (inputFeatures.tongueColor.value) {
      categories.push({ label: '舌色', items: [{ name: inputFeatures.tongueColor.value, confidence, category: 'tongueColor' }] });
      parts.push(`舌色:${inputFeatures.tongueColor.value}`);
    }
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
    if (coatItems.length > 0) categories.push({ label: '舌苔', items: coatItems });

    if (inputFeatures.tongueShape.value && inputFeatures.tongueShape.value !== '正常') {
      categories.push({ label: '舌形', items: [{ name: inputFeatures.tongueShape.value, confidence, category: 'tongueShape' }] });
      parts.push(`舌形:${inputFeatures.tongueShape.value}`);
    }
    if (inputFeatures.tongueState.value && inputFeatures.tongueState.value !== '正常') {
      categories.push({ label: '舌态', items: [{ name: inputFeatures.tongueState.value, confidence, category: 'tongueState' }] });
      parts.push(`舌态:${inputFeatures.tongueState.value}`);
    }

    const specialItems: Array<{ name: string; confidence: string; category: string }> = [];
    if (inputFeatures.teethMark?.value === '是' || inputFeatures.shapeDistribution?.depression?.includes('齿痕')) {
      specialItems.push({ name: '齿痕', confidence, category: 'special' });
      parts.push('齿痕');
    }
    if (inputFeatures.crack?.value === '是' || inputFeatures.shapeDistribution?.depression?.includes('裂纹')) {
      specialItems.push({ name: '裂纹', confidence, category: 'special' });
      parts.push('裂纹');
    }
    if (specialItems.length > 0) categories.push({ label: '特殊', items: specialItems });

    if (((inputFeatures.distributionFeatures || []).length > 0)) {
      const regionFeatureItems = inputFeatures.distributionFeatures.map((item: any) => {
        const regionName = getRegionChineseName(item.part);
        const displayName = `${regionName}${item.feature}`;
        return { name: displayName, confidence, category: 'distribution' };
      });
      categories.push({ label: '舌色分布', items: regionFeatureItems });
      regionFeatureItems.forEach((item) => parts.push(item.name));
    }

    return { categories, rawText: parts.join('·') };
  })();

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
