const https = require('https')

// 测试配置
const BASE_URL = 'http://localhost:3001'
const TEST_PHONE = '13800138001'
const TEST_INVITE_CODE = '6OR6O6Z9XKVGU72C'

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

// 测试步骤
async function testLogin() {
  console.log('🧪 开始登录流程测试...\n')

  try {
    // 步骤1: 发送验证码
    console.log('📱 步骤1: 发送验证码')
    const smsResponse = await makeRequest(`${BASE_URL}/api/sms/send`, 'POST', {
      phone: TEST_PHONE
    })
    
    console.log('发送验证码响应:', smsResponse.status, smsResponse.data)
    
    if (smsResponse.status !== 200 || !smsResponse.data.success) {
      throw new Error('发送验证码失败')
    }

    // 从响应中提取验证码（模拟环境下）
    const verificationCode = smsResponse.data.data?.code || '123456'
    console.log('✅ 验证码发送成功，验证码:', verificationCode)

    // 步骤2: 验证登录
    console.log('\n🔐 步骤2: 验证登录')
    const loginResponse = await makeRequest(`${BASE_URL}/api/sms/verify`, 'POST', {
      phone: TEST_PHONE,
      code: verificationCode,
      inviteCode: TEST_INVITE_CODE
    })

    console.log('登录验证响应:', loginResponse.status, loginResponse.data)

    if (loginResponse.status === 200 && loginResponse.data.success) {
      console.log('✅ 登录成功!')
      console.log('用户信息:', {
        token: loginResponse.data.data.token,
        phone: loginResponse.data.data.phone,
        userId: loginResponse.data.data.userId,
        permissions: loginResponse.data.data.permissions
      })
    } else {
      console.log('❌ 登录失败:', loginResponse.data.message)
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message)
  }
}

// 运行测试
testLogin()
