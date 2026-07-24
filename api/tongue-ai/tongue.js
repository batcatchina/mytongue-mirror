// 舌象识别 Step1: 直接调用DeepSeek V4 Vision API（同步返回，无需轮询）
// 2026-07-24: 从Coze切换到DeepSeek，修复token过期问题

const DEEPSEEK_CONFIG = {
  apiUrl: 'https://api.deepseek.com/v1/chat/completions',
  model: 'deepseek-chat',  // V4 Flash或deepseek-chat
  apiKey: 'sk-6f6b12f2cc28408dbd78d5956ea15522'
};

const TONGUE_SYSTEM_PROMPT = `你是一个专业的中医舌象识别系统。请严格执行以下判断：

【第一判断】图片中是否包含伸出的舌头？
判断标准：必须能清晰看到口腔内伸出的舌头。织物、食物、风景、物品、人物面部等都不属于舌象。

如果没有舌头，只返回以下JSON，不要填写任何其他字段：
{"tongueDetected":false,"message":"未检测到舌象，请上传清晰的舌头照片"}

如果有舌头，请仔细分析并返回以下完整JSON：
{"tongueDetected":true,"tongue_color":{"value":"","confidence":0},"tongue_shape":{"value":"","teeth_mark":{"has":false,"degree":"","position":""},"crack":{"has":false,"degree":"","position":""}},"tongue_coating":{"color":"","texture":"","moisture":"","confidence":0},"tongue_state":{"value":""},"region_features":{"tip":{"color":"","features":[],"depression":false,"bulge":false},"sides":{"color":"","features":[],"depression":false,"bulge":false},"middle":{"color":"","features":[],"depression":false,"bulge":false},"root":{"color":"","features":[],"depression":false,"bulge":false}},"shape_distribution":{"depression":[],"bulge":[]},"overall_confidence":0,"notes":""}

重要规则：
- tongueDetected必须为true或false，不能为空
- 如果没有舌头，绝对不能返回分析结果，只能返回tongueDetected:false的简短JSON
- 所有字段都要基于图片实际观察填写，不要留空`;

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).json({ status: 'ok' });
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ success: false, error: '缺少图片数据' });

    // 构建DeepSeek请求
    const messages = [
      { role: 'system', content: TONGUE_SYSTEM_PROMPT },
      { role: 'user', content: [
        { type: 'image_url', image_url: { url: image } },
        { type: 'text', text: '请分析这张图片中的舌象特征。' }
      ]}
    ];

    const response = await fetch(DEEPSEEK_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_CONFIG.apiKey}`
      },
      body: JSON.stringify({
        model: DEEPSEEK_CONFIG.model,
        messages: messages,
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API错误:', response.status, errorText);
      return res.json({ success: false, error: `API调用失败: ${response.status}` });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '';

    // 解析JSON结果
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.json({ success: false, error: '识别失败，未能解析结果' });
    }

    const result = JSON.parse(jsonMatch[0]);

    // 验证是否检测到舌头
    if (result.tongueDetected === false) {
      return res.json({
        success: true,
        status: 'completed',
        tongueNotDetected: true,
        error: result.message || '未检测到舌象'
      });
    }

    // 返回成功结果
    res.json({
      success: true,
      status: 'completed',
      data: result
    });

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('tongue.js异常:', errMsg);
    res.json({ success: false, error: errMsg });
  }
}
