// 舌象显示配置

export const REGION_LABEL_MAP: Record<string, string> = {
  tip: '舌尖',
  sides: '舌边',
  middle: '舌中',
  root: '舌根',
};

export function getRegionChineseName(region: string): string {
  if (!region) return '';
  if (/[\u4e00-\u9fff]/.test(region)) return region; // 已经是中文
  return REGION_LABEL_MAP[region] || region;
}
