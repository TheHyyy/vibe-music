// 测试 @xnfa/qq-music-api
import QQ from '@xnfa/qq-music-api';

async function test() {
  try {
    console.log('=== 测试 @xnfa/qq-music-api ===\n');
    
    const qq = new QQ();
    
    // 测试搜索
    console.log('1. 测试搜索 "周杰伦"...');
    const searchResult = await qq.search('周杰伦', 5);
    
    if (!searchResult || searchResult.length === 0) {
      console.log('❌ 搜索失败：没有结果');
      return;
    }
    
    console.log(`✅ 搜索成功，找到 ${searchResult.length} 首歌\n`);
    
    const firstSong = searchResult[0];
    console.log('第一首歌信息：');
    console.log(`  - 歌名: ${firstSong.name || firstSong.songname}`);
    console.log(`  - 歌手: ${firstSong.singer}`);
    console.log(`  - mid: ${firstSong.mid || firstSong.songmid}\n`);
    
    // 测试获取播放链接
    console.log('2. 测试获取播放链接...');
    const songMid = firstSong.mid || firstSong.songmid;
    const playUrl = await qq.getPlayUrl(songMid);
    
    if (playUrl) {
      console.log('✅ 获取播放链接成功：');
      console.log(`  ${playUrl}\n`);
    } else {
      console.log('❌ 获取播放链接失败');
    }
    
  } catch (e) {
    console.error('❌ 测试失败：', e);
  }
}

test();
