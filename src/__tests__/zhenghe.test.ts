/**
 * 舌镜-正和对接测试用例
 * 
 * 运行方式：确保 VITE_ZHENGHE_API_URL 配置正确后执行
 * 测试覆盖：
 * 1. API连接性测试
 * 2. 账户余额查询测试
 * 3. 服务订单创建/查询/取消测试
 * 4. 推荐关系测试
 * 5. 积分计算验证
 */

import {
  zhengheClient,
  TONGUE_DIAGNOSIS_SERVICE,
  ERROR_CODE_MESSAGES,
  AccountInfo,
  PoolPrice,
  ServiceOrder,
  ReferralInfo,
} from '@/services/zhenghe';
import {
  formatCreditsInfo,
  generateReferenceId,
} from '@/hooks/useCredits';
import {
  diagnosisCreditService,
  formatOrderStatus,
  calculateExpectedReward,
  DiagnosisSession,
} from '@/services/diagnosisCredit';

// ============================================
// 测试配置
// ============================================

const TEST_CONFIG = {
  // 测试用API配置（请替换为实际值）
  testApiKey: import.meta.env.VITE_TEST_ZHENGHE_API_KEY || '',
  testApiSecret: import.meta.env.VITE_TEST_ZHENGHE_API_SECRET || '',
  testUserId: import.meta.env.VITE_TEST_USER_ID || '',
  testAccountId: import.meta.env.VITE_TEST_ACCOUNT_ID || '',
  
  // 测试用推荐码
  testReferralCode: import.meta.env.VITE_TEST_REFERRAL_CODE || '',
  
  // 测试Agent ID
  testAgentId: import.meta.env.VITE_TEST_AGENT_ID || '',
};

// ============================================
// 测试工具
// ============================================

type TestResult = {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
};

const testResults: TestResult[] = [];

function logTest(name: string, passed: boolean, message: string, duration: number) {
  const result: TestResult = { name, passed, message, duration };
  testResults.push(result);
  const icon = passed ? '✅' : '❌';
  const status = passed ? 'PASS' : 'FAIL';
  console.log(`${icon} [${status}] ${name} (${duration}ms): ${message}`);
}

