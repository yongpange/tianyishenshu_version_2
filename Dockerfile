# 天乙神数 Next.js 应用 Dockerfile
# 多阶段构建，优化镜像大小和构建效率

# ===== 基础镜像 =====
# 使用阿里云镜像加速
FROM registry.cn-hangzhou.aliyuncs.com/library/node:18-alpine AS base

# 安装必要的系统依赖
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 复制包管理文件
COPY package*.json ./

# ===== 依赖安装阶段 =====
FROM base AS deps

# 安装生产和开发依赖
RUN npm ci

# ===== 构建阶段 =====
FROM base AS builder

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules

# 复制源代码
COPY . .

# 设置构建时环境变量
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# 构建应用
RUN npm run build

# ===== 生产运行阶段 =====
FROM base AS runner

# 设置生产环境
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# 创建非root用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder /app/public ./public

# 设置正确的权限
RUN mkdir .next
RUN chown nextjs:nodejs .next

# 复制构建后的应用文件
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 切换到非root用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# 启动应用
CMD ["node", "server.js"]
