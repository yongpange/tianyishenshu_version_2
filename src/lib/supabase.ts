import { createClient } from '@supabase/supabase-js'

// 环境变量验证（容错处理）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 打印环境变量调试信息
console.log('🔍 Supabase 配置调试信息:')
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl)
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 10)}...` : 'undefined')
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10)}...` : 'undefined')

// 在开发环境或占位符环境中，提供警告而不是抛出错误
if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
  console.warn('⚠️ NEXT_PUBLIC_SUPABASE_URL 未正确配置，部分功能可能不可用')
}
if (!supabaseAnonKey || supabaseAnonKey.includes('placeholder')) {
  console.warn('⚠️ NEXT_PUBLIC_SUPABASE_ANON_KEY 未正确配置，部分功能可能不可用')
}

// 使用默认值以避免应用崩溃
const safeSupabaseUrl = supabaseUrl || 'https://placeholder.supabase.co'
const safeSupabaseAnonKey = supabaseAnonKey || 'placeholder-key'

// 客户端Supabase实例（用于前端）
export const supabase = createClient(safeSupabaseUrl, safeSupabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'tianyishenshu-web'
    }
  }
})

// 服务端Supabase实例（用于API路由，具有管理员权限）
// 在客户端环境中，我们将使用普通客户端进行操作
export const supabaseAdmin = (() => {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // 如果在客户端环境或没有服务密钥，使用普通客户端
  if (typeof window !== 'undefined' || !supabaseServiceKey || supabaseServiceKey.includes('placeholder')) {
    if (typeof window !== 'undefined') {
      console.log('🔄 客户端环境，使用普通 Supabase 客户端')
    } else {
      console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY 未正确配置，使用普通客户端')
    }
    return createClient(safeSupabaseUrl, safeSupabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        headers: {
          'X-Client-Info': 'tianyishenshu-client-fallback'
        }
      }
    })
  }

  // 服务端环境，使用管理员权限
  return createClient(safeSupabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'X-Client-Info': 'tianyishenshu-admin'
      }
    }
  })
})()

// 数据库表类型定义
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          phone_number: string
          created_at: string
          updated_at: string
          invite_code_used?: string
          permissions: string[]
        }
        Insert: {
          id?: string
          phone_number: string
          created_at?: string
          updated_at?: string
          invite_code_used?: string
          permissions?: string[]
        }
        Update: {
          id?: string
          phone_number?: string
          created_at?: string
          updated_at?: string
          invite_code_used?: string
          permissions?: string[]
        }
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          name: string
          gender: 'male' | 'female'
          year: number
          month: number
          day: number
          hour: number
          minute: number
          area_province: string
          area_city: string
          area_district: string
          phone_number: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          gender: 'male' | 'female'
          year: number
          month: number
          day: number
          hour: number
          minute: number
          area_province: string
          area_city: string
          area_district: string
          phone_number: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          gender?: 'male' | 'female'
          year?: number
          month?: number
          day?: number
          hour?: number
          minute?: number
          area_province?: string
          area_city?: string
          area_district?: string
          phone_number?: string
          created_at?: string
          updated_at?: string
        }
      }
      personality_reports: {
        Row: {
          id: string
          user_id: string
          content: string
          generated_at: string
          user_data_hash: string
          coze_conversation_id?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          generated_at?: string
          user_data_hash: string
          coze_conversation_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          generated_at?: string
          user_data_hash?: string
          coze_conversation_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          title: string
          messages: any[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          messages?: any[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          messages?: any[]
          created_at?: string
          updated_at?: string
        }
      }
      invite_codes: {
        Row: {
          id: string
          code: string
          status: 'active' | 'used' | 'expired'
          remarks?: string
          used_by?: string
          used_at?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          status?: 'active' | 'used' | 'expired'
          remarks?: string
          used_by?: string
          used_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          status?: 'active' | 'used' | 'expired'
          remarks?: string
          used_by?: string
          used_at?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
