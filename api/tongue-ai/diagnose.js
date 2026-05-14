/**
 * 舌镜辨证推理引擎 API v3.1
 * 方案A：推理层换DeepSeek + 知识文件可进化
 * 
 * 版本历史：
 * - v2.0: 本地4层TS推理引擎（已废弃）
 * - v3.0: DeepSeek API推理（prompt硬编码）
 * - v3.1: DeepSeek API推理 + prompt从知识文件读取（可进化）
 * 
 * 回滚方案：将前端的DIAGNOSIS_ENGINE改为'local'
 * 知识文件：./舌镜/diagnose_knowledge.md
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

/**
 * 从知识文件读取系统Prompt（热更新，无需重启）
 * 更新 diagnose_knowledge.md 即可让推理引擎进化
 */
function loadSystemPrompt() {
  const possiblePaths = [
    join(__dirname, '..', '..', '舌镜', 'diagnose_knowledge.md'),
    join(__dirname, '..', '舌镜', 'diagnose_knowledge.md'),
    '/root/mytongue-mirror/舌镜/diagnose_knowledge.md',
  ];
  
  for (const p of possiblePaths) {
    try {
      const content = readFileSync(p, 'utf-8');
      console.log('[舌镜AI诊断] 知识文件加载成功:', p);
      return content;
    } catch (_) { /* 尝试下一个路径 */ }
  }
  
  console.warn('[舌镜AI诊断] 知识文件加载失败，使用内置fallback');
  return `你是舌镜辨证推理引擎。根据舌象特征JSON输出辨证报告。P0：60岁以上寒湿补阳(关元命门肾俞)。安全词：调理/改善/养护。禁止：治疗/治愈/疗效。输出JSON含：mainSyndrome,confidence,organLocation,transmissionAnalysis,acupuncturePlan,lifeCareAdvice`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).json({ status: 'ok' });
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const { tongueFeatures, age, symptoms, patientInfo } = req.body;
    if (!tongueFeatures) return res.status(400).json({ success: false, error: '缺少舌象特征数据' });

    console.log('[舌镜AI诊断] 接收请求:', JSON.stringify(tongueFeatures, null, 2));
    console.log('[舌镜AI诊断] 患者年龄:', age);

    const systemPrompt = loadSystemPrompt();

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
${symptoms && symptoms.length > 0 ? `- 伴随症状：${symptoms.map(s => s.name).join('、')}` : ''}
${patientInfo?.gender ? `- 性别：${patientInfo.gender}` : ''}

请返回JSON格式的辨证报告。`;

    const deepseekResponse = await fetch(DEEPSEEK_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_CONFIG.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!deepseekResponse.ok) {
      const errorText = await deepseekResponse.text();
      console.error('[舌镜AI诊断] DeepSeek API错误:', errorText);
      return res.status(500).json({ success: false, error: `DeepSeek API调用失败: ${deepseekResponse.status}` });
    }

    const result = await deepseekResponse.json();
    const assistantMessage = result.choices?.[0]?.message?.content;
    if (!assistantMessage) return res.status(500).json({ success: false, error: 'DeepSeek返回内容为空' });

    let diagnosisResult;
    try {
      const jsonMatch = assistantMessage.match(/\{[\s\S]*\}/);
      diagnosisResult = JSON.parse(jsonMatch ? jsonMatch[0] : assistantMessage);
    } catch (parseError) {
      console.error('[舌镜AI诊断] JSON解析失败:', parseError);
      return res.status(500).json({ success: false, error: 'AI返回格式解析失败', raw: assistantMessage });
    }

    // ⚠️ P0规则：60岁以上寒湿必须补阳（代码层双重保障）
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
          if (!diagnosisResult.acupuncturePlan.mainPoints.includes(pt)) diagnosisResult.acupuncturePlan.mainPoints.push(pt);
        }
        diagnosisResult.acupuncturePlan.pointsDescription = 
          (diagnosisResult.acupuncturePlan.pointsDescription || '') + 
          '；另加温阳要穴：关元（补肾助阳）、命门（温肾壮阳）、肾俞（滋阴助阳）。';
        diagnosisResult.acupuncturePlan.technique = '补法';
      }
    }

    console.log('[舌镜AI诊断] 辨证完成:', JSON.stringify(diagnosisResult, null, 2));
    return res.json({ success: true, engine: 'deepseek-v3.1-knowledge-file', data: diagnosisResult });

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[舌镜AI诊断] 异常:', errMsg);
    return res.status(500).json({ success: false, error: errMsg });
  }
}
