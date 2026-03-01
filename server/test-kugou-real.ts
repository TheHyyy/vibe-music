import axios from 'axios';

async function testKugou() {
  console.log('🔍 测试酷狗音乐 - 周杰伦歌曲\n');
  
  const testSongs = ['晴天', '七里香', '稻香'];
  
  for (const song of testSongs) {
    console.log(`\n搜索: 周杰伦 ${song}`);
    
    try {
      // 搜索
      const searchRes = await axios.get('https://songsearch.kugou.com/song_search_v2', {
        params: {
          keyword: `周杰伦 ${song}`,
          page: 1,
          pagesize: 5,
          platform: 'WebFilter',
        },
        timeout: 10000,
      });
      
      const songs = searchRes?.data?.data?.lists || [];
      console.log(`  找到 ${songs.length} 首歌曲`);
      
      if (songs.length > 0) {
        const first = songs[0];
        console.log(`  第一首: ${first.SongName} - ${first.SingerName}`);
        
        // 获取播放链接
        const playRes = await axios.get('https://wwwapi.kugou.com/yy/index.php', {
          params: {
            r: 'play/getdata',
            hash: first.FileHash,
            mid: Date.now().toString(),
            type: 'audio',
            platid: 4,
          },
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://www.kugou.com/',
          },
          timeout: 10000,
        });
        
        const playUrl = playRes?.data?.data?.play_url;
        
        if (playUrl) {
          console.log(`  播放链接: ${playUrl.substring(0, 80)}...`);
          
          // 验证链接
          try {
            const headRes = await axios.head(playUrl, { timeout: 5000 });
            console.log(`  ✅ 可播放 (HTTP ${headRes.status})`);
          } catch (e: any) {
            console.log(`  ❌ 链接失效 (${e.message})`);
          }
        } else {
          console.log(`  ❌ 无播放链接`);
          console.log(`  响应:`, JSON.stringify(playRes?.data, null, 2));
        }
      }
      
      await new Promise(r => setTimeout(r, 800));
      
    } catch (e: any) {
      console.log(`  ❌ 错误: ${e.message}`);
    }
  }
}

testKugou();
