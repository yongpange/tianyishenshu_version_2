# Docker 构建与部署指南

## 🚀 快速开始

### 前置条件
- Docker 20.10+
- Docker Compose 2.0+
- 已配置环境变量文件

## 🏗️ 构建流程

### 1. 环境配置
```bash
# 复制环境变量模板
cp .env.production.example .env.production

# 编辑配置文件
nano .env.production
```

### 2. 镜像构建
```bash
# 方式1: 使用npm脚本构建（推荐）
npm run docker:build

# 方式2: 直接使用Docker命令
docker build -t tianyishenshu:v1.0 .

# 方式3: 使用部署脚本
./scripts/docker-deploy.sh build
```

### 3. 服务启动
```bash
# 启动所有服务
docker-compose up -d

# 或使用部署脚本
./scripts/docker-deploy.sh deploy
```

## 📦 镜像打包与传输

### 完整部署流程（适用于远程服务器）

**第一步：本地构建镜像**
```bash
# 构建Docker镜像
npm run docker:build
```

**第二步：镜像打包**
```bash
# 将镜像保存为tar文件
docker save -o tianyishenshu-v1.0.tar tianyishenshu:v1.0
```

**第三步：上传到服务器**
```bash
# 方式1: 使用scp上传到阿里云ECS
scp tianyishenshu-v1.0.tar root@your-server-ip:/root/deploy/

# 方式2: 使用rsync（支持断点续传）
rsync -avz --progress tianyishenshu-v1.0.tar root@your-server-ip:/root/deploy/

# 方式3: 先压缩再上传（节省传输时间）
gzip tianyishenshu-v1.0.tar
scp tianyishenshu-v1.0.tar.gz root@your-server-ip:/root/deploy/
gunzip /root/deploy/tianyishenshu-v1.0.tar.gz  # 在服务器上解压
```

**第四步：服务器加载镜像**
```bash
# 在目标服务器上加载镜像
docker load -i tianyishenshu-v1.0.tar
```

**第五步：启动容器**
```bash
# 启动容器（带DNS配置）
docker run -d \
  --name tianyishenshu \
  -p 3000:3000 \
  --dns 8.8.8.8 \
  --dns 1.1.1.1 \
  --env-file .env.local \
  tianyishenshu:v1.0
```

## 📦 部署选项

### 生产环境部署
```bash
# 方式1: 使用部署脚本
./scripts/docker-deploy.sh full

# 方式2: 手动部署
docker build -t tianyishenshu:latest .
docker-compose up -d
```

### 开发环境部署
```bash
# 开发环境（支持热重载）
./scripts/docker-deploy.sh dev

# 或直接使用 docker-compose
docker-compose -f docker-compose.dev.yml up -d
```

### 服务访问地址
- **应用主页**: http://localhost:3000
- **开发环境**: http://localhost:3001
- **健康检查**: http://localhost:3000/api/health

## 🔧 常用命令

### 构建相关
```bash
# 使用npm脚本构建（推荐）
npm run docker:build

# 直接构建镜像
docker build -t tianyishenshu:v1.0 .

# 构建时使用代理（如需要）
docker build --build-arg HTTP_PROXY=http://proxy:port -t tianyishenshu:v1.0 .

# 查看镜像
docker images | grep tianyishenshu

# 给镜像打标签
docker tag tianyishenshu:v1.0 tianyishenshu:latest
```

### 镜像管理
```bash
# 保存镜像为文件
docker save -o tianyishenshu-v1.0.tar tianyishenshu:v1.0

# 从文件加载镜像
docker load -i tianyishenshu-v1.0.tar

# 删除镜像
docker rmi tianyishenshu:v1.0

# 查看镜像详细信息
docker inspect tianyishenshu:v1.0

# 查看镜像构建历史
docker history tianyishenshu:v1.0
```

### 容器管理
```bash
# 使用docker-compose启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f
docker-compose logs -f tianyishenshu-app
```

### 单容器管理
```bash
# 启动单个容器（生产环境推荐）
docker run -d \
  --name tianyishenshu \
  -p 3000:3000 \
  --dns 8.8.8.8 \
  --dns 1.1.1.1 \
  --env-file .env.local \
  tianyishenshu:v1.0

# 查看容器状态
docker ps
docker ps -a  # 包含已停止的容器

# 停止容器
docker stop tianyishenshu

# 启动已存在的容器
docker start tianyishenshu

# 重启容器
docker restart tianyishenshu

# 删除容器
docker rm tianyishenshu

# 进入容器
docker exec -it tianyishenshu sh

# 查看容器日志
docker logs -f tianyishenshu
docker logs --tail=100 tianyishenshu
```

### 环境切换
```bash
# 生产环境
docker-compose up -d

# 开发环境
docker-compose -f docker-compose.dev.yml up -d

# 停止所有环境
docker-compose down
docker-compose -f docker-compose.dev.yml down
```

## 🔍 监控与调试

