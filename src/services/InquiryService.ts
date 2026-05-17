/**
 * 问诊服务 - 智能问诊相关逻辑
 */
import toast from 'react-hot-toast';
import { DiagnosisOutput, InquiryQuestion } from '@/types';
import { submitDiagnosis } from '@/services/api';
import { getLifeCareAdvice } from '@/engine/lifeCareEngine';

/**
 * 问诊服务配置
 */
export interface InquiryServiceConfig {
  onQuestionsGenerated?: (questions: InquiryQuestion[], conversationId: string) => void;
  onInquiryComplete?: (finalResult: DiagnosisOutput) => void;
}

/**
 * 使用问诊引擎诊断（整合用户回答）
 */
export async function diagnoseWithInquiry(
  conversationId: string,
  answers: Record<string, string>,
  preliminaryResult: DiagnosisOutput,
  config?: InquiryServiceConfig
): Promise<DiagnosisOutput> {
  try {
    // 调用问诊引擎 API
    const response = await fetch('/api/inquiry/refine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: conversationId,
        answers,
        preliminary_result: preliminaryResult,
      }),
    });

    if (!response.ok) {
      throw new Error(`问诊API调用失败: ${response.status}`);
    }

    const refinedResult = await response.json();
    
    // 整合结果：问诊后优先级 - 针灸方案优先使用原辨证的
    const finalResult: DiagnosisOutput = {
      diagnosisResult: refinedResult.diagnosisResult || preliminaryResult.diagnosisResult,
      acupuncturePlan: refinedResult.acupuncturePlan || preliminaryResult.acupuncturePlan || refinedResult.acupuncturePlan,
      lifeCareAdvice: refinedResult.lifeCareAdvice || getLifeCareAdvice(refinedResult.diagnosisResult || preliminaryResult.diagnosisResult),
    };

    config?.onInquiryComplete?.(finalResult);
    toast.success('✅ 问诊完成，辨证更精准');
    
    return finalResult;
  } catch (error) {
    console.error('问诊诊断失败:', error);
    throw error;
  }
}

/**
 * 生成问诊问题
 */
export async function generateInquiryQuestions(
  preliminaryResult: DiagnosisOutput,
  config?: InquiryServiceConfig
): Promise<{ questions: InquiryQuestion[]; conversationId: string }> {
  try {
    // 调用问诊问题生成 API
    const response = await fetch('/api/inquiry/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        preliminary_result: preliminaryResult,
      }),
    });

    if (!response.ok) {
      throw new Error(`问诊问题生成失败: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      questions: data.questions || [],
      conversationId: data.conversation_id || `inq_${Date.now()}`,
    };
  } catch (error) {
    console.error('生成问诊问题失败:', error);
    throw error;
  }
}

/**
 * 提交问诊答案并获取最终诊断
 */
export async function submitInquiryAnswers(
  conversationId: string,
  answers: Record<string, string>,
  preliminaryResult: DiagnosisOutput,
  config?: InquiryServiceConfig
): Promise<DiagnosisOutput> {
  return diagnoseWithInquiry(conversationId, answers, preliminaryResult, config);
}

/**
 * 获取问诊进度文本
 */
export function getInquiryProgressText(step: 'idle' | 'generating' | 'answering' | 'processing' | 'complete'): string {
  const progressMap = {
    idle: '等待开始',
    generating: '正在生成问题...',
    answering: '请回答问题',
    processing: '正在整合分析...',
    complete: '问诊完成',
  };
  return progressMap[step] || '处理中...';
}

/**
 * 计算问诊进度百分比
 */
export function getInquiryProgressPercent(step: 'idle' | 'generating' | 'answering' | 'processing' | 'complete'): number {
  const percentMap = {
    idle: 0,
    generating: 25,
    answering: 50,
    processing: 75,
    complete: 100,
  };
  return percentMap[step] || 0;
}
