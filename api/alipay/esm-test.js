export default async function handler(req, res) {
  try {
    const AlipaySdk = (await import("alipay-sdk")).default;
    return res.json({ success: true, message: "alipay-sdk loaded", hasDefault: !!AlipaySdk });
  } catch (e) {
    return res.json({ success: false, error: e.message, stack: e.stack?.substring(0, 500) });
  }
}
