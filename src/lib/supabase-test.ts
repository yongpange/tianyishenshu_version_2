import { supabase, supabaseAdmin } from './supabase'

// 测试 Supabase 连接
export async function testSupabaseConnection() {
  console.log('🔍 开始测试 Supabase 连接...')
  
  try {
    // 测试环境变量
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('📋 环境变量检查:')
    console.log('- SUPABASE_URL:', supabaseUrl ? '✅ 已设置' : '❌ 未设置')
    console.log('- SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ 已设置' : '❌ 未设置')
    console.log('- SUPABASE_SERVICE_KEY:', supabaseServiceKey ? '✅ 已设置' : '❌ 未设置')
    
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      throw new Error('Supabase 环境变量未正确配置')
    }
    
    // 测试客户端连接
    console.log('\n🔗 测试客户端连接...')
    const { data: clientData, error: clientError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (clientError) {
      console.log('❌ 客户端连接失败:', clientError.message)
    } else {
      console.log('✅ 客户端连接成功')
    }
    
    // 测试管理员连接
    console.log('\n🔗 测试管理员连接...')
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1)
    
    if (adminError) {
      console.log('❌ 管理员连接失败:', adminError.message)
    } else {
      console.log('✅ 管理员连接成功')
    }
    
    // 测试表结构
    console.log('\n📊 检查数据库表结构...')
    const tables = ['users', 'user_profiles', 'personality_reports', 'conversations', 'invite_codes']
    
    for (const table of tables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`❌ 表 ${table}: ${error.message}`)
        } else {
          console.log(`✅ 表 ${table}: 可访问`)
        }
      } catch (err) {
        console.log(`❌ 表 ${table}: 连接错误`)
      }
    }
    
    console.log('\n✅ Supabase 连接测试完成')
    return true
    
  } catch (error) {
    console.error('❌ Supabase 连接测试失败:', error)
    return false
  }
}

// 简单的连接检查（用于快速验证）
export async function quickSupabaseCheck() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    return !error
  } catch {
    return false
  }
}
