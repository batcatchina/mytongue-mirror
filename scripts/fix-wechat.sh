#!/bin/bash
# 修复微信WebView兼容性：去掉type="module"
INDEX_FILE="dist/index.html"
if [ -f "$INDEX_FILE" ]; then
  sed -i 's/type="module" crossorigin/defer/g' "$INDEX_FILE"
  echo "✅ 已修复微信WebView兼容性：type=module → defer"
fi
