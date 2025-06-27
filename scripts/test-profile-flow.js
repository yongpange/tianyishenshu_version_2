const https = require('https')

// 测试配置
const BASE_URL = 'http://localhost:3001'
const TEST_PHONE = '13800138002'

// HTTP 请求工具
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    }

    const req = require('http').request(options, (res) => {
      let body = ''
      res.on('data', (chunk) => {
        body += chunk
      })
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body)
          resolve({ status: res.statusCode, data: jsonBody })
        } catch (e) {
          resolve({ status: res.statusCode, data: body })
        }
      })
    })

    req.on('error', (err) => {
      reject(err)
    })

    if (data) {
      req.write(JSON.stringify(data))
    }

    req.end()
  })
}

// 测试完整流程
async function testProfileFlow() {
  console.log('🧪 开始测试 Profile 页面数据流...\n')

  try {
    // 步骤1: 模拟登录
    console.log('📱 步骤1: 发送验证码')
    const smsResponse = await makeRequest(`${BASE_URL}/api/sms/send`, 'POST', {
      phone: TEST_PHONE
    })
    
    if (smsResponse.status !== 200) {
      throw new Error('发送验证码失败')
    }

    const verificationCode = smsResponse.data.data?.code || smsResponse.data.code || '123456'
    console.log('✅ 验证码:', verificationCode)
    console.log('📋 SMS 响应详情:', smsResponse.data)

    console.log('\n🔐 步骤2: 验证登录')
    const loginResponse = await makeRequest(`${BASE_URL}/api/sms/verify`, 'POST', {
      phone: TEST_PHONE,
      code: verificationCode
    })

    if (loginResponse.status !== 200) {
      throw new Error('登录失败')
    }
    console.log('✅ 登录成功')

    // 步骤2: 测试性格报告生成
    console.log('\n📝 步骤3: 测试性格报告生成')
    
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

    const reportResponse = await makeRequest(`${BASE_URL}/api/personality-report/generate`, 'POST', {
      userInfo: testUserInfo,
      userId: TEST_PHONE
    })

    console.log('📊 性格报告生成响应:', {
      status: reportResponse.status,
      success: reportResponse.data.success,
      hasReport: !!reportResponse.data.report,
      reportLength: reportResponse.data.report?.length || 0,
      conversationId: reportResponse.data.conversationId
    })

    if (reportResponse.data.success && reportResponse.data.report) {
      console.log('✅ 性格报告生成成功!')
      console.log('📄 报告预览:', reportResponse.data.report.substring(0, 200) + '...')
    } else {
      console.log('❌ 性格报告生成失败:', reportResponse.data.error)
    }

    // 步骤3: 测试报告存储和读取
    console.log('\n💾 步骤4: 测试报告存储和读取')
    
    // 这里可以添加从 Supabase 读取报告的测试
    console.log('📋 存储测试需要在浏览器环境中进行')

  } catch (error) {
    console.error('❌ 测试失败:', error.message)
  }
}

// 运行测试
testProfileFlow()
