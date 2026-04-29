// 舌象AI识别服务 - 前端直调扣子API（国内链路）

const COZE_CONFIG = {
  botId: '7634049322782785572',
  apiUrl: 'https://api.coze.cn/v3/chat',
  token: 'pat_cT0kGwXPwioWz69z65sLufTqcr1PJNorzO4EJbymAfbMM7uWC2W2qDCvdEqiK1l6'
};

const TONGUE_PROMPT = '识别舌象输出JSON：{"tongue_color":{"value":"","confidence":0},"tongue_shape":{"value":"","teeth_mark":{"has":false,"degree":"","position":""},"crack":{"has":false,"degree":"","position":""}},"tongue_coating":{"color":"","texture":"","moisture":"","confidence":0},"tongue_state":{"value":""},"region_features":{"tip":{"color":"","features":[],"depression":false,"bulge":false},"sides":{"color":"","features":[],"depression":false,"bulge":false},"middle":{"color":"","features":[],"depression":false,"bulge":false},"root":{"color":"","features":[],"depression":false,"bulge":false}},"shape_distribution":{"depression":[],"bulge":[]},"overall_confidence":0,"notes":""}';

export interface TongueRecognitionResult {
  tongue_color: {
    value: string;
    confidence: number;
  };
  tongue_shape: {
    value: string;
    teeth_mark: { has: boolean; degree: string; position: string };
    crack: { has: boolean; degree: string; position: string };
  };
  tongue_coating: {
    color: string;
    texture: string;
    moisture: string;
    confidence: number;
  };
  tongue_state: { value: string };
  region_features: {
    tip: { color: string; features: string[]; depression: boolean; bulge: boolean };
    sides: { color: string; features: string[]; depression: boolean; bulge: boolean };
    middle: { color: string; features: string[]; depression: boolean; bulge: boolean };
    root: { color: string; features: string[]; depression: boolean; bulge: boolean };
  };
  shape_distribution: {
    depression: Array<{ region: string; degree: string }>;
    bulge: Array<{ region: string; degree: string }>;
  };
  overall_confidence: number;
  notes: string;
  error?: boolean;
  message?: string;
}

function parseResult(content: string): TongueRecognitionResult | null {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

/**
 * 识别舌象图片
 * @param imageBase64 图片的base64数据（不含data:image前缀）
 * @param onProgress 进度回调
 */
export async function recognizeTongue(
  imageBase64: string,
  onProgress?: (status: string) => void
): Promise<TongueRecognitionResult> {
  onProgress?.('正在上传图片...');

  const imageUrl = imageBase64.startsWith('data:') 
    ? imageBase64 
    : `data:image/jpeg;base64,${imageBase64}`;

  onProgress?.('正在识别舌象...');

  const response = await fetch(COZE_CONFIG.apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${COZE_CONFIG.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      bot_id: COZE_CONFIG.botId,
      user_id: `tongue_${Date.now()}`,
      stream: true,
      additional_messages: [{
        role: 'user',
        content_type: 'object_string',
        content: JSON.stringify([
          { type: 'text', text: TONGUE_PROMPT },
          { type: 'image', file_url: imageUrl }
        ])
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`API调用失败: ${response.status}`);
  }

  // 流式读取
  const reader = response.body?.getReader();
  if (!reader) throw new Error('无法读取响应');

  const decoder = new TextDecoder();
  let result = '';
  let lastProgress = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data:')) {
        try {
          const d = JSON.parse(line.slice(5));
          
          // 收集answer内容
          if (d.type === 'answer' && d.content) {
            result = d.content;
          }
          
          // 更新进度
          if (d.type === 'answer' && d.reasoning_content && onProgress) {
            const now = Date.now();
            if (now - lastProgress > 2000) {
              onProgress('正在分析舌象特征...');
              lastProgress = now;
            }
          }

        } catch {}
      }
    }
  }

  if (!result) {
    throw new Error('识别结果为空，请重试');
  }

  const parsed = parseResult(result);
  if (!parsed) {
    throw new Error('识别结果解析失败');
  }

  if (parsed.error) {
    throw new Error(parsed.message || '识别失败');
  }

  onProgress?.('识别完成');
  return parsed;
}
