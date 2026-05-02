import React, { useState, useCallback, useRef, useEffect } from 'react';
import clsx from 'clsx';

// AI识别结果类型
export interface AIRecognitionResult {
  tongue_color: { value: string; confidence: number };
  tongue_shape: { 
    value: string; 
    teeth_mark?: { has: boolean; degree?: string; position?: string };
    crack?: { has: boolean; degree?: string; position?: string };
  };
  tongue_coating: { 
    color: string; 
    texture: string; 
    moisture: string;
    confidence: number 
  };
  tongue_state: { value: string };
  region_features?: {
    tip?: { color?: string; features?: string[]; depression?: boolean; bulge?: boolean };
    sides?: { color?: string; features?: string[]; depression?: boolean; bulge?: boolean };
    middle?: { color?: string; features?: string[]; depression?: boolean; bulge?: boolean };
    root?: { color?: string; features?: string[]; depression?: boolean; bulge?: boolean };
  };
  shape_distribution?: { depression: string[]; bulge: string[] };
  overall_confidence: number;
  notes?: string;
}

interface ImageUploadProps {
  value?: string;
  onChange: (imageData: string | null) => void;
  onCompressionProgress?: (status: string) => void;
  onAIRecognition?: (result: AIRecognitionResult) => void; // 新增：AI识别回调
  aiApiUrl?: string; // 新增：AI识别API地址，支持热切换
}

// 图片压缩配置
const COMPRESSION_CONFIG = {
  maxWidth: 1024,      // 最大宽度
  maxHeight: 1024,     // 最大高度
  maxSizeKB: 200,      // 目标最大大小（KB）
  minQuality: 0.5,    // 最低质量
  initialQuality: 0.85 // 初始压缩质量
};

