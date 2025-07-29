# 天乙神算 Next.js 应用 Dockerfile
# 多阶段构建，优化镜像大小和构建效率

# ===== 基础镜像 =====
# 使用阿里云镜像加速 - 升级到Node.js 20 LTS
FROM docker.io/library/node:20-alpine AS base

# 设置代理参数（可选，构建时传入）
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY
ENV HTTP_PROXY=$HTTP_PROXY
ENV HTTPS_PROXY=$HTTPS_PROXY  
ENV NO_PROXY=$NO_PROXY

# 安装必要的系统依赖
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 复制包管理文件
COPY package*.json ./

# ===== 依赖安装阶段 =====
FROM base AS deps

# 更新npm到最新版本（Node.js 20支持）
RUN npm install -g npm@latest

# 安装生产和开发依赖
RUN npm ci

# ===== 构建阶段 =====
FROM base AS builder

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules

# 复制源代码
COPY . .

# 设置构建时环境变量
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# 创建临时环境变量文件以通过环境检查
# RUN echo "# Docker build environment" > .env.local && \
#     echo "NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co" >> .env.local && \
#     echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-key" >> .env.local && \
#     echo "SUPABASE_SERVICE_ROLE_KEY=placeholder-key" >> .env.local && \
#     echo "COZE_BASE_URL=https://api.coze.cn" >> .env.local && \
#     echo "COZE_API_TOKEN=placeholder-token" >> .env.local && \
#     echo "BOT_ID=placeholder-bot-id" >> .env.local

# 构建应用（跳过ESLint检查以避免构建失败）
RUN SKIP_ENV_VALIDATION=true npm run build

# ===== 生产运行阶段 =====
FROM base AS runner

# 设置生产环境
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 创建非root用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder /app/public ./public

# 复制必要的依赖文件
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# 设置正确的权限
RUN mkdir .next
RUN chown nextjs:nodejs .next
RUN chown nextjs:nodejs node_modules

# 复制构建后的应用文件
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 切换到非root用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 启动应用
CMD ["node", "server.js"]
