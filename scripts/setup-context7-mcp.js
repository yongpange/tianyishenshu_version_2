#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🚀 设置 Context7 MCP 集成...\n')

// 检查是否已安装 Context7 MCP
function checkContext7Installation() {
  try {
    execSync('npx @context7/mcp-server --version', { stdio: 'pipe' })
    console.log('✅ Context7 MCP 已安装')
    return true
  } catch (error) {
    console.log('❌ Context7 MCP 未安装')
    return false
  }
}

// 安装 Context7 MCP
function installContext7() {
  console.log('📦 安装 Context7 MCP...')
  try {
    execSync('npm install -g @context7/mcp-server', { stdio: 'inherit' })
    console.log('✅ Context7 MCP 安装成功')
    return true
  } catch (error) {
    console.error('❌ Context7 MCP 安装失败:', error.message)
    return false
  }
}

// 创建项目特定的 Context7 配置
function createProjectConfig() {
  console.log('⚙️ 创建项目配置...')
  
  const projectConfig = {
    name: "天乙神算项目",
    description: "基于 Next.js 的命理分析网站，集成 Supabase 数据库和 Coze AI",
    framework: "Next.js",
    language: "TypeScript",
    database: "Supabase",
    ai_integration: "Coze API",
    key_directories: {
      "src/app": "Next.js App Router 页面和 API 路由",
      "src/components": "React 组件",
      "src/lib": "工具库和配置",
      "src/utils": "工具函数",
      "scripts": "构建和部署脚本",
      "supabase": "数据库迁移文件"
    },
    important_files: {
      "package.json": "项目依赖和脚本",
      "next.config.js": "Next.js 配置",
      "tsconfig.json": "TypeScript 配置",
      "tailwind.config.js": "样式配置",
      "src/lib/supabase.ts": "数据库连接配置",
      "src/lib/coze-auth.ts": "AI 服务认证"
    },
    coding_patterns: {
      "api_routes": "使用 Next.js App Router API 路由",
      "state_management": "使用 React hooks 和 localStorage/Supabase",
      "styling": "Tailwind CSS + Ant Design",
      "data_fetching": "fetch API + React Query",
      "authentication": "手机号 + 短信验证码"
    }
  }
  
  const configPath = path.join(process.cwd(), '.context7', 'project.json')
  const configDir = path.dirname(configPath)
  
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true })
  }
  
  fs.writeFileSync(configPath, JSON.stringify(projectConfig, null, 2))
  console.log('✅ 项目配置已创建:', configPath)
}

// 创建 Context7 忽略文件
function createIgnoreFile() {
  console.log('📝 创建忽略文件...')
  
  const ignoreContent = `# Context7 忽略文件
# 排除不需要分析的文件和目录

# 依赖和构建产物
node_modules/
.next/
dist/
build/
out/

# 环境变量和敏感信息
.env*
*.key
*.pem

# 日志文件
*.log
logs/

# 临时文件
.tmp/
temp/
*.tmp

# IDE 配置
.vscode/
.idea/
*.swp
*.swo

# 系统文件
.DS_Store
Thumbs.db

# 大文件
*.zip
*.tar.gz
*.rar

# 测试覆盖率
coverage/

# 数据库文件
*.db
*.sqlite

# 备份文件
backups/
*.backup
`
  
  const ignorePath = path.join(process.cwd(), '.context7ignore')
  fs.writeFileSync(ignorePath, ignoreContent)
  console.log('✅ 忽略文件已创建:', ignorePath)
}

// 创建 VS Code 配置（如果使用 VS Code）
function createVSCodeConfig() {
  console.log('🔧 创建 VS Code 配置...')
  
  const vscodeDir = path.join(process.cwd(), '.vscode')
  if (!fs.existsSync(vscodeDir)) {
    fs.mkdirSync(vscodeDir)
  }
  
  const settingsPath = path.join(vscodeDir, 'settings.json')
  let settings = {}
  
  if (fs.existsSync(settingsPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
    } catch (error) {
      console.warn('⚠️ 无法解析现有的 VS Code 设置，将创建新的')
    }
  }
  
  // 添加 Context7 相关设置
  settings['context7.enabled'] = true
  settings['context7.autoIndex'] = true
  settings['context7.maxFileSize'] = '100kb'
  settings['context7.includePatterns'] = [
    'src/**/*.{ts,tsx,js,jsx}',
    'pages/**/*.{ts,tsx,js,jsx}',
    'components/**/*.{ts,tsx,js,jsx}',
    '*.{json,md}'
  ]
  
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2))
  console.log('✅ VS Code 配置已更新')
}

