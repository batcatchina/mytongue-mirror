/**
 * 舌镜本地存储模块
 * 
 * 功能：
 * - 舌诊图片本地缓存
 * - 用户舌诊历史记录
 * - 离线数据同步
 * - 存储空间管理
 */

// ============================================================
// 类型定义
// ============================================================

export interface TongueImage {
  id: string;
  uri: string;                    // 本地文件URI
  thumbnailUri?: string;         // 缩略图URI
  capturedAt: string;            // 拍摄时间 ISO8601
  metadata: TongueImageMetadata;
  synced: boolean;               // 是否已同步到服务器
  serverId?: string;            // 服务器记录ID
}

export interface TongueImageMetadata {
  width: number;
  height: number;
  format: 'jpeg' | 'png' | 'webp';
  size: number;                  // 文件大小 bytes
  deviceId?: string;
  userId?: string;
}

export interface TongueDiagnosis {
  id: string;
  imageId: string;              // 关联图片ID
  createdAt: string;            // 诊断时间
  result: DiagnosisResult;
  providerAgentId: string;      // 服务提供者 Agent ID
  tokensSpent: string;          // 消耗积分
  synced: boolean;
  serverId?: string;
}

export interface DiagnosisResult {
  tongueColor?: string;         // 舌色
  tongueCoating?: string;       // 舌苔
  tongueShape?: string;         // 舌形
  diagnosisType?: string;       // 证型
  diagnosisDescription?: string;
  suggestions?: string[];
  confidence?: number;         // 置信度 0-1
}

export interface SyncQueueItem {
  id: string;
  type: 'image' | 'diagnosis';
  action: 'create' | 'update' | 'delete';
  data: any;
  createdAt: string;
  retryCount: number;
  lastError?: string;
}

export interface StorageStats {
  totalSize: number;           // 总占用空间 bytes
  imageCount: number;
  diagnosisCount: number;
  syncQueueLength: number;
  lastSyncAt?: string;
}

export interface StorageConfig {
  maxCacheSize: number;         // 最大缓存大小 bytes (默认 500MB)
  maxImageAge: number;           // 图片最大保存天数 (默认 90天)
  autoSync: boolean;            // 自动同步开关
  syncInterval: number;         // 同步间隔 ms (默认 5分钟)
}

// ============================================================
// 常量定义
// ============================================================

const STORAGE_KEYS = {
  TONGUE_IMAGES: 'tongue_images',
  DIAGNOSES: 'tongue_diagnoses',
  SYNC_QUEUE: 'sync_queue',
  USER_PREFERENCES: 'user_preferences',
  LAST_SYNC: 'last_sync',
} as const;

const DEFAULT_CONFIG: StorageConfig = {
  maxCacheSize: 500 * 1024 * 1024, // 500MB
  maxImageAge: 90,                  // 90天
  autoSync: true,
  syncInterval: 5 * 60 * 1000,      // 5分钟
};

// ============================================================
// 核心存储类
// ============================================================

class TongueStorage {
  private config: StorageConfig;
  private memoryCache: Map<string, TongueImage[]> = new Map();
  private syncTimer?: NodeJS.Timeout;

