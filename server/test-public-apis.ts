import axios from 'axios';

// 测试公开的音乐API服务
async function testPublicAPIs() {
  console.log('🔍 测试公开音乐API服务\n');
  
  const apis = [
    // 这些是一些开源项目的公共API
    {
      name: '音乐API（公共）',
      url: 'https://api.injahow.cn/meting/',
      params: { type: 'search', id: '周杰伦 晴天' },
    },
    {
      name: '小幻音乐API',
      url: 'https://api.lolimi.cn/API/wydg/',
      params: { msg: '周杰伦 晴天', type: '1' },
    },
  ];
  
  for (const api of apis) {
    console.log(`\n========== ${api.name} ==========`);
    console.log(`URL: ${api.url}`);
    
    try {
      const res = await axios.get(api.url, {
        params: api.params,
        timeout: 10000,
      });
      
      console.log(`响应状态: ${res.status}`);
      console.log(`响应数据:`, JSON.stringify(res.data, null, 2).substring(0, 500));
      
    } catch (e: any) {
      console.log(`❌ 错误: ${e.message}`);
    }
    
    await new Promise(r => setTimeout(r, 1000));
  }
}

testPublicAPIs();
