# Coze Token 管理系统使用指南

## 概述

本系统实现了智能的Coze Access Token管理，包括自动获取、验证、缓存和刷新功能。解决了之前token失效导致聊天无响应的问题。

## 主要功能

### ✅ 已修复的问题
- **4101错误自动修复**: 当Coze API返回4101错误时，系统会自动刷新token并重试
- **Token有效性验证**: 在使用缓存token前会先验证其有效性
- **智能重试机制**: 聊天API在token失效时会自动刷新token并重试请求
- **详细错误日志**: 提供完整的调试信息，便于问题排查
- **流式响应延迟优化**: 从10秒延迟优化到2秒内立即响应
- **过期时间计算修复**: 正确处理expires_in为Unix时间戳的情况

### 🔧 核心特性
1. **自动Token管理**: 优先使用数据库缓存的token，过期时自动刷新
2. **实时验证**: 每次使用token前都会验证其有效性
3. **故障转移**: 如果用户token失效，会降级使用系统级认证
4. **持久化存储**: token保存在user_profiles表中，避免重复生成
5. **流式响应优化**: 立即发送开始信号，异步处理非关键操作
6. **快速Token获取**: 2秒超时机制，失败时快速降级到系统认证
7. **对话历史懒加载**: 分层加载策略，大幅提升初始加载速度
8. **智能提示词模板**: 根据会话状态动态构建上下文信息
9. **聊天功能控制**: 基于报告状态智能控制聊天功能的可用性

## 环境变量配置

确保以下环境变量已正确配置：

```bash
# Coze OAuth配置（必需）
COZE_CLIENT_ID=your_client_id
COZE_PUBLIC_KEY_ID=your_public_key_id
COZE_PRIVATE_KEY_FILE=path/to/private_key.pem
COZE_API_BASE=api.coze.cn

# Bot配置
CHAT_BOT_ID=your_bot_id

# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## API接口

### 1. 获取/刷新Token
```bash
POST /api/user-profiles/coze-token
```

**请求参数:**
```json
{
  "userProfileId": "uuid",
  "forceRefresh": false  // 可选，强制刷新token
}
```

**响应:**
```json
{
  "success": true,
  "token": "czs_...",
  "expiresAt": "2024-01-01T12:00:00Z",
  "cached": true  // 是否使用了缓存
}
```

### 2. 清除Token
```bash
DELETE /api/user-profiles/coze-token
```

**请求参数:**
```json
{
  "userProfileId": "uuid"
}
```

## 聊天API集成

聊天API现在包含自动token管理：

```javascript
// 前端调用示例
const response = await fetch('/api/coze/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: '你好',
    userInfo: userInfo,
    userId: userProfileId
  })
})
```

**自动处理的错误:**
- 4101: Token不正确 → 自动刷新token并重试
- 401: 未授权 → 自动刷新token并重试
- Token过期 → 自动获取新token

**流式响应优化:**
- 🚀 立即发送开始信号 (`type: 'start'`)
- ⚡ 2秒内快速token获取
- 🔄 异步处理数据库操作
- 📝 实时流式内容传输

**对话历史优化:**
- 📋 立即加载对话列表（不含消息）
- ⚡ 异步加载最新5个对话消息（含置顶）
- 📜 滚动懒加载其他对话消息
- 🎯 点击对话时按需加载消息

**聊天提示词模板:**
- 🎯 第一次聊天使用完整上下文模板（八字信息+报告内容+分析要求+用户问题）
- 🔄 后续聊天使用简化模板（分析要求+用户问题）
- 📋 智能识别会话状态并构建对应模板
- 🔧 模块化设计，支持不同模块的报告内容

## 测试

### Token管理测试
运行完整的token管理测试：

```bash
node test-token-management.js
```

**测试包括:**
1. ✅ 环境变量检查
2. 🗑️ 清除现有token
3. 🔄 首次token生成
4. 💾 缓存token使用
5. 🔄 强制token刷新
6. 💬 聊天API集成测试

### 流式响应速度测试
运行流式响应性能测试：

```bash
node test-streaming-speed.js
```

**测试包括:**
1. ⚡ 启动延迟测试
2. 📝 首次内容延迟测试
3. 🔄 多次请求一致性测试
4. 📊 性能指标分析

**性能目标:**
- 启动延迟: < 2秒 (优秀) / < 5秒 (良好)
- 首次内容: < 3秒 (优秀) / < 10秒 (可接受)

### 对话历史加载测试
运行对话历史加载优化测试：

```bash
node test-conversation-loading.js
```

**测试包括:**
1. 📋 对话列表快速加载测试
2. 📱 单个对话消息加载测试  
3. ⚡ 并发加载vs顺序加载对比
4. 📊 懒加载性能分析

**优化效果:**
- 对话列表: < 1秒 (优秀) / < 3秒 (良好)
- 优先对话消息: 后台异步加载
- 其他对话: 滚动懒加载

### 聊天提示词模板测试
运行聊天提示词模板测试：

```bash
node test-chat-prompt-template.js
```

**测试包括:**
1. 📊 八字信息获取测试
2. 📋 各模块报告获取测试
3. 🎯 第一次聊天模板构建验证
4. 🔄 后续聊天模板构建验证
5. 🧩 不同模块模板兼容性测试
6. 🚀 实际API调用测试

**验证内容:**
- 提示词模板结构正确性
- 八字信息和报告内容完整性
- 不同模块的模板适配
- 模板长度和性能优化

## 数据库字段

user_profiles表中的相关字段：

```sql
coze_access_token     TEXT     -- Access Token
coze_token_expires_at TIMESTAMP -- 过期时间
coze_token_created_at TIMESTAMP -- 创建时间
```

## 故障排查

### 常见问题

1. **4101错误: Token不正确**
   - ✅ 已自动修复：系统会自动刷新token
   - 检查JWT配置是否正确
   - 确认私钥文件路径和格式

2. **Token生成失败**
   - 检查COZE_CLIENT_ID, COZE_PUBLIC_KEY_ID配置
   - 确认私钥文件存在且格式正确（PEM格式）
   - 验证网络连接到Coze API

3. **Token验证失败**
   - 检查COZE_API_BASE配置
   - 确认Coze服务状态
   - 查看详细错误日志

### 调试日志

系统提供详细的调试日志：

```
🔍 检查用户Coze Token: user-profile-id
📋 Token存在且未过期，验证其有效性...
🔍 验证Token有效性...
✅ Token验证成功
✅ 使用现有有效Token
```

## 性能优化

- **缓存优先**: 优先使用有效的缓存token，减少API调用
- **预验证**: 使用前验证token，避免无效请求
- **智能重试**: 只在token错误时重试，避免无限循环
- **提前过期**: token在过期前1分钟就标记为过期，确保可用性

## 安全考虑

- Token存储在数据库中，仅授权用户可访问
- 自动过期机制，定期更新token
- 错误时不会泄露敏感信息
- 支持强制清除和重新生成token 