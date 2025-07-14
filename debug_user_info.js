// 调试用户信息格式的工具
// 在浏览器控制台中运行此代码来检查用户信息

console.log('🔍 开始检查用户信息格式...')

// 检查 localStorage 中的用户信息
const activeUser = localStorage.getItem('activeUser')
const userInfo = localStorage.getItem('userInfo')

console.log('📱 激活用户信息 (activeUser):', activeUser ? JSON.parse(activeUser) : null)
console.log('📱 用户信息 (userInfo):', userInfo ? JSON.parse(userInfo) : null)

// 验证函数（复制自代码）
function validateUserInfo(userInfo) {
  return (
    userInfo &&
    typeof userInfo.year === 'number' &&
    typeof userInfo.month === 'number' &&
    typeof userInfo.day === 'number' &&
    typeof userInfo.hour === 'number' &&
    typeof userInfo.minute === 'number' &&
    typeof userInfo.gender === 'string' &&
    userInfo.area &&
    typeof userInfo.area.province === 'string' &&
    typeof userInfo.area.city === 'string' &&
    typeof userInfo.area.district === 'string'
  )
}

// 转换函数
function convertActiveUserToUserInfo(activeUser) {
  if (!activeUser) return null
  
  // 如果已经是标准格式，直接返回
  if (activeUser.area && typeof activeUser.area === 'object') {
    return activeUser
  }
  
  // 转换格式
  return {
    year: activeUser.year,
    month: activeUser.month,
    day: activeUser.day,
    hour: activeUser.hour,
    minute: activeUser.minute,
    gender: activeUser.gender,
    nickname: activeUser.name || activeUser.nickname,
    area: {
      province: activeUser.area_province || '',
      city: activeUser.area_city || '',
      district: activeUser.area_district || ''
    }
  }
}

// 测试验证
if (activeUser) {
  const parsedActiveUser = JSON.parse(activeUser)
  console.log('✅ 原始激活用户验证结果:', validateUserInfo(parsedActiveUser))
  
  const convertedUser = convertActiveUserToUserInfo(parsedActiveUser)
  console.log('🔄 转换后的用户信息:', convertedUser)
  console.log('✅ 转换后验证结果:', validateUserInfo(convertedUser))
}

if (userInfo) {
  const parsedUserInfo = JSON.parse(userInfo)
  console.log('✅ localStorage用户信息验证结果:', validateUserInfo(parsedUserInfo))
}

console.log('🔍 检查完成！')
