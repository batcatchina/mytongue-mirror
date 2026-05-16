/**
 * 支付宝退款接口
 * 根据商户订单号或支付宝交易号发起退款
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
      out_trade_no,
      trade_no,
      refund_amount,
      refund_reason,
      out_request_no,
      useSandbox = true,
    } = body;

    if (!refund_amount) {
      return res.status(400).json({
        success: false,
        error: '缺少必填参数：refund_amount'
      });
    }

    if (!out_trade_no && !trade_no) {
      return res.status(400).json({
        success: false,
        error: '缺少查询参数：out_trade_no 或 trade_no 至少提供一个'
      });
    }

    const alipayClient = getAlipayClient(useSandbox);

    const bizContent = {
      refund_amount,
    };
    if (out_trade_no) bizContent.out_trade_no = out_trade_no;
    if (trade_no) bizContent.trade_no = trade_no;
    if (refund_reason) bizContent.refund_reason = refund_reason;
    if (out_request_no) bizContent.out_request_no = out_request_no;

    const result = await alipayClient.exec('alipay.trade.refund', {
      bizContent,
    });

    return res.json({
      success: true,
      data: result,
      refundAmount: refund_amount,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    console.error('退款失败:', message);
    return res.status(500).json({
      success: false,
      error: `退款失败: ${message}`
    });
  }
}
