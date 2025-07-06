const http = require('http')
require('dotenv').config({ path: '.env.local' })

// 测试OAuth 2.0集成
async function testOAuthIntegration() {
  console.log('🔐 测试OAuth 2.0集成...\n')

  // 检查环境变量配置
  console.log('📋 环境变量检查:')
  const requiredVars = {
    'COZE_CLIENT_ID': process.env.COZE_CLIENT_ID,
    'COZE_PUBLIC_KEY_ID': process.env.COZE_PUBLIC_KEY_ID,
    'COZE_PRIVATE_KEY_FILE': process.env.COZE_PRIVATE_KEY_FILE,
    'COZE_API_BASE': process.env.COZE_API_BASE,
    'NEXT_PUBLIC_DEFAULT_CHAT_BOT_ID': process.env.NEXT_PUBLIC_DEFAULT_CHAT_BOT_ID
  }

  let allConfigured = true
  for (const [key, value] of Object.entries(requiredVars)) {
    const status = value ? '✅ 已设置' : '❌ 未设置'
    console.log(`   ${key}: ${status}`)
    if (!value) allConfigured = false
  }

  if (!allConfigured) {
    console.log('\n❌ 部分环境变量未设置，请检查 .env.local 文件')
    return
  }

  console.log('\n✅ 环境变量配置正确，开始测试...\n')

  // 测试聊天API
  console.log('💬 测试聊天API (OAuth + 动态BOT_ID)')
  
  const chatData = JSON.stringify({
    message: '你好，请简单介绍一下自己',
    userInfo: {
      phone: '13800138000'
    },
    botId: '7445193658986659842', // 动态传递BOT_ID
    userId: '13800138000'
  })

  try {
    const chatResponse = await makeRequest('/api/coze/chat', 'POST', chatData)
    console.log('✅ 聊天API响应:', {
      success: chatResponse.success,
      authMethod: chatResponse.authMethod,
      hasResponse: !!chatResponse.response,
      responseLength: chatResponse.response?.length || 0
    })
  } catch (error) {
    console.error('❌ 聊天API测试失败:', error.message)
  }

  console.log('\n📊 测试性格报告API (OAuth + 动态BOT_ID)')
  
  const reportData = JSON.stringify({
    userInfo: {
      year: 1990,
      month: 5,
      day: 15,
      hour: 14,
      minute: 30,
      gender: '男',
      area: {
        province: '北京市',
        city: '北京市',
        district: '朝阳区'
      }
    },
    userId: '13800138000',
    botId: '7445193658986659842' // 动态传递BOT_ID
  })

  try {
    const reportResponse = await makeRequest('/api/personality-report/generate', 'POST', reportData)
    console.log('✅ 性格报告API响应:', {
      success: reportResponse.success,
      authMethod: reportResponse.authMethod,
      hasContent: !!reportResponse.content,
      contentLength: reportResponse.content?.length || 0
    })
  } catch (error) {
    console.error('❌ 性格报告API测试失败:', error.message)
  }
}

// HTTP请求工具函数
function makeRequest(path, method, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }

    const req = http.request(options, (res) => {
      let responseData = ''

      res.on('data', (chunk) => {
        responseData += chunk
      })

      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`))
            return
          }
          const parsed = JSON.parse(responseData)
          resolve(parsed)
        } catch (error) {
          reject(new Error(`解析响应失败: ${error.message}, 原始响应: ${responseData}`))
        }
      })
    })

    req.on('error', (error) => {
      reject(new Error(`网络请求失败: ${error.message}`))
    })

    req.setTimeout(30000, () => {
      req.destroy()
      reject(new Error('请求超时'))
    })

    req.write(data)
    req.end()
  })
}

// 运行测试
if (require.main === module) {
  testOAuthIntegration().catch(console.error)
}

module.exports = { testOAuthIntegration }
