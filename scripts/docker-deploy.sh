#!/bin/bash

# 天乙神算 Docker 部署脚本
# 用于快速构建和部署应用

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Docker是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    log_success "Docker 环境检查通过"
}

# 检查环境变量文件
check_env_files() {
    if [ ! -f ".env.production" ]; then
        log_warning ".env.production 文件不存在"
        if [ -f ".env.production.example" ]; then
            log_info "复制 .env.production.example 到 .env.production"
            cp .env.production.example .env.production
            log_warning "请编辑 .env.production 文件并填入正确的配置值"
            exit 1
        fi
    fi
    log_success "环境变量文件检查通过"
}

# 构建镜像
build_image() {
    log_info "开始构建 Docker 镜像..."
    docker build -t tianyishensuan:latest .
    log_success "Docker 镜像构建完成"
}

# 部署应用
deploy_app() {
    log_info "开始部署应用..."
    
    # 停止现有容器
    docker-compose down
    
    # 启动新容器
    docker-compose up -d
    
    log_success "应用部署完成"
}

# 检查应用健康状态
check_health() {
    log_info "检查应用健康状态..."
    
    # 等待应用启动
    sleep 10
    
    # 检查容器状态
    if docker-compose ps | grep -q "Up"; then
        log_success "应用容器运行正常"
    else
        log_error "应用容器启动失败"
        docker-compose logs
        exit 1
    fi
    
    # 检查应用响应
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        log_success "应用响应正常"
    else
        log_warning "应用可能还在启动中，请稍后检查"
    fi
}

# 显示帮助信息
show_help() {
    echo "天乙神算 Docker 部署脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  build     仅构建镜像"
    echo "  deploy    仅部署应用"
    echo "  full      完整部署（构建+部署）"
    echo "  dev       开发环境部署"
    echo "  stop      停止应用"
    echo "  logs      查看日志"
    echo "  clean     清理镜像和容器"
    echo "  help      显示帮助信息"
    echo ""
}

# 主函数
main() {
    case "${1:-full}" in
        "build")
            check_docker
            build_image
            ;;
        "deploy")
            check_docker
            check_env_files
            deploy_app
            check_health
            ;;
        "full")
            check_docker
            check_env_files
            build_image
            deploy_app
            check_health
            ;;
        "dev")
            check_docker
            log_info "启动开发环境..."
            docker-compose -f docker-compose.dev.yml up -d
            log_success "开发环境启动完成"
            ;;
        "stop")
            log_info "停止应用..."
            docker-compose down
            log_success "应用已停止"
            ;;
        "logs")
            docker-compose logs -f
            ;;
        "clean")
            log_info "清理 Docker 镜像和容器..."
            docker-compose down -v
            docker system prune -f
            log_success "清理完成"
            ;;
        "help")
            show_help
            ;;
        *)
            log_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
