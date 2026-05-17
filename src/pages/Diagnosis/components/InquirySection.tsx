/**
 * 问诊区域组件
 * 包含问诊对话框入口和对话框本身
 */
import React from 'react';
import InquiryDialog, { InquiryQuestion } from '@/components/InquiryDialog';
import { DiagnosisOutput } from '@/types';
import InquiryDialog from '@/components/InquiryDialog';

interface InquirySectionProps {
  showInquiry: boolean;
  inquiryQuestions: InquiryQuestion[];
  inquiryConversationId: string | null;
  preliminaryResult: DiagnosisOutput | null;
  isLoadingInquiry: boolean;
  isRefiningDiagnosis: boolean;
  onSubmit: (answers: Record<string, string>) => Promise<DiagnosisOutput>;
  onCancel: () => void;
  onClose: () => void;
}

export default function InquirySection({
  showInquiry,
  inquiryQuestions,
  inquiryConversationId,
  preliminaryResult,
  isLoadingInquiry,
  isRefiningDiagnosis,
  onSubmit,
  onCancel,
  onClose,
}: InquirySectionProps) {
  if (!showInquiry) return null;

  // 加载中状态
  if (isLoadingInquiry) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl">
          <svg className="animate-spin w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-stone-600 font-medium">正在生成问诊问题...</p>
          <button
            onClick={onCancel}
            className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    );
  }

  // 问诊对话框
  return (
    <InquiryDialog
      questions={inquiryQuestions}
      conversationId={inquiryConversationId || ''}
      preliminaryResult={preliminaryResult}
      onSubmit={onSubmit}
      onCancel={onCancel}
      isLoading={isRefiningDiagnosis}
    />
  );
}
