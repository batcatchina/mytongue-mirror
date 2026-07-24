// 舌象识别 Step1: 直接调用智谱GLM-4V-Flash API
// 2026-07-24: 从Coze切换到智谱视觉模型

const ZHIPU_CONFIG = {
  apiUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
  model: 'glm-4v-flash',
  apiKey: '48f22f613f474a8f9f230226f0eacade.EEd3qhXSqQm7T1Oh'
};

export const config = {
  api: {
    body: true,
    sizeLimit: '10mb'
  }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end('ok');
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const body = await req.json();
    const { image } = body;
    
    if (!image) {
      return res.status(400).json({ success: false, error: '缺少图片数据' });
    }

    // 处理图片格式
    let imageUrl = image;
    if (image.startsWith('data:')) {
      imageUrl = image;
    } else if (image.length > 100 && !image.startsWith('http')) {
      imageUrl = `data:image/png;base64,${image}`;
    }

    const messages = [
      { 
        role: 'user', 
        content: [
          { type: 'image_url', image_url: { url: imageUrl } },
          { type: 'text', text: '这是一张舌头的照片吗？只回答是或否。' }
        ]
      }
    ];

    const apiResponse = await fetch(ZHIPU_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + ZHIPU_CONFIG.apiKey
      },
      body: JSON.stringify({
        model: ZHIPU_CONFIG.model,
        messages: messages,
        temperature: 0.3,
        max_tokens: 200
      })
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      return res.json({ success: false, error: `API调用失败: ${apiResponse.status}`, detail: errorText });
    }

    const data = await apiResponse.json();
    const content = data?.choices?.[0]?.message?.content || '';

    res.json({ 
      success: true, 
      message: content,
      debug: { model: ZHIPU_CONFIG.model }
    });

  } catch (error) {
    res.json({ success: false, error: error.message || String(error) });
  }
}
