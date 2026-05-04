// MCP协议路由 - 舌镜辨证能力引擎
// 支持 JSON-RPC 2.0 协议
// 使用 CommonJS 格式以兼容 Vercel Serverless Functions

// ==================== 引用核心模块 ====================
const { 
  getAcupointInfo, 
  getAllAcupointNames, 
  getAcupointCount,
  searchAcupoints 
} = require('./lib/acupoint-data');

const { 
  diagnoseTongue, 
  getRuleCount, 
  getAllSyndromes, 
  getRulesSummary 
} = require('./lib/diagnosis-engine');

// ==================== Coze API配置 ====================
const COZE_CONFIG = {
  botId: '7634049322782785572',
  chatApiUrl: 'https://api.coze.cn/v3/chat',
  uploadApiUrl: 'https://api.coze.cn/v1/files/upload',
  token: 'pat_cT0kGwXPwioWz69z65sLufTqcr1PJNorzO4EJbymAfbMM7uWC2W2qDCvdEqiK1l6'
};

// ==================== 工具定义 ====================
const TOOLS = [
  {
    name: "tongue_analyze",
    description: "舌诊辨证分析 - 传入舌象特征（舌色、舌形、舌苔等），返回中医辨证结果、证型判断、脏腑定位和针灸选穴建议",
    inputSchema: {
      type: "object",
      required: ["tongue_color", "tongue_shape"],
      properties: {
        tongue_color: { type: "string", description: "舌色", enum: ["淡红", "淡白", "红", "绛", "紫", "青紫"] },
        tongue_shape: { type: "string", description: "舌形", enum: ["胖大", "瘦薄", "正常"] },
        tongue_state: { type: "string", description: "舌态", enum: ["强硬", "痿软", "歪斜", "颤动", "正常"], default: "正常" },
        coating_color: { type: "string", description: "苔色", enum: ["薄白", "白厚", "黄", "灰黑", "剥落"], default: "薄白" },
        coating_texture: { type: "string", description: "苔质", enum: ["薄", "厚", "正常"], default: "薄" },
        coating_moisture: { type: "string", description: "润燥", enum: ["润", "燥", "正常"], default: "润" },
        teeth_mark: { type: "boolean", description: "是否有齿痕", default: false },
        crack: { type: "boolean", description: "是否有裂纹", default: false },
        chief_complaint: { type: "string", description: "主诉症状（可选）" },
        patient_age: { type: "number", description: "患者年龄（可选）" },
        patient_gender: { type: "string", description: "患者性别", enum: ["男", "女"] }
      }
    }
  },
  {
    name: "tongue_image_analyze",
    description: "上传舌象图片进行AI识别与辨证 - 传入base64编码的舌象图片，自动识别舌象特征并返回完整辨证结果",
    inputSchema: {
      type: "object",
      required: ["image"],
      properties: {
        image: { type: "string", description: "base64编码的舌象图片（data URL格式或纯base64）" },
        patient_age: { type: "number", description: "患者年龄（可选）" },
        patient_gender: { type: "string", description: "患者性别（可选）", enum: ["男", "女"] }
      }
    }
  },
  {
    name: "query_acupoint",
    description: "查询穴位信息 - 传入穴位名称，返回定位、经脉归属、功效、主治等完整信息",
    inputSchema: {
      type: "object",
      required: ["name"],
      properties: {
        name: { type: "string", description: "穴位名称，如'足三里'、'太溪'、'合谷'等" }
      }
    }
  },
  {
    name: "list_acupoints",
    description: "列出所有支持的穴位 - 返回穴位列表及完整信息",
    inputSchema: { type: "object", properties: {} }
  }
];

// ==================== 处理函数 ====================

// 处理舌诊辨证分析
async function handleTongueAnalyze(args) {
  try {
    const result = diagnoseTongue({
      tongue_color: args.tongue_color,
      tongue_shape: args.tongue_shape,
      tongue_state: args.tongue_state || '正常',
      coating_color: args.coating_color || '薄白',
      coating_texture: args.coating_texture || '薄',
      coating_moisture: args.coating_moisture || '润',
      teeth_mark: args.teeth_mark || false,
      crack: args.crack || false,
    });
    if (args.chief_complaint) result.chiefComplaint = args.chief_complaint;
    if (args.patient_age) result.patientAge = args.patient_age;
    if (args.patient_gender) result.patientGender = args.patient_gender;
    return result;
  } catch (error) {
    return { error: `辨证分析失败: ${error.message}` };
  }
}

