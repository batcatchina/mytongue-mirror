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
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'acupuncture' | 'care'>('diagnosis');
  const [useLocalEngine, setUseLocalEngine] = useState(true); // 默认使用本地规则引擎
  
  const {
    inputFeatures,
    symptoms,
    patientInfo,
    diagnosisResult,
    isAnalyzing,
    currentStep,
    stepProgress,
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


  // 本地规则引擎已上线，取消服务时间限制
  const isInServiceTime = true;


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

  // AI识别结果回填（完整版：所有字段必须回填store）
  const handleRecognize = (result: TongueRecognitionResult) => {
    try {
      console.log('[AI识别] 原始结果:', JSON.stringify(result, null, 2));

      // 舌色映射
      const colorVal = mapToEnum(result.tongue_color?.value || '', ['淡红', '淡白', '红', '绛', '紫', '青紫']);
      console.log('[AI识别] 舌色映射结果:', result.tongue_color?.value, '→', colorVal, '是否有效:', !!colorVal);
      setTongueColor(colorVal || '淡红');

      // 舌形映射
      const shapeVal = mapToEnum(result.tongue_shape?.value || '', ['胖大', '瘦薄', '正常']);
      console.log('[AI识别] 舌形映射结果:', result.tongue_shape?.value, '→', shapeVal, '是否有效:', !!shapeVal);
      setTongueShape(shapeVal || '正常');

      // 齿痕回填
      if (result.tongue_shape?.teeth_mark?.has) {
        console.log('[AI识别] 齿痕: 有, 程度:', result.tongue_shape.teeth_mark.degree);
        setTeethMark('是', result.tongue_shape.teeth_mark.degree || '轻度', result.tongue_shape.teeth_mark.position || '');
      } else {
        console.log('[AI识别] 齿痕: 无');
        setTeethMark('否', '', '');
      }

      // 裂纹回填
      if (result.tongue_shape?.crack?.has) {
        console.log('[AI识别] 裂纹: 有, 程度:', result.tongue_shape.crack.degree);
        setCrack('是', result.tongue_shape.crack.degree || '轻度', result.tongue_shape.crack.position || '');
      } else {
        console.log('[AI识别] 裂纹: 无');
        setCrack('否', '', '');
      }

      // 舌苔映射（苔色、苔质、润燥都必须回填）
      const coatColor = mapToEnum(result.tongue_coating?.color || '', ['薄白', '白厚', '黄', '灰黑', '剥落']);
      const coatTexture = mapToEnum(result.tongue_coating?.texture || '', ['薄', '厚', '正常']);
      const coatMoisture = mapToEnum(result.tongue_coating?.moisture || '', ['润', '燥', '正常']);
      console.log('[AI识别] 苔色映射:', result.tongue_coating?.color, '→', coatColor, '苔质:', coatTexture, '润燥:', coatMoisture);
      setCoating(coatColor || '薄白', coatTexture || '薄', coatMoisture || '润');

      // 舌态映射（"正常"也必须回填，否则提交验证不通过）
      const stateVal = mapToEnum(result.tongue_state?.value || '', ['强硬', '痿软', '歪斜', '颤动', '正常']);
      console.log('[AI识别] 舌态映射结果:', result.tongue_state?.value, '→', stateVal, '是否有效:', !!stateVal);
      setTongueState(stateVal || '正常');

      toast.success('AI识别完成，已自动填入舌象特征');
    } catch (error) {
      console.error('识别结果回填失败:', error);
    }
  };

  /**
   * 本地规则引擎辨证（核心功能）
   * 100%基于主人辨证规则树，不依赖AI猜测
   */
  const handleLocalDiagnosis = async (): Promise<{
    diagnosisResult: any;
    acupuncturePlan: any;
    lifeCareAdvice: any;
  }> => {
    console.log('[本地规则引擎] 开始辨证...');
    
    // 检查齿痕和裂纹
    const shapeDist = inputFeatures.shapeDistribution;
    const hasTeethMark = shapeDist?.depression?.includes('齿痕') || 
                          shapeDist?.bulge?.includes('齿痕') || false;
    const hasCrack = shapeDist?.depression?.includes('裂纹') || 
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
    
    // 构建诊断结果格式（兼容现有系统）
    const diagnosisResultOut = {
      syndrome: result.primaryResult.syndrome,
      pathogenesis: result.primaryResult.pathogenesis,
      treatment: result.primaryResult.treatment,
      mainPoints: result.primaryResult.mainPoints,
      secondaryPoints: result.primaryResult.secondaryPoints,
      organLocation: result.primaryResult.organLocation,
      confidence: result.primaryResult.confidence,
      matchedRule: result.primaryResult.matchedRuleName,
      priority: result.primaryResult.priority,
      alternativeDiagnoses: result.alternativeResults.map((r: any) => ({
        syndrome: r.syndrome,
        pathogenesis: r.pathogenesis,
        confidence: r.confidence,
      })),
      clinicalNotes: result.clinicalNotes,
      isLocalRuleBased: true,
    };
    
    // 构建针灸方案
    const acupuncturePlan = {
      mainPoints: result.acupointSelection.mainPoints,
      secondaryPoints: result.acupointSelection.secondaryPoints,
      huiPoint: result.acupointSelection.huiPoint,
      xiPoint: result.acupointSelection.xiPoint,
      method: result.acupointSelection.method.technique,
      needleRetention: `${result.acupointSelection.method.needleRetention}分钟`,
      moxibustion: result.acupointSelection.method.moxibustion,
      frequency: result.acupointSelection.method.frequency,
      course: result.acupointSelection.method.course,
      notes: result.acupointSelection.method.notes,
    };
    
    // 构建生活调护建议
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
    
    return {
      dietAdvice: advice.filter((_, i) => i < 3).join('；'),
      lifestyleAdvice: advice.filter((_, i) => i >= 3).join('；'),
      precautions: result.clinicalNotes || [],
    };
  };

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
    setCurrentStep('validating', 10);

    try {
      setCurrentStep('recognizing', 25);
      
      if (useLocalEngine) {
        // 使用本地规则引擎辨证
        console.log('[辨证] 使用本地规则引擎');
        setCurrentStep('matching', 50);
        
        const { diagnosisResult: diagResult, acupuncturePlan, lifeCareAdvice } = await handleLocalDiagnosis();
        
        setCurrentStep('matching', 95);
        // 直接调用setDiagnosisResult，不使用类型断言
        setDiagnosisResult({ 
          diagnosisResult: diagResult, 
          acupuncturePlan, 
          lifeCareAdvice 
        } as any);
        toast.success(`辨证完成！匹配规则：${diagResult.matchedRule}`);
      } else {
        // 使用原有Bot API辨证
        const input = getDiagnosisInput();
        setCurrentStep('analyzing', 35);
        
        const result = await submitDiagnosis(input, (step) => {
          switch (step) {
            case 'recognizing':
              setCurrentStep('recognizing', 25);
              break;
            case 'analyzing':
              setCurrentStep('analyzing', 50);
              break;
            case 'reasoning':
              setCurrentStep('reasoning', 75);
              break;
            case 'matching':
              setCurrentStep('matching', 90);
              break;
          }
        });
        
        setCurrentStep('matching', 95);
        setDiagnosisResult(result);
        toast.success('辨证分析完成！');
      }
    } catch (error) {
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
              
              {/* 辨证引擎选择 */}
              <div className="mb-4 p-3 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg border border-primary-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎯</span>
                    <span className="text-sm font-medium text-stone-700">辨证引擎</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setUseLocalEngine(true)}
                      className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                        useLocalEngine
                          ? 'bg-primary-500 text-white'
                          : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                      }`}
                    >
                      本地规则引擎 ✓
                    </button>
                    <button
                      onClick={() => setUseLocalEngine(false)}
                      className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                        !useLocalEngine
                          ? 'bg-secondary-500 text-white'
                          : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                      }`}
                    >
                      AI Bot推理
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-xs text-stone-500">
                  {useLocalEngine 
                    ? '✅ 基于主人辨证规则树的精确匹配，100%临床规则，不依赖AI猜测'
                    : '🤖 使用AI Bot进行推理，可作为补充参考'
                  }
                </p>
              </div>
              
              {/* 图片上传 */}
              <div className="mb-6">
                <ImageUpload 
                  onChange={(imageData) => setImageData(imageData)} 
                  onRecognize={handleRecognize}
                />
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
              <div className="mb-6">
                <TongueStateSelector
                  value={inputFeatures.tongueState.value}
                  onChange={setTongueState}
                  shapeValue={inputFeatures.shapeDistribution}
                  onShapeChange={setShapeDistribution}
                />
              </div>
              
              <div className="tcm-divider" />
              
              {/* 区域诊断 - 舌色分布特征（核心功能） */}
              <div>
                <TongueColorDistribution
                  onChange={setDistributionFeatures}
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
                className="tcm-btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    分析中...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    提交辨证
                  </>
                )}
              </button>
            </div>

            {/* 分步进度显示 */}
            {isAnalyzing && (
              <div className="tcm-card p-4 bg-gradient-to-r from-primary-50 to-secondary-50">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-stone-700">辨证分析进度</span>
                    <span className="text-primary-600 font-medium">{stepProgress}%</span>
                  </div>
                  
                  {/* 进度条 */}
                  <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${stepProgress}%` }}
                    />
                  </div>
                  
                  {/* 步骤列表 */}
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <StepIndicator 
                      label="识别舌象特征" 
                      step="recognizing" 
                      currentStep={currentStep} 
                    />
                    <StepIndicator 
                      label="分析舌色舌苔" 
                      step="analyzing" 
                      currentStep={currentStep} 
                    />
                    <StepIndicator 
                      label="辨证推理" 
                      step="reasoning" 
                      currentStep={currentStep} 
                    />
                    <StepIndicator 
                      label="匹配针灸方案" 
                      step="matching" 
                      currentStep={currentStep} 
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 右侧：结果展示 */}
          <div className="space-y-6">
            {/* Tab切换 */}
            <div className="tcm-card p-1">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('diagnosis')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'diagnosis'
                      ? 'bg-primary-500 text-white'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  辨证结果
                </button>
                <button
                  onClick={() => setActiveTab('acupuncture')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'acupuncture'
                      ? 'bg-primary-500 text-white'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  针灸方案
                </button>
                <button
                  onClick={() => setActiveTab('care')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'care'
                      ? 'bg-primary-500 text-white'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  生活调护
                </button>
              </div>
            </div>

            {/* 结果内容 */}
            {diagnosisResult ? (
              <div className="space-y-4">
                {activeTab === 'diagnosis' && (
                  <DiagnosisResultDisplay result={diagnosisResult.diagnosisResult} />
                )}
                {activeTab === 'acupuncture' && (
                  <AcupunctureDisplay plan={diagnosisResult.acupuncturePlan} />
                )}
                {activeTab === 'care' && (
                  <LifeCareDisplay advice={diagnosisResult.lifeCareAdvice} />
                )}
                
                {/* 保存按钮 */}
                <button
                  onClick={handleSaveCase}
                  className="w-full tcm-btn-secondary flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  保存此病例
                </button>
              </div>
            ) : (
              <div className="tcm-card p-12 flex flex-col items-center justify-center text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-medium text-stone-600 mb-2">
                  等待辨证分析
                </h3>
                <p className="text-sm text-stone-400">
                  请填写左侧的舌象特征和症状信息，然后点击"提交辨证"开始分析
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

// 分步进度指示器组件
interface StepIndicatorProps {
  label: string;
  step: string;
  currentStep: string;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ label, step, currentStep }) => {
  const stepOrder = ['recognizing', 'analyzing', 'reasoning', 'matching'];
  const currentIndex = stepOrder.indexOf(currentStep);
  const stepIndex = stepOrder.indexOf(step);
  
  const isCompleted = stepIndex < currentIndex;
  const isCurrent = stepIndex === currentIndex;
  
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
      isCompleted 
        ? 'bg-green-100 text-green-700' 
        : isCurrent 
          ? 'bg-primary-100 text-primary-700' 
          : 'bg-stone-100 text-stone-400'
    }`}>
      {isCompleted ? (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : isCurrent ? (
        <svg className="w-4 h-4 flex-shrink-0 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        </svg>
      )}
      <span className="truncate">{label}</span>
    </div>
  );
};

export default DiagnosisPage;
