/**
 * 问诊服务 - 智能问诊相关逻辑
 * 优先调用后端DeepSeek API，本地QuestionTree作为降级方案
 */
import toast from 'react-hot-toast';
import { DiagnosisOutput, InputFeatures } from '@/types';
import type { TongueAnalysisResult } from '@/types/tongue';
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
 * 舌象特征对象（与后端API一致）
 */
export interface TongueFeatures {
  tongueColor: string;
  tongueShape?: string;
  coatingColor: string;
  coatingTexture?: string;
  coatingMoisture?: string;
  teethMark?: boolean;
  crack?: boolean;
  tongueState?: string;
  shapeDistribution?: {
    depression?: string[];
    bulge?: string[];
  };
  distributionFeatures?: Array<{ part: string; feature: string }>;
}

/**
 * 从InputFeatures构造TongueFeatures对象
 */
export function buildTongueFeatures(inputFeatures: InputFeatures): TongueFeatures {
  const shapeDist = inputFeatures.shapeDistribution;
  const hasTeethMark = inputFeatures.teethMark?.value === '是' || shapeDist?.depression?.includes('齿痕') || false;
  const hasCrack = inputFeatures.crack?.value === '是' || shapeDist?.depression?.includes('裂纹') || false;
  
  return {
    tongueColor: inputFeatures.tongueColor.value || '淡红',
    tongueShape: inputFeatures.tongueShape.value || '正常',
    coatingColor: inputFeatures.coating.color || '薄白',
    coatingTexture: inputFeatures.coating.texture || '薄',
    coatingMoisture: inputFeatures.coating.moisture || '润',
    teethMark: hasTeethMark,
    crack: hasCrack,
    tongueState: inputFeatures.tongueState.value || '正常',
    shapeDistribution: inputFeatures.shapeDistribution,
    distributionFeatures: inputFeatures.distributionFeatures,
  };
}

/**
 * 将InputFeatures转换为TongueAnalysisResult
 * 用于QuestionTree动态生成定向问诊问题
 */
function convertInputFeaturesToTongueResult(inputFeatures?: InputFeatures): TongueAnalysisResult | undefined {
  if (!inputFeatures) return undefined;
  
  return {
    bodyColor: (inputFeatures.tongueColor.value as any) || '淡红',
    shape: (inputFeatures.tongueShape.value as any) || '正常',
    coatingColor: (inputFeatures.coating.color as any) || '薄白',
    coatingTexture: (inputFeatures.coating.texture as any) || '薄',
    state: (inputFeatures.tongueState.value as any) || '正常',
    hasTeethMark: inputFeatures.teethMark?.value === '是' || 
                  inputFeatures.shapeDistribution?.depression?.includes('齿痕') || false,
    hasCrack: inputFeatures.crack?.value === '是' || 
              inputFeatures.shapeDistribution?.depression?.includes('裂纹') || false,
    zoneFeatures: inputFeatures.distributionFeatures?.map(f => ({
      position: f.part as any,
      color: '',
      undulation: f.feature.includes('凹陷') ? 'depression' : f.feature.includes('凸起') ? 'bulge' : undefined,
    })),
  };
}

/**
 * 根据置信度计算需要问诊的问题数量
 * - 置信度 ≥ 0.8：不问
 * - 置信度 0.6-0.8：问1-2题
 * - 置信度 < 0.6：问2-3题
 */
