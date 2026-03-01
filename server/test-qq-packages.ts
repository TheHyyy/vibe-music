// 测试 @xnfa/qq-music-api
import { search as qqSearch, song_url as qqUrl } from '@xnfa/qq-music-api';

async function testQQ() {
  console.log('🔍 测试 @xnfa/qq-music-api - 搜索周杰伦\n');
  
  try {
    const results = await qqSearch('周杰伦 晴天', 1, 5);
    console.log('搜索结果:', results);
    
    if (results && results.length > 0) {
      const first = results[0];
      console.log('\n第一首歌:', first);
      
      console.log('\n🎵 尝试获取播放链接...');
      const url = await qqUrl(first.mid || first.id);
      console.log('播放链接:', url);
    }
  } catch (e: any) {
    console.error('❌ 测试失败:', e.message);
    console.error('完整错误:', e);
  }
}

testQQ();
