import type { DiagnosisInput, DiagnosisOutput, DiagnosisEvidence, AcupuncturePoint } from '@/types';
import { getMeridian, getEffect } from './acupoint_data';

const API_BASE_URL = 'https://api.coze.cn';
const BOT_ID = '7630373624734236672';
const API_TOKEN = 'pat_RpduRPvBPQIbpRLtAXy9NBFruewZlVKN4gH4aLgby6z2MgjNEejR2E7X8PV1L2iJ';

// ============================================
// 统一错误关键词定义（核心配置）
// 注意：只保留真正的错误信号，避免误判Bot的正常诊断反馈
// ============================================
export const ERROR_PATTERNS = [
  'INVALID_IMAGE',
  'LOW_QUALITY_IMAGE',
  'IMAGE_QUALITY_TOO_LOW',
  '无法识别舌象',
  '图片质量过低',
];

export const ERROR_KEYWORDS = [
  'INVALID_IMAGE',
];

// API错误码映射
export const API_ERROR_CODES: Record<number, { message: string; suggestion: string }> = {
  4010: { message: '请求超时', suggestion: '图片可能过大，建议重新压缩后上传' },
  4001: { message: '认证失败', suggestion: '服务配置异常，请稍后重试' },
  4002: { message: '参数错误', suggestion: '请检查输入内容后重试' },
  4003: { message: '请求频率超限', suggestion: '操作过于频繁，请稍后重试' },
  5000: { message: '服务器内部错误', suggestion: '服务繁忙，请稍后重试' },
  5001: { message: '服务暂时不可用', suggestion: '服务维护中，请稍后重试' },
};

// Coze API错误事件类型
export const ERROR_EVENTS = [
  'conversation.chat.failed',
  'error',
];

