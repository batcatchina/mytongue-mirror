/**
 * 舌诊主页 - 简化后的主页面
 * 架构：按领域拆分后的主入口
 * 目标：< 300行
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import NavBar from '@/components/common/NavBar';
import TongueInputSection from './components/TongueInputSection';
import ResultSection from './components/ResultSection';
import InquirySection from './components/InquirySection';
import { useDiagnosisStore } from '@/stores/diagnosisStore';
import { submitDiagnosis } from '@/services/api';
import { handleFallbackToLocal } from '@/services/DiagnosisService';
import { checkGlobalUnlocked, generateReportId } from '@/services/PaymentService';
import { InquiryQuestion, DiagnosisOutput } from '@/components/InquiryDialog';
import { InputFeatures } from '@/types';

// ========== 导出结构化展示相关常量（供子组件使用） ==========
export const TONGUE_CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  tongueColor: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
  tongueShape: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  tongueState: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  coating: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  moisture: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  special: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
};

// 区域中文名映射
const REGION_NAME_MAP: Record<string, string> = {
  tip: '舌尖', sides: '舌边', middle: '舌中', root: '舌根',
  left: '左侧', right: '右侧', center: '中央', centerTip: '舌尖',
};
export function getRegionChineseName(part: string): string {
  return REGION_NAME_MAP[part] || part;
}

// 生成结构化展示数据
export function getStructuredTongueDisplay(inputFeatures: InputFeatures, isAIRecognized: boolean, aiConfidence: number = 0.8): {
  categories: Array<{ label: string; items: Array<{ name: string; confidence: string; category: string }> }>;
  rawText: string;
} {
  const categories: Array<{ label: string; items: Array<{ name: string; confidence: string; category: string }> }> = [];
  const parts: string[] = [];
  const confidence = isAIRecognized ? `AI ${Math.round(aiConfidence * 100)}%` : '手动选择';

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

  if (inputFeatures.distributionFeatures?.length > 0) {
    const regionFeatureItems = inputFeatures.distributionFeatures.map((item: any) => {
      const regionName = getRegionChineseName(item.part);
      const displayName = `${regionName}${item.feature}`;
      return { name: displayName, confidence, category: 'distribution' };
    });
    categories.push({ label: '舌色分布', items: regionFeatureItems });
    regionFeatureItems.forEach((item) => parts.push(item.name));
  }

  const shapeItems: Array<{ name: string; confidence: string; category: string }> = [];
  const otherDepression = inputFeatures.shapeDistribution?.depression?.filter((d: string) => !d.includes('齿痕') && !d.includes('裂纹')) || [];
  otherDepression.forEach((rawItem: string) => {
    const regionName = getRegionChineseName(rawItem.replace('凹陷', ''));
    const displayItem = regionName.includes('凹陷') ? regionName : regionName + '凹陷';
    shapeItems.push({ name: displayItem, confidence, category: 'special' });
    parts.push(displayItem);
  });
  inputFeatures.shapeDistribution?.bulge?.forEach((rawItem: string) => {
    const regionName = getRegionChineseName(rawItem.replace('鼓胀', ''));
    const displayItem = regionName.includes('鼓胀') ? regionName : regionName + '鼓胀';
    shapeItems.push({ name: displayItem, confidence, category: 'special' });
    parts.push(displayItem);
  });
  if (shapeItems.length > 0) categories.push({ label: '形态', items: shapeItems });

  return { categories, rawText: parts.join('·') };
}
// ========== 结构化展示结束 ==========

// UI模式切换组件
const UIModeToggle = ({ uiMode, onToggle }: { uiMode: 'v1' | 'v2'; onToggle: () => void }) => (
  <div className="flex justify-end px-4 py-2">
    <button
      onClick={onToggle}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        uiMode === 'v2' 
          ? 'bg-primary-100 text-primary-700 border border-primary-300' 
          : 'bg-stone-100 text-stone-600 border border-stone-200'
      }`}
    >
      {uiMode === 'v1' ? '🔮 推理链模式' : '📋 简化模式'}
    </button>
  </div>
);

export default function DiagnosisPage() {
  const navigate = useNavigate();
  const {
    inputFeatures,
    patientInfo,
    getDiagnosisInput,
    setTongueShape,
    setTongueState,
    setCoating,
  } = useDiagnosisStore();

  // UI模式
  const [uiMode, setUiMode] = useState<'v1' | 'v2'>('v2');

  // 诊断相关状态
  const [diagnosisResult, setLocalDiagnosisResult] = useState<DiagnosisOutput | null>(null);
  const [isAnalyzing, setLocalIsAnalyzing] = useState(false);
  const [currentStep, setLocalCurrentStep] = useState<string>('idle');
  const [useLocalEngine, setUseLocalEngine] = useState(false);

  // 识别相关状态
  const [isAIRecognized, setIsAIRecognized] = useState(false);

  // 支付相关状态
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);

  // Tab状态
  const [activeTab] = useState<'input' | 'report' | 'history'>('input');
  const [resultTab, setResultTab] = useState<'pathogenesis' | 'acupuncture' | 'care'>('pathogenesis');

  // 问诊相关状态
  const [showInquiry, setShowInquiry] = useState(false);
  const [inquiryQuestions, setInquiryQuestions] = useState<InquiryQuestion[]>([]);
  const [inquiryConversationId, setInquiryConversationId] = useState<string | null>(null);
  const [isRefiningDiagnosis, setIsRefiningDiagnosis] = useState(false);
  const [isLoadingInquiry, setIsLoadingInquiry] = useState(false);
  const [preliminaryResult, setPreliminaryResult] = useState<DiagnosisOutput | null>(null);
  const [showRefineButton, setShowRefineButton] = useState(true);

  // 初始化检查解锁状态
  useEffect(() => {
    const unlocked = checkGlobalUnlocked();
    setIsUnlocked(unlocked);
    if (unlocked) {
      setCurrentReportId(generateReportId());
    }
  }, []);

  // 处理舌象识别
  const handleRecognize = useCallback(() => {
    setIsAIRecognized(true);
  }, []);

  // 处理提交诊断
  const handleSubmit = useCallback(async () => {
    const input = getDiagnosisInput();

    // 验证
    if (!inputFeatures.tongueColor.value) {
      toast.error('请选择舌色');
      return;
    }
    if (!inputFeatures.coating.color) {
      toast.error('请选择苔色');
      return;
    }
    if (!patientInfo.gender) {
      toast.error('请选择性别');
      return;
    }

    // 填充默认值
    if (!inputFeatures.tongueShape.value) setTongueShape('正常');
    if (!inputFeatures.tongueState.value) setTongueState('正常');
    if (!inputFeatures.coating.texture) setCoating(inputFeatures.coating.color, '薄', '润');
    if (!inputFeatures.coating.moisture) setCoating(inputFeatures.coating.color, inputFeatures.coating.texture || '薄', '润');

    setLocalIsAnalyzing(true);
    setLocalDiagnosisResult(null);
    setShowRefineButton(false);

    try {
      setLocalCurrentStep('analyzing');
      const result = await submitDiagnosis(input, (step) => {
        setLocalCurrentStep(step);
      });

      setLocalDiagnosisResult(result);
      setLocalCurrentStep('result');
      toast.success('辨证分析完成！');
    } catch (err) {
      console.error('[辨证提交] 异常:', err);
      const message = err instanceof Error ? err.message : '辨证分析失败';
      toast.error(message);

      // 降级到本地引擎
      toast('远程辨证失败，切换到本地快速分析...', { icon: '⚡' });
      try {
        const localResult = handleFallbackToLocal(input);
        setLocalDiagnosisResult(localResult);
        setLocalCurrentStep('result');
        toast.success(`本地辨证完成！${localResult.diagnosisResult?.primarySyndrome || ''}`);
      } catch (localErr) {
        console.error('[降级] 本地引擎也失败:', localErr);
      }
    } finally {
      setLocalIsAnalyzing(false);
    }
  }, [inputFeatures, patientInfo, getDiagnosisInput]);

  // Fallback 到本地引擎
  const handleFallbackToLocalCallback = useCallback(() => {
    if (isAnalyzing) return;
    const input = getDiagnosisInput();
    setLocalIsAnalyzing(true);
    setUseLocalEngine(true);
    setLocalCurrentStep('reasoning');

    try {
      const result = handleFallbackToLocal(input);
      setLocalDiagnosisResult(result);
      setLocalCurrentStep('result');
      toast.success('🔧 本地诊断完成');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '本地诊断失败';
      toast.error(`本地诊断失败: ${errorMessage}`);
    } finally {
      setLocalIsAnalyzing(false);
    }
  }, [isAnalyzing, getDiagnosisInput]);

  // 开始问诊
  const handleRefineDiagnosis = useCallback(async () => {
    if (isRefiningDiagnosis || !diagnosisResult) return;
    setIsRefiningDiagnosis(true);
    setIsLoadingInquiry(true);
    setShowRefineButton(false);
    setPreliminaryResult(diagnosisResult);

    try {
      const response = await fetch('/api/inquiry/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preliminary_result: diagnosisResult }),
      });

      if (!response.ok) throw new Error('问诊问题生成失败');

      const data = await response.json();
      setInquiryQuestions(data.questions || []);
      setInquiryConversationId(data.conversation_id || `inq_${Date.now()}`);
      setShowInquiry(true);
    } catch (error) {
      console.error('生成问诊问题失败:', error);
      toast.error('生成问诊问题失败，请重试');
      setShowRefineButton(true);
    } finally {
      setIsRefiningDiagnosis(false);
      setIsLoadingInquiry(false);
    }
  }, [isRefiningDiagnosis, diagnosisResult]);

  // 提交问诊答案
  const handleInquirySubmit = useCallback(async (answers: Record<string, string>) => {
    if (!preliminaryResult || !inquiryConversationId) {
      throw new Error('问诊数据不完整');
    }

    setIsRefiningDiagnosis(true);
    try {
      const response = await fetch('/api/inquiry/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: inquiryConversationId,
          answers,
          preliminary_result: preliminaryResult,
        }),
      });

      if (!response.ok) throw new Error('问诊提交失败');

      const refinedResult = await response.json();
      const finalResult: DiagnosisOutput = {
        diagnosisResult: refinedResult.diagnosisResult || preliminaryResult.diagnosisResult,
        acupuncturePlan: refinedResult.acupuncturePlan || preliminaryResult.acupuncturePlan,
        lifeCareAdvice: refinedResult.lifeCareAdvice || preliminaryResult.lifeCareAdvice,
      };

      setLocalDiagnosisResult(finalResult);
      setShowInquiry(false);
      setIsRefiningDiagnosis(false);
      toast.success('✅ 问诊完成，辨证更精准');
      return finalResult;
    } catch (error) {
      console.error('提交问诊失败:', error);
      toast.error('提交问诊失败，请重试');
      throw error;
    }
  }, [preliminaryResult, inquiryConversationId]);

  // 解锁付费内容
  const handleUnlock = useCallback(async () => {
    if (isUnlocked) {
      toast.success('已解锁');
      return;
    }
    setIsUnlocked(true);
    setCurrentReportId(generateReportId());
    toast.success('✅ 深度辨证已解锁！');
  }, [isUnlocked]);

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <Toaster position="top-center" />
      <NavBar currentPath="/" onNavigate={(path) => navigate(path)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <UIModeToggle uiMode={uiMode} onToggle={() => setUiMode(prev => prev === 'v1' ? 'v2' : 'v1')} />

        <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-4 lg:space-y-0">
          {/* 左侧：输入区域 */}
          <div className="space-y-4">
            <TongueInputSection
              isAnalyzing={isAnalyzing}
              currentStep={currentStep as any}
              isAIRecognized={isAIRecognized}
              useLocalEngine={useLocalEngine}
              onRecognize={handleRecognize}
              onFallbackToLocal={handleFallbackToLocalCallback}
            />
            {/* 提交按钮单独放在这里 */}
            <button
              onClick={handleSubmit}
              disabled={isAnalyzing}
              className="w-full py-4 rounded-xl text-base font-medium transition-all disabled:opacity-50 bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:from-primary-600 hover:to-secondary-600 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  分析中...
                </>
              ) : (
                <>
                  <span className="text-xl">🔍</span>
                  开始辨证分析
                </>
              )}
            </button>
          </div>

          {/* 右侧：结果展示 */}
          <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <ResultSection
              diagnosisResult={diagnosisResult}
              isUnlocked={isUnlocked}
              currentReportId={currentReportId}
              resultTab={resultTab}
              activeTab={activeTab}
              showRefineButton={showRefineButton}
              isRefiningDiagnosis={isRefiningDiagnosis}
              inputFeatures={{
                tongueColor: inputFeatures.tongueColor.value,
                tongueShape: inputFeatures.tongueShape.value,
                tongueState: inputFeatures.tongueState.value,
                coatingColor: inputFeatures.coating.color,
                coatingTexture: inputFeatures.coating.texture,
                coatingMoisture: inputFeatures.coating.moisture,
              }}
              onResultTabChange={setResultTab}
              onRefineDiagnosis={handleRefineDiagnosis}
              onUnlock={handleUnlock}
            />
          </div>
        </div>
      </main>

      {/* 问诊对话框 */}
      <InquirySection
        showInquiry={showInquiry}
        inquiryQuestions={inquiryQuestions}
        inquiryConversationId={inquiryConversationId}
        preliminaryResult={preliminaryResult}
        isLoadingInquiry={isLoadingInquiry}
        isRefiningDiagnosis={isRefiningDiagnosis}
        onSubmit={handleInquirySubmit}
        onCancel={() => {
          setShowInquiry(false);
          setShowRefineButton(true);
          setIsRefiningDiagnosis(false);
          setIsLoadingInquiry(false);
        }}
        onClose={() => {
          setShowInquiry(false);
          setShowRefineButton(true);
        }}
      />
    </div>
  );
}
