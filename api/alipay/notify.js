/**
 * 支付宝异步通知接口
 * 支付宝会以 POST 方式请求此接口，通知支付结果
 * 
 * 重要：此接口需要验签，验证请求确实来自支付宝
 * 验签通过后，需要更新业务系统中的订单状态
 */

const { getAlipayClient, SANDBOX_CONFIG } = require('./alipay-sdk-config');

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  try {
    // 获取POST参数
    let params = {};
    
    // 支持两种格式：JSON body 或 form-urlencoded
    if (req.body && typeof req.body === 'object') {
      if (req.body.sign) {
        // form-urlencoded 格式
        params = req.body;
      } else {
        // JSON格式
        const contentType = req.headers['content-type'] || '';
        if (contentType.includes('application/x-www-form-urlencoded')) {
          params = req.body;
        }
      }
    }

    // 如果body为空，尝试从query string解析
    if (Object.keys(params).length === 0 && req.query) {
      params = req.query;
    }

    console.log('[支付宝异步通知] 收到通知:', JSON.stringify(params));

    // 记录原始参数用于调试
    const { sign, sign_type, ...restParams } = params;
    console.log('[支付宝异步通知] 签名:', sign);
    console.log('[支付宝异步通知] 参数:', JSON.stringify(restParams));

    // 获取交易状态
    const tradeStatus = params.trade_status;
    const outTradeNo = params.out_trade_no;
    const tradeNo = params.trade_no;
    const totalAmount = params.total_amount;
    const buyerLogonId = params.buyer_logon_id;

    // 判断是否沙箱环境，使用对应公钥验签
    const isSandbox = params.app_id === SANDBOX_CONFIG.appId;
    const alipayClient = getAlipayClient(isSandbox);

    // 验签
    let signVerified = false;
    try {
      signVerified = alipayClient.checkNotifySignV2(params);
    } catch (e) {
      console.error('[支付宝异步通知] 验签异常:', e);
    }

    if (!signVerified) {
      console.error('[支付宝异步通知] 验签失败');
      return res.status(400).send('fail');
    }

    console.log(`[支付宝异步通知] 验签成功, tradeStatus=${tradeStatus}, outTradeNo=${outTradeNo}`);

    // 处理不同交易状态
    if (tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'TRADE_FINISHED') {
      // ========================================
      // 支付成功 - 在此处更新业务系统订单状态
      // ========================================
      
      console.log(`[支付宝异步通知] ✅ 支付成功`);
      console.log(`  商户订单号: ${outTradeNo}`);
      console.log(`  支付宝交易号: ${tradeNo}`);
      console.log(`  订单金额: ${totalAmount} 元`);
      console.log(`  买家账号: ${buyerLogonId}`);

      // TODO: 在此处实现订单状态更新逻辑
      // 例如：
      // 1. 查询数据库中的订单
      // 2. 更新订单状态为已支付
      // 3. 解锁用户付费功能（如深度辨证）
      // 4. 记录支付日志
      
      // 示例代码（需要根据实际业务逻辑调整）：
      // await updateOrderStatus(outTradeNo, 'PAID', {
      //   tradeNo,
      //   totalAmount,
      //   buyerLogonId,
      //   paidAt: new Date(),
      // });

      // 支付成功，保存支付凭证到本地或数据库（用于前端验证）
      // 这里使用 Vercel KV 或其他存储方案
      try {
        if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
          const KV = await import('@vercel/kv');
          await KV.set(`paid:${outTradeNo}`, {
            paid: true,
            tradeNo,
            totalAmount,
            paidAt: Date.now(),
          }, { ex: 60 * 60 * 24 * 30 }); // 30天过期
        }
      } catch (e) {
        console.log('[支付宝异步通知] KV存储不可用，跳过本地记录');
      }

    } else if (tradeStatus === 'WAIT_BUYER_PAY') {
      // 等待买家付款
      console.log(`[支付宝异步通知] ⏳ 等待买家付款, outTradeNo=${outTradeNo}`);

    } else if (tradeStatus === 'TRADE_CLOSED') {
      // 交易关闭
      console.log(`[支付宝异步通知] ❌ 交易关闭, outTradeNo=${outTradeNo}`);

    } else if (tradeStatus === 'TRADE_CANCEL') {
      // 买家取消
      console.log(`[支付宝异步通知] ❌ 买家取消交易, outTradeNo=${outTradeNo}`);

    }

    // 必须返回 "success"，否则支付宝会持续通知
    return res.send('success');

  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    console.error('[支付宝异步通知] 处理异常:', message);
    return res.status(500).send('fail');
  }
}
