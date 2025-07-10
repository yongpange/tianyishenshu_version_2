# MCP 服务器推荐指南

## 🎯 针对天乙神算项目的 MCP 组合

### 已配置的 MCP 服务器

#### 1. **Context7 MCP** ⭐⭐⭐⭐⭐
**作用**：项目智能理解和上下文管理
- 自动分析项目结构和依赖关系
- 为 AI 提供完整的代码上下文
- 理解业务逻辑和技术架构

#### 2. **Filesystem MCP** ⭐⭐⭐⭐
**作用**：安全的文件系统操作
- 读取和写入项目文件
- 创建目录结构
- 搜索文件内容
- 适合代码生成和文件管理

#### 3. **GitHub MCP** ⭐⭐⭐⭐
**作用**：Git 仓库管理和协作
- 查看 Issues 和 Pull Requests
- 分析提交历史和代码变更
- 管理分支和标签
- 自动化 Git 操作

#### 4. **PostgreSQL MCP** ⭐⭐⭐⭐⭐
**作用**：数据库管理（特别适合你的 Supabase）
- 查询数据库结构和表关系
- 执行 SQL 查询和分析
- 优化数据库性能
- 管理迁移和备份

#### 5. **Docker MCP** ⭐⭐⭐
**作用**：容器化部署管理
- 管理 Docker 容器状态
- 查看容器日志
- 构建和部署镜像
- 适合你的 Docker 部署流程

## 🛠️ 其他推荐的 MCP 服务器

### 开发工具类

#### **Web Search MCP**
```bash
npm install -g @modelcontextprotocol/server-brave-search
```
**适用场景**：
- 查找最新的 Next.js 或 Supabase 文档
- 搜索错误解决方案
- 获取最新的库和工具信息

#### **Time MCP**
```bash
npm install -g @modelcontextprotocol/server-time
```
**适用场景**：
- 处理命理分析中的时间计算
- 时区转换（用户可能来自不同地区）
- 定时任务和调度

#### **Memory MCP**
```bash
npm install -g @modelcontextprotocol/server-memory
```
**适用场景**：
- 记住用户偏好和历史对话
- 缓存常用的分析结果
- 个性化用户体验

### 数据处理类

#### **SQLite MCP**
```bash
npm install -g @modelcontextprotocol/server-sqlite
```
**适用场景**：
- 本地数据缓存
- 开发环境数据库
- 离线数据处理

#### **Puppeteer MCP**
```bash
npm install -g @modelcontextprotocol/server-puppeteer
```
**适用场景**：
- 网页截图和 PDF 生成
- 自动化测试
- 数据抓取

### 通信协作类

#### **Slack MCP**
```bash
npm install -g @modelcontextprotocol/server-slack
```
**适用场景**：
- 团队开发通知
- 错误报告和监控
- 用户反馈收集

#### **Email MCP**
```bash
npm install -g @modelcontextprotocol/server-email
```
**适用场景**：
- 用户通知和报告发送
- 系统状态邮件
- 客户服务自动化

## 🚀 安装和配置指南

### 快速安装推荐组合
```bash
# 核心开发工具
npm install -g @context7/mcp-server
npm install -g @modelcontextprotocol/server-filesystem
npm install -g @modelcontextprotocol/server-github
npm install -g @modelcontextprotocol/server-postgres
npm install -g @modelcontextprotocol/server-docker

# 可选工具
npm install -g @modelcontextprotocol/server-brave-search
npm install -g @modelcontextprotocol/server-time
npm install -g @modelcontextprotocol/server-memory
```

### 配置环境变量
在 `.env.local` 中添加：
```env
# GitHub MCP
GITHUB_PERSONAL_ACCESS_TOKEN=your_github_token

# Supabase/PostgreSQL MCP
POSTGRES_CONNECTION_STRING=your_supabase_connection_string

# Context7 MCP (如果需要)
CONTEXT7_API_KEY=your_context7_api_key

# Web Search MCP (如果使用)
BRAVE_API_KEY=your_brave_search_api_key
```

## 📊 使用优先级建议

### 立即使用（高优先级）
1. **Context7 MCP** - 项目理解核心
2. **Filesystem MCP** - 文件操作基础
3. **PostgreSQL MCP** - 数据库管理

### 开发阶段使用（中优先级）
4. **GitHub MCP** - 版本控制
5. **Docker MCP** - 部署管理
6. **Web Search MCP** - 问题解决

### 生产阶段使用（低优先级）
7. **Time MCP** - 时间处理
8. **Memory MCP** - 用户体验
9. **Slack/Email MCP** - 通知系统

## 🔧 自定义 MCP 开发

如果现有 MCP 不满足需求，可以开发自定义 MCP：

### 命理分析 MCP
```javascript
// 专门处理八字排盘和命理计算
const astrologyMCP = {
  name: "astrology",
  tools: [
    "calculateBaZi",
    "analyzeFortune", 
    "generateReport"
  ]
}
```

### 腾讯云 SMS MCP
```javascript
// 集成腾讯云短信服务
const tencentSMSMCP = {
  name: "tencent-sms",
  tools: [
    "sendVerificationCode",
    "checkSMSStatus",
    "manageSMSTemplates"
  ]
}
```

## 💡 最佳实践

1. **渐进式采用**：先使用核心 MCP，再逐步添加其他服务
2. **性能监控**：注意 MCP 对系统性能的影响
3. **安全配置**：妥善管理 API 密钥和访问权限
4. **定期更新**：保持 MCP 服务器版本最新

---

**开始使用这些 MCP 服务器，让你的开发工作更加智能和高效！** 🎉
