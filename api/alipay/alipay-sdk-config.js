/**
 * 支付宝SDK配置 - Vercel Serverless Function版本
 * 
 * 所有敏感配置通过环境变量注入，禁止硬编码
 */

// 使用require方式兼容Vercel环境
const AlipaySdk = require('alipay-sdk').default;

// 环境变量配置
const ALIPAY_CONFIG = {
  appId: process.env.ALIPAY_APP_ID,
  privateKey: process.env.ALIPAY_PRIVATE_KEY,
  alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY,
  gateway: process.env.ALIPAY_GATEWAY || 'https://openapi.alipay.com/gateway.do',
  signType: 'RSA2',
  charset: 'utf-8',
};

// 校验必要配置
if (!ALIPAY_CONFIG.appId || !ALIPAY_CONFIG.privateKey || !ALIPAY_CONFIG.alipayPublicKey) {
  console.warn('[支付宝] 警告: 缺少必要的环境变量配置 (ALIPAY_APP_ID, ALIPAY_PRIVATE_KEY, ALIPAY_PUBLIC_KEY)');
}

// 初始化SDK
const alipayClient = new AlipaySdk({
  appId: ALIPAY_CONFIG.appId,
  privateKey: ALIPAY_CONFIG.privateKey,
  alipayPublicKey: ALIPAY_CONFIG.alipayPublicKey,
  gateway: ALIPAY_CONFIG.gateway,
  signType: ALIPAY_CONFIG.signType,
  charset: ALIPAY_CONFIG.charset,
  timeout: 15000,
});

// 沙箱环境变量（测试用）
const SANDBOX_CONFIG = {
  appId: '9021000163675728',
  privateKey: 'MIIEowIBAAKCAQEAi4rqER5JkUo1TkPsOeyHe/Vp6cLJxwFCobQ1yLEnO4m+SB80DLWEG92uNwP3IqaRryLoz8zmFgXPi49Jh2gDlMQ89XrZyLi18ka53BWjnRxJhO6euppGrTCqpQTMXBHiRoaV/jmp1q8yJ49lJn6dJFau5acc2mD4NkTWK1JUd3L5U7cf/KXErsFnimOWrf2Hq2q6rfaYvCKfUj8qYn6ozUlHgpmDquhmQTpCHao8lU6hQko2hG4rso+kOO/BUAUPFpZOIMJW1DcITA+r8Oy1qJ9HQmi8D9+t598NRcE9o0pXn9psB3FtLUCmrgliR+2zN8jGIWKBjHg526aePkE85QIDAQABAoIBAH3brz39WVFH40hSDvA3nAN72ClU3PU298gtaA05ay9SD2OxcRq9ZQhVK1rHotGH9wJFtEIohqX6W7V+aU1NzV0SmgC261MU9lYs4FnW0plT+CODrXqUx4ZRzLfF2iR4pOQDY6nGjJ7rqYrw1MShkk5COME9ttJof7dC4wBz42dP3PkcqJaZAe+WkXiYeOPxNJ+UAMjV5SKj2QRK5Kd/pBW/j5ps/7IVfsXGlGbluUAab0HAp1Esg8L0TNrDxhs9UMuU7aWqxzhPCji4l+DYsksGQuW0zuOFzeUbTxwI1gQ395kC9DmgH3M9IK0Z5slJ70sFPF1dZvORjZsx11tFY8kCgYEA3I75xst6/6GrrOdmKdmNyw0PzcgbN6BTp94AG1BunWodgf8P4EZKOZ7i3Vd3F72Nv3SKqYwYiDKHI9+YeztVDb1iB7mA5aFsBmDtSA/c6MNjhfgmzU7HCPPHOtWWHo1GvotQutDaFJmw/2+HB/JFBukhCW01ScfiEjuB/rpXtS8CgYEAofc46RgTVlMULsK36pAezF77jG12okTnjxrFKDJg7ipBdqpU0WZhNXJFZvw5FdUlyUxx7W/9Vgf4s/o7P76gT1Xnvhb539kxrHiAFRozhEsV17T9XyywuyZX/OJHima+BLUtcntbGTEm2H6I60SDlt14DnXJXPCy8QtRb9yfkisCgYBdsIJbts39zvA9F2KnflmkGl1PPaSKIZnHoh8Le0QxrATy1qUo0NLw3RRjj6bwN74ByQCp+u/k0wni7DU6i76agosk2uDtKn/Xyc6hoNNnMLCTFRFufvs/S0ajMF1/huW5RTa61ML+ozazmu2SK5C02c0F0xUizTy0IAEdcoyVUwKBgQCNfjFsiMjT4C5Aj4EmXJNbTRsKWdKK/hEg1m0oqaI+ThH0fectK/h+PX7d8jhYl2W0TqE0oWI61ynw6Qj7rifURyL10JKoeNDJcFfMl6Ar0YCaehXjIGKgjGXPmUqQYSNdb33thlBWWLcr6JbqmWcv0/h/AW1RUUGyDIYvaBjLEwKBgCsmDGdJ+IuM0YOVmCISBRbtgnZLnGACH3QelM72L0Z3p9OmtK6p5iIr9eHxCAvWPQmD3EvwodbbwGYs9SuVA8jCgqIeeTnsOMUhDjYgWJoKPAtfDEBIf/2OFRABp63R783jlZbhJVPm9FUGk8+oiU6spPr3hsiyJNjeZdzqZ/iE',
  alipayPublicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAigpmLss6Ej4uJFaieEiA+c4OFVwh4tUPfCRZHyAjvP/qwONvXE4blFTfDGCpPe7kVzSGLTMRieAy854gx5pr3glcmzjCKnEYZAhn0zspZkH7nMDnJcySWcSV0rI0aWW7FUGI0DQs4hMYO2Df6UZOJ3LP9OdilRIQfkpKWPh1SE7ETEyWB5mhxKGIrmjacy7wxXQijh6n58NGUUHEp27dR0XvfRpo33QqaNagzUguGLXtoEtJkRbrevAg1UmSaxnTh2YGhYqOGobAH2sy2qpdCJXbKsCI0NGYFe0IhMMOnOhViVs7KbB8WH+1ObwkOEQIYHaOPIcmtW/7trbPUhqn8wIDAQAB',
  gateway: 'https://openapi-sandbox.dl.alipaydev.com/gateway.do',
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
      signType: 'RSA2',
      charset: 'utf-8',
      timeout: 15000,
    });
    return sandboxClient;
  }
  return alipayClient;
}

module.exports = {
  alipayClient,
  ALIPAY_CONFIG,
  SANDBOX_CONFIG,
  getAlipayClient,
};
