require('dotenv').config()
const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')
const { CozeAPI } = require('@coze/api')

/**
 * OAuth Token 诊断脚本
 * 用于排查 4100 "authentication is invalid" 错误
 */
async function diagnoseOAuthToken() {
  console.log('🔍 === OAuth Token 诊断开始 ===\n')

  try {
    // 1. 检查环境变量配置
    console.log('📋 检查环境变量配置...')
    const clientId = process.env.COZE_CLIENT_ID
    const publicKeyId = process.env.COZE_PUBLIC_KEY_ID
    const privateKeyFile = process.env.COZE_PRIVATE_KEY_FILE
    const apiBase = process.env.COZE_API_BASE || 'api.coze.cn'
    const botId = process.env.COZE_BOT_ID || process.env.CHAT_BOT_ID

    console.log('   COZE_CLIENT_ID:', clientId ? '✅ 已配置' : '❌ 缺失')
    console.log('   COZE_PUBLIC_KEY_ID:', publicKeyId ? '✅ 已配置' : '❌ 缺失')
    console.log('   COZE_PRIVATE_KEY_FILE:', privateKeyFile ? '✅ 已配置' : '❌ 缺失')
    console.log('   COZE_API_BASE:', apiBase)
    console.log('   BOT_ID:', botId ? '✅ 已配置' : '❌ 缺失')

    if (!clientId || !publicKeyId || !privateKeyFile) {
      throw new Error('缺少必要的环境变量配置')
    }

    // 2. 检查私钥文件
    console.log('\n📂 检查私钥文件...')
    const privateKeyPath = path.resolve(process.cwd(), privateKeyFile)
    console.log('   私钥文件路径:', privateKeyPath)
    
    if (!fs.existsSync(privateKeyPath)) {
      throw new Error(`私钥文件不存在: ${privateKeyPath}`)
    }
    
    const privateKey = fs.readFileSync(privateKeyPath, 'utf8')
    console.log('   私钥文件大小:', privateKey.length, '字符')
    console.log('   私钥格式检查:')
    console.log('     包含 BEGIN:', privateKey.includes('-----BEGIN'))
    console.log('     包含 END:', privateKey.includes('-----END'))
    console.log('     包含 PRIVATE KEY:', privateKey.includes('PRIVATE KEY'))

    // 3. 创建 JWT Token
    console.log('\n🔐 创建 JWT Token...')
    const now = Math.floor(Date.now() / 1000)
    const payload = {
      iss: clientId,
      aud: apiBase,
      iat: now,
      exp: now + 3600,
      jti: `${clientId}_${now}_diagnosis`
    }

    console.log('   JWT Payload:', JSON.stringify(payload, null, 2))

    const jwtToken = jwt.sign(payload, privateKey, {
      algorithm: 'RS256',
      keyid: publicKeyId,
    })

    console.log('   ✅ JWT Token 创建成功')
    console.log('   Token 长度:', jwtToken.length)
    console.log('   Token 前缀:', jwtToken.substring(0, 50) + '...')

    // 4. 获取 OAuth Access Token
    console.log('\n🔄 获取 OAuth Access Token...')
    
    const tokenResponse = await fetch(`https://${apiBase}/api/permission/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        duration_seconds: 86400,
      }),
    })

    console.log('   OAuth 响应状态:', tokenResponse.status, tokenResponse.statusText)
    console.log('   响应头:', Object.fromEntries(tokenResponse.headers.entries()))

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('   ❌ OAuth 请求失败:', errorText)
      throw new Error(`OAuth 请求失败: ${tokenResponse.status} ${errorText}`)
    }

    const tokenData = await tokenResponse.json()
    console.log('   ✅ OAuth Access Token 获取成功')
    console.log('   Access Token 长度:', tokenData.access_token.length)
    console.log('   Token 类型:', tokenData.token_type)
    console.log('   过期时间戳:', tokenData.expires_in)
    console.log('   过期时间:', new Date(tokenData.expires_in * 1000).toISOString())

    // 5. 测试 API 调用权限
    console.log('\n🧪 测试 API 调用权限...')
    
    const accessToken = tokenData.access_token
    const testAPIs = [
      {
        name: '工作空间列表',
        url: `https://${apiBase}/v1/workspaces`,
        method: 'GET'
      },
      {
        name: '机器人列表', 
        url: `https://${apiBase}/v1/bots`,
        method: 'GET'
      }
    ]

    for (const api of testAPIs) {
      try {
        console.log(`\n   测试 ${api.name} API...`)
        const testResponse = await fetch(api.url, {
          method: api.method,
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })

        console.log(`     状态码: ${testResponse.status}`)
        
        if (testResponse.status === 200) {
          const data = await testResponse.json()
          console.log(`     ✅ ${api.name} API 调用成功`)
          if (api.name === '机器人列表' && data.data) {
            console.log(`     机器人数量: ${data.data.length}`)
            if (data.data.length > 0) {
              const firstBot = data.data[0]
              console.log(`     第一个机器人ID: ${firstBot.bot_id}`)
              console.log(`     第一个机器人名称: ${firstBot.name}`)
            }
          }
        } else if (testResponse.status === 401 || testResponse.status === 403) {
          const errorData = await testResponse.text()
          console.log(`     ❌ ${api.name} API 认证失败 (${testResponse.status}):`, errorData)
        } else if (testResponse.status === 4100) {
          console.log(`     ❌ ${api.name} API 返回 4100 错误`)
          const errorData = await testResponse.text()
          console.log(`     错误详情:`, errorData)
        } else {
          console.log(`     ⚠️ ${api.name} API 返回状态码: ${testResponse.status}`)
        }
      } catch (apiError) {
        console.error(`     ❌ ${api.name} API 调用异常:`, apiError.message)
      }
    }

    // 6. 测试具体的聊天API
    if (botId) {
      console.log('\n🤖 测试聊天 API...')
      
      try {
        const coze = new CozeAPI({
          token: accessToken,
          baseURL: `https://${apiBase}/`
        })

        console.log('   使用 Bot ID:', botId)
        console.log('   API Base URL:', `https://${apiBase}/`)

        // 尝试一个简单的聊天请求
        const chatResponse = await coze.chat.createAndPoll({
          bot_id: botId,
          user_id: 'test_user_diagnosis',
          additional_messages: [
            {
              role: 'user',
              content: '你好',
              content_type: 'text',
            },
          ],
        })

        console.log('   ✅ 聊天 API 调用成功')
        console.log('   对话状态:', chatResponse.chat.status)
        console.log('   对话ID:', chatResponse.chat.conversation_id)
        
        if (chatResponse.messages && chatResponse.messages.length > 0) {
          const lastMessage = chatResponse.messages[chatResponse.messages.length - 1]
          console.log('   AI 回复预览:', lastMessage.content?.substring(0, 100) + '...')
        }

      } catch (chatError) {
        console.error('   ❌ 聊天 API 调用失败:')
        console.error('     错误类型:', chatError.constructor.name)
        console.error('     错误消息:', chatError.message)
        console.error('     错误代码:', chatError.code || '无')
        
        if (chatError.code === 4100) {
          console.log('\n💡 发现 4100 错误！可能的原因：')
          console.log('   1. Bot ID 无权限访问')
          console.log('   2. OAuth token 缺少必要的作用域')
          console.log('   3. Bot 未正确发布或配置')
          console.log('   4. API 版本不匹配')
        }
      }
    }

    // 7. PAT Token 对比测试
    const patToken = process.env.COZE_API_TOKEN
    if (patToken) {
      console.log('\n🔄 PAT Token 对比测试...')
      
      try {
        const patCoze = new CozeAPI({
          token: patToken,
          baseURL: `https://${apiBase}/`
        })

        const patChatResponse = await patCoze.chat.createAndPoll({
          bot_id: botId,
          user_id: 'test_user_pat',
          additional_messages: [
            {
              role: 'user',
              content: '你好（PAT测试）',
              content_type: 'text',
            },
          ],
        })

        console.log('   ✅ PAT Token 聊天成功')
        console.log('   对比结果: OAuth token 可能权限不足')
        
      } catch (patError) {
        console.log('   ❌ PAT Token 也失败:', patError.message)
        console.log('   对比结果: 可能是 Bot ID 或网络问题')
      }
    }

  } catch (error) {
    console.error('\n❌ 诊断过程出错:', error.message)
    console.error('错误堆栈:', error.stack)
  }

  console.log('\n🔍 === OAuth Token 诊断结束 ===')
}

// 运行诊断
if (require.main === module) {
  diagnoseOAuthToken().catch(console.error)
}

module.exports = { diagnoseOAuthToken } 