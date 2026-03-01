import axios from 'axios';

// 测试网易云音乐
async function testNetease() {
  console.log('🔍 测试网易云音乐 - 周杰伦正版歌曲\n');
  
  const songs = [
    '晴天', '七里香', '稻香', '青花瓷', '告白气球', '夜曲'
  ];
  
  for (const song of songs) {
    console.log(`\n搜索: 周杰伦 ${song}`);
    const searchRes = await axios.get(`http://localhost:3000/api/songs/search?q=周杰伦 ${song}&source=netease`);
    const results = searchRes.data?.data || [];
    
    if (results.length > 0) {
      // 找真正的周杰伦原唱（不是翻唱/Live）
      const original = results.find((s: any) => 
        s.artist.includes('周杰伦') && 
        !s.artist.includes('Live') &&
        !s.title.includes('Live') &&
        !s.title.includes('翻唱') &&
        !s.title.includes('版')
      ) || results[0];
      
      console.log(`  找到: ${original.title} - ${original.artist}`);
      
      // 获取播放链接
      try {
        const urlRes = await axios.get(`http://localhost:3000/api/songs/url?id=${original.id}`);
        const url = urlRes.data?.data?.url;
        
        if (url) {
          // 验证链接是否真的能访问
          try {
            const headRes = await axios.head(url, { timeout: 5000 });
            console.log(`  ✅ 可播放 (HTTP ${headRes.status})`);
          } catch (e: any) {
            console.log(`  ❌ 链接失效: ${e.message}`);
          }
        } else {
          console.log(`  ❌ 无播放链接`);
        }
      } catch (e: any) {
        console.log(`  ❌ 获取失败: ${e.message}`);
      }
    }
    
    await new Promise(r => setTimeout(r, 500));
  }
}

testNetease();
