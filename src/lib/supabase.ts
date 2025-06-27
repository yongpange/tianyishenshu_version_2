import { createClient } from '@supabase/supabase-js'

// 环境变量验证
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!supabaseAnonKey) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// 客户端Supabase实例（用于前端）
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
// 只在服务端环境中创建
export const supabaseAdmin = (() => {
  // 检查是否在服务端环境
  if (typeof window !== 'undefined') {
    // 客户端环境，返回 null
    return null
  }

  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseServiceKey) {
    throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
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
