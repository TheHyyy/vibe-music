import { chromium } from 'playwright';
import * as fs from 'fs';

async function autoGetQQCookie() {
  console.log('🤖 自动获取QQ音乐Cookie\n');
  console.log('启动浏览器...');
  
  const browser = await chromium.launch({ 
    headless: false,  // 显示浏览器，用户可以扫码登录
    slowMo: 100,
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  
  const page = await context.newPage();
  
  console.log('打开QQ音乐...');
  await page.goto('https://y.qq.com/');
  await page.waitForLoadState('networkidle');
  
  console.log('\n请在浏览器中登录QQ音乐（扫码或账号密码）');
  console.log('登录成功后，等待页面跳转...\n');
  
  // 等待登录成功（检测URL变化或特定元素）
  await page.waitForURL(/y.qq.com/, { timeout: 300000 }); // 5分钟超时
  
  // 等待一下确保登录完成
  await page.waitForTimeout(3000);
  
  console.log('检测到登录成功，正在获取Cookie...');
  
  // 获取所有Cookie
  const cookies = await context.cookies();
  const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
  
  console.log(`\n✅ 获取到Cookie（${cookies.length}个）`);
  console.log(`长度: ${cookieString.length} 字符\n`);
  
  // 保存到.env文件
  const envPath = '.env';
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
  }
  
  // 替换或添加QQ_COOKIE
  const lines = envContent.split('\n');
  let found = false;
  const newLines = lines.map(line => {
    if (line.startsWith('QQ_COOKIE=')) {
      found = true;
      return `QQ_COOKIE=${cookieString}`;
    }
    return line;
  });
  
  if (!found) {
    newLines.push(`QQ_COOKIE=${cookieString}`);
  }
  
  fs.writeFileSync(envPath, newLines.join('\n'));
  console.log('✅ Cookie已保存到 .env 文件');
  
  // 验证Cookie有效性
  console.log('\n验证Cookie有效性...');
  
  const testUrl = 'https://u.y.qq.com/cgi-bin/musicu.fcg';
  const testRes = await page.evaluate(async () => {
    const res = await fetch(testUrl + '?-=getplaysongvkey&g_tk=5381&loginUin=0&hostUin=0&format=json&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq.json&needNewCode=0&data=' + encodeURIComponent(JSON.stringify({
      req_0: {
        module: 'vkey.GetVkeyServer',
        method: 'CgiGetVkey',
        param: {
          filename: ['M5000039MnYb0qxYhV.mp3'],
          guid: '1234567890',
          songmid: ['0039MnYb0qxYhV'],
          songtype: [0],
          uin: '0',
          loginflag: 1,
          platform: '20',
        },
      },
      comm: { uin: 0, format: 'json', ct: 19, cv: 0 },
    })));
    return await res.json();
  });
  
  if (testRes?.req_0?.data?.midurlinfo?.[0]?.purl) {
    console.log('✅ Cookie有效！可以播放周杰伦歌曲');
  } else {
    console.log('⚠️  Cookie可能需要VIP权限');
  }
  
  console.log('\n关闭浏览器...');
  await browser.close();
  
  console.log('\n🎉 完成！请重启音乐服务：');
  console.log('  pkill -f "tsx watch src/index.ts"');
  console.log('  npm run dev\n');
}

autoGetQQCookie().catch(console.error);
