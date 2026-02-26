// 测试 QQ 音乐 API
import qq from 'qq-music-api';

async function testQQ() {
  try {
    console.log('=== 测试 QQ 音乐 API ===\n');
    
    // 测试搜索
    console.log('1. 测试搜索 "周杰伦"...');
    const searchResult = await qq.api('search', { key: '周杰伦', pageSize: 5 });
    const list = searchResult?.list || searchResult?.data?.list || [];
    
    if (list.length === 0) {
      console.log('❌ 搜索失败：没有结果');
      return;
    }
    
    console.log(`✅ 搜索成功，找到 ${list.length} 首歌\n`);
    
    const firstSong = list[0];
    console.log('第一首歌信息：');
    console.log(`  - 歌名: ${firstSong.songname}`);
    console.log(`  - 歌手: ${firstSong.singer?.map(a => a.name).join(', ')}`);
    console.log(`  - songmid: ${firstSong.songmid}\n`);
    
    // 测试获取播放链接
    console.log('2. 测试获取播放链接...');
    const playUrl = await qq.api('song/urls', { id: firstSong.songmid });
    
    if (playUrl && playUrl[firstSong.songmid]) {
      console.log('✅ 获取播放链接成功：');
      console.log(`  ${playUrl[firstSong.songmid]}\n`);
    } else {
      console.log('❌ 获取播放链接失败');
      console.log('返回数据:', JSON.stringify(playUrl, null, 2));
    }
    
  } catch (e) {
    console.error('❌ 测试失败：', e);
  }
}

testQQ();
