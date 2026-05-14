const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox']});
  const page = await browser.newPage();
  const errors = [];
  page.on('console', msg => { if(msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push('PAGE_ERROR: ' + err.message));
  
  await page.goto('http://localhost:4173/', {waitUntil: 'networkidle0'});
  console.log('Page loaded');
  
  // Click 辨证 tab
  await page.evaluate(() => {
    const tabs = document.querySelectorAll('button');
    for(const t of tabs) { if(t.textContent?.includes('辨证')) t.click(); }
  });
  await new Promise(r => setTimeout(r, 1000));
  
  // Select tongue color 淡红
  await page.evaluate(() => {
    const spans = document.querySelectorAll('span, div, button');
    for(const s of spans) { if(s.textContent?.trim() === '淡红') { s.click(); break; } }
  });
  await new Promise(r => setTimeout(r, 500));
  
  // Select coating color 薄白
  await page.evaluate(() => {
    const spans = document.querySelectorAll('span, div, button');
    for(const s of spans) { if(s.textContent?.trim() === '薄白') { s.click(); break; } }
  });
  await new Promise(r => setTimeout(r, 500));
  
  // Click start diagnosis
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for(const b of btns) { if(b.textContent?.includes('开始辨证')) { b.click(); break; } }
  });
  await new Promise(r => setTimeout(r, 5000));
  
  await page.screenshot({path: '/root/mytongue-mirror/test-result.png', fullPage: true});
  console.log('Screenshot saved');
  
  // Check for 想更准 button and click it
  const hasRefineBtn = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for(const b of btns) { if(b.textContent?.includes('想更准')) { b.click(); return true; } }
    return false;
  });
  console.log('Has refine button:', hasRefineBtn);
  
  await new Promise(r => setTimeout(r, 8000));
  await page.screenshot({path: '/root/mytongue-mirror/test-inquiry.png', fullPage: true});
  console.log('Inquiry screenshot saved');
  
  if(errors.length > 0) {
    console.log('ERRORS found:', errors.slice(0,10).join('\n'));
  } else {
    console.log('No errors');
  }
  
  // Check if page is white (blank body)
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('Page text length:', bodyText.length);
  if(bodyText.length < 10) console.log('WHITE SCREEN DETECTED!');
  
  await browser.close();
})().catch(e => console.error('Test error:', e.message));
