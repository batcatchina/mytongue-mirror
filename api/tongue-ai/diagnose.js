/**
 * 舌镜辨证推理引擎 API v3.3
 * 
 * 新增功能：
 * - v3.3: 添加 diagnose 模式（辨证主流程），直接返回前端期望格式
 * 
 * 模式说明：
 * - diagnose: 辨证主流程（前端直连），返回完整 DiagnosisOutput 格式
 * - inquiry: 生成问诊问题
 * - confirm: 确认模式
 * - detail: 详细配穴
 * - default: 默认快推理（兼容旧版）
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEEPSEEK_CONFIG = {
  apiUrl: 'https://api.deepseek.com/chat/completions',
  apiKey: process.env.DEEPSEEK_API_KEY || 'sk-8a16d38a51a14dcb946692f13c7f9d54',
  model: 'deepseek-chat',
};

function generateConversationId() {
  return `sz_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const KNOWLEDGE_PATHS = {
  default: [
    join(__dirname, '..', '..', '舌镜', 'diagnose_knowledge.md'),
    join(__dirname, '..', '舌镜', 'diagnose_knowledge.md'),
    '/root/mytongue-mirror/舌镜/diagnose_knowledge.md',
  ],
  core: [
    join(__dirname, '..', '..', '舌镜', 'diagnose_knowledge_core.md'),
    join(__dirname, '..', '舌镜', 'diagnose_knowledge_core.md'),
    '/root/mytongue-mirror/舌镜/diagnose_knowledge_core.md',
  ],
  full: [
    join(__dirname, '..', '..', '舌镜', 'diagnose_knowledge_full.md'),
    join(__dirname, '..', '舌镜', 'diagnose_knowledge_full.md'),
    '/root/mytongue-mirror/舌镜/diagnose_knowledge_full.md',
  ],
};

function loadSystemPrompt(mode = 'default') {
  const layer = (mode === 'detail') ? 'full' : 'core';
  const paths = KNOWLEDGE_PATHS[layer] || KNOWLEDGE_PATHS.core;
  
  for (const p of paths) {
    try {
      const knowledge = readFileSync(p, 'utf-8');
      console.log('[舌镜AI诊断] 知识文件加载成功:', p, '(层:', layer, ')');
      return knowledge;
    } catch (_) { /* 尝试下一个路径 */ }
  }
  
  for (const p of KNOWLEDGE_PATHS.default) {
    try {
      const knowledge = readFileSync(p, 'utf-8');
      console.log('[舌镜AI诊断] 回退到默认知识文件:', p);
      return knowledge;
    } catch (_) { /* 尝试下一个路径 */ }
  }
  
  console.warn('[舌镜AI诊断] 知识文件加载失败，使用内置fallback');
  return `你是舌镜辨证推理引擎。根据舌象特征JSON输出辨证报告。P0：60岁以上寒湿补阳(关元命门肾俞)。安全词：调理/改善/养护。禁止：治疗/治愈/疗效。输出JSON含：mainSyndrome,confidence,organLocation,transmissionAnalysis,acupuncturePlan,lifeCareAdvice`;
}

function loadInquiryPrompt() {
  return `你是舌镜辨证问诊问题生成专家。用户已完成初步舌象分析，现在需要你生成针对性的问诊问题来提高辨证准确率。

【生成原则】
1. 问题必须简单通俗，用户看一眼就能答
2. 选项2-3个，不要超过3个
3. 优先问最能区分证型的问题
4. 不要问专业术语（不问"你是不是脾虚"，问"胃口怎么样"）
5. 每个问题都要附带简短的reason说明为什么问这个

【场景问题模板】
- 寒热辨：你平时怕冷还是怕热？ → 怕冷/怕热/都还行
- 湿气辨：身体有没有沉重感？ → 经常有/偶尔/没有
- 虚实辨：容易累吗？ → 很容易/偶尔/精神还行
- 脾胃辨：胃口怎么样？ → 不太好/一般/挺好
- 肝郁辨：容易烦躁生气吗？ → 容易/偶尔/不容易
- 肾虚辨：腰膝酸软吗？ → 经常/偶尔/没有
- 心神辨：睡眠怎么样？ → 不好/一般/挺好
- 口味辨：嘴里发苦发黏吗？ → 发苦/发黏/都没有

请根据初步辨证结果，生成1-3个最关键的选择题来辅助确认证型。

返回JSON格式：
{
  "questions": [
    {
      "id": "q1",
      "text": "问题文字",
      "options": ["选项1", "选项2", "选项3"],
      "reason": "为什么问这个问题"
    }
  ]
}

注意：只返回JSON，不要额外解释。`;
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
    console.error('[舌镜AI诊断] DeepSeek API错误:', errorText);
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
    console.error('[舌镜AI诊断] JSON解析失败:', parseError);
    throw new Error('AI返回格式解析失败');
  }
}

