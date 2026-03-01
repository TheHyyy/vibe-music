#!/usr/bin/env node
/**
 * 测试 music-api 包是否可以无需登录获取 QQ 音乐播放链接
 */

import musicAPI from 'music-api';

console.log('测试 music-api 包\n');

// 测试搜索
console.log('1. 测试搜索 QQ 音乐...');
try {
  const searchResult = await musicAPI.searchSong('qq', {
    key: '晴天 周杰伦',
    limit: 3,
    page: 1,
  });

  console.log('✓ 搜索成功');
  console.log('找到歌曲数:', searchResult.songList?.length || 0);

  if (searchResult.songList && searchResult.songList.length > 0) {
    const firstSong = searchResult.songList[0];
    console.log('\n第一首歌:');
    console.log('  歌名:', firstSong.name);
    console.log('  歌手:', firstSong.singer?.map(s => s.name).join(', '));
    console.log('  ID:', firstSong.id);

    // 测试获取播放链接
    console.log('\n2. 测试获取播放链接...');
    try {
      const songResult = await musicAPI.getSong('qq', {
        id: firstSong.id,
        raw: false,
      });

      console.log('✓ 获取播放链接成功');
      console.log('播放链接:', songResult.url);
      console.log('比特率:', songResult.bitrate);
      console.log('文件大小:', songResult.fileSize);

      if (songResult.url) {
        console.log('\n🎉 成功！music-api 可以无需登录获取 QQ 音乐播放链接！');
      } else {
        console.log('\n❌ 播放链接为空');
      }
    } catch (err) {
      console.error('❌ 获取播放链接失败:', err.message || err);
    }
  }
} catch (err) {
  console.error('❌ 搜索失败:', err.message || err);
}

console.log('\n测试完成！');
