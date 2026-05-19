import puppeteer from 'puppeteer';
const delay = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 15000 });
  await delay(2000);

  const clickBtn = async (target) => {
    for (const btn of await page.$$('button')) {
      const text = await btn.evaluate(el => el.textContent.trim());
      if (text === target) { await btn.click(); await delay(200); return true; }
    }
    return false;
  };
  await clickBtn('淡红');
  await clickBtn('白');
  await clickBtn('薄');

  // 点辨证
  for (const btn of await page.$$('button')) {
    const text = await btn.evaluate(el => el.textContent.trim());
    if (text.includes('望诊') || text.includes('辨证')) { await btn.click(); break; }
  }
  await delay(12000);
  await page.screenshot({ path: '截图/完整2-望诊结果.png' });

  // 点问诊
  for (const btn of await page.$$('button')) {
    const text = await btn.evaluate(el => el.textContent.trim());
    if (text.includes('问诊') || text.includes('望问')) { await btn.click(); break; }
  }
  await delay(8000);
  await page.screenshot({ path: '截图/完整3-问诊第1题.png' });

  // 逐题答题
  for (let q = 0; q < 10; q++) {
    // 点选项
    const labels = await page.$$('label');
    if (labels.length > 0) await labels[0].click();
    await delay(500);

    // 找按钮
    let clicked = false;
    const btns = await page.$$('button');
    for (const btn of btns) {
      const t = await btn.evaluate(el => el.textContent.trim());
      if (t.includes('提交') || t.includes('完成')) {
        await btn.click();
        console.log('第' + (q+1) + '题: 提交');
        clicked = true;
        break;
      }
    }
    if (!clicked) {
      for (const btn of btns) {
        const t = await btn.evaluate(el => el.textContent.trim());
        if (t.includes('下一') || t.includes('继续')) {
          await btn.click();
          console.log('第' + (q+1) + '题: 下一题');
          clicked = true;
          break;
        }
      }
    }
    if (!clicked) { console.log('第' + (q+1) + '题: 无按钮'); break; }
    await delay(2000);

    // 检查是否还在问诊中
    const body = await page.evaluate(() => document.body.innerText);
    if (!body.includes('下一题') && !body.includes('提交')) {
      console.log('问诊已结束');
      break;
    }
  }

  await delay(15000);
  await page.screenshot({ path: '截图/完整4-综合辨证方案.png' });

  const body = await page.evaluate(() => document.body.innerText);
  console.log('含病机:', body.includes('病机'));
  console.log('含配穴:', body.includes('配穴') || body.includes('主穴'));
  console.log('含调理:', body.includes('调理'));

  await browser.close();
})();
