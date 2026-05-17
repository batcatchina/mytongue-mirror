/**
 * 辨证上下文 - 诊断页核心状态
 * 封装诊断流程相关的状态和方法
 */
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { DiagnosisOutput, DiagnosisInput } from '@/types';
import { useDiagnosisStore } from '@/stores/diagnosisStore';
import { performDiagnosis, handleFallbackToLocal, DiagnosisStep } from '@/services/DiagnosisService';
import toast from 'react-hot-toast';

interface DiagnosisContextValue {
  // 状态
  diagnosisResult: DiagnosisOutput | null;
  isAnalyzing: boolean;
  currentStep: DiagnosisStep;
  useLocalEngine: boolean;
  error: string | null;
  
  // 方法
  startDiagnosis: () => Promise<void>;
  fallbackToLocal: () => void;
  resetDiagnosis: () => void;
  setUseLocalEngine: (useLocal: boolean) => void;
}

const DiagnosisContext = createContext<DiagnosisContextValue | null>(null);

export function DiagnosisProvider({ children }: { children: React.ReactNode }) {
  // 从 store 获取输入数据
  const inputFeatures = useDiagnosisStore(state => state.inputFeatures);
  const symptoms = useDiagnosisStore(state => state.symptoms);
  const patientInfo = useDiagnosisStore(state => state.patientInfo);
  const imageData = useDiagnosisStore(state => state.imageData);
  const getDiagnosisInput = useDiagnosisStore(state => state.getDiagnosisInput);
  
  // 本地状态
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState<DiagnosisStep>('idle');
  const [useLocalEngine, setUseLocalEngine] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 开始诊断
  const startDiagnosis = useCallback(async () => {
    if (isAnalyzing) return;
    
    const input = getDiagnosisInput();
    
    // 简单验证
    if (!input.input_features.tongueColor?.value) {
      toast.error('请先选择舌色');
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    setCurrentStep('validating');
    
    try {
      const result = await performDiagnosis(input, {
        enableCache: true,
        enableDeepSeek: !useLocalEngine,
        onStepChange: (step) => setCurrentStep(step as DiagnosisStep),
      });
      
      setDiagnosisResult(result.output);
      setCurrentStep('result');
      
      if (result.fromCache) {
        toast.success('📋 已加载缓存结果');
      } else {
        toast.success('✅ 辨证分析完成');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '诊断失败';
      setError(errorMessage);
      toast.error(`诊断失败: ${errorMessage}`);
      
      // 自动降级到本地引擎
      if (!useLocalEngine) {
        toast('正在尝试本地诊断...', { icon: '🔄' });
        fallbackToLocal();
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, getDiagnosisInput, useLocalEngine]);
  
  // Fallback 到本地引擎
  const fallbackToLocal = useCallback(() => {
    if (isAnalyzing) return;
    
    const input = getDiagnosisInput();
    setIsAnalyzing(true);
    setUseLocalEngine(true);
    setCurrentStep('reasoning');
    
    try {
      const result = handleFallbackToLocal(input, (step) => setCurrentStep(step as DiagnosisStep));
      setDiagnosisResult(result);
      setCurrentStep('result');
      toast.success('🔧 本地诊断完成');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '本地诊断失败';
      setError(errorMessage);
      toast.error(`本地诊断失败: ${errorMessage}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, getDiagnosisInput]);
  
  // 重置诊断
  const resetDiagnosis = useCallback(() => {
    setDiagnosisResult(null);
    setIsAnalyzing(false);
    setCurrentStep('idle');
    setError(null);
    setUseLocalEngine(false);
  }, []);
  
  const value = useMemo(() => ({
    diagnosisResult,
    isAnalyzing,
    currentStep,
    useLocalEngine,
    error,
    startDiagnosis,
    fallbackToLocal,
    resetDiagnosis,
    setUseLocalEngine,
  }), [diagnosisResult, isAnalyzing, currentStep, useLocalEngine, error, startDiagnosis, fallbackToLocal, resetDiagnosis]);
  
  return (
    <DiagnosisContext.Provider value={value}>
      {children}
    </DiagnosisContext.Provider>
  );
}

export function useDiagnosisContext() {
  const context = useContext(DiagnosisContext);
  if (!context) {
    throw new Error('useDiagnosisContext must be used within DiagnosisProvider');
  }
  return context;
}
