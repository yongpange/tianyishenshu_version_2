@echo off
chcp 65001 >nul

echo ========================================
echo 天乙神算 Docker 简易部署脚本
echo ========================================

REM 检查Docker是否安装
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker not installed. Please install Docker Desktop first.
    echo Download from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose not found. Please install Docker Desktop.
    pause
    exit /b 1
)

echo [SUCCESS] Docker environment check passed

REM 检查环境变量文件
if not exist ".env.production" (
    echo [WARNING] .env.production file not found
    if exist ".env.production.example" (
        echo [INFO] Copying .env.production.example to .env.production
        copy ".env.production.example" ".env.production" >nul
        echo [WARNING] Please edit .env.production file with your actual values
        echo Press any key after editing .env.production...
        pause
    ) else (
        echo [ERROR] .env.production.example not found
        pause
        exit /b 1
    )
)

echo [SUCCESS] Environment file check passed

REM 构建镜像
echo [INFO] Building Docker image...
docker build -t tianyishensuan:latest .
if errorlevel 1 (
    echo [ERROR] Docker image build failed
    pause
    exit /b 1
)
echo [SUCCESS] Docker image build completed

REM 停止现有容器
echo [INFO] Stopping existing containers...
docker-compose down >nul 2>&1

REM 启动新容器
echo [INFO] Starting application...
docker-compose up -d
if errorlevel 1 (
    echo [ERROR] Application deployment failed
    echo Checking logs...
    docker-compose logs
    pause
    exit /b 1
)

echo [SUCCESS] Application deployed successfully

REM 等待应用启动
echo [INFO] Waiting for application to start...
timeout /t 15 /nobreak >nul

REM 检查容器状态
docker-compose ps | findstr "Up" >nul
if errorlevel 1 (
    echo [ERROR] Application containers failed to start
    echo Checking logs...
    docker-compose logs
    pause
    exit /b 1
) else (
    echo [SUCCESS] Application containers are running
)

echo ========================================
echo Deployment completed successfully!
echo ========================================
echo Application URL: http://localhost:3000
echo Health Check: http://localhost:3000/api/health
echo ========================================
echo Press any key to exit...
pause
