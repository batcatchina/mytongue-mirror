export default async function handler(req, res) {
  try {
    const mod = await import("alipay-sdk");
    const keys = Object.keys(mod);
    const defaultType = typeof mod.default;
    return res.json({ success: true, exportKeys: keys, defaultType });
  } catch (e) {
    return res.json({ success: false, error: e.message });
  }
}
