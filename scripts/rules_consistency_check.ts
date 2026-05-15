/**
 * 舌镜规则一致性校验
 * 对比 diagnose_knowledge.md 和 diagnosisRules.ts 的规则覆盖情况
 * 用法：npx ts-node scripts/rules_consistency_check.ts
 */
import * as fs from 'fs';
import * as path from 'path';

const KNOWLEDGE_FILE = path.join(__dirname, '../舌镜/diagnose_knowledge.md');
const RULES_FILE = path.join(__dirname, '../src/services/diagnosisRules.ts');

function main() {
  console.log('=== 舌镜规则一致性校验 ===\n');

  // 读取知识文件
  let knowledgeContent = '';
  try {
    knowledgeContent = fs.readFileSync(KNOWLEDGE_FILE, 'utf-8');
    console.log(`✅ 知识文件: ${KNOWLEDGE_FILE} (${knowledgeContent.length} 字符)`);
  } catch {
    console.log(`❌ 知识文件不存在: ${KNOWLEDGE_FILE}`);
    console.log('   提示：知识文件可能在.gitignore中，请确认本地文件存在');
    return;
  }

  // 读取规则文件
  let rulesContent = '';
  try {
    rulesContent = fs.readFileSync(RULES_FILE, 'utf-8');
    console.log(`✅ 规则文件: ${RULES_FILE} (${rulesContent.length} 字符)`);
  } catch {
    console.log(`❌ 规则文件不存在: ${RULES_FILE}`);
    return;
  }

  // 提取证型关键词
  const syndromeKeywords = ['湿热', '寒湿', '阴虚', '气虚', '肝郁', '血瘀', '痰湿', '阳虚', '脾虚', '肾虚', '心气虚'];
  
  console.log('\n--- 证型覆盖校验 ---');
  syndromeKeywords.forEach(keyword => {
    const inKnowledge = knowledgeContent.includes(keyword);
    const inRules = rulesContent.includes(keyword);
    if (inKnowledge && inRules) {
      console.log(`✅ ${keyword}: 知识文件✓ 规则文件✓`);
    } else if (inKnowledge && !inRules) {
      console.log(`⚠️  ${keyword}: 知识文件✓ 规则文件✗ ← 需同步`);
    } else if (!inKnowledge && inRules) {
      console.log(`⚠️  ${keyword}: 知识文件✗ 规则文件✓ ← 需补充知识`);
    } else {
      console.log(`❌ ${keyword}: 两处均无`);
    }
  });

  // P0规则覆盖
  const p0Keywords = ['补阳', '孕妇', '禁忌', '急救', '中风', '心绞痛'];
  console.log('\n--- P0规则覆盖校验 ---');
  p0Keywords.forEach(keyword => {
    const inKnowledge = knowledgeContent.includes(keyword);
    const inRules = rulesContent.includes(keyword);
    if (inKnowledge && inRules) {
      console.log(`✅ P0-${keyword}: 知识文件✓ 规则文件✓`);
    } else if (inKnowledge) {
      console.log(`🔴 P0-${keyword}: 知识文件✓ 规则文件✗ ← 必须同步`);
    } else {
      console.log(`🔴 P0-${keyword}: 知识文件✗ ← 缺失`);
    }
  });

  console.log('\n=== 校验完成 ===');
}

main();
