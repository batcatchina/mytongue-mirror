/**
 * 支付宝交易查询接口
 * 根据商户订单号或支付宝交易号查询交易状态
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
    const { out_trade_no, trade_no, useSandbox = true } = body;

    if (!out_trade_no && !trade_no) {
      return res.status(400).json({
        success: false,
        error: '缺少查询参数：out_trade_no 或 trade_no 至少提供一个'
      });
    }

    const alipayClient = getAlipayClient(useSandbox);

    const bizContent = {};
    if (out_trade_no) bizContent.out_trade_no = out_trade_no;
    if (trade_no) bizContent.trade_no = trade_no;

    const result = await alipayClient.exec('alipay.trade.query', {
      bizContent,
    });

    // 解析返回结果
    let tradeStatus = null;
    let responseData = result;

    if (typeof result === 'object' && result !== null) {
      const tradeResponse = result.response || {};
      tradeStatus = tradeResponse.trade_status;
      responseData = {
        outTradeNo: tradeResponse.out_trade_no,
        tradeNo: tradeResponse.trade_no,
        tradeStatus,
        totalAmount: tradeResponse.total_amount,
        buyerLogonId: tradeResponse.buyer_logon_id,
        sendPayDate: tradeResponse.send_pay_date,
        buyerPayAmount: tradeResponse.buyer_pay_amount,
        pointAmount: tradeResponse.point_amount,
        invoiceAmount: tradeResponse.invoice_amount,
        receiptAmount: tradeResponse.receipt_amount,
      };
    }

    return res.json({
      success: true,
      data: responseData,
      tradeStatus,
      isPaid: tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'TRADE_FINISHED',
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    console.error('交易查询失败:', message);
    return res.status(500).json({
      success: false,
      error: `交易查询失败: ${message}`
    });
  }
}