function parseMarkdownDiagnosis(markdown: string): DiagnosisOutput {
  // 主要证型 - 同时支持 **主要证型** 和 主要证型 两种格式
  const primaryMatch = markdown.match(/\*\*主要证型\*\*[：:]\s*([^\n]+)/) 
    || markdown.match(/主要证型[：:]\s*([^\n]+)/);
  const primarySyndrome = primaryMatch ? primaryMatch[1].trim() : '辨证分析完成';

  const scoreMatch = markdown.match(/\*\*证型得分\*\*[：:]\s*(\d+)/)
    || markdown.match(/证型得分[：:]\s*(\d+)/);
  const syndromeScore = scoreMatch ? parseInt(scoreMatch[1]) : 5;

  // 病机分析 - 同时支持 **病机分析** 和 病机分析 两种格式，并捕获多行内容
  // 优先匹配多行内容（从"病机分析："到下一个空行或特定标记）
  const pathogenesisMultiMatch = markdown.match(/病机分析[：:]\s*([\s\S]*?)(?=\n\n|\n针灸|##|$)/);
  const pathogenesisMatch = markdown.match(/\*\*病机分析\*\*[：:]\s*([^\n]+)/)
    || markdown.match(/病机分析[：:]\s*([^\n]+)/);
  const pathogenesis = pathogenesisMultiMatch 
    ? pathogenesisMultiMatch[1].trim().replace(/\n+/g, ' ')  // 多行合并为单行
    : (pathogenesisMatch ? pathogenesisMatch[1].trim() : '');

  // 脏腑定位解析 - 同时支持粗体和非粗体格式
  const organMatch = markdown.match(/\*\*脏腑定位\*\*[：:]\s*([^\n]+)/)
    || markdown.match(/脏腑定位[：:]\s*([^\n]+)/);
  const organLocation = organMatch 
    ? organMatch[1].split(/[、,，\s]+/).filter((s: string) => s.trim()) 
    : [];

  // 解析辨证依据 - 支持多种格式
  const diagnosisEvidence: DiagnosisEvidence[] = [];
  
  // 格式1: "1. 红舌 → 提示热证（权重：85）"
  const evidencePattern1 = /\d+\.\s*(.+?)\s*[→→]\s*(.+?)（权重[：:]\s*(\d+)）/g;
  let match;
  while ((match = evidencePattern1.exec(markdown)) !== null) {
    diagnosisEvidence.push({
      feature: match[1].trim(),
      weight: parseInt(match[3]) || 5,
      contribution: match[2].trim(),
      matchDegree: 0.9,
      ruleId: `rule_${diagnosisEvidence.length + 1}`
    });
  }
  
  // 格式2: "1. 红舌：提示热证" (简单格式)
  if (diagnosisEvidence.length === 0) {
    const evidencePattern2 = /\d+\.\s*(.+?)[：:]\s*(.+)/g;
    while ((match = evidencePattern2.exec(markdown)) !== null) {
      diagnosisEvidence.push({
        feature: match[1].trim(),
        weight: 5,
        contribution: match[2].trim(),
        matchDegree: 0.9,
        ruleId: `rule_${diagnosisEvidence.length + 1}`
      });
    }
  }
  
  // 格式3: 如果没有匹配到结构化格式，提取关键特征
  if (diagnosisEvidence.length === 0) {
    const featureKeywords = ['红舌', '淡白舌', '胖大', '瘦薄', '裂纹', '齿痕', '黄苔', '白苔', '厚苔', '薄苔'];
    for (const keyword of featureKeywords) {
      if (markdown.includes(keyword) && diagnosisEvidence.length < 5) {
        diagnosisEvidence.push({
          feature: keyword,
          weight: 5,
          contribution: '辨证参考',
          matchDegree: 0.85,
          ruleId: `rule_${diagnosisEvidence.length + 1}`
        });
      }
    }
  }

  // 解析主穴 - 支持多种格式（粗体和非粗体）
  const mainPointsPatterns = [
    /\*\*主穴\*\*[：:]\s*([^\n]+)/,
    /主穴[：:]\s*([^\n]+)/,
    /\*\*针灸主穴\*\*[：:]\s*([^\n]+)/,
  ];
  let mainPointsText = '';
  for (const pattern of mainPointsPatterns) {
    const match = markdown.match(pattern);
    if (match) {
      mainPointsText = match[1].trim();
      break;
    }
  }
  
  // 解析配穴 - 支持条件格式（如"心烦明显：加劳宫"、"失眠严重：加百会、申脉"）
  const parseSecondaryPoints = (md: string): AcupuncturePoint[] => {
    // 查找配穴区域（从"配穴："到"刺法"或下一个##）
    const match = md.match(/配穴[：:]\s*([\s\S]*?)(?=\n刺法|##\s|\n\n|$)/);
    if (!match) return [];
    
    const section = match[1];
    const points: string[] = [];
    
    // 逐行处理
    const lines = section.split('\n');
    for (const line of lines) {
      // 提取所有 "加XXX" 格式
      const addMatches = line.match(/加([^\n]+)/g);
      if (addMatches) {
        addMatches.forEach(m => {
          const pointStr = m.replace('加', '').trim();
          // 按顿号、逗号分割
          const pointList = pointStr.split(/[、,，]/);
          pointList.forEach(p => {
            const trimmed = p.trim();
            if (trimmed && !trimmed.includes('无') && !/^\d+$/.test(trimmed)) {
              points.push(trimmed);
            }
          });
        });
      }
    }
    
    // 去重并过滤空值
    return [...new Set(points)].filter(p => p)
      .map(point => ({ 
        point, 
        meridian: getMeridian(point), 
        effect: getEffect(point), 
        technique: '平补平泻' 
      }));
  };
  
  const mainPoints: AcupuncturePoint[] = mainPointsText.split(/[、,，]/)
    .map(s => s.trim()).filter(s => s && !s.includes('无'))
    .map(point => ({ 
      point, 
      meridian: getMeridian(point), 
      effect: getEffect(point), 
      technique: '平补平泻' 
    }));

  const secondaryPoints = parseSecondaryPoints(markdown);

  const techniqueMatch = markdown.match(/\*\*刺法\*\*[：:]\s*([^\n]+)/)
    || markdown.match(/刺法[：:]\s*([^\n]+)/);
  const techniquePrinciple = techniqueMatch ? techniqueMatch[1].trim() : '';

  const frequencyMatch = markdown.match(/\*\*治疗频次\*\*[：:]\s*([^\n]+)/)
    || markdown.match(/治疗频次[：:]\s*([^\n]+)/);
  const treatmentFrequency = frequencyMatch ? frequencyMatch[1].trim() : '';

  const lifeCareSection = markdown.split(/##\s*生活调护/)[1] || '';
  const lifeCareItems = lifeCareSection.match(/[-•]\s*([^\n]+)/g) || [];
  const lifeCareAdvice = lifeCareItems.map(item => item.replace(/^[-•]\s*/, '').trim()).slice(0, 5);

  return {
    diagnosisResult: {
      primarySyndrome,
      syndromeScore,
      confidence: 0.8,
      secondarySyndromes: [],
      pathogenesis,
      organLocation,
      diagnosisEvidence,
      priority: '中',
      diagnosisTime: new Date().toISOString(),
    },
    acupuncturePlan: {
      treatmentPrinciple: '',
      mainPoints,
      secondaryPoints,
      contraindications: [],
      treatmentAdvice: {
        techniquePrinciple,
        needleRetentionTime: '',
        treatmentFrequency,
        treatmentSessions: '',
        sessionInterval: '',
      },
    },
    lifeCareAdvice: {
      dietSuggestions: lifeCareAdvice,
      dailyRoutine: [],
      precautions: [],
    },
    systemInfo: {
      knowledgeBaseVersion: '1.0',
      skillVersion: '1.0',
      reasoningRulesCount: 0,
      updateTime: new Date().toISOString(),
    },
  };
}

function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// 错误检测工具函数
// ============================================
function detectErrorInContent(content: string): string | null {
  console.log('[detectErrorInContent] 开始检测，内容长度:', content.length);
  console.log('[detectErrorInContent] 内容前100字符:', content.substring(0, 100));
  
  // 检查是否是有效的辨证结果
  const successIndicators = ['主要证型', '病机分析', '针灸方案', '主穴', '配穴'];
  const hasSuccessIndicator = successIndicators.some(indicator => content.includes(indicator));
  
  // 如果已有辨证结果，不报错
  if (hasSuccessIndicator) {
    console.log('[detectErrorInContent] 检测到有效的辨证结果，跳过错误检测');
    return null;
  }
  
  // 检查INVALID_IMAGE标记（Bot明确拒绝非舌象图片）
  if (content.includes('INVALID_IMAGE')) {
    console.log('[detectErrorInContent] ✅ 检测到INVALID_IMAGE标记！');
    return '当前图片不是舌象照片，无法进行辨证分析。请上传舌象图片或删除图片后手动输入舌象特征。';
  }
  
  // 检查其他错误模式
  for (const pattern of ERROR_PATTERNS) {
    if (content.includes(pattern)) {
      console.log(`[detectErrorInContent] 检测到错误模式: ${pattern}`);
      return '图片识别失败，请确保上传的是清晰的舌象照片。';
    }
  }
  
  console.log('[detectErrorInContent] 未检测到错误');
  return null;
}

function parseAPIErrorCode(errorData: any): { message: string; code: number } | null {
  // 从各种可能的错误格式中提取错误码
  const code = errorData?.code || errorData?.error_code || errorData?.err_code;
  if (code && API_ERROR_CODES[code]) {
    return { message: API_ERROR_CODES[code].message, code: Number(code) };
  }
  return null;
}

function getUserFriendlyError(error: any, context: string = ''): Error {
  // 1. 检查是否是API错误码
  const apiError = parseAPIErrorCode(error);
  if (apiError) {
    const errorConfig = API_ERROR_CODES[apiError.code];
    const suggestion = errorConfig?.suggestion || '请稍后重试';
    return new Error(`${apiError.message}${context ? ` (${context})` : ''}，${suggestion}`);
  }
  
  // 2. 检查错误消息中的错误码（如 "error_code: 4010"）
  if (typeof error === 'string') {
    const codeMatch = error.match(/error_code[:\s]*(\d+)/i);
    if (codeMatch) {
      const code = parseInt(codeMatch[1]);
      if (API_ERROR_CODES[code]) {
        return new Error(`${API_ERROR_CODES[code].message}，${API_ERROR_CODES[code].suggestion}`);
      }
    }
    
    // 检查内容中的错误关键词
    const contentError = detectErrorInContent(error);
    if (contentError) return new Error(contentError);
  }
  
  // 3. 检查error对象的message
  if (error?.message) {
    const contentError = detectErrorInContent(error.message);
    if (contentError) return new Error(contentError);
    
    // 检查消息中的错误码
    const codeMatch = error.message.match(/error_code[:\s]*(\d+)/i);
    if (codeMatch) {
      const code = parseInt(codeMatch[1]);
      if (API_ERROR_CODES[code]) {
        return new Error(`${API_ERROR_CODES[code].message}，${API_ERROR_CODES[code].suggestion}`);
      }
    }
  }
  
  // 4. 检查error对象的其他字段
  if (error?.error) {
    const contentError = detectErrorInContent(String(error.error));
    if (contentError) return new Error(contentError);
  }
  
  // 5. 返回原始错误或通用错误
  const originalMessage = error?.message || error?.msg || String(error);
  if (originalMessage.includes('timeout') || originalMessage.includes('超时')) {
    return new Error('请求超时，图片可能过大，请尝试压缩后重新上传');
  }
  
  if (originalMessage) {
    return new Error(`${originalMessage}${context ? ` (${context})` : ''}`);
  }
  
  return new Error('服务繁忙，请稍后重试');
}

export type DiagnosisProgressStep = 'recognizing' | 'analyzing' | 'reasoning' | 'matching';

/**
 * 舌镜辨证主流程 - DeepSeek直连版本
 * 
 * 修改历史：
 * - v1.0: 初始版本，调用Coze Bot API
 * - v2.0: 改为调用Vercel Function直连DeepSeek，砍掉Coze中间商
 * 
 * Vercel Function路径: /api/tongue-ai/diagnose
 */

import type { DiagnosisInput, DiagnosisOutput } from '@/types';
import { getMeridian, getEffect } from './acupoint_data';

// Vercel Function的API地址

const VERCE_API_URL = '/api/tongue-ai/diagnose';

/**
 * 清理穴位名称（去除编号、括号等）
 */
function cleanAcupointName(name: string): string {
  if (!name) return '';
  return String(name).replace(/[【】\[\]（）\(\)0-9.#*]/g, '').trim();
}

/**
 * 将API返回的数据转换为前端期望的DiagnosisOutput格式
 */
function transformToDiagnosisOutput(apiResult: any): DiagnosisOutput {
  // 提取证型信息
  const syndrome = apiResult.syndrome || apiResult.mainSyndrome || '辨证分析完成';
  const syndromeType = apiResult.syndromeType || apiResult.mainSyndromeType || '其他';
  const confidence = apiResult.confidence || 0.8;
  const patternAnalysis = apiResult.patternAnalysis || apiResult.analysis || '';
  const pathogenesis = apiResult.pathogenesis || '';

  // 提取穴位数组：优先用 acupuncturePlan.mainPoints/secondaryPoints，退化用 acupoints
  // 直接使用 acupuncturePlan 中的 mainPoints 和 secondaryPoints
  const planMainPoints = Array.isArray(apiResult.acupuncturePlan?.mainPoints) 
    ? apiResult.acupuncturePlan.mainPoints 
    : [];
  const planSecondaryPoints = Array.isArray(apiResult.acupuncturePlan?.secondaryPoints) 
    ? apiResult.acupuncturePlan.secondaryPoints 
    : [];
  
  // 处理主穴
  const mainPointNames = planMainPoints.map((name: string) => cleanAcupointName(name));
  const mainPoints = mainPointNames.map((name: string) => ({
    point: name,
    meridian: getMeridian(name) || '',
    effect: getEffect(name) || '',
    technique: apiResult.acupuncturePlan?.technique || '平补平泻',
  }));

  // 处理配穴
  const secondaryPointNames = planSecondaryPoints.map((name: string) => cleanAcupointName(name));
  const secondaryPoints = secondaryPointNames.map((name: string) => ({
    point: name,
    meridian: getMeridian(name) || '',
    effect: getEffect(name) || '',
    technique: apiResult.acupuncturePlan?.technique || '平补平泻',
  }));

  // 提取养生建议
  const lifestyleAdvice = apiResult.lifestyleAdvice || apiResult.lifeCareAdvice || [];

  // 判断优先级
  let priority: '高' | '中' | '低' = '中';
  if (confidence >= 0.85) priority = '高';
  else if (confidence < 0.6) priority = '低';

  return {
    diagnosisResult: {
      primarySyndrome: syndrome,
      syndromeScore: Math.round(confidence * 10),
      confidence,
      secondarySyndromes: [],
      pathogenesis,
      organLocation: apiResult.organLocation || [],
      diagnosisEvidence: [],
      priority,
      diagnosisTime: new Date().toISOString(),
    },
    acupuncturePlan: {
      treatmentPrinciple: apiResult.treatmentPrinciple || apiResult.acupuncturePlan?.treatmentPrinciple || '',
      mainPoints,
      secondaryPoints,
      contraindications: [],
      treatmentAdvice: {
        techniquePrinciple: apiResult.acupuncturePlan?.technique || '平补平泻',
        needleRetentionTime: apiResult.acupuncturePlan?.needleRetentionTime || '',
        treatmentFrequency: apiResult.acupuncturePlan?.treatmentFrequency || '',
        treatmentSessions: '',
        sessionInterval: '',
      },
    },
    lifeCareAdvice: {
      dietSuggestions: Array.isArray(lifestyleAdvice) 
        ? lifestyleAdvice.slice(0, 5) 
        : typeof lifestyleAdvice === 'string' 
          ? lifestyleAdvice.split(/[、,，]/).slice(0, 5)
          : [],
      dailyRoutine: [],
      precautions: [],
    },
    systemInfo: {
      knowledgeBaseVersion: '3.0-deepseek',
      skillVersion: '2.0-direct',
      reasoningRulesCount: 0,
      updateTime: new Date().toISOString(),
    },
  };
}

/**
 * 模拟进度回调
 * 由于HTTP请求无法流式，使用setTimeout模拟不同阶段的进度
 */
function simulateProgress(
  onProgress: (step: DiagnosisProgressStep) => void,
  totalDuration: number = 3000
): { stop: () => void } {
  const stages: { step: DiagnosisProgressStep; progress: number; delay: number }[] = [
    { step: 'recognizing', progress: 15, delay: 200 },
    { step: 'analyzing', progress: 35, delay: 800 },
    { step: 'reasoning', progress: 65, delay: 1200 },
    { step: 'matching', progress: 85, delay: totalDuration - 200 },
  ];

  const timers: NodeJS.Timeout[] = [];
  let stopped = false;

  for (const stage of stages) {
    const timer = setTimeout(() => {
      if (!stopped) {
        onProgress(stage.step);
      }
    }, stage.delay);
    timers.push(timer);
  }

  return {
    stop: () => {
      stopped = true;
      timers.forEach(t => clearTimeout(t));
    }
  };
}

/**
 * 提交辨证请求 - 直连DeepSeek版本
 * 
 * @param input 辨证输入数据
 * @param onProgress 进度回调
 */
export async function submitDiagnosis(
  input: DiagnosisInput, 
  onProgress?: (step: DiagnosisProgressStep) => void
): Promise<DiagnosisOutput> {
  console.log('[submitDiagnosis] 开始辨证请求，直连DeepSeek');

  // 构建舌象特征数据
  const tongueFeatures = {
    tongueColor: input.input_features.tongueColor?.value || '',
    tongueShape: input.input_features.tongueShape?.value || '',
    tongueState: input.input_features.tongueState?.value || '正常',
    coatingColor: input.input_features.coating?.color || '',
    coatingTexture: input.input_features.coating?.texture || '',
    coatingMoisture: input.input_features.coating?.moisture || '润',
    teethMark: input.input_features.teethMark?.value === '是',
    crack: input.input_features.crack?.value === '是',
    // 扩展特征
    shapeDistribution: input.input_features.shapeDistribution || { depression: [], bulge: [] },
    distributionFeatures: input.input_features.distributionFeatures || [],
  };

  // 获取患者信息
  const age = input.patientInfo?.age || 0;
  const gender = input.patientInfo?.gender;
  const chiefComplaint = input.patientInfo?.chiefComplaint || '';

  // 获取伴随症状
  const symptoms = input.symptoms?.map(s => s.symptom).join('、') || '';

  // 开始进度模拟
  let progressController: { stop: () => void } | null = null;
  if (onProgress) {
    progressController = simulateProgress(onProgress);
  }

  try {
    // 调用Vercel Function
    console.log('[submitDiagnosis] 发送请求到:', VERCE_API_URL);
    
    const response = await fetch(VERCE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: 'diagnose',  // 辨证主模式
        tongueFeatures,
        age,
        gender,
        chiefComplaint,
        symptoms,
        // 保留原始输入以便调试
        _rawInput: {
          tongueColor: input.input_features.tongueColor?.value,
          tongueShape: input.input_features.tongueShape?.value,
          coatingColor: input.input_features.coating?.color,
          coatingTexture: input.input_features.coating?.texture,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[submitDiagnosis] API错误:', response.status, errorText);
      throw new Error(`辨证请求失败: ${response.status}`);
    }

    const apiResult = await response.json();
    console.log('[submitDiagnosis] API响应:', JSON.stringify(apiResult, null, 2));

    // 检查API返回的错误
    if (!apiResult.success) {
      throw new Error(apiResult.error || '辨证分析失败');
    }

    // 检查是否需要问诊确认
    if (apiResult.needsConfirmation) {
      console.log('[submitDiagnosis] 需要问诊确认，但主流程直接返回初步结果');
      // 主流程不需要问诊，直接返回初步结果
    }

    // 提取辨证数据
    const diagnosisData = apiResult.data || apiResult.finalResult || apiResult.preliminaryResult || apiResult;
    
    // 转换为前端期望的格式
    const output = transformToDiagnosisOutput(diagnosisData);
    
    console.log('[submitDiagnosis] 辨证完成:', output.diagnosisResult.primarySyndrome);
    
    return output;

  } catch (error) {
    console.error('[submitDiagnosis] 异常:', error);
    throw error instanceof Error ? error : new Error('辨证分析失败');
  } finally {
    // 停止进度模拟
    progressController?.stop();
  }
}

export async function validateFeatures(input: Partial<DiagnosisInput>): Promise<{ valid: boolean; errors?: string[] }> {
  const errors: string[] = [];
  if (!input.input_features?.tongueColor?.value) errors.push('请选择舌色');
  if (!input.input_features?.tongueShape?.value) errors.push('请选择舌形');
  if (!input.input_features?.coating?.color) errors.push('请选择苔色');
  if (!input.input_features?.coating?.texture) errors.push('请选择苔质');
  if (!input.patientInfo?.age) errors.push('请输入患者年龄');
  if (!input.patientInfo?.gender) errors.push('请选择患者性别');
  if (!input.patientInfo?.chiefComplaint) errors.push('请输入主诉');
  return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
}

export async function getDiagnosisModes() {
  return { modes: [{ value: '快速模式', label: '快速模式', description: '仅输出主要证型和主穴' }, { value: '详细模式', label: '详细模式', description: '完整辨证分析' }] };
}

export async function healthCheck(): Promise<boolean> { 
  try {
    const response = await fetch(VERCE_API_URL, {
      method: 'OPTIONS',
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function getApiConfig() { 
  return { 
    baseUrl: VERCE_API_URL, 
    engine: 'deepseek-direct',
    hasToken: true 
  }; 
}

// 验证图片是否为舌象
export async function validateTongueImage(imageBase64: string): Promise<{ valid: boolean; message?: string }> {
  try {
    // 提取base64数据（去掉data:image/xxx;base64,前缀）
    const base64Data = imageBase64.split(',')[1] || imageBase64;
    
    const requestPayload = {
      bot_id: BOT_ID,
      user_id: generateUserId(),
      stream: false,
      additional_messages: [{
        role: 'user',
        content: JSON.stringify({
          action: 'validate_image',
          image_data: base64Data.substring(0, 100) // 发送部分数据用于验证提示
        }),
        content_type: 'text'
      }]
    };

    const response = await fetch(`${API_BASE_URL}/v3/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      console.log('验证API调用失败，默认通过');
      return { valid: true };
    }

    const data = await response.json();
    const content = data?.data?.content || '';
    
    // 使用统一的错误关键词检测
    for (const keyword of ERROR_KEYWORDS) {
      if (content.includes(keyword)) {
        return { valid: false, message: '请上传舌象图片，图片中应清晰显示舌头表面特征。' };
      }
    }
    
    return { valid: true };
  } catch (error) {
    console.log('验证出错，默认通过:', error);
    return { valid: true };
  }
}
