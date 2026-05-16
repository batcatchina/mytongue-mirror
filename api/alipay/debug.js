export default async function handler(req, res) {
  const results = [];
  
  // Test 1: import alipay-sdk
  try {
    const mod = await import("alipay-sdk");
    results.push({ step: "import-sdk", ok: true, keys: Object.keys(mod) });
  } catch (e) {
    results.push({ step: "import-sdk", ok: false, error: e.message });
  }

  // Test 2: import config
  try {
    const config = await import("./alipay-sdk-config.js");
    results.push({ step: "import-config", ok: true, keys: Object.keys(config), hasClient: !!config.alipayClient, hasGetClient: !!config.getAlipayClient });
  } catch (e) {
    results.push({ step: "import-config", ok: false, error: e.message, stack: e.stack?.substring(0, 300) });
  }

  // Test 3: env vars
  results.push({ 
    step: "env-check", 
    hasAppId: !!process.env.ALIPAY_APP_ID, 
    hasPrivateKey: !!process.env.ALIPAY_PRIVATE_KEY,
    hasPublicKey: !!process.env.ALIPAY_PUBLIC_KEY,
    hasGateway: !!process.env.ALIPAY_GATEWAY,
    gateway: process.env.ALIPAY_GATEWAY || "not-set"
  });

  // Test 4: call getAlipayClient
  try {
    const { getAlipayClient } = await import("./alipay-sdk-config.js");
    const client = getAlipayClient(true);
    results.push({ step: "get-client", ok: true, clientType: typeof client });
  } catch (e) {
    results.push({ step: "get-client", ok: false, error: e.message, stack: e.stack?.substring(0, 300) });
  }

  return res.json({ results });
}
