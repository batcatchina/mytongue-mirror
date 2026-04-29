// 舌象识别 Step2: 查询对话结果

const COZE_CONFIG = {
  token: 'pat_cT0kGwXPwioWz69z65sLufTqcr1PJNorzO4EJbymAfbMM7uWC2W2qDCvdEqiK1l6'
};

function parseTongueResult(content) {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { error: '未找到JSON数据' };
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    return { error: '解析失败', raw: content };
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).json({ status: 'ok' });
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const { chat_id, conversation_id } = req.query;
    if (!chat_id || !conversation_id) {
      return res.status(400).json({ success: false, error: '缺少参数' });
    }

    // 查询对话状态
    const statusRes = await fetch(
      `https://api.coze.cn/v3/chat/retrieve?chat_id=${chat_id}&conversation_id=${conversation_id}`,
      {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${COZE_CONFIG.token}` }
      }
    );
    const statusData = await statusRes.json();

    if (statusData.code !== 0) {
      return res.json({ success: false, error: `查询失败: ${statusData.msg}`, code: statusData.code });
    }

    const chatStatus = statusData.data.status;

    // 还没完成
    if (chatStatus !== 'completed') {
      return res.json({ success: true, status: chatStatus });
    }

    // 完成了，获取回答
    const msgRes = await fetch(
      `https://api.coze.cn/v3/chat/message/list?chat_id=${chat_id}&conversation_id=${conversation_id}`,
      {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${COZE_CONFIG.token}` }
      }
    );
    const msgData = await msgRes.json();

    if (msgData.code !== 0) {
      return res.json({ success: false, error: `获取消息失败: ${msgData.msg}`, code: msgData.code });
    }

    const answer = msgData.data?.find(m => m.role === 'assistant' && m.type === 'answer');
    if (!answer?.content) {
      return res.json({ success: true, status: 'completed', data: null });
    }

    const parsed = parseTongueResult(answer.content);
    if (parsed.error) {
      return res.json({ success: true, status: 'completed', error: parsed.error, raw: parsed.raw?.slice(0, 200) });
    }

    res.json({ success: true, status: 'completed', data: parsed });

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    res.json({ success: false, error: errMsg });
  }
}
