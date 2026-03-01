import axios from 'axios';

async function manualTest() {
  console.log('🔍 手动测试VIP播放\n');
  
  try {
    // 搜索
    const searchRes = await axios.get('http://localhost:3000/api/songs/search?q=周杰伦 晴天&source=qq');
    const song = searchRes.data?.data?.[0];
    
    console.log(`歌曲: ${song.title} - ${song.artist}`);
    console.log(`ID: ${song.id}`);
    
    // 获取播放链接
    const urlRes = await axios.get(`http://localhost:3000/api/songs/url?id=${song.id}`);
    const playUrl = urlRes.data?.data?.url;
    
    if (playUrl) {
      console.log(`\n播放链接: ${playUrl.substring(0, 100)}...`);
      
      // 验证
      try {
        const headRes = await axios.head(playUrl, { timeout: 5000 });
        console.log(`✅ HTTP ${headRes.status}`);
        console.log(`Content-Type: ${headRes.headers['content-type']}`);
        console.log(`Content-Length: ${headRes.headers['content-length']}`);
      } catch (e: any) {
        console.log(`❌ 访问失败: ${e.message}`);
        console.log(`状态码: ${e.response?.status}`);
      }
    } else {
      console.log('❌ 无播放链接');
      console.log('响应:', JSON.stringify(urlRes.data, null, 2));
    }
    
  } catch (e: any) {
    console.log(`❌ 错误: ${e.message}`);
  }
}

manualTest();
