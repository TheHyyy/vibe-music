# Vibe Music - 前后端一体化部署
# 前端构建后由后端 Express 托管

# ==================== 构建阶段 ====================
FROM node:20-alpine AS builder

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package 文件（利用缓存）
COPY web/package.json web/pnpm-lock.yaml ./web/
COPY server/package.json server/pnpm-lock.yaml ./server/

# 安装依赖
WORKDIR /app/web
RUN pnpm install

WORKDIR /app/server
RUN pnpm install

# 复制源代码
COPY web/ ./web/
COPY server/ ./server/

# 构建前端（输出到 server/client_dist）
WORKDIR /app/web
RUN pnpm run build && ls -la ../server/client_dist/

# 构建后端
WORKDIR /app/server
RUN pnpm run build

# ==================== 运行阶段 ====================
FROM node:20-alpine AS runner

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制后端 package 和 lockfile
COPY --from=builder /app/server/package.json /app/server/package.json
COPY --from=builder /app/server/pnpm-lock.yaml /app/server/pnpm-lock.yaml

# 安装生产依赖
WORKDIR /app/server
RUN pnpm install --prod

# 复制构建产物
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/client_dist ./client_dist

# 验证文件存在
RUN ls -la ./client_dist/

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "dist/index.js"]