// 创建使用指南
function createUsageGuide() {
  console.log('📚 创建使用指南...')
  
  const guideContent = `# Context7 MCP 使用指南

## 概述

Context7 MCP 已为天乙神算项目配置完成，可以帮助你更高效地进行开发。

## 主要功能

### 1. 智能代码上下文
- 自动分析项目结构和依赖关系
- 理解 Next.js、TypeScript、Supabase 等技术栈
- 提供精准的代码建议和重构建议

### 2. AI 协作增强
- 为 AI 助手提供完整的项目上下文
- 减少重复解释代码的时间
- 提高 AI 回答的准确性

### 3. 代码质量提升
- 检测潜在的代码问题
- 建议最佳实践
- 优化代码结构

## 使用方法

### 在 VS Code 中使用
1. 安装 Context7 扩展
2. 配置已自动完成
3. 使用 Ctrl+Shift+P 打开命令面板
4. 搜索 "Context7" 相关命令

### 在命令行中使用
\`\`\`bash
# 分析整个项目
npx @context7/mcp-server analyze

# 分析特定文件
npx @context7/mcp-server analyze src/app/page.tsx

# 生成项目摘要
npx @context7/mcp-server summary
\`\`\`

### 与 AI 助手配合使用
1. 在询问代码问题时，Context7 会自动提供相关上下文
2. AI 助手能更好地理解你的项目结构
3. 获得更准确的代码建议和解决方案

## 配置文件

- \`.context7/project.json\` - 项目配置
- \`.context7ignore\` - 忽略文件配置
- \`mcp-config.json\` - MCP 服务器配置

## 最佳实践

1. **保持配置更新**：当项目结构发生重大变化时，更新配置文件
2. **合理使用忽略规则**：排除不必要的文件以提高性能
3. **定期重新索引**：确保 Context7 了解最新的代码变化

## 故障排除

### 常见问题
1. **Context7 无法找到文件**
   - 检查 \`.context7ignore\` 文件
   - 确认文件路径正确

2. **性能问题**
   - 减少包含的文件类型
   - 增加更多忽略规则

3. **配置问题**
   - 检查 \`mcp-config.json\` 格式
   - 验证环境变量设置

## 支持

如有问题，请查看：
- Context7 官方文档
- 项目 GitHub Issues
- 开发团队内部文档
`
  
  const guidePath = path.join(process.cwd(), 'CONTEXT7_GUIDE.md')
  fs.writeFileSync(guidePath, guideContent)
  console.log('✅ 使用指南已创建:', guidePath)
}

// 主函数
async function main() {
  try {
    // 检查和安装 Context7
    if (!checkContext7Installation()) {
      const shouldInstall = process.argv.includes('--install')
      if (shouldInstall) {
        if (!installContext7()) {
          process.exit(1)
        }
      } else {
        console.log('\n💡 提示: 运行 `node scripts/setup-context7-mcp.js --install` 来安装 Context7 MCP')
      }
    }
    
    // 创建配置文件
    createProjectConfig()
    createIgnoreFile()
    createVSCodeConfig()
    createUsageGuide()
    
    console.log('\n🎉 Context7 MCP 设置完成!')
    console.log('\n📝 下一步:')
    console.log('1. 如果使用 VS Code，安装 Context7 扩展')
    console.log('2. 配置 Context7 API Key（如果需要）')
    console.log('3. 阅读 CONTEXT7_GUIDE.md 了解使用方法')
    console.log('4. 开始享受更智能的编程体验！')
    
  } catch (error) {
    console.error('❌ 设置过程中出现错误:', error.message)
    process.exit(1)
  }
}

// 运行主函数
main()
