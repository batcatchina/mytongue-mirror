export default async function handler(req, res) {
  try {
    // 测试1: 基础响应
    if (req.query.step === '1') {
      return res.status(200).json({ step: 1, message: 'API基础响应OK' });
    }
    
    // 测试2: 环境变量
    if (req.query.step === '2') {
      return res.status(200).json({
        step: 2,
        appId: process.env.ALIPAY_APP_ID ? 'SET' : 'MISSING',
        privateKey: process.env.ALIPAY_PRIVATE_KEY ? 'SET' : 'MISSING',
        publicKey: process.env.ALIPAY_PUBLIC_KEY ? 'SET' : 'MISSING',
        gateway: process.env.ALIPAY_GATEWAY || 'MISSING',
        notifyDomain: process.env.ALIPAY_NOTIFY_DOMAIN || 'MISSING',
        frontendUrl: process.env.ALIPAY_FRONTEND_URL || 'MISSING'
      });
    }
    
    // 测试3: alipay-sdk加载
    if (req.query.step === '3') {
      try {
        const AlipaySdk = require('alipay-sdk').default;
        return res.status(200).json({ step: 3, message: 'alipay-sdk加载成功', hasDefault: !!AlipaySdk });
      } catch (e) {
        return res.status(200).json({ step: 3, error: e.message, stack: e.stack?.slice(0, 200) });
      }
    }

    // 测试4: SDK初始化
    if (req.query.step === '4') {
      try {
        const AlipaySdk = require('alipay-sdk').default;
        const client = new AlipaySdk({
          appId: process.env.ALIPAY_APP_ID || 'test',
          privateKey: process.env.ALIPAY_PRIVATE_KEY || 'test',
          alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY || 'test',
          gateway: process.env.ALIPAY_GATEWAY || 'https://openapi.alipay.com/gateway.do',
          signType: 'RSA2',
          charset: 'utf-8',
        });
        return res.status(200).json({ step: 4, message: 'SDK初始化成功' });
      } catch (e) {
        return res.status(200).json({ step: 4, error: e.message, stack: e.stack?.slice(0, 200) });
      }
    }
    
    return res.status(200).json({ message: '使用 ?step=1|2|3|4 测试' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
