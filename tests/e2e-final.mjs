import puppeteer from 'puppeteer';
const delay = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 15000 });
  await delay(2000);

  // 选特征
  for (const btn of await page.$$('button')) {
    const t = await btn.evaluate(el => el.textContent.trim());
    if (t === '淡红') { await btn.click(); await delay(200); break; }
  }
  for (const btn of await page.$$('button')) {
    const t = await btn.evaluate(el => el.textContent.trim());
    if (t === '白') { await btn.click(); await delay(200); break; }
  }
  for (const btn of await page.$$('button')) {
    const t = await btn.evaluate(el => el.textContent.trim());
    if (t === '薄') { await btn.click(); await delay(200); break; }
  }

  // 点辨证
  for (const btn of await page.$$('button')) {
    const t = await btn.evaluate(el => el.textContent.trim());
    if (t.includes('望诊') || t.includes('辨证')) { await btn.click(); break; }
  }
  await delay(12000);

  // 截三个tab
  const tabs = ['病机病理', '针方穴位', '生活调理'];
  for (let i = 0; i < tabs.length; i++) {
    await page.evaluate((tabName) => {
      const allBtns = document.querySelectorAll('button');
      for (const btn of allBtns) {
        if (btn.textContent.trim().includes(tabName)) { btn.click(); return; }
      }
    }, tabs[i]);
    await delay(1000);
    await page.screenshot({ path: `截图/望诊-tab${i+1}-${tabs[i]}.png` });
    console.log(`望诊tab${i+1} ${tabs[i]}`);
  }

  // 点问诊
  for (const btn of await page.$$('button')) {
    const t = await btn.evaluate(el => el.textContent.trim());
    if (t.includes('问诊') || t.includes('望问')) { await btn.click(); break; }
  }
  await delay(8000);
  await page.screenshot({ path: '截图/问诊-题目.png' });

  // 答题：用evaluate直接操作React状态
  console.log('开始答题...');
  for (let q = 0; q < 10; q++) {
    // 直接点击选项按钮
    const clicked = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        const classes = btn.className || '';
        if (classes.includes('bg-stone-50') || classes.includes('bg-gradient')) {
          // 问诊选项按钮
          const text = btn.textContent.trim();
          if (text.match(/^[A-D]\s/) || text.length > 5) {
            btn.click();
            return text.substring(0, 20);
          }
        }
      }
      return null;
    });
    console.log(`第${q+1}题: 选 "${clicked}"`);
    await delay(500);

    // 点下一题/完成分析
    const nextClicked = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        const text = btn.textContent.trim();
        if (text.includes('下一题') || text.includes('完成分析')) {
          if (!btn.disabled) { btn.click(); return text; }
        }
      }
      return null;
    });
    console.log(`  按钮: "${nextClicked}"`);
    
    if (!nextClicked) { console.log('无按钮，退出'); break; }
    if (nextClicked.includes('完成')) { console.log('最后一题已提交'); break; }
    await delay(1500);
  }

  // 等综合辨证生成
  console.log('等待综合辨证(15s)...');
  await delay(15000);
  await page.screenshot({ path: '截图/综合辨证-总览.png' });

  // 截综合辨证三个tab
  for (let i = 0; i < tabs.length; i++) {
    await page.evaluate((tabName) => {
      const allBtns = document.querySelectorAll('button');
      for (const btn of allBtns) {
        if (btn.textContent.trim().includes(tabName)) { btn.click(); return; }
      }
    }, tabs[i]);
    await delay(1000);
    await page.screenshot({ path: `截图/综合-tab${i+1}-${tabs[i]}.png` });
    console.log(`综合tab${i+1} ${tabs[i]}`);
  }

  // 内容检查
  const body = await page.evaluate(() => document.body.innerText);
  console.log('=== 综合辨证内容检查 ===');
  console.log('含病机:', body.includes('病机'));
  console.log('含主穴:', body.includes('主穴'));
  console.log('含配穴:', body.includes('配穴'));
  console.log('含调理:', body.includes('调理'));
  console.log('含针灸:', body.includes('针灸') || body.includes('针方'));
  console.log('含穴位:', body.includes('穴'));

  await browser.close();
  console.log('完成');
})();
