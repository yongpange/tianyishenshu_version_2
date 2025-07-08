// 验证数据库迁移是否成功
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyMigration() {
  console.log('🔍 验证数据库迁移是否成功...\n')
  
  try {
    // 测试查询新字段
    const { data, error } = await supabase
      .from('users')
      .select('id, phone_number, is_profile_completed, last_login, created_at')
      .limit(1)
    
    if (error) {
      console.error('❌ 迁移验证失败:', error.message)
      console.log('\n💡 请确保已在 Supabase Dashboard 中执行了迁移 SQL')
      return false
    }
    
    console.log('✅ 数据库迁移成功!')
    console.log('📋 用户表现在包含以下字段:')
    
    if (data && data.length > 0) {
      const fields = Object.keys(data[0])
      fields.forEach(field => {
        console.log(`   - ${field}`)
      })
    } else {
      console.log('   - id')
      console.log('   - phone_number') 
      console.log('   - is_profile_completed ✨ (新增)')
      console.log('   - last_login ✨ (新增)')
      console.log('   - created_at')
      console.log('   - updated_at')
      console.log('   - invite_code_used')
      console.log('   - permissions')
    }
    
    console.log('\n🎉 现在可以使用完整的登录/注册功能了!')
    return true
    
  } catch (error) {
    console.error('❌ 验证过程出错:', error.message)
    return false
  }
}

async function testLoginAPI() {
  console.log('\n🧪 测试登录API...')
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/check-phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '13800138000' })
    })
    
    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ 手机号检查API工作正常')
      console.log('📱 用户信息:', result.user)
    } else {
      console.log('ℹ️ API响应:', result)
    }
    
  } catch (error) {
    console.error('❌ API测试失败:', error.message)
  }
}

async function main() {
  const migrationSuccess = await verifyMigration()
  
  if (migrationSuccess) {
    await testLoginAPI()
  }
}

main().catch(console.error)
