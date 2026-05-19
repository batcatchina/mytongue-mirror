import puppeteer from 'puppeteer';
const delay = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 15000 });
  await delay(2000);

  // 先解锁 - 设置localStorage
  await page.evaluate(() => {
    localStorage.setItem('tongue_diagnosis_unlocked', 'true');
    localStorage.setItem('tongue_diagnosis_unlocked_global', 'true');
  });
  console.log('已设置localStorage解锁');

  // 刷新生效
  await page.reload({ waitUntil: 'networkidle2' });
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
  await page.screenshot({ path: '截图/解锁1-望诊结果.png' });

  // 检查解锁状态
  const unlocked = await page.evaluate(() => localStorage.getItem('tongue_diagnosis_unlocked_global'));
  console.log('解锁状态:', unlocked);

  // 截三个tab
  const tabs = ['病机病理', '针方穴位', '生活调理'];
  for (let i = 0; i < tabs.length; i++) {
    await page.evaluate((tabName) => {
      const allBtns = document.querySelectorAll('button, [role=tab]');
      for (const btn of allBtns) {
        if (btn.textContent.trim().includes(tabName)) { btn.click(); return; }
      }
    }, tabs[i]);
    await delay(1000);
    await page.screenshot({ path: `截图/解锁tab${i+1}-${tabs[i]}.png` });
  }

  // 检查内容
  const body = await page.evaluate(() => document.body.innerText);
  console.log('=== 望诊内容检查 ===');
  console.log('含病机:', body.includes('病机'));
  console.log('含主穴:', body.includes('主穴'));
  console.log('含配穴:', body.includes('配穴'));
  console.log('含调理:', body.includes('调理'));
  console.log('含解锁提示:', body.includes('解锁') || body.includes('🔒'));

  await browser.close();
  console.log('完成');
})();
