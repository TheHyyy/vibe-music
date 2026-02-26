# 🚀 Vibe Music 快速部署命令

## 📋 你需要执行的命令

### 步骤 1: 本地准备（已完成）
```bash
cd /Users/houyu/Desktop/project/vibe-music

# 后端编译
cd server && npm run build

# 前端构建
cd ../web && npm run build

# 复制前端
cd ../server && cp -r ../web/dist ./client_dist
```

---

### 步骤 2: 上传到服务器

#### 方式 A: 使用 rsync（推荐）
```bash
# 在本地执行
rsync -avz --exclude 'node_modules' --exclude '.git' \
  /Users/houyu/Desktop/project/vibe-music/server/ \
  root@你的服务器IP:/root/vibe-music/
```

#### 方式 B: 使用 scp
```bash
# 在本地执行
cd /Users/houyu/Desktop/project/vibe-music
tar -czf vibe-music.tar.gz --exclude='node_modules' --exclude='.git' server/
scp vibe-music.tar.gz root@你的服务器IP:/root/
```

---

### 步骤 3: 服务器配置

```bash
# 登录服务器
ssh root@你的服务器IP

# 解压（如果使用 scp）
cd /root
tar -xzf vibe-music.tar.gz
mv server vibe-music

# 进入目录
cd /root/vibe-music

# 安装依赖
npm install --production

# 启动服务
npm start
```

---

### 步骤 4: 使用 PM2（推荐）

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
cd /root/vibe-music
pm2 start dist/index.js --name vibe-music

# 设置开机自启
pm2 save
pm2 startup
```

---

## 🔍 验证部署

```bash
# 检查服务
curl http://localhost:3001/api/health

# 测试搜索
curl "http://localhost:3001/api/songs/search?q=周杰伦&page=1"

# 查看 PM2 状态
pm2 status
```

---

## 🌐 访问应用

**http://你的服务器IP:3001**

---

## 📝 本次更新

- ✅ 添加酷狗音乐源（可搜索周杰伦）
- ✅ 移除咪咕音乐
- ✅ 集成 musicfree-api

---

## ⚠️ 注意

1. 确保服务器端口 3001 已开放
2. 确保服务器有 Node.js 18+
3. 首次部署需要安装依赖：`npm install`

---

**准备好了就告诉我，我给你完整的一键部署命令！** 🎉