// 处理图片分析
async function handleImageAnalyze(args) {
  try {
    const { image, patient_age, patient_gender } = args;
    if (!image) return { error: '缺少图片数据' };

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
    pureBase64 = pureBase64.replace(/\s/g, '');
    const buffer = Buffer.from(pureBase64, 'base64');
    const ext = mimeType.includes('png') ? 'png' : 'jpg';
    const fileName = `tongue_${Date.now()}.${ext}`;

    const boundary = '----CozeUpload' + Date.now().toString(36);
    const header = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${mimeType}\r\n\r\n`);
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
    const payload = Buffer.concat([header, buffer, footer]);

    const uploadRes = await fetch(COZE_CONFIG.uploadApiUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${COZE_CONFIG.token}`, 'Content-Type': `multipart/form-data; boundary=${boundary}` },
      body: payload
    });

    const uploadData = await uploadRes.json();
    if (uploadData.code !== 0 || !uploadData.data?.id) return { error: `图片上传失败: ${uploadData.msg || 'unknown'}` };

    const fileId = uploadData.data.id;

    const TONGUE_PROMPT = `你是一个舌象判断与识别系统。请严格执行以下判断：【判断】图片中是否包含伸出的舌头和口腔？判断标准：必须能清晰看到口腔内伸出的舌头。如果没有舌头和口腔，返回：{"tongueDetected":false,"message":"未检测到舌象"}。如果有舌头和口腔，返回：{"tongueDetected":true,"tongue_color":"","tongue_shape":"","teeth_mark":{"has":false},"crack":{"has":false},"tongue_coating":{"color":"","texture":""}}`;

    const chatRes = await fetch(COZE_CONFIG.chatApiUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${COZE_CONFIG.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bot_id: COZE_CONFIG.botId,
        user_id: `mcp_${Date.now()}`,
        stream: false,
        additional_messages: [{ role: 'user', content_type: 'object_string', content: JSON.stringify([{ type: 'file', file_id: fileId }, { type: 'text', text: TONGUE_PROMPT }]) }]
      })
    });

    const chatData = await chatRes.json();
    if (chatData.code !== 0 || !chatData.data?.id) return { error: `创建对话失败: ${chatData.msg || 'unknown'}` };

    const chatId = chatData.data.id;

    // 轮询等待结果
    for (let i = 0; i < 30; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const statusRes = await fetch(`https://api.coze.cn/v3/chat/retrieve?chat_id=${chatId}&conversation_id=${chatData.data.conversation_id}`, {
        headers: { 'Authorization': `Bearer ${COZE_CONFIG.token}`, 'Content-Type': 'application/json' }
      });

      const statusData = await statusRes.json();

      if (statusData.data?.status === 'completed') {
        const messagesRes = await fetch(`https://api.coze.cn/v3/chat/message/list?chat_id=${chatId}&conversation_id=${chatData.data.conversation_id}`, {
          headers: { 'Authorization': `Bearer ${COZE_CONFIG.token}`, 'Content-Type': 'application/json' }
        });

        const messagesData = await messagesRes.json();
        let tongueFeatures = null;

        for (const msg of (messagesData.data || [])) {
          if (msg.role === 'assistant' && msg.type === 'answer') {
            try {
              const jsonMatch = msg.content.match(/\{[\s\S]*\}/);
              if (jsonMatch) tongueFeatures = JSON.parse(jsonMatch[0]);
            } catch (e) {}
          }
        }

        if (tongueFeatures && tongueFeatures.tongueDetected) {
          const diagnosisResult = diagnoseTongue({
            tongue_color: tongueFeatures.tongue_color || tongueFeatures.tongueColor,
            tongue_shape: tongueFeatures.tongue_shape || tongueFeatures.tongueShape,
            tongue_state: '正常',
            coating_color: tongueFeatures.tongue_coating?.color || '薄白',
            coating_texture: tongueFeatures.tongue_coating?.texture || '薄',
            coating_moisture: '润',
            teeth_mark: tongueFeatures.teeth_mark?.has || false,
            crack: tongueFeatures.crack?.has || false,
          });
          if (patient_age) diagnosisResult.patientAge = patient_age;
          if (patient_gender) diagnosisResult.patientGender = patient_gender;
          diagnosisResult.imageAnalysis = tongueFeatures;
          return diagnosisResult;
        }

        return { error: tongueFeatures?.message || '未能识别舌象特征' };
      }

      if (statusData.data?.status === 'failed') return { error: 'AI识别失败' };
    }

    return { error: '识别超时，请重试' };

  } catch (error) {
    return { error: `图片分析失败: ${error.message}` };
  }
}

