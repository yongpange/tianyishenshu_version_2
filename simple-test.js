// 简单的API测试
const https = require('https')
const http = require('http')

function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data)
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }
    
    const req = http.request(options, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data)
          resolve(result)
        } catch (error) {
          reject(new Error('Invalid JSON response'))
        }
      })
    })
    
    req.on('error', (error) => {
      reject(error)
    })
    
    req.write(postData)
    req.end()
  })
}

async function testUserProfileSave() {
  console.log('📝 测试用户资料保存...')
  
  const testData = {
    phoneNumber: '13800138999',
    userInfo: {
      name: '测试用户',
      gender: 'male',
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
  }
  
  try {
    const result = await makeRequest('/api/user-profile/save', testData)
    console.log('📋 结果:', result.success ? '✅ 成功' : '❌ 失败')
    
    if (result.success) {
      console.log('👤 用户UUID:', result.profile.user_id)
      return result.profile.user_id
    } else {
      console.error('❌ 错误:', result.error)
      return null
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message)
    return null
  }
}

async function testAsyncGenerate() {
  console.log('\n🚀 测试异步报告生成...')
  
  const testData = {
    userInfo: {
      name: '测试用户',
      gender: 'male',
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
    },
    userId: '13800138999'
  }
  
  try {
    const result = await makeRequest('/api/personality-report/generate-async', testData)
    console.log('📋 结果:', result.success ? '✅ 成功' : '❌ 失败')
    
    if (result.success) {
      console.log('🆔 任务ID:', result.taskId)
      return result.taskId
    } else {
      console.error('❌ 错误:', result.error)
      return null
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message)
    return null
  }
}

async function testStatusCheck(taskId) {
  console.log('\n🔍 测试状态查询...')
  
  const testData = {
    userId: '13800138999',
    taskId: taskId
  }
  
  try {
    const result = await makeRequest('/api/personality-report/status', testData)
    console.log('📋 结果:', result.success ? '✅ 成功' : '❌ 失败')
    
    if (result.success) {
      console.log('📊 状态:', result.status)
      console.log('📈 进度:', result.progress + '%')
      return result
    } else {
      console.error('❌ 错误:', result.error)
      return null
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message)
    return null
  }
}

async function runSimpleTest() {
  console.log('🚀 开始简单API测试...\n')
  
  // 测试1: 用户资料保存
  const userId = await testUserProfileSave()
  if (!userId) {
    console.log('\n❌ 用户资料保存失败')
    return
  }
  
  // 测试2: 异步生成
  const taskId = await testAsyncGenerate()
  if (!taskId) {
    console.log('\n❌ 异步生成失败')
    return
  }
  
  // 测试3: 状态查询
  const status = await testStatusCheck(taskId)
  if (!status) {
    console.log('\n❌ 状态查询失败')
    return
  }
  
  console.log('\n✅ 基本API测试完成')
  console.log('🆔 任务ID:', taskId)
  console.log('📊 当前状态:', status.status)
}

// 运行测试
runSimpleTest().catch(console.error)
