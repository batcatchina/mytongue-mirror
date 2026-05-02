// 舌象识别 Step2: 查询对话结果

const COZE_CONFIG = {
  token: 'pat_cT0kGwXPwioWz69z65sLufTqcr1PJNorzO4EJbymAfbMM7uWC2W2qDCvdEqiK1l6'
};

// 前端枚举值映射表
const VALUE_MAP = {
  tongue_color: {
    '淡红': '淡红', '淡红色': '淡红', '粉红': '淡红', '粉红色': '淡红', '淡红舌': '淡红',
    '淡白': '淡白', '淡白色': '淡白', '苍白': '淡白', '苍白色': '淡白', '淡白舌': '淡白',
    '红': '红', '红色': '红', '鲜红': '红', '鲜红色': '红', '红舌': '红',
    '绛': '绛', '绛红': '绛', '深红': '绛', '暗红': '绛', '绛红色': '绛', '绛舌': '绛',
    '紫': '紫', '紫色': '紫', '紫暗': '紫', '紫舌': '紫',
    '青紫': '青紫', '青紫色': '青紫', '青': '青紫', '青紫舌': '青紫',
  },
  tongue_shape: {
    '胖大': '胖大', '胖': '胖大', '胖大舌': '胖大', '肿胀': '胖大', '肿大': '胖大',
    '瘦薄': '瘦薄', '瘦': '瘦薄', '瘦薄舌': '瘦薄', '瘦小': '瘦薄', '瘦舌': '瘦薄',
    '正常': '正常', '正常舌': '正常',
  },
  tongue_state: {
    '强硬': '强硬', '强': '强硬', '强硬舌': '强硬',
    '痿软': '痿软', '软': '痿软', '痿': '痿软', '痿软舌': '痿软',
    '歪斜': '歪斜', '歪': '歪斜', '歪斜舌': '歪斜',
    '颤动': '颤动', '颤': '颤动', '颤抖': '颤动', '颤动舌': '颤动',
    '正常': '正常', '舌态正常': '正常', '正常舌态': '正常',
  },
  coating_color: {
    '薄白': '薄白', '白': '薄白', '白色': '薄白', '白苔': '薄白', '薄白色': '薄白',
    '白厚': '白厚', '厚白': '白厚', '白厚苔': '白厚',
    '黄': '黄', '黄色': '黄', '黄苔': '黄', '薄黄': '黄', '薄黄色': '黄',
    '灰黑': '灰黑', '灰': '灰黑', '黑': '灰黑', '灰黑苔': '灰黑',
    '剥落': '剥落', '剥': '剥落', '无苔': '剥落', '镜面': '剥落', '剥苔': '剥落',
  },
  coating_texture: {
    '薄': '薄', '薄苔': '薄',
    '厚': '厚', '厚苔': '厚', '厚腻': '厚',
    '正常': '正常',
    '细腻': '薄', '细腻均匀': '薄', '均匀': '薄',
    '腻': '厚', '腻苔': '厚', '滑腻': '厚',
    '粗糙': '厚', '颗粒': '厚',
  },
  coating_moisture: {
    '润': '润', '湿润': '润', '润泽': '润', '津液充足': '润', '水滑': '润',
    '燥': '燥', '干燥': '燥', '少津': '燥',
    '正常': '正常',
  }
};

function mapValue(category, rawValue) {
  if (!rawValue || typeof rawValue !== 'string') return rawValue;
  const trimmed = rawValue.trim();
  const map = VALUE_MAP[category];
  if (!map) return trimmed;
  // 1. 精确匹配
  if (map[trimmed]) return map[trimmed];
  // 2. 关键词包含匹配（Bot返回值千变万化，必须用包含逻辑）
  //    遍历VALUE_MAP的key，如果rawValue包含某个key，就返回对应value
  //    优先匹配更长的key（如"胖大"优先于"胖"）
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (trimmed.includes(key)) return map[key];
  }
  // 3. 反向包含：key包含rawValue
  for (const key of keys) {
    if (key.includes(trimmed)) return map[key];
  }
  return trimmed;
}

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

    const statusRes = await fetch(
      `https://api.coze.cn/v3/chat/retrieve?chat_id=${chat_id}&conversation_id=${conversation_id}`,
      { method: 'GET', headers: { 'Authorization': `Bearer ${COZE_CONFIG.token}` } }
    );
    const statusData = await statusRes.json();

    if (statusData.code !== 0) {
      return res.json({ success: false, error: `查询失败: ${statusData.msg}`, code: statusData.code });
    }

    const chatStatus = statusData.data.status;
    if (chatStatus !== 'completed') {
      return res.json({ success: true, status: chatStatus });
    }

    const msgRes = await fetch(
      `https://api.coze.cn/v3/chat/message/list?chat_id=${chat_id}&conversation_id=${conversation_id}`,
      { method: 'GET', headers: { 'Authorization': `Bearer ${COZE_CONFIG.token}` } }
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

    // 舌头检测验证（双重保障）
    const rawContent = answer.content || '';
    const noTongueKeywords = ['未检测到舌', '没有舌头', '不是舌头', '未检测到口腔', '无法识别舌', '图片中没有舌头', '图片中无舌'];
    const hasNoTongueHint = noTongueKeywords.some(kw => rawContent.includes(kw));
    
    if (parsed.tongueDetected === false || (parsed.tongueDetected !== true && hasNoTongueHint)) {
      const errMsg = parsed.message || '未检测到舌象，请上传清晰的舌头照片';
      return res.json({ success: true, status: 'completed', error: errMsg, tongueNotDetected: true });
    }

    // Bot返回了error（如非舌象图片）
    if (parsed.error) {
      const errMsg = parsed.message || (typeof parsed.error === 'string' ? parsed.error : '识别失败');
      return res.json({ success: true, status: 'completed', error: typeof errMsg === 'string' ? errMsg : '识别失败', data: parsed });
    }

    // 值映射：把Bot返回的值映射到前端枚举值
    if (parsed.tongue_color?.value) {
      parsed.tongue_color.value = mapValue('tongue_color', parsed.tongue_color.value);
    }
    if (parsed.tongue_shape?.value) {
      parsed.tongue_shape.value = mapValue('tongue_shape', parsed.tongue_shape.value);
    }
    if (parsed.tongue_state?.value) {
      parsed.tongue_state.value = mapValue('tongue_state', parsed.tongue_state.value);
    }
    if (parsed.tongue_coating) {
      if (parsed.tongue_coating.color) parsed.tongue_coating.color = mapValue('coating_color', parsed.tongue_coating.color);
      if (parsed.tongue_coating.texture) parsed.tongue_coating.texture = mapValue('coating_texture', parsed.tongue_coating.texture);
      if (parsed.tongue_coating.moisture) parsed.tongue_coating.moisture = mapValue('coating_moisture', parsed.tongue_coating.moisture);
    }

    res.json({ success: true, status: 'completed', data: parsed });

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    res.json({ success: false, error: errMsg });
  }
}
