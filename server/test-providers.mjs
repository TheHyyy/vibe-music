// 测试音乐源
import { NeteaseProvider } from './dist/music/netease.js';
import { QQProvider } from './dist/music/qq.js';

async function testProviders() {
  console.log('=== 测试音乐源 ===\n');

  // 测试网易云
  console.log('1. 测试网易云音乐...');
  const netease = new NeteaseProvider();
  const neteaseSongs = await netease.search('周杰伦');
  console.log(`✅ 网易云搜索成功，找到 ${neteaseSongs.length} 首歌`);

  if (neteaseSongs.length > 0) {
    const firstSong = neteaseSongs[0];
    console.log(`   第一首: ${firstSong.title} - ${firstSong.artist}`);

    try {
      const url = await netease.getPlayUrl(firstSong.id);
      console.log(`   ✅ 播放链接: ${url ? '获取成功' : '获取失败'}`);
    } catch (e) {
      console.log(`   ❌ 播放链接失败: ${e.message}`);
    }
  }

  console.log('');

  // 测试 QQ 音乐（原版，需要 Cookie）
  console.log('2. 测试 QQ 音乐（原版）...');
  const qq = new QQProvider();
  const qqSongs = await qq.search('周杰伦');
  console.log(`✅ QQ 音乐搜索成功，找到 ${qqSongs.length} 首歌`);

  if (qqSongs.length > 0) {
    const firstSong = qqSongs[0];
    console.log(`   第一首: ${firstSong.title} - ${firstSong.artist}`);

    try {
      const url = await qq.getPlayUrl(firstSong.id);
      console.log(`   ✅ 播放链接: ${url ? '获取成功' : '获取失败'}`);
    } catch (e) {
      console.log(`   ❌ 播放链接失败: ${e.message}`);
    }
  }

  console.log('');

  // 测试 QQ 音乐（Rain120 版本，需要 API 服务）
  console.log('3. 测试 QQ 音乐（Rain120 版本）...');
  const { QQRain120Provider } = await import('./dist/music/qq-rain120.js');
  const qqRain120 = new QQRain120Provider();

  // 先测试 API 是否可用
  try {
    const testUrl = process.env.QQ_MUSIC_API_BASE || 'http://localhost:3200';
    console.log(`   API 地址: ${testUrl}`);
    console.log('   ⚠️  需要先启动 Rain120 的 QQ 音乐 API 服务');
    console.log('   启动命令: cd /path/to/qq-music-api && npm start');
  } catch (e) {
    console.log(`   ❌ API 不可用: ${e.message}`);
  }
}

testProviders();
