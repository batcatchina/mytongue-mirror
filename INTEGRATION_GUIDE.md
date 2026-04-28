# 舌镜-正和系统对接指南

## 概述

本文档描述舌镜系统如何接入正和经济模型，实现积分制舌诊服务。

## 系统架构

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   舌镜前端      │────▶│   正和API       │────▶│   正和合约      │
│  (React/Vite)   │◀────│  (积分账户)      │◀────│   (链上)        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │
        ▼
┌─────────────────┐
│   舌诊服务      │
│  (Coze Bot)    │
└─────────────────┘
```

## 对接文件清单

| 文件路径 | 说明 |
|---------|------|
| `src/services/zhenghe.ts` | 正和API客户端封装 |
| `src/services/diagnosisCredit.ts` | 诊断消费服务 |
| `src/hooks/useCredits.ts` | 积分管理React Hook |
| `src/__tests__/zhenghe.test.ts` | 对接测试用例 |
| `.env.example` | 环境变量示例 |

## 快速开始

### 1. 环境配置

```bash
# 复制环境变量配置
cp .env.example .env.local

# 编辑 .env.local 填入实际值
VITE_ZHENGHE_API_URL=https://api-test.zhenghe.ai/v1
VITE_ZHENGHE_AGENT_ID=your_agent_id
```

### 2. 初始化配置

```typescript
import { zhengheClient } from '@/services/zhenghe';

// 方式1: 直接配置
zhengheClient.configure({
  apiKey: 'your_api_key',
  apiSecret: 'your_api_secret',
  userId: 'user_xxx',
  accountId: 'acc_xxx',
});

// 方式2: 从环境/存储加载
zhengheClient.loadFromStorage();
```

### 3. 使用积分Hook

```tsx
import { useCredits } from '@/hooks/useCredits';

function MyComponent() {
  const { 
    account, 
    poolPrice,
    isConfigured,
    checkBalance,
    createServiceOrder,
  } = useCredits();

  if (!isConfigured) {
    return <div>请先登录</div>;
  }

  return (
    <div>
      <p>可用积分: {account?.available_balance}</p>
      <p>积分价格: {poolPrice?.current_price}</p>
    </div>
  );
}
```

## API接口映射

### 账户管理

| 功能 | 正和API | 封装方法 |
|-----|---------|---------|
| 查询余额 | `GET /accounts/{account_id}` | `zhengheClient.getAccountBalance()` |
| 交易历史 | `GET /accounts/{account_id}/transactions` | `zhengheClient.getTransactionHistory()` |

### 服务消费

| 功能 | 正和API | 封装方法 |
|-----|---------|---------|
| 创建订单 | `POST /orders` | `zhengheClient.createServiceOrder()` |
| 查询订单 | `GET /orders/{order_id}` | `zhengheClient.getOrder()` |
| 取消订单 | `POST /orders/{order_id}/cancel` | `zhengheClient.cancelOrder()` |
| 确认完成 | `POST /orders/{order_id}/confirm` | Agent端调用 |

### 推荐关系

| 功能 | 正和API | 封装方法 |
|-----|---------|---------|
| 绑定推荐 | `POST /referrals/bind` | `zhengheClient.bindReferral()` |
| 查询推荐 | `GET /referrals/{user_id}` | `zhengheClient.getReferralInfo()` |

### 公共接口

| 功能 | 正和API | 封装方法 |
|-----|---------|---------|
| 查询价格 | `GET /pool/price` | `zhengheClient.getPoolPrice()` |

## 积分消费流程

```
用户发起舌诊
     │
     ▼
┌─────────────┐    余额充足    ┌─────────────┐
│  余额检查   │──────────────▶│ 创建服务订单 │
└─────────────┘               └─────────────┘
     │                              │
     │ 余额不足                      ▼
     ▼                       ┌─────────────┐
