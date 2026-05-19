/**
 * useInquiryFlow - 问诊流程管理
 * 职责：处理问诊生成、提交、结果合并
 * 解决状态不一致问题：确保refining/loading/submitting状态语义清晰
 */

import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { transformToDiagnosisOutput, normalizeDiagnosisOutput } from '@/services/api';
import type { DiagnosisOutput } from '@/types';
import type { InquiryQuestion } from '@/components/InquiryDialog';
import type { InputFeatures } from '@/types';
import type { DiagnosisStep } from './useDiagnosisSubmit';

function getErrorMessage(error: unknown): string {
  if (!error) return '未知错误';
  if (typeof error === 'string') return error;
  if (error instanceof Error && error.message) return error.message;

  if (typeof error === 'object') {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
      return maybeMessage;
    }
  }

  return '未知错误';
}

/**
 * 基于中医十问，根据初步辨证结果生成默认问诊问题
 * 十问歌：一问寒热二问汗，三问头身四问便，五问饮食六问胸，七聋八渴俱当辨，九问旧病十问因
 */
function getDefaultInquiryQuestions(diagnosisResult: DiagnosisOutput): InquiryQuestion[] {
  const { primarySyndrome } = diagnosisResult.diagnosisResult;
  const syndrome = primarySyndrome.toLowerCase();
  const questions: InquiryQuestion[] = [];

  // 判断证型类别
  const isHeatSyndrome = syndrome.includes('热') || syndrome.includes('火') || syndrome.includes('炎');
  const isColdSyndrome = syndrome.includes('寒') || syndrome.includes('虚寒') || syndrome.includes('阳虚');
  const isDeficiencySyndrome = syndrome.includes('虚') || syndrome.includes('阴虚') || syndrome.includes('气虚') || syndrome.includes('血虚');
  const isExcessSyndrome = syndrome.includes('实') || syndrome.includes('瘀') || syndrome.includes('痰') || syndrome.includes('湿');
  const isYinDeficiency = syndrome.includes('阴虚');
  const isHeartRelated = syndrome.includes('心') || syndrome.includes('火');
  const isSpleenStomach = syndrome.includes('脾') || syndrome.includes('胃') || syndrome.includes('湿');

  let qId = 1;

  // 寒热是基础问题，几乎所有证型都问
  if (isHeatSyndrome || isColdSyndrome || isExcessSyndrome) {
    questions.push({
      id: `q${qId++}`,
      text: '你平时怕冷还是怕热？手脚容易发凉还是发热？',
      options: ['怕热喜冷饮', '怕冷喜热饮', '既不怕冷也不怕热', '手足心热'],
      reason: '区分寒热证型'
    });
  }

  // 出汗问题
  if (isDeficiencySyndrome || isHeatSyndrome) {
    questions.push({
      id: `q${qId++}`,
      text: '你平时出汗情况如何？',
      options: ['白天自汗（不动也出汗）', '夜间盗汗（睡觉时出汗）', '很少出汗', '正常'],
      reason: '辨别气虚/阴虚'
    });
  }

  // 口渴问题 - 热证必问
  if (isHeatSyndrome || isYinDeficiency || isHeartRelated) {
    questions.push({
      id: `q${qId++}`,
      text: '你平时口渴吗？喜欢喝热水还是凉水？',
      options: ['口渴喜冷饮', '口渴喜热饮', '不渴', '口干不欲饮'],
      reason: '区分热证类型'
    });
  }

  // 饮食问题 - 脾胃相关
  if (isSpleenStomach || isDeficiencySyndrome) {
    questions.push({
      id: `q${qId++}`,
      text: '你胃口怎么样？吃饭有胃口吗？',
      options: ['食欲不振', '食欲正常', '容易饥饿', '胃胀不适'],
      reason: '辨别脾胃功能'
    });
  }

  // 大小便问题 - 实证/热证
  if (isHeatSyndrome || isExcessSyndrome) {
    questions.push({
      id: `q${qId++}`,
      text: '你大便情况如何？',
      options: ['大便干结', '大便稀溏', '大便正常', '便秘'],
      reason: '辨别热结/湿滞'
    });
    questions.push({
      id: `q${qId++}`,
      text: '你小便情况如何？',
      options: ['小便短黄', '小便清长', '小便正常', '尿频'],
      reason: '辨别寒热虚实'
    });
  }

  // 胸腹不适 - 实证/气滞
  if (isExcessSyndrome || syndrome.includes('气滞') || syndrome.includes('郁')) {
    questions.push({
      id: `q${qId++}`,
      text: '你胸腹部有什么不适感吗？',
      options: ['胸闷胁胀', '胃脘不适', '腹胀', '无明显不适'],
      reason: '辨别气滞部位'
    });
  }

  // 睡眠问题 - 心神相关
  if (isHeartRelated || isYinDeficiency) {
    questions.push({
      id: `q${qId++}`,
      text: '你睡眠情况如何？',
      options: ['失眠多梦', '易醒', '嗜睡', '睡眠正常'],
      reason: '辨别心神不宁'
    });
  }

  // 旧病病史
  if (isDeficiencySyndrome) {
    questions.push({
      id: `q${qId++}`,
      text: '你以前有什么慢性病史吗？',
      options: ['无', '有胃肠疾病', '有心脑血管疾病', '有其他慢性病'],
      reason: '了解体质背景'
    });
  }

  // 如果问题太少，补充基础问题
  if (questions.length < 3) {
    questions.push({
      id: `q${qId++}`,
      text: '你最近精神状态怎么样？',
      options: ['神疲乏力', '精神尚可', '烦躁不安', '一般'],
      reason: '了解整体状态'
    });
    questions.push({
      id: `q${qId++}`,
      text: '你的面色看起来怎么样？',
      options: ['面色偏红', '面色偏白', '面色偏黄', '面色偏暗'],
      reason: '辅助辨证'
    });
  }

  // 返回3-5个最相关的问题
  return questions.slice(0, 5);
}

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
  const isLoadingInquiry = currentStep === 'refining';
  const isSubmittingInquiry = currentStep === 'submitting_inquiry';
  const setStep = useCallback((step: DiagnosisStep) => {
    setCurrentStep(step);
    onStepChange?.(step);
  }, [onStepChange]);

  const startRefine = useCallback(async (diagnosisResult: DiagnosisOutput) => {
    if (currentStep === 'refining' || currentStep === 'inquiry_ready' || currentStep === 'submitting_inquiry') {
      console.warn('[InquiryFlow] 已有操作进行中，忽略重复请求');
      return;
    }

    setStep('refining');
    setPreliminaryResult(diagnosisResult);
    setShowInquiry(true);

    try {
      const requestPayload = {
        diagnosisResult: diagnosisResult.diagnosisResult,
        inputFeatures,
        patientInfo: { age: patientAge || 30 },
        mode: 'inquiry',
      };
      console.log('[InquiryFlow] generate request payload:', requestPayload);

      const response = await fetch('/api/ai/inquiry/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errBody = await response.text();
        console.error('问诊问题生成失败:', response.status, errBody);
        throw new Error(`问诊问题生成失败: ${response.status} ${errBody}`);
      }

      const data = await response.json();
      console.log('[InquiryFlow] generate response body:', data);
      const questions = data?.data?.questions || [];
      const conversationId = data?.data?.conversationId || null;

      // 如果返回空问题列表（置信度高可能跳过问诊），使用默认问题
      if (questions.length === 0) {
        const defaultQuestions = getDefaultInquiryQuestions(diagnosisResult);
        setInquiryQuestions(defaultQuestions);
        setInquiryConversationId(conversationId || 'local-' + Date.now());
        setStep('inquiry_ready');
        toast('使用补充问诊问题', { icon: '💬' });
      } else {
        setInquiryQuestions(questions);
        setInquiryConversationId(conversationId);
        setStep('inquiry_ready');
      }
    } catch (error) {
      console.error('生成问诊失败:', error);
      // 基于十问生成默认问题，而不是关掉对话框
      const defaultQuestions = getDefaultInquiryQuestions(diagnosisResult);
      setInquiryQuestions(defaultQuestions);
      setInquiryConversationId('local-' + Date.now());
      setStep('inquiry_ready');
      toast('使用默认问诊问题（AI服务暂时不可用）', { icon: '⚠️' });
    }
  }, [currentStep, inputFeatures, patientAge, setStep]);

  const submitInquiry = useCallback(async (answers: Record<string, string>) => {
    if (!preliminaryResult || !inquiryConversationId) {
      toast.error('问诊上下文缺失，请重新开始问诊');
      return;
    }

    setStep('submitting_inquiry');

    try {
      const requestPayload = {
        conversationId: inquiryConversationId,
        answers,
        preliminaryDiagnosis: preliminaryResult.diagnosisResult,
        inputFeatures,
        patientInfo: { age: patientAge || 30 },
      };
      console.log('[InquiryFlow] submit request payload:', requestPayload);

      const response = await fetch('/api/ai/inquiry/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errBody = await response.text();
        console.error('问诊提交失败:', response.status, errBody);
        throw new Error(`问诊提交失败: ${response.status} ${errBody}`);
      }

      const data = await response.json();
      console.log('[InquiryFlow] submit response body:', data);
      const apiResult = data.data || data;
      const normalizedResult = transformToDiagnosisOutput(apiResult);
      const finalResult: DiagnosisOutput = normalizeDiagnosisOutput(normalizedResult, preliminaryResult);

      setPreliminaryResult(finalResult);
      onResultUpdate?.(finalResult);
      closeInquiry();
      toast.success('✅ 问诊完成，辨证更精准');
      return finalResult;
    } catch (error) {
      console.error('提交问诊失败:', error);
      toast.error(`提交问诊失败: ${getErrorMessage(error)}`);
      throw error;
    } finally {
      if (showInquiry) {
        setStep('idle');
      }
    }
  }, [preliminaryResult, inquiryConversationId, inputFeatures, patientAge, onResultUpdate, setStep, showInquiry]);

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
  const isOperationInProgress = isRefiningDiagnosis || isLoadingInquiry || isSubmittingInquiry;

  return {
    // 状态
    showInquiry,
    currentStep,
    isRefiningDiagnosis,
    isLoadingInquiry,
    isSubmittingInquiry,
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