function getQuestionCountByConfidence(confidence: number): number {
  if (confidence >= 0.8) return 0;
  if (confidence >= 0.6) return Math.random() > 0.5 ? 1 : 2;
  return Math.floor(Math.random() * 2) + 2; // 2-3题
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
            confidence: 0.6,
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
 * 使用问诊引擎诊断（整合用户回答）- 本地降级版本
 */
async function diagnoseWithInquiryLocal(
  conversationId: string,
  answers: Record<string, string>,
  preliminaryResult: DiagnosisOutput,
  config?: InquiryServiceConfig
): Promise<DiagnosisOutput> {
  // 分析回答并调整辨证
  let refinedResult = { ...preliminaryResult };
  
  for (const [questionId, answer] of Object.entries(answers)) {
    if (questionId.includes('fatigue') || questionId.includes('疲劳')) {
      if (answer.includes('是') || answer.includes('经常')) {
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
  
  // 整合结果
  const finalResult: DiagnosisOutput = {
    diagnosisResult: refinedResult.diagnosisResult || preliminaryResult.diagnosisResult,
    acupuncturePlan: preliminaryResult.acupuncturePlan || refinedResult.acupuncturePlan,
    lifeCareAdvice: refinedResult.lifeCareAdvice || getLifeCareAdvice(refinedResult.diagnosisResult || preliminaryResult.diagnosisResult),
  };

  config?.onInquiryComplete?.(finalResult);
  toast.success('✅ 问诊完成，辨证更精准');
  
  return finalResult;
}

/**
 * 精细化证型字符串
 */
function refineSyndrome(current: any, addSyndrome: string, boost: number): any {
  if (!current) return addSyndrome;
  
  let currentStr: string;
  if (typeof current === 'string') {
    currentStr = current;
  } else if (current && typeof current === 'object' && current.primarySyndrome) {
    currentStr = current.primarySyndrome;
  } else if (current && typeof current === 'object') {
    // 尝试提取证型数组
    try {
      currentStr = current.syndromeTypes?.join('、') || current.mainSyndrome || JSON.stringify(current);
    } catch {
      currentStr = addSyndrome;
    }
  } else {
    currentStr = String(current);
  }
  
  if (!currentStr.includes(addSyndrome)) {
    currentStr = currentStr + '、' + addSyndrome;
  }
  
  return currentStr;
}

/**
 * 生成问诊问题 - 优先调用后端DeepSeek API，本地QuestionTree作为降级
 */
export async function generateInquiryQuestions(
  preliminaryResult: DiagnosisOutput,
  inputFeatures?: InputFeatures,
  patientAge?: number,
  config?: InquiryServiceConfig
): Promise<{ questions: InquiryQuestion[]; conversationId: string; preliminaryResult?: DiagnosisOutput }> {
  // 如果有inputFeatures，调用后端API
  if (inputFeatures) {
    try {
      const tongueFeatures = buildTongueFeatures(inputFeatures);
      
      const response = await fetch('/api/tongue-ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tongueFeatures,
          age: patientAge,
          mode: 'inquiry',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.questions && data.questions.length > 0) {
          const inquiryQuestions: InquiryQuestion[] = data.questions.map((q: any) => ({
            id: q.id,
            text: q.text,
            options: q.options,
            reason: q.reason || '',
          }));
          
          config?.onQuestionsGenerated?.(inquiryQuestions, data.conversationId || `sz_${Date.now()}`);
          
          return {
            questions: inquiryQuestions,
            conversationId: data.conversationId || `sz_${Date.now()}`,
            preliminaryResult: data.preliminaryResult,
          };
        }
        
        // 如果API返回不需要问诊（高置信度），返回空问题
        if (data.success && (!data.questions || data.questions.length === 0)) {
          console.log('[InquiryService] 后端返回不需要问诊');
          return {
            questions: [],
            conversationId: data.conversationId || `sz_${Date.now()}`,
            preliminaryResult: data.preliminaryResult || preliminaryResult,
          };
        }
      }
      
      console.warn('[InquiryService] 后端API调用失败，尝试降级到本地引擎');
    } catch (error) {
      console.error('[InquiryService] 后端API调用异常:', error);
      toast.error('智能问诊服务暂不可用，使用本地引擎');
    }
  }
  
  // 降级到本地QuestionTree引擎
  console.log('[InquiryService] 使用本地QuestionTree引擎生成问诊问题');
  try {
    const inferenceNodes = extractInferenceNodes(preliminaryResult);
    const tongueResult = convertInputFeaturesToTongueResult(inputFeatures);
    
    // 根据推理节点置信度计算需要问诊的问题数量
    const avgConfidence = inferenceNodes.length > 0 
      ? inferenceNodes.reduce((sum, n) => sum + (n.conclusion?.confidence || 0.5), 0) / inferenceNodes.length
      : 0.5;
    const maxQuestions = getQuestionCountByConfidence(avgConfidence);
    
    // 如果置信度足够高，不需要问诊
    if (maxQuestions === 0) {
      console.log('[InquiryService] 置信度足够高，跳过问诊');
      return {
        questions: [],
        conversationId: `inq_${Date.now()}`,
        preliminaryResult,
      };
    }
    
    const questionTree = new QuestionTree();
    const questions = questionTree.buildTree(
      tongueResult,  // 传入舌象分析结果，实现定向问诊
      inferenceNodes,
      patientAge || preliminaryResult.patientAge || 30
    );
    
    // 按置信度和舌象特征筛选问题，确保定向性
    const inquiryQuestions = questions
      .slice(0, maxQuestions)
      .map(convertToInquiryQuestion);
    
    const conversationId = `inq_${Date.now()}`;
    
    config?.onQuestionsGenerated?.(inquiryQuestions, conversationId);
    
    return {
      questions: inquiryQuestions,
      conversationId,
    };
  } catch (error) {
    console.error('[InquiryService] 本地引擎也失败:', error);
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
  inputFeatures?: InputFeatures,
  patientAge?: number,
  config?: InquiryServiceConfig
): Promise<DiagnosisOutput> {
  // 如果有inputFeatures，调用后端confirm API
  if (inputFeatures) {
    try {
      const tongueFeatures = buildTongueFeatures(inputFeatures);
      
      // 转换answers格式
      const formattedAnswers = Object.entries(answers).map(([questionId, selectedOption]) => ({
        questionId,
        selectedOption,
      }));
      
      const response = await fetch('/api/tongue-ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tongueFeatures,
          age: patientAge,
          answers: formattedAnswers,
          conversationId,
          preliminaryResult,
          mode: 'confirm',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.data) {
          const refinedResult: DiagnosisOutput = {
            diagnosisResult: data.data.mainSyndrome || data.data.syndrome || preliminaryResult.diagnosisResult,
            acupuncturePlan: data.data.acupuncturePlan || preliminaryResult.acupuncturePlan,
            lifeCareAdvice: data.data.lifeCareAdvice || preliminaryResult.lifeCareAdvice || getLifeCareAdvice(data.data.mainSyndrome || preliminaryResult.diagnosisResult),
          };

          config?.onInquiryComplete?.(refinedResult);
          toast.success('✅ 问诊完成，辨证更精准');
          
          return refinedResult;
        }
      }
      
      console.warn('[InquiryService] 确认API调用失败，使用本地整合');
    } catch (error) {
      console.error('[InquiryService] 确认API调用异常:', error);
    }
  }
  
  // 降级到本地整合逻辑
  return diagnoseWithInquiryLocal(conversationId, answers, preliminaryResult, config);
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
