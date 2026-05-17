/**
 * 缓存服务 - 辨证结果本地缓存
 * 基于 localStorage，后续可升级为 IndexedDB
 */
import { DiagnosisInput, DiagnosisOutput } from '@/types';

const DIAG_CACHE = 'tcm_diag_cache_v3';
const MAX_CACHE = 50;

/**
 * 生成缓存key - 只用核心舌象字段，忽略年龄/性别/主诉等非核心字段
 */
export function diagCacheKey(f: DiagnosisInput['input_features'], _i: DiagnosisInput): string {
  const core = {
    tongueColor: f.tongueColor?.value,
    tongueShape: f.tongueShape?.value,
    tongueState: f.tongueState?.value,
    coatingColor: f.coating?.color,
    coatingTexture: f.coating?.texture,
    coatingMoisture: f.coating?.moisture,
    teethMark: f.teethMark?.value,
    crack: f.crack?.value,
  };
  const s = JSON.stringify(core);
  let h = 0;
  for (let c = 0; c < s.length; c++) {
    h = ((h << 5) - h) + s.charCodeAt(c);
    h |= 0;
  }
  return String(h);
}

/**
 * 获取缓存的诊断结果
 */
export function diagCacheGet(k: string): DiagnosisOutput | null {
  try {
    const c = JSON.parse(localStorage.getItem(DIAG_CACHE) || '{}');
    return c[k]?.v || null;
  } catch {
    return null;
  }
}

/**
 * 设置诊断结果缓存（带LRU淘汰）
 */
export function diagCacheSet(k: string, v: DiagnosisOutput): void {
  try {
    const c = JSON.parse(localStorage.getItem(DIAG_CACHE) || '{}');
    c[k] = { v, t: Date.now() };
    const ks = Object.keys(c);
    if (ks.length > MAX_CACHE) {
      ks.sort((a, b) => c[a].t - c[b].t);
      ks.slice(0, ks.length - MAX_CACHE).forEach(x => delete c[x]);
    }
    localStorage.setItem(DIAG_CACHE, JSON.stringify(c));
  } catch {}
}

/**
 * 清除所有诊断缓存
 */
export function clearDiagnosisCache(): void {
  try {
    localStorage.removeItem(DIAG_CACHE);
  } catch {}
}

/**
 * 获取缓存统计信息
 */
export function getCacheStats(): { count: number; max: number; oldest?: number } {
  try {
    const c = JSON.parse(localStorage.getItem(DIAG_CACHE) || '{}');
    const ks = Object.keys(c);
    return {
      count: ks.length,
      max: MAX_CACHE,
      oldest: ks.length > 0 ? Math.min(...ks.map(k => c[k].t)) : undefined
    };
  } catch {
    return { count: 0, max: MAX_CACHE };
  }
}
