/**
 * 正和系统 - 舌镜本地存储模块
 *
 * 功能：
 * 1. 舌诊图片本地缓存（IndexedDB）
 * 2. 用户舌诊历史记录
 * 3. 离线数据同步状态管理
 * 4. 存储空间配额管理
 *
 * 存储结构：
 * - 图片数据表：{ id, uri, thumbnail, metadata, createdAt, synced }
 * - 诊断历史表：{ id, tongueImageId, diagnosis, acupoints, createdAt, synced }
 * - 同步队列：{ id, type, data, createdAt, retryCount }
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// ============================================
// 类型定义
// ============================================

/** 舌象元数据 */
export interface TongueMetadata {
  tongueColor?: string;
  tongueShape?: string;
  coatingColor?: string;
  coatingTexture?: string;
  moisture?: string;
  sublingual?: string;
  /** 患者信息 */
  patientAge?: number;
  patientGender?: 'male' | 'female' | 'other';
  chiefComplaint?: string;
  /** 原始图片信息 */
  sourceApp?: string;
  originalSize?: number; // bytes
  width?: number;
  height?: number;
}

/** 舌诊图片 */
export interface TongueImage {
  id: string;
  /** Base64 DataURL 或 blob URL */
  uri: string;
  /** 缩略图（压缩版） */
  thumbnail?: string;
  metadata: TongueMetadata;
  /** 创建时间 */
  createdAt: number;
  /** 是否已同步到服务器 */
  synced: boolean;
  /** 最后同步时间 */
  syncedAt?: number;
}

/** 舌诊结果 */
export interface TongueDiagnosis {
  id: string;
  tongueImageId: string;
  /** 辨证结果 */
  primarySyndrome: string;
  syndromeScore?: number;
  pathogenesis?: string;
  tongueAnalysis?: string;
  /** 选穴方案 */
  acupoints: AcupunctureResult[];
  /** 服务信息 */
  agentId?: string;
  pricingUsdt?: string;
  orderId?: string;
  /** 创建时间 */
  createdAt: number;
  /** 是否已同步到正和系统 */
  synced: boolean;
  syncedAt?: number;
}

/** 针灸穴位结果 */
export interface AcupunctureResult {
  point: string;
  meridian: string;
  effect: string;
  method: string;
  needleSize?: string;
  angle?: string;
}

/** 同步队列项 */
export interface SyncQueueItem {
  id: string;
  /** 同步类型 */
  type: 'image' | 'diagnosis';
  /** 操作类型 */
  action: 'create' | 'update' | 'delete';
  data: TongueImage | TongueDiagnosis;
  createdAt: number;
  retryCount: number;
  lastError?: string;
}

/** 存储统计 */
export interface StorageStats {
  imageCount: number;
  diagnosisCount: number;
  syncQueueLength: number;
  totalSizeBytes: number;
  quotaBytes: number;
  usagePercent: number;
}

// ============================================
// IndexedDB Schema 定义
// ============================================

interface TongueMirrorDB extends DBSchema {
  images: {
    key: string;
    value: TongueImage;
    indexes: {
      'by-created': number;
      'by-synced': number;
    };
  };
  diagnoses: {
    key: string;
    value: TongueDiagnosis;
    indexes: {
      'by-image': string;
      'by-created': number;
      'by-synced': number;
    };
  };
  syncQueue: {
    key: string;
    value: SyncQueueItem;
    indexes: {
      'by-created': number;
      'by-type': string;
    };
  };
  meta: {
    key: string;
    value: { key: string; value: unknown };
  };
}

// ============================================
// 常量配置
// ============================================

const DB_NAME = 'tongue-mirror-db';
const DB_VERSION = 1;

/** 图片最大存储尺寸（100KB，压缩后 base64） */
const MAX_IMAGE_SIZE = 100 * 1024;

/** 缩略图尺寸 */
const THUMBNAIL_MAX_SIZE = 200;

/** 最大重试次数 */
const MAX_RETRY = 3;

// ============================================
// 工具函数
// ============================================

