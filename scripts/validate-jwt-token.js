const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

function validateJWTToken() {
  console.log('🔍 验证 JWT Token 格式和内容...\n')

  try {
    // 创建 JWT Token (和 API 中相同的逻辑)
    const clientId = process.env.COZE_CLIENT_ID
    const publicKeyId = process.env.COZE_PUBLIC_KEY_ID
    const privateKeyFile = process.env.COZE_PRIVATE_KEY_FILE
    
    const privateKeyPath = path.resolve(process.cwd(), privateKeyFile)
    const privateKey = fs.readFileSync(privateKeyPath, 'utf8')
    
    const now = Math.floor(Date.now() / 1000)
    const payload = {
      iss: clientId,
      aud: 'api.coze.cn',
      iat: now,
      exp: now + 3600,
      jti: `${clientId}_${now}_validation_test`
    }
    
    const token = jwt.sign(payload, privateKey, {
      algorithm: 'RS256',
      keyid: publicKeyId,
    })
    
    console.log('✅ JWT Token 创建成功')
    console.log('   长度:', token.length)
    console.log('   完整 Token:', token)
    console.log()
    
    // 解码 Token (不验证签名)
    const decoded = jwt.decode(token, { complete: true })
    console.log('📋 JWT Token 解码结果:')
    console.log('   Header:', JSON.stringify(decoded.header, null, 2))
    console.log('   Payload:', JSON.stringify(decoded.payload, null, 2))
    console.log()
    
    // 检查 Token 各部分
    const parts = token.split('.')
    console.log('🔧 JWT Token 结构分析:')
    console.log('   总部分数:', parts.length, '(应该是 3)')
    console.log('   Header 长度:', parts[0]?.length || 0)
    console.log('   Payload 长度:', parts[1]?.length || 0)
    console.log('   Signature 长度:', parts[2]?.length || 0)
    console.log()
    
    // 检查是否有特殊字符或编码问题
    console.log('🔍 字符编码检查:')
    console.log('   包含换行符:', token.includes('\n'))
    console.log('   包含回车符:', token.includes('\r'))
    console.log('   包含空格:', token.includes(' '))
    console.log('   包含制表符:', token.includes('\t'))
    console.log()
    
    // 模拟 OAuth 请求体
    const requestBody = {
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: token,
      duration_seconds: 86400
    }
    
    console.log('📡 OAuth 请求体:')
    console.log(JSON.stringify(requestBody, null, 2))
    console.log()
    
    // 检查 JSON 序列化后的长度
    const jsonString = JSON.stringify(requestBody)
    console.log('📏 JSON 序列化检查:')
    console.log('   JSON 字符串长度:', jsonString.length)
    console.log('   assertion 字段长度:', requestBody.assertion.length)
    console.log('   JSON 中的 assertion 是否完整:', jsonString.includes(token))
    
    return token
    
  } catch (error) {
    console.error('❌ JWT Token 验证失败:', error)
    return null
  }
}

// 运行验证
const token = validateJWTToken()

if (token) {
  console.log('\n🎯 建议检查的问题:')
  console.log('1. Coze API 是否期望不同的 JWT 格式?')
  console.log('2. 是否需要在 HTTP 头中而不是请求体中发送 JWT?')
  console.log('3. 是否需要 Bearer 前缀?')
  console.log('4. API 端点是否正确?')
  console.log('5. 是否有字符编码问题?')
}