// 处理穴位查询 - 返回完整信息
async function handleAcupointQuery(args) {
  const { name } = args;
  if (!name) return { error: '缺少穴位名称' };
  
  const info = getAcupointInfo(name);
  if (!info) {
    const suggestions = searchAcupoints(name);
    if (suggestions.length > 0) {
      return { 
        error: `未找到精确匹配的穴位 "${name}"`,
        suggestions: suggestions.map(s => s.name),
        similarPoints: suggestions
      };
    }
    return { 
      error: `未找到穴位 "${name}"`,
      allPoints: getAllAcupointNames().slice(0, 20)
    };
  }
  return info;
}

// 处理穴位列表
async function handleListAcupoints() {
  const allNames = getAllAcupointNames();
  const acupoints = allNames.map(name => {
    const info = getAcupointInfo(name);
    return info;
  });
  
  return {
    total: getAcupointCount(),
    ruleCount: getRuleCount(),
    acupoints
  };
}

// ==================== MCP主处理器 ====================
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).json({});

  // GET请求返回服务信息
  if (req.method === 'GET') {
    return res.json({
      name: "舌镜辨证能力引擎",
      version: "2.0.0",
      protocol: "MCP",
      endpoint: "https://she-zhen.top/api/mcp",
      description: "基于中医舌诊理论的辨证分析MCP服务 - 与主站数据完全同步",
      capabilities: {
        tools: {
          tongue_analyze: "舌诊辨证分析（基于特征输入）",
          tongue_image_analyze: "舌象图片AI识别与辨证",
          query_acupoint: "穴位信息查询（完整字段：name/meridian/location/effect/indications）",
          list_acupoints: "穴位列表"
        }
      },
      dataSync: {
        acupointCount: getAcupointCount(),
        diagnosisRuleCount: getRuleCount(),
        syndromes: getAllSyndromes(),
        status: "与主站完全同步"
      },
      supportedFeatures: getRulesSummary()
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ jsonrpc: "2.0", error: { code: -32600, message: "Method not allowed" } });
  }

  try {
    const body = req.body || {};
    const { jsonrpc, method, params, id } = body;

    if (jsonrpc !== "2.0") {
      return res.json({ jsonrpc: "2.0", error: { code: -32600, message: "Invalid JSON-RPC version" }, id });
    }

    if (method === 'initialize') {
      return res.json({
        jsonrpc: "2.0",
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {}, resources: { subscribe: false, listChanged: false } },
          serverInfo: { name: "舌镜辨证能力引擎", version: "2.0.0" }
        },
        id
      });
    }

    if (method === 'tools/list') {
      return res.json({ jsonrpc: "2.0", result: { tools: TOOLS }, id });
    }

    if (method === 'tools/call') {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};

      let result;
      if (toolName === 'tongue_analyze') result = await handleTongueAnalyze(toolArgs);
      else if (toolName === 'tongue_image_analyze') result = await handleImageAnalyze(toolArgs);
      else if (toolName === 'query_acupoint') result = await handleAcupointQuery(toolArgs);
      else if (toolName === 'list_acupoints') result = await handleListAcupoints();
      else return res.json({ jsonrpc: "2.0", error: { code: -32601, message: `未知工具: ${toolName}` }, id });

      const content = typeof result === 'string' ? [{ type: "text", text: result }] : [{ type: "text", text: JSON.stringify(result, null, 2) }];
      return res.json({ jsonrpc: "2.0", result: { content, isError: result.error ? true : false }, id });
    }

    return res.json({ jsonrpc: "2.0", error: { code: -32601, message: `未知方法: ${method}` }, id });

  } catch (error) {
    console.error('MCP Error:', error);
    return res.json({ jsonrpc: "2.0", error: { code: -32603, message: `Internal error: ${error.message}` }, id: req.body?.id });
  }
}
