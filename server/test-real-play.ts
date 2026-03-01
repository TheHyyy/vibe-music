import axios from 'axios';

async function testRealPlay() {
  console.log('🔍 测试真实播放能力\n');
  
  // 1. 获取播放链接
  console.log('1️⃣ 获取周杰伦 - 晴天 播放链接...');
  const urlRes = await axios.get('http://localhost:3000/api/songs/url?id=qq:0039MnYb0qxYhV');
  const playUrl = urlRes.data?.data?.url;
  
  if (!playUrl) {
    console.log('❌ 无法获取播放链接');
    return;
  }
  
  console.log('✅ 获取到链接:', playUrl);
  
  // 2. 尝试真实访问（验证是否能播放）
  console.log('\n2️⃣ 尝试访问播放链接...');
  try {
    const headRes = await axios.head(playUrl, {
      timeout: 10000,
      validateStatus: (status) => status < 400,
    });
    
    console.log('✅ HTTP状态码:', headRes.status);
    console.log('✅ Content-Type:', headRes.headers['content-type']);
    console.log('✅ Content-Length:', headRes.headers['content-length']);
    
    // 3. 尝试下载前1KB验证
    console.log('\n3️⃣ 下载前1KB验证...');
    const testRes = await axios.get(playUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: { Range: 'bytes=0-1023' },
    });
    
    const size = testRes.data.byteLength;
    console.log(`✅ 成功下载 ${size} 字节`);
    console.log('✅ 播放链接有效！');
    
  } catch (e: any) {
    console.log('❌ 访问失败:', e.message);
    if (e.response) {
      console.log('状态码:', e.response.status);
      console.log('响应:', e.response.data?.toString().substring(0, 200));
    }
  }
}

testRealPlay();
