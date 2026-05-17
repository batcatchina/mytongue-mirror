# 舌镜项目支付宝支付集成文档

## 📁 文件清单

### 后端 API（6个文件）
位于 `/api/alipay/` 目录：

| 文件 | 功能 |
|------|------|
| `alipay-sdk-config.js` | 支付宝 SDK 配置，初始化客户端 |
| `pay.js` | 发起支付，支持 PC/WAP 自适应 |
| `query.js` | 交易查询 |
| `refund.js` | 退款接口 |
| `notify.js` | 支付异步通知回调 |
| `return.js` | 支付同步跳转回调 |

### 前端组件（2个变更）
| 文件 | 说明 |
|------|------|
| `src/components/payment/PayButton.tsx` | 支付按钮组件 |
| `src/pages/Diagnosis/DiagnosisPage.tsx` | 添加支付解锁功能 |

---

## 🔧 环境变量配置

复制 `.env.example` 为 `.env.local`，配置以下变量：

```bash
# 应用配置
ALIPAY_APP_ID=your_app_id
ALIPAY_PRIVATE_KEY=your_private_key
ALIPAY_PUBLIC_KEY=alipay_public_key

# 网关地址
# 沙箱环境
ALIPAY_GATEWAY=https://openapi-sandbox.dl.alipaydev.com/gateway.do
# 正式环境
# ALIPAY_GATEWAY=https://openapi.alipay.com/gateway.do

# 回调配置
ALIPAY_NOTIFY_DOMAIN=https://your-domain.com
ALIPAY_FRONTEND_URL=https://your-domain.com
```

### 本地开发配置
```bash
ALIPAY_APP_ID=2021000123456789
ALIPAY_GATEWAY=https://openapi-sandbox.dl.alipaydev.com/gateway.do
ALIPAY_NOTIFY_DOMAIN=http://localhost:3000
ALIPAY_FRONTEND_URL=http://localhost:5173
```

---

## 🚀 部署步骤

### Vercel 部署

1. **登录 Vercel Dashboard**
   - 进入项目 → Settings → Environment Variables

2. **添加环境变量**
   ```
   ALIPAY_APP_ID = your_app_id
   ALIPAY_PRIVATE_KEY = your_private_key
   ALIPAY_PUBLIC_KEY = your_alipay_public_key
   ALIPAY_GATEWAY = https://openapi.alipay.com/gateway.com
   ALIPAY_NOTIFY_DOMAIN = https://your-domain.com
   ALIPAY_FRONTEND_URL = https://your-domain.com
   ```

3. **Redeploy**
   - 触发新部署使环境变量生效

### 密钥格式要求

**私钥格式**：RSA2，必须是 PKCS8 格式
```
-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA...
...
-----END RSA PRIVATE KEY-----
```

**公钥格式**：
```
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhki...
...
-----END PUBLIC KEY-----
```

---

## 🧪 测试方法

### 沙箱环境测试

1. **打开辨证页面**，填写舌象信息并提交
2. **点击"解锁深度辨证"按钮**
3. **使用沙箱买家账号登录**：
   ```
   账号：ehndhv7644@sandbox.com
   密码：111111
   支付密码：111111
   ```
4. **完成支付**后，页面跳转回前端，显示已解锁状态

### 交易查询

支付后如需查询交易状态，可调用 `/api/alipay/query` 接口：
```bash
curl -X POST /api/alipay/query \
  -H "Content-Type: application/json" \
  -d '{"out_trade_no": "订单号"}'
```

---

## 🔄 沙箱→正式环境切换

### 1. 获取正式环境凭证
- 登录支付宝开放平台
- 创建应用并提交审核
- 获取正式 AppId 和密钥

### 2. 更新环境变量

```bash
# 沙箱 → 正式
ALIPAY_APP_ID=正式AppId
ALIPAY_GATEWAY=https://openapi.alipay.com/gateway.do
```

### 3. 配置回调地址
- 在支付宝开放平台配置应用回调 URL
- 确保 `ALIPAY_NOTIFY_DOMAIN` 指向正式域名

### 4. 测试验证
- 使用真实支付宝账号测试支付流程
- 验证异步通知是否正常接收

---

## 💡 PayButton 组件使用

### 基本用法
```tsx
import PayButton from '@/components/payment/PayButton';

// 默认配置
<PayButton />

// 自定义金额和标题
<PayButton amount={19.9} title="舌镜高级辨证方案" />

// 使用支付状态钩子
import { usePaymentStatus } from '@/components/payment/PayButton';

const MyComponent = () => {
  const isPaid = usePaymentStatus();
  // isPaid 会自动检测 URL 中的 paid_order 参数
};
```

### Props 接口
| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | string | "舌镜深度辨证" | 商品名称 |
| `amount` | number | 9.9 | 支付金额 |
| `onSuccess` | () => void | - | 支付成功回调 |
| `size` | 'small' \| 'medium' \| 'large' | 'medium' | 按钮尺寸 |
| `showPrice` | boolean | true | 是否显示价格 |

---

## 🔐 安全注意事项

1. **私钥保护**：私钥仅存储在服务端，勿泄露到前端
2. **回调验证**：notify.js 中需验证支付宝签名
3. **金额校验**：服务端校验订单金额，防止篡改
4. **幂等处理**：支付回调需处理重复通知

---

## 📝 更新日志

- **2024-05-16**: 初始集成完成
  - 支持 PC 端表单支付
  - 支持移动端 WAP 支付
  - 沙箱环境测试通过
