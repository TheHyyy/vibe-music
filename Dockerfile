# Echo Music - 前后端一体化部署
# 前端构建后由后端 Express 托管

# ==================== 构建阶段 ====================
FROM micr.cloud.mioffice.cn/dockerhub/library/node:20 AS builder

WORKDIR /app

# 配置 npm 源并安装 pnpm
RUN npm config set registry https://pkgs.d.xiaomi.net/artifactory/api/npm/mi-npm/ && \
    npm install -g pnpm

# 复制 package 文件
COPY web/package.json web/pnpm-lock.yaml ./web/
COPY server/package.json server/pnpm-lock.yaml ./server/

# 安装前端依赖
WORKDIR /app/web
RUN pnpm install --frozen-lockfile

# 安装后端依赖
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
FROM micr.cloud.mioffice.cn/dockerhub/library/node:20 AS runner

WORKDIR /app

# 配置 npm 源并安装 pnpm
RUN npm config set registry https://pkgs.d.xiaomi.net/artifactory/api/npm/mi-npm/ && \
    npm install -g pnpm

# 复制后端 package 文件
COPY server/package.json server/pnpm-lock.yaml ./

# 安装生产依赖
RUN pnpm install --prod --frozen-lockfile

# 复制后端构建产物
COPY --from=builder /app/server/dist ./dist

# 复制前端构建产物到 client_dist
COPY --from=builder /app/server/client_dist ./client_dist

# 复制环境变量文件
COPY server/.env ./.env

# 环境变量
ENV NODE_ENV=production

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["node", "dist/index.js"]