function buildInquiryUserMessage(tongueFeatures, age, preliminaryResult) {
  return `请根据以下初步舌象分析和辨证结果，生成针对性的问诊问题来提高辨证准确率。

舌象特征：
- 舌色：${tongueFeatures.tongueColor || '未提供'}
- 舌形：${tongueFeatures.tongueShape || '未提供'}
- 苔色：${tongueFeatures.coatingColor || '未提供'}
- 苔质：${tongueFeatures.coatingTexture || '未提供'}
- 润燥：${tongueFeatures.coatingMoisture || '未提供'}
- 齿痕：${tongueFeatures.teethMark ? '有' : '无'}
- 裂纹：${tongueFeatures.crack ? '有' : '无'}
- 舌态：${tongueFeatures.tongueState || '正常'}
${age ? `- 患者年龄：${age}岁` : ''}

初步辨证结果：
- 主证：${preliminaryResult?.mainSyndrome || '未确定'}
- 置信度：${preliminaryResult?.confidence || '未评估'}
- 主要问题：${preliminaryResult?.uncertainty || '需要更多信息确认证型'}

请生成1-3个选择题来帮助确认或排除初步辨证结果。`;
}

function buildConfirmationUserMessage(tongueFeatures, age, preliminaryResult, answers) {
  const answersText = answers.map(a => 
    `- ${a.questionId}: ${a.selectedOption}${a.reason ? ` (原因: ${a.reason})` : ''}`
  ).join('\n');
  
  return `请根据以下舌象特征和问诊回答，进行修正辨证推理。

舌象特征：
- 舌色：${tongueFeatures.tongueColor || '未提供'}
- 舌形：${tongueFeatures.tongueShape || '未提供'}
- 苔色：${tongueFeatures.coatingColor || '未提供'}
- 苔质：${tongueFeatures.coatingTexture || '未提供'}
- 润燥：${tongueFeatures.coatingMoisture || '未提供'}
- 齿痕：${tongueFeatures.teethMark ? '有' : '无'}
- 裂纹：${tongueFeatures.crack ? '有' : '无'}
- 舌态：${tongueFeatures.tongueState || '正常'}
${age ? `- 患者年龄：${age}岁` : ''}

问诊回答：
${answersText}

请结合问诊回答进行最终辨证：
1. 如果回答与初步推理一致 → 提升置信度
2. 如果回答与初步推理矛盾 → 修正主证
3. 返回完整的辨证报告`;
}

/**
 * Diagnose模式：辨证主流程（v3.3新增）
 * 直接返回前端期望的完整格式
 */
