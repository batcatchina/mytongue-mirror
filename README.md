# 舌诊辅助系统前端 (Tongue Mirror Frontend)

基于 React + TypeScript + Tailwind CSS 构建的中医舌诊辨证系统前端界面。

## 功能特性

- 🔍 **舌象特征采集**：支持舌色、舌形、舌苔、舌态等多维度特征输入
- 📊 **智能辨证分析**：基于结构化知识库进行加权评分和证型匹配
- 💉 **针灸选穴建议**：根据辨证结果推荐个性化针灸选穴方案
- 📋 **病例管理**：本地存储病例记录，支持查询和导出
- 📚 **中医知识库**：舌诊基础、证型辨析、针灸选穴等专业知识

## 技术栈

- **框架**: React 18 + TypeScript
- **路由**: React Router v6
- **状态管理**: Zustand
- **样式**: Tailwind CSS
- **构建工具**: Vite
- **HTTP客户端**: Axios
- **提示**: React Hot Toast

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:3000 查看应用。

### 生产构建

```bash
npm run build
```

## 项目结构

```
src/
├── components/          # 组件目录
│   ├── common/          # 通用组件（导航栏、状态栏）
│   ├── tongue-input/    # 舌象输入组件
│   └── result-display/  # 结果展示组件
├── pages/               # 页面目录
│   ├── Diagnosis/       # 舌诊辨证页面
│   ├── Cases/           # 病例管理页面
│   └── Knowledge/       # 知识库页面
├── services/            # API服务
├── stores/              # 状态管理
├── types/               # TypeScript类型定义
├── styles/              # 全局样式
└── App.tsx              # 应用入口
```

## 环境变量

创建 `.env` 文件配置API地址：

```env
VITE_API_BASE_URL=/api
```

## 接口对接

前端通过 `/api` 基础路径调用舌诊辨证技能API：

- `POST /api/diagnosis/analyze` - 提交辨证分析
- `POST /api/diagnosis/validate` - 验证输入特征
- `GET /api/diagnosis/modes` - 获取辨证模式选项
- `GET /api/acupoints/:name` - 获取穴位详情

## 中医风格设计

系统采用中医风格设计语言：

- **配色方案**: 以暖色调为主（赭石、丹红），配合绿色作为辅助色
- **字体选择**: 使用思源宋体作为标题字体，体现中医文化底蕴
- **视觉元素**: 融入传统中医符号和图标

## License

Private - All Rights Reserved

# Force redeploy Thu May 14 03:36:20 PM CST 2026
Trigger rebuild via local commit
