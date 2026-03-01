import { chromium } from 'playwright';

async function test() {
  console.log('测试Playwright...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://www.baidu.com');
  const title = await page.title();
  
  console.log('页面标题:', title);
  console.log('✅ Playwright工作正常');
  
  await browser.close();
}

test().catch(e => {
  console.error('❌ 错误:', e.message);
  process.exit(1);
});
