import axios from 'axios';

async function testAllProviders() {
  console.log('🔍 测试所有QQ音乐Provider\n');
  
  const providers = ['qq-music-api', 'third', 'meting'];
  
  for (const provider of providers) {
    console.log(`\n========== ${provider} ==========\n`);
    
    // 修改配置
    const fs = await import('fs');
    let env = fs.readFileSync('.env', 'utf-8');
    env = env.replace(/QQ_MUSIC_PROVIDER=.*/, `QQ_MUSIC_PROVIDER=${provider}`);
    fs.writeFileSync('.env', env);
    
    // 重启服务
    const { spawn } = await import('child_process');
    spawn('pkill', ['-f', 'tsx watch src/index.ts']);
    await new Promise(r => setTimeout(r, 3000));
    
    const server = spawn('./node_modules/.bin/tsx', ['watch', 'src/index.ts'], {
      detached: true,
      stdio: 'ignore',
      cwd: process.cwd(),
    });
    server.unref();
    
    await new Promise(r => setTimeout(r, 8000));
    
    // 测试
    try {
      const searchRes = await axios.get('http://localhost:3000/api/songs/search?q=周杰伦 晴天&source=qq');
      const song = searchRes.data?.data?.[0];
      
      const urlRes = await axios.get(`http://localhost:3000/api/songs/url?id=${song.id}`);
      const playUrl = urlRes.data?.data?.url;
      
      if (playUrl) {
        console.log(`播放链接: ${playUrl.substring(0, 100)}...`);
        
        try {
          const headRes = await axios.head(playUrl, { timeout: 5000 });
          const sizeKB = (parseInt(headRes.headers['content-length'] || '0') / 1024).toFixed(1);
          console.log(`✅ 成功！ (HTTP ${headRes.status}, ${sizeKB}KB)`);
        } catch (e: any) {
          console.log(`❌ 访问失败: ${e.message}`);
        }
      } else {
        console.log('❌ 无播放链接');
      }
    } catch (e: any) {
      console.log(`❌ 错误: ${e.message}`);
    }
  }
}

testAllProviders();
