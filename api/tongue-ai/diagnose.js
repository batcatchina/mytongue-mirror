/**
 * 舌镜辨证推理引擎 API v3.4
 * 
 * v3.4修复：堵住DeepSeek余额泄露
 * - 添加严格的参数校验，空请求/无效请求直接返回错误
 * - 添加Referer来源校验
 * - Inquiry模式优化：减少不必要的DeepSeek调用
 * - 添加IP频率限制
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEEPSEEK_CONFIG = {
  apiUrl: "https://api.deepseek.com/chat/completions",
  apiKey: process.env.DEEPSEEK_API_KEY || "sk-8a16d38a51a14dcb946692f13c7f9d54",
  model: "deepseek-chat",
};

// ========== 安全防护：IP频率限制 ==========
const IP_RATE_LIMIT = new Map();
const RATE_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;

function checkIpRateLimit(ip) {
  const now = Date.now();
  const record = IP_RATE_LIMIT.get(ip);
  if (!record) {
    IP_RATE_LIMIT.set(ip, { count: 1, firstRequest: now });
    return true;
  }
  if (now - record.firstRequest > RATE_WINDOW_MS) {
    IP_RATE_LIMIT.set(ip, { count: 1, firstRequest: now });
    return true;
  }
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  record.count++;
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of IP_RATE_LIMIT.entries()) {
    if (now - record.firstRequest > RATE_WINDOW_MS * 2) {
      IP_RATE_LIMIT.delete(ip);
    }
  }
}, 5 * 60 * 1000);

// ========== 允许的Referer域名 ==========
const ALLOWED_REFERERS = ["she-zhen.top", "localhost", "vercel.app"];

function isValidRequest(req) {
  const referer = req.headers.referer || req.headers.referrer || "";
  const origin = req.headers.origin || "";
  if (!referer && !origin) {
    return process.env.NODE_ENV !== "production";
  }
  return ALLOWED_REFERERS.some(d => referer.includes(d) || origin.includes(d));
}

function generateConversationId() {
  return "sz_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
}

const KNOWLEDGE_PATHS = {
  default: [
    join(__dirname, "..", "..", "舌镜", "diagnose_knowledge.md"),
    join(__dirname, "..", "舌镜", "diagnose_knowledge.md"),
    "/root/mytongue-mirror/舌镜/diagnose_knowledge.md",
  ],
  core: [
    join(__dirname, "..", "..", "舌镜", "diagnose_knowledge_core.md"),
    join(__dirname, "..", "舌镜", "diagnose_knowledge_core.md"),
    "/root/mytongue-mirror/舌镜/diagnose_knowledge_core.md",
  ],
  full: [
    join(__dirname, "..", "..", "舌镜", "diagnose_knowledge_full.md"),
    join(__dirname, "..", "舌镜", "diagnose_knowledge_full.md"),
    "/root/mytongue-mirror/舌镜/diagnose_knowledge_full.md",
  ],
};

function loadSystemPrompt(mode = "default") {
  const layer = (mode === "detail") ? "full" : "core";
  const paths = KNOWLEDGE_PATHS[layer] || KNOWLEDGE_PATHS.core;
  for (const p of paths) {
    try {
      const knowledge = readFileSync(p, "utf-8");
      console.log("[舌镜AI诊断] 知识文件加载成功:", p, "(层:", layer, ")");
      return knowledge;
    } catch (_) { }
  }
  for (const p of KNOWLEDGE_PATHS.default) {
    try {
      const knowledge = readFileSync(p, "utf-8");
      console.log("[舌镜AI诊断] 回退到默认知识文件:", p);
      return knowledge;
    } catch (_) { }
  }
  console.warn("[舌镜AI诊断] 知识文件加载失败，使用内置fallback");
  return "你是舌镜辨证推理引擎。根据舌象特征JSON输出辨证报告。P0：60岁以上寒湿补阳(关元命门肾俞)。安全词：调理/改善/养护。禁止：治疗/治愈/疗效。输出JSON含：mainSyndrome,confidence,organLocation,transmissionAnalysis,acupuncturePlan,lifeCareAdvice";
}

function loadInquiryPrompt() {
  return "你是舌镜辨证问诊问题生成专家。用户已完成初步舌象分析，现在需要你生成针对性的问诊问题来提高辨证准确率。

【生成原则】
1. 问题必须简单通俗，用户看一眼就能答
2. 选项2-3个，不要超过3个
3. 优先问最能区分证型的问题
4. 不要问专业术语
5. 每个问题都要附带简短的reason说明为什么问这个

请根据初步辨证结果，生成1-3个最关键的选择题来辅助确认证型。

返回JSON格式：
{
  \questions\: [
    {
      \id\: \q1\,
      	ext\: \问题文字\,
      \options\: [\选项1\, \选项2\, \选项3\],
      eason\: \为什么问这个问题\n    }
  ]
}

注意：只返回JSON，不要额外解释。";
}

function buildShapeDistributionText(shapeDist) {
  if (!shapeDist) return "";
  const parts = [];
  if (shapeDist.depression && shapeDist.depression.length > 0) {
    const otherDepression = shapeDist.depression.filter(d => !d.includes("teeth") && !d.includes("crack"));
    if (otherDepression.length > 0) {
      parts.push("depression:" + otherDepression.join(","));
    }
  }
  if (shapeDist.bulge && shapeDist.bulge.length > 0) {
    parts.push("bulge:" + shapeDist.bulge.join(","));
  }
  return parts.length > 0 ? parts.join(";") : "";
}

function buildDistributionFeaturesText(distFeatures) {
  if (!distFeatures || !Array.isArray(distFeatures) || distFeatures.length === 0) return "";
  return distFeatures.map(f => f.part + f.feature).join(",");
}

// ========== 核心参数校验 ==========
function validateTongueFeatures(tongueFeatures, mode = "diagnose") {
  if (!tongueFeatures) {
    return { valid: false, error: "缺少舌象特征数据" };
  }
  const coreFields = ["tongueColor", "coatingColor"];
  for (const field of coreFields) {
    const value = tongueFeatures[field];
    if (!value || (typeof value === "string" && (value.trim() === "" || value === "未提供"))) {
      return { valid: false, error: "缺少必需字段: " + field };
    }
  }
  let validCount = 0;
  const fields = ["tongueColor", "tongueShape", "coatingColor", "coatingTexture", "coatingMoisture"];
  for (const field of fields) {
    const value = tongueFeatures[field];
    if (value && typeof value === "string" && value.trim() !== "" && value !== "未提供" && value !== "正常") {
      validCount++;
    }
  }
  if (tongueFeatures.teethMark?.has === true) validCount++;
  if (tongueFeatures.crack?.has === true) validCount++;
  if (validCount < 2) {
    return { valid: false, error: "舌象特征信息不足，无法进行辨证分析" };
  }
  return { valid: true };
}

async function callDeepSeek(messages, temperature = 0.3, maxTokens = 2000) {
  const response = await fetch(DEEPSEEK_CONFIG.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + DEEPSEEK_CONFIG.apiKey,
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
    console.error("[舌镜AI诊断] DeepSeek API错误:", errorText);
    throw new Error("DeepSeek API调用失败: " + response.status);
  }
  const result = await response.json();
  const assistantMessage = result.choices?.[0]?.message?.content;
  if (!assistantMessage) {
    throw new Error("DeepSeek返回内容为空");
  }
  return assistantMessage;
}

function parseJSONResponse(content) {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : content);
  } catch (parseError) {
    console.error("[舌镜AI诊断] JSON解析失败:", parseError);
    throw new Error("AI返回格式解析失败");
  }
}

function buildInquiryUserMessage(tongueFeatures, age, preliminaryResult) {
  return "请根据以下初步舌象分析和辨证结果，生成针对性的问诊问题来提高辨证准确率。

舌象特征：
- 舌色：" + (tongueFeatures.tongueColor || "未提供") + "
- 舌形：" + (tongueFeatures.tongueShape || "未提供") + "
- 苔色：" + (tongueFeatures.coatingColor || "未提供") + "
- 苔质：" + (tongueFeatures.coatingTexture || "未提供") + "
- 润燥：" + (tongueFeatures.coatingMoisture || "未提供") + "
- 齿痕：" + (tongueFeatures.teethMark ? "有" : "无") + "
- 裂纹：" + (tongueFeatures.crack ? "有" : "无") + "
- 舌态：" + (tongueFeatures.tongueState || "正常") + "
" + (age ? "- 患者年龄：" + age + "岁
" : "") + "
初步辨证结果：
- 主证：" + (preliminaryResult?.mainSyndrome || "未确定") + "
- 置信度：" + (preliminaryResult?.confidence || "未评估") + "
- 主要问题：" + (preliminaryResult?.uncertainty || "需要更多信息确认证型") + "

请生成1-3个选择题来帮助确认或排除初步辨证结果。";
}

function buildConfirmationUserMessage(tongueFeatures, age, preliminaryResult, answers, shapeDistText = "", distFeaturesText = "") {
  const answersText = answers.map(a => "- " + a.questionId + ": " + a.selectedOption + (a.reason ? " (原因: " + a.reason + ")" : "")).join("
");
  return "请根据以下舌象特征和问诊回答，进行修正辨证推理。

舌象特征：
- 舌色：" + (tongueFeatures.tongueColor || "未提供") + "
- 舌形：" + (tongueFeatures.tongueShape || "未提供") + "
- 苔色：" + (tongueFeatures.coatingColor || "未提供") + "
- 苔质：" + (tongueFeatures.coatingTexture || "未提供") + "
- 润燥：" + (tongueFeatures.coatingMoisture || "未提供") + "
- 齿痕：" + (tongueFeatures.teethMark ? "有" : "无") + "
- 裂纹：" + (tongueFeatures.crack ? "有" : "无") + "
- 舌态：" + (tongueFeatures.tongueState || "正常") + "
" + (shapeDistText ? "- 凹凸形态：" + shapeDistText + "
" : "") + (distFeaturesText ? "- 舌色分布：" + distFeaturesText + "
" : "") + (age ? "- 患者年龄：" + age + "岁
" : "") + "
问诊回答：
" + answersText + "

请结合问诊回答进行最终辨证。";
}

async function handleDiagnoseMode(req) {
  const { tongueFeatures, age, gender, chiefComplaint, symptoms } = req.body;
  const validation = validateTongueFeatures(tongueFeatures, "diagnose");
  if (!validation.valid) {
    console.log("[舌镜AI诊断] Diagnose模式参数校验失败:", validation.error);
    return { status: 400, data: { success: false, error: validation.error } };
  }
  console.log("[舌镜AI诊断] Diagnose模式请求:", JSON.stringify(tongueFeatures, null, 2));
  console.log("[舌镜AI诊断] 患者年龄:", age);
  const systemPrompt = loadSystemPrompt("core");
  const shapeDistText = buildShapeDistributionText(tongueFeatures.shapeDistribution);
  const distFeaturesText = buildDistributionFeaturesText(tongueFeatures.distributionFeatures);
  const userMessage = "请根据以下舌象特征进行专业中医辨证分析：

## 舌象特征
- 舌色：" + (tongueFeatures.tongueColor || "未提供") + "
- 舌形：" + (tongueFeatures.tongueShape || "未提供") + "
- 苔色：" + (tongueFeatures.coatingColor || "未提供") + "
- 苔质：" + (tongueFeatures.coatingTexture || "未提供") + "
- 润燥：" + (tongueFeatures.coatingMoisture || "未提供") + "
- 齿痕：" + (tongueFeatures.teethMark ? "有" : "无") + "
- 裂纹：" + (tongueFeatures.crack ? "有" : "无") + "
- 舌态：" + (tongueFeatures.tongueState || "正常") + "
" + (shapeDistText ? "- 凹凸形态：" + shapeDistText + "
" : "") + (distFeaturesText ? "- 舌色分布特征：" + distFeaturesText + "
" : "") + "
## 患者信息
" + (age ? "- 年龄：" + age + "岁
" : "") + (gender ? "- 性别：" + gender + "
" : "") + (chiefComplaint ? "- 主诉：" + chiefComplaint + "
" : "") + (symptoms ? "- 伴随症状：" + symptoms + "
" : "") + "
## 辨证要求
1. 分析舌象特征，判断证型
2. 给出置信度评估（0-1之间）
3. 提取关键穴位
4. 给出生活调理建议

## 输出格式
请严格返回JSON格式（不要包含任何其他内容）：
{
  \syndrome\: \证型名称\,
  \syndromeType\: \证型分类\,
  \confidence\: 0.85,
  \pathogenesis\: \病机简述\,
  \organLocation\: [\脾胃\, \肝胆\],
  \secondarySyndromes\: [{\syndrome\: \次要证型\, \weight\: 0.3}],
  	ransmissionAnalysis\: \传变分析\,
  cupuncturePlan\: {
    \mainPoints\: [\足三里\, \中脘\],
    \secondaryPoints\: [\内关\],
    \pointsDescription\: \配穴思路\,
    	echnique\: \补法/泻法/平补平泻\n  },
  \lifeCareAdvice\: \生活调理建议\n}";
  const assistantMessage = await callDeepSeek([{ role: "system", content: systemPrompt }, { role: "user", content: userMessage }], 0.3);
  let diagnosisResult = parseJSONResponse(assistantMessage);
  const isNormalTongue = diagnosisResult.syndrome?.includes("平和") || diagnosisResult.syndrome?.includes("正常体质");
  if (isNormalTongue && diagnosisResult.confidence < 0.85) {
    diagnosisResult.confidence = 0.85;
  }
  if (age && age >= 60) {
    const isColdDamp = diagnosisResult.syndrome?.includes("寒") || diagnosisResult.syndrome?.includes("湿") || tongueFeatures.coatingColor === "白厚";
    if (isColdDamp) {
      if (!diagnosisResult.acupuncturePlan) diagnosisResult.acupuncturePlan = { mainPoints: [], secondaryPoints: [], technique: "补法", pointsDescription: "" };
      for (const pt of ["关元", "命门", "肾俞"]) { if (!diagnosisResult.acupuncturePlan.mainPoints.includes(pt)) diagnosisResult.acupuncturePlan.mainPoints.push(pt); }
      diagnosisResult.acupuncturePlan.pointsDescription = (diagnosisResult.acupuncturePlan.pointsDescription || "") + "；另加温阳要穴：关元（补肾助阳）、命门（温肾壮阳）、肾俞（滋阴助阳）。";
      diagnosisResult.acupuncturePlan.technique = "补法";
    }
  }
  return { status: 200, data: { success: true, engine: "deepseek-v3.4-diagnose", data: diagnosisResult } };
}

async function handleDefaultMode(req) {
  const { tongueFeatures, age, gender } = req.body;
  const validation = validateTongueFeatures(tongueFeatures, "default");
  if (!validation.valid) {
    return { status: 400, data: { success: false, error: validation.error } };
  }
  console.log("[舌镜AI诊断] 默认模式请求:", JSON.stringify(tongueFeatures, null, 2));
  const systemPrompt = loadSystemPrompt("default");
  const shapeDistText = (() => {
    if (!tongueFeatures.shapeDistribution) return "";
    const parts = [];
    if (tongueFeatures.shapeDistribution.depression?.length > 0) {
      const otherDep = tongueFeatures.shapeDistribution.depression.filter(d => !d.includes("齿痕") && !d.includes("裂纹"));
      if (otherDep.length > 0) parts.push("凹陷区域：" + otherDep.join("、"));
    }
    if (tongueFeatures.shapeDistribution.bulge?.length > 0) parts.push("鼓胀区域：" + tongueFeatures.shapeDistribution.bulge.join("、"));
    return parts.length > 0 ? parts.join("；") : "";
  })();
  const distFeaturesText = buildDistributionFeaturesText(tongueFeatures.distributionFeatures);
  const userMessage = "请根据以下舌象特征进行中医辨证分析：

舌象特征：
- 舌色：" + (tongueFeatures.tongueColor || "未提供") + "
- 舌形：" + (tongueFeatures.tongueShape || "未提供") + "
- 苔色：" + (tongueFeatures.coatingColor || "未提供") + "
- 苔质：" + (tongueFeatures.coatingTexture || "未提供") + "
- 润燥：" + (tongueFeatures.coatingMoisture || "未提供") + "
- 齿痕：" + (tongueFeatures.teethMark ? "有" : "无") + "
- 裂纹：" + (tongueFeatures.crack ? "有" : "无") + "
- 舌态：" + (tongueFeatures.tongueState || "正常") + "
" + (shapeDistText ? "- 凹凸形态：" + shapeDistText + "
" : "") + (distFeaturesText ? "- 舌色分布特征：" + distFeaturesText + "
" : "") + (age ? "- 患者年龄：" + age + "岁
" : "") + (gender ? "- 性别：" + gender + "
" : "") + "
请返回JSON格式的辨证报告。";
  const assistantMessage = await callDeepSeek([{ role: "system", content: systemPrompt }, { role: "user", content: userMessage }], 0.3);
  let diagnosisResult = parseJSONResponse(assistantMessage);
  const isNormalTongue = diagnosisResult.primarySyndrome?.includes("平和") || diagnosisResult.primarySyndrome?.includes("正常");
  if (isNormalTongue && diagnosisResult.confidence < 0.85) diagnosisResult.confidence = 0.85;
  if (age && age >= 60) {
    const isColdDamp = diagnosisResult.primarySyndrome?.includes("寒") || diagnosisResult.primarySyndrome?.includes("湿") || tongueFeatures.coatingColor === "白厚";
    if (isColdDamp) {
      if (!diagnosisResult.acupuncturePlan) diagnosisResult.acupuncturePlan = { mainPoints: [], secondaryPoints: [], technique: "补法", pointsDescription: "" };
      for (const pt of ["关元", "命门", "肾俞"]) { if (!diagnosisResult.acupuncturePlan.mainPoints.includes(pt)) diagnosisResult.acupuncturePlan.mainPoints.push(pt); }
      diagnosisResult.acupuncturePlan.pointsDescription = (diagnosisResult.acupuncturePlan.pointsDescription || "") + "；另加温阳要穴：关元（补肾助阳）、命门（温肾壮阳）、肾俞（滋阴助阳）。";
      diagnosisResult.acupuncturePlan.technique = "补法";
    }
  }
  return { status: 200, data: { success: true, engine: "deepseek-v3.4-default", data: diagnosisResult } };
}

async function handleInquiryMode(req) {
  const { tongueFeatures, age, preliminaryResult } = req.body;
  const validation = validateTongueFeatures(tongueFeatures, "inquiry");
  if (!validation.valid) {
    return { status: 400, data: { success: false, error: validation.error } };
  }
  console.log("[舌镜AI诊断] Inquiry模式请求");
  
  // v3.4优化：如果前端已提供初步辨证结果，直接生成问诊，跳过初步辨证调用
  if (preliminaryResult && preliminaryResult.mainSyndrome && preliminaryResult.confidence >= 0.8) {
    console.log("[舌镜AI诊断] 前端已有高置信度结果，跳过初步辨证");
    const isNormalTongue = preliminaryResult.mainSyndrome?.includes("平和") || preliminaryResult.mainSyndrome?.includes("正常");
    if ((isNormalTongue && preliminaryResult.confidence >= 0.85) || preliminaryResult.confidence >= 0.8) {
      return { status: 200, data: { success: true, needsConfirmation: false, hasDetailedPlan: true, confidence: preliminaryResult.confidence, preliminaryResult, questions: [], conversationId: null } };
    }
    const questionCount = preliminaryResult.confidence >= 0.6 ? 1 : 2;
    const inquiryPrompt = loadInquiryPrompt().replace("请生成1-3个选择题", "请生成" + questionCount + "个选择题");
    const inquiryResponse = await callDeepSeek([{ role: "system", content: inquiryPrompt }, { role: "user", content: buildInquiryUserMessage(tongueFeatures, age, preliminaryResult) }], 0.5, 1500);
    let questionsResult = parseJSONResponse(inquiryResponse);
    const questions = (questionsResult.questions || []).slice(0, questionCount).map((q, i) => ({ id: "q" + (i + 1), text: q.text, options: q.options, reason: q.reason || "" }));
    return { status: 200, data: { success: true, needsConfirmation: true, hasDetailedPlan: true, confidence: preliminaryResult.confidence, questions, preliminaryResult, conversationId: generateConversationId() } };
  }
  
  // 原逻辑：需要初步辨证
  const systemPrompt = loadSystemPrompt("inquiry");
  const inquiryShapeDistText = buildShapeDistributionText(tongueFeatures.shapeDistribution);
  const inquiryDistFeaturesText = buildDistributionFeaturesText(tongueFeatures.distributionFeatures);
  const preliminaryMessage = "请根据以下舌象特征进行初步辨证：

舌象特征：
- 舌色：" + (tongueFeatures.tongueColor || "未提供") + "
- 舌形：" + (tongueFeatures.tongueShape || "未提供") + "
- 苔色：" + (tongueFeatures.coatingColor || "未提供") + "
- 苔质：" + (tongueFeatures.coatingTexture || "未提供") + "
- 润燥：" + (tongueFeatures.coatingMoisture || "未提供") + "
- 齿痕：" + (tongueFeatures.teethMark ? "有" : "无") + "
- 裂纹：" + (tongueFeatures.crack ? "有" : "无") + "
- 舌态：" + (tongueFeatures.tongueState || "正常") + "
" + (inquiryShapeDistText ? "- 凹凸形态：" + inquiryShapeDistText + "
" : "") + (inquiryDistFeaturesText ? "- 舌色分布：" + inquiryDistFeaturesText + "
" : "") + (age ? "- 患者年龄：" + age + "岁
" : "") + "
请返回JSON格式的初步辨证报告，标注不确定性。";
  const preliminaryResponse = await callDeepSeek([{ role: "system", content: systemPrompt }, { role: "user", content: preliminaryMessage }], 0.3);
  let preliminary = parseJSONResponse(preliminaryResponse);
  const isNormalTongue = preliminary.mainSyndrome?.includes("平和") || preliminary.mainSyndrome?.includes("正常");
  if (isNormalTongue && preliminary.confidence < 0.85) preliminary.confidence = 0.85;
  const confidence = preliminary.confidence || 0.7;
  console.log("[舌镜AI诊断] 初步辨证置信度:", confidence);
  if (confidence >= 0.8) {
    if (age && age >= 60) {
      const isColdDamp = preliminary.mainSyndrome?.includes("寒") || preliminary.mainSyndrome?.includes("湿") || tongueFeatures.coatingColor === "白厚";
      if (isColdDamp) {
        if (!preliminary.acupuncturePlan) preliminary.acupuncturePlan = { mainPoints: [], secondaryPoints: [], technique: "补法", pointsDescription: "" };
        for (const pt of ["关元", "命门", "肾俞"]) { if (!preliminary.acupuncturePlan.mainPoints.includes(pt)) preliminary.acupuncturePlan.mainPoints.push(pt); }
        preliminary.acupuncturePlan.pointsDescription = (preliminary.acupuncturePlan.pointsDescription || "") + "；另加温阳要穴：关元（补肾助阳）、命门（温肾壮阳）、肾俞（滋阴助阳）。";
        preliminary.acupuncturePlan.technique = "补法";
      }
    }
    return { status: 200, data: { success: true, needsConfirmation: false, hasDetailedPlan: true, confidence, preliminaryResult: preliminary, questions: [], conversationId: null } };
  }
  let questionCount = confidence >= 0.6 ? (Math.random() < 0.5 ? 1 : 2) : Math.min(3, Math.floor(Math.random() * 2) + 2);
  const inquiryPrompt = loadInquiryPrompt().replace("请生成1-3个选择题", "请生成" + questionCount + "个选择题");
  const inquiryResponse = await callDeepSeek([{ role: "system", content: inquiryPrompt }, { role: "user", content: buildInquiryUserMessage(tongueFeatures, age, preliminary) }], 0.5, 1500);
  let questionsResult = parseJSONResponse(inquiryResponse);
  const questions = (questionsResult.questions || []).slice(0, questionCount).map((q, i) => ({ id: "q" + (i + 1), text: q.text, options: q.options, reason: q.reason || "" }));
  return { status: 200, data: { success: true, needsConfirmation: true, hasDetailedPlan: true, confidence, questions, preliminaryResult: preliminary, conversationId: generateConversationId() } };
}

async function handleConfirmMode(req) {
  const { tongueFeatures, age, answers, conversationId, preliminaryResult } = req.body;
  const validation = validateTongueFeatures(tongueFeatures, "confirm");
  if (!validation.valid) return { status: 400, data: { success: false, error: validation.error } };
  if (!answers || answers.length === 0) return { status: 400, data: { success: false, error: "缺少问诊回答" } };
  const systemPrompt = loadSystemPrompt("confirm");
  const confirmShapeDistText = buildShapeDistributionText(tongueFeatures.shapeDistribution);
  const confirmDistFeaturesText = buildDistributionFeaturesText(tongueFeatures.distributionFeatures);
  const userMessage = buildConfirmationUserMessage(tongueFeatures, age, preliminaryResult, answers, confirmShapeDistText, confirmDistFeaturesText);
  const assistantMessage = await callDeepSeek([{ role: "system", content: systemPrompt }, { role: "user", content: userMessage }]);
  let diagnosisResult = parseJSONResponse(assistantMessage);
  let confidenceBoost = 0;
  for (const answer of answers) {
    if (preliminaryResult?.mainSyndrome) {
      const answerText = answer.selectedOption || "";
      if (answerText.includes("还行") || answerText.includes("一般") || answerText.includes("没有")) confidenceBoost += 0.05;
    }
  }
  diagnosisResult.confidence = Math.min(1.0, (diagnosisResult.confidence || 0.8) + confidenceBoost);
  if (age && age >= 60) {
    const isColdDamp = diagnosisResult.mainSyndrome?.includes("寒") || diagnosisResult.mainSyndrome?.includes("湿") || tongueFeatures.coatingColor === "白厚";
    if (isColdDamp) {
      if (!diagnosisResult.acupuncturePlan) diagnosisResult.acupuncturePlan = { mainPoints: [], secondaryPoints: [], technique: "补法", pointsDescription: "" };
      for (const pt of ["关元", "命门", "肾俞"]) { if (!diagnosisResult.acupuncturePlan.mainPoints.includes(pt)) diagnosisResult.acupuncturePlan.mainPoints.push(pt); }
      diagnosisResult.acupuncturePlan.pointsDescription = (diagnosisResult.acupuncturePlan.pointsDescription || "") + "；另加温阳要穴：关元（补肾助阳）、命门（温肾壮阳）、肾俞（滋阴助阳）。";
      diagnosisResult.acupuncturePlan.technique = "补法";
    }
  }
  if (!diagnosisResult.acupuncturePlan && diagnosisResult.acupoints) {
    const points = Array.isArray(diagnosisResult.acupoints) ? diagnosisResult.acupoints : [];
    diagnosisResult.acupuncturePlan = { mainPoints: points.slice(0, 3), secondaryPoints: points.slice(3, 6), technique: "平补平泻" };
  }
  return { status: 200, data: { success: true, engine: "deepseek-v3.4-confirm", conversationId, data: diagnosisResult } };
}

async function handleDetailMode(req) {
  const { tongueFeatures, age, preliminaryResult } = req.body;
  const validation = validateTongueFeatures(tongueFeatures, "detail");
  if (!validation.valid) return { status: 400, data: { success: false, error: validation.error } };
  console.log("[舌镜AI诊断] Detail模式请求");
  const systemPrompt = loadSystemPrompt("detail");
  const detailShapeDistText = buildShapeDistributionText(tongueFeatures.shapeDistribution);
  const detailDistFeaturesText = buildDistributionFeaturesText(tongueFeatures.distributionFeatures);
  const userMessage = "请根据以下舌象特征，生成详细的配穴方案：

舌象特征：
- 舌色：" + (tongueFeatures.tongueColor || "未提供") + "
- 舌形：" + (tongueFeatures.tongueShape || "未提供") + "
- 苔色：" + (tongueFeatures.coatingColor || "未提供") + "
- 苔质：" + (tongueFeatures.coatingTexture || "未提供") + "
- 润燥：" + (tongueFeatures.coatingMoisture || "未提供") + "
- 齿痕：" + (tongueFeatures.teethMark ? "有" : "无") + "
- 裂纹：" + (tongueFeatures.crack ? "有" : "无") + "
" + (detailShapeDistText ? "- 凹凸形态：" + detailShapeDistText + "
" : "") + (detailDistFeaturesText ? "- 舌色分布：" + detailDistFeaturesText + "
" : "") + (age ? "- 患者年龄：" + age + "岁
" : "") + (preliminaryResult ? "
初步辨证结果：" + JSON.stringify(preliminaryResult, null, 2) : "") + "

请返回详细的配穴方案，包含：1. 每个穴位的定位 2. 每个穴位的归属经脉 3. 每个穴位的主治功能 4. 针刺手法建议 5. 注意事项";
  const assistantMessage = await callDeepSeek([{ role: "system", content: systemPrompt }, { role: "user", content: userMessage }], 0.3, 3000);
  let detailResult = parseJSONResponse(assistantMessage);
  return { status: 200, data: { success: true, engine: "deepseek-v3.4-detail", data: detailResult } };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).json({ status: "ok" });
  if (req.method !== "POST") return res.status(405).json({ success: false, error: "Method not allowed" });
  
  const clientIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.headers["x-real-ip"] || req.socket?.remoteAddress || "unknown";
  if (!checkIpRateLimit(clientIp)) {
    console.log("[舌镜AI诊断] IP频率超限:", clientIp);
    return res.status(429).json({ success: false, error: "请求过于频繁，请稍后再试", retryAfter: 60 });
  }
  if (process.env.NODE_ENV === "production") {
    if (!isValidRequest(req)) {
      console.log("[舌镜AI诊断] 来源校验拒绝请求");
      return res.status(403).json({ success: false, error: "请求来源不被允许" });
    }
  }
  try {
    const { mode } = req.body;
    console.log("[舌镜AI诊断] 请求模式:", mode || "default", "| IP:", clientIp);
    let result;
    switch (mode) {
      case "diagnose": result = await handleDiagnoseMode(req); break;
      case "inquiry": result = await handleInquiryMode(req); break;
      case "confirm": result = await handleConfirmMode(req); break;
      case "detail": result = await handleDetailMode(req); break;
      default: result = await handleDefaultMode(req);
    }
    return res.status(result.status).json(result.data);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("[舌镜AI诊断] 异常:", errMsg);
    return res.status(500).json({ success: false, error: errMsg });
  }
}
