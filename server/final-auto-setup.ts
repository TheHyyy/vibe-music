import { chromium } from 'playwright';
import * as fs from 'fs';
import { spawn } from 'child_process';
import axios from 'axios';

async function finalAutoSetup() {
  console.log('🎵 QQ音乐最终自动化配置\n');
  console.log('=====================================\n');
  
  let browser: any = null;
  
  try {
    // 启动浏览器
    console.log('[1/6] 启动浏览器...');
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
    console.log('[2/6] 打开QQ音乐...');
    await page.goto('https://y.qq.com/', { waitUntil: 'networkidle' });
    console.log('✅ 页面已加载\n');
    
    // 检查登录状态
    console.log('[3/6] 检查登录状态...');
    
    await page.waitForTimeout(2000);
    
    let cookies = await context.cookies('https://y.qq.com');
    let cookieMap = new Map(cookies.map((c: any) => [c.name, c.value]));
    
    let hasUin = cookieMap.has('uin') || cookieMap.has('o_cookie');
    let hasKey = cookieMap.has('qqmusic_key') || cookieMap.has('qm_keyst');
    
    if (hasUin && hasKey) {
      console.log('✅ 已登录\n');
    } else {
      console.log('⚠️  未登录\n');
      console.log('=====================================');
      console.log('请在浏览器中扫码或账号登录');
      console.log('登录成功后会自动继续');
      console.log('=====================================\n');
      
      // 等待登录
      let loggedIn = false;
      let attempts = 0;
      
      while (!loggedIn && attempts < 120) {
        await page.waitForTimeout(5000);
        
        cookies = await context.cookies('https://y.qq.com');
        cookieMap = new Map(cookies.map((c: any) => [c.name, c.value]));
        
        hasUin = cookieMap.has('uin') || cookieMap.has('o_cookie');
        hasKey = cookieMap.has('qqmusic_key') || cookieMap.has('qm_keyst');
        
        if (hasUin && hasKey) {
          loggedIn = true;
          console.log('\n✅ 检测到登录成功！\n');
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
    }
    
    // 等待确保所有Cookie都设置完成
    await page.waitForTimeout(5000);
    
    // 获取并保存Cookie
    console.log('[4/6] 保存Cookie...');
    
    cookies = await context.cookies('https://y.qq.com');
    const cookieString = cookies.map((c: any) => `${c.name}=${c.value}`).join('; ');
    
    console.log(`✅ 获取到 ${cookies.length} 个Cookie`);
    console.log(`   总长度: ${cookieString.length} 字符\n`);
    
    // 显示关键Cookie
    cookieMap = new Map(cookies.map((c: any) => [c.name, c.value]));
    console.log('关键Cookie:');
    console.log(`  uin: ${cookieMap.has('uin') || cookieMap.has('o_cookie') ? '✅' : '❌'}`);
    console.log(`  qqmusic_key: ${cookieMap.has('qqmusic_key') ? '✅' : '❌'}`);
    console.log(`  qm_keyst: ${cookieMap.has('qm_keyst') ? '✅' : '❌'}`);
    console.log(`  psrf_qqopenid: ${cookieMap.has('psrf_qqopenid') ? '✅' : '❌'}\n`);
    
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
    
    // 重启服务
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
    
    // 完整验证
    console.log('[6/6] 验证周杰伦歌曲播放...\n');
    
    const testSongs = ['晴天', '七里香', '稻香'];
    let successCount = 0;
    
    for (const song of testSongs) {
      try {
        // 搜索
        const searchRes = await axios.get(`http://localhost:3000/api/songs/search?q=周杰伦 ${song}&source=qq`, {
          timeout: 5000,
        });
        
        const first = searchRes.data?.data?.[0];
        if (!first) {
          console.log(`❌ ${song}: 搜索失败`);
          continue;
        }
        
        // 获取播放链接
        const urlRes = await axios.get(`http://localhost:3000/api/songs/url?id=${first.id}`, {
          timeout: 5000,
        });
        
        const playUrl = urlRes.data?.data?.url;
        if (!playUrl) {
          console.log(`❌ ${song}: 无播放链接`);
          continue;
        }
        
        // 验证链接有效性
        const headRes = await axios.head(playUrl, { 
          timeout: 5000,
          validateStatus: (status) => status < 400,
        });
        
        const contentLength = parseInt(headRes.headers['content-length'] || '0');
        const sizeKB = (contentLength / 1024).toFixed(1);
        
        console.log(`✅ ${song}: 可播放 (HTTP ${headRes.status}, ${sizeKB}KB)`);
        successCount++;
        
      } catch (e: any) {
        console.log(`❌ ${song}: ${e.message}`);
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
      console.log('可能需要VIP权限');
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

finalAutoSetup();
