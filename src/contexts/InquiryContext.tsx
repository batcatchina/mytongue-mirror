/**
 * 问诊上下文 - 智能问诊状态管理
 */
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import InquiryDialog, { InquiryQuestion } from '@/components/InquiryDialog';
import { DiagnosisOutput } from '@/types';
import { generateInquiryQuestions, submitInquiryAnswers } from '@/services/InquiryService';
import { useDiagnosisStore } from '@/stores/diagnosisStore';
import toast from 'react-hot-toast';

interface InquiryContextValue {
  // 状态
  showInquiry: boolean;
  inquiryQuestions: InquiryQuestion[];
  inquiryConversationId: string | null;
  isRefiningDiagnosis: boolean;
  isLoadingInquiry: boolean;
  preliminaryResult: DiagnosisOutput | null;
  showRefineButton: boolean;
  
  // 方法
  startInquiry: (preliminaryResult: DiagnosisOutput) => Promise<void>;
  submitInquiry: (answers: Record<string, string>) => Promise<DiagnosisOutput>;
  cancelInquiry: () => void;
  closeInquiry: () => void;
}

const InquiryContext = createContext<InquiryContextValue | null>(null);

export function InquiryProvider({ children }: { children: React.ReactNode }) {
  const [showInquiry, setShowInquiry] = useState(false);
  const [inquiryQuestions, setInquiryQuestions] = useState<InquiryQuestion[]>([]);
  const [inquiryConversationId, setInquiryConversationId] = useState<string | null>(null);
  const [isRefiningDiagnosis, setIsRefiningDiagnosis] = useState(false);
  const [isLoadingInquiry, setIsLoadingInquiry] = useState(false);
  const [preliminaryResult, setPreliminaryResult] = useState<DiagnosisOutput | null>(null);
  const [showRefineButton, setShowRefineButton] = useState(true);
  
  // 从 store 获取 inputFeatures 和 patientAge
  const inputFeatures = useDiagnosisStore(state => state.inputFeatures);
  const patientAge = useDiagnosisStore(state => state.patientInfo.age) ?? undefined;
  
  // 开始问诊流程
  const startInquiry = useCallback(async (result: DiagnosisOutput) => {
    if (isRefiningDiagnosis) return;
    
    setIsRefiningDiagnosis(true);
    setIsLoadingInquiry(true);
    setShowRefineButton(false);
    setPreliminaryResult(result);
    
    try {
      const { questions, conversationId } = await generateInquiryQuestions(
        result,
        inputFeatures,
        patientAge
      );
      
      setInquiryQuestions(questions);
      setInquiryConversationId(conversationId);
      setShowInquiry(true);
      setIsLoadingInquiry(false);
    } catch (error) {
      console.error('生成问诊问题失败:', error);
      toast.error('生成问诊问题失败，请重试');
      setShowRefineButton(true);
    } finally {
      setIsRefiningDiagnosis(false);
      setIsLoadingInquiry(false);
    }
  }, [isRefiningDiagnosis, inputFeatures, patientAge]);
  
  // 提交问诊答案
  const submitInquiry = useCallback(async (answers: Record<string, string>): Promise<DiagnosisOutput> => {
    if (!preliminaryResult || !inquiryConversationId) {
      throw new Error('问诊数据不完整');
    }
    
    setIsRefiningDiagnosis(true);
    
    try {
      const finalResult = await submitInquiryAnswers(
        inquiryConversationId,
        answers,
        preliminaryResult,
        inputFeatures,  // 补传 inputFeatures
        patientAge       // 补传 patientAge
      );
      
      setShowInquiry(false);
      setIsRefiningDiagnosis(false);
      
      return finalResult;
    } catch (error) {
      console.error('提交问诊失败:', error);
      toast.error('提交问诊失败，请重试');
      throw error;
    }
  }, [preliminaryResult, inquiryConversationId, inputFeatures, patientAge]);
  
  // 取消问诊
  const cancelInquiry = useCallback(() => {
    setShowInquiry(false);
    setShowRefineButton(true);
    setIsRefiningDiagnosis(false);
    setIsLoadingInquiry(false);
  }, []);
  
  // 关闭问诊对话框
  const closeInquiry = useCallback(() => {
    setShowInquiry(false);
    setShowRefineButton(true);
  }, []);
  
  const value = useMemo(() => ({
    showInquiry,
    inquiryQuestions,
    inquiryConversationId,
    isRefiningDiagnosis,
    isLoadingInquiry,
    preliminaryResult,
    showRefineButton,
    startInquiry,
    submitInquiry,
    cancelInquiry,
    closeInquiry,
  }), [showInquiry, inquiryQuestions, inquiryConversationId, isRefiningDiagnosis, isLoadingInquiry, preliminaryResult, showRefineButton, startInquiry, submitInquiry, cancelInquiry, closeInquiry]);
  
  return (
    <InquiryContext.Provider value={value}>
      {children}
    </InquiryContext.Provider>
  );
}

export function useInquiryContext() {
  const context = useContext(InquiryContext);
  if (!context) {
    throw new Error('useInquiryContext must be used within InquiryProvider');
  }
  return context;
}
