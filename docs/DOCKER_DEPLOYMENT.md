# 天乙神数 Docker 部署指南

本文档详细介绍如何使用 Docker 部署天乙神数应用。

## 📋 前置要求

### 系统要求
- **操作系统**: Linux/macOS/Windows
- **内存**: 最少 2GB，推荐 4GB+
- **存储**: 最少 10GB 可用空间
- **网络**: 稳定的互联网连接

### 软件要求
- **Docker**: 版本 20.10+
- **Docker Compose**: 版本 2.0+

### 安装 Docker

#### Linux (Ubuntu/Debian)
```bash
# 更新包索引
sudo apt-get update

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### macOS
```bash
# 使用 Homebrew
brew install docker docker-compose

# 或下载 Docker Desktop
# https://www.docker.com/products/docker-desktop
```

#### Windows
下载并安装 [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone <your-repo-url>
cd tianyishenshu_2
```

### 2. 配置环境变量
```bash
# 复制环境变量模板
cp .env.production.example .env.production

# 编辑环境变量文件
nano .env.production
```

### 3. 一键部署
```bash
# Linux/macOS
chmod +x scripts/docker-deploy.sh
./scripts/docker-deploy.sh full

# Windows
scripts\docker-deploy.bat full
```

## 📁 项目结构

```
tianyishenshu_2/
├── Dockerfile                 # 生产环境镜像
├── Dockerfile.dev            # 开发环境镜像
├── docker-compose.yml        # 生产环境编排
├── docker-compose.dev.yml    # 开发环境编排
├── .dockerignore             # Docker忽略文件
├── .env.production.example   # 生产环境变量模板
├── .env.docker.example       # Docker配置模板
├── nginx/
│   └── nginx.conf           # Nginx配置文件
└── scripts/
    ├── docker-deploy.sh     # Linux/macOS部署脚本
    └── docker-deploy.bat    # Windows部署脚本
```

## 🔧 部署选项

### 生产环境部署
```bash
# 完整部署（构建+启动）
./scripts/docker-deploy.sh full

# 仅构建镜像
./scripts/docker-deploy.sh build

# 仅部署应用
./scripts/docker-deploy.sh deploy
```

### 开发环境部署
```bash
# 启动开发环境（支持热重载）
./scripts/docker-deploy.sh dev

# 使用 docker-compose 直接启动
docker-compose -f docker-compose.dev.yml up -d
```

### 手动部署
```bash
# 1. 构建镜像
docker build -t tianyishenshu:latest .

# 2. 启动服务
docker-compose up -d

# 3. 查看状态
docker-compose ps

# 4. 查看日志
docker-compose logs -f
```

## 🔍 服务管理

### 查看服务状态
```bash
docker-compose ps
```

### 查看日志
```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f tianyishenshu-app
```

### 停止服务
```bash
./scripts/docker-deploy.sh stop
# 或
docker-compose down
```

### 重启服务
```bash
docker-compose restart
```

### 更新应用
```bash
# 拉取最新代码
git pull

# 重新构建和部署
./scripts/docker-deploy.sh full
```

## 🌐 访问应用

部署成功后，可以通过以下地址访问：

- **应用主页**: http://localhost:3000
- **API接口**: http://localhost:3000/api
- **健康检查**: http://localhost:3000/api/health

如果使用了 Nginx 反向代理：
- **HTTP**: http://localhost
- **HTTPS**: https://localhost (需要配置SSL证书)

## 🔒 环境变量配置

### 必需配置
```env
# 腾讯云短信服务
TENCENT_SECRET_ID=your_secret_id
TENCENT_SECRET_KEY=your_secret_key
TENCENT_SMS_APP_ID=your_app_id

# Coze AI API
COZE_API_TOKEN=your_api_token
BOT_ID=your_bot_id

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 可选配置
```env
# Redis缓存
REDIS_URL=redis://redis:6379

# 安全配置
NEXTAUTH_SECRET=your_secret_key

# 性能配置
MAX_REQUEST_SIZE=10mb
REQUEST_TIMEOUT=30000
```

## 🐛 故障排除

### 常见问题

#### 1. 容器启动失败
```bash
# 查看详细日志
docker-compose logs tianyishenshu-app

# 检查环境变量
docker-compose config
```

#### 2. 端口冲突
```bash
# 修改 docker-compose.yml 中的端口映射
ports:
  - "3001:3000"  # 改为其他端口
```

#### 3. 内存不足
```bash
# 检查系统资源
docker system df
docker stats

# 清理无用镜像
docker system prune -f
```

#### 4. 网络连接问题
```bash
# 检查网络
docker network ls
docker network inspect tianyishenshu_tianyishenshu-network
```

### 日志分析
```bash
# 应用日志
docker-compose logs -f tianyishenshu-app

# Nginx日志
docker-compose logs -f nginx

# Redis日志
docker-compose logs -f redis
```

## 📊 监控和维护

### 健康检查
```bash
# 检查容器健康状态
docker-compose ps

# 手动健康检查
curl http://localhost:3000/api/health
```

### 性能监控
```bash
# 查看资源使用情况
docker stats

# 查看容器详情
docker inspect tianyishenshu-app
```

### 数据备份
```bash
# 备份 Redis 数据
docker-compose exec redis redis-cli BGSAVE

# 备份日志文件
tar -czf logs-backup-$(date +%Y%m%d).tar.gz logs/
```

## 🔄 CI/CD 集成

### GitHub Actions 示例
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to server
        run: |
          ssh user@server 'cd /path/to/app && git pull && ./scripts/docker-deploy.sh full'
```

## 📞 技术支持

如果遇到问题，请：

1. 查看本文档的故障排除部分
2. 检查 GitHub Issues
3. 联系技术支持团队

---

**注意**: 在生产环境中，请确保：
- 使用 HTTPS
- 配置防火墙
- 定期更新镜像
- 监控系统资源
- 备份重要数据
