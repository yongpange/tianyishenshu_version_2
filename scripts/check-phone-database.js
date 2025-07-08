const { createClient } = require('@supabase/supabase-js')

// 从环境变量读取配置
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkPhones() {
  console.log('🔍 检查数据库中的手机号...\n')
  
  try {
    // 查询所有用户的手机号
    const { data: users, error } = await supabase
      .from('users')
      .select('id, phone_number, created_at, is_profile_completed')
      .order('created_at', { ascending: false })
      
    if (error) {
      console.error('❌ 查询失败:', error)
      return
    }
    
    console.log('📱 数据库中的所有手机号:')
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.phone_number} (ID: ${user.id.substring(0, 8)}..., 资料完整: ${user.is_profile_completed})`)
    })
    
    // 特别检查这两个号码
    const targetPhones = ['15900675256', '15900675252']
    
    for (const phone of targetPhones) {
      console.log(`\n🔍 详细检查手机号: ${phone}`)
      
      const { data: user, error: checkError } = await supabase
        .from('users')
        .select('id, phone_number, is_profile_completed, created_at')
        .eq('phone_number', phone)
        .single()
        
      if (checkError && checkError.code !== 'PGRST116') {
        console.error(`❌ 查询 ${phone} 失败:`, checkError)
      } else if (user) {
        console.log(`✅ ${phone} 存在于数据库中`)
        console.log(`   ID: ${user.id}`)
        console.log(`   资料完整: ${user.is_profile_completed}`)
        console.log(`   创建时间: ${user.created_at}`)
      } else {
        console.log(`❌ ${phone} 不存在于数据库中`)
      }
    }
    
    // 测试API调用
    console.log('\n🧪 测试API调用...')
    
    for (const phone of targetPhones) {
      console.log(`\n📞 测试API检查: ${phone}`)
      
      try {
        const fetch = (await import('node-fetch')).default
        const response = await fetch('http://localhost:3000/api/auth/check-phone', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone })
        })
        
        const result = await response.json()
        
        console.log(`   状态码: ${response.status}`)
        console.log(`   响应: ${JSON.stringify(result, null, 2)}`)
        
        if (response.ok) {
          console.log(`   exists: ${result.exists}`)
          if (result.user) {
            console.log(`   用户ID: ${result.user.id}`)
          }
        }
        
      } catch (apiError) {
        console.error(`❌ API调用失败:`, apiError.message)
      }
    }
    
  } catch (error) {
    console.error('❌ 检查过程出错:', error)
  }
}

checkPhones().catch(console.error)
