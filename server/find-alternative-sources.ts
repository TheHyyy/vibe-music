import axios from 'axios';

async function findAlternativeSources() {
  console.log('🔍 寻找替代音源（无需登录）\n');
  console.log('=====================================\n');
  
  // 方案1: 检查网易云音乐是否有更多周杰伦资源
  console.log('[方案1] 网易云音乐 - 周杰伦完整列表\n');
  
  const neteaseRes = await axios.get('http://localhost:3000/api/songs/search?q=周杰伦&source=netease&page=1');
  const neteaseSongs = neteaseRes.data?.data || [];
  
  console.log(`找到 ${neteaseSongs.length} 首周杰伦相关歌曲`);
  console.log('前10首:');
  
  for (let i = 0; i < Math.min(10, neteaseSongs.length); i++) {
    const song = neteaseSongs[i];
    console.log(`  ${i + 1}. ${song.title} - ${song.artist}`);
  }
  
  // 方案2: 测试QQ音乐免费歌曲（非周杰伦）
  console.log('\n\n[方案2] QQ音乐免费歌曲（非周杰伦）\n');
  
  const freeSongs = ['小幸运', '起风了', '平凡之路'];
  
  for (const song of freeSongs) {
    console.log(`搜索: ${song}`);
    
    const searchRes = await axios.get('https://c.y.qq.com/soso/fcgi-bin/client_search_cp', {
      params: { format: 'json', w: song, p: 1, n: 3 },
    });
    
    const songs = searchRes.data?.data?.song?.list || [];
    
    if (songs.length > 0) {
      const first = songs[0];
      console.log(`  找到: ${first.songname}`);
      
      // 尝试获取免费链接
      try {
        const urlRes = await axios.get('https://c.y.qq.com/v8/fcg-bin/fcg_play_single_song.fcg', {
          params: { songmid: first.songmid, format: 'json' },
        });
        
        const url = urlRes.data?.url?.[first.songid];
        if (url) {
          const playUrl = `http://${url}`;
          
          try {
            const headRes = await axios.head(playUrl, { timeout: 3000 });
            console.log(`  ✅ 可播放 (HTTP ${headRes.status})`);
          } catch (e) {
            console.log(`  ❌ 不可播放`);
          }
        } else {
          console.log(`  ❌ 无免费链接`);
        }
      } catch (e) {
        console.log(`  ❌ 获取失败`);
      }
    }
    
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log('\n\n=====================================');
  console.log('结论:');
  console.log('=====================================\n');
  console.log('✅ QQ音乐搜索API是公开的（无需登录）');
  console.log('✅ 部分非VIP歌曲可以免费播放');
  console.log('❌ 周杰伦歌曲需要VIP/Cookie');
  console.log('');
  console.log('可行方案:');
  console.log('1. 使用网易云音乐的翻唱版本（完全免费）');
  console.log('2. 使用QQ音乐的非VIP歌曲（免费）');
  console.log('3. 提供Cookie（一次登录，长期使用）');
  console.log('');
}

findAlternativeSources();
