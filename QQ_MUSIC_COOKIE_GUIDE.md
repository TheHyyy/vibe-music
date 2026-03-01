# QQ 音乐 Cookie 获取指南

## 问题：播放失败

如果搜索 QQ 音乐成功，但播放时报错：
```
此歌曲可能需要 VIP 权限或登录后才能播放，请检查 QQ_COOKIE 配置
```

这是因为 QQ 音乐需要有效的 Cookie 才能获取播放链接。

## 解决方案：获取有效的 Cookie

### 方法 1：从浏览器获取（推荐）

1. **打开 QQ 音乐官网**
   - 访问 https://y.qq.com
   - 登录你的 QQ 音乐账号（建议使用 QQ 号登录）

2. **打开开发者工具**
   - 按 `F12` 或右键点击页面 → "检查"
   - 切换到 "Application"（应用）标签

3. **获取 Cookie**
   - 左侧选择 "Cookies" → "https://y.qq.com"
   - 找到 `qm_keyst` 这一项（这是最重要的）
   - 复制它的 Value 值

4. **配置到 .env**
   ```bash
   # 编辑 server/.env 文件
   QQ_COOKIE=qm_keyst=你复制的值
   ```

### 方法 2：从 Network 请求中获取

1. 打开 https://y.qq.com 并登录
2. 按 `F12` 打开开发者工具
3. 切换到 "Network"（网络）标签
4. 刷新页面
5. 点击任意一个请求（如 `fcg_...`）
6. 在 "Request Headers"（请求头）中找到 `cookie`
7. 复制整个 cookie 值

### 方法 3：使用完整 Cookie（最稳定）

如果上面的方法不行，可以复制完整的 Cookie：

1. 按 `F12` → "Application" → "Cookies" → "https://y.qq.com"
2. 复制所有 cookie（不只是 qm_keyst）
3. 格式示例：
   ```
   QQ_COOKIE=qm_keyst=xxx; uin=12345678; skey=xxx; ...
   ```

## 重启服务

配置完成后，重启服务：

```bash
# 如果使用 tsx watch
cd server
# 保存文件后会自动重启

# 或者手动重启
pm2 restart vibe-music
```

## 测试

```bash
# 测试搜索（应该成功）
curl 'http://localhost:3000/api/songs/search?q=周杰伦&page=1&source=qq'

# 测试播放链接（配置 Cookie 后应该成功）
curl 'http://localhost:3000/api/songs/url?id=qq:0039MnYb0qxYhV'
```

## 常见问题

### Q: Cookie 多久过期？
A: QQ 音乐 Cookie 通常 7-30 天过期，过期后需要重新获取。

### Q: 不想配置 Cookie 怎么办？
A: 可以使用网易云音乐的资源，QQ 音乐搜索功能仍然可用，但播放可能受限。

### Q: VIP 歌曲能播放吗？
A: 如果你的 QQ 音乐账号是 VIP，配置 Cookie 后可以播放 VIP 歌曲。否则只能播放免费歌曲。

### Q: Cookie 无效怎么办？
A: 
1. 确保已登录 y.qq.com
2. 尝试使用完整 Cookie（不只是 qm_keyst）
3. 检查 Cookie 是否包含特殊字符（需要正确转义）

## 临时方案：使用网易云音源

如果暂时无法获取 QQ 音乐 Cookie，可以：
1. 搜索时选择 `source=all`（会同时搜索网易云和 QQ）
2. 播放时选择网易云音乐的歌曲（ID 以 `netease:` 开头）

---

**提示**：配置 Cookie 后，建议测试几首不同的歌曲，因为有些歌曲可能确实需要 VIP 权限。
