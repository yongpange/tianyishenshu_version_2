// 存储适配器接口，方便后续切换到Supabase
export interface PersonalityReport {
  id: string
  userId: string  // 手机号
  content: string
  generatedAt: Date
  userDataHash: string
  cozeConversationId?: string
}

export interface StorageAdapter {
  savePersonalityReport(userId: string, report: PersonalityReport): Promise<void>
  getPersonalityReport(userId: string): Promise<PersonalityReport | null>
  clearPersonalityReport(userId: string): Promise<void>
}

// localStorage实现
export class LocalStorageAdapter implements StorageAdapter {
  private getStorageKey(userId: string): string {
    return `personality_report_${userId}`
  }

  async savePersonalityReport(userId: string, report: PersonalityReport): Promise<void> {
    try {
      const key = this.getStorageKey(userId)
      localStorage.setItem(key, JSON.stringify(report))
    } catch (error) {
      console.error('保存性格报告失败:', error)
      throw new Error('保存报告失败')
    }
  }

  async getPersonalityReport(userId: string): Promise<PersonalityReport | null> {
    try {
      const key = this.getStorageKey(userId)
      const data = localStorage.getItem(key)
      
      if (!data) return null
      
      const report = JSON.parse(data)
      // 修复日期对象
      report.generatedAt = new Date(report.generatedAt)
      
      return report
    } catch (error) {
      console.error('读取性格报告失败:', error)
      return null
    }
  }

  async clearPersonalityReport(userId: string): Promise<void> {
    try {
      const key = this.getStorageKey(userId)
      localStorage.removeItem(key)
    } catch (error) {
      console.error('清除性格报告失败:', error)
      throw new Error('清除报告失败')
    }
  }
}

// Supabase实现
export class SupabaseAdapter implements StorageAdapter {
  private supabase: any

  constructor() {
    // 动态导入Supabase客户端，避免在服务端出错
    if (typeof window !== 'undefined') {
      import('@/lib/supabase').then(({ supabase, supabaseAdmin }) => {
        // 在服务端使用 admin 客户端，在客户端使用普通客户端
        this.supabase = supabaseAdmin || supabase
      })
    }
  }

  private async ensureSupabase() {
    if (!this.supabase) {
      const { supabase, supabaseAdmin } = await import('@/lib/supabase')
      // 在服务端使用 admin 客户端，在客户端使用普通客户端
      this.supabase = supabaseAdmin || supabase
    }
    return this.supabase
  }

  async savePersonalityReport(userId: string, report: PersonalityReport): Promise<void> {
    try {
      const supabase = await this.ensureSupabase()

      // 首先查找或创建用户
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('phone_number', userId)
        .single()

      let actualUserId = user?.id

      if (userError && userError.code === 'PGRST116') {
        // 用户不存在，创建新用户
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            phone_number: userId,
            permissions: ['basic']
          })
          .select('id')
          .single()

        if (createError) {
          console.error('创建用户失败:', createError)
          throw new Error('创建用户失败')
        }
        actualUserId = newUser.id
      } else if (userError) {
        console.error('查找用户失败:', userError)
        throw new Error('查找用户失败')
      }

      // 保存性格报告
      const { error } = await supabase
        .from('personality_reports')
        .upsert({
          user_id: actualUserId,
          content: report.content,
          generated_at: report.generatedAt.toISOString(),
          user_data_hash: report.userDataHash,
          coze_conversation_id: report.cozeConversationId
        })

      if (error) {
        console.error('Supabase保存报告失败:', error)
        throw new Error('保存报告失败')
      }
    } catch (error) {
      console.error('保存性格报告失败:', error)
      throw new Error('保存报告失败')
    }
  }

  async getPersonalityReport(userId: string): Promise<PersonalityReport | null> {
    try {
      const supabase = await this.ensureSupabase()

      // 首先通过手机号查找用户ID
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('phone_number', userId)
        .single()

      if (userError) {
        if (userError.code === 'PGRST116') {
          // 用户不存在
          return null
        }
        console.error('查找用户失败:', userError)
        return null
      }

      // 通过用户ID查找性格报告
      const { data, error } = await supabase
        .from('personality_reports')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // 没有找到记录
          return null
        }
        console.error('Supabase读取报告失败:', error)
        return null
      }

      if (!data) return null

      return {
        id: data.id,
        userId: userId, // 返回手机号作为userId
        content: data.content,
        generatedAt: new Date(data.generated_at),
        userDataHash: data.user_data_hash,
        cozeConversationId: data.coze_conversation_id
      }
    } catch (error) {
      console.error('读取性格报告失败:', error)
      return null
    }
  }

  async clearPersonalityReport(userId: string): Promise<void> {
    try {
      const supabase = await this.ensureSupabase()

      // 首先通过手机号查找用户ID
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('phone_number', userId)
        .single()

      if (userError) {
        if (userError.code === 'PGRST116') {
          // 用户不存在，无需清除
          return
        }
        console.error('查找用户失败:', userError)
        throw new Error('查找用户失败')
      }

      const { error } = await supabase
        .from('personality_reports')
        .delete()
        .eq('user_id', user.id)

      if (error) {
        console.error('Supabase清除报告失败:', error)
        throw new Error('清除报告失败')
      }
    } catch (error) {
      console.error('清除性格报告失败:', error)
      throw new Error('清除报告失败')
    }
  }
}

// 存储管理器，统一管理存储适配器
export class StorageManager {
  private adapter: StorageAdapter

  constructor(useSupabase: boolean = false) {
    this.adapter = useSupabase ? new SupabaseAdapter() : new LocalStorageAdapter()
  }

  async savePersonalityReport(userId: string, report: PersonalityReport): Promise<void> {
    return this.adapter.savePersonalityReport(userId, report)
  }

  async getPersonalityReport(userId: string): Promise<PersonalityReport | null> {
    return this.adapter.getPersonalityReport(userId)
  }

  async clearPersonalityReport(userId: string): Promise<void> {
    return this.adapter.clearPersonalityReport(userId)
  }

  // 切换存储适配器
  switchAdapter(useSupabase: boolean): void {
    this.adapter = useSupabase ? new SupabaseAdapter() : new LocalStorageAdapter()
  }
}

// 导出默认实例
export const storageManager = new StorageManager(true) // 默认使用Supabase