async function handleDiagnoseMode(req) {
  const { tongueFeatures, age, gender, chiefComplaint, symptoms } = req.body;
  
  if (!tongueFeatures) {
    return { status: 400, data: { success: false, error: '缺少舌象特征数据' } };
  }

  console.log('[舌镜AI诊断] Diagnose模式请求:', JSON.stringify(tongueFeatures, null, 2));
  console.log('[舌镜AI诊断] 患者年龄:', age);

  const systemPrompt = loadSystemPrompt('core');

  // 构建用户消息，包含更完整的上下文
  const userMessage = `请根据以下舌象特征进行专业中医辨证分析：

## 舌象特征
- 舌色：${tongueFeatures.tongueColor || '未提供'}
- 舌形：${tongueFeatures.tongueShape || '未提供'}
- 苔色：${tongueFeatures.coatingColor || '未提供'}
- 苔质：${tongueFeatures.coatingTexture || '未提供'}
- 润燥：${tongueFeatures.coatingMoisture || '未提供'}
- 齿痕：${tongueFeatures.teethMark ? '有' : '无'}
- 裂纹：${tongueFeatures.crack ? '有' : '无'}
- 舌态：${tongueFeatures.tongueState || '正常'}

## 患者信息
${age ? `- 年龄：${age}岁` : ''}
${gender ? `- 性别：${gender}` : ''}
${chiefComplaint ? `- 主诉：${chiefComplaint}` : ''}
${symptoms ? `- 伴随症状：${symptoms}` : ''}

## 辨证要求
1. 分析舌象特征，判断证型
2. 给出置信度评估（0-1之间）
3. 提取关键穴位
4. 给出生活调理建议

## 输出格式
请严格返回JSON格式（不要包含任何其他内容）：
{
  "syndrome": "证型名称",
  "syndromeType": "证型分类：湿热/寒湿/阴虚/气虚/血瘀/气郁/平和",
  "confidence": 0.85,
  "patternAnalysis": "辨证思路简述",
  "pathogenesis": "病机分析",
  "organLocation": ["主脏腑", "次要脏腑"],
  "acupoints": ["穴位1", "穴位2", "穴位3"],
  "lifestyleAdvice": ["建议1", "建议2"],
  "notes": "补充说明"
}

## 特别注意
- 如果舌象特征完全正常（淡红舌、薄白苔、正常舌形），主证为"平和体质"，confidence≥0.85
- 60岁以上+寒湿证型，必须包含补阳穴位：关元、命门、肾俞`;

  try {
    const assistantMessage = await callDeepSeek([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ], 0.3, 2000);

    let diagnosisResult = parseJSONResponse(assistantMessage);

    // P0规则：60岁以上寒湿必须补阳（代码层双重保障）
    if (age && age >= 60) {
      const isColdDamp = diagnosisResult.syndrome?.includes('寒') || 
                        diagnosisResult.syndrome?.includes('湿') ||
                        tongueFeatures.coatingColor === '白厚';
      if (isColdDamp) {
        console.log('[舌镜AI诊断] P0规则触发：60岁以上寒湿补阳');
        const acupoints = diagnosisResult.acupoints || [];
        for (const pt of ['关元', '命门', '肾俞']) {
          if (!acupoints.includes(pt)) {
            acupoints.push(pt);
          }
        }
        diagnosisResult.acupoints = acupoints;
        diagnosisResult.notes = (diagnosisResult.notes || '') + '（已添加温阳穴位）';
      }
    }

    console.log('[舌镜AI诊断] Diagnose模式完成:', JSON.stringify(diagnosisResult, null, 2));
    
    // 直接返回完整结果，不走问诊流程
    return { 
      status: 200, 
      data: { 
        success: true, 
        engine: 'deepseek-v3.3-diagnose',
        needsConfirmation: false,
        hasDetailedPlan: true,
        data: diagnosisResult,
        finalResult: diagnosisResult,
      }
    };
  } catch (error) {
    console.error('[舌镜AI诊断] Diagnose模式异常:', error);
    return { 
      status: 500, 
      data: { 
        success: false, 
        error: error.message || '辨证分析失败' 
      }
    };
  }
}

/**
 * Default模式：默认快推理
 */
