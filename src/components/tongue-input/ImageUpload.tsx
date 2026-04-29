import React, { useState, useCallback } from 'react';
import clsx from 'clsx';
import { recognizeTongue, TongueRecognitionResult } from '@/services/tongueAI';

interface ImageUploadProps {
  value?: string;
  onChange: (imageData: string | null) => void;
  onRecognize?: (result: TongueRecognitionResult) => void;
}

// 压缩图片：最大宽度800px，质量0.7
function compressImage(dataUrl: string, maxWidth = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width;
      let h = img.height;
      if (w > maxWidth) {
        h = Math.round(h * maxWidth / w);
        w = maxWidth;
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = dataUrl;
  });
}

// 生成识别结果摘要
function buildSummary(result: TongueRecognitionResult): string {
  const parts: string[] = [];
  if (result.tongue_color?.value) parts.push(`舌色:${result.tongue_color.value}`);
  if (result.tongue_shape?.value && result.tongue_shape.value !== '正常') parts.push(`舌形:${result.tongue_shape.value}`);
  if (result.tongue_coating?.color) parts.push(`苔色:${result.tongue_coating.color}`);
  if (result.tongue_coating?.texture && result.tongue_coating.texture !== '正常') parts.push(`苔质:${result.tongue_coating.texture}`);
  if (result.tongue_coating?.moisture && result.tongue_coating.moisture !== '正常') parts.push(`${result.tongue_coating.moisture}`);
  if (result.tongue_shape?.teeth_mark?.has) parts.push('齿痕');
  if (result.tongue_shape?.crack?.has) parts.push('裂纹');
  if (result.tongue_state?.value && result.tongue_state.value !== '正常') parts.push(`舌态:${result.tongue_state.value}`);
  if (result.overall_confidence) parts.push(`置信度:${Math.round(result.overall_confidence * 100)}%`);
  return parts.join(' · ');
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ value, onChange, onRecognize }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognizeStatus, setRecognizeStatus] = useState<string>('');
  const [recognizeResult, setRecognizeResult] = useState<TongueRecognitionResult | null>(null);

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
      const imageData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsDataURL(file);
      });
      
      setPreview(imageData);
      onChange(imageData);
      setRecognizeResult(null);
      console.log(`[图片上传] 成功，大小: ${Math.round(file.size / 1024)}KB`);
    } catch (error) {
      console.error('图片处理失败:', error);
      // 不弹alert，静默处理——手机上FileReader偶发瞬态错误但图片已加载
    }
  }, [onChange]);

  const handleRecognize = useCallback(async () => {
    if (!preview) {
      alert('请先上传舌象图片');
      return;
    }

    setIsRecognizing(true);
    setRecognizeResult(null);
    setRecognizeStatus('正在压缩图片...');

    try {
      const compressed = await compressImage(preview, 800, 0.7);
      console.log(`[AI识别] 压缩后大小: ${Math.round(compressed.length / 1024)}KB`);
      
      setRecognizeStatus('正在上传识别...');
      const result = await recognizeTongue(compressed, (status) => {
        setRecognizeStatus(status);
      });

      onRecognize?.(result);
      setRecognizeResult(result);
      setRecognizeStatus('识别完成 ✓');
    } catch (error) {
      const msg = error instanceof Error ? error.message : '识别失败';
      setRecognizeStatus(`识别失败: ${msg}`);
    } finally {
      setIsRecognizing(false);
    }
  }, [preview, onRecognize]);

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
    setRecognizeStatus('');
    setRecognizeResult(null);
  }, [onChange]);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-stone-700">
        📷 舌象图片上传
      </label>
      
      {preview ? (
        <div className="space-y-3">
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
                className="px-4 py-2 bg-red-500 rounded-lg text-sm font-medium text-white hover:bg-red-600 transition-colors"
              >
                删除
              </button>
            </div>
          </div>

          {/* AI识别按钮 */}
          <button
            onClick={handleRecognize}
            disabled={isRecognizing}
            className={clsx(
              'w-full py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2',
              isRecognizing
                ? 'bg-primary-100 text-primary-400 cursor-wait'
                : 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:from-primary-600 hover:to-secondary-600 shadow-md hover:shadow-lg'
            )}
          >
            {isRecognizing ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {recognizeStatus || '识别中...'}
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
                AI智能识别舌象
              </>
            )}
          </button>

          {/* 识别结果摘要字条 */}
          {recognizeResult && (
            <div className="px-3 py-2.5 rounded-lg bg-gradient-to-r from-primary-50 to-secondary-50 border border-primary-200 text-xs text-stone-600 leading-relaxed">
              <div className="flex items-center gap-1.5 mb-1">
                <svg className="w-3.5 h-3.5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium text-primary-700">AI识别结果</span>
              </div>
              <p>{buildSummary(recognizeResult)}</p>
            </div>
          )}

          {/* 识别状态（失败时显示） */}
          {recognizeStatus && !isRecognizing && !recognizeStatus.includes('✓') && (
            <div className="px-3 py-2 rounded-lg text-sm text-center bg-red-50 text-red-700">
              {recognizeStatus}
            </div>
          )}
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={clsx(
            'border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
            isDragging
              ? 'border-primary-500 bg-primary-50'
              : 'border-stone-300 hover:border-primary-400 hover:bg-stone-50'
          )}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload" className="cursor-pointer">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-stone-700 font-medium">点击或拖拽上传舌象图片</p>
                <p className="text-stone-500 text-sm mt-1">支持 JPG、PNG，最大 10MB</p>
              </div>
            </div>
          </label>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
