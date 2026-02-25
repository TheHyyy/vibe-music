# Echo Music - 前后端一体化部署
# 前端构建后由后端 Express 托管

# ==================== 构建阶段 ====================
FROM node:20-alpine AS builder

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package 文件
COPY web/package.json web/pnpm-lock.yaml ./web/
COPY server/package.json server/pnpm-lock.yaml ./server/

# 安装依赖
WORKDIR /app/web
RUN pnpm install --frozen-lockfile

WORKDIR /app/server
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY web/ ./web/
COPY server/ ./server/

# 构建前端 (输出到 server/client_dist)
WORKDIR /app/web
RUN pnpm run build

# 构建后端
WORKDIR /app/server
RUN pnpm run build

# ==================== 运行阶段 ====================
FROM node:20-alpine AS runner

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制后端 package 和构建产物
COPY server/package.json server/pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# 复制后端构建产物
COPY --from=builder /app/server/dist ./dist

# 复制前端构建产物到 client_dist
COPY --from=builder /app/server/client_dist ./client_dist

# 环境变量 (通过 docker run -e 传入)
ENV NODE_ENV=production

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["node", "dist/index.js"]
