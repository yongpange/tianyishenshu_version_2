# OAuth Token 4100 错误完整诊断指南

## 🚨 问题现象
- PAT Token 认证成功 ✅
- OAuth Token 认证失败，报错：`code: 4100, msg: authentication is invalid`

## 🔍 可能原因分析

### 1. **Bot 权限问题（最常见）**
OAuth Token 获取成功，但没有访问特定 Bot 的权限。

**解决方案：**
```bash
# 在 Coze 开放平台检查：
1. 进入你的 OAuth 应用设置
2. 查看 "Bot 权限" 或 "API 权限" 设置
3. 确保你的 Bot ID 已经授权给这个 OAuth 应用
4. 如果是团队 Bot，需要团队管理员授权
```

### 2. **API 版本不匹配**
使用了错误的 API 端点或版本。

**修复代码：**
```typescript
// ❌ 错误的 baseURL
const client = new CozeAPI({
  token: oauthToken,
  baseURL: 'https://api.coze.cn'  // 缺少结尾斜杠
})

// ✅ 正确的 baseURL
const client = new CozeAPI({
  token: oauthToken,
  baseURL: 'https://api.coze.cn/'  // 必须有结尾斜杠
})
```

### 3. **OAuth 应用类型错误**
创建 OAuth 应用时选择了错误的类型。

**检查步骤：**
```bash
在 Coze 开放平台检查你的应用配置：
- 应用类型：选择 "服务类应用"
- 授权方式：选择 "JWT 授权"
- 权限范围：确保包含聊天相关权限
```

### 4. **Token 使用方式问题**
OAuth Token 和 PAT Token 的使用方式可能有细微差别。

**对比测试代码：**
```typescript
// 创建测试脚本
async function compareTokenUsage() {
  const botId = 'your_bot_id'
  const testMessage = {
    role: 'user',
    content: '测试消息',
    content_type: 'text'
  }

  // PAT Token 测试
  console.log('🔑 测试 PAT Token...')
  const patClient = new CozeAPI({
    token: process.env.COZE_API_TOKEN,
    baseURL: 'https://api.coze.cn/'
  })

  try {
    const patResult = await patClient.chat.createAndPoll({
      bot_id: botId,
      user_id: 'test_pat',
      additional_messages: [testMessage]
    })
    console.log('✅ PAT Token 成功')
  } catch (error) {
    console.log('❌ PAT Token 失败:', error.message)
  }

  // OAuth Token 测试
  console.log('🔐 测试 OAuth Token...')
  const oauthClient = new CozeAPI({
    token: 'your_oauth_token',
    baseURL: 'https://api.coze.cn/'
  })

  try {
    const oauthResult = await oauthClient.chat.createAndPoll({
      bot_id: botId,
      user_id: 'test_oauth',  // 不同的 user_id
      additional_messages: [testMessage]
    })
    console.log('✅ OAuth Token 成功')
  } catch (error) {
    console.log('❌ OAuth Token 失败:', error.message, error.code)
  }
}
```

## 🛠️ 立即修复方案

### 方案1：检查 Bot 授权状态

1. 登录 [Coze 开放平台](https://www.coze.cn/open)
2. 进入你的 OAuth 应用
3. 查看 "Bot 管理" 或 "权限设置"
4. 确保你的 Bot ID 在授权列表中

### 方案2：验证 OAuth 应用配置

确保你的 OAuth 应用配置正确：
```javascript
// 正确的环境变量设置
COZE_CLIENT_ID=你的客户端ID
COZE_PUBLIC_KEY_ID=你的公钥ID
COZE_PRIVATE_KEY_FILE=keys/private_key.pem
COZE_API_BASE=api.coze.cn  // 不要包含 https://
```

### 方案3：使用系统级认证作为降级

在 `report-generator.ts` 中，如果用户级 OAuth 失败，使用系统级认证：

```typescript
// 在报告生成器中的修复
try {
  // 尝试用户级 JWT
  const tokenResult = await ensureUserCozeToken(userProfileId)
  if (tokenResult.success) {
    coze = new CozeAPI({
      token: tokenResult.token,
      baseURL: 'https://api.coze.cn/'
    })
  }
} catch (userTokenError) {
  // 降级使用系统级认证
  const systemAuth = await createReportCozeClient()
  coze = systemAuth.client
  authMethod = systemAuth.authMethod + ' (fallback)'
}
```

### 方案4：临时使用 PAT Token

如果 OAuth 问题持续存在，可以临时强制使用 PAT Token：

```typescript
// 在 coze-auth.ts 中强制使用 PAT
export async function createReportCozeClient() {
  // 临时强制使用 PAT Token 直到 OAuth 问题解决
  const patToken = process.env.COZE_API_TOKEN
  if (patToken) {
    console.log('🔑 临时使用 PAT Token（绕过 OAuth 4100 问题）')
    const client = new CozeAPI({
      token: patToken,
      baseURL: 'https://api.coze.cn/'
    })
    return {
      client,
      authMethod: 'PAT Token (4100 workaround)'
    }
  }
  // ... 其他逻辑
}
```

## 🔎 调试建议

1. **添加详细日志**：
```typescript
console.log('🔍 OAuth Token 详情:')
console.log('- Token 长度:', token.length)
console.log('- Token 前缀:', token.substring(0, 20))
console.log('- Bot ID:', botId)
console.log('- User ID:', userId)
console.log('- Base URL:', baseURL)
```

2. **测试不同的 API 端点**：
```typescript
// 测试基础权限
const workspaces = await fetch('https://api.coze.cn/v1/workspaces', {
  headers: { 'Authorization': `Bearer ${token}` }
})

// 测试 Bot 权限
const bots = await fetch('https://api.coze.cn/v1/bots', {
  headers: { 'Authorization': `Bearer ${token}` }
})
```

3. **检查 Bot 的发布状态**：
确保你的 Bot 已经正式发布，而不是草稿状态。

## 📝 下一步行动

1. 立即检查 Coze 开放平台的 Bot 权限设置
2. 如果权限正确，使用 PAT Token 作为临时解决方案
3. 联系 Coze 技术支持确认 OAuth 应用配置
4. 考虑重新创建 OAuth 应用如果问题持续存在 