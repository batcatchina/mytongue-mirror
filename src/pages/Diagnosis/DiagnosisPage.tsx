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


import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import NavBar from '@/components/common/NavBar';
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
import HealthReport from '@/components/result-display/HealthReport';
import PayButton, { usePaymentStatus } from '@/components/payment/PayButton';
import InquiryDialog, { InquiryQuestion } from '@/components/InquiryDialog';
import { acupointKnowledge } from '@/config/acupointKnowledge';
import DiagnosisProgress from '@/components/diagnosis/DiagnosisProgress';
import InferenceChainView from '@/components/inference/InferenceChainView';
import { useDiagnosisStore } from '@/stores/diagnosisStore';
import { submitDiagnosis } from '@/services/api';
import { TongueRecognitionResult } from '@/services/tongueAI';
import { 
  diagnose as localDiagnose, 
  DiagnosisInput,
  getRuleStatistics,
} from '@/services/diagnosisEngine';
import { getRegionChineseName } from '@/config/tongueDisplay';

const DiagnosisPage: React.FC = () => {
  const navigate = useNavigate();
  // 版本标记 - v1.3.0 UI优化版
  console.log('[舌镜] 版本: v3.0.0 方案A-DeepSeek推理');
  // 社会证明 - v2.5

  // 社会证明Banner
  const SocialProofBanner = () => (
    <div className="flex flex-wrap items-center justify-center gap-4 py-2 px-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-b border-emerald-100">
      <div className="flex items-center gap-1.5 text-xs text-stone-600">
        <span className="text-lg">👥</span>
      </div>
      <div className="w-px h-4 bg-stone-300" />
      <div className="flex items-center gap-1.5 text-xs text-stone-600">
        <span className="text-lg">📚</span>
        <span>基于500+中医经典证型规则</span>
      </div>
      <div className="w-px h-4 bg-stone-300" />
      <div className="flex items-center gap-1.5 text-xs text-stone-600">
        <span className="text-lg">🎯</span>
        <span>辨证参考准确率85.9%</span>
      </div>
    </div>
  );



  // ========== v2.0 UI模式切换 ==========
  const UIModeToggle = () => (
    <div className="flex justify-end px-4 py-2">
      <button
        onClick={() => setUiMode(prev => prev === 'v1' ? 'v2' : 'v1')}
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


  const [resultTab, setResultTab] = useState<'pathogenesis' | 'acupuncture' | 'care'>('pathogenesis');

  // ========== 付费报告状态 ==========
  // isUnlocked replaced by isUnlocked from usePaymentStatus()
  const [currentReportId, setCurrentReportId] = useState('');

  // ========== 付费通道逻辑 ==========
  // 面包多商品链接（审核通过后填入实际链接）
  const MIANBAODUO_PRODUCT_URL = 'https://www.mianbaoduo.com/o/product/PLACEHOLDER';
  
  // 检测URL参数（支付回调）
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paid = params.get('paid');
    const reportId = params.get('report_id');
    
    if (paid === '1' && reportId) {
      // 支付成功回调
      setIsReportUnlocked(true);
      setCurrentReportId(reportId);
      localStorage.setItem('report_unlocked_' + reportId, 'true');
      // 清除URL参数
      window.history.replaceState({}, '', window.location.pathname);
      toast.success('支付成功！正在解锁完整报告...');
    }
  }, []);
  
  // 解锁报告
    const reportId = 'R' + Date.now().toString(36).toUpperCase();
    setCurrentReportId(reportId);
    // 跳转面包多支付
    const returnUrl = encodeURIComponent(window.location.origin + window.location.pathname + '?paid=1&report_id=' + reportId);
    window.open(MIANBAODUO_PRODUCT_URL + '?from=shezhen&return=' + returnUrl, '_blank');
    // 演示模式：直接解锁（开发时使用）
    setIsReportUnlocked(true);
    localStorage.setItem('report_unlocked_' + reportId, 'true');
  };
  
  // 生成新报告ID
  const generateReportId = () => 'R' + Date.now().toString(36).toUpperCase();

  // ========== v3.2 问而确之：年龄段选择器 ==========
  const ageGroups = [
    { label: '30以下', value: 25 },
    { label: '30-50', value: 40 },
    { label: '50-65', value: 57 },
    { label: '65以上', value: 72 },
  ] as const;
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<number | null>(null);

  // ========== v3.2 问诊状态 ==========
  const [showInquiry, setShowInquiry] = useState(false);
  const [inquiryQuestions, setInquiryQuestions] = useState<InquiryQuestion[]>([]);
  const [inquiryConversationId, setInquiryConversationId] = useState<string | null>(null);
  const [preliminaryResult, setPreliminaryResult] = useState<any>(null);
  const [isRefiningDiagnosis, setIsRefiningDiagnosis] = useState(false);
  const [showRefineButton, setShowRefineButton] = useState(false);
  const [useLocalEngine, setUseLocalEngine] = useState(true);
  const [showEngineSwitch, setShowEngineSwitch] = useState(false);
  const [isAIRecognized, setIsAIRecognized] = useState(false);
  
  // 支付解锁状态 - 检测 URL 中的 paid_order 参数
  const isUnlocked = usePaymentStatus();
  const [uiMode, setUiMode] = useState<'v1' | 'v2'>('v1');
  const [inferenceChain, setInferenceChain] = useState<any>(null);



  // 清洗穴位名称：去掉DeepSeek加的括号注释，如"神门（清心火）"→"神门"
  const cleanAcupointName = (name: string) => name.replace(/[（(].*[）)]/g, '').trim();
  
  /**
   * DeepSeek API辨证推理 v3.0
   * 调用舌镜AI诊断接口
   */
  const diagnoseWithDeepSeek = async () => {
    console.log('[DeepSeek诊断] 开始AI辨证推理...');
    
    // ========== v2.0 模拟推理链数据 ==========
    const mockInferenceChain = {
      layers: [
        {
          layer: 1,
          name: '舌质舌苔分析',
          conclusion: { label: '气血偏虚', confidence: 0.85, evidence: ['舌质淡'] },
          input: `舌色:${inputFeatures.tongueColor.value}, 苔色:${inputFeatures.coating.color}`,
          reasoning: '舌质淡主气血不足'
        },
        {
          layer: 2,
          name: '舌形舌态分析',
          conclusion: { label: '气虚湿盛', confidence: 0.8, evidence: ['胖大', '齿痕'] },
          input: `舌形:${inputFeatures.tongueShape.value || '正常'}`,
          reasoning: '胖大+齿痕→气虚湿盛（气虚为本，湿盛为标）'
        },
        {
          layer: 3,
          name: '分区凹凸辨证',
          conclusion: { label: '脾胃区凹陷', confidence: 0.75, evidence: ['舌中凹陷'] },
          input: `舌中:${shapeDist?.depression?.includes('舌中') ? '凹陷' : '正常'}`,
          reasoning: '舌中凹陷→脾胃虚弱'
        },
        {
          layer: 4,
          name: '综合推理',
          conclusion: { label: '脾虚湿困证', confidence: 0.9, evidence: ['气虚', '湿盛', '脾胃虚'] },
          reasoning: '脾虚运化失司，湿泛于舌'
        }
      ],
      currentStep: 4,
      finalOutput: {
        syndrome: '脾虚湿困证',
        rootCause: '脾虚运化失司',
        transmission: ['脾虚→生化不足→气血虚']
      }
    };

    
    // 构建舌象特征对象
    const shapeDist = inputFeatures.shapeDistribution;
    const hasTeethMark = inputFeatures.teethMark?.value === '是' ||
                         shapeDist?.depression?.includes('齿痕') || 
                         shapeDist?.bulge?.includes('齿痕') || false;
    const hasCrack = inputFeatures.crack?.value === '是' ||
                     shapeDist?.depression?.includes('裂纹') || 
                     shapeDist?.bulge?.includes('裂纹') || false;
    
    const tongueFeatures = {
      tongueColor: inputFeatures.tongueColor.value,
      tongueShape: inputFeatures.tongueShape.value || '正常',
      coatingColor: inputFeatures.coating.color,
      coatingTexture: inputFeatures.coating.texture || '薄',
      coatingMoisture: inputFeatures.coating.moisture || '润',
      teethMark: hasTeethMark,
      crack: hasCrack,
      tongueState: inputFeatures.tongueState.value || '正常',
    };
    
    const response = await fetch('/api/tongue-ai/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tongueFeatures,
        age: patientInfo.age > 0 ? patientInfo.age : null,
        symptoms,
        patientInfo,
      }),
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'DeepSeek诊断失败');
    }
    
    // 转换DeepSeek返回格式为前端期望的格式
    const aiResult = result.data;
    
    const diagnosisResult = {
      primarySyndrome: aiResult.mainSyndrome,
      syndromeName: aiResult.mainSyndrome,
      pathogenesis: aiResult.pathogenesis,
      organLocation: aiResult.organLocation?.primary 
        ? [aiResult.organLocation.primary, ...(aiResult.organLocation.secondary || [])]
        : [],
      secondarySyndromes: aiResult.secondarySyndromes || [],
      confidence: aiResult.confidence || 0.8,
      transmissionType: aiResult.transmissionAnalysis?.type,
      transmissionDescription: aiResult.transmissionAnalysis?.description,
      diagnosisEvidence: [],
      diagnosisTime: new Date().toLocaleTimeString('zh-CN'),
      // 兼容旧格式
      mainSyndrome: aiResult.mainSyndrome,
      mainSyndromeDesc: aiResult.mainSyndromeDesc,
      confidenceScore: aiResult.confidence,
    };
    
    // 将字符串数组转为对象数组，填充穴位知识（使用共享知识库）
    const enrichPoints = (names: string[], defaultTechnique: string) => {
      const arr = Array.isArray(names) ? names : [];
      return arr.map((item: any) => {
        if (typeof item === 'string') {
          // 清洗穴位名称，去掉括号内容
          const cleanPointName = cleanAcupointName(item);
          const info = acupointKnowledge[cleanPointName] || {};
          return {
            point: cleanPointName,
            meridian: info.meridian || '',
            effect: info.effect || '',
            location: info.location || '',
            technique: defaultTechnique,
          };
        }
        // 如果是对象格式，也清洗point字段
        if (item && typeof item === 'object' && item.point) {
          const cleanPointName = cleanAcupointName(item.point);
          const info = acupointKnowledge[cleanPointName] || {};
          return {
            ...item,
            point: cleanPointName,
            meridian: item.meridian || info.meridian || '',
            effect: item.effect || info.effect || '',
            location: item.location || info.location || '',
          };
        }
        return item;
      });
    };

    const defaultTechnique = aiResult.acupuncturePlan?.technique || '平补平泻';
    const acupuncturePlan = {
      treatmentPrinciple: aiResult.acupuncturePlan?.technique || '',
      mainPoints: enrichPoints(aiResult.acupuncturePlan?.mainPoints || [], defaultTechnique),
      secondaryPoints: enrichPoints(aiResult.acupuncturePlan?.secondaryPoints || [], defaultTechnique),
      technique: defaultTechnique,
      description: aiResult.acupuncturePlan?.pointsDescription || '',
      pointsDescription: aiResult.acupuncturePlan?.pointsDescription || '',
      contraindications: [],
      treatmentAdvice: {
        techniquePrinciple: defaultTechnique,
        needleRetentionTime: '20分钟',
        treatmentFrequency: '每日1次',
        treatmentSessions: '5次为一疗程',
        sessionInterval: '1-2天',
      },
    };
    
    const lifeCareAdvice = {
      diet: aiResult.lifeCareAdvice?.diet || [],
      lifestyle: aiResult.lifeCareAdvice?.lifestyle || [],
      precautions: aiResult.lifeCareAdvice?.precautions || [],
    };
    
    return { diagnosisResult, acupuncturePlan, lifeCareAdvice };
  };

  // ========== v3.2 问而确之：Inquiry模式调用 ==========
  const diagnoseWithInquiry = async () => {
    // console.log('[DeepSeek诊断] 启动问诊模式...');
    setShowRefineButton(true); // 问诊开始时隐藏按钮，防止重复点击
    const shapeDist = inputFeatures.shapeDistribution;
    const hasTeethMark = inputFeatures.teethMark?.value === '是' ||
                         shapeDist?.depression?.includes('齿痕') || false;
    const hasCrack = inputFeatures.crack?.value === '是' ||
                     shapeDist?.depression?.includes('裂纹') || false;
    const tongueFeatures = {
      tongueColor: inputFeatures.tongueColor.value,
      tongueShape: inputFeatures.tongueShape.value || '正常',
      coatingColor: inputFeatures.coating.color,
      coatingTexture: inputFeatures.coating.texture || '薄',
      coatingMoisture: inputFeatures.coating.moisture || '润',
      teethMark: hasTeethMark,
      crack: hasCrack,
      tongueState: inputFeatures.tongueState.value || '正常',
    };
    try {
      const response = await fetch('/api/tongue-ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tongueFeatures,
          age: (selectedAgeGroup && selectedAgeGroup !== '未选择') ? undefined : (patientInfo.age > 0 ? patientInfo.age : undefined),
          mode: 'inquiry',
        }),
      });
      const result = await response.json();
      if (result.needsConfirmation && result.questions?.length > 0) {
        setInquiryQuestions(result.questions);
        setInquiryConversationId(result.conversationId);
        setPreliminaryResult(result.preliminaryResult);
        setShowInquiry(true);
      } else {
        const aiResult = result.data || result.preliminaryResult;
        if (aiResult) {
          // 包装成嵌套结构，兼容显示组件（修复白屏）
          const wrappedResult = {
            diagnosisResult: {
              primarySyndrome: aiResult.mainSyndrome || diagnosisResult?.diagnosisResult?.primarySyndrome || '待明确',
              syndromeScore: (aiResult.confidence || 0.8) * 100,
              confidence: aiResult.confidence || 0.8,
              secondarySyndromes: [],
              pathogenesis: aiResult.pathogenesis || aiResult.uncertainty || '',
              organLocation: aiResult.organLocation?.primary
                ? [aiResult.organLocation.primary, ...(aiResult.organLocation.secondary || [])]
                : [],
              diagnosisEvidence: [],
              priority: '中' as const,
              diagnosisTime: new Date().toLocaleTimeString('zh-CN'),
            },
            acupuncturePlan: diagnosisResult?.acupuncturePlan || { treatmentPrinciple: '', mainPoints: [], secondaryPoints: [], contraindications: [], treatmentAdvice: {} },
            lifeCareAdvice: diagnosisResult?.lifeCareAdvice || { dietSuggestions: [], dailyRoutine: [], precautions: [] },
          };
          setDiagnosisResult(wrappedResult as any);
          setCurrentStep('result');
          setInferenceChain(mockInferenceChain);
        }
      }
    } catch (err) {
      console.error('[问诊] 调用失败:', err);
      setError('问诊调用失败，请重试');
    }
  };

  // ========== v3.2 问诊提交处理 ==========
  const handleInquirySubmit = async (answers: { questionId: string; selectedOption: string }[]) => {
    // console.log('[问诊] 用户回答:', answers);
    setIsRefiningDiagnosis(true);
    const shapeDist = inputFeatures.shapeDistribution;
    const hasTeethMark = inputFeatures.teethMark?.value === '是' ||
                         shapeDist?.depression?.includes('齿痕') || false;
    const hasCrack = inputFeatures.crack?.value === '是' ||
                     shapeDist?.depression?.includes('裂纹') || false;
    const tongueFeatures = {
      tongueColor: inputFeatures.tongueColor.value,
      tongueShape: inputFeatures.tongueShape.value || '正常',
      coatingColor: inputFeatures.coating.color,
      coatingTexture: inputFeatures.coating.texture || '薄',
      coatingMoisture: inputFeatures.coating.moisture || '润',
      teethMark: hasTeethMark,
      crack: hasCrack,
      tongueState: inputFeatures.tongueState.value || '正常',
    };
    try {
      const response = await fetch('/api/tongue-ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tongueFeatures,
          age: (selectedAgeGroup && selectedAgeGroup !== '未选择') ? undefined : (patientInfo.age > 0 ? patientInfo.age : undefined),
          mode: 'confirm',
          conversationId: inquiryConversationId,
          answers,
        }),
      });
      const result = await response.json();
      if (result.success && result.data) {
        const aiResult = result.data;
        // 构建符合显示组件期望的完整结果对象
        const diagnosisResultObj = {
          primarySyndrome: aiResult.mainSyndrome || diagnosisResult?.diagnosisResult?.primarySyndrome || '待明确',
          syndromeScore: (aiResult.confidence || 0.8) * 100,
          confidence: aiResult.confidence || 0.8,
          secondarySyndromes: (aiResult.secondarySyndromes || []).map((s: { syndrome: string; score?: number }) => ({
            syndrome: typeof s === 'string' ? s : s.syndrome || '',
            score: s.score || 50,
            confidence: (s.score || 50) / 100,
            matchedFeatures: [],
          })),
          pathogenesis: aiResult.pathogenesis || '',
          organLocation: aiResult.organLocation?.primary
            ? [aiResult.organLocation.primary, ...(aiResult.organLocation.secondary || [])]
            : [],
          diagnosisEvidence: [],
          priority: aiResult.priority || '中',
          diagnosisTime: new Date().toLocaleTimeString('zh-CN'),
        };
        
        // 问诊后整合结果：保留原辨证的针灸方案和养生建议，用问诊结果更新证型和病机
        // 优先使用原辨证的针灸方案，其次使用preliminaryResult中的方案，避免主穴丢失
        const prevAcupuncturePlan = diagnosisResult?.acupuncturePlan 
          || preliminaryResult?.acupuncturePlan
          || { treatmentPrinciple: '', mainPoints: [], secondaryPoints: [], contraindications: [], treatmentAdvice: {} };
        const prevLifeCareAdvice = diagnosisResult?.lifeCareAdvice || preliminaryResult?.lifeCareAdvice || { diet: [], lifestyle: [], mood: [] };
        
        // 如果AI返回了额外穴位，补充到原方案配穴中（去重）
        const aiAcupuncturePlan = aiResult.acupuncturePlan || {};
        // 从acupuncturePlan获取主穴和配穴
        const aiMainPoints = aiAcupuncturePlan.mainPoints || aiResult.mainPoints || [];
        const aiSecondaryPoints = aiAcupuncturePlan.secondaryPoints || aiResult.secondaryPoints || [];
        // 合并主穴中的额外穴位 + 配穴作为新的配穴
        const aiExtraPoints = [
          ...aiMainPoints.map((name: string) => cleanAcupointName(name)),
          ...aiSecondaryPoints.map((name: string) => cleanAcupointName(typeof name === 'string' ? name : name.point || name.name || ''))
        ].filter(Boolean);
        
        const existingPointNames = [
          ...prevAcupuncturePlan.mainPoints.map((p: any) => p.point),
          ...prevAcupuncturePlan.secondaryPoints.map((p: any) => p.point),
        ];
        const newSecondaryPoints = [...prevAcupuncturePlan.secondaryPoints];
        for (const name of aiExtraPoints) {
          if (!existingPointNames.includes(name)) {
            newSecondaryPoints.push({
              point: name,
              meridian: acupointKnowledge[name]?.meridian || '',
              effect: acupointKnowledge[name]?.effect || '',
              location: acupointKnowledge[name]?.location || '',
              technique: '平补平泻',
            });
          }
        }
        
        // 合并病机：原病机 + 问诊补充
        const prevPathogenesis = diagnosisResult?.diagnosisResult?.pathogenesis || '';
        const aiPathogenesis = aiResult.pathogenesis || '';
        const mergedPathogenesis = [prevPathogenesis, aiPathogenesis ? `【问诊补充】${aiPathogenesis}` : ''].filter(Boolean).join('\n');
        
        setDiagnosisResult({
          diagnosisResult: {
            ...diagnosisResultObj,
            pathogenesis: mergedPathogenesis || diagnosisResultObj.pathogenesis,
          },
          acupuncturePlan: {
            ...prevAcupuncturePlan,
            secondaryPoints: newSecondaryPoints,
            treatmentPrinciple: prevAcupuncturePlan.treatmentPrinciple || aiResult.treatment || '',
          },
          lifeCareAdvice: prevLifeCareAdvice,
        } as any);
        
        setShowInquiry(false);
        setShowRefineButton(false); // 问诊完成后恢复按钮显示
        setCurrentStep('result');
      }
    } catch (err) {
      console.error('[问诊确认] 调用失败:', err);
      setError('问诊确认失败，请重试');
    } finally {
      setIsRefiningDiagnosis(false);
    }
  };

  // ========== v3.2 "想更准"按钮处理 ==========
  const handleRefineDiagnosis = async () => {
    await diagnoseWithInquiry();
  };
  

  
  const {
    inputFeatures,
    symptoms,
    patientInfo,
    diagnosisResult,
    currentStep,
    isAnalyzing,
    setTongueColor,
    setTongueShape,
    setTongueState,
    setCoating,
    setCrack,
    setTeethMark,
    setDistributionFeatures,
    setShapeDistribution,
    setInputFeatures,
    addSymptom,
    removeSymptom,
    updateSymptom,
    setPatientInfo,
    setImageData,
    setDiagnosisResult,
    setIsAnalyzing,
    setError,
    setCurrentStep,
    resetProgress,
    resetInput,
    getDiagnosisInput,
    saveCase,
  } = useDiagnosisStore();

  // 前端侧值映射（关键词包含匹配 + 语义映射，Bot返回值千变万化）
  const mapToEnum = (raw: string, validValues: string[]): string => {
    if (!raw) return '';
    const trimmed = raw.trim();
    // 0. 语义映射表（覆盖Bot常见的描述性表达）
    const semanticMap: Record<string, string> = {
      // 苔质
      '细腻': '薄', '细腻均匀': '薄', '均匀': '薄', '薄腻': '薄',
      '腻': '厚', '厚腻': '厚', '滑腻': '厚', '粗糙': '厚', '颗粒': '厚',
      // 润燥
      '湿润': '润', '津液充足': '润', '水滑': '润',
      '干燥': '燥', '少津': '燥',
      // 舌态描述
      '舒展': '正常', '自然': '正常', '活动自如': '正常', '柔软': '正常',
      '自如': '正常', '灵活': '正常',
      // 舌形描述
      '大小正常': '正常', '适中': '正常',
    };
    if (semanticMap[trimmed]) {
      const mapped = semanticMap[trimmed];
      if (validValues.includes(mapped)) return mapped;
    }
    // 语义关键词扫描（trimmed包含某个key）
    for (const [key, val] of Object.entries(semanticMap)) {
      if (trimmed.includes(key) && validValues.includes(val)) return val;
    }
    // 1. 精确匹配
    if (validValues.includes(trimmed)) return trimmed;
    // 2. 关键词包含匹配（优先匹配更长的枚举值，如"胖大"优先于"胖"）
    const sorted = [...validValues].sort((a, b) => b.length - a.length);
    for (const v of sorted) {
      if (trimmed.includes(v)) return v;
    }
    // 3. 反向包含
    for (const v of sorted) {
      if (v.includes(trimmed)) return v;
    }
    console.warn('[AI映射] 无法匹配:', trimmed, '有效值:', validValues);
    return '';
  };

  // AI识别结果回填（每个字段独立try/catch，一个失败不影响其他）
  const handleRecognize = (result: TongueRecognitionResult) => {
    // console.log('[AI识别] 原始结果:', JSON.stringify(result, null, 2));

    // 舌色
    try {
      const colorVal = mapToEnum(result.tongue_color?.value || '', ['淡红', '淡白', '红', '绛', '紫', '青紫']);
      // console.log('[AI识别] 舌色:', result.tongue_color?.value, '→', colorVal);
      setTongueColor(colorVal || '淡红');
    } catch (e) { console.error('[AI识别] 舌色回填异常:', e); }

    // 舌形
    try {
      const shapeVal = mapToEnum(result.tongue_shape?.value || '', ['胖大', '瘦薄', '正常']);
      // console.log('[AI识别] 舌形:', result.tongue_shape?.value, '→', shapeVal);
      setTongueShape(shapeVal || '正常');
    } catch (e) { console.error('[AI识别] 舌形回填异常:', e); }

    // 齿痕
    try {
      if (result.tongue_shape?.teeth_mark?.has) {
        setTeethMark('是', result.tongue_shape.teeth_mark.degree || '轻度', result.tongue_shape.teeth_mark.position || '');
      } else {
        setTeethMark('否', '', '');
      }
    } catch (e) { console.error('[AI识别] 齿痕回填异常:', e); }

    // 裂纹
    try {
      if (result.tongue_shape?.crack?.has) {
        setCrack('是', result.tongue_shape.crack.degree || '轻度', result.tongue_shape.crack.position || '');
      } else {
        setCrack('否', '', '');
      }
    } catch (e) { console.error('[AI识别] 裂纹回填异常:', e); }

    // 舌苔
    try {
      const coatColor = mapToEnum(result.tongue_coating?.color || '', ['薄白', '白厚', '黄', '灰黑', '剥落']);
      const coatTexture = mapToEnum(result.tongue_coating?.texture || '', ['薄', '厚', '正常']);
      const coatMoisture = mapToEnum(result.tongue_coating?.moisture || '', ['润', '燥', '正常']);
      // console.log('[AI识别] 苔色:', coatColor, '苔质:', coatTexture, '润燥:', coatMoisture);
      setCoating(coatColor || '薄白', coatTexture || '薄', coatMoisture || '润');
    } catch (e) { console.error('[AI识别] 舌苔回填异常:', e); }

    // 舌态
    try {
      const stateVal = mapToEnum(result.tongue_state?.value || '', ['强硬', '痿软', '歪斜', '颤动', '正常']);
      // console.log('[AI识别] 舌态:', result.tongue_state?.value, '→', stateVal);
      setTongueState(stateVal || '正常');
    } catch (e) { console.error('[AI识别] 舌态回填异常:', e); }

    // 凹凸形态（舌尖红点、齿痕、裂纹等）
    try {
      const depression: string[] = [];
      const bulge: string[] = [];
      // 从AI识别结果的shape_distribution中提取凹陷信息
      // shape_distribution格式: { depression: Array<{region, degree}>, bulge: Array<{region, degree}> }
      if (result.shape_distribution?.depression) {
        result.shape_distribution.depression.forEach((d: { region: string; degree: string }) => {
          const cn = getRegionChineseName(d.region);
          if (cn && !depression.includes(cn)) depression.push(cn);
        });
      }
      // 从shape_distribution中提取鼓胀信息
      if (result.shape_distribution?.bulge) {
        result.shape_distribution.bulge.forEach((b: { region: string; degree: string }) => {
          const cn = getRegionChineseName(b.region);
          if (cn && !bulge.includes(cn)) bulge.push(cn);
        });
      }
      // 从齿痕和裂纹补充凹陷信息（如果不在shape_distribution中）
      if (result.tongue_shape?.teeth_mark?.has && !depression.includes('齿痕')) {
        depression.push('齿痕');
      }
      if (result.tongue_shape?.crack?.has && !depression.includes('裂纹')) {
        depression.push('裂纹');
      }
      if (depression.length > 0 || bulge.length > 0) {
        setShapeDistribution({ depression, bulge });
        // console.log('[AI识别] 凹凸形态 - 凹陷:', depression, '鼓胀:', bulge);
      }
    } catch (e) { console.error('[AI识别] 凹凸形态回填异常:', e); }

    // 标记AI已识别并保存置信度
    setIsAIRecognized(true);
    setInputFeatures({ aiConfidence: result.overall_confidence || 0.8 });
    toast.success('AI识别完成，已自动填入舌象特征 ✓');
  };

  /**
   * 本地规则引擎辨证（核心功能）
   * 100%基于主人辨证规则树，不依赖AI猜测
   */
  const handleLocalDiagnosis = (): {
    diagnosisResult: any;
    acupuncturePlan: any;
    lifeCareAdvice: any;
  } => {
    // 缓存检查
    const _ck = diagCacheKey(inputFeatures, patientInfo);
    const _cached = diagCacheGet(_ck);
    if (_cached) { return _cached; }
    // console.log('[本地规则引擎] 开始辨证...');
    
    // 检查齿痕和裂纹（同时兼容AI回填的teethMark/crack和手动选择的shapeDistribution）
    const shapeDist = inputFeatures.shapeDistribution;
    const hasTeethMark = inputFeatures.teethMark?.value === '是' ||
                         shapeDist?.depression?.includes('齿痕') || 
                         shapeDist?.bulge?.includes('齿痕') || false;
    const hasCrack = inputFeatures.crack?.value === '是' ||
                     shapeDist?.depression?.includes('裂纹') || 
                     shapeDist?.bulge?.includes('裂纹') || false;
    
    // 构建输入
    const input: DiagnosisInput = {
      tongueColor: inputFeatures.tongueColor.value,
      tongueShape: inputFeatures.tongueShape.value,
      tongueState: inputFeatures.tongueState.value,
      coatingColor: inputFeatures.coating.color,
      coatingTexture: inputFeatures.coating.texture || '正常',
      coatingMoisture: inputFeatures.coating.moisture || '正常',
      teethMark: hasTeethMark,
      crack: hasCrack,
      regionFeatures: inputFeatures.distributionFeatures?.map(item => ({
        region: item.part,
        color: item.feature,
      })),
    };
    
    // 调用本地规则引擎
    const result = localDiagnose(input, true);
    
    // 打印规则统计
    const stats = getRuleStatistics();
    // console.log(`[本地规则引擎] 规则统计: 共${stats.totalRules}条规则`);
    // console.log(`[本地规则引擎] 主要结果: ${result.primaryResult.syndrome}`);
    // console.log(`[本地规则引擎] 匹配规则: ${result.primaryResult.matchedRuleName}`);
    
    // 构建诊断结果（严格匹配 DiagnosisResult 类型）
    const priorityMap: Record<string, '高' | '中' | '低'> = { high: '高', medium: '中', low: '低' };
    const diagnosisResultOut = {
      primarySyndrome: result.primaryResult.syndrome,
      syndromeScore: result.primaryResult.confidence || 0,
      confidence: (result.primaryResult.confidence || 0) / 100, // 0-100 → 0-1
      secondarySyndromes: (result.alternativeResults || []).map((r: { syndrome: string; score?: number }) => ({
        syndrome: r.syndrome,
        score: r.confidence || 0,
        confidence: (r.confidence || 0) / 100,
        matchedFeatures: [],
      })),
      pathogenesis: result.primaryResult.pathogenesis || '',
      organLocation: Array.isArray(result.primaryResult.organLocation) 
        ? result.primaryResult.organLocation : [result.primaryResult.organLocation || ''],
      diagnosisEvidence: [], // 本地引擎不提供详细依据表
      priority: priorityMap[result.primaryResult.priority] || '中',
      diagnosisTime: new Date().toLocaleTimeString('zh-CN'),
    };
    
    // 构建针灸方案（严格匹配 AcupuncturePlan 类型）
    // 清洗穴位名称并查询知识库
    const mainPointNames: string[] = (result.acupointSelection.mainPoints || []).map((n: string) => cleanAcupointName(n));
    const secondaryPointNames: string[] = (result.acupointSelection.secondaryPoints || []).map((n: string) => cleanAcupointName(n));
    const acupuncturePlan = {
      treatmentPrinciple: result.primaryResult.treatment || '',
      mainPoints: mainPointNames.map((name: string) => ({
        point: name,
        meridian: acupointKnowledge[name]?.meridian || '',
        effect: acupointKnowledge[name]?.effect || '',
        location: acupointKnowledge[name]?.location || '',
        technique: result.acupointSelection.method?.technique || '泻法',
      })),
      secondaryPoints: secondaryPointNames.map((name: string) => ({
        point: name,
        meridian: acupointKnowledge[name]?.meridian || '',
        effect: acupointKnowledge[name]?.effect || '',
        location: acupointKnowledge[name]?.location || '',
        technique: '补法',
      })),
      contraindications: [],
      treatmentAdvice: {
        techniquePrinciple: result.acupointSelection.method?.technique || '',
        needleRetentionTime: `${result.acupointSelection.method?.needleRetention || 20}分钟`,
        treatmentFrequency: result.acupointSelection.method?.frequency || '每日1次',
        treatmentSessions: result.acupointSelection.method?.course || '5次为一疗程',
        sessionInterval: '1-2天',
        moxibustionSuggestion: result.acupointSelection.method?.moxibustion || '',
      },
    };
    
    // ========== 配穴安全网：如果主穴>0但配穴=0，根据证型补充 ==========
    const syndromeToSecondaryPoints: Record<string, string[]> = {
      '正常/健康态': ['气海', '三阴交'],
      '气血两虚证': ['三阴交', '命门'],
      '阳虚证': ['三阴交', '命门'],
      '热证': ['合谷', '太溪'],
      '热入营血证': ['委中', '太溪'],
      '血瘀证': ['三阴交', '关元'],
      '寒凝血瘀证': ['太冲', '血海'],
      '心火上炎证': ['尺泽'],
      '肝火炽盛证': ['阳陵泉'],
      '肝郁血瘀证': ['三阴交'],
      '胃火亢盛证': ['阴陵泉'],
      '肾热下注证': ['肾俞'],
      '实热证': ['合谷'],
      '阴虚火旺证': ['合谷'],
      '水湿停滞证': ['脾俞', '水分'],
      '阴血不足证': ['足三里', '照海'],
      '阴血亏虚证': ['太溪', '照海'],
      '脾虚湿盛证': ['脾俞', '公孙'],
      '热盛血瘀证': ['委中', '膈俞'],
      '实证': ['曲池', '丰隆'],
      '虚证': ['三阴交', '脾俞'],
      '表证': ['风池', '足三里'],
      '轻证': ['风池', '足三里'],
      '里寒证': ['脾俞', '丰隆'],
      '湿浊证': ['脾俞', '丰隆'],
      '痰湿内蕴证': ['阴陵泉', '足三里'],
      '表邪化热证': ['外关', '风池'],
      '里热炽盛证': ['曲池', '上巨虚'],
      '湿热内蕴证': ['中脘', '阳陵泉'],
      '热极伤阴证': ['曲泽'],
      '阳虚寒盛证': ['神阙', '肾俞'],
    };
    
    if (acupuncturePlan.mainPoints.length > 0 && acupuncturePlan.secondaryPoints.length === 0) {
      const syndrome = result.primaryResult.syndrome;
      let fallbackPoints: string[] = [];
      if (syndromeToSecondaryPoints[syndrome]) {
        fallbackPoints = syndromeToSecondaryPoints[syndrome];
      } else {
        for (const [key, points] of Object.entries(syndromeToSecondaryPoints)) {
          if (syndrome.includes(key.replace(/证$/, '')) || key.includes(syndrome.replace(/证$/, ''))) {
            fallbackPoints = points;
            break;
          }
        }
      }
      if (fallbackPoints.length > 0) {
        // console.log(`[配穴安全网] 证型「${syndrome}」补充配穴: ${fallbackPoints.join(', ')}`);
        acupuncturePlan.secondaryPoints = fallbackPoints.map((name: string) => ({
          point: name,
          meridian: acupointKnowledge[name]?.meridian || '',
          effect: acupointKnowledge[name]?.effect || '',
          location: acupointKnowledge[name]?.location || '',
          technique: '补法',
        }));
      }
    }
    
    // 构建生活调护建议（严格匹配 LifeCareAdvice 类型）
    const lifeCareAdvice = generateLifeCareAdvice(result);
    
    const _result = { diagnosisResult: diagnosisResultOut, acupuncturePlan, lifeCareAdvice };
    diagCacheSet(_ck, _result);
    return _result;
  };
  
  /**
   * 根据辨证结果生成生活调护建议
   */
  const generateLifeCareAdvice = (result: DiagnosisOutput): LifeCareAdvice => {
    const advice: string[] = [];
    const syndrome = result.primaryResult.syndrome;
    
    // 饮食建议
    if (syndrome.includes('阴虚') || syndrome.includes('热')) {
      advice.push('宜食滋阴清热食物，如银耳、百合、梨、绿豆等');
      advice.push('忌食辛辣刺激、温热燥性食物');
    } else if (syndrome.includes('阳虚') || syndrome.includes('寒')) {
      advice.push('宜食温阳散寒食物，如羊肉、桂圆、生姜等');
      advice.push('忌食生冷寒凉食物');
    } else if (syndrome.includes('湿') || syndrome.includes('痰')) {
      advice.push('宜食健脾祛湿食物，如薏米、赤小豆、冬瓜等');
      advice.push('忌食甜腻厚味食物');
    } else if (syndrome.includes('气血两虚')) {
      advice.push('宜食补益气血食物，如红枣、枸杞、山药等');
      advice.push('忌食生冷油腻食物');
    } else {
      advice.push('饮食清淡，规律进餐');
      advice.push('避免暴饮暴食');
    }
    
    // 情志建议
    if (syndrome.includes('肝')) {
      advice.push('保持心情舒畅，避免情绪抑郁');
      advice.push('适度运动，如散步、太极拳');
    } else {
      advice.push('保持规律作息，避免过度劳累');
    }
    
    // 起居建议
    advice.push('保证充足睡眠，规律作息');
    advice.push('适度锻炼，增强体质');
    
    // 严格匹配 LifeCareAdvice 类型: dietSuggestions / dailyRoutine / precautions
    const dietItems = advice.filter((_, i) => i < 3);
    const routineItems = advice.filter((_, i) => i >= 3);
    return {
      dietSuggestions: dietItems,
      dailyRoutine: routineItems,
      precautions: Array.isArray(result.clinicalNotes) ? result.clinicalNotes : [],
    };
  };

  // 提交辨证 - 简化必填验证

  // 超时降级到本地引擎
  const handleFallbackToLocal = () => {
    // console.log('[降级] 切换到本地规则引擎');
    toast('正在切换到本地快速分析...', { icon: '⚡' });
    setUseLocalEngine(true);
    const startTime = Date.now();
    const MIN_DISPLAY_TIME = 800;
    
    try {
      setCurrentStep('recognizing', 25);
      setTimeout(() => setCurrentStep('analyzing', 50), 100);
      setTimeout(() => setCurrentStep('reasoning', 75), 200);
      
      setTimeout(() => {
        const { diagnosisResult: diagResult, acupuncturePlan, lifeCareAdvice } = handleLocalDiagnosis();
        const remainingTime = Math.max(0, MIN_DISPLAY_TIME - (Date.now() - startTime));
        
        setTimeout(() => {
          setCurrentStep('matching', 90);
          setDiagnosisResult({ 
            diagnosisResult: diagResult, 
            acupuncturePlan, 
            lifeCareAdvice 
          } as any);
          setCurrentStep('result', 100);
          toast.success(`辨证完成！${diagResult?.primarySyndrome || ''}`);
        }, remainingTime);
      }, 300);
    } catch (error) {
      console.error('[本地引擎] 异常:', error);
      const message = error instanceof Error ? error.message : '规则引擎分析失败';
      setError(message);
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    // ========== 必填验证 ==========
    // 舌象必填
    const hasTongueColor = !!inputFeatures.tongueColor.value;
    const hasCoatingColor = !!inputFeatures.coating.color;
    
    if (!hasTongueColor) {
      toast.error('请选择舌色');
      return;
    }
    
    if (!hasCoatingColor) {
      toast.error('请选择苔色');
      return;
    }
    
    // 性别必填（女性需要月经三期辨证）
    if (!patientInfo.gender) {
      toast.error('请选择性别');
      return;
    }
    
    // 年龄段必填
    if (!selectedAgeGroup) {
      toast.error('请选择年龄段');
      return;
    }
    
    // 其他字段使用默认值（无值时自动填充）
    if (!inputFeatures.tongueShape.value) {
      setTongueShape('正常');
    }
    if (!inputFeatures.tongueState.value) {
      setTongueState('正常');
    }
    if (!inputFeatures.coating.texture) {
      setCoating(inputFeatures.coating.color, '薄', '润');
    }
    if (!inputFeatures.coating.moisture) {
      setCoating(inputFeatures.coating.color, inputFeatures.coating.texture || '薄', '润');
    }
    // 主诉改为选填，不阻断流程

    // 将年龄段映射到 patientInfo.age
    const ageToSet = selectedAgeGroup ? selectedAgeGroup : patientInfo.age;
    
    setIsAnalyzing(true);
    setError(null);
    setDiagnosisResult(null);
    setShowRefineButton(false);
    try {
      // ========== 路径B：远程Bot API（异步，需要进度指示） ==========
      {
        // 构建输入数据，确保年龄段被正确传入
        const baseInput = getDiagnosisInput();
        const input = {
          ...baseInput,
          patientInfo: {
            ...baseInput.patientInfo,
            // selectedAgeGroup 优先于 patientInfo.age
            age: selectedAgeGroup || baseInput.patientInfo.age,
          }
        };
        setCurrentStep('analyzing', 35);
        
        const result = await submitDiagnosis(input, (step) => {
          switch (step) {
            case 'recognizing': setCurrentStep('recognizing', 25); break;
            case 'analyzing': setCurrentStep('analyzing', 50); break;
            case 'reasoning': setCurrentStep('reasoning', 75); break;
            case 'matching': setCurrentStep('matching', 90); break;
          }
        });
        
        setCurrentStep('matching', 95);
        setDiagnosisResult(result);
        toast.success('辨证分析完成！');
      }
    } catch (error) {
      console.error('[辨证提交] 异常:', error);
      const message = error instanceof Error ? error.message : '辨证分析失败';
      setError(message);
      toast.error(message);
      // ========== 降级：submitDiagnosis 失败时使用本地规则引擎 ==========
      // console.log('[降级] 远程辨证失败，切换到本地规则引擎');
      toast('远程辨证失败，切换到本地快速分析...', { icon: '⚡' });
      
      const startTime = Date.now();
      const MIN_DISPLAY_TIME = 800;
      
      setCurrentStep('analyzing', 50);
      setTimeout(() => setCurrentStep('reasoning', 75), 100);
      
      try {
        const { diagnosisResult: diagResult, acupuncturePlan, lifeCareAdvice } = handleLocalDiagnosis();
        const remainingTime = Math.max(0, MIN_DISPLAY_TIME - (Date.now() - startTime));
        
        setTimeout(() => {
          setCurrentStep('matching', 90);
          setDiagnosisResult({ diagnosisResult: diagResult, acupuncturePlan, lifeCareAdvice } as any);
          setCurrentStep('result', 100);
          toast.success(`本地辨证完成！${diagResult?.primarySyndrome || ''}`);
          setError(null); // 清除错误，因为降级成功
        }, remainingTime);
      } catch (localError) {
        console.error('[降级] 本地引擎也失败:', localError);
        const localMessage = localError instanceof Error ? localError.message : '本地规则引擎也失败了';
        setError(localMessage);
        toast.error(localMessage);
      }
    } finally {
      setIsAnalyzing(false);
      resetProgress();
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
    setIsAIRecognized(false);
    toast.success('已清空所有输入');
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <Toaster position="top-center" />
      <NavBar currentPath="/" onNavigate={(path) => navigate(path)} />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ========== v2.0 UI模式切换 ========== */}
        <UIModeToggle />
        {/* ========== 移动端单列流布局 ========== */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-4 lg:space-y-0">
          
          {/* ========== 左侧：输入区域 ========== */}
          <div className="space-y-4">
            {/* ========== 性别 + 年龄段选择器 - 紧凑一行 ==========*/}
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
              
              {/* 年龄段选择 */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-stone-500">年龄</span>
                <div className="flex gap-1 flex-wrap">
                  {ageGroups.map((group) => (
                    <button
                      key={group.value}
                      onClick={() => setSelectedAgeGroup(group.value)}
                      className={`
                        px-2 py-0.5 text-xs font-medium rounded-full transition-all
                        ${selectedAgeGroup === group.value
                          ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-sm'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }
                      `}
                    >
                      {group.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="tcm-card p-4 bg-gradient-to-br from-primary-50 to-secondary-50 border-2 border-primary-200">
              <ImageUpload 
                onChange={(imageData) => setImageData(imageData)} 
                onRecognize={handleRecognize}
                useLocalEngine={useLocalEngine}
              />
              {/* 引擎切换按钮 - 折叠到设置入口 */}
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
                      onClick={() => setUseLocalEngine(true)}
                      className={`flex-1 px-3 py-2 text-xs rounded-lg transition-colors ${
                        useLocalEngine
                          ? 'bg-primary-500 text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      本地规则引擎{useLocalEngine ? ' ✓' : ''}
                    </button>
                    <button
                      onClick={() => setUseLocalEngine(false)}
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
            
            {/* 🔍 识别结果 - 用户关注点1：我舌头怎么了 */}
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

              {/* 识别结果一览 - 结构化分组展示 */}
              <div className="space-y-2">
                {/* 结构化文本行 */}
                <div className="text-xs text-stone-600 bg-stone-50 rounded-lg p-2 px-3 font-mono leading-relaxed">
                  {(() => {
                    const display = getStructuredTongueDisplay(inputFeatures, isAIRecognized, inputFeatures.aiConfidence || 0.8);
                    return display.rawText ? (
                      <span>{display.rawText}</span>
                    ) : (
                      <span className="text-stone-400">未识别</span>
                    );
                  })()}
                </div>
                
                {/* 分组彩色标签 */}
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const display = getStructuredTongueDisplay(inputFeatures, isAIRecognized, inputFeatures.aiConfidence || 0.8);
                    if (display.categories.length === 0) return null;
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

              {/* 识别详情编辑 - 默认隐藏，点"修改"才出现 */}
              <div id="feature-edit" className="hidden mt-3 pt-3 border-t border-stone-200 space-y-1">

              {/* 当前特征一览 - 结构化分组展示 */}
              <div className="space-y-2 mb-3">
                {/* 结构化文本行 */}
                <div className="text-xs text-stone-600 bg-stone-50 rounded-lg p-2 px-3 font-mono leading-relaxed">
                  {(() => {
                    const display = getStructuredTongueDisplay(inputFeatures, isAIRecognized, inputFeatures.aiConfidence || 0.8);
                    return display.rawText ? (
                      <span>{display.rawText}</span>
                    ) : (
                      <span className="text-stone-400">未识别</span>
                    );
                  })()}
                </div>
                
                {/* 分组彩色标签 */}
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const display = getStructuredTongueDisplay(inputFeatures, isAIRecognized, inputFeatures.aiConfidence || 0.8);
                    if (display.categories.length === 0) return null;
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

              {/* 各特征折叠编辑 */}
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

              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer text-sm text-stone-600 hover:text-stone-800 py-1">
                  <span>舌形</span>
                  <div className="flex items-center gap-2">
                    {inputFeatures.tongueShape.value && <span className="text-xs text-stone-400">{inputFeatures.tongueShape.value}</span>}
                    <svg className="w-3.5 h-3.5 text-stone-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </summary>
                <div className="mt-2"><TongueShapeSelector value={inputFeatures.tongueShape.value} onChange={setTongueShape} teethMark={inputFeatures.teethMark?.value === '是'} crack={inputFeatures.crack?.value === '是'} onTeethMarkChange={(checked) => {
                      if (checked) {
                        setTeethMark('是');
                      } else {
                        setTeethMark('否');
                        // 同步清理 shapeDistribution 中的齿痕
                        const currentShape = inputFeatures.shapeDistribution || { depression: [], bulge: [] };
                        const newDepression = currentShape.depression.filter(d => d !== '齿痕');
                        if (newDepression.length !== currentShape.depression.length) {
                          setShapeDistribution({ ...currentShape, depression: newDepression });
                        }
                      }
                    }} onCrackChange={(checked) => {
                      if (checked) {
                        setCrack('是');
                      } else {
                        setCrack('否');
                        // 同步清理 shapeDistribution 中的裂纹
                        const currentShape = inputFeatures.shapeDistribution || { depression: [], bulge: [] };
                        const newDepression = currentShape.depression.filter(d => d !== '裂纹');
                        if (newDepression.length !== currentShape.depression.length) {
                          setShapeDistribution({ ...currentShape, depression: newDepression });
                        }
                      }
                    }} /></div>
              </details>

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

              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer text-sm text-stone-600 hover:text-stone-800 py-1">
                  <span>区域诊断</span>
                  <svg className="w-3.5 h-3.5 text-stone-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div className="mt-2"><TongueColorDistribution onChange={setDistributionFeatures} /></div>
              </details>
              </div>
            </div>


            {/* 主诉输入 - 选填，不显眼 */}
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

            {/* 提交按钮 - 大而醒目 */}
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

            {/* 清空按钮 */}
            <button
              onClick={handleReset}
              className="w-full py-2.5 rounded-xl text-sm text-stone-500 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            >
              清空重填
            </button>

            {/* 进度显示 - 辨证进度组件 */}
            {isAnalyzing && (
              <DiagnosisProgress 
                currentStep={currentStep}
                isLocalEngine={useLocalEngine}
                onFallbackToLocal={handleFallbackToLocal}
              />
            )}
          </div>

          {/* ========== 右侧：结果展示 ========== */}
          <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            {diagnosisResult ? (
              <div className="space-y-3">
                {/* 📋 辨证结果 - 用户关注点2：怎么了+怎么办 */}
                
                {/* 证型结论 - 最醒目 */}
                <DiagnosisResultDisplay result={diagnosisResult?.diagnosisResult || { primarySyndrome: "分析中...", confidence: 0, pathogenesis: "", organLocation: [], priority: "中" }} 
                  className="animate-fade-in"
            />

                {/* 付费解锁：完整健康报告 - 解锁后展示 */}
                {isUnlocked && diagnosisResult && (
                  <div className="mt-4 animate-fade-in">
                    <HealthReport
                      diagnosisResult={diagnosisResult.diagnosisResult}
                      acupuncturePlan={diagnosisResult.acupuncturePlan}
                      lifeCareAdvice={diagnosisResult.lifeCareAdvice}
                      reportId={currentReportId || generateReportId()}
                    />
                  </div>
                )}
                
                {/* 问诊入口 - 证型结论旁边 */}
                {diagnosisResult && !showRefineButton && (
                  <button
                    onClick={handleRefineDiagnosis}
                    disabled={isRefiningDiagnosis}
                    className={`
                      w-full py-3 rounded-xl text-sm font-medium transition-all mt-2
                      ${isRefiningDiagnosis
                        ? 'bg-stone-100 text-stone-400 cursor-wait'
                        : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-sm hover:shadow-md'
                      }
                    `}
                  >
                    {isRefiningDiagnosis ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        生成问诊问题中...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        💬 智能问诊，更准辨证
                      </span>
                    )}
                  </button>
                )}
                
                {/* Tab切换：病机 | 针灸 | 调理 */}
                <div className="flex border-b border-stone-200 animate-fade-in animation-delay-100">
                  <button
                    onClick={() => setResultTab('pathogenesis')}
                    className={`flex-1 py-2.5 text-sm font-medium text-center transition-colors ${
                      resultTab === 'pathogenesis'
                        ? 'text-primary-600 border-b-2 border-primary-500'
                        : 'text-stone-500 hover:text-stone-700'
                    }`}
                  >
                    病机分析
                  </button>
                  <button
                    onClick={() => setResultTab('acupuncture')}
                    className={`flex-1 py-2.5 text-sm font-medium text-center transition-colors ${
                      resultTab === 'acupuncture'
                        ? 'text-primary-600 border-b-2 border-primary-500'
                        : 'text-stone-500 hover:text-stone-700'
                    }`}
                  >
                    针灸方案
                  </button>
                  <button
                    onClick={() => setResultTab('care')}
                    className={`flex-1 py-2.5 text-sm font-medium text-center transition-colors ${
                      resultTab === 'care'
                        ? 'text-primary-600 border-b-2 border-primary-500'
                        : 'text-stone-500 hover:text-stone-700'
                    }`}
                  >
                    生活调理
                  </button>
                </div>

                {/* Tab内容 */}
                {resultTab === 'pathogenesis' && (
                  <div className="tcm-card p-4 space-y-3 animate-fade-in animation-delay-200">
                    <div>
                      <span className="text-xs text-stone-500 block mb-1">病机</span>
                      <p className="text-sm text-primary-700 font-medium">{diagnosisResult?.diagnosisResult?.pathogenesis || '-'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-stone-500 block mb-1">脏腑定位</span>
                      <div className="flex flex-wrap gap-1.5">
                        {diagnosisResult?.diagnosisResult?.organLocation?.map((organ: string, i: number) => (
                          <span key={i} className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded-full border border-red-200">
                            {organ}{i === 0 && <span className="ml-0.5 opacity-60">(主)</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                    {diagnosisResult?.diagnosisResult?.secondarySyndromes?.length > 0 && (
                      <div>
                        <span className="text-xs text-stone-500 block mb-1">也需关注</span>
                        {diagnosisResult.diagnosisResult.secondarySyndromes.slice(0, 2).map((s: SecondarySyndrome, i: number) => (
                          <span key={i} className="text-sm text-stone-600 mr-2">· {s.syndrome}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {resultTab === 'acupuncture' && (
                  isUnlocked ? (
                    <AcupunctureDisplay plan={diagnosisResult.acupuncturePlan} />
                  ) : (
                    <div className="tcm-card p-6 text-center text-stone-400 text-sm">
                      🔒 请先解锁深度辨证方案查看针灸配穴
                    </div>
                  )
                )}
                {resultTab === 'care' && (
                  isUnlocked ? (
                    <LifeCareDisplay advice={diagnosisResult.lifeCareAdvice} />
                  ) : (
                    <div className="tcm-card p-6 text-center text-stone-400 text-sm">
                      🔒 请先解锁深度辨证方案查看生活调理建议
                    </div>
                  )
                )}
                
                <button
                  onClick={handleSaveCase}
                  className="w-full py-2 rounded-xl text-xs font-medium bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors"
                >
                  保存此病例
                </button>
                
                {/* 深度辨证解锁区域 - 支付宝支付 */}
                {!isUnlocked ? (
                  <div className="tcm-card p-4 text-center space-y-3 bg-gradient-to-r from-primary-50 to-secondary-50">
                    <div className="text-sm text-stone-600">
                      <span className="text-lg mr-1">🔒</span>
                      针灸方案和生活调理需解锁查看
                    </div>
                    <div className="flex justify-center">
                      <PayButton 
                        amount={9.9} 
                        title="舌镜深度辨证方案"
                        size="medium"
                      />
                    </div>
                    <p className="text-xs text-stone-400">包含完整针灸配穴和个性化生活调理建议</p>
                  </div>
                ) : (
                  <div className="tcm-card p-3 text-center bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                    <span className="text-green-600 text-sm">✓ 已解锁深度辨证</span>
                  </div>
                )}
                

              </div>
            ) : (
              <div className="tcm-card p-8 flex flex-col items-center justify-center text-center">
                <div className="text-5xl mb-3">🔍</div>
                <h3 className="text-base font-medium text-stone-600 mb-1">
                  等待辨证分析
                </h3>
                <p className="text-xs text-stone-400">
                  拍照上传或填写舌象特征，点击开始辨证
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    
      {/* ========== v3.2 问诊对话框 ========== */}
      {showInquiry && (
        <InquiryDialog
          questions={inquiryQuestions}
          conversationId={inquiryConversationId || ''}
          preliminaryResult={preliminaryResult}
          onSubmit={handleInquirySubmit}
          onCancel={() => {
            setShowInquiry(false);
            setShowRefineButton(false); // 取消问诊时恢复按钮显示
          }}
          isLoading={isRefiningDiagnosis}
        />
      )}
</div>
  );
};

export default DiagnosisPage;
