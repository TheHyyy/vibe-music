import { chromium, Browser, BrowserContext, Page } from 'playwright';
import * as fs from 'fs';
import { spawn } from 'child_process';
import axios from 'axios';

async function fullAutoSetup() {
  console.log('🎵 QQ音乐完整自动化配置\n');
  console.log('=====================================\n');
  
  let browser: Browser | null = null;
  
  try {
    // 步骤1: 启动浏览器
    console.log('[1/6] 启动浏览器...');
    browser = await chromium.launch({ 
      headless: false,
      args: [
        '--start-maximized',
        '--disable-blink-features=AutomationControlled',
      ],
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: null,
      locale: 'zh-CN',
    });
    
    const page = await context.newPage();
    console.log('✅ 浏览器已启动\n');
    
    // 步骤2: 打开QQ音乐
    console.log('[2/6] 打开QQ音乐...');
    await page.goto('https://y.qq.com/', { waitUntil: 'networkidle' });
    console.log('✅ 页面已加载\n');
    
    // 步骤3: 等待登录
    console.log('[3/6] 等待登录...');
    console.log('=====================================');
    console.log('⚠️  请在浏览器中完成登录（扫码或账号）');
    console.log('=====================================\n');
    
    // 等待登录成功（检测关键Cookie）
    let loggedIn = false;
    let attempts = 0;
    const maxAttempts = 120; // 10分钟
    
    while (!loggedIn && attempts < maxAttempts) {
      await page.waitForTimeout(5000);
      
      const cookies = await context.cookies('https://y.qq.com');
      const cookieMap = new Map(cookies.map(c => [c.name, c.value]));
      
      // 检查关键登录Cookie
      const hasUin = cookieMap.has('uin') || cookieMap.has('o_cookie');
      const hasKey = cookieMap.has('qqmusic_key') || cookieMap.has('qm_keyst');
      const hasOpenId = cookieMap.has('psrf_qqopenid');
      
      if (hasUin && hasKey) {
        loggedIn = true;
        console.log('✅ 检测到登录成功！\n');
        console.log('关键Cookie状态:');
        console.log(`  uin: ${hasUin ? '✅' : '❌'}`);
        console.log(`  key: ${hasKey ? '✅' : '❌'}`);
        console.log(`  openid: ${hasOpenId ? '✅' : '❌'}\n`);
      } else {
        attempts++;
        if (attempts % 12 === 0) {
          console.log(`  等待中... (${Math.floor(attempts * 5 / 60)}分钟)`);
        }
      }
    }
    
    if (!loggedIn) {
      throw new Error('登录超时（10分钟）');
    }
    
    // 等待确保所有Cookie都设置完成
    await page.waitForTimeout(5000);
    
    // 步骤4: 获取并保存Cookie
    console.log('[4/6] 保存Cookie...');
    
    const cookies = await context.cookies('https://y.qq.com');
    const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    
    console.log(`✅ 获取到 ${cookies.length} 个Cookie`);
    console.log(`   总长度: ${cookieString.length} 字符\n`);
    
    if (cookieString.length < 500) {
      console.log('⚠️  Cookie长度过短，可能登录不完整');
      console.log('   请确保完全登录（不仅仅是打开页面）\n');
    }
    
    // 保存到.env
    const envPath = '.env';
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');
    
    const newLines = lines.map(line => {
      if (line.startsWith('QQ_COOKIE=')) {
        return `QQ_COOKIE=${cookieString}`;
      }
      return line;
    });
    
    fs.writeFileSync(envPath, newLines.join('\n'));
    console.log('✅ Cookie已保存到.env\n');
    
    // 关闭浏览器
    await browser.close();
    browser = null;
    
    // 步骤5: 重启服务
    console.log('[5/6] 重启音乐服务...');
    
    spawn('pkill', ['-f', 'tsx watch src/index.ts']);
    await new Promise(r => setTimeout(r, 3000));
    
    const server = spawn('./node_modules/.bin/tsx', ['watch', 'src/index.ts'], {
      detached: true,
      stdio: 'ignore',
      cwd: process.cwd(),
    });
    server.unref();
    
    console.log('✅ 服务已重启');
    await new Promise(r => setTimeout(r, 10000));
    console.log('✅ 服务启动完成\n');
    
    // 步骤6: 完整验证
    console.log('[6/6] 验证周杰伦歌曲播放...\n');
    
    const testSongs = [
      { name: '晴天', mid: '0039MnYb0qxYhV' },
      { name: '七里香', mid: '004Z8Ihr0JIu5s' },
      { name: '稻香', mid: '003aAYrm3GE0Ac' },
    ];
    
    let successCount = 0;
    
    for (const song of testSongs) {
      try {
        // 搜索
        const searchRes = await axios.get(`http://localhost:3000/api/songs/search?q=周杰伦 ${song.name}&source=qq`, {
          timeout: 5000,
        });
        
        const first = searchRes.data?.data?.[0];
        if (!first) {
          console.log(`❌ ${song.name}: 搜索失败`);
          continue;
        }
        
        // 获取播放链接
        const urlRes = await axios.get(`http://localhost:3000/api/songs/url?id=${first.id}`, {
          timeout: 5000,
        });
        
        const playUrl = urlRes.data?.data?.url;
        if (!playUrl) {
          console.log(`❌ ${song.name}: 无播放链接`);
          continue;
        }
        
        // 验证链接有效性（HEAD请求）
        try {
          const headRes = await axios.head(playUrl, { 
            timeout: 5000,
            validateStatus: (status) => status < 400,
          });
          
          const contentLength = parseInt(headRes.headers['content-length'] || '0');
          const sizeKB = (contentLength / 1024).toFixed(1);
          
          console.log(`✅ ${song.name}: 可播放 (HTTP ${headRes.status}, ${sizeKB}KB)`);
          successCount++;
          
        } catch (e: any) {
          console.log(`❌ ${song.name}: 链接无效 (${e.message})`);
        }
        
      } catch (e: any) {
        console.log(`❌ ${song.name}: ${e.message}`);
      }
      
      await new Promise(r => setTimeout(r, 800));
    }
    
    console.log('\n=====================================');
    if (successCount === testSongs.length) {
      console.log('🎉 全部验证成功！');
      console.log('✅ 可以播放周杰伦正版歌曲');
      console.log('=====================================\n');
      process.exit(0);
    } else {
      console.log(`⚠️  部分验证成功 (${successCount}/${testSongs.length})`);
      console.log('可能需要VIP权限或Cookie不完整');
      console.log('=====================================\n');
      process.exit(1);
    }
    
  } catch (e: any) {
    console.error('\n❌ 错误:', e.message);
    if (browser) {
      await browser.close();
    }
    process.exit(1);
  }
}

fullAutoSetup();
