// 舌象识别 Step1: 上传图片 + 创建对话
// 快速返回chat_id，不等AI结果（避免超时）

const COZE_CONFIG = {
  botId: '7634049322782785572',
  chatApiUrl: 'https://api.coze.cn/v3/chat',
  uploadApiUrl: 'https://api.coze.cn/v1/files/upload',
  token: 'pat_cT0kGwXPwioWz69z65sLufTqcr1PJNorzO4EJbymAfbMM7uWC2W2qDCvdEqiK1l6'
};

const TONGUE_PROMPT = `你是一个舌象判断与识别系统。请严格执行以下互斥判断：

【判断】图片中是否包含伸出的舌头和口腔？
判断标准：必须能清晰看到口腔内伸出的舌头。织物、食物、风景、物品、人物面部等都不属于舌象。

如果没有舌头和口腔，只返回以下JSON，不要填写任何其他字段：
{"tongueDetected":false,"message":"未检测到舌象，请上传清晰的舌头照片"}

如果有舌头和口腔，返回以下完整JSON（tongueDetected必须为true）：
{"tongueDetected":true,"tongue_color":{"value":"","confidence":0},"tongue_shape":{"value":"","teeth_mark":{"has":false,"degree":"","position":""},"crack":{"has":false,"degree":"","position":""}},"tongue_coating":{"color":"","texture":"","moisture":"","confidence":0},"tongue_state":{"value":""},"region_features":{"tip":{"color":"","features":[],"depression":false,"bulge":false},"sides":{"color":"","features":[],"depression":false,"bulge":false},"middle":{"color":"","features":[],"depression":false,"bulge":false},"root":{"color":"","features":[],"depression":false,"bulge":false}},"shape_distribution":{"depression":[],"bulge":[]},"overall_confidence":0,"notes":""}

重要：以上两种结果是互斥的。没有舌头时，绝对不能返回分析结果，只能返回tongueDetected:false的简短JSON。`;

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).json({ status: 'ok' });
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    // 接收JSON body，里面是base64图片
    const { image } = req.body;
    if (!image) return res.status(400).json({ success: false, error: '缺少图片数据' });

    // 解析data URL
    let mimeType = 'image/jpeg';
    let pureBase64 = image;
    if (image.startsWith('data:')) {
      const commaIdx = image.indexOf(',');
      if (commaIdx > 0) {
        const meta = image.slice(0, commaIdx);
        const mimeMatch = meta.match(/:(image\/[a-zA-Z0-9.+-]+)/);
        if (mimeMatch) mimeType = mimeMatch[1];
        pureBase64 = image.slice(commaIdx + 1);
      }
    }

    // 清理base64
    pureBase64 = pureBase64.replace(/\s/g, '');
    
    const buffer = Buffer.from(pureBase64, 'base64');
    const ext = mimeType.includes('png') ? 'png' : 'jpg';
    const fileName = `tongue_${Date.now()}.${ext}`;

    // 上传图片到Coze（用multipart/form-data）
    const boundary = '----CozeUpload' + Date.now().toString(36);
    const header = Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${mimeType}\r\n\r\n`
    );
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
    const payload = Buffer.concat([header, buffer, footer]);

    const uploadRes = await fetch(COZE_CONFIG.uploadApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COZE_CONFIG.token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: payload
    });

    const uploadData = await uploadRes.json();
    if (uploadData.code !== 0 || !uploadData.data?.id) {
      return res.json({ success: false, error: `上传失败: ${uploadData.msg || 'unknown'}` });
    }

    const fileId = uploadData.data.id;

    // 创建非流式对话（不等结果返回）
    const chatRes = await fetch(COZE_CONFIG.chatApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COZE_CONFIG.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bot_id: COZE_CONFIG.botId,
        user_id: `tongue_${Date.now()}`,
        stream: false,
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

    const chatData = await chatRes.json();
    if (chatData.code !== 0) {
      return res.json({ success: false, error: `创建对话失败: ${chatData.msg || 'unknown'}` });
    }

    // 返回chat_id给前端，前端轮询获取结果
    res.json({
      success: true,
      chat_id: chatData.data.id,
      conversation_id: chatData.data.conversation_id,
      status: chatData.data.status
    });

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    res.json({ success: false, error: errMsg });
  }
}
