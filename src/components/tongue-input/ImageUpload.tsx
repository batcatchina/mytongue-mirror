import React, { useState, useCallback } from 'react';
import clsx from 'clsx';

interface ImageUploadProps {
  value?: string;
  onChange: (imageData: string | null) => void;
  onCompressionProgress?: (status: string) => void;
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

export const ImageUpload: React.FC<ImageUploadProps> = ({ value, onChange, onCompressionProgress }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionStatus, setCompressionStatus] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      alert('图片大小不能超过10MB');
      return;
    }

    const fileSizeKB = Math.round(file.size / 1024);
    
    // 检查是否需要压缩（超过200KB或尺寸过大）
    const needsCompression = fileSizeKB > COMPRESSION_CONFIG.maxSizeKB || 
      (file.type === 'image/png' && fileSizeKB > COMPRESSION_CONFIG.maxSizeKB * 0.5);
    
    try {
      let imageData: string;
      
      if (needsCompression) {
        setIsCompressing(true);
        setCompressionStatus('正在处理图片...');
        
        imageData = await compressImage(file, (status) => {
          setCompressionStatus(status);
          onCompressionProgress?.(status);
        });
        
        const finalSizeKB = Math.round((imageData.length - imageData.indexOf(',') - 1) * 0.75 / 1024);
        console.log(`[图片压缩] 原始: ${fileSizeKB}KB -> 压缩后: ${finalSizeKB}KB`);
      } else {
        // 小文件直接读取
        imageData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = () => reject(new Error('文件读取失败'));
          reader.readAsDataURL(file);
        });
      }
      
      setPreview(imageData);
      onChange(imageData);
    } catch (error) {
      console.error('图片处理失败:', error);
      alert('图片处理失败，请尝试其他图片');
    } finally {
      setIsCompressing(false);
      setCompressionStatus(null);
    }
  }, [onChange, onCompressionProgress]);

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
  }, [onChange]);

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
          {/* 提示用户确认 */}
          <div className="p-2 bg-amber-50 border-t border-amber-200 text-xs text-amber-700 text-center">
            ⚠️ 请确保上传的是清晰的舌象照片，并手动确认舌象特征
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

      {/* 压缩状态显示 */}
      {isCompressing && compressionStatus && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg text-sm text-blue-700">
          <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <span>{compressionStatus}</span>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;

// 导出压缩配置供其他模块使用
export { compressImage, COMPRESSION_CONFIG };
