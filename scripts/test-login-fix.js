// 测试登录修复的脚本
// 验证数据库字段匹配和API功能

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少 Supabase 环境变量')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testDatabaseSchema() {
  console.log('🔍 测试数据库表结构...')
  
  try {
    // 测试查询用户表结构
    const { data, error } = await supabase
      .from('users')
      .select('id, phone_number, is_profile_completed, last_login, created_at')
      .limit(1)
    
    if (error) {
      console.error('❌ 数据库查询失败:', error.message)
      return false
    }
    
    console.log('✅ 数据库表结构正常')
    return true
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message)
    return false
  }
}

async function testCheckPhoneAPI() {
  console.log('🔍 测试手机号检查API...')
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/check-phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '13800138000' })
    })
    
    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ 手机号检查API正常工作')
      console.log('📱 响应:', result)
    } else {
      console.log('ℹ️ 手机号检查API响应:', result)
    }
    
    return true
  } catch (error) {
    console.error('❌ 手机号检查API测试失败:', error.message)
    return false
  }
}

async function createTestUser() {
  console.log('👤 创建测试用户...')
  
  const testPhone = '13800138000'
  
  try {
    // 先删除可能存在的测试用户
    await supabase
      .from('users')
      .delete()
      .eq('phone_number', testPhone)
    
    // 创建测试用户
    const { data, error } = await supabase
      .from('users')
      .insert({
        phone_number: testPhone,
        is_profile_completed: false,
        invite_code_used: 'TEST123456789ABC',
        permissions: ['basic']
      })
      .select()
      .single()
    
    if (error) {
      console.error('❌ 创建测试用户失败:', error.message)
      return null
    }
    
    console.log('✅ 测试用户创建成功:', data.id)
    return data
  } catch (error) {
    console.error('❌ 创建测试用户失败:', error.message)
    return null
  }
}

async function main() {
  console.log('🚀 开始测试登录修复...\n')
  
  // 1. 测试数据库表结构
  const schemaOk = await testDatabaseSchema()
  if (!schemaOk) {
    console.log('\n❌ 数据库表结构测试失败，请检查迁移是否已应用')
    return
  }
  
  console.log('')
  
  // 2. 创建测试用户
  const testUser = await createTestUser()
  if (!testUser) {
    console.log('\n❌ 无法创建测试用户')
    return
  }
  
  console.log('')
  
  // 3. 测试手机号检查API
  await testCheckPhoneAPI()
  
  console.log('\n✅ 所有测试完成！')
  console.log('💡 现在可以在浏览器中测试登录功能了')
  console.log('📱 测试手机号: 13800138000')
}

main().catch(console.error)
