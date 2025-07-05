const { CozeAPI, COZE_CN_BASE_URL } = require('@coze/api')
const jwt = require('jsonwebtoken')
const fs = require('fs')
require('dotenv').config({ path: '.env.local' })

async function testJWTAuth() {
  console.log('🧪 测试 Coze OAuth JWT 认证配置\n')
  
  try {
    // 检查环境变量
    const clientId = process.env.COZE_CLIENT_ID
    const publicKeyId = process.env.COZE_PUBLIC_KEY_ID
    const privateKeyFile = process.env.COZE_PRIVATE_KEY_FILE
    const apiBase = process.env.COZE_API_BASE || 'api.coze.cn'
    const botId = process.env.COZE_BOT_ID || process.env.BOT_ID
    
    console.log('📋 配置检查:')
    console.log(`   Client ID: ${clientId ? '✅ 已配置' : '❌ 未配置'}`)
    console.log(`   Public Key ID: ${publicKeyId ? '✅ 已配置' : '❌ 未配置'}`)
    console.log(`   私钥文件: ${privateKeyFile ? '✅ 已配置' : '❌ 未配置'}`)
    console.log(`   API Base: ${apiBase}`)
    console.log(`   Bot ID: ${botId ? '✅ 已配置' : '❌ 未配置'}\n`)
    
    if (!clientId) {
      throw new Error('COZE_CLIENT_ID 环境变量未配置')
    }
    
    if (!publicKeyId) {
      throw new Error('COZE_PUBLIC_KEY_ID 环境变量未配置')
    }
    
    if (!botId) {
      throw new Error('COZE_BOT_ID 或 BOT_ID 环境变量未配置')
    }
    
    // 读取私钥
    let privateKey = ''
    if (!privateKeyFile) {
      throw new Error('COZE_PRIVATE_KEY_FILE 环境变量未配置')
    }
    
    try {
      privateKey = fs.readFileSync(privateKeyFile, 'utf8')
      console.log('🔑 从文件读取私钥成功')
    } catch (error) {
      throw new Error(`私钥文件读取失败: ${error.message}`)
    }
    
    // 清理私钥格式（处理环境变量中的换行符）
    privateKey = privateKey.replace(/\\n/g, '\n')
    
    // 生成JWT Token
    console.log('🔐 生成JWT Token...')
    const now = Math.floor(Date.now() / 1000)
    const payload = {
      iss: clientId,                    // 应用ID (issuer)
      aud: apiBase,                     // 受众 - Coze API域名 (不含https://)
      iat: now,                         // 签发时间 (issued at)
      exp: now + 3600,                  // 过期时间 (expiry) - 1小时后
      jti: `${clientId}_${now}_${Math.random().toString(36).substring(2, 11)}` // JWT ID - 唯一标识
    }
    
    const jwtToken = jwt.sign(payload, privateKey, { 
      algorithm: 'RS256',
      header: {
        typ: 'JWT',
        alg: 'RS256',
        kid: publicKeyId  // 公钥ID
      }
    })
    console.log('✅ JWT Token 生成成功')
    console.log(`   Token 长度: ${jwtToken.length} 字符`)
    console.log(`   Token 前缀: ${jwtToken.substring(0, 50)}...`)
    
    // 输出JWT payload用于调试
    console.log('🔍 JWT Payload:')
    console.log(JSON.stringify(payload, null, 2))
    
    console.log('🔍 JWT Header (设置):')
    console.log(JSON.stringify({
      typ: 'JWT',
      alg: 'RS256',
      kid: publicKeyId
    }, null, 2), '\n')
    
    // 获取OAuth Access Token - 使用官方API规范
    console.log('🔄 通过JWT获取OAuth Access Token...')
    const tokenEndpoint = `https://${apiBase}/api/permission/oauth2/token`
    
    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify({
        duration_seconds: 86399, // 24小时 - 1秒
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer'
      })
    })
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      throw new Error(`OAuth token请求失败: ${tokenResponse.status} ${errorText}`)
    }
    
    const tokenData = await tokenResponse.json()
    
    if (!tokenData.access_token) {
      throw new Error('OAuth响应中缺少access_token')
    }
    
    const accessToken = tokenData.access_token
    console.log('✅ OAuth Access Token获取成功')
    console.log(`   Access Token: ${accessToken.substring(0, 20)}...`)
    console.log(`   过期时间戳: ${tokenData.expires_in}`)
    console.log(`   Access Token长度: ${accessToken.length} 字符\n`)
    
    // 创建Coze客户端
    console.log('📡 测试API连接...')
    const baseURL = apiBase.includes('coze.cn') ? COZE_CN_BASE_URL : `https://${apiBase}`
    console.log(`   使用API地址: ${baseURL}`)
    
    const coze = new CozeAPI({
      token: accessToken,
      baseURL: baseURL
    })
    
    // 测试简单的API调用
    const testMessage = '你好，这是一个测试消息'
    const result = await coze.chat.createAndPoll({
      bot_id: botId,
      user_id: 'test_user_' + Date.now(),
      additional_messages: [
        {
          role: 'user',
          content: testMessage,
          content_type: 'text',
        },
      ],
    })
    
    if (result.chat && result.chat.id) {
      console.log('🎉 OAuth JWT 认证测试成功！')
      console.log(`   Chat ID: ${result.chat.id}`)
      console.log(`   状态: ${result.chat.status}`)
      console.log(`   对话ID: ${result.chat.conversation_id}`)
      
      if (result.messages && result.messages.length > 0) {
        const response = result.messages.find(msg => msg.role === 'assistant')
        if (response) {
          console.log(`   AI回复: ${response.content?.substring(0, 100)}...`)
        }
      }
    } else {
      console.log('⚠️  API调用成功，但响应格式异常')
      console.log(JSON.stringify(result, null, 2))
    }
    
  } catch (error) {
    console.error('❌ JWT认证测试失败:')
    console.error(`   错误类型: ${error.name}`)
    console.error(`   错误信息: ${error.message}`)
    
    if (error.message.includes('PEM')) {
      console.error('\n💡 私钥格式提示:')
      console.error('   - 确保私钥以 "-----BEGIN PRIVATE KEY-----" 开始')
      console.error('   - 确保私钥以 "-----END PRIVATE KEY-----" 结束')
      console.error('   - 如果在环境变量中，换行符用 \\n 表示')
    }
    
    if (error.message.includes('expired')) {
      console.error('\n💡 时间戳提示:')
      console.error('   - 检查服务器时间是否正确')
      console.error('   - JWT Token 有效期为1小时')
    }
  }
}

// 主函数
async function main() {
  console.log('⚡ Coze OAuth JWT 认证测试工具')
  console.log('=' * 50)
  
  // 检查必要的依赖
  try {
    require('jsonwebtoken')
    console.log('✅ jsonwebtoken 依赖已安装\n')
  } catch (error) {
    console.error('❌ jsonwebtoken 依赖未安装')
    console.error('请运行: npm install jsonwebtoken @types/jsonwebtoken\n')
    process.exit(1)
  }
  
  await testJWTAuth()
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { testJWTAuth } 