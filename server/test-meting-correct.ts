import axios from 'axios';

async function testMetingCorrect() {
  console.log('🔍 测试Meting API的正确用法\n');
  
  // Meting API格式: ?type=搜索类型&id=关键词
  // 搜索类型: search, song, url, lyric, playlist
  
  const apis = [
    {
      name: 'Meting (tencent/QQ)',
      url: 'https://api.injahow.cn/meting/',
      params: { type: 'search', id: '周杰伦 晴天' },
    },
    {
      name: 'Meting (netease)',
      url: 'https://api.injahow.cn/meting/',
      params: { type: 'search', id: '周杰伦 晴天', server: 'netease' },
    },
  ];
  
  for (const api of apis) {
    console.log(`\n测试: ${api.name}`);
    console.log(`URL: ${api.url}`);
    console.log(`参数:`, api.params);
    
    try {
      const res = await axios.get(api.url, {
        params: api.params,
        timeout: 10000,
      });
      
      console.log(`\n响应状态: ${res.status}`);
      console.log(`响应类型: ${typeof res.data}`);
      console.log(`响应内容:`, JSON.stringify(res.data, null, 2).substring(0, 500));
      
      if (Array.isArray(res.data) && res.data.length > 0) {
        const first = res.data[0];
        console.log(`\n第一首歌:`);
        console.log(`  名称: ${first.name || first.title}`);
        console.log(`  歌手: ${first.artist || first.author}`);
        console.log(`  ID: ${first.id}`);
        
        // 获取播放链接
        if (first.url) {
          console.log(`  播放链接: ${first.url}`);
        } else {
          console.log(`\n尝试获取播放链接...`);
          const urlRes = await axios.get(api.url, {
            params: { type: 'url', id: first.id },
            timeout: 10000,
          });
          
          console.log(`URL响应:`, JSON.stringify(urlRes.data, null, 2).substring(0, 300));
        }
      }
      
    } catch (e: any) {
      console.log(`❌ 错误: ${e.message}`);
      if (e.response) {
        console.log(`响应:`, e.response.data);
      }
    }
  }
}

testMetingCorrect();
