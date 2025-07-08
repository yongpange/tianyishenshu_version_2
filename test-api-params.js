// 测试API参数传递
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

const testPhoneNumber = '13800138000'

async function testUserProfileSave() {
  console.log('📝 测试用户资料保存API...')
  
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
    console.log('📋 用户资料保存结果:', result)
    
    if (result.success) {
      console.log('✅ 用户资料保存成功')
      console.log('👤 用户ID:', result.profile.user_id)
      return result.profile.user_id
    } else {
      console.error('❌ 用户资料保存失败:', result.error)
      return null
    }
  } catch (error) {
    console.error('❌ 用户资料保存API调用失败:', error)
    return null
  }
}

async function testAsyncGenerate(userId) {
  console.log('🚀 测试异步报告生成API...')
  
  try {
    const response = await fetch('http://localhost:3000/api/personality-report/generate-async', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userInfo: testUserInfo,
        userId: userId // 使用UUID格式的user_id
      })
    })
    
    const result = await response.json()
    console.log('📋 异步生成结果:', result)
    
    if (result.success) {
      console.log('✅ 异步报告生成启动成功')
      console.log('🆔 任务ID:', result.taskId)
      return result.taskId
    } else {
      console.error('❌ 异步报告生成失败:', result.error)
      return null
    }
  } catch (error) {
    console.error('❌ 异步生成API调用失败:', error)
    return null
  }
}

async function testStatusCheck(userId, taskId) {
  console.log('🔍 测试状态查询API...')
  
  try {
    const response = await fetch('http://localhost:3000/api/personality-report/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userId,
        taskId: taskId
      })
    })
    
    const result = await response.json()
    console.log('📊 状态查询结果:', result)
    
    if (result.success) {
      console.log('✅ 状态查询成功')
      console.log('📈 状态:', result.status)
      console.log('📊 进度:', result.progress)
      return result
    } else {
      console.error('❌ 状态查询失败:', result.error)
      return null
    }
  } catch (error) {
    console.error('❌ 状态查询API调用失败:', error)
    return null
  }
}

async function testDirectGenerate() {
  console.log('⚡ 测试直接报告生成API...')
  
  try {
    const response = await fetch('http://localhost:3000/api/personality-report/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userInfo: testUserInfo,
        userId: testPhoneNumber // 使用手机号作为userId
      })
    })
    
    const result = await response.json()
    console.log('📋 直接生成结果:', result)
    
    if (result.success) {
      console.log('✅ 直接报告生成成功')
      console.log('📄 报告内容长度:', result.content?.length || 0)
      console.log('🔗 认证方式:', result.authMethod)
      return result
    } else {
      console.error('❌ 直接报告生成失败:', result.error)
      return null
    }
  } catch (error) {
    console.error('❌ 直接生成API调用失败:', error)
    return null
  }
}

async function runAPITests() {
  console.log('🚀 开始API参数传递测试...\n')
  
  // 1. 测试用户资料保存
  const userId = await testUserProfileSave()
  if (!userId) {
    console.log('\n❌ 用户资料保存失败，停止测试')
    return
  }
  
  console.log('\n' + '='.repeat(50))
  
  // 2. 测试异步生成
  const taskId = await testAsyncGenerate(userId)
  if (!taskId) {
    console.log('\n❌ 异步生成失败，尝试直接生成')
  } else {
    console.log('\n' + '='.repeat(50))
    
    // 3. 测试状态查询
    await testStatusCheck(userId, taskId)
  }
  
  console.log('\n' + '='.repeat(50))
  
  // 4. 测试直接生成（作为备选方案）
  await testDirectGenerate()
  
  console.log('\n✅ API参数传递测试完成')
}

// 运行测试
runAPITests().catch(console.error)
