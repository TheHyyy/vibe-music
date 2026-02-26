// 测试网易云音乐 API
import { NeteaseProvider } from './dist/music/netease.js';

async function test() {
  try {
    console.log('=== 测试网易云音乐 API ===\n');
    
    const netease = new NeteaseProvider();
    
    // 测试搜索
    console.log('1. 测试搜索 "周杰伦"...');
    const songs = await netease.search('周杰伦');
    
    if (!songs || songs.length === 0) {
      console.log('❌ 搜索失败：没有结果');
      return;
    }
    
    console.log(`✅ 搜索成功，找到 ${songs.length} 首歌\n`);
    
    const firstSong = songs[0];
    console.log('第一首歌信息：');
    console.log(`  - 歌名: ${firstSong.title}`);
    console.log(`  - 歌手: ${firstSong.artist}`);
    console.log(`  - ID: ${firstSong.id}\n`);
    
    // 测试获取播放链接
    console.log('2. 测试获取播放链接...');
    const playUrl = await netease.getPlayUrl(firstSong.id);
    
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
