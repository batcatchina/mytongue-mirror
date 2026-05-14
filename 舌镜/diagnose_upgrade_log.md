# 舌镜辨证推理引擎升级日志 v3.0

## 版本信息
- **版本号**: v3.0.0-方案A
- **升级日期**: 2026-05-14
- **升级类型**: 推理层替换（TS规则引擎 → DeepSeek API）
- **架构修正**: 知识文件外部化
- **状态**: ✅ 已完成

---

## 升级概述

### 背景
原舌镜应用使用4层本地TypeScript推理引擎（Layer1-4），存在以下问题：
- 规则硬编码，扩展性差
- 复杂证型识别能力有限
- 无法利用渊索已学习的舌镜辨证知识

### 升级目标
将推理层从本地TS规则引擎替换为DeepSeek API调用，让AI进行辨证推理。

### 架构修正（v3.0.1）
- **问题**：系统Prompt硬编码在diagnose.js中，不利于知识迭代
- **方案**：知识文件外部化到 `./舌镜/diagnose_knowledge.md`
- **效果**：每日学习产出新规则后，只需更新knowledge文件，推理引擎自动进化

---

## 变更文件清单

| 文件路径 | 变更类型 | 说明 |
|---------|---------|------|
| `/api/tongue-ai/diagnose.js` | ✏️ 修改 | 知识文件外部化 |
| `/舌镜/diagnose_knowledge.md` | 🆕 新增 | 外部知识库 |
| `/src/pages/Diagnosis/DiagnosisPage.tsx` | ✏️ 修改 | 前端调用新API |
| `/舌镜/backup/DiagnosisPage.tsx.v2.0.bak` | 💾 备份 | 原前端代码备份 |
| `/舌镜/backup/diagnosisEngine.ts.v2.0.bak` | 💾 备份 | 原规则引擎备份 |

---

## 核心文件说明

### 1. 知识文件: `/舌镜/diagnose_knowledge.md`

**功能**：
- 舌镜辨证推理引擎的系统Prompt知识库
- 包含完整的辨证知识体系（四层推理、舌色/舌形/苔色/舌态规则）
- 包含P0强制规则（60岁以上寒湿必须补阳）
- 包含配穴原则和传变规律
- 包含输出格式规范和辨证示例

**知识更新流程**：
```
渊索学习新规则 → 编辑 diagnose_knowledge.md → 推理引擎自动进化
```

**文件结构**：
```markdown
# 舌镜辨证推理知识库 v3.0
## 角色定位
## 舌镜辨证体系（四层推理、舌色/舌形/苔色/舌态规则）
## ⚠️ P0规则（年龄必填、60+补阳、禁止词过滤）
## 传变规律（五脏传变类型、常见路径）
## 配穴原则（基本配穴、特定穴应用）
## 输出格式规范（JSON结构、注意事项）
## 辨证示例
```

### 2. 推理API: `/api/tongue-ai/diagnose.js`

**功能**：
- 接收前端舌象特征JSON
- 从 `diagnose_knowledge.md` 加载系统Prompt
- 调用DeepSeek API进行辨证推理
- 应用P0规则（60岁以上寒湿必须补阳）

**关键代码**：
```javascript
// 启动时加载知识库
const SYSTEM_PROMPT = loadKnowledgePrompt();

function loadKnowledgePrompt() {
  const possiblePaths = [
    join(process.cwd(), '舌镜', 'diagnose_knowledge.md'),
    join(process.cwd(), '..', '舌镜', 'diagnose_knowledge.md'),
    '/root/mytongue-mirror/舌镜/diagnose_knowledge.md',
  ];
  // ... 尝试读取知识文件
}

// 返回响应
return res.json({
  success: true,
  engine: 'deepseek-v3.0',
  knowledge_version: '3.0',
  data: diagnosisResult,
});
```

### 3. 前端: `/src/pages/Diagnosis/DiagnosisPage.tsx`

