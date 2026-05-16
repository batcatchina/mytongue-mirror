/**
 * 支付宝SDK配置 - Vercel Serverless Function版本 (ESM)
 * 所有敏感配置通过环境变量注入，禁止硬编码
 */

import { AlipaySdk } from "alipay-sdk";

// 环境变量配置
const ALIPAY_CONFIG = {
  appId: process.env.ALIPAY_APP_ID,
  privateKey: process.env.ALIPAY_PRIVATE_KEY,
  alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY,
  gateway: process.env.ALIPAY_GATEWAY || "https://openapi.alipay.com/gateway.do",
  signType: "RSA2",
  charset: "utf-8",
};

// 校验必要配置
if (!ALIPAY_CONFIG.appId || !ALIPAY_CONFIG.privateKey || !ALIPAY_CONFIG.alipayPublicKey) {
  console.warn("[支付宝] 警告: 缺少必要的环境变量配置 (ALIPAY_APP_ID, ALIPAY_PRIVATE_KEY, ALIPAY_PUBLIC_KEY)");
}

// 初始化SDK
const alipayClient = new AlipaySdk({
  appId: ALIPAY_CONFIG.appId,
  privateKey: ALIPAY_CONFIG.privateKey,
  alipayPublicKey: ALIPAY_CONFIG.alipayPublicKey,
  gateway: ALIPAY_CONFIG.gateway,
  signType: ALIPAY_CONFIG.signType,
  charset: ALIPAY_CONFIG.charset,
  timeout: 8000,
});

// 沙箱环境变量（测试用）- 密钥从环境变量读取，回退到硬编码沙箱值
const SANDBOX_CONFIG = {
  appId: process.env.ALIPAY_SANDBOX_APP_ID || "9021000163675728",
  privateKey: process.env.ALIPAY_PRIVATE_KEY,
  alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY,
  gateway: "https://openapi-sandbox.dl.alipaydev.com/gateway.do",
};

/**
 * 获取支付宝客户端
 * @param {boolean} useSandbox - 是否使用沙箱环境
 */
function getAlipayClient(useSandbox = false) {
  if (useSandbox) {
    const sandboxClient = new AlipaySdk({
      appId: SANDBOX_CONFIG.appId,
      privateKey: SANDBOX_CONFIG.privateKey,
      alipayPublicKey: SANDBOX_CONFIG.alipayPublicKey,
      gateway: SANDBOX_CONFIG.gateway,
      signType: "RSA2",
      charset: "utf-8",
      timeout: 8000,
    });
    return sandboxClient;
  }
  return alipayClient;
}

export { alipayClient, ALIPAY_CONFIG, SANDBOX_CONFIG, getAlipayClient };
