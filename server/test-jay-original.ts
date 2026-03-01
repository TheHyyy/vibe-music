import { NeteaseProvider } from './src/music/netease.js';

async function test() {
  const netease = new NeteaseProvider();
  
  console.log('🔍 搜索周杰伦原版歌曲（不带任何关键词）\n');
  const results = await netease.search('周杰伦');
  
  console.log(`找到 ${results.length} 首歌曲\n`);
  
  // 显示前20首
  for (let i = 0; i < Math.min(20, results.length); i++) {
    const song = results[i];
    console.log(`${i + 1}. ${song.title} - ${song.artist} [${song.id}]`);
  }
  
  // 测试第一首是否可播放
  if (results.length > 0) {
    console.log('\n🎵 测试第一首歌是否可播放...');
    const first = results[0];
    try {
      const playUrl = await netease.getPlayUrl(first.id);
      if (playUrl) {
        console.log('✅ 可播放');
        console.log('链接:', playUrl.substring(0, 100) + '...');
      }
    } catch (e: any) {
      console.log('❌ 不可播放:', e.message);
    }
  }
}

test();
