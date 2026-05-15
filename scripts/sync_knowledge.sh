#!/bin/bash
# 舌镜知识同步脚本
# 检测知识文件变更并记录日志
# 后续可扩展：调用Coze API更新Bot知识库

KNOWLEDGE_DIR="/root/mytongue-mirror/舌镜"
LOG_FILE="${KNOWLEDGE_DIR}/diagnose_upgrade_log.md"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "=== 知识同步检查 ${TIMESTAMP} ==="

# 检查知识文件是否存在
if [ -f "${KNOWLEDGE_DIR}/diagnose_knowledge.md" ]; then
    MD5=$(md5sum "${KNOWLEDGE_DIR}/diagnose_knowledge.md" | cut -d' ' -f1)
    LINES=$(wc -l < "${KNOWLEDGE_DIR}/diagnose_knowledge.md")
    echo "知识文件: ${LINES}行, MD5=${MD5}"
else
    echo "❌ 知识文件不存在"
    exit 1
fi

# 记录同步日志
echo "" >> "${LOG_FILE}"
echo "## ${TIMESTAMP}" >> "${LOG_FILE}"
echo "- 行数: ${LINES}" >> "${LOG_FILE}"
echo "- MD5: ${MD5}" >> "${LOG_FILE}"
echo "- 状态: 已检测" >> "${LOG_FILE}"

echo "✅ 同步日志已记录"
echo "TODO: 调用Coze API更新Bot知识库（待实现）"
