const http = require('http')

// 测试性格报告生成 API
async function testPersonalityAPI() {
  console.log('🧪 测试性格报告生成 API...\n')

  const testUserInfo = {
    name: '测试用户',
    gender: '男',
    year: 1990,
    month: 5,
    day: 15,
    hour: 14,
    minute: 30,
    area: {
      province: '北京市',
      city: '北京市',
      district: '朝阳区'
    }
  }

  const postData = JSON.stringify({
    userInfo: testUserInfo,
    userId: '13800138000'
  })

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/personality-report/generate',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  }

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = ''
      
      console.log('📡 响应状态:', res.statusCode)
      console.log('📋 响应头:', res.headers)

      res.on('data', (chunk) => {
        body += chunk
      })

      res.on('end', () => {
        try {
          const result = JSON.parse(body)
          console.log('\n📊 API 响应:')
          console.log('- 成功:', result.success)
          console.log('- 错误:', result.error || '无')
          console.log('- 报告长度:', result.report?.length || 0)
          console.log('- 对话ID:', result.conversationId || '无')
          
          if (result.report) {
            console.log('\n📄 报告预览:')
            console.log(result.report.substring(0, 300) + '...')
          }
          
          resolve(result)
        } catch (error) {
          console.error('❌ 解析响应失败:', error)
          console.log('📄 原始响应:', body)
          reject(error)
        }
      })
    })

    req.on('error', (error) => {
      console.error('❌ 请求失败:', error)
      reject(error)
    })

    req.write(postData)
    req.end()
  })
}

// 运行测试
testPersonalityAPI()
  .then(() => {
    console.log('\n✅ 测试完成')
  })
  .catch((error) => {
    console.error('\n❌ 测试失败:', error)
  })
