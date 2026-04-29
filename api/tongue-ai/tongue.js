export const config = {
  runtime: 'edge',
};

const COZE_CONFIG = {
  botId: '7634049322782785572',
  chatApiUrl: 'https://api.coze.cn/v3/chat',
  uploadApiUrl: 'https://api.coze.cn/v1/files/upload',
  token: 'pat_cT0kGwXPwioWz69z65sLufTqcr1PJNorzO4EJbymAfbMM7uWC2W2qDCvdEqiK1l6'
};

const TONGUE_PROMPT = '识别舌象输出JSON：{"tongue_color":{"value":"","confidence":0},"tongue_shape":{"value":"","teeth_mark":{"has":false,"degree":"","position":""},"crack":{"has":false,"degree":"","position":""}},"tongue_coating":{"color":"","texture":"","moisture":"","confidence":0},"tongue_state":{"value":""},"region_features":{"tip":{"color":"","features":[],"depression":false,"bulge":false},"sides":{"color":"","features":[],"depression":false,"bulge":false},"middle":{"color":"","features":[],"depression":false,"bulge":false},"root":{"color":"","features":[],"depression":false,"bulge":false}},"shape_distribution":{"depression":[],"bulge":[]},"overall_confidence":0,"notes":""}';

function parseTongueResult(content) {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { error: '未找到JSON数据' };
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    return { error: '解析失败', raw: content };
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 
      'Content-Type': 'application/json', 
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return jsonResponse({ status: 'ok' });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  }

  try {
    // 接收FormData
    const formData = await req.formData();
    const file = formData.get('file');
    
    if (!file) {
      return jsonResponse({ success: false, error: '缺少图片文件' }, 400);
    }

    // 直接把文件转发给Coze上传API
    const cozeFormData = new FormData();
    cozeFormData.append('file', file);

    const uploadRes = await fetch(COZE_CONFIG.uploadApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COZE_CONFIG.token}`,
      },
      body: cozeFormData
    });

    const uploadData = await uploadRes.json();
    
    if (uploadData.code !== 0 || !uploadData.data || !uploadData.data.id) {
      return jsonResponse({ success: false, error: `上传失败: ${uploadData.msg || 'unknown'}` });
    }

    const fileId = uploadData.data.id;

    // 创建chat（流式）
    const chatRes = await fetch(COZE_CONFIG.chatApiUrl, {
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
            { type: 'file', file_id: fileId },
            { type: 'text', text: TONGUE_PROMPT }
          ])
        }]
      })
    });

    if (!chatRes.ok) {
      return jsonResponse({ success: false, error: `Chat API错误: ${chatRes.status}` });
    }

    // 读取流式结果
    let result = '';
    const text = await chatRes.text();
    const lines = text.split('\n');

    for (const line of lines) {
      if (line.startsWith('data:')) {
        try {
          const d = JSON.parse(line.slice(5));
          if (d.type === 'answer' && d.content) {
            result = d.content;
          }
        } catch (e) {}
      }
    }

    if (!result) {
      return jsonResponse({ success: false, error: '识别结果为空' });
    }

    const parsed = parseTongueResult(result);
    if (parsed.error) {
      return jsonResponse({ success: false, error: parsed.error, raw: parsed.raw?.slice(0, 200) });
    }

    return jsonResponse({ success: true, data: parsed });

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return jsonResponse({ success: false, error: errMsg });
  }
}
