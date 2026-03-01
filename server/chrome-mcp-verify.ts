import { chromium } from 'playwright';
import axios from 'axios';

async function chromeMCPVerify() {
  console.log('🔍 Chrome MCP完整验证\n');
  console.log('=====================================\n');
  
  let browser: any = null;
  
  try {
    // 步骤1: 验证Cookie已保存
    console.log('[1/5] 检查Cookie配置...');
    const fs = await import('fs');
    const env = fs.readFileSync('.env', 'utf-8');
    const cookieMatch = env.match(/QQ_COOKIE=(.+)/);
    
    if (!cookieMatch) {
      console.log('❌ Cookie未保存\n');
      return;
    }
    
    const cookieString = cookieMatch[1];
    console.log(`✅ Cookie已保存 (${cookieString.length}字符)\n`);
    
    // 步骤2: 启动浏览器
    console.log('[2/5] 启动Chrome浏览器...');
    browser = await chromium.launch({ 
      headless: false,
      args: ['--disable-blink-features=AutomationControlled'],
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    });
    
    const page = await context.newPage();
    console.log('✅ 浏览器已启动\n');
    
    // 步骤3: 设置Cookie并访问QQ音乐
    console.log('[3/5] 设置Cookie并验证登录状态...');
    
    // 解析Cookie字符串
    const cookies = cookieString.split(';').map(c => {
      const [name, ...valueParts] = c.trim().split('=');
      return {
        name,
        value: valueParts.join('='),
        domain: '.qq.com',
        path: '/',
      };
    });
    
    await context.addCookies(cookies);
    
    // 访问QQ音乐
    await page.goto('https://y.qq.com/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // 检查是否登录
    const pageContent = await page.content();
    const isLoggedIn = pageContent.includes('登录') === false || 
                       await page.evaluate(() => {
                         // 检查是否有用户信息
                         const userEl = document.querySelector('.header__login');
                         return !userEl || userEl.textContent?.includes('登录') === false;
                       });
    
    console.log(`登录状态: ${isLoggedIn ? '✅ 已登录' : '❌ 未登录'}\n`);
    
    // 步骤4: 测试免费歌曲
    console.log('[4/5] 测试免费歌曲...\n');
    
    const freeSongs = [
      { name: '小幸运', artist: '田馥甄' },
      { name: '起风了', artist: '买辣椒也用券' },
    ];
    
    for (const song of freeSongs) {
      console.log(`  测试: ${song.name} - ${song.artist}`);
      
      try {
        // 搜索
        const searchRes = await axios.get(`http://localhost:3000/api/songs/search?q=${song.name} ${song.artist}&source=qq`);
        const first = searchRes.data?.data?.[0];
        
        if (!first) {
          console.log(`    ❌ 搜索失败\n`);
          continue;
        }
        
        console.log(`    找到: ${first.title}`);
        
        // 获取播放链接
        const urlRes = await axios.get(`http://localhost:3000/api/songs/url?id=${first.id}`);
        const playUrl = urlRes.data?.data?.url;
        
        if (!playUrl) {
          console.log(`    ❌ 无播放链接\n`);
          continue;
        }
        
        console.log(`    播放链接: ${playUrl.substring(0, 80)}...`);
        
        // 使用浏览器验证
        const audioResponse = await page.goto(playUrl, { waitUntil: 'load' });
        
        if (audioResponse && audioResponse.status() === 200) {
          const headers = audioResponse.headers();
          const sizeKB = (parseInt(headers['content-length'] || '0') / 1024).toFixed(1);
          console.log(`    ✅ 可播放 (HTTP ${audioResponse.status()}, ${sizeKB}KB)\n`);
        } else {
          console.log(`    ❌ 播放失败 (HTTP ${audioResponse?.status() || 'N/A'})\n`);
        }
        
      } catch (e: any) {
        console.log(`    ❌ 错误: ${e.message}\n`);
      }
      
      await page.waitForTimeout(1000);
    }
    
    // 步骤5: 测试VIP歌曲
    console.log('[5/5] 测试VIP歌曲（周杰伦）...\n');
    
    const vipSongs = [
      { name: '晴天', artist: '周杰伦' },
      { name: '七里香', artist: '周杰伦' },
      { name: '稻香', artist: '周杰伦' },
    ];
    
    let vipSuccessCount = 0;
    
    for (const song of vipSongs) {
      console.log(`  测试: ${song.name} - ${song.artist}`);
      
      try {
        // 搜索
        const searchRes = await axios.get(`http://localhost:3000/api/songs/search?q=${song.name} ${song.artist}&source=qq`);
        const first = searchRes.data?.data?.[0];
        
        if (!first) {
          console.log(`    ❌ 搜索失败\n`);
          continue;
        }
        
        console.log(`    找到: ${first.title}`);
        
        // 获取播放链接
        const urlRes = await axios.get(`http://localhost:3000/api/songs/url?id=${first.id}`);
        const playUrl = urlRes.data?.data?.url;
        
        if (!playUrl) {
          console.log(`    ❌ 无播放链接\n`);
          continue;
        }
        
        console.log(`    播放链接: ${playUrl.substring(0, 80)}...`);
        
        // 使用浏览器验证
        const audioResponse = await page.goto(playUrl, { waitUntil: 'load' });
        
        if (audioResponse && audioResponse.status() === 200) {
          const headers = audioResponse.headers();
          const sizeKB = (parseInt(headers['content-length'] || '0') / 1024).toFixed(1);
          console.log(`    ✅ 可播放 (HTTP ${audioResponse.status()}, ${sizeKB}KB)\n`);
          vipSuccessCount++;
        } else {
          console.log(`    ❌ 播放失败 (HTTP ${audioResponse?.status() || 'N/A'})\n`);
        }
        
      } catch (e: any) {
        console.log(`    ❌ 错误: ${e.message}\n`);
      }
      
      await page.waitForTimeout(1000);
    }
    
    console.log('=====================================');
    console.log('验证结果：');
    console.log('=====================================\n');
    console.log(`VIP歌曲: ${vipSuccessCount}/${vipSongs.length} 成功`);
    
    if (vipSuccessCount === vipSongs.length) {
      console.log('🎉 全部验证成功！');
      console.log('✅ 可以播放周杰伦VIP歌曲');
    } else {
      console.log('⚠️  部分验证失败');
    }
    
    console.log('\n=====================================\n');
    
  } catch (e: any) {
    console.error('\n❌ 错误:', e.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

chromeMCPVerify();
