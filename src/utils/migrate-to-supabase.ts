// 数据迁移工具：从localStorage迁移到Supabase
import { supabase } from '@/lib/supabase'
import { PersonalityReport } from '@/lib/storage-adapter'
import { devLog } from '@/utils/dev-logger'

export interface MigrationResult {
  success: boolean
  migratedCount: number
  errors: string[]
}

// 迁移用户数据到Supabase
export async function migrateUserDataToSupabase(phoneNumber: string): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    migratedCount: 0,
    errors: []
  }

  try {
    // 1. 迁移用户基本信息
    const loginData = localStorage.getItem('loginData')
    const userData = localStorage.getItem('userData')
    
    if (loginData && userData) {
      const login = JSON.parse(loginData)
      const profile = JSON.parse(userData)

      // 创建或更新用户记录
      const { data: user, error: userError } = await supabase
        .from('users')
        .upsert({
          phone_number: phoneNumber,
          permissions: ['basic']
        })
        .select()
        .single()

      if (userError) {
        result.errors.push(`用户创建失败: ${userError.message}`)
        result.success = false
        return result
      }

      // 创建或更新用户资料
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          name: profile.name,
          gender: profile.gender,
          year: profile.year,
          month: profile.month,
          day: profile.day,
          hour: profile.hour,
          minute: profile.minute,
          area_province: profile.area.province,
          area_city: profile.area.city,
          area_district: profile.area.district,
          phone_number: phoneNumber
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        })

      if (profileError) {
        result.errors.push(`用户资料迁移失败: ${profileError.message}`)
      } else {
        result.migratedCount++
      }
    }

    // 2. 迁移性格报告
    const reportKey = `personality_report_${phoneNumber}`
    const reportData = localStorage.getItem(reportKey)
    
    if (reportData) {
      try {
        const report: PersonalityReport = JSON.parse(reportData)
        
        const { error: reportError } = await supabase
          .from('personality_reports')
          .upsert({
            user_id: phoneNumber, // 临时使用手机号作为user_id
            content: report.content,
            generated_at: new Date(report.generatedAt).toISOString(),
            user_data_hash: report.userDataHash,
            coze_conversation_id: report.cozeConversationId
          })

        if (reportError) {
          result.errors.push(`性格报告迁移失败: ${reportError.message}`)
        } else {
          result.migratedCount++
        }
      } catch (error) {
        result.errors.push(`性格报告解析失败: ${error}`)
      }
    }

    // 3. 迁移对话历史
    const conversationsData = localStorage.getItem('personality_conversations')
    
    if (conversationsData) {
      try {
        const conversations = JSON.parse(conversationsData)
        
        for (const conv of conversations) {
          const { error: convError } = await supabase
            .from('conversations')
            .upsert({
              id: conv.id,
              user_id: phoneNumber, // 临时使用手机号作为user_id
              title: conv.title,
              messages: conv.messages,
              created_at: new Date(conv.createdAt).toISOString()
            })

          if (convError) {
            result.errors.push(`对话迁移失败: ${convError.message}`)
          } else {
            result.migratedCount++
          }
        }
      } catch (error) {
        result.errors.push(`对话历史解析失败: ${error}`)
      }
    }

    if (result.errors.length > 0) {
      result.success = false
    }

  } catch (error) {
    result.success = false
    result.errors.push(`迁移过程出错: ${error}`)
  }

  return result
}

// 检查是否需要迁移
export function needsMigration(): boolean {
  // 检查localStorage中是否有数据
  const hasLoginData = !!localStorage.getItem('loginData')
  const hasUserData = !!localStorage.getItem('userData')
  const hasReports = Object.keys(localStorage).some(key => key.startsWith('personality_report_'))
  const hasConversations = !!localStorage.getItem('personality_conversations')

  return hasLoginData || hasUserData || hasReports || hasConversations
}

// 清理localStorage中的已迁移数据
export function cleanupLocalStorage(phoneNumber: string): void {
  const keysToRemove = [
    'loginData',
    'userData',
    `personality_report_${phoneNumber}`,
    'personality_conversations'
  ]

  keysToRemove.forEach(key => {
    localStorage.removeItem(key)
  })

  devLog.log('✅ localStorage清理完成')
}

// 一键迁移函数
export async function performFullMigration(phoneNumber: string): Promise<MigrationResult> {
  devLog.log('🚀 开始数据迁移到Supabase...')
  
  const result = await migrateUserDataToSupabase(phoneNumber)
  
  if (result.success) {
    devLog.log(`✅ 迁移成功！共迁移 ${result.migratedCount} 项数据`)
    // 迁移成功后清理localStorage
    cleanupLocalStorage(phoneNumber)
  } else {
    devLog.error('❌ 迁移失败:', result.errors)
  }
  
  return result
}

// 测试Supabase连接
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    return !error
  } catch (error) {
    devLog.error('Supabase连接测试失败:', error)
    return false
  }
}