async function handleDefaultMode(req) {
  const { tongueFeatures, age, symptoms, patientInfo } = req.body;
  
  if (!tongueFeatures) {
    return { status: 400, data: { success: false, error: '缺少舌象特征数据' } };
  }

  console.log('[舌镜AI诊断] 默认模式请求:', JSON.stringify(tongueFeatures, null, 2));
  console.log('[舌镜AI诊断] 患者年龄:', age);

  const systemPrompt = loadSystemPrompt('default');

  const userMessage = `请根据以下舌象特征进行辨证：

舌象特征：
- 舌色：${tongueFeatures.tongueColor || '未提供'}
- 舌形：${tongueFeatures.tongueShape || '未提供'}
- 苔色：${tongueFeatures.coatingColor || '未提供'}
- 苔质：${tongueFeatures.coatingTexture || '未提供'}
- 润燥：${tongueFeatures.coatingMoisture || '未提供'}
- 齿痕：${tongueFeatures.teethMark ? '有' : '无'}
- 裂纹：${tongueFeatures.crack ? '有' : '无'}
- 舌态：${tongueFeatures.tongueState || '正常'}
${age ? `- 患者年龄：${age}岁` : ''}
${symptoms && symptoms.length > 0 ? `- 伴随症状：${typeof symptoms === 'string' ? symptoms : symptoms.map(s => s.name).join('、')}` : ''}
${patientInfo?.gender ? `- 性别：${patientInfo.gender}` : ''}

请返回JSON格式的辨证报告。

特别规则：如果舌象特征完全正常（淡红舌、薄白苔、正常舌形、无齿痕无裂纹），主证为"平和体质"，confidence必须≥0.85，因为正常舌象无需问诊验证。`;

  const assistantMessage = await callDeepSeek([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ]);

  let diagnosisResult = parseJSONResponse(assistantMessage);

  // P0规则：60岁以上寒湿必须补阳（代码层双重保障）
  if (age && age >= 60) {
    const isColdDamp = diagnosisResult.mainSyndrome?.includes('寒') || 
                      diagnosisResult.mainSyndrome?.includes('湿') ||
                      tongueFeatures.coatingColor === '白厚';
    if (isColdDamp) {
      console.log('[舌镜AI诊断] P0规则触发：60岁以上寒湿补阳');
      if (!diagnosisResult.acupuncturePlan) {
        diagnosisResult.acupuncturePlan = { mainPoints: [], secondaryPoints: [], technique: '补法', pointsDescription: '' };
      }
      for (const pt of ['关元', '命门', '肾俞']) {
        if (!diagnosisResult.acupuncturePlan.mainPoints.includes(pt)) {
          diagnosisResult.acupuncturePlan.mainPoints.push(pt);
        }
      }
      diagnosisResult.acupuncturePlan.pointsDescription = 
        (diagnosisResult.acupuncturePlan.pointsDescription || '') + 
        '；另加温阳要穴：关元（补肾助阳）、命门（温肾壮阳）、肾俞（滋阴助阳）。';
      diagnosisResult.acupuncturePlan.technique = '补法';
    }
  }

  console.log('[舌镜AI诊断] 辨证完成:', JSON.stringify(diagnosisResult, null, 2));
  return { 
    status: 200, 
    data: { 
      success: true, 
      engine: 'deepseek-v3.2-default', 
      data: diagnosisResult 
    }
  };
}

/**
 * Inquiry模式：生成问诊问题
 */