┌─────────────┐               │ 执行舌诊    │
│  提示充值   │               │ (Coze Bot) │
└─────────────┘               └─────────────┘
                                   │
                                   ▼
                            ┌─────────────┐
                            │ 确认服务完成 │
                            └─────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
              ┌──────────┐  ┌──────────┐  ┌──────────┐
              │ 销毁积分 │  │ 消费奖励 │  │ 推荐奖励 │
              └──────────┘  └──────────┘  └──────────┘
```

### 代码示例

```typescript
import { useDiagnosisWithCredits } from '@/components/credits/CreditsIntegration';

function DiagnosisPage() {
  const { 
    isReady,
    checkAndCreateOrder,
    cancelOrder,
  } = useDiagnosisWithCredits();

  const handleDiagnosis = async () => {
    // 1. 检查余额并创建订单
    const success = await checkAndCreateOrder({
      tongue_color: '淡红',
      tongue_shape: '胖大',
      symptoms: ['口干', '失眠'],
      patient_info: {
        age: 35,
        gender: '男',
        chief_complaint: '疲劳',
      },
    });

    if (success) {
      // 2. 执行舌诊...
      // 3. 舌诊完成后自动确认
    }
  };

  return (
    <button onClick={handleDiagnosis} disabled={!isReady}>
      开始舌诊
    </button>
  );
}
```

## 积分计算公式

### 服务定价与积分销毁

```javascript
// 销毁积分 = 定价 / 当前价格 × 1.009
tokensToBurn = (pricingUSDT / currentPrice) × 1.009

// 例如：定价 50 USDT，价格 1.0
// 销毁积分 = 50 / 1.0 × 1.009 = 50.45
```

### 奖励分发

| 用途 | 比例 | 计算示例 (50 USDT) |
|-----|------|-------------------|
| 服务者获得 | 100% | 50.00 USDT |
| 消费者奖励 | 0.5% | 0.25 USDT |
| 释放增值 | 0.3% | 0.15 USDT |
| 推荐奖励 | 0.1% | 0.05 USDT |

## 错误处理

### 错误码映射

```typescript
import { ERROR_CODE_MESSAGES } from '@/services/zhenghe';

// 获取错误提示
const errorInfo = ERROR_CODE_MESSAGES['ZH_3002'];
// { message: '余额不足', suggestion: '请先充值积分' }
```

### 常见错误处理

```typescript
try {
  const order = await createServiceOrder(params);
} catch (error) {
  if (error.message.includes('余额不足')) {
    // 引导用户充值
    showRechargeDialog();
  } else if (error.message.includes('订单已支付')) {
    // 幂等性保护，查询现有订单
    const existingOrder = await getOrder(params.referenceId);
  } else {
    // 其他错误
    showErrorDialog(error.message);
  }
}
```

## 测试

### 运行测试

```bash
# 在浏览器控制台执行
import { runZhengheIntegrationTests } from '@/__tests__/zhenghe.test';

await runZhengheIntegrationTests();
```

### 测试用例列表

| 测试 | 说明 |
|-----|------|
| 配置验证 | 检查API Key和账户配置 |
| 账户余额查询 | 获取用户积分余额 |
| 资金池价格 | 获取实时积分价格 |
| 创建服务订单 | 模拟舌诊下单 |
| 查询订单 | 验证订单状态 |
| 取消订单 | 释放锁定积分 |
| 推荐关系绑定 | 绑定推荐码 |
| 积分计算验证 | 验证销毁/奖励计算 |

## 安全注意事项

1. **API Secret保护**
   - API Secret 仅在注册时返回一次，请妥善保存
   - 不要在前端代码中硬编码敏感信息
   - 建议使用服务端代理签名

2. **签名实现**
   - 当前实现的签名是简化版本
   - 生产环境应使用 Web Crypto API 或服务端签名

3. **Nonce管理**
   - 使用时间戳+随机字符串生成Nonce
   - 相同Nonce在10分钟内不会重复处理

## 联系方式

- 正和系统文档：[正和系统/架构设计/API接口_v1.1_MVP.md](./正和系统/架构设计/API接口_v1.1_MVP.md)
- 舌镜系统：[tongue-mirror-frontend/](./tongue-mirror-frontend/)
