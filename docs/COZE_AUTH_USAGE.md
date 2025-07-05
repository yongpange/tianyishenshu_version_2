# Coze 认证库使用指南

## 概述

`src/lib/coze-auth.ts` 提供了统一的 Coze API 认证管理，支持 JWT OAuth 和 PAT Token 两种认证方式，可以在多个 API 路由中复用。

## 核心功能

### 1. 统一认证客户端创建

```typescript
import { createCozeClient, validateBotId, checkAuthConfig } from '@/lib/coze-auth'

// 使用默认配置创建客户端
const { client, authMethod, token } = await createCozeClient()

// 使用自定义配置创建客户端
const { client, authMethod, token } = await createCozeClient({
  botId: 'your-specific-bot-id',
  patToken: 'your-custom-pat-token'
})
```

### 2. Bot ID 验证

```typescript
import { validateBotId } from '@/lib/coze-auth'

// 验证默认 Bot ID
const botId = validateBotId()

// 验证自定义 Bot ID
const customBotId = validateBotId('your-specific-bot-id')
```

### 3. 认证配置检查

```typescript
import { checkAuthConfig } from '@/lib/coze-auth'

// 检查默认认证配置
try {
  checkAuthConfig()
  console.log('认证配置有效')
} catch (error) {
  console.error('认证配置无效:', error.message)
}
```

## 环境变量配置

### JWT OAuth 认证（推荐）

```bash
# Coze OAuth 应用配置
COZE_CLIENT_ID=your_client_id
COZE_PUBLIC_KEY_ID=your_public_key_id
COZE_PRIVATE_KEY_FILE=./keys/private-key.pem
COZE_API_BASE=api.coze.cn

# 默认 Bot ID
BOT_ID=your_default_bot_id
```

### PAT Token 认证（备用）

```bash
# Personal Access Token
COZE_API_TOKEN=your_pat_token

# 默认 Bot ID
BOT_ID=your_default_bot_id
```

### 特定场景的 Bot ID

```bash
# 性格报告专用 Bot
PERSONALITY_BOT_ID=your_personality_bot_id

# 聊天对话专用 Bot
CHAT_BOT_ID=your_chat_bot_id
```

## 使用示例

### 在 API 路由中使用

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { ChatStatus, RoleType } from '@coze/api'
import { createCozeClient, validateBotId, checkAuthConfig } from '@/lib/coze-auth'

export async function POST(request: NextRequest) {
  try {
    // 1. 检查认证配置
    checkAuthConfig()
    
    // 2. 验证 Bot ID
    const botId = validateBotId(process.env.YOUR_SPECIFIC_BOT_ID)
    
    // 3. 创建 Coze 客户端
    const { client: coze, authMethod } = await createCozeClient()
    
    // 4. 调用 Coze API
    const result = await coze.chat.createAndPoll({
      bot_id: botId,
      user_id: 'user_' + Date.now(),
      additional_messages: [
        {
          role: RoleType.User,
          content: 'Hello!',
          content_type: 'text',
        },
      ],
    })
    
    // 5. 处理响应
    if (result.chat.status === ChatStatus.COMPLETED && result.messages) {
      const aiMessage = result.messages.find(
        (msg: any) => msg.role === RoleType.Assistant && msg.type === 'answer'
      )
      
      return NextResponse.json({
        success: true,
        response: aiMessage?.content || '无响应',
        authMethod: authMethod
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'AI 响应失败'
    }, { status: 500 })
    
  } catch (error) {
    console.error('API 调用失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '服务异常'
    }, { status: 500 })
  }
}
```

### 多 Bot 场景管理

```typescript
// 为不同的功能使用不同的 Bot
const personalityBotId = validateBotId(process.env.PERSONALITY_BOT_ID)
const chatBotId = validateBotId(process.env.CHAT_BOT_ID)
const astrologyBotId = validateBotId(process.env.ASTROLOGY_BOT_ID)

// 创建对应的客户端
const personalityClient = await createCozeClient()
const chatClient = await createCozeClient()
const astrologyClient = await createCozeClient()
```

## 认证方式说明

### JWT OAuth（优先级高）

- 更安全的认证方式
- 支持长期使用
- 需要配置私钥文件
- 自动处理 token 刷新

### PAT Token（备用方案）

- 简单易配置
- 直接使用个人访问令牌
- 适用于开发和测试环境

## 错误处理

认证库会自动处理以下错误场景：

1. **JWT 认证失败** → 自动降级到 PAT 认证
2. **配置缺失** → 抛出明确的错误信息
3. **Bot ID 无效** → 验证失败并提示
4. **网络错误** → 包含详细的错误信息

## 最佳实践

1. **优先使用 JWT OAuth** 认证方式，提供更好的安全性
2. **为不同功能配置专用 Bot ID**，便于管理和监控
3. **在 API 入口处进行配置检查**，提前发现问题
4. **记录认证方式日志**，便于问题排查
5. **妥善保管私钥文件**，避免泄露安全信息

## 迁移指南

### 从旧的认证代码迁移

```typescript
// 旧的方式
const coze = new CozeAPI({
  token: process.env.COZE_API_TOKEN,
  baseURL: 'https://api.coze.cn/',
})

// 新的方式
const { client: coze, authMethod } = await createCozeClient()
```

### 环境变量更新

确保已配置以下环境变量：

```bash
# JWT OAuth (推荐)
COZE_CLIENT_ID=
COZE_PUBLIC_KEY_ID=
COZE_PRIVATE_KEY_FILE=

# 或 PAT Token (备用)
COZE_API_TOKEN=

# Bot IDs
BOT_ID=
PERSONALITY_BOT_ID=
CHAT_BOT_ID=
```

## 故障排查

### 常见问题

1. **JWT 认证失败**
   - 检查私钥文件路径和格式
   - 确认 Client ID 和 Public Key ID 正确

2. **PAT Token 无效**
   - 检查 token 是否过期
   - 确认 token 权限设置

3. **Bot ID 错误**
   - 确认 Bot ID 格式正确
   - 检查 Bot 是否已发布和可用

### 调试日志

认证库会输出详细的调试日志：

```
🔐 尝试使用JWT OAuth认证
✅ JWT OAuth认证成功
🌐 使用API地址: https://api.coze.cn/
🔐 认证方式: JWT OAuth
```

通过查看这些日志可以了解认证流程和排查问题。 