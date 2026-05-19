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
  await page.screenshot({ path: '截图/tab0-望诊结果.png' });

  // 截图三个tab
  const tabs = ['病机病理', '针方穴位', '生活调理'];
  for (let i = 0; i < tabs.length; i++) {
    // 点击tab
    const clicked = await page.evaluate((tabName) => {
      const allBtns = document.querySelectorAll('button, [role=tab]');
      for (const btn of allBtns) {
        if (btn.textContent.trim().includes(tabName)) {
          btn.click();
          return true;
        }
      }
      return false;
    }, tabs[i]);
    await delay(1000);
    await page.screenshot({ path: `截图/tab${i+1}-${tabs[i]}.png` });
    console.log(`tab${i+1} ${tabs[i]}: clicked=${clicked}`);
  }

  // 点问诊
  for (const btn of await page.$$('button')) {
    const t = await btn.evaluate(el => el.textContent.trim());
    if (t.includes('问诊') || t.includes('望问')) { await btn.click(); break; }
  }
  await delay(8000);
  await page.screenshot({ path: '截图/tab4-问诊题.png' });

  // 用data-testid答题（Codex加的）
  let questionIdx = 0;
  for (let q = 0; q < 10; q++) {
    // 尝试data-testid
    let optClicked = false;
    const opt = await page.$('[data-testid="inquiry-option-0"]');
    if (opt) {
      await opt.click();
      optClicked = true;
      console.log(`第${q+1}题: testid选项`);
    } else {
      // fallback: 点选项按钮
      const optBtns = await page.$$('[class*=gradient] button, .space-y-3 button');
      if (optBtns.length > 0) {
        await optBtns[0].click();
        optClicked = true;
        console.log(`第${q+1}题: fallback选项`);
      }
    }
    await delay(500);

    // 点下一题/完成
    const nextBtn = await page.$('[data-testid="inquiry-next"]');
    if (nextBtn) {
      const disabled = await nextBtn.evaluate(el => el.disabled);
      if (!disabled) {
        await nextBtn.click();
        console.log(`第${q+1}题: testid下一题`);
      } else {
        console.log(`第${q+1}题: 按钮disabled，选项可能没选中`);
        // 重新尝试选中选项
      }
    } else {
      // fallback
      for (const btn of await page.$$('button')) {
        const t = await btn.evaluate(el => el.textContent.trim());
        if (t.includes('下一') || t.includes('完成') || t.includes('提交')) {
          const dis = await btn.evaluate(el => el.disabled);
          if (!dis) { await btn.click(); console.log(`第${q+1}题: fallback按钮 "${t}"`); break; }
        }
      }
    }
    await delay(1500);

    // 检查是否问诊已结束
    const body = await page.evaluate(() => document.body.innerText);
    if (!body.includes('下一题') && !body.includes('完成分析') && !body.includes('第')) {
      console.log('问诊已结束');
      break;
    }
  }

  await delay(15000);
  await page.screenshot({ path: '截图/tab5-综合辨证.png' });

  // 截综合辨证三个tab
  for (let i = 0; i < tabs.length; i++) {
    await page.evaluate((tabName) => {
      const allBtns = document.querySelectorAll('button, [role=tab]');
      for (const btn of allBtns) {
        if (btn.textContent.trim().includes(tabName)) { btn.click(); return; }
      }
    }, tabs[i]);
    await delay(1000);
    await page.screenshot({ path: `截图/tab${i+6}-综合${tabs[i]}.png` });
    console.log(`综合tab${i+1} ${tabs[i]}`);
  }

  // 检查内容
  const body = await page.evaluate(() => document.body.innerText);
  console.log('=== 内容检查 ===');
  console.log('含病机:', body.includes('病机'));
  console.log('含主穴:', body.includes('主穴'));
  console.log('含配穴:', body.includes('配穴'));
  console.log('含调理:', body.includes('调理'));

  await browser.close();
  console.log('完成');
})();
