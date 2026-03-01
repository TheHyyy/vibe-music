import axios from 'axios';

async function testGitHubAPIs() {
  console.log('🔍 测试GitHub开源音乐API项目\n');
  console.log('=====================================\n');
  
  // 一些GitHub上的开源项目公共API
  const apis = [
    {
      name: 'NeteaseCloudMusicApi (Binaryify)',
      url: 'http://localhost:3000/cloudsearch',
      params: { keywords: '周杰伦 晴天' },
      note: '本地已安装',
    },
    {
      name: 'QQ音乐API (jsososo)',
      url: 'https://api.jsososo.com/api/search',
      params: { key: '周杰伦 晴天', pageNo: 1 },
      note: '公共API',
    },
    {
      name: '音乐API (Rain120)',
      url: 'https://c.y.qq.com/soso/fcgi-bin/client_search_cp',
      params: { format: 'json', w: '周杰伦 晴天', p: 1, n: 5 },
      note: 'QQ官方搜索（无需登录）',
    },
  ];
  
  for (const api of apis) {
    console.log(`\n[${apis.indexOf(api) + 1}] ${api.name}`);
    console.log(`    ${api.note}`);
    
    try {
      const res = await axios.get(api.url, {
        params: api.params,
        timeout: 10000,
      });
      
      console.log(`    ✅ 响应成功 (${res.status})`);
      
      // 检查数据结构
      const data = res.data;
      if (data.data || data.result || data.song) {
        console.log(`    ✅ 有数据`);
        console.log(`    数据预览:`, JSON.stringify(data).substring(0, 200));
      }
      
    } catch (e: any) {
      console.log(`    ❌ 失败: ${e.message}`);
    }
  }
  
  // 测试QQ官方搜索 + 免费播放链接
  console.log('\n\n=====================================');
  console.log('测试QQ音乐官方搜索 + 免费播放链接');
  console.log('=====================================\n');
  
  try {
    // 搜索
    const searchRes = await axios.get('https://c.y.qq.com/soso/fcgi-bin/client_search_cp', {
      params: {
        format: 'json',
        w: '周杰伦 晴天',
        p: 1,
        n: 10,
      },
      timeout: 10000,
    });
    
    const songs = searchRes.data?.data?.song?.list || [];
    console.log(`找到 ${songs.length} 首歌曲\n`);
    
    if (songs.length > 0) {
      const first = songs[0];
      console.log(`第一首: ${first.songname} - ${first.singer.map((s: any) => s.name).join(', ')}`);
      console.log(`songmid: ${first.songmid}\n`);
      
      // 尝试获取免费播放链接
      console.log('尝试方法1: 免费试听链接...');
      try {
        const freeRes = await axios.get('https://c.y.qq.com/v8/fcg-bin/fcg_play_single_song.fcg', {
          params: {
            songmid: first.songmid,
            format: 'json',
          },
          timeout: 10000,
        });
        
        const url = freeRes.data?.url?.[first.songid];
        if (url) {
          console.log(`✅ 找到免费链接: http://${url}`);
          
          // 验证
          try {
            const headRes = await axios.head(`http://${url}`, { timeout: 5000 });
            console.log(`✅ 链接有效 (HTTP ${headRes.status})`);
          } catch (e) {
            console.log(`❌ 链接无效`);
          }
        } else {
          console.log('❌ 无免费链接');
        }
      } catch (e: any) {
        console.log(`❌ 失败: ${e.message}`);
      }
    }
    
  } catch (e: any) {
    console.log(`❌ 搜索失败: ${e.message}`);
  }
}

testGitHubAPIs();
