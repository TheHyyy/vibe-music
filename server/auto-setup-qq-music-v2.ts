import { chromium } from 'playwright';
import * as fs from 'fs';
import { spawn } from 'child_process';

async function autoSetup() {
  console.log('🎵 QQ音乐自动配置工具 v2\n');
  console.log('========================================\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--start-maximized'],
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    viewport: null,
  });
  
  const page = await context.newPage();
  
  console.log('打开QQ音乐...');
  await page.goto('https://y.qq.com/');
  
  console.log('\n========================================');
  console.log('⚠️  请在浏览器中完成登录');
  console.log('   登录成功后，脚本会自动继续');
  console.log('========================================\n');
  
  // 等待登录成功（检测关键Cookie）
  console.log('等待登录...');
  
  let loggedIn = false;
  let attempts = 0;
  const maxAttempts = 60; // 5分钟
  
  while (!loggedIn && attempts < maxAttempts) {
    await page.waitForTimeout(5000);
    
    const cookies = await context.cookies('https://y.qq.com');
    const hasUin = cookies.some(c => c.name === 'uin' || c.name === 'o_cookie');
    const hasKey = cookies.some(c => c.name === 'qqmusic_key' || c.name === 'qm_keyst');
    
    if (hasUin && hasKey) {
      loggedIn = true;
      console.log('✅ 检测到登录Cookie！');
    } else {
      attempts++;
      if (attempts % 6 === 0) {
        console.log(`   等待中... (${attempts * 5}秒)`);
      }
    }
  }
  
  if (!loggedIn) {
    console.log('⏱️  超时，请重新运行脚本');
    await browser.close();
    return;
  }
  
  // 等待一下确保所有Cookie都设置完成
  await page.waitForTimeout(3000);
  
  console.log('\n获取Cookie...');
  
  // 获取所有Cookie
  const cookies = await context.cookies('https://y.qq.com');
  const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
  
  console.log(`✅ 获取到 ${cookies.length} 个Cookie`);
  console.log(`   关键Cookie:`);
  cookies.forEach(c => {
    if (['uin', 'o_cookie', 'qqmusic_key', 'qm_keyst', 'psrf_qqopenid'].includes(c.name)) {
      console.log(`   - ${c.name}: ✅`);
    }
  });
  
  // 保存到.env文件
  const envPath = '.env';
  let envContent = fs.readFileSync(envPath, 'utf-8');
  
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
  console.log('\n✅ Cookie已保存\n');
  
  await browser.close();
  
  console.log('重启服务并验证...');
  
  // 重启服务
  spawn('pkill', ['-f', 'tsx watch src/index.ts']);
  await new Promise(r => setTimeout(r, 3000));
  
  const server = spawn('./node_modules/.bin/tsx', ['watch', 'src/index.ts'], {
    detached: true,
    stdio: 'ignore',
  });
  server.unref();
  
  await new Promise(r => setTimeout(r, 8000));
  
  // 完整验证
  console.log('\n验证周杰伦歌曲播放...\n');
  
  try {
    const axios = (await import('axios')).default;
    
    const testSongs = ['晴天', '七里香', '稻香'];
    
    for (const song of testSongs) {
      const searchRes = await axios.get(`http://localhost:3000/api/songs/search?q=周杰伦 ${song}&source=qq`);
      const first = searchRes.data?.data?.[0];
      
      if (first) {
        const urlRes = await axios.get(`http://localhost:3000/api/songs/url?id=${first.id}`);
        const playUrl = urlRes.data?.data?.url;
        
        if (playUrl) {
          try {
            const headRes = await axios.head(playUrl, { timeout: 5000 });
            console.log(`✅ ${song}: 可播放 (HTTP ${headRes.status})`);
          } catch (e) {
            console.log(`❌ ${song}: 链接失效`);
          }
        } else {
          console.log(`❌ ${song}: 无播放链接`);
        }
      }
      
      await new Promise(r => setTimeout(r, 500));
    }
    
    console.log('\n========================================');
    console.log('🎉 配置完成！');
    console.log('========================================\n');
    
  } catch (e: any) {
    console.log(`\n⚠️  验证失败: ${e.message}\n`);
  }
}

autoSetup().catch(e => {
  console.error('\n❌ 错误:', e.message);
  process.exit(1);
});
