// 全局短信验证码存储
// 使用globalThis确保在开发模式下不会因为热重载而丢失数据

interface SmsRecord {
  code: string
  timestamp: number
  attempts: number
}

declare global {
  var smsCodeStore: Map<string, SmsRecord> | undefined
}

// 确保在全局范围内只有一个实例
const getSmsCodeStore = (): Map<string, SmsRecord> => {
  if (!globalThis.smsCodeStore) {
    globalThis.smsCodeStore = new Map<string, SmsRecord>()
  }
  return globalThis.smsCodeStore
}

export const smsCodeStore = getSmsCodeStore()

// 清理过期验证码的工具函数
export const cleanExpiredCodes = () => {
  const now = Date.now()
  const expiredKeys: string[] = []
  
  smsCodeStore.forEach((record, phone) => {
    if (now - record.timestamp > 5 * 60 * 1000) {
      expiredKeys.push(phone)
    }
  })
  
  expiredKeys.forEach(key => {
    smsCodeStore.delete(key)
    console.log('🧹 清理过期验证码:', key)
  })
  
  if (expiredKeys.length > 0) {
    console.log(`🧹 共清理 ${expiredKeys.length} 个过期验证码`)
  }
}

// 调试工具函数
export const debugSmsStore = () => {
  console.log('🗂️ SMS存储调试信息:', {
    总数: smsCodeStore.size,
    手机号列表: Array.from(smsCodeStore.keys()),
    详细记录: Array.from(smsCodeStore.entries()).map(([phone, record]) => ({
      phone,
      code: record.code,
      时间: new Date(record.timestamp).toLocaleString(),
      尝试次数: record.attempts,
      剩余秒数: Math.max(0, Math.floor((record.timestamp + 5 * 60 * 1000 - Date.now()) / 1000))
    }))
  })
} 