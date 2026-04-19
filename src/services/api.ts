import axios, { AxiosInstance, AxiosError } from 'axios';
import type { DiagnosisInput, DiagnosisOutput, ApiResponse } from '@/types';

// 扣子API配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.coze.cn/v1';
const BOT_ID = import.meta.env.VITE_BOT_ID || '';
const API_TOKEN = import.meta.env.VITE_API_TOKEN || '';

// 创建axios实例
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 扣子API可能需要更长时间
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_TOKEN}`,
  },
});

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    if (error.response) {
      const message = error.response.data?.msg || error.response.data?.message || '请求失败';
      console.error('API Error:', message);
      return Promise.reject(new Error(message));
    } else if (error.request) {
      console.error('Network Error:', error.message);
      return Promise.reject(new Error('网络连接失败，请检查网络设置'));
    }
    return Promise.reject(error);
  }
);

/**
 * 生成唯一用户ID
 */
function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 舌诊辨证分析API（调用扣子智能体）
 */
export async function submitDiagnosis(input: DiagnosisInput): Promise<DiagnosisOutput> {
  if (!BOT_ID) {
    throw new Error('请配置 VITE_BOT_ID 环境变量');
  }
  if (!API_TOKEN) {
    throw new Error('请配置 VITE_API_TOKEN 环境变量');
  }

  // 构造扣子API请求
  const requestPayload = {
    bot_id: BOT_ID,
    user_id: generateUserId(),
    stream: false,
    additional_messages: [{
      role: 'user',
      content: JSON.stringify({
        tongue_color: input.tongue_color,
        tongue_shape: input.tongue_shape,
        tongue_coating_color: input.tongue_coating_color,
        tongue_coating_texture: input.tongue_coating_texture,
        tongue_movement: input.tongue_movement || '正常',
        crack: input.crack || false,
        teeth_mark: input.teeth_mark || false,
        spots: input.spots || false,
        patient_age: input.patient_age,
        patient_gender: input.patient_gender,
        chief_complaint: input.chief_complaint,
        symptoms: input.symptoms || '',
        mode: input.mode || '详细模式',
      }, null, 2)
    }]
  };

  try {
    const response = await apiClient.post('/chat', requestPayload);

    // 解析扣子API返回结果
    const result = response.data;
    
    if (result.code === 0 && result.data) {
      // 尝试解析返回的内容
      let diagnosisResult: DiagnosisOutput;
      
      try {
        // 如果返回的是JSON字符串，解析它
        const content = result.data.messages?.[0]?.content || result.data.content || '';
        diagnosisResult = typeof content === 'string' ? JSON.parse(content) : content;
      } catch {
        // 如果解析失败，构造默认结构
        diagnosisResult = {
          syndrome_type: '辨证结果',
          syndrome_score: 0,
          pathogenesis: '',
          evidence: [],
          acupuncture: {
            main_points: [],
            auxiliary_points: [],
            method: '',
            frequency: '',
          },
          recommendations: {
            treatment: '',
            lifestyle: '',
            monitoring: '',
          },
          raw_response: result.data,
        };
      }
      
      return diagnosisResult;
    }

    throw new Error(result.msg || '辨证分析失败');
  } catch (error) {
    console.error('Diagnosis API Error:', error);
    throw error;
  }
}

/**
 * 验证输入特征（本地验证）
 */
export async function validateFeatures(input: Partial<DiagnosisInput>): Promise<{
  valid: boolean;
  errors?: string[];
}> {
  const errors: string[] = [];

  // 验证必填字段
  if (!input.tongue_color) errors.push('请选择舌色');
  if (!input.tongue_shape) errors.push('请选择舌形');
  if (!input.tongue_coating_color) errors.push('请选择苔色');
  if (!input.tongue_coating_texture) errors.push('请选择苔质');
  if (!input.patient_age) errors.push('请输入患者年龄');
  if (!input.patient_gender) errors.push('请选择患者性别');
  if (!input.chief_complaint) errors.push('请输入主诉');

  // 验证年龄范围
  if (input.patient_age && (input.patient_age < 0 || input.patient_age > 150)) {
    errors.push('年龄必须在0-150之间');
  }

  // 验证逻辑冲突
  if (input.tongue_coating_color === '剥落' && input.tongue_coating_texture === '厚') {
    errors.push('剥落苔不可能同时为厚苔');
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * 获取辨证模式选项
 */
export async function getDiagnosisModes(): Promise<{
  modes: Array<{ value: string; label: string; description: string }>;
}> {
  return {
    modes: [
      {
        value: '快速模式',
        label: '快速模式',
        description: '仅输出主要证型和主穴',
      },
      {
        value: '详细模式',
        label: '详细模式',
        description: '完整辨证分析、选穴方案和生活调护',
      },
    ],
  };
}

/**
 * 健康检查
 */
export async function healthCheck(): Promise<boolean> {
  try {
    // 简单检查API连接
    if (!BOT_ID || !API_TOKEN) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// 导出配置信息（用于调试）
export function getApiConfig() {
  return {
    baseUrl: API_BASE_URL,
    botId: BOT_ID ? `${BOT_ID.slice(0, 8)}...` : '未配置',
    hasToken: !!API_TOKEN,
  };
}
