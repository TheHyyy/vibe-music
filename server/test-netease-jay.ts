import { NeteaseProvider } from './src/music/netease.js';

async function test() {
  const netease = new NeteaseProvider();
  
  console.log('🔍 测试网易云音乐 - 搜索周杰伦');
  const songs = await netease.search('周杰伦 晴天');
  
  console.log(`\n✅ 找到 ${songs.length} 首歌曲`);
  
  if (songs.length > 0) {
    const firstSong = songs[0];
    console.log('\n第一首歌:', {
      id: firstSong.id,
      title: firstSong.title,
      artist: firstSong.artist,
    });
    
    console.log('\n🎵 尝试获取播放链接...');
    try {
      const playUrl = await netease.getPlayUrl(firstSong.id);
      if (playUrl) {
        console.log('✅ 播放链接获取成功!');
        console.log('链接:', playUrl.substring(0, 100) + '...');
      } else {
        console.log('❌ 播放链接为空');
      }
    } catch (e: any) {
      console.error('❌ 获取播放链接失败:', e.message);
    }
  }
}

test();
