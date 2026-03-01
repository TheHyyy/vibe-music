import axios from 'axios';

async function testKugou() {
  console.log('🔍 测试酷狗音乐 - 搜索周杰伦');
  
  try {
    // 搜索周杰伦
    const searchRes = await axios.get('https://songsearch.kugou.com/song_search_v2', {
      params: {
        keyword: '周杰伦 晴天',
        page: 1,
        pagesize: 5,
        platform: 'WebFilter',
      },
      timeout: 10000,
    });
    
    const songs = searchRes?.data?.data?.lists || [];
    console.log(`\n✅ 找到 ${songs.length} 首歌曲`);
    
    if (songs.length > 0) {
      const firstSong = songs[0];
      console.log('\n第一首歌:', {
        name: firstSong.SongName,
        singer: firstSong.SingerName,
        hash: firstSong.FileHash,
      });
      
      // 尝试获取播放链接
      console.log('\n🎵 尝试获取播放链接...');
      const playRes = await axios.get('https://wwwapi.kugou.com/yy/index.php', {
        params: {
          r: 'play/getdata',
          hash: firstSong.FileHash,
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
      
      const playUrl = playRes?.data?.data?.play_url || playRes?.data?.data?.url;
      if (playUrl) {
        console.log('✅ 播放链接获取成功!');
        console.log('链接:', playUrl.substring(0, 100) + '...');
      } else {
        console.log('❌ 播放链接获取失败');
        console.log('响应数据:', JSON.stringify(playRes?.data, null, 2));
      }
    }
  } catch (e: any) {
    console.error('❌ 测试失败:', e.message);
    if (e.response) {
      console.error('响应:', e.response.data);
    }
  }
}

testKugou();
