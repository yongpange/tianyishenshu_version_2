# 天乙神算 Docker Makefile
# 简化 Docker 操作的便捷命令

.PHONY: help build dev prod stop clean logs health

# 默认目标
.DEFAULT_GOAL := help

# 项目配置
PROJECT_NAME := tianyishensuan
IMAGE_NAME := $(PROJECT_NAME):latest
COMPOSE_FILE := docker-compose.yml
COMPOSE_DEV_FILE := docker-compose.dev.yml

# 帮助信息
help: ## 显示帮助信息
	@echo "天乙神算 Docker 管理命令"
	@echo ""
	@echo "可用命令:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# 构建镜像
build: ## 构建生产镜像
	@echo "🔨 构建 Docker 镜像..."
	docker build -t $(IMAGE_NAME) .
	@echo "✅ 镜像构建完成"

# 开发环境
dev: ## 启动开发环境
	@echo "🚀 启动开发环境..."
	docker-compose -f $(COMPOSE_DEV_FILE) up -d
	@echo "✅ 开发环境启动完成"
	@echo "📱 访问地址: http://localhost:3001"

# 生产环境
prod: build ## 构建并启动生产环境
	@echo "🚀 启动生产环境..."
	docker-compose -f $(COMPOSE_FILE) up -d
	@echo "✅ 生产环境启动完成"
	@echo "📱 访问地址: http://localhost:3000"

# 停止服务
stop: ## 停止所有服务
	@echo "🛑 停止服务..."
	docker-compose -f $(COMPOSE_FILE) down
	docker-compose -f $(COMPOSE_DEV_FILE) down
	@echo "✅ 服务已停止"

# 重启服务
restart: stop prod ## 重启生产服务

# 查看日志
logs: ## 查看服务日志
	docker-compose -f $(COMPOSE_FILE) logs -f

# 查看开发日志
logs-dev: ## 查看开发环境日志
	docker-compose -f $(COMPOSE_DEV_FILE) logs -f

# 健康检查
health: ## 检查服务健康状态
	@echo "🔍 检查服务健康状态..."
	@curl -f http://localhost:3000/api/health || echo "❌ 服务不可用"
	@docker-compose ps

# 清理资源
clean: ## 清理 Docker 资源
	@echo "🧹 清理 Docker 资源..."
	docker-compose -f $(COMPOSE_FILE) down -v
	docker-compose -f $(COMPOSE_DEV_FILE) down -v
	docker system prune -f
	@echo "✅ 清理完成"

# 查看状态
status: ## 查看容器状态
	@echo "📊 容器状态:"
	docker-compose ps
	@echo ""
	@echo "📊 镜像信息:"
	docker images | grep $(PROJECT_NAME)

# 进入容器
shell: ## 进入应用容器
	docker-compose exec $(PROJECT_NAME)-app sh

# 数据库迁移（如果需要）
migrate: ## 运行数据库迁移
	docker-compose exec $(PROJECT_NAME)-app npm run migrate

# 备份数据
backup: ## 备份重要数据
	@echo "💾 备份数据..."
	mkdir -p backups
	docker-compose exec redis redis-cli BGSAVE
	tar -czf backups/logs-$(shell date +%Y%m%d-%H%M%S).tar.gz logs/
	@echo "✅ 备份完成"

# 更新应用
update: ## 更新应用（拉取代码并重新部署）
	@echo "🔄 更新应用..."
	git pull
	$(MAKE) restart
	@echo "✅ 更新完成"

# 安装依赖
install: ## 安装项目依赖
	npm ci

# 运行测试
test: ## 运行测试
	npm test

# 代码检查
lint: ## 运行代码检查
	npm run lint

# 格式化代码
format: ## 格式化代码
	npm run format

# 完整部署流程
deploy: install lint test build prod health ## 完整部署流程
	@echo "🎉 部署完成！"
