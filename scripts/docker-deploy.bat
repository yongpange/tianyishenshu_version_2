@echo off
chcp 65001 >nul
REM 天乙神算 Docker 部署脚本 (Windows)
REM 用于快速构建和部署应用

setlocal enabledelayedexpansion

REM 日志函数
:log_info
echo [INFO] %~1
goto :eof

:log_success
echo [SUCCESS] %~1
goto :eof

:log_warning
echo [WARNING] %~1
goto :eof

:log_error
echo [ERROR] %~1
goto :eof

REM 检查Docker是否安装
:check_docker
docker --version >nul 2>&1
if errorlevel 1 (
    call :log_error "Docker 未安装，请先安装 Docker Desktop"
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    call :log_error "Docker Compose 未安装，请先安装 Docker Compose"
    exit /b 1
)

call :log_success "Docker 环境检查通过"
goto :eof

REM 检查环境变量文件
:check_env_files
if not exist ".env.production" (
    call :log_warning ".env.production file not found"
    if exist ".env.production.example" (
        call :log_info "Copying .env.production.example to .env.production"
        copy ".env.production.example" ".env.production" >nul
        call :log_warning "Please edit .env.production file with correct values"
        exit /b 1
    )
)
call :log_success "Environment file check passed"
goto :eof

REM 构建镜像
:build_image
call :log_info "开始构建 Docker 镜像..."
docker build -t tianyishensuan:latest .
if errorlevel 1 (
    call :log_error "Docker 镜像构建失败"
    exit /b 1
)
call :log_success "Docker 镜像构建完成"
goto :eof

REM 部署应用
:deploy_app
call :log_info "开始部署应用..."

REM 停止现有容器
docker-compose down

REM 启动新容器
docker-compose up -d
if errorlevel 1 (
    call :log_error "应用部署失败"
    exit /b 1
)

call :log_success "应用部署完成"
goto :eof

REM 检查应用健康状态
:check_health
call :log_info "检查应用健康状态..."

REM 等待应用启动
timeout /t 10 /nobreak >nul

REM 检查容器状态
docker-compose ps | findstr "Up" >nul
if errorlevel 1 (
    call :log_error "应用容器启动失败"
    docker-compose logs
    exit /b 1
) else (
    call :log_success "应用容器运行正常"
)

REM 检查应用响应
curl -f http://localhost:3000 >nul 2>&1
if errorlevel 1 (
    call :log_warning "应用可能还在启动中，请稍后检查"
) else (
    call :log_success "应用响应正常"
)
goto :eof

REM 显示帮助信息
:show_help
echo 天乙神算 Docker 部署脚本 (Windows)
echo.
echo 用法: %~nx0 [选项]
echo.
echo 选项:
echo   build     仅构建镜像
echo   deploy    仅部署应用
echo   full      完整部署（构建+部署）
echo   dev       开发环境部署
echo   stop      停止应用
echo   logs      查看日志
echo   clean     清理镜像和容器
echo   help      显示帮助信息
echo.
goto :eof

REM 主函数
:main
set "action=%~1"
if "%action%"=="" set "action=full"

if "%action%"=="build" (
    call :check_docker
    call :build_image
) else if "%action%"=="deploy" (
    call :check_docker
    call :check_env_files
    call :deploy_app
    call :check_health
) else if "%action%"=="full" (
    call :check_docker
    call :check_env_files
    call :build_image
    call :deploy_app
    call :check_health
) else if "%action%"=="dev" (
    call :check_docker
    call :log_info "启动开发环境..."
    docker-compose -f docker-compose.dev.yml up -d
    call :log_success "开发环境启动完成"
) else if "%action%"=="stop" (
    call :log_info "停止应用..."
    docker-compose down
    call :log_success "应用已停止"
) else if "%action%"=="logs" (
    docker-compose logs -f
) else if "%action%"=="clean" (
    call :log_info "清理 Docker 镜像和容器..."
    docker-compose down -v
    docker system prune -f
    call :log_success "清理完成"
) else if "%action%"=="help" (
    call :show_help
) else (
    call :log_error "未知选项: %action%"
    call :show_help
    exit /b 1
)

goto :eof

REM 执行主函数
call :main %*