// 使用canvas压缩图片
async function compressImage(file: File, onProgress?: (status: string) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        onProgress?.('正在压缩图片...');
        
        // 计算压缩后的尺寸
        let { width, height } = img;
        const { maxWidth, maxHeight } = COMPRESSION_CONFIG;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        
        // 创建canvas并压缩
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('无法创建画布上下文'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // 逐步降低质量直到文件大小符合要求
        let quality = COMPRESSION_CONFIG.initialQuality;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        let currentSize = (dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75; // 估算实际字节数
        
        onProgress?.('优化图片大小...');
        
        // 最多尝试10次压缩
        let attempts = 0;
        while (currentSize > COMPRESSION_CONFIG.maxSizeKB * 1024 && quality > COMPRESSION_CONFIG.minQuality && attempts < 10) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
          currentSize = (dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75;
          attempts++;
          onProgress?.(`压缩中 (${Math.round(100 - (quality - COMPRESSION_CONFIG.minQuality) / (COMPRESSION_CONFIG.initialQuality - COMPRESSION_CONFIG.minQuality) * 100)}%)...`);
        }
        
        // 如果仍然太大，进行更激进的尺寸压缩
        if (currentSize > COMPRESSION_CONFIG.maxSizeKB * 1024) {
          let scale = 0.8;
          while (currentSize > COMPRESSION_CONFIG.maxSizeKB * 1024 && scale >= 0.3) {
            const scaledWidth = Math.round(width * scale);
            const scaledHeight = Math.round(height * scale);
            canvas.width = scaledWidth;
            canvas.height = scaledHeight;
            ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
            dataUrl = canvas.toDataURL('image/jpeg', COMPRESSION_CONFIG.minQuality);
            currentSize = (dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75;
            scale -= 0.1;
            onProgress?.(`调整尺寸中...`);
          }
        }
        
        const finalSize = Math.round(currentSize / 1024);
        onProgress?.(`压缩完成 (${finalSize}KB)`);
        
        resolve(dataUrl);
      };
      
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ 
  value, 
  onChange, 
  onAIRecognition,
  aiApiUrl = 'https://she-zhen-app.vercel.app/api/tongue'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognitionStatus, setRecognitionStatus] = useState<string | null>(null);
  const [progressInfo, setProgressInfo] = useState<{ status: string; percent: number } | null>(null);
  const [aiResult, setAiResult] = useState<AIRecognitionResult | null>(null);
  
  // 进度反馈定时器
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionStartTimeRef = useRef<number>(0);
  
  // 清理进度定时器
  useEffect(() => {
    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
    };
  }, []);
  
  // 获取进度文案 - 前置舌象检测步骤
  const getProgressMessage = (elapsedSeconds: number): string => {
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
  };

  // 获取进度百分比 (非线性)
  // 0-8秒: 0%->30%, 8-16秒: 30%->60%, 16-24秒: 60%->80%, 24秒+: 80%->90%
  const getProgressPercent = (elapsedSeconds: number): number => {
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
  };

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      alert('图片大小不能超过10MB');
      return;
    }

    try {
      // 直接读取原图，不压缩
      const imageData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsDataURL(file);
      });
      
      setPreview(imageData);
      onChange(imageData);
      setAiResult(null); // 清除之前的识别结果
    } catch (error) {
      console.error('图片处理失败:', error);
      alert('图片处理失败，请尝试其他图片');
    }
  }, [onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleRemove = useCallback(() => {
    setPreview(null);
    onChange(null);
    setAiResult(null);
    setRecognitionStatus(null);
    setProgressInfo(null);
  }, [onChange]);

  // AI识别功能
  const handleAIRecognition = useCallback(async () => {
    if (!preview) return;
    
    setIsRecognizing(true);
    setRecognitionStatus('正在识别...');
    setProgressInfo({ status: '正在识别...', percent: 0 });
    recognitionStartTimeRef.current = Date.now();
    
    // 启动进度文案定时器（每2秒更新一次）
    progressTimerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - recognitionStartTimeRef.current) / 1000);
      const message = getProgressMessage(elapsed);
      const percent = getProgressPercent(elapsed);
      setRecognitionStatus(message);
      setProgressInfo({ status: message, percent });
    }, 2000);
    
    try {
      const response = await fetch(aiApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: preview })
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setAiResult(result.data);
        const statusMsg = `识别完成 (置信度: ${Math.round(result.data.overall_confidence * 100)}%)`;
        setRecognitionStatus(statusMsg);
        setProgressInfo({ status: '识别完成', percent: 100 });
        onAIRecognition?.(result.data);
      } else if (result.tongueNotDetected) {
        // 安全验证：未检测到舌头
        setRecognitionStatus('⚠️ ' + (result.error || '未检测到舌象，请上传清晰的舌头照片'));
        setAiResult(null);
        setProgressInfo(null);
      } else {
        setRecognitionStatus('识别失败: ' + (result.error || '未知错误'));
        setProgressInfo(null);
      }
    } catch (e: any) {
      setRecognitionStatus('网络错误: ' + e.message);
      setProgressInfo(null);
    } finally {
      // 清理进度定时器
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      setIsRecognizing(false);
    }
  }, [preview, aiApiUrl, onAIRecognition]);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-stone-700">
        📷 舌象图片上传
      </label>
      
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-secondary-50">
          <img 
            src={preview} 
            alt="舌象预览" 
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <label className="cursor-pointer px-4 py-2 bg-white rounded-lg text-sm font-medium text-stone-700 hover:bg-stone-100 transition-colors">
              重新上传
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleInputChange}
                className="hidden"
              />
            </label>
            <button
              onClick={handleRemove}
              className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
            >
              删除
            </button>
          </div>
          <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
            ✓ 已上传
          </div>
          {/* AI识别按钮 */}
          <div className="absolute bottom-14 left-1/2 transform -translate-x-1/2">
            <button
              onClick={handleAIRecognition}
              disabled={isRecognizing}
              className={clsx(
                'px-4 py-2 rounded-full text-sm font-medium shadow-lg transition-all',
                isRecognizing 
                  ? 'bg-stone-400 text-white cursor-wait'
                  : aiResult 
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
              )}
            >
              {isRecognizing ? '🔄 识别中...' : aiResult ? '✓ 已识别' : '✨ AI识别'}
            </button>
          </div>
          {/* 提示用户确认 */}
          <div className="p-2 bg-amber-50 border-t border-amber-200 text-xs text-amber-700 text-center">
            ⚠️ 请确保上传的是清晰的舌象照片，AI识别后请确认舌象特征
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={clsx(
            'border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer',
            isDragging
              ? 'border-primary-400 bg-primary-50'
              : 'border-stone-300 bg-stone-50 hover:border-primary-300 hover:bg-primary-50'
          )}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
            id="tongue-image-upload"
          />
          <label htmlFor="tongue-image-upload" className="cursor-pointer">
            <div className="text-4xl mb-3">📷</div>
            <p className="text-stone-600 font-medium">点击或拖拽上传舌象图片（可选）</p>
            <p className="text-stone-400 text-sm mt-1">支持 JPG、PNG 格式，最大 10MB</p>
            <p className="text-primary-600 text-xs mt-2 bg-primary-50 px-2 py-1 rounded inline-block">
              💡 有图可自动识别舌象特征，无图也能手动输入辨证
            </p>
          </label>
        </div>
      )}

      {/* AI识别状态显示 */}
      {recognitionStatus && (
        <div className={clsx(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
          aiResult ? 'bg-green-50 text-green-700' : 'bg-purple-50 text-purple-700'
        )}>
          {isRecognizing && <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>}
          <span>{recognitionStatus}</span>
        </div>
      )}

      {/* 识别进度条 */}
      {isRecognizing && progressInfo && (
        <div className="space-y-2 px-1">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>{progressInfo.status}</span>
            <span className="font-medium text-purple-600">{progressInfo.percent}%</span>
          </div>
          <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
            <div 
              className={clsx(
                'h-full rounded-full transition-all duration-500 ease-out',
                progressInfo.percent >= 100 
                  ? 'bg-green-500' 
                  : 'bg-gradient-to-r from-purple-400 to-pink-500'
              )}
              style={{ width: `${progressInfo.percent}%` }}
            />
          </div>
        </div>
      )}
      
      {/* AI识别结果预览 */}
      {aiResult && (
        <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
          <div className="text-xs text-purple-700 font-medium mb-2">🤖 AI识别结果（可微调）</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-stone-500">舌色:</span>
              <span className="font-medium text-purple-700">{aiResult.tongue_color?.value || '-'}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-stone-500">舌形:</span>
              <span className="font-medium text-purple-700">{aiResult.tongue_shape?.value || '-'}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-stone-500">舌苔:</span>
              <span className="font-medium text-purple-700">{aiResult.tongue_coating?.color || '-'}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-stone-500">舌态:</span>
              <span className="font-medium text-purple-700">{aiResult.tongue_state?.value || '-'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
