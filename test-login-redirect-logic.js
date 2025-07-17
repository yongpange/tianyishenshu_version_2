require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

// 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的环境变量')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '已设置' : '未设置')
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '已设置' : '未设置')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testLoginRedirectLogic() {
  try {
    console.log('🔍 测试登录跳转逻辑\n')

    // 获取所有用户及其资料
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, phone_number')
      .limit(10)

    if (usersError) {
      console.error('❌ 获取用户失败:', usersError)
      return
    }

    console.log(`📊 找到 ${users.length} 个用户\n`)

    for (const user of users) {
      console.log(`👤 用户: ${user.phone_number} (ID: ${user.id})`)

      // 获取用户资料
      const { data: userProfiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, name, user_id, parent_id')
        .eq('user_id', user.id)

      if (profileError) {
        console.error(`  ❌ 获取用户资料失败:`, profileError)
        continue
      }

      if (!userProfiles || userProfiles.length === 0) {
        console.log('  📝 无用户资料 → 应跳转到 profile 页面')
      } else {
        console.log(`  📊 找到 ${userProfiles.length} 个资料:`)
        
        userProfiles.forEach((profile, index) => {
          const isMainProfile = profile.parent_id === null || 
                               profile.parent_id === undefined || 
                               profile.parent_id === ''
          
          console.log(`    ${index + 1}. ${profile.name || '未命名'} (parent_id: ${profile.parent_id}) ${isMainProfile ? '🔥 主资料' : '👶 子资料'}`)
        })

        // 判断是否有主资料
        const hasMainProfile = userProfiles.some(profile => 
          profile.parent_id === null || 
          profile.parent_id === undefined || 
          profile.parent_id === ''
        )

        const redirectTo = hasMainProfile ? 'dashboard' : 'profile'
        const redirectColor = hasMainProfile ? '🎯' : '📝'
        
        console.log(`  ${redirectColor} 跳转决策: ${redirectTo}`)
      }
      
      console.log('')
    }

    // 统计总体情况
    console.log('\n📈 统计报告:')
    
    let dashboardCount = 0
    let profileCount = 0
    let noProfileCount = 0

    for (const user of users) {
      const { data: userProfiles } = await supabase
        .from('user_profiles')
        .select('parent_id')
        .eq('user_id', user.id)

      if (!userProfiles || userProfiles.length === 0) {
        noProfileCount++
      } else {
        const hasMainProfile = userProfiles.some(profile => 
          profile.parent_id === null || 
          profile.parent_id === undefined || 
          profile.parent_id === ''
        )
        
        if (hasMainProfile) {
          dashboardCount++
        } else {
          profileCount++
        }
      }
    }

    console.log(`🎯 跳转到 dashboard: ${dashboardCount} 个用户`)
    console.log(`📝 跳转到 profile: ${profileCount} 个用户`)
    console.log(`❌ 无资料用户: ${noProfileCount} 个用户`)

  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

// 运行测试
testLoginRedirectLogic() 