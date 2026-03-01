import { chromium } from 'playwright';
import * as fs from 'fs';
import { spawn } from 'child_process';

async function autoSetup() {
  console.log('🎵 QQ音乐自动配置工具\n');
  console.log('========================================\n');
  
  // 步骤1: 打开浏览器并等待登录
  console.log('步骤1/4: 启动浏览器...');
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--start-maximized'],
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: null,
  });
  
  const page = await context.newPage();
  
  console.log('✅ 浏览器已启动\n');
  
  console.log('步骤2/4: 打开QQ音乐登录页面...');
  await page.goto('https://y.qq.com/');
  
  console.log('✅ 页面已加载\n');
  console.log('========================================');
  console.log('⚠️  请在浏览器中登录QQ音乐');
  console.log('   - 可以扫码登录');
  console.log('   - 或者使用QQ号登录');
  console.log('========================================\n');
  
  // 等待登录成功（检测页面元素）
  try {
    // 等待登录后的用户头像出现
    await page.waitForSelector('.header__login', { state: 'hidden', timeout: 300000 });
    console.log('✅ 检测到登录成功！\n');
  } catch (e) {
    console.log('⏱️  等待登录中...（最多5分钟）\n');
  }
  
  // 等待一下确保Cookie完全设置
  await page.waitForTimeout(3000);
  
  console.log('步骤3/4: 获取并保存Cookie...');
  
  // 获取所有Cookie
  const cookies = await context.cookies('https://y.qq.com');
  const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
  
  console.log(`✅ 获取到 ${cookies.length} 个Cookie`);
  console.log(`   总长度: ${cookieString.length} 字符\n`);
  
  // 保存到.env文件
  const envPath = '.env';
  let envContent = fs.readFileSync(envPath, 'utf-8');
  
  // 替换QQ_COOKIE
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
  console.log('✅ Cookie已保存到 .env 文件\n');
  
  // 关闭浏览器
  await browser.close();
  
  console.log('步骤4/4: 验证配置...');
  
  // 重启服务
  console.log('重启音乐服务...');
  spawn('pkill', ['-f', 'tsx watch src/index.ts']);
  await new Promise(r => setTimeout(r, 2000));
  
  const server = spawn('./node_modules/.bin/tsx', ['watch', 'src/index.ts'], {
    detached: true,
    stdio: 'ignore',
  });
  server.unref();
  
  await new Promise(r => setTimeout(r, 5000));
  
  // 验证播放
  console.log('验证周杰伦歌曲播放...');
  
  try {
    const axios = (await import('axios')).default;
    
    // 搜索
    const searchRes = await axios.get('http://localhost:3000/api/songs/search?q=周杰伦 晴天&source=qq');
    const song = searchRes.data?.data?.[0];
    
    if (song) {
      console.log(`   找到歌曲: ${song.title} - ${song.artist}`);
      
      // 获取播放链接
      const urlRes = await axios.get(`http://localhost:3000/api/songs/url?id=${song.id}`);
      const playUrl = urlRes.data?.data?.url;
      
      if (playUrl) {
        // 验证链接有效性
        const headRes = await axios.head(playUrl, { timeout: 5000 });
        
        if (headRes.status === 200) {
          console.log('✅ 播放验证成功！\n');
          console.log('========================================');
          console.log('🎉 配置完成！现在可以播放周杰伦歌曲了');
          console.log('========================================\n');
        } else {
          console.log('⚠️  链接可访问但状态异常\n');
        }
      } else {
        console.log('⚠️  无法获取播放链接（可能需要VIP）\n');
      }
    }
  } catch (e: any) {
    console.log(`⚠️  验证失败: ${e.message}\n`);
  }
}

autoSetup().catch(e => {
  console.error('\n❌ 错误:', e.message);
  process.exit(1);
});
