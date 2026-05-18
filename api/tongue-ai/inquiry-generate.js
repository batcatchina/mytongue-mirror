import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEEPSEEK_CONFIG = {
  apiUrl: 'https://api.deepseek.com/chat/completions',
  apiKey: process.env.DEEPSEEK_API_KEY,
  model: 'deepseek-chat',
};

function generateConversationId() {
  return `sz_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadInquiryPrompt() {
  const paths = [
    join(__dirname, '..', '..', '舌镜', 'inquiry_prompt.md'),
    join(__dirname, '..', '舌镜', 'inquiry_prompt.md'),
    '/root/mytongue-mirror/舌镜/inquiry_prompt.md',
  ];

  for (const p of paths) {
    try {
      const prompt = readFileSync(p, 'utf-8');
      console.log('[问诊生成] 提示词加载成功:', p);
      return prompt;
    } catch (_) { /* 尝试下一个路径 */ }
  }

  console.warn('[问诊生成] 提示词加载失败，使用内置fallback');
  return `你是舌镜辨证问诊问题生成专家。根据初步辨证结果，生成3-5个最关键的追问问题。

要求：
1. 问题要通俗易懂
2. 每题提供2-3个可选项
3. 优先用于区分证型
4. 返回JSON格式，不要额外解释

返回JSON格式：
{
  "questions": [
    {
      "id": "q1",
      "text": "问题文字",
      "options": ["选项1", "选项2", "选项3"],
      "reason": "提问原因"
    }
  ]
}`;
}

async function callDeepSeek(messages, temperature = 0.3, maxTokens = 2000) {
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
    console.error('[问诊生成] DeepSeek API错误:', errorText);
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
    console.error('[问诊生成] JSON解析失败:', parseError);
    throw new Error('AI返回格式解析失败');
  }
}

function buildInquiryUserMessage(diagnosisResult, inputFeatures, patientInfo) {
  return `请根据以下信息生成3-5个问诊追问问题：

初步辨证结果：
${JSON.stringify(diagnosisResult || {}, null, 2)}

输入特征：
${JSON.stringify(inputFeatures || {}, null, 2)}

患者信息：
${JSON.stringify(patientInfo || {}, null, 2)}

请输出JSON格式：
{
  "questions": [
    {
      "id": "q1",
      "text": "问题文字",
      "options": ["选项1", "选项2", "选项3"],
      "reason": "提问原因"
    }
  ]
}

注意：
1. 只返回JSON，不要额外解释
2. 问题数量必须在3-5个之间`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: '仅支持POST请求' });
  }

  if (!DEEPSEEK_CONFIG.apiKey) {
    return res.status(500).json({ success: false, error: 'DEEPSEEK_API_KEY 未配置' });
  }

  try {
    const { diagnosisResult, inputFeatures, patientInfo } = req.body || {};

    if (!diagnosisResult || !inputFeatures || !patientInfo) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数: diagnosisResult, inputFeatures, patientInfo',
      });
    }

    const conversationId = generateConversationId();
    const systemPrompt = loadInquiryPrompt();
    const userMessage = buildInquiryUserMessage(diagnosisResult, inputFeatures, patientInfo);

    const aiContent = await callDeepSeek([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ], 0.4, 1500);

    const parsed = parseJSONResponse(aiContent);
    const questions = Array.isArray(parsed.questions) ? parsed.questions.slice(0, 5) : [];

    return res.status(200).json({
      status: 200,
      data: {
        success: true,
        data: {
          questions,
          conversationId,
        },
      },
    });
  } catch (error) {
    console.error('[问诊生成] 处理失败:', error);
    return res.status(500).json({
      success: false,
      error: error.message || '问诊问题生成失败',
    });
  }
}