  constructor(config: Partial<StorageConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ==================== 图片管理 ====================

  /**
   * 保存舌诊图片
   */
  async saveImage(image: TongueImage): Promise<void> {
    const images = await this.getAllImages();
    
    // 检查是否已存在
    const existingIndex = images.findIndex(img => img.id === image.id);
    if (existingIndex >= 0) {
      images[existingIndex] = { ...images[existingIndex], ...image };
    } else {
      images.unshift(image); // 新图片放在最前面
    }

    await this.saveToStorage(STORAGE_KEYS.TONGUE_IMAGES, images);
    await this.updateMemoryCache(STORAGE_KEYS.TONGUE_IMAGES, images);
  }

  /**
   * 批量保存图片
   */
  async saveImages(newImages: TongueImage[]): Promise<void> {
    const images = await this.getAllImages();
    
    for (const image of newImages) {
      const existingIndex = images.findIndex(img => img.id === image.id);
      if (existingIndex >= 0) {
        images[existingIndex] = { ...images[existingIndex], ...image };
      } else {
        images.unshift(image);
      }
    }

    await this.saveToStorage(STORAGE_KEYS.TONGUE_IMAGES, images);
    await this.updateMemoryCache(STORAGE_KEYS.TONGUE_IMAGES, images);
  }

  /**
   * 获取所有本地图片
   */
  async getAllImages(): Promise<TongueImage[]> {
    if (this.memoryCache.has(STORAGE_KEYS.TONGUE_IMAGES)) {
      return this.memoryCache.get(STORAGE_KEYS.TONGUE_IMAGES)!;
    }
    
    const stored = await this.getFromStorage<TongueImage[]>(STORAGE_KEYS.TONGUE_IMAGES);
    const images = stored || [];
    await this.updateMemoryCache(STORAGE_KEYS.TONGUE_IMAGES, images);
    return images;
  }

  /**
   * 根据ID获取图片
   */
  async getImage(id: string): Promise<TongueImage | undefined> {
    const images = await this.getAllImages();
    return images.find(img => img.id === id);
  }

  /**
   * 删除图片
   */
  async deleteImage(id: string): Promise<void> {
    const images = await this.getAllImages();
    const filtered = images.filter(img => img.id !== id);
    await this.saveToStorage(STORAGE_KEYS.TONGUE_IMAGES, filtered);
    await this.updateMemoryCache(STORAGE_KEYS.TONGUE_IMAGES, filtered);
  }

  /**
   * 获取未同步的图片
   */
  async getUnsyncedImages(): Promise<TongueImage[]> {
    const images = await this.getAllImages();
    return images.filter(img => !img.synced);
  }

  /**
   * 标记图片已同步
   */
  async markImageSynced(id: string, serverId: string): Promise<void> {
    const images = await this.getAllImages();
    const image = images.find(img => img.id === id);
    if (image) {
      image.synced = true;
      image.serverId = serverId;
      await this.saveToStorage(STORAGE_KEYS.TONGUE_IMAGES, images);
      await this.updateMemoryCache(STORAGE_KEYS.TONGUE_IMAGES, images);
    }
  }

  // ==================== 诊断记录管理 ====================

  /**
   * 保存诊断记录
   */
  async saveDiagnosis(diagnosis: TongueDiagnosis): Promise<void> {
    const diagnoses = await this.getAllDiagnoses();
    
    const existingIndex = diagnoses.findIndex(d => d.id === diagnosis.id);
    if (existingIndex >= 0) {
      diagnoses[existingIndex] = { ...diagnoses[existingIndex], ...diagnosis };
    } else {
      diagnoses.unshift(diagnosis);
    }

    await this.saveToStorage(STORAGE_KEYS.DIAGNOSES, diagnoses);
    await this.updateMemoryCache(STORAGE_KEYS.DIAGNOSES, diagnoses);
  }

  /**
   * 获取所有诊断记录
   */
  async getAllDiagnoses(): Promise<TongueDiagnosis[]> {
    if (this.memoryCache.has(STORAGE_KEYS.DIAGNOSES)) {
      return this.memoryCache.get(STORAGE_KEYS.DIAGNOSES)!;
    }
    
    const stored = await this.getFromStorage<TongueDiagnosis[]>(STORAGE_KEYS.DIAGNOSES);
    const diagnoses = stored || [];
    await this.updateMemoryCache(STORAGE_KEYS.DIAGNOSES, diagnoses);
    return diagnoses;
  }

  /**
   * 获取图片关联的诊断记录
   */
  async getDiagnosesByImageId(imageId: string): Promise<TongueDiagnosis[]> {
    const diagnoses = await this.getAllDiagnoses();
    return diagnoses.filter(d => d.imageId === imageId);
  }

  /**
   * 获取最新诊断记录
   */
  async getLatestDiagnoses(limit: number = 10): Promise<TongueDiagnosis[]> {
    const diagnoses = await this.getAllDiagnoses();
    return diagnoses.slice(0, limit);
  }

  /**
   * 删除诊断记录
   */
  async deleteDiagnosis(id: string): Promise<void> {
    const diagnoses = await this.getAllDiagnoses();
    const filtered = diagnoses.filter(d => d.id !== id);
    await this.saveToStorage(STORAGE_KEYS.DIAGNOSES, filtered);
    await this.updateMemoryCache(STORAGE_KEYS.DIAGNOSES, filtered);
  }

  // ==================== 同步队列管理 ====================

  /**
   * 添加到同步队列
   */
  async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'retryCount'>): Promise<void> {
    const queue = await this.getSyncQueue();
    const queueItem: SyncQueueItem = {
      ...item,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };
    queue.push(queueItem);
    await this.saveToStorage(STORAGE_KEYS.SYNC_QUEUE, queue);
  }

  /**
   * 获取同步队列
   */
  async getSyncQueue(): Promise<SyncQueueItem[]> {
    const stored = await this.getFromStorage<SyncQueueItem[]>(STORAGE_KEYS.SYNC_QUEUE);
    return stored || [];
  }

  /**
   * 从同步队列移除
   */
  async removeFromSyncQueue(id: string): Promise<void> {
    const queue = await this.getSyncQueue();
    const filtered = queue.filter(item => item.id !== id);
    await this.saveToStorage(STORAGE_KEYS.SYNC_QUEUE, filtered);
  }

  /**
   * 更新同步队列项（增加重试次数）
   */
  async updateSyncQueueItem(id: string, error: string): Promise<void> {
    const queue = await this.getSyncQueue();
    const item = queue.find(i => i.id === id);
    if (item) {
      item.retryCount++;
      item.lastError = error;
      await this.saveToStorage(STORAGE_KEYS.SYNC_QUEUE, queue);
    }
  }

  // ==================== 存储统计 ====================