### 容器状态检查
```bash
# 查看所有容器状态
docker-compose ps

# 查看特定容器状态
docker inspect tianyishenshu-app

# 进入容器
docker exec -it tianyishenshu-app sh
```

### 日志查看
```bash
# 实时查看所有日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f tianyishenshu-app
docker-compose logs -f redis
docker-compose logs -f nginx

# 查看最近100行日志
docker-compose logs --tail=100 tianyishenshu-app
```

### 健康检查
```bash
# 检查应用健康状态
curl http://localhost:3000/api/health

# 检查容器资源使用
docker stats tianyishenshu-app
```

## 🧹 清理操作

### 停止和清理
```bash
# 停止并删除容器
docker-compose down

# 停止并删除容器和数据卷
docker-compose down -v

# 清理无用的镜像和容器
docker system prune -f

# 使用脚本清理
./scripts/docker-deploy.sh clean
```

### 重新部署
```bash
# 完全重新部署
docker-compose down
docker rmi tianyishenshu:latest
./scripts/docker-deploy.sh full
```

## ⚠️ 故障排除

### 常见问题

**1. 端口冲突**
```bash
# 检查端口占用
netstat -tlnp | grep :3000
# 或
lsof -i :3000

# 修改端口（在docker-compose.yml中）
ports:
  - "3001:3000"  # 改为其他端口
```

**2. 环境变量未生效**
```bash
# 检查环境变量文件
cat .env.production

# 重新构建镜像
docker-compose down
docker build --no-cache -t tianyishenshu:latest .
docker-compose up -d
```

**3. 镜像构建失败**
```bash
# 查看详细构建日志
docker build --progress=plain -t tianyishenshu:latest .

# 清理构建缓存
docker builder prune -f
```

**4. 容器启动失败**
```bash
# 查看容器退出状态
docker ps -a

# 查看详细错误日志
docker logs tianyishenshu

# 检查容器配置
docker inspect tianyishenshu

# 检查环境变量是否加载
docker exec tianyishenshu env | grep -E "(COZE|SUPABASE|TENCENT)"
```

**5. DNS解析问题**
```bash
# 测试容器内DNS解析
docker exec tianyishenshu nslookup google.com

# 如果DNS有问题，重新启动容器时指定DNS
docker run -d \
  --name tianyishenshu \
  -p 3000:3000 \
  --dns 8.8.8.8 \
  --dns 1.1.1.1 \
  --env-file .env.local \
  tianyishenshu:v1.0
```

**6. 环境变量配置问题**
```bash
# 检查环境变量文件
cat .env.local

# 确认环境变量格式正确（无空格、引号等）
# 正确格式: KEY=value
# 错误格式: KEY = value 或 KEY="value"

# 手动传入环境变量（测试用）
docker run -d \
  --name tianyishenshu \
  -p 3000:3000 \
  -e COZE_API_TOKEN=your_token \
  -e SUPABASE_URL=your_url \
  tianyishenshu:v1.0
```

### 性能优化

**构建优化**
```bash
# 使用多阶段构建缓存
docker build --target builder -t tianyishenshu:builder .
docker build -t tianyishenshu:latest .

# 使用.dockerignore忽略不必要文件
echo "node_modules" >> .dockerignore
echo ".next" >> .dockerignore
echo "*.log" >> .dockerignore
```

**运行优化**
```bash
# 限制容器资源使用
docker run -m 512m --cpus="1.0" tianyishenshu:latest

# 或在docker-compose.yml中配置
deploy:
  resources:
    limits:
      memory: 512M
      cpus: "1.0"
```

## 📝 部署检查清单

### 本地构建环境
- [ ] Docker和Docker Compose已安装
- [ ] Node.js环境正常（npm命令可用）
- [ ] 环境变量文件已配置（.env.local）
- [ ] 网络连接正常（构建时需要下载依赖）
- [ ] 足够的磁盘空间（>5GB，包含镜像和tar文件）

### 远程服务器环境
- [ ] Docker已安装（无需Docker Compose）
- [ ] 端口3000未被占用
- [ ] DNS解析正常（可访问8.8.8.8和1.1.1.1）
- [ ] 环境变量文件已上传（.env.local）
- [ ] 足够的内存（>2GB）
- [ ] 防火墙已开放3000端口

### 镜像传输
- [ ] 镜像文件完整性（检查文件大小）
- [ ] SSH连接正常（如使用scp）
- [ ] 上传路径有写权限
- [ ] 目标服务器有足够存储空间

## 🔗 相关文件

- `Dockerfile` - 生产环境镜像配置
- `Dockerfile.dev` - 开发环境镜像配置
- `docker-compose.yml` - 生产环境服务编排
- `docker-compose.dev.yml` - 开发环境服务编排
- `scripts/docker-deploy.sh` - Linux/macOS部署脚本
- `scripts/docker-deploy.bat` - Windows部署脚本
- `nginx/nginx.conf` - Nginx反向代理配置 