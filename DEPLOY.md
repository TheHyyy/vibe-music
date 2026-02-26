# Vibe Music 部署指南

## 📋 部署前检查

### 1. 本地构建
```bash
cd /Users/houyu/Desktop/project/vibe-music

# 后端
cd server
npm install
npm run build

# 前端
cd ../web
npm install
npm run build

# 复制前端到后端
cd ../server
cp -r ../web/dist ./client_dist
```

### 2. 需要上传的文件
- `server/` 目录（除了 node_modules）
- `web/dist/` 已复制到 `server/client_dist/`

---

## 🚀 部署到腾讯云

### 方式一：使用 rsync（推荐）

```bash
# 在本地执行
rsync -avz --exclude 'node_modules' \
  /Users/houyu/Desktop/project/vibe-music/server/ \
  root@你的服务器IP:/root/vibe-music/

# 登录服务器
ssh root@你的服务器IP

# 安装依赖
cd /root/vibe-music
npm install --production

# 启动服务
npm start
```

### 方式二：使用 Git

```bash
# 1. 提交代码
cd /Users/houyu/Desktop/project/vibe-music
git add .
git commit -m "feat: 添加酷狗音乐源"
git push

# 2. 登录服务器
ssh root@你的服务器IP

# 3. 拉取代码
cd /root/vibe-music
git pull

# 4. 安装依赖
npm install --production

# 5. 构建前端
cd web && npm install && npm run build
cd ../server
cp -r ../web/dist ./client_dist

# 6. 启动服务
npm start
```

---

## 🔧 使用 PM2 保持运行

### 安装 PM2
```bash
npm install -g pm2
```

### 启动服务
```bash
cd /root/vibe-music
pm2 start dist/index.js --name vibe-music
```

### PM2 常用命令
```bash
pm2 list              # 查看所有进程
pm2 logs vibe-music   # 查看日志
pm2 restart vibe-music # 重启
pm2 stop vibe-music   # 停止
pm2 save              # 保存进程列表
pm2 startup           # 设置开机自启
```

---

## 🔐 环境变量配置

### server/.env
```bash
# 端口
PORT=3001

# JWT 密钥（请修改）
JWT_SECRET=your-secret-key-change-this

# 网易云音乐 Cookie
NETEASE_COOKIE=你的网易云Cookie

# 酷狗音乐（通过 musicfree-api）
ENABLE_KUGOU_MUSIC=true

# QQ音乐（暂不可用）
ENABLE_QQ_MUSIC=false
QQ_COOKIE=你的QQCookie

# AI 配置（可选）
AI_API_KEY=your-api-key
AI_MODEL=claude-3-5-sonnet

# 飞书配置（可选）
FEISHU_WEBHOOK_URL=your-webhook-url
```

---

## ✅ 验证部署

### 1. 检查服务状态
```bash
curl http://localhost:3001/api/health
```

### 2. 测试搜索
```bash
curl "http://localhost:3001/api/songs/search?q=周杰伦&page=1"
```

### 3. 检查音乐源
- 网易云：红色标签
- 酷狗：蓝色标签

---

## 🔄 更新部署

### 快速更新
```bash
# 本地
git add . && git commit -m "update" && git push

# 服务器
cd /root/vibe-music
git pull
npm run build
pm2 restart vibe-music
```

---

## 📊 本次更新内容

### ✅ 新增功能
1. **酷狗音乐源** - 可以搜索周杰伦原版
2. **musicfree-api** - 多平台音乐接口

### ❌ 移除功能
1. **咪咕音乐** - 已完全移除

### 🔧 优化
1. 代码清理
2. 类型定义更新
3. 配置优化

---

## 📝 注意事项

1. **musicfree-api** 是第三方库，可能存在不稳定性
2. **酷狗音乐** 不需要会员即可播放完整版
3. **网易云** 部分歌曲仍需要会员
4. 建议定期检查服务状态

---

## 🆘 常见问题

### Q: 搜索不到歌曲？
A: 检查网络连接，确认 ENABLE_KUGOU_MUSIC=true

### Q: 播放链接无效？
A: musicfree-api 的链接有时效性，刷新页面重试

### Q: 服务启动失败？
A: 检查端口占用：`lsof -i :3001`

---

**部署完成后，访问：http://你的服务器IP:3001**

---

*最后更新：2026-02-26*
