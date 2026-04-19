import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import NavBar from '@/components/common/NavBar';
import StatusBar from '@/components/common/StatusBar';
import {
  TongueColorSelector,
  TongueShapeSelector,
  TongueCoatingSelector,
  TongueStateSelector,
  ImageUpload,
  TongueColorDistribution,
} from '@/components/tongue-input/TongueFeatureSelectors';
import SymptomInput from '@/components/tongue-input/SymptomInput';
import PatientInfoForm from '@/components/tongue-input/PatientInfoForm';
import DiagnosisResultDisplay from '@/components/result-display/DiagnosisResultDisplay';
import AcupunctureDisplay from '@/components/result-display/AcupunctureDisplay';
import LifeCareDisplay from '@/components/result-display/LifeCareDisplay';
import { useDiagnosisStore } from '@/stores/diagnosisStore';
import { submitDiagnosis } from '@/services/api';
import type { DiagnosisOutput } from '@/types';

const DiagnosisPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'acupuncture' | 'care'>('diagnosis');
  
  const {
    inputFeatures,
    symptoms,
    patientInfo,
    diagnosisResult,
    isAnalyzing,
    setTongueColor,
    setTongueShape,
    setTongueState,
    setCoating,
    setCrack,
    setTeethMark,
    setTongueSurface,
    setEcchymosis,
    addSymptom,
    removeSymptom,
    updateSymptom,
    setPatientInfo,
    setDiagnosisResult,
    setIsAnalyzing,
    setError,
    resetInput,
    getDiagnosisInput,
    saveCase,
  } = useDiagnosisStore();

  // 提交辨证
  const handleSubmit = async () => {
    // 验证必填项
    if (!inputFeatures.tongueColor.value) {
      toast.error('请选择舌色');
      return;
    }
    if (!inputFeatures.tongueShape.value) {
      toast.error('请选择舌形');
      return;
    }
    if (!inputFeatures.tongueState.value) {
      toast.error('请选择舌态');
      return;
    }
    if (!inputFeatures.coating.color) {
      toast.error('请选择苔色');
      return;
    }
    if (!patientInfo.chiefComplaint) {
      toast.error('请填写主诉');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const input = getDiagnosisInput();
      const result = await submitDiagnosis(input);
      setDiagnosisResult(result);
      toast.success('辨证分析完成！');
    } catch (error) {
      const message = error instanceof Error ? error.message : '辨证分析失败';
      setError(message);
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 保存病例
  const handleSaveCase = () => {
    if (!diagnosisResult) {
      toast.error('请先完成辨证分析');
      return;
    }
    saveCase(diagnosisResult);
    toast.success('病例已保存');
  };

  // 清空输入
  const handleReset = () => {
    resetInput();
    toast.success('已清空所有输入');
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <Toaster position="top-center" />
      <NavBar currentPath="/" onNavigate={(path) => navigate(path)} />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧：输入区域 */}
          <div className="space-y-6">
            {/* 舌象特征输入 */}
            <div className="tcm-card p-5">
              <h2 className="tcm-section-title">舌象特征输入</h2>
              
              {/* 图片上传 */}
              <div className="mb-6">
                <ImageUpload />
              </div>
              
              <div className="tcm-divider" />
              
              {/* 舌色选择 */}
              <div className="mb-6">
                <TongueColorSelector
                  value={inputFeatures.tongueColor.value}
                  onChange={setTongueColor}
                />
              </div>
              
              <div className="tcm-divider" />
              
              {/* 舌形选择 */}
              <div className="mb-6">
                <TongueShapeSelector
                  value={inputFeatures.tongueShape.value}
                  onChange={setTongueShape}
                />
              </div>
              
              <div className="tcm-divider" />
              
              {/* 舌苔选择 */}
              <div className="mb-6">
                <h3 className="block text-sm font-medium text-stone-700 mb-3">舌苔</h3>
                <TongueCoatingSelector
                  color={inputFeatures.coating.color}
                  texture={inputFeatures.coating.texture}
                  moisture={inputFeatures.coating.moisture}
                  onColorChange={(color) => setCoating(color, inputFeatures.coating.texture, inputFeatures.coating.moisture)}
                  onTextureChange={(texture) => setCoating(inputFeatures.coating.color, texture, inputFeatures.coating.moisture)}
                  onMoistureChange={(moisture) => setCoating(inputFeatures.coating.color, inputFeatures.coating.texture, moisture)}
                />
              </div>
              
              <div className="tcm-divider" />
              
              {/* 舌态选择 */}
              <div>
                <TongueStateSelector
                  value={inputFeatures.tongueState.value}
                  onChange={setTongueState}
                />
              </div>
            </div>

            {/* 伴随症状 */}
            <div className="tcm-card p-5">
              <SymptomInput
                symptoms={symptoms}
                onAdd={addSymptom}
                onRemove={removeSymptom}
                onUpdate={updateSymptom}
              />
            </div>

            {/* 患者信息 */}
            <div className="tcm-card p-5">
              <PatientInfoForm
                patientInfo={patientInfo}
                onChange={setPatientInfo}
              />
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="tcm-btn-secondary flex-1 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                清空
              </button>
              <button
                onClick={handleSubmit}
                disabled={isAnalyzing}
                className="tcm-btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <>
                    <div className="loading-spinner w-4 h-4" />
                    分析中...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    提交辨证
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 右侧：结果展示 */}
          <div className="space-y-6">
            {diagnosisResult ? (
              <>
                {/* 结果标签页 */}
                <div className="tcm-card p-2">
                  <div className="flex gap-1">
                    {[
                      { key: 'diagnosis', label: '辨证结果', icon: '📊' },
                      { key: 'acupuncture', label: '针灸选穴', icon: '💉' },
                      { key: 'care', label: '生活调护', icon: '🏠' },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as any)}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                          activeTab === tab.key
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 辨证结果 */}
                {activeTab === 'diagnosis' && (
                  <DiagnosisResultDisplay result={diagnosisResult.diagnosisResult} />
                )}

                {/* 针灸选穴 */}
                {activeTab === 'acupuncture' && (
                  <AcupunctureDisplay plan={diagnosisResult.acupuncturePlan} />
                )}

                {/* 生活调护 */}
                {activeTab === 'care' && (
                  <LifeCareDisplay advice={diagnosisResult.lifeCareAdvice} />
                )}
              </>
            ) : (
              <div className="tcm-card p-12 flex flex-col items-center justify-center text-stone-400">
                <div className="w-24 h-24 mb-4 opacity-30">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0-6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                  </svg>
                </div>
                <p className="text-lg font-chinese text-stone-500">等待辨证分析</p>
                <p className="text-sm mt-2">请填写舌象特征并提交辨证</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <StatusBar
        systemStatus={isAnalyzing ? 'loading' : 'ready'}
        diagnosisTime={diagnosisResult?.diagnosisResult.diagnosisTime}
        onSaveCase={diagnosisResult ? handleSaveCase : undefined}
      />
    </div>
  );
};

export default DiagnosisPage;