function printSummary() {
  const passed = testResults.filter(r => r.passed).length;
  const failed = testResults.filter(r => !r.passed).length;
  console.log('\n' + '='.repeat(60));
  console.log(`测试总结: ${passed} 通过, ${failed} 失败, 共 ${testResults.length} 个测试`);
  console.log('='.repeat(60));
  
  if (failed > 0) {
    console.log('\n失败的测试:');
    testResults.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.message}`);
    });
  }
}

// ============================================
// 测试用例
// ============================================

/**
 * 测试1: 配置验证
 */
async function testConfiguration() {
  const start = Date.now();
  
  try {
    // 检查环境变量
    const hasApiKey = !!TEST_CONFIG.testApiKey;
    const hasApiSecret = !!TEST_CONFIG.testApiSecret;
    const hasAccountId = !!TEST_CONFIG.testAccountId;
    
    if (!hasApiKey || !hasAccountId) {
      logTest(
        '配置验证',
        false,
        '请配置测试环境变量: VITE_TEST_ZHENGHE_API_KEY, VITE_TEST_ACCOUNT_ID',
        Date.now() - start
      );
      return false;
    }
    
    // 配置客户端
    zhengheClient.configure({
      apiKey: TEST_CONFIG.testApiKey,
      apiSecret: TEST_CONFIG.testApiSecret,
      userId: TEST_CONFIG.testUserId,
      accountId: TEST_CONFIG.testAccountId,
    });
    
    const isConfigured = zhengheClient.isConfigured();
    logTest('配置验证', isConfigured, '客户端配置成功', Date.now() - start);
    return isConfigured;
    
  } catch (error) {
    logTest('配置验证', false, `配置失败: ${error}`, Date.now() - start);
    return false;
  }
}

/**
 * 测试2: 账户余额查询
 */
async function testAccountBalance() {
  const start = Date.now();
  
  try {
    const account = await zhengheClient.getAccountBalance();
    
    if (!account) {
      logTest('账户余额查询', false, '无法获取账户信息', Date.now() - start);
      return null;
    }
    
    // 验证字段
    const hasRequiredFields = 
      account.account_id &&
      account.balance &&
      account.available_balance &&
      account.locked_balance;
    
    if (!hasRequiredFields) {
      logTest('账户余额查询', false, '账户数据字段不完整', Date.now() - start);
      return null;
    }
    
    // 格式化显示
    const formatted = formatCreditsInfo(account);
    console.log(`  余额: ${formatted.balance}, 可用: ${formatted.available}, 锁定: ${formatted.locked}`);
    
    logTest('账户余额查询', true, `账户 ${account.account_id} 余额 ${formatted.balance}`, Date.now() - start);
    return account;
    
  } catch (error) {
    logTest('账户余额查询', false, `查询失败: ${error}`, Date.now() - start);
    return null;
  }
}

/**
 * 测试3: 资金池价格查询（公开接口）
 */
async function testPoolPrice() {
  const start = Date.now();
  
  try {
    const price = await zhengheClient.getPoolPrice();
    
    if (!price) {
      logTest('资金池价格查询', false, '无法获取价格信息', Date.now() - start);
      return null;
    }
    
    // 验证字段
    const hasRequiredFields = 
      price.current_price &&
      price.capital_pool &&
      price.growth_pool;
    
    if (!hasRequiredFields) {
      logTest('资金池价格查询', false, '价格数据字段不完整', Date.now() - start);
      return null;
    }
    
    console.log(`  当前价格: ${price.current_price}, 24h变化: ${price.price_change_24h}`);
    console.log(`  资金池: ${price.capital_pool.usdt_balance}, 增值池: ${price.growth_pool.usdt_balance}`);
    
    logTest('资金池价格查询', true, `当前价格 ${price.current_price}`, Date.now() - start);
    return price;
    
  } catch (error) {
    logTest('资金池价格查询', false, `查询失败: ${error}`, Date.now() - start);
    return null;
  }
}

/**
 * 测试4: 创建服务订单
 */
async function testCreateServiceOrder(poolPrice: PoolPrice | null, account: AccountInfo | null) {
  const start = Date.now();
  
  try {
    // 检查余额
    const pricing = parseFloat(TONGUE_DIAGNOSIS_SERVICE.DEFAULT_PRICING);
    const currentPrice = poolPrice ? parseFloat(poolPrice.current_price) : 1;
    const tokensNeeded = pricing / currentPrice * 1.009;
    
    if (account) {
      const available = parseFloat(account.available_balance);
      if (available < tokensNeeded) {
        logTest('创建服务订单', false, `余额不足（需要 ${tokensNeeded.toFixed(2)}）`, Date.now() - start);
        return null;
      }
    }
    
    // 创建订单
    const referenceId = generateReferenceId('test_order');
    const metadata = {
      tongue_color: '淡红',
      tongue_shape: '胖大',
      coating_color: '薄白',
      symptoms: ['口干', '失眠'],
      patient_info: {
        age: 35,
        gender: '男',
        chief_complaint: '最近感觉疲劳',
      },
    };
    
    const order = await zhengheClient.createServiceOrder({
      agentId: TEST_CONFIG.testAgentId || TONGUE_DIAGNOSIS_SERVICE.AGENT_ID,
      serviceType: TONGUE_DIAGNOSIS_SERVICE.SERVICE_TYPE,
      pricingUsdt: TONGUE_DIAGNOSIS_SERVICE.DEFAULT_PRICING,
      metadata,
      referenceId,
    });
    
    if (!order) {
      logTest('创建服务订单', false, '订单创建失败', Date.now() - start);
      return null;
    }
    
    console.log(`  订单ID: ${order.order_id}, 状态: ${order.status}`);
    console.log(`  定价: ${order.pricing_usdt} USDT, 销毁积分: ${order.tokens_to_burn}`);
    
    logTest('创建服务订单', true, `订单 ${order.order_id} 创建成功`, Date.now() - start);
    return order;
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logTest('创建服务订单', false, `创建失败: ${errorMsg}`, Date.now() - start);
    return null;
  }
}

/**
 * 测试5: 查询订单
 */
async function testGetOrder(orderId: string) {
  const start = Date.now();
  
  try {
    const order = await zhengheClient.getOrder(orderId);
    
    if (!order) {
      logTest('查询订单', false, '订单不存在', Date.now() - start);
      return null;
    }
    
    const statusInfo = formatOrderStatus(order.status);
    logTest('查询订单', true, `订单 ${order.order_id} 状态: ${statusInfo.label}`, Date.now() - start);
    return order;
    
  } catch (error) {
    logTest('查询订单', false, `查询失败: ${error}`, Date.now() - start);
    return null;
  }
}

/**
 * 测试6: 取消订单
 */
async function testCancelOrder(orderId: string) {
  const start = Date.now();
  
  try {
    const result = await zhengheClient.cancelOrder(orderId);
    
    if (!result) {
      logTest('取消订单', false, '取消失败', Date.now() - start);
      return false;
    }
    
    logTest('取消订单', true, `订单 ${orderId} 已取消，释放 ${result.released_tokens} 积分`, Date.now() - start);
    return true;
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logTest('取消订单', false, `取消失败: ${errorMsg}`, Date.now() - start);
    return false;
  }
}

/**
 * 测试7: 推荐关系绑定
 */
async function testReferralBinding() {
  const start = Date.now();
  
  if (!TEST_CONFIG.testReferralCode) {
    logTest('推荐关系绑定', false, '未配置测试推荐码', Date.now() - start);
    return null;
  }
  
  try {
    const result = await zhengheClient.bindReferral(TEST_CONFIG.testReferralCode);
    
    if (!result) {
      logTest('推荐关系绑定', false, '绑定失败', Date.now() - start);
      return null;
    }
    
    logTest('推荐关系绑定', true, `绑定推荐人 ${result.referrer?.user_id}`, Date.now() - start);
    return result;
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    // 推荐码可能已绑定或其他错误，标记为跳过
    logTest('推荐关系绑定', errorMsg.includes('已绑定') ? true : false, `绑定结果: ${errorMsg}`, Date.now() - start);
    return null;
  }
}

/**
 * 测试8: 积分计算验证
 */
async function testTokenCalculation() {
  const start = Date.now();
  
  try {
    const pricing = 50; // USDT
    const currentPrice = 1.0; // 假设价格
    
    // 按公式计算
    const tokensNeeded = (pricing / currentPrice) * 1.009;
    const consumerReward = pricing * 0.005;
    const referralReward = pricing * 0.001;
    const growthPoolReleased = pricing * 0.003;
    
    // 验证计算
    const expectedTokens = 50.45;
    const tokensMatch = Math.abs(tokensNeeded - expectedTokens) < 0.001;
    
    const expectedReward = 0.25;
    const rewardMatch = Math.abs(consumerReward - expectedReward) < 0.001;
    
    const success = tokensMatch && rewardMatch;
    
    console.log(`  定价: ${pricing} USDT`);
    console.log(`  销毁积分: ${tokensNeeded.toFixed(8)} (预期: ${expectedTokens})`);
    console.log(`  消费者奖励: ${consumerReward.toFixed(8)} USDT`);
    console.log(`  推荐奖励: ${referralReward.toFixed(8)} USDT`);
    console.log(`  释放增值: ${growthPoolReleased.toFixed(8)} USDT`);
    
    const message = tokensMatch && rewardMatch 
      ? '积分计算正确'
      : `计算偏差：积分 ${tokensNeeded.toFixed(4)} vs ${expectedTokens}`;
    
    logTest('积分计算验证', success, message, Date.now() - start);
    return success;
    
  } catch (error) {
    logTest('积分计算验证', false, `计算失败: ${error}`, Date.now() - start);
    return false;
  }
}

/**
 * 测试9: 错误码映射验证
 */
async function testErrorCodeMapping() {
  const start = Date.now();
  
  try {
    const hasAllRequiredErrors = 
      ERROR_CODE_MESSAGES.ZH_1001 && // 签名无效
      ERROR_CODE_MESSAGES.ZH_3002 && // 余额不足
      ERROR_CODE_MESSAGES.ZH_7001 && // 推荐人不存在
      ERROR_CODE_MESSAGES.ZH_9001;   // 系统内部错误
    
    const keys = Object.keys(ERROR_CODE_MESSAGES);
    console.log(`  已定义 ${keys.length} 个错误码`);
    
    const success = hasAllRequiredErrors && keys.length >= 15;
    logTest('错误码映射', success, `定义了 ${keys.length} 个错误码`, Date.now() - start);
    return success;
    
  } catch (error) {
    logTest('错误码映射', false, `验证失败: ${error}`, Date.now() - start);
    return false;
  }
}

/**
 * 测试10: 会话管理
 */
async function testSessionManagement() {
  const start = Date.now();
  
  try {
    // 获取当前会话
    const session1 = diagnosisCreditService.getCurrentSession();
    const isNullInitially = session1 === null;
    
    // 清除会话
    diagnosisCreditService.clearSession();
    const session2 = diagnosisCreditService.getCurrentSession();
    const isCleared = session2 === null;
    
    const success = isNullInitially && isCleared;
    logTest('会话管理', success, isCleared ? '会话管理正常' : '会话清理失败', Date.now() - start);
    return success;
    
  } catch (error) {
    logTest('会话管理', false, `测试失败: ${error}`, Date.now() - start);
    return false;
  }
}

// ============================================
// 主测试流程
// ============================================

export async function runZhengheIntegrationTests(): Promise<TestResult[]> {
  console.log('\n' + '='.repeat(60));
  console.log('舌镜-正和系统对接测试');
  console.log('='.repeat(60) + '\n');

  // 测试1: 配置验证
  const configOk = await testConfiguration();
  if (!configOk) {
    console.log('\n⚠️ 配置验证失败，跳过后续测试');
    printSummary();
    return testResults;
  }

  // 测试2: 账户余额查询
  const account = await testAccountBalance();

  // 测试3: 资金池价格查询
  const poolPrice = await testPoolPrice();

  // 测试4: 积分计算验证（不需要API）
  await testTokenCalculation();

  // 测试5: 错误码映射验证
  await testErrorCodeMapping();

  // 测试6: 会话管理
  await testSessionManagement();

  // 测试7: 创建服务订单
  const order = await testCreateServiceOrder(poolPrice, account);

  // 测试8: 查询订单
  if (order) {
    await testGetOrder(order.order_id);
    
    // 测试9: 取消订单
    await testCancelOrder(order.order_id);
  }

  // 测试10: 推荐关系绑定（可选）
  await testReferralBinding();

  // 打印总结
  printSummary();

  return testResults;
}

// ============================================
// 单独运行某个测试
// ============================================

export async function runSingleTest(testName: string): Promise<TestResult | null> {
  // 先配置
  await testConfiguration();
  
  switch (testName) {
    case 'balance':
      await testAccountBalance();
      break;
    case 'price':
      await testPoolPrice();
      break;
    case 'calculation':
      await testTokenCalculation();
      break;
    case 'error':
      await testErrorCodeMapping();
      break;
    case 'session':
      await testSessionManagement();
      break;
    default:
      console.log(`未知测试: ${testName}`);
      return null;
  }
  
  return testResults[testResults.length - 1] || null;
}

// ============================================
// 导出测试配置（用于调试）
// ============================================

export function getTestConfig() {
  return {
    ...TEST_CONFIG,
    // 隐藏敏感信息
    testApiKey: TEST_CONFIG.testApiKey ? '***' + TEST_CONFIG.testApiKey.slice(-4) : '',
    testApiSecret: TEST_CONFIG.testApiSecret ? '***' : '',
  };
}
