import { MetingQQProvider } from './src/music/meting-qq.js';
import axios from 'axios';

async function test() {
  console.log('🔍 测试Meting QQ音乐 - 周杰伦歌曲\n');
  
  const meting = new MetingQQProvider();
  
  const testSongs = ['晴天', '七里香', '稻香'];
  
  for (const song of testSongs) {
    console.log(`\n搜索: 周杰伦 ${song}`);
    
    try {
      const results = await meting.search(`周杰伦 ${song}`);
      console.log(`  找到 ${results.length} 首歌曲`);
      
      if (results.length > 0) {
        const first = results[0];
        console.log(`  第一首: ${first.title} - ${first.artist}`);
        
        // 获取播放链接
        const url = await meting.getPlayUrl(first.id);
        
        if (url) {
          console.log(`  播放链接: ${url.substring(0, 80)}...`);
          
          // 真实验证
          try {
            const headRes = await axios.head(url, { timeout: 5000 });
            console.log(`  ✅ 可播放 (HTTP ${headRes.status})`);
          } catch (e: any) {
            console.log(`  ❌ 链接失效 (${e.message})`);
          }
        } else {
          console.log(`  ❌ 无播放链接`);
        }
      }
      
      await new Promise(r => setTimeout(r, 800));
      
    } catch (e: any) {
      console.log(`  ❌ 错误: ${e.message}`);
    }
  }
}

test();
