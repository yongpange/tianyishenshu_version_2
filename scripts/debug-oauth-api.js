// 直接使用 HTTP 请求测试 API
const https = require('https')
require('dotenv').config({ path: '.env.local' })

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = ''

      res.on('data', (chunk) => {
        responseData += chunk
      })

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData)
          resolve({ statusCode: res.statusCode, data: parsed })
        } catch (error) {
          reject(new Error(`解析响应失败: ${error.message}, 原始响应: ${responseData}`))
        }
      })
    })

    req.on('error', (error) => {
      reject(new Error(`网络请求失败: ${error.message}`))
    })

    if (postData) {
      req.write(postData)
    }
    req.end()
  })
}

async function debugOAuthAPI() {
  console.log('🔍 调试 OAuth API 调用...\n')

  try {
    // 测试数据
    const testUserInfo = {
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
    }

    const testRequest = {
      botId: '7519894586509590568',
      userInfo: testUserInfo,
      userId: 'test_user_123'
    }

    console.log('📊 测试性格报告生成...')
    console.log('请求参数:', JSON.stringify(testRequest, null, 2))

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/personality-report/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }

    const postData = JSON.stringify(testRequest)
    const result = await makeRequest(options, postData)

    console.log('\n✅ API 调用结果:')
    console.log('状态码:', result.statusCode)
    console.log('响应数据:', JSON.stringify(result.data, null, 2))

  } catch (error) {
    console.error('❌ 调试失败:', error)
    console.error('错误详情:', error.message)
  }
}

// 运行调试
debugOAuthAPI().catch(console.error)
