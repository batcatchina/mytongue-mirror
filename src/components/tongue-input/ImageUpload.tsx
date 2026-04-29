import React, { useState, useCallback } from 'react';
import clsx from 'clsx';
import { recognizeTongue, TongueRecognitionResult } from '@/services/tongueAI';

interface ImageUploadProps {
  value?: string;
  onChange: (imageData: string | null) => void;
  onRecognize?: (result: TongueRecognitionResult) => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ value, onChange, onRecognize }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognizeStatus, setRecognizeStatus] = useState<string>('');

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
      console.log(`[图片上传] 成功，大小: ${Math.round(file.size / 1024)}KB`);
    } catch (error) {
      console.error('图片处理失败:', error);
      alert('图片处理失败，请尝试其他图片');
    }
  }, [onChange]);

  const handleRecognize = useCallback(async () => {
    if (!preview) {
      alert('请先上传舌象图片');
      return;
    }

    setIsRecognizing(true);
    setRecognizeStatus('正在识别...');

    try {
      // 提取base64数据
      const base64Data = preview.includes(',') ? preview.split(',')[1] : preview;
      
      const result = await recognizeTongue(base64Data, (status) => {
        setRecognizeStatus(status);
      });

      onRecognize?.(result);
      setRecognizeStatus('识别完成 ✓');
      setTimeout(() => setRecognizeStatus(''), 3000);
    } catch (error) {
      const msg = error instanceof Error ? error.message : '识别失败';
      setRecognizeStatus(`识别失败: ${msg}`);
      setTimeout(() => setRecognizeStatus(''), 5000);
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
                <span className="text-lg">🤖</span>
                AI智能识别舌象
              </>
            )}
          </button>

          {/* 识别状态 */}
          {recognizeStatus && !isRecognizing && (
            <div className={clsx(
              'px-3 py-2 rounded-lg text-sm text-center',
              recognizeStatus.includes('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            )}>
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
