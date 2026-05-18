/**
 * 诊断服务 - 封装 DeepSeek/本地引擎调用
 * 深度认知：四层推理引擎的逻辑不能动，只做外围结构优化
 */
import toast from 'react-hot-toast';
import { DiagnosisInput, DiagnosisOutput } from '@/types';
import { DiagnosisEngine, diagnose as localDiagnose, getRuleStatistics } from './diagnosisEngine';
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

// 本地规则引擎实例
const localEngine = new DiagnosisEngine();

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
        input_features: input,
        deepseek_enabled: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`API调用失败: ${response.status}`);
    }

    const result = await response.json();
    onStepChange?.('result');
    
    return result;
  } catch (error) {
    console.error('DeepSeek诊断失败:', error);
    throw error;
  }
}

/**
 * 本地规则引擎输入转换
 * 将 store 格式转换为本地引擎格式
 */
function convertToLocalEngineInput(input: DiagnosisInput) {
  const features = input.input_features;
  const hasTeethMark = features.teethMark?.value === '是' || features.shapeDistribution?.depression?.includes('齿痕') || false;
  const hasCrack = features.crack?.value === '是' || features.shapeDistribution?.depression?.includes('裂纹') || false;
  
  return {
    tongueColor: features.tongueColor.value || '淡红',
    tongueShape: features.tongueShape.value || '正常',
    tongueState: features.tongueState.value || '正常',
    coatingColor: features.coating.color || '薄白',
    coatingTexture: features.coating.texture || '薄',
    coatingMoisture: features.coating.moisture || '润',
    teethMark: hasTeethMark,
    crack: hasCrack,
  };
}

/**
 * 本地规则引擎输出转换
 * 将本地引擎输出转换为前端格式
 */
function convertLocalEngineOutput(localOutput: any, originalInput: DiagnosisInput): DiagnosisOutput {
  const primary = localOutput.primaryResult;
  
  return {
    diagnosisResult: {
      primarySyndrome: primary.syndrome,
      confidence: primary.confidence / 100,
      syndromeTypes: localOutput.alternativeResults.map((r: any) => r.syndrome),
      reasoning: primary.pathogenesis,
    },
    acupuncturePlan: {
      mainPoints: localOutput.acupointSelection.mainPoints,
      secondaryPoints: localOutput.acupointSelection.secondaryPoints,
      technique: localOutput.acupointSelection.method.technique,
    },
    lifeCareAdvice: primary.treatment ? [primary.treatment] : [],
    clinicalNotes: localOutput.clinicalNotes,
  };
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
    
    // 转换输入格式
    const localInput = convertToLocalEngineInput(input);
    console.log('[本地引擎] 输入:', JSON.stringify(localInput, null, 2));
    
    // 调用本地规则引擎
    const localResult = localDiagnose(localInput);
    console.log('[本地引擎] 结果:', JSON.stringify(localResult, null, 2));
    
    // 转换输出格式
    const result = convertLocalEngineOutput(localResult, input);
    
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
    const cacheKey = diagCacheKey({ input_features: input } as any, {} as any);
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
        const cacheKey = diagCacheKey({ input_features: input } as any, {} as any);
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
    const cacheKey = diagCacheKey({ input_features: input } as any, {} as any);
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
  const cacheKey = diagCacheKey({ input_features: input } as any, {} as any);
  diagCacheSet(cacheKey, result);
  
  return result;
}
