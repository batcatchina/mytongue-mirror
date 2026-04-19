#!/bin/bash

# 舌镜前端项目 GitHub + Vercel 部署脚本
# 使用方法: bash deploy-to-vercel.sh

echo "=========================================="
echo "舌镜前端部署到 Vercel"
echo "=========================================="
echo ""

# 检查是否安装了 Git
if ! command -v git &> /dev/null; then
    echo "❌ 错误: Git 未安装"
    echo "请先安装 Git: https://git-scm.com/downloads"
    exit 1
fi

# 检查是否安装了 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: Node.js 未安装"
    echo "请先安装 Node.js: https://nodejs.org/"
    exit 1
fi

# 进入项目目录
cd tongue-mirror-frontend || exit

echo "✅ 检查项目目录..."
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 未找到 package.json"
    echo "请确保在项目根目录运行此脚本"
    exit 1
fi

echo "✅ 检查项目配置文件..."

# 检查必需文件
required_files=(
    "vercel.json"
    "vite.config.ts"
    "package.json"
    "tsconfig.json"
    "tailwind.config.js"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "⚠️ 警告: $file 不存在"
    else
        echo "  ✓ $file"
    fi
done

echo ""
echo "=========================================="
echo "GitHub 仓库设置"
echo "=========================================="
echo ""

# 检查是否已经是 Git 仓库
if [ ! -d ".git" ]; then
    echo "📦 初始化 Git 仓库..."
    git init
    git branch -M main
    echo ""
fi

# 检查远程仓库
remote=$(git remote get-url origin 2>/dev/null)
if [ -z "$remote" ]; then
    echo ""
    echo "请在 GitHub 上创建仓库，然后提供仓库 URL"
    echo "格式: https://github.com/USERNAME/REPO_NAME.git"
    echo ""
    read -p "输入 GitHub 仓库 URL: " repo_url
    
    if [ ! -z "$repo_url" ]; then
        git remote add origin "$repo_url"
        echo "✅ 已添加远程仓库: $repo_url"
    fi
else
    echo "📍 远程仓库已配置: $remote"
fi

echo ""
echo "=========================================="
echo "代码提交"
echo "=========================================="
echo ""

# 添加所有文件（排除 node_modules 和 dist）
echo "📝 添加文件到 Git..."
cat > .gitignore << 'EOF'
node_modules/
dist/
.env
.env.local
.env.*.local
.DS_Store
*.log
EOF

git add .
git status

echo ""
read -p "是否提交代码？(y/n): " confirm
if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
    read -p "输入提交信息: " commit_msg
    if [ -z "$commit_msg" ]; then
        commit_msg="Initial commit: 舌镜前端项目"
    fi
    git commit -m "$commit_msg"
    echo "✅ 代码已提交"
    
    # 推送到 GitHub
    read -p "是否推送到 GitHub？(y/n): " push_confirm
    if [ "$push_confirm" = "y" ] || [ "$push_confirm" = "Y" ]; then
        echo "🚀 推送到 GitHub..."
        git push -u origin main
        echo "✅ 已推送到 GitHub"
    fi
fi

echo ""
echo "=========================================="
echo "下一步操作"
echo "=========================================="
echo ""
echo "🎉 项目已准备就绪！"
echo ""
echo "接下来请："
echo ""
echo "1️⃣  访问 https://vercel.com"
echo "2️⃣  使用 GitHub 账号登录"
echo "3️⃣  点击 'Add New...' → 'Project'"
echo "4️⃣  导入你的 GitHub 仓库"
echo "5️⃣  配置环境变量："
echo "    • Name: VITE_API_BASE_URL"
echo "    • Value: 你的后端API地址"
echo "6️⃣  点击 'Deploy' 开始部署"
echo "7️⃣  等待约1-2分钟，获取访问地址"
echo ""
echo "📖 详细文档：查看 '舌镜前端Vercel部署指南.md'"
echo ""
echo "=========================================="