async function handleInquiryMode(req) {
  const { tongueFeatures, age, preliminaryResult } = req.body;
  
  if (!tongueFeatures) {
    return { status: 400, data: { success: false, error: '缺少舌象特征数据' } };
  }

  console.log('[舌镜AI诊断] Inquiry模式请求');
  
  // Step 1: 先进行初步辨证
  const systemPrompt = loadSystemPrompt('inquiry');
  const preliminaryMessage = `请根据以下舌象特征进行初步辨证：

舌象特征：
- 舌色：${tongueFeatures.tongueColor || '未提供'}
- 舌形：${tongueFeatures.tongueShape || '未提供'}
- 苔色：${tongueFeatures.coatingColor || '未提供'}
- 苔质：${tongueFeatures.coatingTexture || '未提供'}
- 润燥：${tongueFeatures.coatingMoisture || '未提供'}
- 齿痕：${tongueFeatures.teethMark ? '有' : '无'}
- 裂纹：${tongueFeatures.crack ? '有' : '无'}
- 舌态：${tongueFeatures.tongueState || '正常'}
${age ? `- 患者年龄：${age}岁` : ''}

请返回JSON格式的初步辨证报告，标注不确定性：
{
  "mainSyndrome": "主证名称",
  "confidence": 0.7,
  "uncertainty": "具体不确定的地方",
  "organLocation": {"primary": "主脏腑", "secondary": ["次要脏腑"]},
  "acupuncturePlan": {"mainPoints": [], "secondaryPoints": [], "technique": ""}
}`;

  const preliminaryResponse = await callDeepSeek([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: preliminaryMessage },
  ], 0.3);

  let preliminary = parseJSONResponse(preliminaryResponse);
  
  // 正常舌象（平和体质）自动提升置信度，避免误问诊
  const isNormalTongue = preliminary.mainSyndrome?.includes('平和') || 
                         preliminary.mainSyndrome?.includes('正常');
  if (isNormalTongue && preliminary.confidence < 0.85) {
    console.log('[舌镜AI诊断] 正常舌象，置信度自动提升:', preliminary.confidence, '→ 0.85');
    preliminary.confidence = 0.85;
  }
  
  const confidence = preliminary.confidence || 0.7;
  
  console.log('[舌镜AI诊断] 初步辨证置信度:', confidence);

  // Step 2: 根据置信度决定是否需要问诊
  let questionCount = 0;
  if (confidence >= 0.8) {
    console.log('[舌镜AI诊断] 高置信度(>=0.8)，跳过问诊');
    
    if (age && age >= 60) {
      const isColdDamp = preliminary.mainSyndrome?.includes('寒') || 
                        preliminary.mainSyndrome?.includes('湿') ||
                        tongueFeatures.coatingColor === '白厚';
      if (isColdDamp) {
        if (!preliminary.acupuncturePlan) {
          preliminary.acupuncturePlan = { mainPoints: [], secondaryPoints: [], technique: '补法', pointsDescription: '' };
        }
        for (const pt of ['关元', '命门', '肾俞']) {
          if (!preliminary.acupuncturePlan.mainPoints.includes(pt)) {
            preliminary.acupuncturePlan.mainPoints.push(pt);
          }
        }
        preliminary.acupuncturePlan.pointsDescription = 
          (preliminary.acupuncturePlan.pointsDescription || '') + 
          '；另加温阳要穴：关元（补肾助阳）、命门（温肾壮阳）、肾俞（滋阴助阳）。';
        preliminary.acupuncturePlan.technique = '补法';
      }
    }
    
    return { 
      status: 200, 
      data: { 
        success: true, 
        needsConfirmation: false, 
        hasDetailedPlan: true,
        confidence,
        preliminaryResult: preliminary,
        questions: [],
        conversationId: null,
      } 
    };
  }

  if (confidence >= 0.6) {
    questionCount = Math.random() < 0.5 ? 1 : 2;
  } else {
    questionCount = Math.min(3, Math.floor(Math.random() * 2) + 2);
  }

  console.log('[舌镜AI诊断] 需要生成', questionCount, '个问诊问题');

  // Step 3: 生成问诊问题
  const inquiryPrompt = loadInquiryPrompt();
  const inquiryUserMessage = buildInquiryUserMessage(tongueFeatures, age, preliminary);
  
  const modifiedInquiryPrompt = inquiryPrompt.replace(
    '请生成1-3个选择题',
    `请生成${questionCount}个选择题`
  );

  const inquiryResponse = await callDeepSeek([
    { role: 'system', content: modifiedInquiryPrompt },
    { role: 'user', content: inquiryUserMessage },
  ], 0.5, 1500);

  let questionsResult = parseJSONResponse(inquiryResponse);
  const questions = questionsResult.questions || [];
  
  const finalQuestions = questions.slice(0, questionCount).map((q, i) => ({
    id: `q${i + 1}`,
    text: q.text,
    options: q.options,
    reason: q.reason || '',
  }));

  console.log('[舌镜AI诊断] 生成问诊问题:', finalQuestions.length, '个');

  return { 
    status: 200, 
    data: { 
      success: true, 
      needsConfirmation: true, 
      hasDetailedPlan: true,
      confidence,
      questions: finalQuestions,
      preliminaryResult: preliminary,
      conversationId: generateConversationId(),
    } 
  };
}

/**
 * Confirm模式：修正辨证
 */