**改动点**：
1. 版本标记改为 `v3.0.0 方案A-DeepSeek推理`
2. `useLocalEngine` 默认值从 `true` 改为 `false`
3. 新增 `diagnoseWithDeepSeek()` 函数
4. 修改 `handleSubmit()` 中的逻辑分支

---

## v3.0 与 v2.0 差异对比

| 对比项 | v2.0（本地引擎） | v3.0（DeepSeek API） |
|-------|----------------|---------------------|
| 推理方式 | 4层TS规则硬编码 | DeepSeek V4大模型推理 |
| 辨证知识 | 内置规则表 | 外部知识文件（可迭代） |
| 知识更新 | 需改代码 | 修改knowledge文件即可 |
| 复杂证型 | 规则覆盖有限 | 泛化能力强 |
| P0规则 | 硬编码 | 知识文件中定义 |
| 响应速度 | 本地计算，毫秒级 | API调用，1-2秒 |

---

## 测试结果

### 测试用例1：65岁/肝胆湿热
```
输入：舌红、苔黄厚、齿痕、65岁、口苦胁痛
主证: 肝胆湿热证
置信度: 0.88
脏腑定位: 肝（主）、胆、脾（兼）
主穴: 太冲、阳陵泉、足三里、关元、命门、肾俞
P0规则: ✅ 补阳穴位已自动添加
```

### 测试用例2：30岁/平人舌象
```
输入：淡红舌、薄白苔、30岁
主证: 平人舌象
置信度: 0.95
主穴: 足三里（保健要穴）
结论: 正确识别健康状态
```

---

## 回滚方案

### 方案A：快速回滚（仅切换引擎）
如需切回v2.0本地规则引擎：

```typescript
// 修改 src/pages/Diagnosis/DiagnosisPage.tsx
const [useLocalEngine, setUseLocalEngine] = useState(true); // 改回true
```

### 方案B：完全回滚（恢复备份）
```bash
# 恢复前端文件
cp /root/mytongue-mirror/舌镜/backup/DiagnosisPage.tsx.v2.0.bak \
   /root/mytongue-mirror/src/pages/Diagnosis/DiagnosisPage.tsx

# 恢复规则引擎
cp /root/mytongue-mirror/舌镜/backup/diagnosisEngine.ts.v2.0.bak \
   /root/mytongue-mirror/src/services/diagnosisEngine.ts
```

### 保留文件（以备不时之需）
- `/api/tongue-ai/diagnose.js` - 保留，不影响本地引擎
- `/舌镜/diagnose_knowledge.md` - 保留，v3.1可能用上

---

## 后续优化建议

1. **知识版本管理**：knowledge文件加版本号，API返回knowledge_version
2. **增量更新**：支持知识文件热加载，无需重启服务
3. **AB测试**：可同时运行v2.0和v3.0，对比辨证准确率
4. **错误降级**：API超时/失败时自动降级到本地引擎

---

## 文件路径索引

| 用途 | 路径 |
|------|------|
| 推理API | `/root/mytongue-mirror/api/tongue-ai/diagnose.js` |
| 知识文件 | `/root/mytongue-mirror/舌镜/diagnose_knowledge.md` |
| 升级日志 | `/root/mytongue-mirror/舌镜/diagnose_upgrade_log.md` |
| 前端入口 | `/root/mytongue-mirror/src/pages/Diagnosis/DiagnosisPage.tsx` |
| v2.0备份 | `/root/mytongue-mirror/舌镜/backup/` |

---

## 变更记录

| 日期 | 版本 | 变更内容 | 作者 |
|-----|------|---------|------|
| 2026-05-14 | v3.0.0 | 初始升级：推理层替换为DeepSeek API | 渊索(SubAgent) |
| 2026-05-14 | v3.0.1 | 架构修正：知识文件外部化（diagnose_knowledge.md） | 渊索(SubAgent) |
| 2026-05-04 | v2.0 | 4层本地规则引擎上线 | - |

---

*本文档由SubAgent自动生成，如有问题请联系主Agent*
