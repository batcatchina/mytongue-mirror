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

export async function recognizeTongue(
  imageData: string,
  onProgress?: (status: string) => void
): Promise<TongueRecognitionResult> {
  onProgress?.('正在上传图片...');

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
  onProgress?.('正在识别舌象...');

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
        onProgress?.('识别完成');
        return pollData.data;
      }
      if (pollData.error) {
        throw new Error(pollData.error);
      }
      throw new Error('识别结果为空');
    }

    // 进度文案：先检测舌象，再逐步分析
    const progressMessages = [
      '正在检测舌象...',
      '正在识别舌色...',
      '正在分析舌形...',
      '正在判断苔色...',
      '正在综合辨证...',
    ];
    const messageIndex = Math.min(Math.floor(i / 4), progressMessages.length - 1);
    onProgress?.(progressMessages[messageIndex]);
  }

  throw new Error('识别超时，请重试');
}
