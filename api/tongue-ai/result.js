// 舌象识别 Step2: DeepSeek同步返回，无需轮询
// 2026-07-24: 从Coze切换到DeepSeek，result.js简化处理

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).json({ status: 'ok' });
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    // DeepSeek是同步返回的，tongue.js已经直接返回结果
    // result.js现在只是兼容旧的前端调用，实际上不会被用到
    const { chat_id, conversation_id } = req.query;

    // 返回完成状态，前端不会收到这个（因为tongue.js已经同步返回）
    res.json({ 
      success: true, 
      status: 'completed',
      message: 'DeepSeek同步模式，无需轮询'
    });

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    res.json({ success: false, error: errMsg });
  }
}
