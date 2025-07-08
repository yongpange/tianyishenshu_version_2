// 创建测试用户
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTestUser() {
  const testPhone = '13800138000'
  
  try {
    console.log('👤 创建测试用户...')
    
    // 先删除可能存在的测试用户
    await supabase
      .from('users')
      .delete()
      .eq('phone_number', testPhone)
    
    console.log('🗑️ 清理旧的测试用户')
    
    // 创建测试用户
    const { data, error } = await supabase
      .from('users')
      .insert({
        phone_number: testPhone,
        invite_code_used: 'TEST123456789ABC',
        permissions: ['basic']
      })
      .select()
      .single()
    
    if (error) {
      console.error('❌ 创建测试用户失败:', error.message)
      return
    }
    
    console.log('✅ 测试用户创建成功!')
    console.log('📱 手机号:', testPhone)
    console.log('🆔 用户ID:', data.id)
    console.log('🎟️ 兑换码:', data.invite_code_used)
    
    console.log('\n💡 现在可以在浏览器中测试登录功能了:')
    console.log('1. 打开 http://localhost:3000/login')
    console.log('2. 输入手机号: 13800138000')
    console.log('3. 点击发送验证码')
    console.log('4. 查看控制台输出的验证码')
    
  } catch (error) {
    console.error('❌ 创建测试用户失败:', error.message)
  }
}

createTestUser()
