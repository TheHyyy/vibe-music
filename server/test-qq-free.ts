import { QQFreeProvider } from './src/music/qq-free.js';

async function test() {
  const qq = new QQFreeProvider();
  
  console.log('🔍 测试QQ音乐免费版 - 搜索周杰伦\n');
  const songs = await qq.search('周杰伦 晴天');
  
  console.log(`✅ 找到 ${songs.length} 首歌曲\n`);
  
  if (songs.length > 0) {
    // 显示前5首
    for (let i = 0; i < Math.min(5, songs.length); i++) {
      const song = songs[i];
      console.log(`${i + 1}. ${song.title} - ${song.artist} [${song.id}]`);
    }
    
    console.log('\n🎵 测试第一首歌是否可播放...');
    const first = songs[0];
    try {
      const playUrl = await qq.getPlayUrl(first.id);
      if (playUrl) {
        console.log('✅ 可播放');
        console.log('链接:', playUrl);
      } else {
        console.log('❌ 链接为空');
      }
    } catch (e: any) {
      console.log('❌ 不可播放:', e.message);
    }
  }
}

test();
