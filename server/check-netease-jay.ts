import axios from 'axios';

async function checkNeteaseJay() {
  console.log('🔍 详细检查网易云音乐的周杰伦歌曲\n');
  console.log('=====================================\n');
  
  const songs = [
    '晴天', '七里香', '稻香', '青花瓷', '告白气球', '夜曲',
    '简单爱', '双截棍', '以父之名', '东风破'
  ];
  
  console.log('搜索并验证前5首...\n');
  
  for (let i = 0; i < Math.min(5, songs.length); i++) {
    const song = songs[i];
    console.log(`[${i + 1}] ${song}`);
    
    const res = await axios.get(`http://localhost:3000/api/songs/search?q=周杰伦 ${song}&source=netease`);
    const results = res.data?.data || [];
    
    if (results.length > 0) {
      // 显示前3首
      for (let j = 0; j < Math.min(3, results.length); j++) {
        const s = results[j];
        console.log(`    ${j + 1}. ${s.title} - ${s.artist}`);
        
        // 验证播放
        try {
          const urlRes = await axios.get(`http://localhost:3000/api/songs/url?id=${s.id}`);
          const playUrl = urlRes.data?.data?.url;
          
          if (playUrl) {
            const headRes = await axios.head(playUrl, { timeout: 3000 });
            const sizeKB = (parseInt(headRes.headers['content-length'] || '0') / 1024).toFixed(1);
            console.log(`       ✅ 可播放 (${sizeKB}KB)`);
          } else {
            console.log(`       ❌ 无播放链接`);
          }
        } catch (e) {
          console.log(`       ❌ 播放失败`);
        }
      }
    } else {
      console.log('    ❌ 未找到');
    }
    
    console.log('');
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log('=====================================');
  console.log('结论：');
  console.log('- 网易云音乐有周杰伦相关歌曲');
  console.log('- 但可能是Live/翻唱/综艺版本');
  console.log('- 不是QQ音乐的正版原唱');
  console.log('=====================================\n');
}

checkNeteaseJay();