/** 生成唯一 ID */
function generateId(): string {
  return `tm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/** 压缩图片为 base64 */
async function compressImage(
  fileUri: string,
  maxSize = MAX_IMAGE_SIZE
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // 缩放尺寸
      let { width, height } = img;
      const ratio = Math.min(
        THUMBNAIL_MAX_SIZE / width,
        THUMBNAIL_MAX_SIZE / height,
        1
      );
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      // 逐步降低质量直到满足大小限制
      let quality = 0.8;
      let dataUrl = canvas.toDataURL('image/jpeg', quality);

      while (dataUrl.length > maxSize && quality > 0.1) {
        quality -= 0.1;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }

      resolve(dataUrl);
    };
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = fileUri;
  });
}

/** 估算存储大小（字节） */
function estimateStorageSize(data: unknown): number {
  return new Blob([JSON.stringify(data)]).size;
}

// ============================================
// 数据库操作类
// ============================================

class TongueStorage {
  private db: IDBPDatabase<TongueMirrorDB> | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * 初始化 IndexedDB
   */
  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      this.db = await openDB<TongueMirrorDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          // 图片存储
          if (!db.objectStoreNames.contains('images')) {
            const imageStore = db.createObjectStore('images', { keyPath: 'id' });
            imageStore.createIndex('by-created', 'createdAt');
            imageStore.createIndex('by-synced', 'synced');
          }

          // 诊断记录
          if (!db.objectStoreNames.contains('diagnoses')) {
            const diagStore = db.createObjectStore('diagnoses', {
              keyPath: 'id',
            });
            diagStore.createIndex('by-image', 'tongueImageId');
            diagStore.createIndex('by-created', 'createdAt');
            diagStore.createIndex('by-synced', 'synced');
          }

          // 同步队列
          if (!db.objectStoreNames.contains('syncQueue')) {
            const syncStore = db.createObjectStore('syncQueue', {
              keyPath: 'id',
            });
            syncStore.createIndex('by-created', 'createdAt');
            syncStore.createIndex('by-type', 'type');
          }

          // 元数据存储
          if (!db.objectStoreNames.contains('meta')) {
            db.createObjectStore('meta', { keyPath: 'key' });
          }
        },
      });
    })();

    return this.initPromise;
  }

  private async ensureDB(): Promise<IDBPDatabase<TongueMirrorDB>> {
    await this.init();
    if (!this.db) throw new Error('IndexedDB 未初始化');
    return this.db;
  }

  // ============================================
  // 图片操作
  // ============================================

  /**
   * 保存舌诊图片
   *
   * @param uri - 图片 URI（支持 base64 / blob URL / file path）
   * @param metadata - 舌象元数据
   * @param options - 可选配置
   */
  async saveImage(
    uri: string,
    metadata: TongueMetadata,
    options: { compress = true; autoSync = true } = {}
  ): Promise<TongueImage> {
    const db = await this.ensureDB();
    const id = generateId();
    const createdAt = Date.now();

    let finalUri = uri;
    let thumbnail: string | undefined;

    // 压缩处理（如果是 base64 或 blob）
    if (options.compress && (uri.startsWith('data:') || uri.startsWith('blob:'))) {
      try {
        finalUri = await compressImage(uri);
        // 生成缩略图
        thumbnail = await compressImage(uri, 20 * 1024);
      } catch (e) {
        console.warn('图片压缩失败，使用原图', e);
      }
    }

    const image: TongueImage = {
      id,
      uri: finalUri,
      thumbnail,
      metadata,
      createdAt,
      synced: false,
    };

    await db.put('images', image);

    // 加入同步队列
    if (options.autoSync) {
      await this.addToSyncQueue('image', 'create', image);
    }

    return image;
  }

  /**
   * 获取图片
   */
  async getImage(id: string): Promise<TongueImage | undefined> {
    const db = await this.ensureDB();
    return db.get('images', id);
  }

  /**
   * 获取所有图片（按时间倒序）
   */
  async getAllImages(): Promise<TongueImage[]> {
    const db = await this.ensureDB();
    const images = await db.getAllFromIndex('images', 'by-created');
    return images.reverse(); // 最新的在前
  }

  /**
   * 获取未同步的图片
   */
  async getUnsyncedImages(): Promise<TongueImage[]> {
    const db = await this.ensureDB();
    return db.getAllFromIndex('images', 'by-synced', false);
  }

  /**
   * 删除图片
   */
  async deleteImage(id: string): Promise<void> {
    const db = await this.ensureDB();
    const image = await db.get('images', id);
    if (image) {
      await db.delete('images', id);
      // 级联删除诊断记录
      const diagnoses = await db.getAllFromIndex('diagnoses', 'by-image', id);
      for (const d of diagnoses) {
        await this.deleteDiagnosis(d.id);
      }
      await this.addToSyncQueue('image', 'delete', image);
    }
  }

  /**
   * 标记图片已同步
   */
  async markImageSynced(id: string): Promise<void> {
    const db = await this.ensureDB();
    const image = await db.get('images', id);
    if (image) {
      image.synced = true;
      image.syncedAt = Date.now();
      await db.put('images', image);
    }
  }

  // ============================================
  // 诊断记录操作
  // ============================================

  /**
   * 保存诊断记录
   */
  async saveDiagnosis(
    diagnosis: Omit<TongueDiagnosis, 'id' | 'createdAt' | 'synced'>,
    options: { autoSync = true } = {}
  ): Promise<TongueDiagnosis> {
    const db = await this.ensureDB();
    const id = generateId();
    const createdAt = Date.now();

    const fullDiagnosis: TongueDiagnosis = {
      ...diagnosis,
      id,
      createdAt,
      synced: false,
    };

    await db.put('diagnoses', fullDiagnosis);

    if (options.autoSync) {
      await this.addToSyncQueue('diagnosis', 'create', fullDiagnosis);
    }

    return fullDiagnosis;
  }

  /**
   * 获取诊断记录
   */
  async getDiagnosis(id: string): Promise<TongueDiagnosis | undefined> {
    const db = await this.ensureDB();
    return db.get('diagnoses', id);
  }

  /**
   * 获取某图片的诊断记录
   */
  async getDiagnosesByImage(imageId: string): Promise<TongueDiagnosis[]> {
    const db = await this.ensureDB();
    return db.getAllFromIndex('diagnoses', 'by-image', imageId);
  }

  /**
   * 获取所有诊断记录（按时间倒序）
   */
  async getAllDiagnoses(): Promise<TongueDiagnosis[]> {
    const db = await this.ensureDB();
    const results = await db.getAllFromIndex('diagnoses', 'by-created');
    return results.reverse();
  }

  /**
   * 获取未同步的诊断记录
   */
  async getUnsyncedDiagnoses(): Promise<TongueDiagnosis[]> {
    const db = await this.ensureDB();
    return db.getAllFromIndex('diagnoses', 'by-synced', false);
  }

  /**
   * 删除诊断记录
   */
  async deleteDiagnosis(id: string): Promise<void> {
    const db = await this.ensureDB();
    const diag = await db.get('diagnoses', id);
    if (diag) {
      await db.delete('diagnoses', id);
      await this.addToSyncQueue('diagnosis', 'delete', diag);
    }
  }

  /**
   * 标记诊断记录已同步
   */
  async markDiagnosisSynced(id: string): Promise<void> {
    const db = await this.ensureDB();
    const diag = await db.get('diagnoses', id);
    if (diag) {
      diag.synced = true;
      diag.syncedAt = Date.now();
      await db.put('diagnoses', diag);
    }
  }

  // ============================================
  // 同步队列
  // ============================================

  /**
   * 加入同步队列
   */
  private async addToSyncQueue(
    type: 'image' | 'diagnosis',
    action: 'create' | 'update' | 'delete',
    data: TongueImage | TongueDiagnosis
  ): Promise<void> {
    const db = await this.ensureDB();
    const item: SyncQueueItem = {
      id: generateId(),
      type,
      action,
      data,
      createdAt: Date.now(),
      retryCount: 0,
    };
    await db.put('syncQueue', item);
  }

  /**
   * 获取同步队列
   */
  async getSyncQueue(): Promise<SyncQueueItem[]> {
    const db = await this.ensureDB();
    const items = await db.getAllFromIndex('syncQueue', 'by-created');
    return items;
  }

  /**
   * 移除同步队列项
   */
  async removeSyncQueueItem(id: string): Promise<void> {
    const db = await this.ensureDB();
    await db.delete('syncQueue', id);
  }

  /**
   * 处理同步队列（与正和系统对接）
   * 需要配合 zhenghe.ts 的 API 客户端使用
   */
  async processSyncQueue(
    syncFn: (item: SyncQueueItem) => Promise<boolean>
  ): Promise<{ success: number; failed: number }> {
    const db = await this.ensureDB();
    const queue = await this.getSyncQueue();

    let success = 0;
    let failed = 0;

    for (const item of queue) {
      try {
        const ok = await syncFn(item);
        if (ok) {
          await this.removeSyncQueueItem(item.id);
          if (item.type === 'image') {
            await this.markImageSynced((item.data as TongueImage).id);
          } else {
            await this.markDiagnosisSynced((item.data as TongueDiagnosis).id);
          }
          success++;
        } else {
          failed++;
        }
      } catch (e) {
        // 重试计数
        item.retryCount++;
        item.lastError = e instanceof Error ? e.message : '未知错误';
        if (item.retryCount >= MAX_RETRY) {
          await this.removeSyncQueueItem(item.id);
          console.error(`同步失败已达最大重试次数，移除队列项: ${item.id}`, e);
        } else {
          const db2 = await this.ensureDB();
          await db2.put('syncQueue', item);
        }
        failed++;
      }
    }

    return { success, failed };
  }

  // ============================================
  // 存储空间管理
  // ============================================

  /**
   * 获取存储统计
   */
  async getStorageStats(): Promise<StorageStats> {
    const db = await this.ensureDB();

    const images = await db.getAll('images');
    const diagnoses = await db.getAll('diagnoses');
    const syncQueue = await db.getAll('syncQueue');

    const imageSize = images.reduce(
      (sum, img) =>
        sum + estimateStorageSize(img.uri) + estimateStorageSize(img.thumbnail || ''),
      0
    );
    const diagSize = diagnoses.reduce(
      (sum, d) => sum + estimateStorageSize(d),
      0
    );
    const queueSize = syncQueue.reduce(
      (sum, q) => sum + estimateStorageSize(q),
      0
    );
    const totalSizeBytes = imageSize + diagSize + queueSize;

    // 浏览器存储配额（估算 50MB）
    const quotaBytes = 50 * 1024 * 1024;

    return {
      imageCount: images.length,
      diagnosisCount: diagnoses.length,
      syncQueueLength: syncQueue.length,
      totalSizeBytes,
      quotaBytes,
      usagePercent: (totalSizeBytes / quotaBytes) * 100,
    };
  }

  /**
   * 清理旧数据（按日期）
   */
  async cleanOldData(daysToKeep = 30): Promise<number> {
    const db = await this.ensureDB();
    const cutoff = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;

    let deleted = 0;

    const oldImages = await db.getAllFromIndex('images', 'by-created');
    for (const img of oldImages) {
      if (img.createdAt < cutoff && img.synced) {
        await db.delete('images', img.id);
        deleted++;
      }
    }

    const oldDiags = await db.getAllFromIndex('diagnoses', 'by-created');
    for (const diag of oldDiags) {
      if (diag.createdAt < cutoff && diag.synced) {
        await db.delete('diagnoses', diag.id);
        deleted++;
      }
    }

    return deleted;
  }

  /**
   * 清空所有本地数据（谨慎使用）
   */
  async clearAll(): Promise<void> {
    const db = await this.ensureDB();
    await db.clear('images');
    await db.clear('diagnoses');
    await db.clear('syncQueue');
  }

  /**
   * 导出所有数据（用于备份）
   */
  async exportAll(): Promise<{
    images: TongueImage[];
    diagnoses: TongueDiagnosis[];
    exportedAt: number;
  }> {
    const db = await this.ensureDB();
    return {
      images: await db.getAll('images'),
      diagnoses: await db.getAll('diagnoses'),
      exportedAt: Date.now(),
    };
  }
}

// ============================================
// 便捷工厂函数
// ============================================

/** 从文件对象创建舌诊图片 */
export async function createTongueImageFromFile(
  file: File,
  metadata: TongueMetadata = {}
): Promise<TongueImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const uri = e.target?.result as string;
      try {
        const image = await tongueStorage.saveImage(uri, {
          ...metadata,
          originalSize: file.size,
          sourceApp: 'tongue-mirror',
        });
        resolve(image);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

/** 从 URI/URL 创建舌诊图片（已有 URL 的情况）*/
export async function createTongueImageFromUri(
  uri: string,
  metadata: TongueMetadata = {}
): Promise<TongueImage> {
  return tongueStorage.saveImage(uri, {
    ...metadata,
    sourceApp: 'tongue-mirror',
  });
}

// ============================================
// 导出单例
// ============================================

export const tongueStorage = new TongueStorage();

// ============================================
// 类型再导出（供外部使用）
// ============================================

export type {
  TongueMetadata,
  TongueImage,
  TongueDiagnosis,
  AcupunctureResult,
  SyncQueueItem,
  StorageStats,
};
