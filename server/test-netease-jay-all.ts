import axios from 'axios';

async function test() {
  console.log('🔍 搜索网易云音乐 - 周杰伦（显示前20首）\n');
  
  const res = await axios.get('http://localhost:3000/api/songs/search?q=周杰伦&source=netease');
  const songs = res.data?.data || [];
  
  console.log(`找到 ${songs.length} 首歌曲\n`);
  
  // 测试前10首是否真的能播放
  for (let i = 0; i < Math.min(10, songs.length); i++) {
    const song = songs[i];
    console.log(`${i + 1}. ${song.title} - ${song.artist}`);
    
    try {
      const urlRes = await axios.get(`http://localhost:3000/api/songs/url?id=${song.id}`, { timeout: 5000 });
      const url = urlRes.data?.data?.url;
      
      if (url) {
        // 真实验证
        try {
          const headRes = await axios.head(url, { timeout: 5000 });
          console.log(`   ✅ 可播放 (HTTP ${headRes.status}, ${(headRes.headers['content-length'] / 1024).toFixed(1)}KB)`);
        } catch (e: any) {
          console.log(`   ❌ 链接失效 (${e.message})`);
        }
      } else {
        console.log(`   ❌ 无播放链接`);
      }
    } catch (e: any) {
      console.log(`   ❌ 错误: ${e.message}`);
    }
    
    await new Promise(r => setTimeout(r, 300));
  }
}

test();
