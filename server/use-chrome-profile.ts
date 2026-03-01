import { chromium } from 'playwright';
import * as fs from 'fs';
import { spawn } from 'child_process';
import axios from 'axios';

async function useChromeProfile() {
  console.log('🎵 使用Chrome配置文件自动配置\n');
  console.log('=====================================\n');
  
  let browser: any = null;
  
  try {
    // 使用用户的Chrome配置文件
    console.log('[1/6] 启动浏览器（使用Chrome配置）...');
    
    const userDataDir = '/Users/houyu/Library/Application Support/Google/Chrome';
    
    browser = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      channel: 'chrome',
      args: [
        '--profile-directory=Default',
        '--disable-blink-features=AutomationControlled',
      ],
    });
    
    const page = browser.pages()[0] || await browser.newPage();
    
    console.log('✅ 浏览器已启动\n');
    
    // 步骤2: 打开QQ音乐
    console.log('[2/6] 打开QQ音乐...');
    await page.goto('https://y.qq.com/', { waitUntil: 'networkidle' });
    console.log('✅ 页面已加载\n');
    
    // 步骤3: 检查是否已登录
    console.log('[3/6] 检查登录状态...');
    
    await page.waitForTimeout(3000);
    
    const cookies = await browser.cookies('https://y.qq.com');
    const cookieMap = new Map(cookies.map((c: any) => [c.name, c.value]));
    
    const hasUin = cookieMap.has('uin') || cookieMap.has('o_cookie');
    const hasKey = cookieMap.has('qqmusic_key') || cookieMap.has('qm_keyst');
    
    console.log('登录状态:');
    console.log(`  uin: ${hasUin ? '✅' : '❌'}`);
    console.log(`  key: ${hasKey ? '✅' : '❌'}\n`);
    
    if (!hasUin || !hasKey) {
      console.log('⚠️  未检测到登录，等待手动登录...\n');
      console.log('=====================================');
      console.log('请在浏览器中完成登录');
      console.log('=====================================\n');
      
      // 等待登录
      let loggedIn = false;
      let attempts = 0;
      
      while (!loggedIn && attempts < 120) {
        await page.waitForTimeout(5000);
        
        const newCookies = await browser.cookies('https://y.qq.com');
        const newCookieMap = new Map(newCookies.map((c: any) => [c.name, c.value]));
        
        if (newCookieMap.has('uin') || newCookieMap.has('o_cookie')) {
          if (newCookieMap.has('qqmusic_key') || newCookieMap.has('qm_keyst')) {
            loggedIn = true;
            console.log('✅ 检测到登录成功！\n');
          }
        }
        
        attempts++;
      }
      
      if (!loggedIn) {
        throw new Error('登录超时');
      }
    }
    
    // 步骤4: 获取并保存Cookie
    console.log('[4/6] 保存Cookie...');
    
    const finalCookies = await browser.cookies('https://y.qq.com');
    const cookieString = finalCookies.map((c: any) => `${c.name}=${c.value}`).join('; ');
    
    console.log(`✅ 获取到 ${finalCookies.length} 个Cookie`);
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
    
    const testSongs = ['晴天', '七里香', '稻香'];
    let successCount = 0;
    
    for (const song of testSongs) {
      try {
        const searchRes = await axios.get(`http://localhost:3000/api/songs/search?q=周杰伦 ${song}&source=qq`, {
          timeout: 5000,
        });
        
        const first = searchRes.data?.data?.[0];
        if (!first) {
          console.log(`❌ ${song}: 搜索失败`);
          continue;
        }
        
        const urlRes = await axios.get(`http://localhost:3000/api/songs/url?id=${first.id}`, {
          timeout: 5000,
        });
        
        const playUrl = urlRes.data?.data?.url;
        if (!playUrl) {
          console.log(`❌ ${song}: 无播放链接`);
          continue;
        }
        
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

useChromeProfile();
