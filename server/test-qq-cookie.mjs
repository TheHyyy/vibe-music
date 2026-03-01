#!/usr/bin/env node
/**
 * QQ 音乐 Cookie 测试脚本
 * 用于测试 .env 中配置的 QQ_COOKIE 是否有效
 */

import 'dotenv/config';
import qq from 'qq-music-api';

const cookie = process.env.QQ_COOKIE;

if (!cookie) {
  console.error('❌ 未配置 QQ_COOKIE');
  console.log('\n请在 server/.env 文件中添加：');
  console.log('QQ_COOKIE=your_cookie_here');
  process.exit(1);
}

console.log('✓ 检测到 QQ_COOKIE');
console.log('Cookie 长度:', cookie.length);

// 设置 Cookie
try {
  qq.setCookie(cookie);
  console.log('✓ Cookie 设置成功');
} catch (e) {
  console.error('❌ Cookie 设置失败:', e.message);
  process.exit(1);
}

// 测试搜索
console.log('\n测试搜索功能...');
try {
  const searchResult = await qq.api('search', { key: '周杰伦', pageSize: 3 });
  const songs = searchResult?.list || searchResult?.data?.list || [];
  
  if (songs.length > 0) {
    console.log(`✓ 搜索成功，找到 ${songs.length} 首歌曲`);
    console.log('第一首:', songs[0].songname, '-', songs[0].singer?.map(a => a.name).join(', '));
  } else {
    console.log('⚠️  搜索成功但未找到结果');
  }
} catch (e) {
  console.error('❌ 搜索失败:', e.message || e);
}

// 测试获取播放链接
console.log('\n测试获取播放链接...');
try {
  const urlResult = await qq.api('song/urls', { id: '0039MnYb0qxYhV' }); // 晴天
  const url = urlResult?.['0039MnYb0qxYhV'];
  
  if (url) {
    console.log('✓ 播放链接获取成功');
    console.log('URL:', url.substring(0, 100) + '...');
  } else {
    console.error('❌ 无法获取播放链接');
    console.log('\n可能的原因：');
    console.log('1. Cookie 无效或已过期');
    console.log('2. 歌曲需要 VIP 权限');
    console.log('3. Cookie 格式不正确');
  }
} catch (e) {
  console.error('❌ 获取播放链接失败:', e.message || e);
  console.log('\n建议：');
  console.log('1. 重新获取 Cookie（参考 QQ_MUSIC_COOKIE_GUIDE.md）');
  console.log('2. 确保使用完整的 Cookie（不只是 qm_keyst）');
  console.log('3. 确认 QQ 音乐账号已登录');
}

console.log('\n测试完成！');
