// 舌象识别 Step1: 直接调用智谱GLM-4V-Flash API
// 2026-07-24: 从Coze切换到智谱视觉模型

const ZHIPU_CONFIG = {
  apiUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
  model: 'glm-4v-flash',
  apiKey: '48f22f613f474a8f9f230226f0eacade.EEd3qhXSqQm7T1Oh'
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).json({ status: 'ok' });
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ success: false, error: '缺少图片数据' });

    console.log('收到请求，图片长度:', image.length);
    console.log('图片前50字符:', image.substring(0, 50));

    // 构建消息
    const messages = [
      { 
        role: 'user', 
        content: [
          { type: 'text', text: '这是一张舌头的照片吗？只回答是或否。' },
          { type: 'image_url', image_url: { url: image } }
        ]
      }
    ];

    console.log('开始调用智谱API...');

    const response = await fetch(ZHIPU_CONFIG.apiUrl, {
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

    console.log('智谱响应状态:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('智谱API错误:', response.status, errorText);
      return res.json({ success: false, error: `API调用失败: ${response.status}`, detail: errorText });
    }

    const data = await response.json();
    console.log('智谱返回:', JSON.stringify(data).substring(0, 200));

    const content = data?.choices?.[0]?.message?.content || '';

    res.json({ 
      success: true, 
      message: content,
      debug: { model: ZHIPU_CONFIG.model }
    });

  } catch (error) {
    console.error('异常:', error);
    res.json({ success: false, error: error.message || String(error) });
  }
}
