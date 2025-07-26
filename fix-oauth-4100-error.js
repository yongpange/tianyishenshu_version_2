/**
 * 修复 OAuth Token 4100 错误的解决方案
 */

// 1. 正确的 JWT Payload 格式
const correctJWTPayload = {
  iss: "your_client_id",           // 必须是你的 Client ID
  aud: "api.coze.cn",              // 重要：不要加 https:// 前缀
  iat: Math.floor(Date.now() / 1000),     // 当前时间戳
  exp: Math.floor(Date.now() / 1000) + 3600,  // 1小时后过期
  jti: "unique_jwt_id"             // 唯一标识符
}

// ❌ 错误的 aud 格式会导致 4100 错误：
// aud: "https://api.coze.cn"      // 不要包含协议
// aud: "api.coze.cn/"             // 不要包含结尾斜杠
// aud: "api.coze.com"             // 域名错误

// 2. 正确的 OAuth 请求格式
const correctOAuthRequest = {
  method: 'POST',
  url: 'https://api.coze.cn/api/permission/oauth2/token',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${jwtToken}`
  },
  body: {
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    duration_seconds: 86400  // 24小时，不要超过最大值
  }
}

// 3. 可能的 4100 错误原因对照表
const error4100Causes = {
  "JWT aud 字段错误": {
    problem: "aud 不是 'api.coze.cn'",
    solution: "确保 aud 字段为 'api.coze.cn'，不包含协议或路径"
  },
  "Client ID 无效": {
    problem: "使用了错误的 Client ID",
    solution: "检查 Coze 开放平台的应用配置，确认 Client ID 正确"
  },
  "Public Key ID 不匹配": {
    problem: "JWT header 中的 kid 字段与公钥不匹配",
    solution: "确认 Public Key ID 与密钥对正确关联"
  },
  "私钥格式错误": {
    problem: "私钥不是正确的 RSA 格式",
    solution: "重新生成 RSA 密钥对，确保格式为 PKCS#8"
  },
  "时间戳错误": {
    problem: "iat 或 exp 时间戳不正确",
    solution: "使用正确的 Unix 时间戳（秒为单位）"
  },
  "Bot 权限问题": {
    problem: "OAuth token 没有访问指定 Bot 的权限",
    solution: "检查 Bot 的权限设置，确保 OAuth 应用有访问权限"
  }
}

// 4. 修复 JWT 创建的正确代码
function createCorrectJWT(clientId, publicKeyId, privateKey) {
  const jwt = require('jsonwebtoken')
  
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: clientId,
    aud: 'api.coze.cn',  // 关键：确保这里是正确的
    iat: now,
    exp: now + 3600,
    jti: `${clientId}_${now}_${Math.random().toString(36).substring(2, 11)}`
  }
  
  return jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    header: {
      typ: 'JWT',
      alg: 'RS256',
      kid: publicKeyId  // 确保 kid 正确
    }
  })
}

// 5. 验证 OAuth Token 是否有效的测试函数
async function validateOAuthToken(accessToken) {
  const testUrls = [
    'https://api.coze.cn/v1/workspaces',
    'https://api.coze.cn/v1/bots'
  ]
  
  for (const url of testUrls) {
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log(`${url}: ${response.status}`)
      
      if (response.status === 4100) {
        console.log('❌ 4100 错误：OAuth token 认证无效')
        return false
      }
      
      if (response.status === 200) {
        console.log('✅ OAuth token 有效')
        return true
      }
      
    } catch (error) {
      console.error(`测试 ${url} 失败:`, error.message)
    }
  }
  
  return false
}

// 6. 对比 PAT Token 和 OAuth Token 的差异测试
async function compareTokens(patToken, oauthToken, botId) {
  const { CozeAPI } = require('@coze/api')
  
  const testMessage = {
    role: 'user',
    content: '你好，这是一个测试消息',
    content_type: 'text'
  }
  
  // 测试 PAT Token
  try {
    const patClient = new CozeAPI({
      token: patToken,
      baseURL: 'https://api.coze.cn/'
    })
    
    const patResult = await patClient.chat.createAndPoll({
      bot_id: botId,
      user_id: 'test_pat_user',
      additional_messages: [testMessage]
    })
    
    console.log('✅ PAT Token 测试成功')
    
  } catch (error) {
    console.log('❌ PAT Token 测试失败:', error.message)
  }
  
  // 测试 OAuth Token
  try {
    const oauthClient = new CozeAPI({
      token: oauthToken,
      baseURL: 'https://api.coze.cn/'
    })
    
    const oauthResult = await oauthClient.chat.createAndPoll({
      bot_id: botId,
      user_id: 'test_oauth_user',
      additional_messages: [testMessage]
    })
    
    console.log('✅ OAuth Token 测试成功')
    
  } catch (error) {
    console.log('❌ OAuth Token 测试失败:', error.message, '错误代码:', error.code)
    
    if (error.code === 4100) {
      console.log('\n💡 OAuth Token 4100 错误分析：')
      console.log('1. 检查 JWT aud 字段是否为 "api.coze.cn"')
      console.log('2. 确认 Client ID 和 Public Key ID 正确')
      console.log('3. 验证 Bot 是否授权给 OAuth 应用')
      console.log('4. 检查 OAuth 应用的权限范围')
    }
  }
}

module.exports = {
  correctJWTPayload,
  error4100Causes,
  createCorrectJWT,
  validateOAuthToken,
  compareTokens
}

console.log('🔧 OAuth 4100 错误修复指南已加载')
console.log('主要检查点：')
console.log('1. JWT aud 字段必须是 "api.coze.cn"')
console.log('2. Client ID 和 Public Key ID 必须正确')
console.log('3. Bot 必须授权给 OAuth 应用')
console.log('4. 私钥格式必须正确（RSA PKCS#8）') 