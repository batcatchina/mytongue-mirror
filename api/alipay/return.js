export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).end();

  const { query } = req;
  const outTradeNo = query.out_trade_no || '-';
  const totalAmount = query.total_amount || '-';
  const frontendUrl = process.env.ALIPAY_FRONTEND_URL || 'https://she-zhen.top';

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(`<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>支付结果 - 舌镜</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:linear-gradient(135deg,#667eea,#764ba2)}.card{background:#fff;border-radius:16px;padding:40px;box-shadow:0 20px 60px rgba(0,0,0,.3);text-align:center;max-width:400px;width:90%}.icon{font-size:64px;margin-bottom:20px}h1{color:#333;font-size:24px}p{color:#666;font-size:14px;margin:8px 0}.btn{display:inline-block;width:100%;padding:14px;margin-top:20px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;border-radius:8px;font-size:16px;cursor:pointer;text-decoration:none}</style></head><body><div class="card"><div class="icon">⏳</div><h1>支付处理中</h1><p>订单号: ${outTradeNo}</p><p>金额: ${totalAmount} 元</p><p style="color:#e6a23c;font-size:12px;margin-top:16px">支付结果正在确认中</p><a href="${frontendUrl}/#/diagnosis${outTradeNo !== '-' ? '?paid_order=' + outTradeNo : ''}" class="btn">返回舌镜</a></div></body></html>`);
}
