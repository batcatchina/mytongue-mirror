const DEEPSEEK_CONFIG = {
  apiUrl: 'https://api.deepseek.com/chat/completions',
  apiKey: process.env.DEEPSEEK_API_KEY,
  model: 'deepseek-chat',
};

async function callDeepSeek(messages, temperature = 0.3, maxTokens = 2200) {
  const response = await fetch(DEEPSEEK_CONFIG.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_CONFIG.apiKey}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_CONFIG.model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[问诊提交] DeepSeek API错误:', errorText);
    throw new Error(`DeepSeek API调用失败: ${response.status}`);
  }

  const result = await response.json();
  const assistantMessage = result.choices?.[0]?.message?.content;
  if (!assistantMessage) {
    throw new Error('DeepSeek返回内容为空');
  }

  return assistantMessage;
}

function parseJSONResponse(content) {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : content);
  } catch (parseError) {
    console.error('[问诊提交] JSON解析失败:', parseError);
    throw new Error('AI返回格式解析失败');
  }
}

function buildSubmitSystemPrompt() {
  return `你是中医舌诊与问诊综合辨证专家。请结合初步辨证与问诊回答，输出修正后的综合辨证结论。

输出要求：
1. 保持医学表达严谨、通俗
2. 若问诊信息与初步辨证矛盾，需要明确修正逻辑
3. 只返回JSON，不要额外解释

返回JSON格式：
{
  "syndrome": "综合辨证主证",
  "syndromeType": "证型分类",
  "confidence": 0.85,
  "patternAnalysis": "病机分析",
  "pathogenesis": "病机",
  "acupuncturePlan": {
    "mainPoints": ["主穴1", "主穴2"],
    "secondaryPoints": ["配穴1"],
    "technique": "补泻手法"
  },
  "lifestyleAdvice": [
    {"category":"饮食","content":"具体建议"},
    {"category":"起居","content":"具体建议"}
  ]
}`;
}

function buildSubmitUserMessage(answers, conversationId, preliminaryDiagnosis, inputFeatures, patientInfo) {
  return `请根据以下资料生成综合辨证结论：

会话ID：${conversationId}

初步辨证：
${JSON.stringify(preliminaryDiagnosis || {}, null, 2)}

问诊回答：
${JSON.stringify(answers || [], null, 2)}

输入特征：
${JSON.stringify(inputFeatures || {}, null, 2)}

患者信息：
${JSON.stringify(patientInfo || {}, null, 2)}

请输出JSON格式：
{
  "syndrome": "综合辨证主证",
  "syndromeType": "证型分类",
  "confidence": 0.85,
  "patternAnalysis": "病机分析",
  "pathogenesis": "病机",
  "acupuncturePlan": {
    "mainPoints": ["主穴1", "主穴2"],
    "secondaryPoints": ["配穴1"],
    "technique": "补泻手法"
  },
  "lifestyleAdvice": [
    {"category":"饮食","content":"具体建议"},
    {"category":"起居","content":"具体建议"}
  ]
}

注意：只返回JSON，不要额外解释。`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: '仅支持POST请求' });
  }

  if (!DEEPSEEK_CONFIG.apiKey) {
    return res.status(500).json({ success: false, error: 'DEEPSEEK_API_KEY 未配置' });
  }

  try {
    const {
      answers,
      conversationId,
      preliminaryDiagnosis,
      inputFeatures,
      patientInfo,
    } = req.body || {};

    if (!answers || !conversationId || !preliminaryDiagnosis || !inputFeatures || !patientInfo) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数: answers, conversationId, preliminaryDiagnosis, inputFeatures, patientInfo',
      });
    }

    const systemPrompt = buildSubmitSystemPrompt();
    const userMessage = buildSubmitUserMessage(
      answers,
      conversationId,
      preliminaryDiagnosis,
      inputFeatures,
      patientInfo,
    );

    const aiContent = await callDeepSeek([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ], 0.3, 1800);

    const parsed = parseJSONResponse(aiContent);
    const updatedDiagnosisResult = parsed.updatedDiagnosisResult || parsed;

    return res.status(200).json({
      status: 200,
      data: {
        success: true,
        data: updatedDiagnosisResult,
      },
    });
  } catch (error) {
    console.error('[问诊提交] 处理失败:', error);
    return res.status(500).json({
      success: false,
      error: error.message || '问诊结论生成失败',
    });
  }
}
