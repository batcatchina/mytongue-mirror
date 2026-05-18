/**
 * useInquiryFlow - 问诊流程管理
 * 职责：处理问诊生成、提交、结果合并
 * 解决状态不一致问题：确保isRefiningDiagnosis和isLoadingInquiry互斥
 */

import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { transformToDiagnosisOutput, normalizeDiagnosisOutput } from '@/services/api';
import type { DiagnosisOutput } from '@/types';
import type { InquiryQuestion } from '@/components/InquiryDialog';
import type { InputFeatures } from '@/types';
import type { DiagnosisStep } from './useDiagnosisSubmit';

export function useInquiryFlow({
  inputFeatures,
  patientAge,
  onResultUpdate,
  onStepChange,
}: {
  inputFeatures: InputFeatures;
  patientAge?: number;
  onResultUpdate?: (result: DiagnosisOutput) => void;
  onStepChange?: (step: DiagnosisStep) => void;
}) {
  const [showInquiry, setShowInquiry] = useState(false);
  const [currentStep, setCurrentStep] = useState<DiagnosisStep>('idle');
  const [inquiryQuestions, setInquiryQuestions] = useState<InquiryQuestion[]>([]);
  const [inquiryConversationId, setInquiryConversationId] = useState<string | null>(null);
  const [preliminaryResult, setPreliminaryResult] = useState<DiagnosisOutput | null>(null);

  const isRefiningDiagnosis = currentStep === 'refining';
  const isLoadingInquiry = currentStep === 'inquiring';
  const setStep = useCallback((step: DiagnosisStep) => {
    setCurrentStep(step);
    onStepChange?.(step);
  }, [onStepChange]);

  const startRefine = useCallback(async (diagnosisResult: DiagnosisOutput) => {
    if (currentStep === 'refining' || currentStep === 'inquiring') {
      console.warn('[InquiryFlow] 已有操作进行中，忽略重复请求');
      return;
    }

    setStep('refining');
    setPreliminaryResult(diagnosisResult);

    try {
      const response = await fetch('/api/ai/inquiry/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagnosisResult: diagnosisResult.diagnosisResult,
          inputFeatures,
          patientInfo: { age: patientAge || 30 },
          mode: 'inquiry',
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        console.error('问诊问题生成失败:', response.status, errBody);
        throw new Error(`问诊问题生成失败: ${response.status} ${errBody}`);
      }

      const data = await response.json();
      const questions = data?.data?.questions || [];
      const conversationId = data?.data?.conversationId || null;

      setInquiryQuestions(questions);
      setInquiryConversationId(conversationId);
      setShowInquiry(true);
      setStep('inquiring');
    } catch (error) {
      console.error('生成问诊失败:', error);
      toast.error('生成问诊失败，请重试');
      cancelRefine();
    }
  }, [currentStep, inputFeatures, patientAge, setStep]);

  const submitInquiry = useCallback(async (answers: Record<string, string>) => {
    if (!preliminaryResult || !inquiryConversationId) {
      toast.error('问诊上下文缺失，请重新开始问诊');
      return;
    }

    if (currentStep === 'inquiring') {
      console.warn('[InquiryFlow] 已有操作进行中');
      return;
    }

    setStep('inquiring');

    try {
      const response = await fetch('/api/ai/inquiry/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: inquiryConversationId,
          answers,
          preliminaryDiagnosis: preliminaryResult.diagnosisResult,
          inputFeatures,
          patientInfo: { age: patientAge || 30 },
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        console.error('问诊提交失败:', response.status, errBody);
        throw new Error(`问诊提交失败: ${response.status} ${errBody}`);
      }

      const data = await response.json();
      const normalizedResult = transformToDiagnosisOutput(data.data || {});
      const finalResult: DiagnosisOutput = normalizeDiagnosisOutput(normalizedResult, preliminaryResult);

      setPreliminaryResult(finalResult);
      onResultUpdate?.(finalResult);
      closeInquiry();
      toast.success('✅ 问诊完成，辨证更精准');
      return finalResult;
    } catch (error) {
      console.error('提交问诊失败:', error);
      toast.error('提交问诊失败，请重试');
      throw error;
    } finally {
      if (showInquiry) {
        setStep('idle');
      }
    }
  }, [preliminaryResult, inquiryConversationId, inputFeatures, patientAge, onResultUpdate, currentStep, setStep, showInquiry]);

  const cancelRefine = useCallback(() => {
    setStep('idle');
    setPreliminaryResult(null);
  }, [setStep]);

  const closeInquiry = useCallback(() => {
    setShowInquiry(false);
    setStep('idle');
    setInquiryQuestions([]);
    setInquiryConversationId(null);
  }, [setStep]);

  // 检查是否有操作进行中
  const isOperationInProgress = isRefiningDiagnosis || isLoadingInquiry;

  return {
    // 状态
    showInquiry,
    currentStep,
    isRefiningDiagnosis,
    isLoadingInquiry,
    inquiryQuestions,
    inquiryConversationId,
    preliminaryResult,
    isOperationInProgress,
    // 操作
    startRefine,
    submitInquiry,
    cancelRefine,
    closeInquiry,
    // setters
    setShowInquiry,
    setCurrentStep,
    setInquiryQuestions,
    setInquiryConversationId,
    setPreliminaryResult,
  };
}
