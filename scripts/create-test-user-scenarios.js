// 创建不同状态的测试用户来验证登录逻辑
const { createClient } = require('@supabase/supabase-js')

require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createTestUserScenarios() {
  console.log('🧪 创建测试用户场景...\n')
  
  const scenarios = [
    {
      name: '场景1：只有基本用户信息（无资料无报告）',
      phone: '15900000001',
      createProfile: false,
      createReport: false,
      expectedRedirect: 'profile'
    },
    {
      name: '场景2：有用户信息和资料（无报告）',
      phone: '15900000002',
      createProfile: true,
      createReport: false,
      expectedRedirect: 'profile'
    },
    {
      name: '场景3：完整用户（有资料有报告）',
      phone: '15900000003',
      createProfile: true,
      createReport: true,
      expectedRedirect: 'dashboard'
    }
  ]
  
  for (const scenario of scenarios) {
    console.log(`📱 创建${scenario.name}`)
    console.log(`   手机号: ${scenario.phone}`)
    
    try {
      // 1. 创建用户
      const { data: user, error: userError } = await supabase
        .from('users')
        .upsert({
          phone_number: scenario.phone,
          invite_code_used: 'TEST123456789012',
          is_profile_completed: scenario.createProfile,
          last_login: new Date().toISOString()
        })
        .select()
        .single()
        
      if (userError) {
        console.log(`   ❌ 创建用户失败: ${userError.message}`)
        continue
      }
      
      console.log(`   ✅ 用户创建成功: ${user.id}`)
      
      // 2. 创建用户资料（如果需要）
      if (scenario.createProfile) {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .upsert({
            user_id: user.id,
            name: `测试用户${scenario.phone.slice(-3)}`,
            gender: 'male',
            year: 1995,
            month: 8,
            day: 15,
            hour: 14,
            minute: 30,
            area_province: '北京市',
            area_city: '北京市',
            area_district: '朝阳区',
            phone_number: scenario.phone
          }, {
            onConflict: 'user_id',
            ignoreDuplicates: false
          })
          .select()
          .single()
          
        if (profileError) {
          console.log(`   ❌ 创建用户资料失败: ${profileError.message}`)
        } else {
          console.log(`   ✅ 用户资料创建成功`)
        }
      }
      
      // 3. 创建性格报告（如果需要）
      if (scenario.createReport) {
        const { data: report, error: reportError } = await supabase
          .from('personality_reports')
          .upsert({
            user_id: user.id,
            content: `这是${scenario.phone}的测试性格报告内容。\n\n### 一、基本性格特征\n测试用户具有积极向上的性格特征...\n\n### 二、情感表达方式\n在情感表达方面比较内敛...\n\n### 三、处事风格\n做事认真负责，注重细节...`,
            user_data_hash: 'test_hash_' + Date.now(),
            coze_conversation_id: 'test_conv_' + Date.now()
          })
          .select()
          .single()
          
        if (reportError) {
          console.log(`   ❌ 创建性格报告失败: ${reportError.message}`)
        } else {
          console.log(`   ✅ 性格报告创建成功`)
        }
      }
      
      console.log(`   📊 预期跳转: ${scenario.expectedRedirect}`)
      
    } catch (error) {
      console.log(`   ❌ 创建失败: ${error.message}`)
    }
    
    console.log('')
  }
  
  // 验证创建的测试用户
  console.log('🔍 验证创建的测试用户...\n')
  
  for (const scenario of scenarios) {
    console.log(`📞 验证 ${scenario.phone}:`)
    
    try {
      // 查询用户
      const { data: user } = await supabase
        .from('users')
        .select('id, phone_number, is_profile_completed')
        .eq('phone_number', scenario.phone)
        .single()
        
      if (!user) {
        console.log('   ❌ 用户不存在')
        continue
      }
      
      // 查询资料
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        
      // 查询报告
      const { data: reports } = await supabase
        .from('personality_reports')
        .select('*')
        .eq('user_id', user.id)
        
      const hasProfile = profiles && profiles.length > 0
      const hasReport = reports && reports.length > 0 && reports[0].content
      const redirectTo = (hasProfile && hasReport) ? 'dashboard' : 'profile'
      
      console.log(`   用户ID: ${user.id}`)
      console.log(`   有资料: ${hasProfile}`)
      console.log(`   有报告: ${hasReport}`)
      console.log(`   应跳转: ${redirectTo}`)
      
      if (redirectTo === scenario.expectedRedirect) {
        console.log('   ✅ 符合预期')
      } else {
        console.log(`   ❌ 不符合预期，期望: ${scenario.expectedRedirect}`)
      }
      
    } catch (error) {
      console.log(`   ❌ 验证失败: ${error.message}`)
    }
    
    console.log('')
  }
  
  console.log('✨ 测试用户创建完成!')
  console.log('\n📋 使用说明:')
  console.log('1. 可以使用这些手机号在登录页面测试不同的跳转逻辑')
  console.log('2. 验证码可以在开发环境中使用任意6位数字')
  console.log('3. 测试完成后可以手动删除这些测试用户')
}

createTestUserScenarios().catch(console.error)
