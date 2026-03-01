import { QQFreeProvider } from './src/music/qq-free.js';

async function test() {
  const qq = new QQFreeProvider();
  
  const testSongs = [
    '周杰伦 晴天',
    '周杰伦 七里香',
    '周杰伦 稻香',
    '周杰伦 青花瓷',
    '周杰伦 告白气球',
    '周杰伦 夜曲',
  ];
  
  console.log('🎵 测试QQ音乐免费版 - 周杰伦经典歌曲\n');
  
  for (const song of testSongs) {
    console.log(`\n🔍 搜索: ${song}`);
    const results = await qq.search(song);
    
    if (results.length > 0) {
      const first = results[0];
      console.log(`   找到: ${first.title} - ${first.artist}`);
      
      try {
        const playUrl = await qq.getPlayUrl(first.id);
        if (playUrl) {
          console.log(`   ✅ 可播放`);
        } else {
          console.log(`   ❌ 无法播放（链接为空）`);
        }
      } catch (e: any) {
        console.log(`   ❌ 无法播放: ${e.message.substring(0, 50)}...`);
      }
    } else {
      console.log(`   ❌ 未找到`);
    }
    
    // 延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 800));
  }
}

test();
