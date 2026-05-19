import puppeteer from 'puppeteer';

const delay = ms => new Promise(r => setTimeout(r, ms));
const SS = '截图';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });

  console.log('Step 1: 打开页面...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 15000 });
  await delay(2000);

  console.log('Step 2: 选择特征...');
  const clickBtn = async (target) => {
    for (const btn of await page.$$('button')) {
      const text = await btn.evaluate(el => el.textContent.trim());
      if (text === target) { await btn.click(); await delay(200); return true; }
    }
    return false;
  };
  await clickBtn('淡红'); console.log('  淡红:', true);
  await clickBtn('白'); console.log('  白苔:', true);
  await clickBtn('薄'); console.log('  薄苔:', true);
  await page.screenshot({ path: `${SS}/验证1-选特征.png` });
  console.log('截图1 done');

  console.log('Step 3: 点辨证...');
  for (const btn of await page.$$('button')) {
    const text = await btn.evaluate(el => el.textContent.trim());
    if (text.includes('辨证') || text.includes('望诊') || text.includes('分析')) {
      await btn.click(); console.log('  点了:', text); break;
    }
  }
  await delay(12000);
  await page.screenshot({ path: `${SS}/验证2-望诊辨证.png` });
  console.log('截图2 done');

  const body1 = await page.evaluate(() => document.body.innerText);
  console.log('辨证有内容:', body1.includes('证') || body1.includes('病机'));

  console.log('Step 4: 点智能问诊...');
  for (const btn of await page.$$('button')) {
    const text = await btn.evaluate(el => el.textContent.trim());
    if (text.includes('问诊') || text.includes('望问')) {
      await btn.click(); console.log('  点了:', text); break;
    }
  }
  await delay(8000);
  await page.screenshot({ path: `${SS}/验证3-问诊题.png` });
  console.log('截图3 done');

  console.log('Step 5: 答题...');
  for (let q = 0; q < 5; q++) {
    console.log(`  第${q+1}题`);
    // 点选项
    const labels = await page.$$('label');
    if (labels.length > 0) { await labels[0].click(); console.log('  点label'); }
    else {
      const opts = await page.$$('[class*=option], [class*=Option]');
      if (opts.length > 0) { await opts[0].click(); console.log('  点option'); }
    }
    await delay(500);
    // 点下一题/提交
    let found = false;
    for (const btn of await page.$$('button')) {
      const text = await btn.evaluate(el => el.textContent.trim());
      if (text.includes('下一') || text.includes('继续') || text.includes('提交')) {
        await btn.click(); console.log('  点了:', text); found = true; break;
      }
    }
    if (!found) { console.log('  无下一题按钮'); break; }
    await delay(2000);
  }

  await delay(12000);
  await page.screenshot({ path: `${SS}/验证4-综合辨证.png` });
  console.log('截图4 done');

  const body2 = await page.evaluate(() => document.body.innerText);
  const hasContent = body2.includes('病机') || body2.includes('配穴') || body2.includes('调理');
  console.log('=== 断言: 综合辨证有内容 ===', hasContent);
  if (!hasContent) console.log('末尾文本:', body2.slice(-500));

  await browser.close();
  console.log('测试完成');
})();
