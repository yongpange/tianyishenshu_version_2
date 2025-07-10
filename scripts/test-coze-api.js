// 测试Coze API调用
const { default: fetch } = require('node-fetch')
const jwt = require('jsonwebtoken')
const fs = require('fs')

// 加载环境变量
require('dotenv').config({ path: '.env.local' })

async function testCozeAPI() {
  console.log('🧪 测试Coze API调用\n')
  
  try {
    // 1. 生成JWT Token
    console.log('1️⃣ 生成JWT Token...')
    const privateKey = fs.readFileSync(process.env.COZE_PRIVATE_KEY_FILE, 'utf8')
    const now = Math.floor(Date.now() / 1000)
    
    const payload = {
      iss: process.env.COZE_CLIENT_ID,
      aud: process.env.COZE_API_BASE,
      iat: now,
      exp: now + 3600,
      jti: `${process.env.COZE_CLIENT_ID}_${now}_${Math.random().toString(36).substring(2, 11)}`
    }
    
    const jwtToken = jwt.sign(payload, privateKey, { 
      algorithm: 'RS256',
      header: {
        typ: 'JWT',
        alg: 'RS256',
        kid: process.env.COZE_PUBLIC_KEY_ID
      }
    })
    
    console.log('✅ JWT Token生成成功')
    console.log(`   Token: ${jwtToken.substring(0, 50)}...`)
    
    // 2. 获取OAuth Access Token
    console.log('\n2️⃣ 获取OAuth Access Token...')
    const tokenEndpoint = `https://${process.env.COZE_API_BASE}/api/permission/oauth2/token`
    
    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify({
        duration_seconds: 86399,
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer'
      })
    })
    
    console.log(`   响应状态: ${tokenResponse.status}`)
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.log('❌ OAuth token请求失败:', errorText)
      return
    }
    
    const tokenData = await tokenResponse.json()
    console.log('✅ OAuth Access Token获取成功')
    console.log(`   Access Token: ${tokenData.access_token.substring(0, 20)}...`)
    
    // 3. 测试聊天API
    console.log('\n3️⃣ 测试聊天API...')
    const chatEndpoint = `https://${process.env.COZE_API_BASE}/v3/chat`
    
    const chatResponse = await fetch(chatEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenData.access_token}`
      },
      body: JSON.stringify({
        bot_id: process.env.BOT_ID,
        user_id: 'test_user_' + Date.now(),
        stream: false,
        auto_save_history: true,
        additional_messages: [
          {
            role: 'user',
            content: '你好，这是一个测试消息',
            content_type: 'text'
          }
        ]
      })
    })
    
    console.log(`   响应状态: ${chatResponse.status}`)
    
    if (!chatResponse.ok) {
      const errorText = await chatResponse.text()
      console.log('❌ 聊天API请求失败:', errorText)
      return
    }
    
    const chatData = await chatResponse.json()
    console.log('✅ 聊天API调用成功')
    console.log('   响应数据:', JSON.stringify(chatData, null, 2))
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message)
  }
}

// 运行测试
testCozeAPI()
