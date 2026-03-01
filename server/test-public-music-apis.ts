import axios from 'axios';

async function testPublicAPIs() {
  console.log('🔍 测试公开音乐API（无需登录）\n');
  console.log('=====================================\n');
  
  // 测试1: Meting公共API
  console.log('[1] 测试Meting公共API...');
  try {
    const metingRes = await axios.get('https://api.injahow.cn/meting/', {
      params: {
        type: 'search',
        id: '周杰伦 晴天',
      },
      timeout: 10000,
    });
    
    if (metingRes.data && Array.isArray(metingRes.data)) {
      console.log('✅ Meting API可用');
      console.log(`   找到 ${metingRes.data.length} 首歌曲`);
      
      if (metingRes.data.length > 0) {
        const first = metingRes.data[0];
        console.log(`   第一首: ${first.name} - ${first.artist}`);
        
        // 尝试获取播放链接
        const urlRes = await axios.get('https://api.injahow.cn/meting/', {
          params: {
            type: 'url',
            id: first.id,
          },
          timeout: 10000,
        });
        
        if (urlRes.data && urlRes.data.url) {
          console.log(`   播放链接: ${urlRes.data.url.substring(0, 80)}...`);
          
          // 验证链接
          try {
            const headRes = await axios.head(urlRes.data.url, { timeout: 5000 });
            console.log(`   ✅ 链接有效 (HTTP ${headRes.status})\n`);
          } catch (e) {
            console.log(`   ❌ 链接无效\n`);
          }
        }
      }
    } else {
      console.log('❌ Meting API返回格式错误\n');
    }
  } catch (e: any) {
    console.log(`❌ Meting API失败: ${e.message}\n`);
  }
  
  // 测试2: 音乐聚合API
  console.log('[2] 测试音乐聚合API...');
  const aggregateAPIs = [
    {
      name: 'i睿哥音乐API',
      url: 'https://api.ringgif.cn/api/wyy',
      params: { msg: '周杰伦 晴天', type: 'json' },
    },
    {
      name: '爱听音乐API',
      url: 'https://api.vvhan.com/api/wyMusic',
      params: { song: '晴天' },
    },
  ];
  
  for (const api of aggregateAPIs) {
    console.log(`\n  测试: ${api.name}`);
    try {
      const res = await axios.get(api.url, {
        params: api.params,
        timeout: 10000,
      });
      
      console.log(`  响应:`, JSON.stringify(res.data).substring(0, 200));
      
      // 检查是否有播放链接
      const playUrl = res.data?.data?.url || res.data?.url || res.data?.music;
      if (playUrl) {
        console.log(`  ✅ 找到播放链接`);
        
        // 验证
        try {
          const headRes = await axios.head(playUrl, { timeout: 5000 });
          console.log(`  ✅ 链接有效 (HTTP ${headRes.status})`);
        } catch (e) {
          console.log(`  ❌ 链接无效`);
        }
      }
    } catch (e: any) {
      console.log(`  ❌ 失败: ${e.message}`);
    }
  }
  
  // 测试3: 网易云音乐（已有，但确认周杰伦可用性）
  console.log('\n[3] 确认网易云音乐周杰伦资源...');
  try {
    const neteaseRes = await axios.get('http://localhost:3000/api/songs/search?q=周杰伦 晴天&source=netease');
    const songs = neteaseRes.data?.data || [];
    
    console.log(`  找到 ${songs.length} 首歌曲`);
    
    if (songs.length > 0) {
      const first = songs[0];
      console.log(`  第一首: ${first.title} - ${first.artist}`);
      
      const urlRes = await axios.get(`http://localhost:3000/api/songs/url?id=${first.id}`);
      const playUrl = urlRes.data?.data?.url;
      
      if (playUrl) {
        const headRes = await axios.head(playUrl, { timeout: 5000 });
        console.log(`  ✅ 可播放 (HTTP ${headRes.status})`);
        const sizeKB = (parseInt(headRes.headers['content-length'] || '0') / 1024).toFixed(1);
        console.log(`  文件大小: ${sizeKB}KB`);
      }
    }
  } catch (e: any) {
    console.log(`  ❌ 失败: ${e.message}`);
  }
}

testPublicAPIs();