async function handleConfirmMode(req) {
  const { tongueFeatures, age, answers, conversationId, preliminaryResult } = req.body;
  
  if (!tongueFeatures) {
    return { status: 400, data: { success: false, error: '缺少舌象特征数据' } };
  }
  
  if (!answers || answers.length === 0) {
    return { status: 400, data: { success: false, error: '缺少问诊回答' } };
  }

  console.log('[舌镜AI诊断] Confirm模式请求');
  console.log('[舌镜AI诊断] 会话ID:', conversationId);
  console.log('[舌镜AI诊断] 回答数量:', answers.length);

  const systemPrompt = loadSystemPrompt('confirm');
  const userMessage = buildConfirmationUserMessage(tongueFeatures, age, preliminaryResult, answers);

  const assistantMessage = await callDeepSeek([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ]);

  let diagnosisResult = parseJSONResponse(assistantMessage);

  let confidenceBoost = 0;
  for (const answer of answers) {
    if (preliminaryResult?.mainSyndrome) {
      const syndromeKeywords = preliminaryResult.mainSyndrome;
      const answerText = answer.selectedOption || '';
      if (answerText.includes('还行') || answerText.includes('一般') || answerText.includes('没有')) {
        confidenceBoost += 0.05;
      }
    }
  }
  
  diagnosisResult.confidence = Math.min(1.0, (diagnosisResult.confidence || 0.8) + confidenceBoost);

  if (age && age >= 60) {
    const isColdDamp = diagnosisResult.mainSyndrome?.includes('寒') || 
                      diagnosisResult.mainSyndrome?.includes('湿') ||
                      tongueFeatures.coatingColor === '白厚';
    if (isColdDamp) {
      console.log('[舌镜AI诊断] P0规则触发：60岁以上寒湿补阳');
      if (!diagnosisResult.acupuncturePlan) {
        diagnosisResult.acupuncturePlan = { mainPoints: [], secondaryPoints: [], technique: '补法', pointsDescription: '' };
      }
      for (const pt of ['关元', '命门', '肾俞']) {
        if (!diagnosisResult.acupuncturePlan.mainPoints.includes(pt)) {
          diagnosisResult.acupuncturePlan.mainPoints.push(pt);
        }
      }
      diagnosisResult.acupuncturePlan.pointsDescription = 
        (diagnosisResult.acupuncturePlan.pointsDescription || '') + 
        '；另加温阳要穴：关元（补肾助阳）、命门（温肾壮阳）、肾俞（滋阴助阳）。';
      diagnosisResult.acupuncturePlan.technique = '补法';
    }
  }

  console.log('[舌镜AI诊断] 修正辨证完成:', JSON.stringify(diagnosisResult, null, 2));

  return { 
    status: 200, 
    data: { 
      success: true, 
      engine: 'deepseek-v3.2-confirm',
      conversationId,
      data: diagnosisResult,
    } 
  };
}

/**
 * Detail模式：详细配穴（需要完整知识层）
 */
async function handleDetailMode(req) {
  const { tongueFeatures, age, preliminaryResult } = req.body;
  
  if (!tongueFeatures) {
    return { status: 400, data: { success: false, error: '缺少舌象特征数据' } };
  }

  console.log('[舌镜AI诊断] Detail模式请求');

  const systemPrompt = loadSystemPrompt('detail');
  const userMessage = `请根据以下舌象特征，生成详细的配穴方案：

舌象特征：
- 舌色：${tongueFeatures.tongueColor || '未提供'}
- 舌形：${tongueFeatures.tongueShape || '未提供'}
- 苔色：${tongueFeatures.coatingColor || '未提供'}
- 苔质：${tongueFeatures.coatingTexture || '未提供'}
- 润燥：${tongueFeatures.coatingMoisture || '未提供'}
- 齿痕：${tongueFeatures.teethMark ? '有' : '无'}
- 裂纹：${tongueFeatures.crack ? '有' : '无'}
${age ? `- 患者年龄：${age}岁` : ''}

${preliminaryResult ? `初步辨证结果：${JSON.stringify(preliminaryResult, null, 2)}` : ''}

请返回详细的配穴方案，包含：
1. 每个穴位的定位（具体位置）
2. 每个穴位的归属经脉
3. 每个穴位的主治功能
4. 针刺手法建议
5. 注意事项`;

  const assistantMessage = await callDeepSeek([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ], 0.3, 3000);

  let detailResult = parseJSONResponse(assistantMessage);

  return { 
    status: 200, 
    data: { 
      success: true, 
      engine: 'deepseek-v3.2-detail',
      data: detailResult,
    } 
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ status: 'ok' });
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { mode } = req.body;
    
    console.log('[舌镜AI诊断] 请求模式:', mode || 'default');
    
    let result;
    
    switch (mode) {
      case 'diagnose':  // 新增辨证主流程
        result = await handleDiagnoseMode(req);
        break;
      case 'inquiry':
        result = await handleInquiryMode(req);
        break;
      case 'confirm':
        result = await handleConfirmMode(req);
        break;
      case 'detail':
        result = await handleDetailMode(req);
        break;
      default:
        result = await handleDefaultMode(req);
    }
    
    return res.status(result.status).json(result.data);
    
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[舌镜AI诊断] 异常:', errMsg);
    return res.status(500).json({ success: false, error: errMsg });
  }
}
