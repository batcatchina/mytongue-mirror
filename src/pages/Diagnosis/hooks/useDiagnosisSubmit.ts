/**
 * useDiagnosisSubmit - 提交辨证/降级/结果状态
 * 职责：处理submitDiagnosis、降级逻辑、结果状态
 */

import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { submitDiagnosis, normalizeDiagnosisOutput } from '@/services/api';
import { handleFallbackToLocal } from '@/services/DiagnosisService';
import type { DiagnosisOutput } from '@/types';
import type { InputFeatures } from '@/types';
import type { PatientInfo } from '@/types';

export type DiagnosisStep =
  | 'idle'
  | 'analyzing'
  | 'result'
  | 'inquiring'
  | 'refining'
  | 'inquiry_ready'
  | 'submitting_inquiry';

interface UseDiagnosisSubmitParams {
  inputFeatures: InputFeatures;
  patientInfo: PatientInfo;
}

export function useDiagnosisSubmit({
  inputFeatures,
  patientInfo,
}: UseDiagnosisSubmitParams) {
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisOutput | null>(null);
  const [currentStep, setCurrentStep] = useState<DiagnosisStep>('idle');
  const [showRefineButton, setShowRefineButton] = useState(false);
  const isAnalyzing = currentStep === 'analyzing';

  const handleSubmit = useCallback(async () => {
    setCurrentStep('analyzing');
    const input = { input_features: inputFeatures, patientInfo };

    try {
      const result = await submitDiagnosis(input, (step) => {
        // 进度回调可以扩展
        console.log('[DiagnosisSubmit] Progress:', step);
      });

      const normalizedResult: DiagnosisOutput = normalizeDiagnosisOutput(result);
      setDiagnosisResult(normalizedResult);
      setCurrentStep('result');
      setShowRefineButton(true);
      toast.success(`辨证完成！${normalizedResult.diagnosisResult?.primarySyndrome || ''}`);
    } catch (error) {
      console.error('云端辨证失败，尝试降级本地引擎:', error);

      try {
        const localResult = await handleFallbackToLocal(input, (step) =>
          setCurrentStep(step as DiagnosisStep)
        );
        const normalizedLocal = normalizeDiagnosisOutput(localResult as Partial<DiagnosisOutput>);
        setDiagnosisResult(normalizedLocal);
        setCurrentStep('result');
        setShowRefineButton(true);
        toast.success(`本地辨证完成！${normalizedLocal.diagnosisResult?.primarySyndrome || ''}`);
      } catch (localErr) {
        console.error('[降级] 本地引擎也失败:', localErr);
        setCurrentStep('idle');
        toast.error('辨证失败，请检查网络或稍后重试');
      }
    }
  }, [inputFeatures, patientInfo]);

  const clearResult = useCallback(() => {
    setDiagnosisResult(null);
    setShowRefineButton(false);
    setCurrentStep('idle');
  }, []);

  return {
    diagnosisResult,
    currentStep,
    isAnalyzing,
    showRefineButton,
    setCurrentStep,
    setShowRefineButton,
    setDiagnosisResult,
    handleSubmit,
    clearResult,
  };
}
