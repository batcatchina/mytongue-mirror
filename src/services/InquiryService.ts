/**
 * 问诊服务 - 智能问诊相关逻辑
 * 使用本地问诊引擎替代远程API
 */
import toast from 'react-hot-toast';
import { DiagnosisOutput } from '@/types';
import { getLifeCareAdvice } from '@/engine/lifeCareEngine';
import { QuestionTree } from '@/services/interrogation/QuestionTree';
import { InquiryQuestion } from '@/components/InquiryDialog';

/**
 * 问诊服务配置
 */
export interface InquiryServiceConfig {
  onQuestionsGenerated?: (questions: InquiryQuestion[], conversationId: string) => void;
  onInquiryComplete?: (finalResult: DiagnosisOutput) => void;
}

/**
 * 将本地Question转换为InquiryQuestion格式
 */
function convertToInquiryQuestion(question: any): InquiryQuestion {
  return {
    id: question.id,
    text: question.content,
    options: question.options.map((opt: any) => opt.text || opt.value),
    reason: question.validationPurpose,
  };
}

/**
 * 从辨证结果中提取推理节点信息（用于生成问诊问题）
 */
function extractInferenceNodes(result: DiagnosisOutput): any[] {
  const nodes: any[] = [];
  
  // 从 diagnosisResult 中提取证型信息
  if (result.diagnosisResult) {
    const diagnosis = result.diagnosisResult;
    
    // 如果是字符串格式（如 "气虚、脾虚"）
    if (typeof diagnosis === 'string') {
      const syndromes = diagnosis.split(/[,、]/).filter(Boolean);
      syndromes.forEach((syndrome, idx) => {
        nodes.push({
          id: `syndrome-${idx}`,
          conclusion: {
            label: syndrome.trim(),
            confidence: 0.6, // 假设初始置信度
          },
        });
      });
    }
    // 如果是对象格式
    else if (typeof diagnosis === 'object') {
      if (diagnosis.primarySyndrome) {
        nodes.push({
          id: 'primary',
          conclusion: {
            label: diagnosis.primarySyndrome,
            confidence: diagnosis.primaryConfidence || 0.7,
          },
        });
      }
      if (diagnosis.syndromeTypes) {
        diagnosis.syndromeTypes.forEach((s: string, idx: number) => {
          nodes.push({
            id: `syndrome-${idx}`,
            conclusion: {
              label: s,
              confidence: 0.6,
            },
          });
        });
      }
    }
  }
  
  // 默认添加一些基础证型节点以确保有问诊问题
  if (nodes.length === 0) {
    nodes.push({
      id: 'default-qi-deficiency',
      conclusion: { label: '气虚', confidence: 0.5 },
    });
    nodes.push({
      id: 'default-yin-deficiency',
      conclusion: { label: '阴虚', confidence: 0.5 },
    });
  }
  
  return nodes;
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
    // 使用本地引擎整合用户回答
    // 根据回答调整辨证结果
    let refinedResult = { ...preliminaryResult };
    
    // 分析回答并调整辨证
    for (const [questionId, answer] of Object.entries(answers)) {
      // 根据问题ID和回答调整证型
      if (questionId.includes('fatigue') || questionId.includes('疲劳')) {
        if (answer.includes('是') || answer.includes('经常')) {
          // 增加气虚权重
          refinedResult.diagnosisResult = refineSyndrome(refinedResult.diagnosisResult, '气虚', 0.2);
        }
      }
      if (questionId.includes('thirsty') || questionId.includes('口干') || questionId.includes('渴')) {
        if (answer.includes('是') || answer.includes('明显')) {
          refinedResult.diagnosisResult = refineSyndrome(refinedResult.diagnosisResult, '阴虚', 0.2);
        }
      }
      if (questionId.includes('cold') || questionId.includes('寒热')) {
        if (answer.includes('怕冷')) {
          refinedResult.diagnosisResult = refineSyndrome(refinedResult.diagnosisResult, '阳虚', 0.15);
        } else if (answer.includes('怕热')) {
          refinedResult.diagnosisResult = refineSyndrome(refinedResult.diagnosisResult, '阴虚', 0.15);
        }
      }
      if (questionId.includes('stool') || questionId.includes('二便')) {
        if (answer.includes('溏') || answer.includes('稀')) {
          refinedResult.diagnosisResult = refineSyndrome(refinedResult.diagnosisResult, '脾虚', 0.2);
        } else if (answer.includes('便秘') || answer.includes('干')) {
          refinedResult.diagnosisResult = refineSyndrome(refinedResult.diagnosisResult, '热证', 0.15);
        }
      }
      if (questionId.includes('sleep') || questionId.includes('睡眠')) {
        if (answer.includes('失眠') || answer.includes('难入睡')) {
          refinedResult.diagnosisResult = refineSyndrome(refinedResult.diagnosisResult, '心火', 0.15);
          refinedResult.diagnosisResult = refineSyndrome(refinedResult.diagnosisResult, '阴虚', 0.1);
        }
      }
      if (questionId.includes('diet') || questionId.includes('饮食')) {
        if (answer.includes('不振') || answer.includes('差')) {
          refinedResult.diagnosisResult = refineSyndrome(refinedResult.diagnosisResult, '脾虚', 0.2);
        }
      }
    }
    
    // 整合结果：问诊后优先级 - 针灸方案优先使用原辨证的
    const finalResult: DiagnosisOutput = {
      diagnosisResult: refinedResult.diagnosisResult || preliminaryResult.diagnosisResult,
      acupuncturePlan: preliminaryResult.acupuncturePlan || refinedResult.acupuncturePlan,
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
 * 精细化证型字符串
 */
function refineSyndrome(current: any, addSyndrome: string, boost: number): any {
  if (!current) return addSyndrome;
  
  let currentStr = typeof current === 'string' ? current : 
    (current.primarySyndrome || JSON.stringify(current));
  
  // 如果证型已存在，增加其权重标记
  if (!currentStr.includes(addSyndrome)) {
    // 保持原有证型，添加新证型
    currentStr = currentStr + '、' + addSyndrome;
  }
  
  return currentStr;
}

/**
 * 生成问诊问题 - 使用本地问诊引擎
 */
export async function generateInquiryQuestions(
  preliminaryResult: DiagnosisOutput,
  config?: InquiryServiceConfig
): Promise<{ questions: InquiryQuestion[]; conversationId: string }> {
  try {
    // 提取推理节点
    const inferenceNodes = extractInferenceNodes(preliminaryResult);
    
    // 使用本地QuestionTree生成问题
    const questionTree = new QuestionTree();
    const questions = questionTree.buildTree(
      undefined, // tongueResult
      inferenceNodes,
      preliminaryResult.patientAge || 30
    );
    
    // 转换格式并限制数量
    const inquiryQuestions = questions
      .slice(0, 5) // 最多5个问题
      .map(convertToInquiryQuestion);
    
    const conversationId = `inq_${Date.now()}`;
    
    config?.onQuestionsGenerated?.(inquiryQuestions, conversationId);
    
    return {
      questions: inquiryQuestions,
      conversationId,
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
