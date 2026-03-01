import axios from 'axios';

async function checkVIPRequirement() {
  console.log('🔍 检查QQ音乐VIP需求\n');
  console.log('=====================================\n');
  
  // 测试不同类型的歌曲
  const testCases = [
    { name: '周杰伦 晴天', category: '周杰伦（热门）', needVIP: '很可能需要' },
    { name: '周杰伦 七里香', category: '周杰伦（经典）', needVIP: '很可能需要' },
    { name: '邓紫棋 泡沫', category: '其他歌手（热门）', needVIP: '可能不需要' },
    { name: '薛之谦 演员', category: '其他歌手（热门）', needVIP: '可能不需要' },
  ];
  
  console.log('VIP需求分析：\n');
  console.log('QQ音乐歌曲分类：');
  console.log('  - 免费歌曲：所有人可听（无需登录、无需VIP）');
  console.log('  - VIP歌曲：需要绿钻会员');
  console.log('  - SVIP歌曲：需要超级会员（数字专辑等）');
  console.log('');
  console.log('周杰伦歌曲情况：');
  console.log('  - 大部分热门歌曲：需要VIP');
  console.log('  - 部分Live/综艺版本：可能免费');
  console.log('');
  console.log('=====================================\n');
  
  // 模拟测试（使用公开API）
  for (const test of testCases) {
    console.log(`测试: ${test.name}`);
    console.log(`分类: ${test.category}`);
    console.log(`预测: ${test.needVIP}VIP`);
    
    try {
      const searchRes = await axios.get('https://c.y.qq.com/soso/fcgi-bin/client_search_cp', {
        params: { format: 'json', w: test.name, p: 1, n: 1 },
      });
      
      const song = searchRes.data?.data?.song?.list?.[0];
      if (song) {
        console.log(`找到: ${song.songname}`);
        
        // 检查是否有免费链接
        const urlRes = await axios.get('https://c.y.qq.com/v8/fcg-bin/fcg_play_single_song.fcg', {
          params: { songmid: song.songmid, format: 'json' },
        });
        
        const hasFreeUrl = urlRes.data?.url?.[song.songid];
        console.log(`免费链接: ${hasFreeUrl ? '✅ 有' : '❌ 无（需要VIP）'}`);
      }
    } catch (e) {
      console.log('检查失败');
    }
    
    console.log('');
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log('=====================================');
  console.log('结论：');
  console.log('=====================================\n');
  console.log('✅ 配置Cookie后：');
  console.log('   - 可以播放所有免费歌曲');
  console.log('   - 如果你有VIP：可以播放VIP歌曲（包括周杰伦大部分歌曲）');
  console.log('   - 如果你没有VIP：只能播放免费歌曲');
  console.log('');
  console.log('💰 QQ音乐VIP价格：');
  console.log('   - 绿钻会员：8元/月');
  console.log('   - 绿钻豪华版：15元/月');
  console.log('   - 学生优惠：5元/月');
  console.log('');
  console.log('🎵 周杰伦歌曲：');
  console.log('   - 大部分需要VIP');
  console.log('   - 少量Live/综艺版本可能免费');
  console.log('');
}

checkVIPRequirement();