  /**
   * 获取存储统计信息
   */
  async getStorageStats(): Promise<StorageStats> {
    const images = await this.getAllImages();
    const diagnoses = await this.getAllDiagnoses();
    const syncQueue = await this.getSyncQueue();

    // 计算总大小（估算）
    let totalSize = 0;
    for (const img of images) {
      if (img.metadata.size) {
        totalSize += img.metadata.size;
      }
    }

    // 获取最后同步时间
    const lastSyncStr = await this.getFromStorage<string>(STORAGE_KEYS.LAST_SYNC);
    
    return {
      totalSize,
      imageCount: images.length,
      diagnosisCount: diagnoses.length,
      syncQueueLength: syncQueue.length,
      lastSyncAt: lastSyncStr || undefined,
    };
  }

  /**
   * 清理过期数据
   */
  async cleanupExpiredData(): Promise<{ imagesRemoved: number; sizeFreed: number }> {
    const maxAge = this.config.maxImageAge * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - maxAge;
    
    const images = await this.getAllImages();
    const toRemove: TongueImage[] = [];
    let sizeFreed = 0;

    for (const img of images) {
      const capturedTime = new Date(img.capturedAt).getTime();
      if (capturedTime < cutoff && img.synced) { // 只清理已同步的图片
        toRemove.push(img);
        sizeFreed += img.metadata.size || 0;
      }
    }

    if (toRemove.length > 0) {
      const filtered = images.filter(img => !toRemove.some(r => r.id === img.id));
      await this.saveToStorage(STORAGE_KEYS.TONGUE_IMAGES, filtered);
      await this.updateMemoryCache(STORAGE_KEYS.TONGUE_IMAGES, filtered);
    }

    return { imagesRemoved: toRemove.length, sizeFreed };
  }

  /**
   * 检查存储空间是否足够
   */
  async checkStorageSpace(requiredBytes: number): Promise<boolean> {
    const stats = await this.getStorageStats();
    return (stats.totalSize + requiredBytes) <= this.config.maxCacheSize;
  }

  // ==================== 同步管理 ====================

  /**
   * 启动自动同步
   */
  startAutoSync(syncFn: () => Promise<void>): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    
    if (this.config.autoSync) {
      this.syncTimer = setInterval(async () => {
        try {
          await syncFn();
          await this.saveToStorage(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
        } catch (error) {
          console.error('Auto sync failed:', error);
        }
      }, this.config.syncInterval);
    }
  }

  /**
   * 停止自动同步
   */
  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
    }
  }

  /**
   * 手动触发同步
   */
  async triggerSync(syncFn: () => Promise<void>): Promise<void> {
    await syncFn();
    await this.saveToStorage(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  }

  // ==================== 配置管理 ====================

  /**
   * 更新配置
   */
  async updateConfig(newConfig: Partial<StorageConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    await this.saveToStorage(STORAGE_KEYS.USER_PREFERENCES, this.config);
  }

  /**
   * 获取当前配置
   */
  async getConfig(): Promise<StorageConfig> {
    const stored = await this.getFromStorage<StorageConfig>(STORAGE_KEYS.USER_PREFERENCES);
    return stored ? { ...DEFAULT_CONFIG, ...stored } : { ...this.config };
  }

  // ==================== 工具方法 ====================

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `tm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 保存到本地存储
   */
  private async saveToStorage<T>(key: string, data: T): Promise<void> {
    try {
      const json = JSON.stringify(data);
      localStorage.setItem(key, json);
    } catch (error) {
      console.error(`Failed to save ${key}:`, error);
      throw error;
    }
  }

  /**
   * 从本地存储读取
   */
  private async getFromStorage<T>(key: string): Promise<T | null> {
    try {
      const json = localStorage.getItem(key);
      return json ? JSON.parse(json) : null;
    } catch (error) {
      console.error(`Failed to load ${key}:`, error);
      return null;
    }
  }

  /**
   * 更新内存缓存
   */
  private updateMemoryCache(key: string, data: any[]): void {
    this.memoryCache.set(key, data);
  }

  /**
   * 清除所有数据（谨慎使用）
   */
  async clearAll(): Promise<void> {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    this.memoryCache.clear();
  }
}

// ============================================================
// 导出单例实例和工具函数
// ============================================================

// 默认存储实例
export const tongueStorage = new TongueStorage();

// 辅助函数

/**
 * 创建舌诊图片对象
 */
export function createTongueImage(
  uri: string,
  metadata: TongueImageMetadata,
  additionalData: Partial<TongueImage> = {}
): TongueImage {
  return {
    id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    uri,
    capturedAt: new Date().toISOString(),
    metadata,
    synced: false,
    ...additionalData,
  };
}

/**
 * 创建诊断记录对象
 */
export function createTongueDiagnosis(
  imageId: string,
  result: DiagnosisResult,
  providerAgentId: string,
  tokensSpent: string
): TongueDiagnosis {
  return {
    id: `diag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    imageId,
    createdAt: new Date().toISOString(),
    result,
    providerAgentId,
    tokensSpent,
    synced: false,
  };
}

/**
 * 格式化存储大小
 */
export function formatStorageSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${units[i]}`;
}

/**
 * 检查是否支持本地存储
 */
export function isStorageSupported(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

// 导出类以便测试时可以创建多个实例
export { TongueStorage };
