# 音乐源配置建议

## 当前状态

- ✅ 网易云音乐：无需登录，搜索和播放都正常
- ⚠️ QQ 音乐：搜索正常，播放需要 Cookie

## 快速选择

### 如果你想要**立即可用**：
```bash
# 搜索时使用网易云或全部平台
curl 'http://localhost:3000/api/songs/search?q=晴天&source=all'
# 播放时选择 netease: 开头的歌曲
```

### 如果你需要**QQ音乐歌曲**：
```bash
# 1. 获取 Cookie（见 QQ_MUSIC_COOKIE_GUIDE.md）
# 2. 配置
echo "QQ_COOKIE=你的cookie" >> server/.env
# 3. 等待自动重启，即可使用
```

## 详细文档

- [QQ 音乐 Cookie 获取指南](./QQ_MUSIC_COOKIE_GUIDE.md)
- [QQ 音乐方案真实对比](./QQ_MUSIC_REALITY_CHECK.md)
