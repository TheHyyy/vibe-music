import { chromium } from 'playwright';
import * as fs from 'fs';
import { spawn } from 'child_process';
import axios from 'axios';

async function autoSetupVIP() {
  console.log('🎵 QQ音乐VIP自动配置\n');
  console.log('=====================================\n');
  
  let browser: any = null;
  
  try {
    // 启动浏览器
    console.log('[1/7] 启动浏览器...');
    browser = await chromium.launch({ 
      headless: false,
      args: [
        '--start-maximized',
        '--disable-blink-features=AutomationControlled',
      ],
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      viewport: null,
      locale: 'zh-CN',
    });
    
    const page = await context.newPage();
    console.log('✅ 浏览器已启动\n');
    
    // 打开QQ音乐
    console.log('[2/7] 打开QQ音乐...');
    await page.goto('https://y.qq.com/', { waitUntil: 'networkidle' });
    console.log('✅ 页面已加载\n');
    
    // 等待登录
    console.log('[3/7] 等待VIP登录...');
    console.log('=====================================');
    console.log('⚠️  请在浏览器中扫码登录VIP账号');
    console.log('   登录成功后会自动继续');
    console.log('=====================================\n');
    
    let loggedIn = false;
    let attempts = 0;
    const maxAttempts = 120;
    
    while (!loggedIn && attempts < maxAttempts) {
      await page.waitForTimeout(5000);
      
      const cookies = await context.cookies('https://y.qq.com');
      const cookieMap = new Map(cookies.map((c: any) => [c.name, c.value]));
      
      const hasUin = cookieMap.has('uin') || cookieMap.has('o_cookie');
      const hasKey = cookieMap.has('qqmusic_key') || cookieMap.has('qm_keyst');
      
      if (hasUin && hasKey) {
        loggedIn = true;
        console.log('✅ 检测到VIP登录成功！\n');
        
        console.log('关键Cookie:');
        console.log(`  uin: ${hasUin ? '✅' : '❌'}`);
        console.log(`  qqmusic_key: ${cookieMap.has('qqmusic_key') ? '✅' : '❌'}`);
        console.log(`  qm_keyst: ${cookieMap.has('qm_keyst') ? '✅' : '❌'}`);
        console.log(`  psrf_qqopenid: ${cookieMap.has('psrf_qqopenid') ? '✅' : '❌'}\n`);
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
    
    // 获取并保存Cookie
    console.log('[4/7] 保存VIP Cookie...');
    
    const cookies = await context.cookies('https://y.qq.com');
    const cookieString = cookies.map((c: any) => `${c.name}=${c.value}`).join('; ');
    
    console.log(`✅ 获取到 ${cookies.length} 个Cookie`);
    console.log(`   总长度: ${cookieString.length} 字符\n`);
    
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
    console.log('✅ VIP Cookie已保存\n');
    
    // 关闭浏览器
    await browser.close();
    browser = null;
    
    // 重启服务
    console.log('[5/7] 重启音乐服务...');
    
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
    
    // 完整验证周杰伦VIP歌曲
    console.log('[6/7] 验证周杰伦VIP歌曲播放...\n');
    
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
        
        // 验证链接有效性（真实HEAD请求）
        const headRes = await axios.head(playUrl, { 
          timeout: 5000,
          validateStatus: (status) => status < 400,
        });
        
        const contentLength = parseInt(headRes.headers['content-length'] || '0');
        const sizeKB = (contentLength / 1024).toFixed(1);
        
        console.log(`✅ ${song.name}: 可播放 (HTTP ${headRes.status}, ${sizeKB}KB)`);
        successCount++;
        
      } catch (e: any) {
        console.log(`❌ ${song.name}: ${e.message}`);
      }
      
      await new Promise(r => setTimeout(r, 800));
    }
    
    // 最终验证
    console.log('\n[7/7] 最终验证结果...\n');
    
    console.log('=====================================');
    if (successCount === testSongs.length) {
      console.log('🎉🎉🎉 全部验证成功！');
      console.log(`✅ ${successCount}/${testSongs.length} 首周杰伦VIP歌曲可播放`);
      console.log('✅ 配置完成，可以正常使用了');
      console.log('=====================================\n');
      process.exit(0);
    } else if (successCount > 0) {
      console.log(`⚠️  部分验证成功 (${successCount}/${testSongs.length})`);
      console.log('可能部分歌曲仍需要更高等级VIP');
      console.log('=====================================\n');
      process.exit(0);
    } else {
      console.log('❌ 验证失败');
      console.log('可能Cookie无效或VIP未生效');
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

autoSetupVIP();
