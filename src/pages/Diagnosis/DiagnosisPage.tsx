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
import PatientInfoForm from '@/components/tongue-input/PatientInfoForm';
import DiagnosisResultDisplay from '@/components/result-display/DiagnosisResultDisplay';
import AcupunctureDisplay from '@/components/result-display/AcupunctureDisplay';
import LifeCareDisplay from '@/components/result-display/LifeCareDisplay';
import InquiryDialog, { InquiryQuestion } from '@/components/InquiryDialog';
import { useDiagnosisStore } from '@/stores/diagnosisStore';
import { submitDiagnosis } from '@/services/api';
import { TongueRecognitionResult } from '@/services/tongueAI';
import { 
  diagnose as localDiagnose, 
  DiagnosisInput,
  getRuleStatistics,
} from '@/services/diagnosisEngine';

const DiagnosisPage: React.FC = () => {
  const navigate = useNavigate();
  // 版本标记 - v1.3.0 UI优化版
  console.log('[舌镜] 版本: v3.0.0 方案A-DeepSeek推理');
  // 社会证明 - v2.5
  const [userCount] = useState(12847);

  // 社会证明Banner
  const SocialProofBanner = () => (
    <div className="flex flex-wrap items-center justify-center gap-4 py-2 px-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-b border-emerald-100">
      <div className="flex items-center gap-1.5 text-xs text-stone-600">
        <span className="text-lg">👥</span>
        <span>舌镜已服务 <span className="font-semibold text-emerald-600">{userCount.toLocaleString()}</span> 人</span>
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


  const [resultTab, setResultTab] = useState<'pathogenesis' | 'acupuncture' | 'care'>('pathogenesis');

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
  const [useLocalEngine, setUseLocalEngine] = useState(false);
  const [showEngineSwitch, setShowEngineSwitch] = useState(false);
  const [isAIRecognized, setIsAIRecognized] = useState(false);
  
  /**
   * DeepSeek API辨证推理 v3.0
   * 调用舌镜AI诊断接口
   */
  const diagnoseWithDeepSeek = async () => {
    console.log('[DeepSeek诊断] 开始AI辨证推理...');
    
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
        age: patientInfo.age,
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
    
    // 穴位知识库：名称→经脉/功效/定位映射
    const acupointKnowledge: Record<string, { meridian: string; effect: string; location: string }> = {
      '太冲': { meridian: '足厥阴肝经', effect: '疏肝理气、降血压', location: '足背第1、2跖骨结合部前方凹陷处' },
      '行间': { meridian: '足厥阴肝经', effect: '清肝泻火', location: '足背第1、2趾间缝纹端' },
      '肝俞': { meridian: '足太阳膀胱经', effect: '疏肝理气、养血明目', location: '第9胸椎棘突下旁开1.5寸' },
      '期门': { meridian: '足厥阴肝经', effect: '疏肝理气、和胃降逆', location: '乳头直下第6肋间隙' },
      '膻中': { meridian: '任脉', effect: '宽胸理气、止咳平喘', location: '前正中线两乳头连线中点' },
      '内关': { meridian: '手厥阴心包经', effect: '宁心安神、和胃止呕', location: '腕横纹上2寸两筋间' },
      '足三里': { meridian: '足阳明胃经', effect: '健脾和胃、补中益气', location: '犊鼻下3寸胫骨前嵴外1横指' },
      '脾俞': { meridian: '足太阳膀胱经', effect: '健脾化湿、和胃止泻', location: '第11胸椎棘突下旁开1.5寸' },
      '中脘': { meridian: '任脉', effect: '和胃健脾、降逆利水', location: '前正中线脐上4寸' },
      '阴陵泉': { meridian: '足太阴脾经', effect: '健脾利湿、通利三焦', location: '胫骨内侧髁后下方凹陷处' },
      '三阴交': { meridian: '足太阴脾经', effect: '健脾益血、调肝补肾', location: '内踝尖上3寸胫骨内侧后缘' },
      '曲池': { meridian: '手阳明大肠经', effect: '清热解表、疏经活络', location: '屈肘肘横纹桡侧端凹陷处' },
      '内庭': { meridian: '足阳明胃经', effect: '清胃泻火', location: '足背第2、3趾间缝纹端' },
      '合谷': { meridian: '手阳明大肠经', effect: '镇痛安神、通经活络', location: '手背第1、2掌骨间第2掌骨桡侧中点' },
      '气海': { meridian: '任脉', effect: '补气固本、温阳益气', location: '前正中线脐下1.5寸' },
      '关元': { meridian: '任脉', effect: '补肾助阳、温固下元', location: '前正中线脐下3寸' },
      '膈俞': { meridian: '足太阳膀胱经', effect: '理血宽胸、降逆止呕', location: '第7胸椎棘突下旁开1.5寸' },
      '太溪': { meridian: '足少阴肾经', effect: '滋阴补肾、清虚热', location: '内踝尖与跟腱之间凹陷处' },
      '照海': { meridian: '足少阴肾经', effect: '滋阴清热、调经安神', location: '内踝尖下方凹陷处' },
      '肾俞': { meridian: '足太阳膀胱经', effect: '温补肾阳、益精填髓', location: '第2腰椎棘突下旁开1.5寸' },
      '心俞': { meridian: '足太阳膀胱经', effect: '宁心安神、宽胸理气', location: '第5胸椎棘突下旁开1.5寸' },
      '血海': { meridian: '足太阴脾经', effect: '活血化瘀、调经统血', location: '髌骨内上缘上2寸' },
      '阳陵泉': { meridian: '足少阳胆经', effect: '疏肝利胆、舒筋活络', location: '腓骨小头前下方凹陷处' },
      '命门': { meridian: '督脉', effect: '温肾壮阳、强腰固精', location: '后正中线第2腰椎棘突下凹陷处' },
      '百会': { meridian: '督脉', effect: '升阳举陷、醒脑开窍', location: '两耳尖连线中点' },
      '神门': { meridian: '手少阴心经', effect: '宁心安神、清心泻火', location: '腕横纹尺侧端凹陷处' },
      '丰隆': { meridian: '足阳明胃经', effect: '健脾化痰、和胃降逆', location: '外踝尖上8寸条口穴外1寸' },
      '肺俞': { meridian: '足太阳膀胱经', effect: '宣肺止咳、滋阴润燥', location: '第3胸椎棘突下旁开1.5寸' },
    };

    // 将字符串数组转为对象数组，填充穴位知识
    const enrichPoints = (names: string[], defaultTechnique: string) => {
      const arr = Array.isArray(names) ? names : [];
      return arr.map((item: any) => {
        if (typeof item === 'string') {
          const info = acupointKnowledge[item] || {};
          return {
            point: item,
            meridian: info.meridian || '待确认',
            effect: info.effect || '调理气血',
            location: info.location || '标准定位待确认',
            technique: defaultTechnique,
          };
        }
        return item; // 已经是对象格式
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
    console.log('[DeepSeek诊断] 启动问诊模式...');
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
          age: selectedAgeGroup || patientInfo.age,
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
          setDiagnosisResult({
            primarySyndrome: aiResult.mainSyndrome,
            syndromeName: aiResult.mainSyndrome,
            pathogenesis: aiResult.pathogenesis,
            organLocation: aiResult.organLocation?.primary
              ? [aiResult.organLocation.primary, ...(aiResult.organLocation.secondary || [])]
              : [],
            confidence: aiResult.confidence || 0.8,
            mainSyndrome: aiResult.mainSyndrome,
            mainSyndromeDesc: aiResult.mainSyndromeDesc,
            confidenceScore: aiResult.confidence,
          });
          setCurrentStep('result');
        }
      }
    } catch (err) {
      console.error('[问诊] 调用失败:', err);
      setError('问诊调用失败，请重试');
    }
  };

  // ========== v3.2 问诊提交处理 ==========
  const handleInquirySubmit = async (answers: { questionId: string; selectedOption: string }[]) => {
    console.log('[问诊] 用户回答:', answers);
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
          age: selectedAgeGroup || patientInfo.age,
          mode: 'confirm',
          conversationId: inquiryConversationId,
          answers,
        }),
      });
      const result = await response.json();
      if (result.success && result.data) {
        const aiResult = result.data;
        setDiagnosisResult({
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
          mainSyndrome: aiResult.mainSyndrome,
          mainSyndromeDesc: aiResult.mainSyndromeDesc,
          confidenceScore: aiResult.confidence,
        });
        setShowInquiry(false);
        setShowRefineButton(true);
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
    isAnalyzing,
    setTongueColor,
    setTongueShape,
    setTongueState,
    setCoating,
    setCrack,
    setTeethMark,
    setDistributionFeatures,
    setShapeDistribution,
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
    console.log('[AI识别] 原始结果:', JSON.stringify(result, null, 2));

    // 舌色
    try {
      const colorVal = mapToEnum(result.tongue_color?.value || '', ['淡红', '淡白', '红', '绛', '紫', '青紫']);
      console.log('[AI识别] 舌色:', result.tongue_color?.value, '→', colorVal);
      setTongueColor(colorVal || '淡红');
    } catch (e) { console.error('[AI识别] 舌色回填异常:', e); }

    // 舌形
    try {
      const shapeVal = mapToEnum(result.tongue_shape?.value || '', ['胖大', '瘦薄', '正常']);
      console.log('[AI识别] 舌形:', result.tongue_shape?.value, '→', shapeVal);
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
      console.log('[AI识别] 苔色:', coatColor, '苔质:', coatTexture, '润燥:', coatMoisture);
      setCoating(coatColor || '薄白', coatTexture || '薄', coatMoisture || '润');
    } catch (e) { console.error('[AI识别] 舌苔回填异常:', e); }

    // 舌态
    try {
      const stateVal = mapToEnum(result.tongue_state?.value || '', ['强硬', '痿软', '歪斜', '颤动', '正常']);
      console.log('[AI识别] 舌态:', result.tongue_state?.value, '→', stateVal);
      setTongueState(stateVal || '正常');
    } catch (e) { console.error('[AI识别] 舌态回填异常:', e); }

    // 标记AI已识别
    setIsAIRecognized(true);
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
    console.log('[本地规则引擎] 开始辨证...');
    
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
    console.log(`[本地规则引擎] 规则统计: 共${stats.totalRules}条规则`);
    console.log(`[本地规则引擎] 主要结果: ${result.primaryResult.syndrome}`);
    console.log(`[本地规则引擎] 匹配规则: ${result.primaryResult.matchedRuleName}`);
    
    // 构建诊断结果（严格匹配 DiagnosisResult 类型）
    const priorityMap: Record<string, '高' | '中' | '低'> = { high: '高', medium: '中', low: '低' };
    const diagnosisResultOut = {
      primarySyndrome: result.primaryResult.syndrome,
      syndromeScore: result.primaryResult.confidence || 0,
      confidence: (result.primaryResult.confidence || 0) / 100, // 0-100 → 0-1
      secondarySyndromes: (result.alternativeResults || []).map((r: any) => ({
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
    const mainPointNames: string[] = result.acupointSelection.mainPoints || [];
    const secondaryPointNames: string[] = result.acupointSelection.secondaryPoints || [];
    const acupuncturePlan = {
      treatmentPrinciple: result.primaryResult.treatment || '',
      mainPoints: mainPointNames.map((name: string) => ({
        point: name,
        meridian: '',
        effect: '',
        technique: result.acupointSelection.method?.technique || '泻法',
      })),
      secondaryPoints: secondaryPointNames.map((name: string) => ({
        point: name,
        meridian: '',
        effect: '',
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
    
    // 构建生活调护建议（严格匹配 LifeCareAdvice 类型）
    const lifeCareAdvice = generateLifeCareAdvice(result);
    
    return { diagnosisResult: diagnosisResultOut, acupuncturePlan, lifeCareAdvice };
  };
  
  /**
   * 根据辨证结果生成生活调护建议
   */
  const generateLifeCareAdvice = (result: any): any => {
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
  const handleSubmit = async () => {
    // ========== 简化必填验证 ==========
    // 有AI识别数据时：只要求舌色+苔色（其他已有默认值或AI填入）
    // 无AI识别数据时：只要求舌色+苔色
    
    const hasTongueColor = !!inputFeatures.tongueColor.value;
    const hasCoatingColor = !!inputFeatures.coating.color;
    
    // 舌色必填
    if (!hasTongueColor) {
      toast.error('请选择舌色');
      return;
    }
    
    // 苔色必填
    if (!hasCoatingColor) {
      toast.error('请选择苔色');
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

    setIsAnalyzing(true);
    setError(null);
    setDiagnosisResult(null);

    if (useLocalEngine) {
      // ========== 路径A：本地规则引擎 ==========
      // 用setTimeout让出主线程，确保"分析中"UI先渲染
      setTimeout(() => {
          try {
            const { diagnosisResult: diagResult, acupuncturePlan, lifeCareAdvice } = handleLocalDiagnosis();
            setDiagnosisResult({ 
              diagnosisResult: diagResult, 
              acupuncturePlan, 
              lifeCareAdvice 
            } as any);
            toast.success(`辨证完成！${diagResult?.primarySyndrome || ''}`);
          } catch (error) {
            console.error('[本地引擎] 异常:', error);
            const message = error instanceof Error ? error.message : '规则引擎分析失败';
            setError(message);
            toast.error(message);
          } finally {
            setIsAnalyzing(false);
          }
        });
      return; // 提前返回，不走下面的try/catch/finally
    }

    try {
      // ========== 路径B：远程Bot API（异步，需要进度指示） ==========
      {
        const input = getDiagnosisInput();
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
        {/* ========== 移动端单列流布局 ========== */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-4 lg:space-y-0">
          
          {/* ========== 左侧：输入区域 ========== */}
          <div className="space-y-4">
            {/* ========== v3.2 年龄段选择器 ==========*/}
            <div className="mb-4 p-4 bg-white rounded-xl shadow-sm border border-stone-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-stone-700 font-medium">您的年龄段</span>
                <span className="text-xs text-stone-400">（帮助更准确辨证）</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {ageGroups.map((group) => (
                  <button
                    key={group.value}
                    onClick={() => setSelectedAgeGroup(group.value)}
                    className={`
                      py-2.5 px-3 rounded-xl text-sm font-medium transition-all
                      ${selectedAgeGroup === group.value
                        ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-md'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }
                    `}
                  >
                    {group.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 核心入口：拍照/上传 - 最醒目 */}
            <div className="tcm-card p-4 bg-gradient-to-br from-primary-50 to-secondary-50 border-2 border-primary-200">
              <ImageUpload 
                onChange={(imageData) => setImageData(imageData)} 
                onRecognize={handleRecognize}
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
                      本地规则引擎 ✓
                    </button>
                    <button
                      onClick={() => setUseLocalEngine(false)}
                      className={`flex-1 px-3 py-2 text-xs rounded-lg transition-colors ${
                        !useLocalEngine
                          ? 'bg-secondary-500 text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      AI Bot推理
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

              {/* 识别结果一览 - 彩色标签 */}
              <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                {inputFeatures.tongueColor.value ? (
                  <span className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded-full border border-red-200">
                    {inputFeatures.tongueColor.value}{isAIRecognized && <sup className="ml-0.5 text-blue-500 text-[10px]">AI</sup>}
                  </span>
                ) : (
                  <span className="text-xs text-stone-400">未识别</span>
                )}
                {inputFeatures.tongueShape.value && inputFeatures.tongueShape.value !== '正常' && (
                  <span className="px-2 py-1 text-xs bg-orange-50 text-orange-600 rounded-full border border-orange-200">
                    {inputFeatures.tongueShape.value}
                  </span>
                )}
                {inputFeatures.coating.color && (
                  <span className="px-2 py-1 text-xs bg-green-50 text-green-600 rounded-full border border-green-200">
                    {inputFeatures.coating.color}{isAIRecognized && <sup className="ml-0.5 text-blue-500 text-[10px]">AI</sup>}
                  </span>
                )}
                {inputFeatures.coating.moisture && inputFeatures.coating.moisture !== '正常' && (
                  <span className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-full border border-blue-200">
                    {inputFeatures.coating.moisture}
                  </span>
                )}
                {inputFeatures.tongueState.value && inputFeatures.tongueState.value !== '正常' && (
                  <span className="px-2 py-1 text-xs bg-purple-50 text-purple-600 rounded-full border border-purple-200">
                    {inputFeatures.tongueState.value}
                  </span>
                )}
                {inputFeatures.teethMark?.value === '是' && (
                  <span className="px-2 py-1 text-xs bg-amber-50 text-amber-600 rounded-full border border-amber-200">齿痕</span>
                )}
                {inputFeatures.crack?.value === '是' && (
                  <span className="px-2 py-1 text-xs bg-amber-50 text-amber-600 rounded-full border border-amber-200">裂纹</span>
                )}
              </div>

              {/* 识别详情编辑 - 默认隐藏，点"修改"才出现 */}
              <div id="feature-edit" className="hidden mt-3 pt-3 border-t border-stone-200 space-y-1">

              {/* 当前特征一览 - 彩色标签一行看完 */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {inputFeatures.tongueColor.value && (
                  <span className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded-full border border-red-200">
                    {inputFeatures.tongueColor.value}{isAIRecognized && <sup className="ml-0.5 text-blue-500 text-[10px]">AI</sup>}
                  </span>
                )}
                {inputFeatures.tongueShape.value && inputFeatures.tongueShape.value !== '正常' && (
                  <span className="px-2 py-1 text-xs bg-orange-50 text-orange-600 rounded-full border border-orange-200">
                    {inputFeatures.tongueShape.value}{isAIRecognized && <sup className="ml-0.5 text-blue-500 text-[10px]">AI</sup>}
                  </span>
                )}
                {inputFeatures.tongueState.value && inputFeatures.tongueState.value !== '正常' && (
                  <span className="px-2 py-1 text-xs bg-purple-50 text-purple-600 rounded-full border border-purple-200">
                    {inputFeatures.tongueState.value}
                  </span>
                )}
                {inputFeatures.coating.color && (
                  <span className="px-2 py-1 text-xs bg-green-50 text-green-600 rounded-full border border-green-200">
                    {inputFeatures.coating.color}{isAIRecognized && <sup className="ml-0.5 text-blue-500 text-[10px]">AI</sup>}
                  </span>
                )}
                {inputFeatures.coating.moisture && inputFeatures.coating.moisture !== '正常' && (
                  <span className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-full border border-blue-200">
                    {inputFeatures.coating.moisture}
                  </span>
                )}
                {inputFeatures.teethMark?.value === '是' && (
                  <span className="px-2 py-1 text-xs bg-amber-50 text-amber-600 rounded-full border border-amber-200">齿痕</span>
                )}
                {inputFeatures.crack?.value === '是' && (
                  <span className="px-2 py-1 text-xs bg-amber-50 text-amber-600 rounded-full border border-amber-200">裂纹</span>
                )}
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
                <div className="mt-2"><TongueShapeSelector value={inputFeatures.tongueShape.value} onChange={setTongueShape} /></div>
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


            {/* 补充信息 - 合并折叠 */}
            <details className="tcm-card group">
              <summary className="p-4 flex items-center justify-between cursor-pointer text-sm text-stone-500 hover:text-stone-700">
                <span>补充信息（选填）</span>
                <svg className="w-4 h-4 text-stone-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-4 pb-4 space-y-4">
                <div>
                  <span className="text-xs text-stone-500 block mb-2">患者信息</span>
                  <PatientInfoForm patientInfo={patientInfo} onChange={setPatientInfo} />
                </div>
                <div className="border-t border-stone-100 pt-3">
                  <span className="text-xs text-stone-500 block mb-2">伴随症状 {symptoms.length > 0 && <span className="text-stone-400">({symptoms.length}项)</span>}</span>
                  <SymptomInput symptoms={symptoms} onAdd={addSymptom} onRemove={removeSymptom} onUpdate={updateSymptom} />
                </div>
              </div>
            </details>

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

            {/* 进度显示 - 极简 */}
            {isAnalyzing && (
              <div className="text-center py-3 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl">
                <div className="animate-pulse flex items-center justify-center gap-2 text-sm text-stone-600">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {useLocalEngine ? '本地规则引擎分析中...' : 'DeepSeek AI推理中...'}
                </div>
              </div>
            )}
          </div>

          {/* ========== 右侧：结果展示 ========== */}
          <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            {diagnosisResult ? (
              <div className="space-y-3">
                {/* 📋 辨证结果 - 用户关注点2：怎么了+怎么办 */}
                
                {/* 证型结论 - 最醒目 */}
                <DiagnosisResultDisplay result={diagnosisResult.diagnosisResult} />
                
                {/* Tab切换：病机 | 针灸 | 调理 */}
                <div className="flex border-b border-stone-200">
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
                  <div className="tcm-card p-4 space-y-3 animate-in">
                    <div>
                      <span className="text-xs text-stone-500 block mb-1">病机</span>
                      <p className="text-sm text-primary-700 font-medium">{diagnosisResult.diagnosisResult?.pathogenesis || '-'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-stone-500 block mb-1">脏腑定位</span>
                      <div className="flex flex-wrap gap-1.5">
                        {diagnosisResult.diagnosisResult?.organLocation?.map((organ: string, i: number) => (
                          <span key={i} className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded-full border border-red-200">
                            {organ}{i === 0 && <span className="ml-0.5 opacity-60">(主)</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                    {diagnosisResult.diagnosisResult?.secondarySyndromes?.length > 0 && (
                      <div>
                        <span className="text-xs text-stone-500 block mb-1">也需关注</span>
                        {diagnosisResult.diagnosisResult.secondarySyndromes.slice(0, 2).map((s: any, i: number) => (
                          <span key={i} className="text-sm text-stone-600 mr-2">· {s.syndrome}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {resultTab === 'acupuncture' && (
                  <AcupunctureDisplay plan={diagnosisResult.acupuncturePlan} />
                )}
                {resultTab === 'care' && (
                  <LifeCareDisplay advice={diagnosisResult.lifeCareAdvice} />
                )}
                
                <button
                  onClick={handleSaveCase}
                  className="w-full py-2 rounded-xl text-xs font-medium bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors"
                >
                  保存此病例
                
                {/* 付费解锁入口 - 社会证明 */}
                <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                  <div className="flex items-center justify-center gap-2 text-xs text-emerald-600 mb-2">
                    <span>🔓</span>
                    <span>已有{userCount.toLocaleString()}人解锁深度辨证方案</span>
                  </div>
                  <button
                    onClick={() => toast.success('深度辨证方案开发中，敬请期待！')}
                    className="w-full py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium shadow-sm hover:shadow-md transition-all"
                  >
                    获取深度辨证方案 ¥9.9
                  </button>
                
                {/* ========== v3.2 "想更准"按钮 ========== */}
                {diagnosisResult && !showRefineButton && (
                  <button
                    onClick={handleRefineDiagnosis}
                    disabled={isRefiningDiagnosis}
                    className={`
                      w-full py-2.5 rounded-xl text-sm font-medium transition-all mt-3
                      ${isRefiningDiagnosis
                        ? 'bg-stone-100 text-stone-400 cursor-wait'
                        : 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 hover:from-amber-100 hover:to-orange-100 border border-amber-200'
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
                        🎯 想更准确？回答几个小问题
                      </span>
                    )}
                  </button>
                )}

                </div>
                </button>
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
          onCancel={() => setShowInquiry(false)}
          isLoading={isRefiningDiagnosis}
        />
      )}
</div>
  );
};

export default DiagnosisPage;
