// 测试 wp_MusicApi 公共服务器
import axios from 'axios';

async function testWpApi() {
  try {
    console.log('=== 测试 wp_MusicApi 公共服务器 ===\n');

    const API_BASE = 'http://iecoxe.top:3000';

    // 测试搜索
    console.log('1. 测试搜索 "周杰伦"...');
    const searchRes = await axios.get(`${API_BASE}/search`, {
      params: {
        keyword: '周杰伦',
        type: 'qq', // QQ 音乐
        page: 1,
        size: 5
      },
      timeout: 10000
    });

    console.log('搜索结果：', JSON.stringify(searchRes.data, null, 2).substring(0, 500));

    // 测试获取播放链接
    if (searchRes.data?.data?.length > 0) {
      const firstSong = searchRes.data.data[0];
      console.log('\n2. 测试获取播放链接...');
      console.log('歌曲信息：', firstSong.name, '-', firstSong.singer);

      const urlRes = await axios.get(`${API_BASE}/song/url`, {
        params: {
          type: 'qq',
          mid: firstSong.id || firstSong.mid
        },
        timeout: 10000
      });

      console.log('播放链接：', JSON.stringify(urlRes.data, null, 2));
    }

  } catch (e) {
    console.error('❌ 测试失败：', e.message);
    if (e.response) {
      console.error('响应数据：', e.response.data);
    }
  }
}

testWpApi();
