import { UserInfo } from '@/lib/coze-client'

// 从localStorage获取用户手机号
export function getUserPhoneNumber(): string | null {
  if (typeof window === 'undefined') return null
  
  try {
    // 从登录信息中获取手机号
    const loginData = localStorage.getItem('loginData')
    if (loginData) {
      const parsed = JSON.parse(loginData)
      return parsed.phoneNumber || null
    }
    
    // 备用方案：从用户数据中获取
    const userData = localStorage.getItem('userData')
    if (userData) {
      const parsed = JSON.parse(userData)
      return parsed.phoneNumber || null
    }
    
    return null
  } catch (error) {
    console.error('获取用户手机号失败:', error)
    return null
  }
}

// 保存用户手机号到localStorage
export function saveUserPhoneNumber(phoneNumber: string): void {
  if (typeof window === 'undefined') return
  
  try {
    const loginData = {
      phoneNumber,
      timestamp: Date.now()
    }
    localStorage.setItem('loginData', JSON.stringify(loginData))
  } catch (error) {
    console.error('保存用户手机号失败:', error)
  }
}

// 格式化用户信息为显示文本
export function formatUserInfoDisplay(userInfo: UserInfo): string {
  const { year, month, day, hour, minute, area } = userInfo
  const location = `${area.province}${area.city}${area.district}`
  return `${year}年${month}月${day}日${hour}时${minute}分，${location}`
}

// 简单的hash函数（浏览器兼容）
function simpleHash(str: string): string {
  let hash = 0
  if (str.length === 0) return hash.toString()

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }

  return Math.abs(hash).toString(36)
}

// 计算用户信息的hash值
export function calculateUserDataHash(userInfo: UserInfo): string {
  const hashData = {
    year: userInfo.year,
    month: userInfo.month,
    day: userInfo.day,
    hour: userInfo.hour,
    minute: userInfo.minute,
    gender: userInfo.gender,
    province: userInfo.area.province,
    city: userInfo.area.city,
    district: userInfo.area.district
  }

  const dataString = JSON.stringify(hashData)
  return simpleHash(dataString)
}

// 生成报告ID
export function generateReportId(): string {
  return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 验证用户信息完整性
export function validateUserInfo(userInfo: any): userInfo is UserInfo {
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