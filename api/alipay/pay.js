/**
 * 支付宝发起支付接口
 * 支持PC网站支付(alipay.trade.page.pay)和手机WAP支付(alipay.trade.wap.pay)
 * 通过User-Agent自动判断设备类型选择支付方式
 */

import { getAlipayClient } from './alipay-sdk-config.js';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    const {
      outTradeNo: inputOutTradeNo,
      totalAmount: inputTotalAmount,
      subject,
      useSandbox = true, // 默认使用沙箱环境
    } = body;

    const totalAmount = inputTotalAmount || body.total_amount;
    const outTradeNo = inputOutTradeNo || `TM${Date.now()}${Math.floor(Math.random() * 10000)}`;

    // 参数校验
    if (!totalAmount || !subject) {
      return res.status(400).json({
        success: false,
        error: '缺少必填参数：subject, total_amount'
      });
    }

    // 金额校验
    const amount = parseFloat(totalAmount);
    if (isNaN(amount) || amount < 0.01 || amount > 100000000) {
      return res.status(400).json({
        success: false,
        error: '订单金额无效，范围为 [0.01, 100000000]'
      });
    }

    // 获取支付宝客户端
    const alipayClient = getAlipayClient(useSandbox);

    // 获取当前域名，构造回调地址
    const domain = process.env.ALIPAY_NOTIFY_DOMAIN || 
                  process.env.VERCEL_URL || 
                  'https://tongue-mirror.vercel.app';
    const notifyUrl = `${domain}/api/alipay/notify`;
    const returnUrl = `${domain}/api/alipay/return`;

    // 当前时间戳，格式 yyyy-MM-dd HH:mm:ss
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    // 判断客户端类型
    const userAgent = req.headers['user-agent'] || '';
    const isMobile = /Android|iPhone|iPad|iPod|Mobile|mobile/i.test(userAgent);
    const isWAP = isMobile || /MicroMessenger|WeChat/i.test(userAgent);

    let result;
    let payMethod;

    if (isWAP) {
      // 手机端使用WAP支付
      payMethod = 'alipay.trade.wap.pay';
      result = alipayClient.pageExecute(payMethod, 'GET', {
        bizContent: {
          outTradeNo,
          totalAmount,
          subject,
          productCode: 'QUICK_WAP_WAY',
          quitUrl: returnUrl,
        },
        notifyUrl,
        returnUrl,
        timestamp,
      });
    } else {
      // PC端使用网站支付
      payMethod = 'alipay.trade.page.pay';
      result = alipayClient.pageExecute(payMethod, 'POST', {
        bizContent: {
          outTradeNo,
          totalAmount,
          subject,
          productCode: 'FAST_INSTANT_TRADE_PAY',
        },
        notifyUrl,
        returnUrl,
        timestamp,
      });
    }

    // 返回支付表单或跳转链接
    return res.json({
      success: true,
      outTradeNo,
      payMethod,
      isMobile: isWAP,
      formHtml: result,
      // 对于WAP支付，也可以返回可以直接跳转的URL
      payUrl: isWAP ? result : null,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    console.error('支付宝支付下单失败:', message);
    return res.status(500).json({
      success: false,
      error: `支付下单失败: ${message}`
    });
  }
}
