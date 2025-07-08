import { UserInfo } from '@/lib/coze-client'
import { PersonalityReport, storageManager } from '@/lib/storage-adapter'

// 生成步骤枚举
export enum GenerationStep {
  ANALYZING = 'analyzing',
  GENERATING = 'generating', 
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// 步骤消息映射
export const stepMessages = {
  analyzing: "正在分析出生信息...",
  generating: "正在生成性格报告...",
  completed: "报告生成完成",
  failed: "生成失败，请重试"
}

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

// 检查是否需要重新生成报告
export async function checkIfRegenerationNeeded(userInfo: UserInfo, userId: string): Promise<boolean> {
  try {
    const existingReport = await storageManager.getPersonalityReport(userId)
    
    if (!existingReport) {
      return true // 没有报告，需要生成
    }
    
    const currentHash = calculateUserDataHash(userInfo)
    
    if (existingReport.userDataHash !== currentHash) {
      return true // 用户信息已变更，需要重新生成
    }
    
    return false // 不需要重新生成
  } catch (error) {
    console.error('检查重新生成需求失败:', error)
    return true // 出错时默认重新生成
  }
}

// 格式化用户信息为显示文本
export function formatUserInfoDisplay(userInfo: UserInfo): string {
  const { year, month, day, hour, minute, area } = userInfo
  const location = `${area.province}${area.city}${area.district}`
  return `${year}年${month}月${day}日${hour}时${minute}分，${location}`
}

// 生成报告ID
export function generateReportId(): string {
  return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 创建性格报告对象
export function createPersonalityReport(
  userId: string,
  content: string,
  userInfo: UserInfo,
  conversationId?: string
): PersonalityReport {
  return {
    id: generateReportId(),
    userId,
    content,
    generatedAt: new Date(),
    userDataHash: calculateUserDataHash(userInfo),
    cozeConversationId: conversationId
  }
}

// 获取性格报告
export async function getPersonalityReport(userId: string): Promise<PersonalityReport | null> {
  try {
    return await storageManager.getPersonalityReport(userId)
  } catch (error) {
    console.error('获取性格报告失败:', error)
    return null
  }
}

// 保存性格报告
export async function savePersonalityReport(report: PersonalityReport): Promise<void> {
  try {
    await storageManager.savePersonalityReport(report.userId, report)
  } catch (error) {
    console.error('保存性格报告失败:', error)
    throw error
  }
}

// 清除性格报告
export async function clearPersonalityReport(userId: string): Promise<void> {
  try {
    await storageManager.clearPersonalityReport(userId)
  } catch (error) {
    console.error('清除性格报告失败:', error)
    throw error
  }
}

// 验证用户信息完整性
export function validateUserInfo(userInfo: any): userInfo is UserInfo {
  return (
    userInfo &&
    typeof userInfo.name === 'string' &&
    userInfo.name.trim().length > 0 &&
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
