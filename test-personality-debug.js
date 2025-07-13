// 测试子账户性格报告生成
const testUserInfo = {
  name: "测试子用户",
  gender: "male",
  year: 2000,
  month: 1,
  day: 1,
  hour: 12,
  minute: 0,
  area: {
    province: "北京市",
    city: "北京市",
    district: "朝阳区"
  }
}

// 模拟一个user_profiles.id
const testUserProfileId = "1fd03250-8957-4958-acb5-1f9c12372661"

async function testGenerateAsync() {
  console.log('🧪 测试异步生成接口...')
  
  try {
    const response = await fetch('http://localhost:3000/api/personality-report/generate-async', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userInfo: testUserInfo,
        userId: testUserProfileId,
        isUserProfileId: true // 明确标识为子账户
      })
    })

    const result = await response.json()
    console.log('📋 异步生成结果:', result)
    
    if (result.success) {
      console.log('✅ 异步生成成功，任务ID:', result.taskId)
      
      // 等待几秒后检查状态
      setTimeout(() => {
        checkStatus(testUserProfileId, result.taskId)
      }, 3000)
    } else {
      console.error('❌ 异步生成失败:', result.error)
    }
  } catch (error) {
    console.error('❌ 请求失败:', error)
  }
}

async function checkStatus(userId, taskId) {
  console.log('🔍 检查报告状态...')
  
  try {
    const response = await fetch('http://localhost:3000/api/personality-report/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        taskId: taskId,
        isUserProfileId: true
      })
    })

    const result = await response.json()
    console.log('📊 状态检查结果:', result)
  } catch (error) {
    console.error('❌ 状态检查失败:', error)
  }
}

async function testDirectGenerate() {
  console.log('🧪 测试直接生成接口...')
  
  try {
    const response = await fetch('http://localhost:3000/api/personality-report/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userInfo: testUserInfo,
        userId: testUserProfileId,
        isUserProfileId: true // 明确标识为子账户
      })
    })

    const result = await response.json()
    console.log('📋 直接生成结果:', result)
  } catch (error) {
    console.error('❌ 直接生成失败:', error)
  }
}

// 运行测试
console.log('🚀 开始测试子账户报告生成...')
console.log('📋 测试用户信息:', testUserInfo)
console.log('📋 测试用户ID:', testUserProfileId)

// 先测试直接生成
testDirectGenerate()

// 延迟测试异步生成
setTimeout(() => {
  testGenerateAsync()
}, 2000) 