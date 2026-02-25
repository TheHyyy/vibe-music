# Echo Music - 前后端一体化部署
# 前端构建后由后端 Express 托管

# ==================== 构建阶段 ====================
FROM node:20-alpine AS builder

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制所有源代码
COPY web/ ./web/
COPY server/ ./server/

# 安装前端依赖并构建
WORKDIR /app/web
RUN pnpm install
RUN pnpm run build

# 安装后端依赖并构建
WORKDIR /app/server
RUN pnpm install
RUN pnpm run build

# ==================== 运行阶段 ====================
FROM node:20-alpine AS runner

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制后端 package 和构建产物
COPY server/package.json server/pnpm-lock.yaml ./
RUN pnpm install --prod

# 复制后端构建产物
COPY --from=builder /app/server/dist ./dist

# 复制前端构建产物到 client_dist
COPY --from=builder /app/server/client_dist ./client_dist

# 皴露端口
EXPOSE 3001

# 启动命令
CMD ["node", "dist/index.js"]
