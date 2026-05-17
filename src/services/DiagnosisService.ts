/**
 * 诊断服务 - 封装 DeepSeek/本地引擎调用
 * 深度认知：四层推理引擎的逻辑不能动，只做外围结构优化
 */
import toast from 'react-hot-toast';
import { DiagnosisInput, DiagnosisOutput } from '@/types';
import { transmissionEngine } from '@/engine/core/TransmissionEngine';
import { getLifeCareAdvice } from '@/engine/lifeCareEngine';
import { diagCacheKey, diagCacheGet, diagCacheSet } from './CacheService';

/**
 * 诊断服务配置
 */
export interface DiagnosisServiceConfig {
  enableCache?: boolean;
  enableDeepSeek?: boolean;
  onStepChange?: (step: string) => void;
}

/**
 * 诊断步骤
 */
export type DiagnosisStep = 
  | 'idle' | 'uploading' | 'recognizing' | 'analyzing' 
  | 'reasoning' | 'matching' | 'result';

/**
 * 诊断结果（含步骤信息）
 */
export interface DiagnosisResult {
  output: DiagnosisOutput;
  fromCache: boolean;
  step: DiagnosisStep;
}

/**
 * 使用 DeepSeek 进行舌象诊断
 */
export async function diagnoseWithDeepSeek(
  input: DiagnosisInput,
  config?: DiagnosisServiceConfig
): Promise<DiagnosisOutput> {
  const { onStepChange } = config || {};
  
  try {
    // 步骤1: 分析舌象
    onStepChange?.('analyzing');
    
    const response = await fetch('/api/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input_features: input.input_features,
        deepseek_enabled: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`API调用失败: ${response.status}`);
    }

    const result = await response.json();
    
    // 步骤2: 推理
    onStepChange?.('reasoning');
    
    // 使用四层推理引擎
    const engine = transmissionEngine;
    const reasoningResult = await engine.inference({
      tongueBody: input.input_features.tongueColor.value || '淡红',
      tongueColor: input.input_features.tongueColor.value || '淡红',
      tongueShape: input.input_features.tongueShape.value || '正常',
      tongueState: input.input_features.tongueState.value || '正常',
      coatingColor: input.input_features.coating?.color || '薄白',
      coatingTexture: input.input_features.coating?.texture || '薄',
      coatingMoisture: input.input_features.coating?.moisture || '润',
      teethMark: input.input_features.teethMark?.value === '是',
      crack: input.input_features.crack?.value === '是',
      distributionFeatures: input.input_features.distributionFeatures,
      shapeDistribution: input.input_features.shapeDistribution,
    });

    // 步骤3: 匹配规则
    onStepChange?.('matching');
    
    // 合并 DeepSeek 结果和规则引擎结果
    const mergedResult: DiagnosisOutput = {
      ...result,
      diagnosisResult: reasoningResult.diagnosisResult || result.diagnosisResult,
      acupuncturePlan: reasoningResult.acupuncturePlan || result.acupuncturePlan,
      lifeCareAdvice: result.lifeCareAdvice || getLifeCareAdvice(reasoningResult.diagnosisResult),
    };

    // 步骤4: 完成
    onStepChange?.('result');
    
    return mergedResult;
  } catch (error) {
    console.error('DeepSeek诊断失败:', error);
    throw error;
  }
}

/**
 * 使用本地规则引擎进行诊断（Fallback）
 */
export function diagnoseWithLocalEngine(
  input: DiagnosisInput,
  config?: DiagnosisServiceConfig
): DiagnosisOutput {
  const { onStepChange } = config || {};
  
  try {
    onStepChange?.('analyzing');
    
    // 使用四层推理引擎
    const engine = transmissionEngine;
    const reasoningResult = engine.inference({
      tongueBody: input.input_features.tongueColor.value || '淡红',
      tongueColor: input.input_features.tongueColor.value || '淡红',
      tongueShape: input.input_features.tongueShape.value || '正常',
      tongueState: input.input_features.tongueState.value || '正常',
      coatingColor: input.input_features.coating?.color || '薄白',
      coatingTexture: input.input_features.coating?.texture || '薄',
      coatingMoisture: input.input_features.coating?.moisture || '润',
      teethMark: input.input_features.teethMark?.value === '是',
      crack: input.input_features.crack?.value === '是',
      distributionFeatures: input.input_features.distributionFeatures,
      shapeDistribution: input.input_features.shapeDistribution,
    });

    onStepChange?.('matching');
    
    const result: DiagnosisOutput = {
      diagnosisResult: reasoningResult.diagnosisResult!,
      acupuncturePlan: reasoningResult.acupuncturePlan!,
      lifeCareAdvice: getLifeCareAdvice(reasoningResult.diagnosisResult),
    };

    onStepChange?.('result');
    
    return result;
  } catch (error) {
    console.error('本地引擎诊断失败:', error);
    throw error;
  }
}

/**
 * 执行完整诊断流程（带缓存和降级）
 */
export async function performDiagnosis(
  input: DiagnosisInput,
  config?: DiagnosisServiceConfig
): Promise<DiagnosisResult> {
  const { enableCache = true, enableDeepSeek = true, onStepChange } = config || {};
  
  // 1. 检查缓存
  if (enableCache) {
    const cacheKey = diagCacheKey(input.input_features, input);
    const cachedResult = diagCacheGet(cacheKey);
    if (cachedResult) {
      onStepChange?.('result');
      toast.success('📋 从缓存加载诊断结果');
      return { output: cachedResult, fromCache: true, step: 'result' };
    }
  }

  // 2. 尝试 DeepSeek 诊断
  if (enableDeepSeek) {
    try {
      const result = await diagnoseWithDeepSeek(input, config);
      
      // 缓存结果
      if (enableCache) {
        const cacheKey = diagCacheKey(input.input_features, input);
        diagCacheSet(cacheKey, result);
      }
      
      return { output: result, fromCache: false, step: 'result' };
    } catch (error) {
      console.warn('DeepSeek诊断失败，尝试本地引擎:', error);
      toast.error('AI服务暂时不可用，使用本地诊断');
    }
  }

  // 3. 降级到本地规则引擎
  onStepChange?.('reasoning');
  const result = diagnoseWithLocalEngine(input, config);
  
  // 缓存结果
  if (enableCache) {
    const cacheKey = diagCacheKey(input.input_features, input);
    diagCacheSet(cacheKey, result);
  }
  
  return { output: result, fromCache: false, step: 'result' };
}

/**
 * Fallback 到本地引擎（用户点击触发）
 */
export function handleFallbackToLocal(
  input: DiagnosisInput,
  onStepChange?: (step: string) => void
): DiagnosisOutput {
  onStepChange?.('reasoning');
  
  const result = diagnoseWithLocalEngine(input, { onStepChange });
  
  // 缓存结果
  const cacheKey = diagCacheKey(input.input_features, input);
  diagCacheSet(cacheKey, result);
  
  return result;
}
