import axios from 'axios';

// 测试多个公开API
async function testAPIs() {
  console.log('🔍 测试所有可能的音源\n');
  
  const apis = [
    {
      name: '酷我音乐',
      search: async (keyword: string) => {
        const res = await axios.get('http://www.kuwo.cn/api/www/search/searchMusicBykeyWord', {
          params: { key: keyword, pn: 1, rn: 5 },
          headers: {
            'User-Agent': 'Mozilla/5.0',
            'Referer': 'http://www.kuwo.cn/search',
          },
        });
        return res?.data?.data?.list || [];
      },
      getUrl: async (rid: number) => {
        const res = await axios.get('http://www.kuwo.cn/api/v1/www/music/playInfo', {
          params: { mid: rid, type: 'music' },
          headers: { 'Referer': 'http://www.kuwo.cn/' },
        });
        return res?.data?.data?.url;
      },
    },
    {
      name: '酷狗音乐（备用API）',
      search: async (keyword: string) => {
        const res = await axios.get('https://mobileservice.kugou.com/api/simple/search', {
          params: { keyword, page: 1, pagesize: 5 },
        });
        return res?.data?.data?.info || [];
      },
      getUrl: async (hash: string) => {
        const res = await axios.get('https://m.kugou.com/app/i/getSongInfo.php', {
          params: { cmd: 'playInfo', hash },
        });
        return res?.data?.url;
      },
    },
  ];
  
  for (const api of apis) {
    console.log(`\n========== ${api.name} ==========`);
    
    try {
      const songs = await api.search('周杰伦 晴天');
      console.log(`找到 ${songs.length} 首歌曲`);
      
      if (songs.length > 0) {
        const first = songs[0];
        console.log(`第一首: ${first.name || first.songname} - ${first.artist || first.singername}`);
        
        // 获取播放链接
        const url = await api.getUrl(first.rid || first.hash);
        
        if (url) {
          console.log(`播放链接: ${url.substring(0, 80)}...`);
          
          // 验证
          try {
            const headRes = await axios.head(url, { timeout: 5000 });
            console.log(`✅ 可播放 (HTTP ${headRes.status})`);
          } catch (e: any) {
            console.log(`❌ 链接失效 (${e.message})`);
          }
        } else {
          console.log(`❌ 无播放链接`);
        }
      }
    } catch (e: any) {
      console.log(`❌ 错误: ${e.message}`);
    }
    
    await new Promise(r => setTimeout(r, 500));
  }
}

testAPIs();
