# 舌镜前端 - Vercel 部署说明

## 📦 部署状态

**状态**：✅ 已准备就绪  
**项目路径**：`./tongue-mirror-frontend/`  
**部署方式**：GitHub + Vercel 自动部署

---

## 🚀 快速开始

### 方式一：使用部署脚本（推荐）

```bash
cd tongue-mirror-frontend
bash deploy-to-vercel.sh
```

脚本会自动：
- ✅ 初始化 Git 仓库
- ✅ 配置 .gitignore
- ✅ 提交所有文件
- ✅ 推送到 GitHub（可选）

### 方式二：手动部署

1. **将项目推送到 GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/tongue-mirror-frontend.git
   git push -u origin main
   ```

2. **在 Vercel 导入项目**
   - 访问 https://vercel.com
   - 登录后点击 "Add New..." → "Project"
   - 选择导入舌镜前端仓库

3. **配置环境变量**
   - 在 Vercel 项目设置中添加：
     - `VITE_API_BASE_URL`: 你的后端API地址

4. **部署**
   - 点击 "Deploy" 按钮
   - 等待构建完成（约1-2分钟）
   - 获取访问地址

---

## 📁 部署相关文件

| 文件 | 说明 |
|-----|------|
| `vercel.json` | Vercel 配置文件 |
| `deploy-to-vercel.sh` | 一键部署脚本 |
| `.env.example` | 环境变量模板 |

---

## ⚙️ Vercel 配置

### Framework
Vite

### Build Command
```
npm run build
```

### Output Directory
```
dist
```

### 环境变量
| Name | Value |
|------|-------|
| `VITE_API_BASE_URL` | 你的后端API地址 |

---

## 🔧 API 配置

### vercel.json 中的 API 重写

如果你的后端 API 部署在其他地址，可以在 `vercel.json` 中配置重写规则：

```json
"rewrites": [
  {
    "source": "/api/(.*)",
    "destination": "https://your-actual-backend-api.com/api/$1"
  }
]
```

**注意**：请将 `https://your-actual-backend-api.com` 替换为你实际的后端API地址。

---

## 📖 详细文档

完整的部署指南和常见问题排查请查看：

- `舌镜前端Vercel部署指南.md`
- `舌镜前端部署检查清单.md`

---

## ❓ 常见问题

**Q: 部署失败怎么办？**  
A: 检查 Vercel 构建日志，常见问题包括：
- 环境变量未配置
- 构建命令错误
- 后端 API 不可用

**Q: 如何更新部署？**  
A: 只需推送代码到 GitHub，Vercel 会自动重新部署：
```bash
git add .
git commit -m "Update"
git push
```

**Q: 可以用自定义域名吗？**  
A: 可以！在 Vercel 项目 Settings → Domains 中添加自定义域名。

---

## 🎯 部署检查清单

- [ ] GitHub 仓库已创建
- [ ] 项目已推送到 GitHub
- [ ] Vercel 项目已导入
- [ ] 环境变量 `VITE_API_BASE_URL` 已配置
- [ ] 部署成功
- [ ] 功能测试通过

---

**有问题？** 查看详细部署指南或提交 Issue。
