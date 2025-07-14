// 测试状态API的工具
console.log('🔍 测试状态API...')

// 获取用户信息
const activeUser = localStorage.getItem('activeUser')
if (!activeUser) {
  console.error('❌ 未找到用户信息')
} else {
  const userInfo = JSON.parse(activeUser)
  console.log('📱 用户信息:', userInfo)
  
  // 测试婚恋感情状态API
  async function testMarriageStatusAPI() {
    console.log('💕 测试婚恋感情状态API...')
    try {
      const response = await fetch('/api/marriage-report/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userInfo.id,
          isUserProfileId: true,
          taskId: 'test_task_123' // 测试任务ID
        })
      })
      
      console.log('📊 响应状态码:', response.status)
      const result = await response.json()
      console.log('💕 婚恋感情状态API响应:', result)
      
      if (!result.success) {
        console.error('❌ 婚恋感情状态API错误:', result.error)
      }
    } catch (error) {
      console.error('❌ 婚恋感情状态API请求失败:', error)
    }
  }
  
  // 测试身体健康状态API
  async function testHealthStatusAPI() {
    console.log('🏥 测试身体健康状态API...')
    try {
      const response = await fetch('/api/health-report/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userInfo.id,
          isUserProfileId: true,
          taskId: 'test_task_456' // 测试任务ID
        })
      })
      
      console.log('📊 响应状态码:', response.status)
      const result = await response.json()
      console.log('🏥 身体健康状态API响应:', result)
      
      if (!result.success) {
        console.error('❌ 身体健康状态API错误:', result.error)
      }
    } catch (error) {
      console.error('❌ 身体健康状态API请求失败:', error)
    }
  }
  
  // 执行测试
  testMarriageStatusAPI()
  testHealthStatusAPI()
}

console.log('🔍 状态API测试完成！')
