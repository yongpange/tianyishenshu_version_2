// 完整的端到端测试
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))

// 测试数据
const testUserInfo = {
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

const testPhoneNumber = '13800138' + String(Date.now()).slice(-3) // 生成唯一手机号

async function testUserProfileSave() {
  console.log('📝 步骤1: 测试用户资料保存...')
  
  try {
    const response = await fetch('http://localhost:3000/api/user-profile/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: testPhoneNumber,
        userInfo: testUserInfo
      })
    })
    
    const result = await response.json()
    console.log('📋 用户资料保存结果:', result.success ? '✅ 成功' : '❌ 失败')
    
    if (result.success) {
      console.log('👤 用户UUID:', result.profile.user_id)
      return result.profile.user_id
    } else {
      console.error('❌ 错误:', result.error)
      return null
    }
  } catch (error) {
    console.error('❌ API调用失败:', error.message)
    return null
  }
}

async function testAsyncGenerate() {
  console.log('\n🚀 步骤2: 测试异步报告生成...')
  
  try {
    const response = await fetch('http://localhost:3000/api/personality-report/generate-async', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userInfo: testUserInfo,
        userId: testPhoneNumber // 使用手机号，API会自动转换为UUID
      })
    })
    
    const result = await response.json()
    console.log('📋 异步生成结果:', result.success ? '✅ 成功' : '❌ 失败')
    
    if (result.success) {
      console.log('🆔 任务ID:', result.taskId)
      return result.taskId
    } else {
      console.error('❌ 错误:', result.error)
      return null
    }
  } catch (error) {
    console.error('❌ API调用失败:', error.message)
    return null
  }
}

async function testStatusPolling(taskId) {
  console.log('\n🔄 步骤3: 测试状态轮询...')
  
  let attempts = 0
  const maxAttempts = 20
  
  while (attempts < maxAttempts) {
    try {
      const response = await fetch('http://localhost:3000/api/personality-report/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testPhoneNumber,
          taskId: taskId
        })
      })
      
      const result = await response.json()
      
      console.log(`📊 轮询 ${attempts + 1}/${maxAttempts}: ${result.status} (${result.progress}%)`)
      
      if (result.status === 'completed') {
        console.log('✅ 报告生成完成!')
        console.log('📄 内容长度:', result.content?.length || 0)
        return { success: true, content: result.content }
      } else if (result.status === 'failed') {
        console.error('❌ 报告生成失败:', result.error)
        return { success: false, error: result.error }
      }
      
      // 等待3秒后继续轮询
      await new Promise(resolve => setTimeout(resolve, 3000))
      attempts++
      
    } catch (error) {
      console.error('❌ 状态查询失败:', error.message)
      attempts++
    }
  }
  
  console.warn('⚠️ 轮询超时')
  return { success: false, error: '轮询超时' }
}

async function testGetReport() {
  console.log('\n📖 步骤4: 测试获取报告...')
  
  try {
    const response = await fetch('http://localhost:3000/api/personality-report/get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testPhoneNumber
      })
    })
    
    const result = await response.json()
    console.log('📋 获取报告结果:', result.success ? '✅ 成功' : '❌ 失败')
    
    if (result.success && result.report) {
      console.log('📄 报告内容长度:', result.report.content?.length || 0)
      console.log('📅 生成时间:', result.report.generatedAt)
      return true
    } else {
      console.error('❌ 错误:', result.error)
      return false
    }
  } catch (error) {
    console.error('❌ API调用失败:', error.message)
    return false
  }
}

async function runCompleteTest() {
  console.log('🚀 开始完整流程测试...')
  console.log('📱 测试手机号:', testPhoneNumber)
  console.log('👤 测试用户信息:', testUserInfo)
  console.log('='.repeat(60))
  
  // 步骤1: 保存用户资料
  const userId = await testUserProfileSave()
  if (!userId) {
    console.log('\n❌ 用户资料保存失败，停止测试')
    return
  }
  
  // 步骤2: 启动异步生成
  const taskId = await testAsyncGenerate()
  if (!taskId) {
    console.log('\n❌ 异步生成启动失败，停止测试')
    return
  }
  
  // 步骤3: 轮询状态
  const pollingResult = await testStatusPolling(taskId)
  if (!pollingResult.success) {
    console.log('\n❌ 状态轮询失败:', pollingResult.error)
    return
  }
  
  // 步骤4: 获取报告
  const getResult = await testGetReport()
  if (!getResult) {
    console.log('\n❌ 获取报告失败')
    return
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('🎉 完整流程测试成功!')
  console.log('✅ 所有步骤都正常工作')
  console.log('📱 测试手机号:', testPhoneNumber)
  console.log('🆔 任务ID:', taskId)
}

// 运行测试
runCompleteTest().catch(console.error)
