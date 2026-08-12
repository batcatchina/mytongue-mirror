// 舌象识别 Step1: 调用智谱 GLM-4V-Flash 视觉模型，输出结构化舌象特征
// 2026-07-24: 从Coze切换到智谱视觉模型
// 2026-07-24 fix: 返回前端期望的 { status:'completed', data } 格式，密钥改走环境变量

const ZHIPU_CONFIG = {
  apiUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
  model: 'glm-4v-flash',
  apiKey: process.env.ZHIPU_API_KEY,
};

// 单次识别超时时间（毫秒），需小于 vercel.json 中该函数的 maxDuration(30s)
const FETCH_TIMEOUT_MS = 25000;

const EXTRACT_PROMPT = `你是中医舌象识别专家。请观察图片并提取舌象特征，严格返回 JSON（不要任何其他文字）。

如果图片不是清晰的舌头照片（例如人脸、食物、风景、模糊无法辨认），只返回：
{"is_tongue": false}

如果是舌头照片，返回：
{
  "is_tongue": true,
  "tongue_color": { "value": "淡红|淡白|红|绛红|紫暗|青紫", "confidence": 0.9 },
  "tongue_shape": {
    "value": "正常|胖大|瘦薄|齿痕|裂纹|芒刺|老嫩",
    "teeth_mark": { "has": false, "degree": "轻|中|重", "position": "舌边" },
    "crack": { "has": false, "degree": "轻|中|重", "position": "舌中" }
  },
  "tongue_coating": { "color": "薄白|白厚|黄|黄厚|灰黑|无苔", "texture": "正常|腻|腐|剥脱|地图舌", "moisture": "润|滑|燥|糙", "confidence": 0.9 },
  "tongue_state": { "value": "正常|痿软|强硬|颤动|歪斜|吐弄|短缩" },
  "region_features": {
    "tip": { "color": "", "features": [], "depression": false, "bulge": false },
    "sides": { "color": "", "features": [], "depression": false, "bulge": false },
    "middle": { "color": "", "features": [], "depression": false, "bulge": false },
    "root": { "color": "", "features": [], "depression": false, "bulge": false }
  },
  "shape_distribution": {
    "depression": [],
    "bulge": []
  },
  "overall_confidence": 0.85,
  "notes": "一句话总体描述"
}

注意：
- value 字段必须从给定选项中挑选最接近的一个
- 拿不准的字段给较低 confidence
- shape_distribution 的 depression/bulge 数组元素为 "tip|sides|middle|root"`;

async function callZhipuVision(imageUrl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const apiResponse = await fetch(ZHIPU_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + ZHIPU_CONFIG.apiKey,
      },
      body: JSON.stringify({
        model: ZHIPU_CONFIG.model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: imageUrl } },
              { type: 'text', text: EXTRACT_PROMPT },
            ],
          },
        ],
        temperature: 0.2,
        max_tokens: 1024,
      }),
      signal: controller.signal,
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('[舌象识别] 智谱API错误:', apiResponse.status, errorText);
      throw new Error(`视觉模型调用失败: ${apiResponse.status}`);
    }

    return await apiResponse.json();
  } finally {
    clearTimeout(timer);
  }
}

function parseModelJson(content) {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('模型未返回JSON');
  return JSON.parse(jsonMatch[0]);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end('ok');
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  if (!ZHIPU_CONFIG.apiKey) {
    console.error('[舌象识别] 缺少 ZHIPU_API_KEY 环境变量');
    return res.status(500).json({ success: false, error: '服务端未配置视觉模型密钥' });
  }

  try {
    const image = req.body?.image || req.body?.data;

    if (!image) {
      return res.status(400).json({ success: false, error: '缺少图片数据' });
    }

    // 处理图片格式
    let imageUrl = image;
    if (image.startsWith('data:') || image.startsWith('http')) {
      imageUrl = image;
    } else {
      imageUrl = `data:image/jpeg;base64,${image}`;
    }

    // 请求体保护：base64 图片超过约 3MB 时拒绝（Vercel 请求体上限 4.5MB）
    if (imageUrl.length > 4 * 1024 * 1024) {
      return res.status(400).json({ success: false, error: '图片过大，请压缩后重新上传' });
    }

    const data = await callZhipuVision(imageUrl);
    const content = data?.choices?.[0]?.message?.content || '';

    let result;
    try {
      result = parseModelJson(content);
    } catch (e) {
      console.error('[舌象识别] JSON解析失败, 原始返回:', content);
      return res.json({ success: false, error: '识别结果解析失败，请重试' });
    }

    // 未检测到舌头
    if (result.is_tongue === false) {
      return res.json({
        success: false,
        tongueNotDetected: true,
        error: '未检测到舌象，请上传清晰的舌头照片',
      });
    }
    delete result.is_tongue;

    // 返回前端期望的格式（与 recognizeTongue 的解析逻辑对齐）
    res.json({
      success: true,
      status: 'completed',
      data: result,
      debug: { model: ZHIPU_CONFIG.model },
    });

  } catch (error) {
    if (error.name === 'AbortError') {
      return res.json({ success: false, error: '识别超时，请重试' });
    }
    console.error('[舌象识别] 异常:', error);
    res.json({ success: false, error: error.message || String(error) });
  }
}
