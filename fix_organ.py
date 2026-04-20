import re

# 读取文件
with open('src/services/api.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 在病机解析后添加脏腑定位解析
old_text = '''  const pathogenesis = pathogenesisMultiMatch 
    ? pathogenesisMultiMatch[1].trim().replace(/\\n+/g, ' ')  // 多行合并为单行
    : (pathogenesisMatch ? pathogenesisMatch[1].trim() : '');

  const evidenceMatches'''

new_text = '''  const pathogenesis = pathogenesisMultiMatch 
    ? pathogenesisMultiMatch[1].trim().replace(/\\n+/g, ' ')  // 多行合并为单行
    : (pathogenesisMatch ? pathogenesisMatch[1].trim() : '');

  // 脏腑定位解析 - 同时支持粗体和非粗体格式
  const organMatch = markdown.match(/\\*\\*脏腑定位\\*\\*[：:]\\s*([^\\n]+)/)
    || markdown.match(/脏腑定位[：:]\\s*([^\\n]+)/);
  const organLocation = organMatch 
    ? organMatch[1].split(/[、,，\\s]+/).filter((s: string) => s.trim()) 
    : [];

  const evidenceMatches'''

content = content.replace(old_text, new_text)

# 使用解析的organLocation
content = content.replace('organLocation: [],', 'organLocation,')

# 写回文件
with open('src/services/api.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("修复完成")
