/**
 * useDiagnosisFlow - 组合hook（保持向后兼容）
 * 内部使用拆分的3个hook
 */

import { useDiagnosisSubmit } from './useDiagnosisSubmit';
import { useInquiryFlow } from './useInquiryFlow';
import type { InputFeatures, PatientInfo } from '@/types';

interface UseDiagnosisFlowParams {
  inputFeatures: InputFeatures;
  patientInfo: PatientInfo;
  symptoms?: string;
}

export function useDiagnosisFlow({ inputFeatures, patientInfo, symptoms }: UseDiagnosisFlowParams) {
  // 提交辨证
  const {
    diagnosisResult,
    currentStep,
    isAnalyzing,
    showRefineButton,
    setCurrentStep,
    setDiagnosisResult,
    handleSubmit,
    clearResult,
  } = useDiagnosisSubmit({
    inputFeatures,
    patientInfo,
    symptoms,
  });

  // 问诊流程
  const {
    showInquiry,
    isRefiningDiagnosis,
    isLoadingInquiry,
    isSubmittingInquiry,
    inquiryQuestions,
    inquiryConversationId,
    preliminaryResult,
    startRefine,
    submitInquiry,
    cancelRefine,
    closeInquiry,
  } = useInquiryFlow({
    inputFeatures,
    patientInfo,
    onResultUpdate: setDiagnosisResult,
    onStepChange: setCurrentStep,
  });

  // 组合的handleRefineDiagnosis
  const handleRefineDiagnosis = async () => {
    if (!diagnosisResult) return;
    await startRefine(diagnosisResult);
  };

  // 组合的handleInquirySubmit
  const handleInquirySubmit = async (answers: Record<string, string>) => {
    await submitInquiry(answers);
  };

  return {
    // 状态
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
    // 操作
    handleSubmit,
    handleRefineDiagnosis,
    handleInquirySubmit,
    cancelInquiry: cancelRefine,
    closeInquiry,
    clearResult,
  };
}

export type { UseDiagnosisFlowParams };
