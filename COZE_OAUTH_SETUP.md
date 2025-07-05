# Coze OAuth JWT 认证配置指南

## 🎯 概述

本指南将帮助您将当前项目从 **PAT Token 认证** 升级到 **OAuth JWT 认证**，提供更加安全和规范的API访问方式。

## 🔄 认证方式对比

| 认证方式 | 优势 | 劣势 | 适用场景 |
|---------|------|------|----------|
| **PAT Token** | 配置简单，立即可用 | 长期有效，安全性较低 | 开发测试环境 |
| **JWT OAuth** | 安全性高，符合OAuth2.0标准 | 配置复杂，需要密钥管理 | 生产环境 |

## 🔧 配置步骤

### 1. 在Coze开放平台创建OAuth应用

1. 访问 [Coze 开放平台](https://www.coze.cn/open)
2. 进入 **应用管理** → **创建应用**
3. 选择应用类型：**普通应用**
4. 客户端类型：**服务类应用**
5. 授权方式：选择 **JWT授权**

### 2. 获取OAuth配置信息

创建应用后，您将获得：
- **Client ID** (应用ID)
- **Private Key** (私钥，用于签名JWT)
- **Public Key ID** (公钥ID，用于JWT header中的kid字段)

### 3. 配置环境变量

在项目根目录的 `.env.local` 文件中添加：

```bash
# OAuth JWT 认证配置（推荐）
COZE_CLIENT_ID=your_client_id_here

# 公钥ID（必需）
COZE_PUBLIC_KEY_ID=your_public_key_id_here

# 私钥文件路径（推荐）
COZE_PRIVATE_KEY_FILE=keys/coze_private_key.pem

# API基础地址配置（可选，默认为api.coze.cn）
COZE_API_BASE=api.coze.cn

# Bot ID（必需）
COZE_BOT_ID=7123456789012345678

# PAT Token认证（降级方案，可选保留）
COZE_API_TOKEN=pat_xxxxxxxxxxxxxxxxxxxxxxxx
```

**注意事项：**
- 私钥文件需要包含完整的 `-----BEGIN PRIVATE KEY-----` 和 `-----END PRIVATE KEY-----`  
- Public Key ID 是创建密钥对时生成的唯一标识符
- 私钥文件应设置适当的文件权限以确保安全

### 4. 私钥文件配置步骤

1. **创建私钥目录**：
```bash
mkdir keys
```

2. **保存私钥文件**：
将从Coze平台下载的私钥文件保存到 `keys/coze_private_key.pem`

3. **设置文件权限**（Linux/macOS）：
```bash
chmod 600 keys/coze_private_key.pem
```

4. **配置环境变量**：
```bash
COZE_PRIVATE_KEY_FILE=keys/coze_private_key.pem
```

## 🔒 安全最佳实践

### 1. 私钥安全存储
```bash
# 推荐：使用私钥文件路径
COZE_PRIVATE_KEY_FILE=keys/coze_private_key.pem

# 必需：配置公钥ID
COZE_PUBLIC_KEY_ID=your_public_key_id
```

### 2. 生产环境配置
```bash
# 使用Docker Secrets或Kubernetes Secrets
# 将私钥挂载到容器中的安全路径
COZE_PRIVATE_KEY_FILE=/run/secrets/coze_private_key.pem
COZE_PUBLIC_KEY_ID=/run/secrets/coze_public_key_id

# 或者使用环境变量（从密钥管理服务获取）
COZE_PUBLIC_KEY_ID=${VAULT_COZE_PUBLIC_KEY_ID}
```

### 3. 权限管理
- 私钥文件权限设置为 `600` (仅所有者可读写)
- 不要将私钥文件提交到Git仓库（已配置.gitignore）
- Public Key ID可以安全地存储在环境变量中
- 定期轮换密钥对

## 📊 认证流程图

```mermaid
graph TD
    A[请求到达API] --> B{JWT OAuth配置存在?}
    B -->|是| C[生成JWT Token]
    B -->|否| D[使用PAT Token]
    C --> E[调用OAuth Token端点]
    E --> F[获取Access Token]
    F --> G[调用Coze API]
    D --> G
    G --> H[返回响应]
    C --> I{JWT生成失败?}
    I -->|是| J[降级到PAT]
    J --> G
    E --> K{OAuth请求失败?}
    K -->|是| J
```

## 🔗 官方API规范

### JWT Token生成规范

根据Coze官方文档，JWT Token必须包含以下字段：

**Header部分**：
```json
{
  "alg": "RS256",          // 固定为RS256
  "typ": "JWT",            // 固定为JWT  
  "kid": "your_public_key_id" // 公钥指纹
}
```

**Payload部分**：
```json
{
  "iss": "your_client_id",    // OAuth应用ID
  "aud": "api.coze.cn",       // 固定为api.coze.cn
  "iat": 1516239022,          // 签发时间戳
  "exp": 1516259022,          // 过期时间戳
  "jti": "unique_random_str"  // 防重放随机字符串
}
```

### OAuth Token获取规范

**API端点**：`https://api.coze.cn/api/permission/oauth2/token`

**请求格式**：
```bash
curl -X POST https://api.coze.cn/api/permission/oauth2/token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "duration_seconds": 86399,
    "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer"
  }'
```

**响应格式**：
```json
{
  "access_token": "czs_RQOhsc7vmUzK4bNgb7hn4wqOgRBYAO6xvpFHNbnl6RiQJX3cSXSguIhFDzgy****",
  "expires_in": 1721135859
}
```

## 🧪 测试配置

运行测试脚本：
```bash
node scripts/test-coze-oauth.js
```

该脚本将：
1. ✅ 检查环境变量配置
2. 🔑 从文件读取私钥
3. 🔐 生成JWT Token
4. 🔄 获取OAuth Access Token
5. 📡 测试API连接

完整的测试脚本已包含在项目中：`scripts/test-coze-oauth.js`

## 🚀 使用效果

配置完成后，您的API将：

1. **优先使用JWT认证**：更安全的OAuth2.0标准
2. **自动降级机制**：JWT失败时自动使用PAT认证
3. **认证方式显示**：API响应中包含当前使用的认证方式

API响应示例：
```json
{
  "success": true,
  "response": "AI智能体的回复内容",
  "conversationId": "coze_conversation_id",
  "chatId": "chat_id",
  "authMethod": "JWT OAuth"  // 显示当前使用的认证方式
}
```

## 🔧 故障排除

### 常见问题

**1. JWT生成失败**
```
错误：JWT认证失败
解决：检查私钥格式，确保包含完整的开始和结束标记
```

**2. 私钥格式错误**
```
错误：error:0909006C:PEM routines:get_name:no start line
解决：确保私钥以 -----BEGIN PRIVATE KEY----- 开始
```

**3. 时间戳错误**
```
错误：JWT expired
解决：检查服务器时间是否正确
```

### 调试模式

启用详细日志：
```bash
DEBUG=coze:* npm run dev
```

## 📋 迁移清单

- [ ] 在Coze平台创建OAuth应用
- [ ] 获取Client ID和私钥
- [ ] 配置环境变量
- [ ] 安装JWT依赖
- [ ] 测试JWT认证
- [ ] 部署到生产环境
- [ ] 监控认证状态

---

完成配置后，您的应用将使用更加安全的OAuth JWT认证方式！ 