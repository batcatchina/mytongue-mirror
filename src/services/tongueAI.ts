// 舌头未检测到错误（安全验证）
export class TongueNotDetectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TongueNotDetectedError';
  }
}

export interface TongueRecognitionResult {
  tongue_color: { value: string; confidence: number };
  tongue_shape: {
    value: string;
    teeth_mark: { has: boolean; degree: string; position: string };
    crack: { has: boolean; degree: string; position: string };
  };
  tongue_coating: { color: string; texture: string; moisture: string; confidence: number };
  tongue_state: { value: string };
  region_features: {
    tip: { color: string; features: string[]; depression: boolean; bulge: boolean };
    sides: { color: string; features: string[]; depression: boolean; bulge: boolean };
    middle: { color: string; features: string[]; depression: boolean; bulge: boolean };
    root: { color: string; features: string[]; depression: boolean; bulge: boolean };
  };
  shape_distribution: {
    depression: Array<{ region: string; degree: string }>;
    bulge: Array<{ region: string; degree: string }>;
  };
  overall_confidence: number;
  notes: string;
  error?: boolean;
  message?: string;
}

const POLL_INTERVAL = 1000;
const MAX_POLL = 20;

// 获取进度文案 - 前置舌象检测步骤
function getProgressMessage(elapsedSeconds: number): string {
  if (elapsedSeconds < 6) {
    return '正在上传图片...';
  } else if (elapsedSeconds < 12) {
    return '正在检测舌象...';
  } else if (elapsedSeconds < 18) {
    return '正在识别舌色...';
  } else if (elapsedSeconds < 24) {
    return '正在分析舌形...';
  } else if (elapsedSeconds < 30) {
    return '正在判断苔色...';
  } else {
    return '正在综合辨证...';
  }
}

// 获取进度百分比 (非线性)
// 0-8秒: 0%->30%, 8-16秒: 30%->60%, 16-24秒: 60%->80%, 24秒+: 80%->90%
export function getProgressPercent(elapsedSeconds: number): number {
  if (elapsedSeconds < 0) return 0;
  if (elapsedSeconds < 8) {
    // 快速阶段: 0 -> 30
    return Math.round((elapsedSeconds / 8) * 30);
  } else if (elapsedSeconds < 16) {
    // 中速阶段: 30 -> 60
    return 30 + Math.round(((elapsedSeconds - 8) / 8) * 30);
  } else if (elapsedSeconds < 24) {
    // 减速阶段: 60 -> 80
    return 60 + Math.round(((elapsedSeconds - 16) / 8) * 20);
  } else {
    // 缓慢阶段: 80 -> 90
    const extraSeconds = elapsedSeconds - 24;
    const progress = Math.min(extraSeconds * 2, 10); // 每秒2%，最高到90
    return 80 + Math.round(progress);
  }
}

// 进度信息类型
export interface ProgressInfo {
  status: string;
  percent: number;
  isComplete?: boolean;
}

export async function recognizeTongue(
  imageData: string,
  onProgress?: (info: ProgressInfo) => void
): Promise<TongueRecognitionResult> {
  const startTime = Date.now();
  onProgress?.({ status: '正在上传图片...', percent: 0 });

  // Step 1: 上传图片 + 创建对话
  const createRes = await fetch('/api/tongue-ai/tongue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageData })
  });

  const createData = await createRes.json();
  if (!createData.success) {
    throw new Error(createData.error || '创建识别任务失败');
  }

  const { chat_id, conversation_id } = createData;
  
  // 获取初始进度文案
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  onProgress?.({ status: getProgressMessage(elapsed), percent: getProgressPercent(elapsed) });

  // Step 2: 轮询结果
  for (let i = 0; i < MAX_POLL; i++) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL));

    const pollRes = await fetch(
      `/api/tongue-ai/result?chat_id=${chat_id}&conversation_id=${conversation_id}`
    );
    const pollData = await pollRes.json();

    if (!pollData.success && pollData.code === 4100) {
      throw new Error('Token权限不足，需要添加chat:retrieve和message:list权限');
    }
    if (!pollData.success) {
      throw new Error(pollData.error || '查询结果失败');
    }

    if (pollData.status === 'completed') {
      // 安全验证：未检测到舌头
      if (pollData.tongueNotDetected) {
        throw new TongueNotDetectedError(pollData.error || '未检测到舌象，请上传清晰的舌头照片');
      }
      if (pollData.data) {
        onProgress?.({ status: '识别完成', percent: 100, isComplete: true });
        return pollData.data;
      }
      if (pollData.error) {
        throw new Error(pollData.error);
      }
      throw new Error('识别结果为空');
    }

    // 更新进度文案
    const currentElapsed = Math.floor((Date.now() - startTime) / 1000);
    onProgress?.({ status: getProgressMessage(currentElapsed), percent: getProgressPercent(currentElapsed) });
  }

  throw new Error('识别超时，请重试');
}
