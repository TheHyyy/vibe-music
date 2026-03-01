import axios from 'axios';

async function finalVerify() {
  console.log('🎉 最终验证 - 周杰伦VIP歌曲\n');
  console.log('=====================================\n');
  
  const testSongs = ['晴天', '七里香', '稻香'];
  let successCount = 0;
  
  for (const song of testSongs) {
    console.log(`测试: ${song}`);
    
    const searchRes = await axios.get(`http://localhost:3000/api/songs/search?q=周杰伦 ${song}&source=qq`);
    const first = searchRes.data?.data?.[0];
    
    if (first) {
      console.log(`  找到: ${first.title} - ${first.artist}`);
      
      const urlRes = await axios.get(`http://localhost:3000/api/songs/url?id=${first.id}`);
      const playUrl = urlRes.data?.data?.url;
      
      if (playUrl) {
        try {
          const headRes = await axios.head(playUrl, { timeout: 5000 });
          const sizeKB = (parseInt(headRes.headers['content-length'] || '0') / 1024).toFixed(1);
          console.log(`  ✅ 可播放 (HTTP ${headRes.status}, ${sizeKB}KB)\n`);
          successCount++;
        } catch (e: any) {
          console.log(`  ❌ 失败: ${e.message}\n`);
        }
      } else {
        console.log(`  ❌ 无播放链接\n`);
      }
    }
    
    await new Promise(r => setTimeout(r, 800));
  }
  
  console.log('=====================================');
  if (successCount === testSongs.length) {
    console.log('🎉 全部验证成功！');
    console.log(`✅ ${successCount}/${testSongs.length} 首歌曲可播放`);
    console.log('✅ 配置完成！');
  } else {
    console.log(`⚠️  部分成功 (${successCount}/${testSongs.length})`);
  }
  console.log('=====================================\n');
}

finalVerify();
