// 在浏览器控制台中运行此代码来测试API
console.log('🔍 开始测试新模块API...')

// 获取用户信息
const activeUser = localStorage.getItem('activeUser')
if (!activeUser) {
  console.error('❌ 未找到用户信息')
} else {
  const userInfo = JSON.parse(activeUser)
  console.log('📱 用户信息:', userInfo)
  
  // 转换用户信息格式
  const convertedUserInfo = {
    year: userInfo.year,
    month: userInfo.month,
    day: userInfo.day,
    hour: userInfo.hour,
    minute: userInfo.minute,
    gender: userInfo.gender,
    nickname: userInfo.name || userInfo.nickname,
    area: {
      province: userInfo.area_province || '',
      city: userInfo.area_city || '',
      district: userInfo.area_district || ''
    }
  }
  
  console.log('🔄 转换后的用户信息:', convertedUserInfo)
  
  // 测试婚恋感情API
  async function testMarriageAPI() {
    console.log('💕 测试婚恋感情API...')
    try {
      const response = await fetch('/api/marriage-report/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInfo: convertedUserInfo,
          userId: userInfo.id,
          isUserProfileId: true
        })
      })
      
      const result = await response.json()
      console.log('💕 婚恋感情API响应:', result)
      
      if (!result.success) {
        console.error('❌ 婚恋感情API错误:', result.error)
      }
    } catch (error) {
      console.error('❌ 婚恋感情API请求失败:', error)
    }
  }
  
  // 测试身体健康API
  async function testHealthAPI() {
    console.log('🏥 测试身体健康API...')
    try {
      const response = await fetch('/api/health-report/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInfo: convertedUserInfo,
          userId: userInfo.id,
          isUserProfileId: true
        })
      })
      
      const result = await response.json()
      console.log('🏥 身体健康API响应:', result)
      
      if (!result.success) {
        console.error('❌ 身体健康API错误:', result.error)
      }
    } catch (error) {
      console.error('❌ 身体健康API请求失败:', error)
    }
  }
  
  // 执行测试
  testMarriageAPI()
  testHealthAPI()
}

console.log('🔍 测试完成！请查看上面的结果。')
