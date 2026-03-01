import axios from 'axios';

// 测试酷我音乐
async function testKuwo() {
  console.log('\n🔍 测试酷我音乐 - 搜索周杰伦');
  
  try {
    const searchRes = await axios.get('https://www.kuwo.cn/api/www/search/searchMusicBykeyWord', {
      params: {
        key: '周杰伦 晴天',
        pn: 1,
        rn: 5,
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.kuwo.cn/search',
      },
      timeout: 10000,
    });
    
    const songs = searchRes?.data?.data?.list || [];
    console.log(`✅ 找到 ${songs.length} 首歌曲`);
    
    if (songs.length > 0) {
      const firstSong = songs[0];
      console.log('\n第一首歌:', {
        name: firstSong.name,
        singer: firstSong.artist,
        rid: firstSong.rid,
      });
      
      // 获取播放链接
      console.log('\n🎵 尝试获取播放链接...');
      const playRes = await axios.get('https://www.kuwo.cn/api/v1/www/music/playInfo', {
        params: {
          mid: firstSong.rid,
          type: 'music',
          httpsStatus: 1,
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.kuwo.cn/',
        },
        timeout: 10000,
      });
      
      const playUrl = playRes?.data?.data?.url;
      if (playUrl) {
        console.log('✅ 播放链接获取成功!');
        console.log('链接:', playUrl.substring(0, 100) + '...');
        return true;
      } else {
        console.log('❌ 播放链接获取失败');
        console.log('响应:', JSON.stringify(playRes?.data, null, 2));
        return false;
      }
    }
    return false;
  } catch (e: any) {
    console.error('❌ 测试失败:', e.message);
    return false;
  }
}

// 测试咪咕音乐
async function testMigu() {
  console.log('\n🔍 测试咪咕音乐 - 搜索周杰伦');
  
  try {
    const searchRes = await axios.get('https://m.music.migu.cn/migu/remoting/scr_search_tag', {
      params: {
        keyword: '周杰伦 晴天',
        type: 2,
        pg: 1,
        pz: 5,
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X)',
        'Referer': 'https://m.music.migu.cn/',
      },
      timeout: 10000,
    });
    
    const songs = searchRes?.data?.musics || [];
    console.log(`✅ 找到 ${songs.length} 首歌曲`);
    
    if (songs.length > 0) {
      const firstSong = songs[0];
      console.log('\n第一首歌:', {
        name: firstSong.songName,
        singer: firstSong.singerName,
        id: firstSong.id,
      });
      
      // 获取播放链接
      console.log('\n🎵 尝试获取播放链接...');
      const playRes = await axios.get('https://m.music.migu.cn/migu/remoting/cms_detail_tag', {
        params: {
          cpid: firstSong.copyrightId,
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X)',
          'Referer': 'https://m.music.migu.cn/',
        },
        timeout: 10000,
      });
      
      const playUrl = playRes?.data?.data?.playUrl;
      if (playUrl) {
        console.log('✅ 播放链接获取成功!');
        console.log('链接:', playUrl.substring(0, 100) + '...');
        return true;
      } else {
        console.log('❌ 播放链接获取失败');
        return false;
      }
    }
    return false;
  } catch (e: any) {
    console.error('❌ 测试失败:', e.message);
    return false;
  }
}

async function main() {
  const kuwoResult = await testKuwo();
  const miguResult = await testMigu();
  
  console.log('\n📊 测试结果:');
  console.log('酷我音乐:', kuwoResult ? '✅ 可用' : '❌ 不可用');
  console.log('咪咕音乐:', miguResult ? '✅ 可用' : '❌ 不可用');
}

main();
