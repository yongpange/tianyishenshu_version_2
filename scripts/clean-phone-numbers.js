const { createClient } = require('@supabase/supabase-js')

// 从环境变量读取配置
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function cleanPhoneNumbers() {
  console.log('🧹 开始清理数据库中的手机号...\n')
  
  try {
    // 查询所有用户
    const { data: users, error } = await supabase
      .from('users')
      .select('id, phone_number')
      
    if (error) {
      console.error('❌ 查询失败:', error)
      return
    }
    
    console.log(`📱 找到 ${users.length} 个用户记录`)
    
    let cleanedCount = 0
    let issuesFound = []
    
    for (const user of users) {
      const originalPhone = user.phone_number
      const cleanedPhone = originalPhone.trim()
      
      // 检查是否需要清理
      if (originalPhone !== cleanedPhone) {
        console.log(`🔧 需要清理: "${originalPhone}" -> "${cleanedPhone}"`)
        
        issuesFound.push({
          id: user.id,
          original: originalPhone,
          cleaned: cleanedPhone,
          originalLength: originalPhone.length,
          cleanedLength: cleanedPhone.length
        })
        
        // 更新数据库
        const { error: updateError } = await supabase
          .from('users')
          .update({ phone_number: cleanedPhone })
          .eq('id', user.id)
          
        if (updateError) {
          console.error(`❌ 更新用户 ${user.id} 失败:`, updateError)
        } else {
          console.log(`✅ 已清理用户 ${user.id} 的手机号`)
          cleanedCount++
        }
      }
    }
    
    console.log(`\n📊 清理结果:`)
    console.log(`   总用户数: ${users.length}`)
    console.log(`   需要清理的记录: ${issuesFound.length}`)
    console.log(`   成功清理的记录: ${cleanedCount}`)
    
    if (issuesFound.length > 0) {
      console.log(`\n🔍 发现的问题:`)
      issuesFound.forEach((issue, index) => {
        console.log(`${index + 1}. 用户ID: ${issue.id.substring(0, 8)}...`)
        console.log(`   原始: ${JSON.stringify(issue.original)} (长度: ${issue.originalLength})`)
        console.log(`   清理后: ${JSON.stringify(issue.cleaned)} (长度: ${issue.cleanedLength})`)
        console.log(`   字符码: [${[...issue.original].map(c => c.charCodeAt(0)).join(', ')}]`)
        console.log('')
      })
    }
    
    // 验证清理结果
    console.log('🔍 验证清理结果...')
    
    const { data: verifyUser, error: verifyError } = await supabase
      .from('users')
      .select('id, phone_number')
      .eq('phone_number', '15900675256')
      .single()
      
    if (verifyError && verifyError.code !== 'PGRST116') {
      console.error('❌ 验证查询失败:', verifyError)
    } else if (verifyUser) {
      console.log('✅ 验证成功: 15900675256 现在可以正确查询到')
      console.log(`   用户ID: ${verifyUser.id}`)
    } else {
      console.log('❌ 验证失败: 15900675256 仍然无法查询到')
    }
    
  } catch (error) {
    console.error('❌ 清理过程出错:', error)
  }
}

cleanPhoneNumbers().catch(console.error)
