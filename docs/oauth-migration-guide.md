# Coze OAuth 2.0 迁移指南

## 概述

本项目已从静态 API Token 认证迁移到 OAuth 2.0 认证，并支持动态 BOT_ID 传递。

## 主要变更

### 1. 认证方式变更

**旧版本 (静态 API Token):**
```env
COZE_API_TOKEN=your_static_token
BOT_ID=your_fixed_bot_id
```

**新版本 (OAuth 2.0):**
```env
COZE_CLIENT_ID=your_client_id
COZE_PUBLIC_KEY_ID=your_public_key_id
COZE_PRIVATE_KEY_FILE=private_key_ty.pem
COZE_API_BASE=api.coze.cn
```

### 2. BOT_ID 动态传递

**旧版本:** BOT_ID 写死在环境变量中
**新版本:** BOT_ID 作为 API 参数动态传递

```javascript
// 聊天API调用示例
const response = await fetch('/api/coze/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: '你好',
    botId: '7445193658986659842', // 动态传递
    userId: 'user123'
  })
})

// 性格报告API调用示例
const response = await fetch('/api/personality-report/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userInfo: {...},
    userId: 'user123',
    botId: '7445193658986659842' // 动态传递
  })
})
```

## 配置步骤

### 1. 环境变量配置

复制 `.env.local.example` 到 `.env.local` 并填入正确的值：

```bash
cp .env.local.example .env.local
```

### 2. 私钥文件

确保 `private_key_ty.pem` 文件在项目根目录，且已被 `.gitignore` 排除。

### 3. 前端BOT_ID配置

可以在环境变量中设置默认BOT_ID：

```env
NEXT_PUBLIC_DEFAULT_CHAT_BOT_ID=7445193658986659842
NEXT_PUBLIC_PERSONALITY_BOT_ID=7445193658986659842
```

## 架构优势

### 1. 安全性提升
- OAuth 2.0 JWT 认证更安全
- 私钥文件与代码分离
- 支持 token 自动刷新

### 2. 灵活性增强
- 支持调用多个不同的智能体
- BOT_ID 可根据业务需求动态选择
- 便于 A/B 测试和功能切换

### 3. 可维护性
- 统一的认证客户端
- 清晰的错误处理
- 完整的日志记录

## 测试验证

运行测试脚本验证迁移是否成功：

```bash
node scripts/test-oauth-integration.js
```

## 故障排除

### 1. JWT 认证失败
- 检查 `COZE_CLIENT_ID` 和 `COZE_PUBLIC_KEY_ID` 是否正确
- 确认私钥文件格式正确 (PEM 格式)
- 验证私钥文件路径

### 2. BOT_ID 错误
- 确认传递的 BOT_ID 存在且有权限访问
- 检查前端是否正确传递 botId 参数

### 3. API 调用失败
- 查看服务器日志获取详细错误信息
- 确认网络连接正常
- 验证 Coze API 服务状态

## 支持的智能体

目前支持调用 6 个不同的智能体，BOT_ID 可根据具体需求传递：

1. 默认聊天机器人: `7445193658986659842`
2. 性格分析机器人: `7445193658986659842`
3. 其他智能体: 根据实际配置

## 注意事项

1. 确保私钥文件安全，不要提交到版本控制
2. OAuth token 有效期为 24 小时，系统会自动刷新
3. 不同智能体可能有不同的响应格式，注意适配
4. 生产环境部署时确认所有环境变量正确配置
