# QQ 音乐集成指南

本项目支持三种 QQ 音乐实现方式，推荐使用 **Meting**。

## 🎵 三种实现方式对比

| 实现方式 | 特点 | 是否需要登录 | 推荐指数 |
|---------|------|-------------|---------|
| **Meting** | 功能全面，支持搜索、歌词、封面等 | 可选（推荐设置 Cookie） | ⭐⭐⭐⭐⭐ |
| **Rain120 API** | 轻量级，无需登录 | 否 | ⭐⭐⭐⭐ |
| **qq-music-api** | 官方 API 封装 | 是（必须设置 Cookie） | ⭐⭐⭐ |

---

## 🚀 快速开始

### 1. 启用 QQ 音乐

在 `.env` 文件中设置：

```bash
# 启用 QQ 音乐
ENABLE_QQ_MUSIC=true

# 选择 QQ 音乐实现方式
QQ_MUSIC_PROVIDER=meting
```

### 2. 配置 Cookie（推荐）

虽然 Meting 可以在无 Cookie 情况下工作，但设置 Cookie 可以获得更好的体验：

```bash
# QQ 音乐 Cookie
QQ_COOKIE=your_qq_music_cookie_here
```

#### 如何获取 QQ 音乐 Cookie：

1. 打开 [y.qq.com](https://y.qq.com) 并登录
2. 按 F12 打开开发者工具
3. 切换到 Network 标签
4. 刷新页面，点击任意请求（如 `fcg_...`）
5. 在 Request Headers 中复制 `cookie` 的值

---

## 📋 环境变量说明

### ENABLE_QQ_MUSIC
- **类型**: `boolean`
- **默认值**: `false`
- **说明**: 是否启用 QQ 音乐源

### QQ_MUSIC_PROVIDER
- **类型**: `string`
- **可选值**: 
  - `meting` - 使用 Meting API（推荐）
  - `rain120` - 使用 Rain120 QQ Music API
  - `qq-music-api` - 使用 qq-music-api 包
- **默认值**: `qq-music-api`
- **说明**: 选择 QQ 音乐的实现方式

### QQ_COOKIE
- **类型**: `string`
- **说明**: QQ 音乐的 Cookie，用于获取更高音质和更多功能
- **获取方式**: 见上文

---

## 🔧 不同实现方式的配置

### 方式 1: Meting（推荐）

```bash
ENABLE_QQ_MUSIC=true
QQ_MUSIC_PROVIDER=meting
QQ_COOKIE=your_cookie_here  # 可选，但推荐设置
```

**优点**:
- ✅ 功能全面（搜索、歌词、封面、播放链接）
- ✅ 无需 Cookie 也可使用（但有 Cookie 体验更好）
- ✅ 维护活跃，社区支持好
- ✅ 基于成熟的 Meting 项目

**缺点**:
- ⚠️ 无 Cookie 时部分功能受限

---

### 方式 2: Rain120 API

```bash
ENABLE_QQ_MUSIC=true
QQ_MUSIC_PROVIDER=rain120
QQ_MUSIC_API_BASE=https://your-rain120-api.com  # 可选
```

**优点**:
- ✅ 完全无需登录
- ✅ 部署简单
- ✅ 适合快速测试

**缺点**:
- ⚠️ 功能相对较少
- ⚠️ 依赖第三方 API 稳定性

---

### 方式 3: qq-music-api

```bash
ENABLE_QQ_MUSIC=true
QQ_MUSIC_PROVIDER=qq-music-api
QQ_COOKIE=your_cookie_here  # 必须设置
```

**优点**:
- ✅ 官方 API 封装
- ✅ 功能完整

**缺点**:
- ❌ 必须设置 Cookie
- ❌ Cookie 可能会过期，需要定期更新

---

## 🎯 使用示例

### 搜索 QQ 音乐

```bash
# 搜索接口会同时搜索所有启用的音乐源
curl "http://localhost:3001/api/songs/search?q=周杰伦&page=1"

# 只搜索 QQ 音乐
curl "http://localhost:3001/api/songs/search?q=周杰伦&page=1&source=qq"
```

### 获取播放链接

```bash
# QQ 音乐的 ID 格式为 qq:xxxxx
curl "http://localhost:3001/api/songs/qq:0012345/url"
```

### 获取歌词

```bash
curl "http://localhost:3001/api/songs/qq:0012345/lyric"
```

---

## 🐛 常见问题

### Q: 为什么搜索不到 QQ 音乐？

**A**: 检查以下几点：
1. 确认 `ENABLE_QQ_MUSIC=true`
2. 检查服务器日志，查看是否有错误信息
3. 如果使用 `qq-music-api`，确认 Cookie 是否有效

### Q: 播放链接无法获取？

**A**: 可能的原因：
1. 歌曲需要 VIP 权限
2. Cookie 已过期（使用 Meting 或 qq-music-api 时）
3. 地区限制

### Q: 如何切换 QQ 音乐实现方式？

**A**: 修改 `.env` 文件中的 `QQ_MUSIC_PROVIDER`，然后重启服务：
```bash
# 修改配置
vim .env

# 重启服务
pm2 restart vibe-music
```

---

## 📊 性能对比

基于测试，不同实现方式的性能对比：

| 指标 | Meting | Rain120 | qq-music-api |
|-----|--------|---------|--------------|
| 搜索速度 | ⚡⚡⚡⚡ | ⚡⚡⚡⚡⚡ | ⚡⚡⚡ |
| 播放链接获取 | ⚡⚡⚡⚡ | ⚡⚡⚡ | ⚡⚡⚡⚡ |
| 歌词获取 | ✅ | ✅ | ✅ |
| 封面获取 | ✅ | ❌ | ✅ |
| 稳定性 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## 🔗 相关链接

- [Meting GitHub](https://github.com/metowolf/Meting)
- [Meting-Fixed (PHP)](https://github.com/ELDment/Meting-Fixed)
- [Rain120 QQ Music API](https://github.com/Rain120/qq-music-api)
- [qq-music-api (npm)](https://www.npmjs.com/package/qq-music-api)

---

## 📝 更新日志

### 2026-02-26
- ✅ 新增 MetingQQProvider
- ✅ 支持通过环境变量选择 QQ 音乐实现方式
- ✅ 更新文档，提供详细的配置说明

---

## 💡 推荐配置

**生产环境推荐**:
```bash
ENABLE_QQ_MUSIC=true
QQ_MUSIC_PROVIDER=meting
QQ_COOKIE=your_cookie_here
```

**开发/测试环境推荐**:
```bash
ENABLE_QQ_MUSIC=true
QQ_MUSIC_PROVIDER=rain120
```

---

如有问题，请查看服务器日志或提交 Issue。
