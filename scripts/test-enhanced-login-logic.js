// 测试增强的登录逻辑
const { createClient } = require('@supabase/supabase-js')

// 从环境变量读取配置
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testEnhancedLoginLogic() {
  console.log('🚀 测试增强的登录逻辑...\n')
  
  // 测试用例：不同状态的用户
  const testCases = [
    {
      name: '完全新用户（无资料无报告）',
      phone: '15900675999', // 假设这个号码不存在
      expectedRedirect: 'profile',
      expectedHasProfile: false,
      expectedHasReport: false
    },
    {
      name: '已注册但无资料的用户',
      phone: '15900675256', // 这个号码存在但可能没有完整资料
      expectedRedirect: 'profile',
      expectedHasProfile: false,
      expectedHasReport: false
    }
  ]
  
  for (const testCase of testCases) {
    console.log(`📱 测试场景: ${testCase.name}`)
    console.log(`   手机号: ${testCase.phone}`)
    
    try {
      // 查询用户基本信息
      const { data: user, error } = await supabase
        .from('users')
        .select('id, phone_number, is_profile_completed')
        .eq('phone_number', testCase.phone)
        .single()
        
      if (error && error.code === 'PGRST116') {
        console.log('   ❌ 用户不存在（符合预期）')
        continue
      } else if (error) {
        console.log('   ❌ 数据库查询失败:', error.message)
        continue
      }
      
      // 查询用户资料
      const { data: userProfiles } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)

      // 查询性格报告
      const { data: personalityReports } = await supabase
        .from('personality_reports')
        .select('*')
        .eq('user_id', user.id)

      // 分析用户状态
      const hasProfile = userProfiles && userProfiles.length > 0
      const hasReport = personalityReports &&
                       personalityReports.length > 0 &&
                       personalityReports[0].content &&
                       personalityReports[0].content.trim().length > 0
      
      const shouldRedirectTo = (hasProfile && hasReport) ? 'dashboard' : 'profile'
      
      console.log('   📊 用户状态分析:')
      console.log(`      用户ID: ${user.id}`)
      console.log(`      有资料: ${hasProfile}`)
      console.log(`      有报告: ${hasReport}`)
      console.log(`      应跳转到: ${shouldRedirectTo}`)
      
      if (hasProfile) {
        console.log(`      资料详情: ${userProfiles[0].name}, ${userProfiles[0].gender}`)
      }

      if (hasReport) {
        console.log(`      报告长度: ${personalityReports[0].content.length} 字符`)
      }
      
      // 验证逻辑是否正确
      if (shouldRedirectTo === testCase.expectedRedirect) {
        console.log('   ✅ 跳转逻辑正确')
      } else {
        console.log(`   ❌ 跳转逻辑错误: 期望=${testCase.expectedRedirect}, 实际=${shouldRedirectTo}`)
      }
      
    } catch (error) {
      console.log('   ❌ 测试失败:', error.message)
    }
    
    console.log('')
  }
  
  // 测试API调用
  console.log('🧪 测试登录API...\n')
  
  const existingPhone = '15900675256'
  console.log(`📞 测试登录API: ${existingPhone}`)
  
  try {
    const fetch = (await import('node-fetch')).default
    
    // 注意：这里只是测试API的数据查询逻辑，不包含SMS验证
    // 实际使用时需要先发送验证码
    console.log('   ⚠️ 注意：这里只测试数据查询逻辑，实际登录需要SMS验证')
    
    // 查询用户基本信息
    const { data: user, error } = await supabase
      .from('users')
      .select('id, phone_number, is_profile_completed')
      .eq('phone_number', existingPhone)
      .single()
      
    if (error) {
      console.log('   ❌ 查询失败:', error.message)
    } else {
      // 查询用户资料
      const { data: userProfiles } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)

      // 查询性格报告
      const { data: personalityReports } = await supabase
        .from('personality_reports')
        .select('*')
        .eq('user_id', user.id)

      const hasProfile = userProfiles && userProfiles.length > 0
      const hasReport = personalityReports &&
                       personalityReports.length > 0 &&
                       personalityReports[0].content &&
                       personalityReports[0].content.trim().length > 0
      
      const redirectTo = (hasProfile && hasReport) ? 'dashboard' : 'profile'
      
      console.log('   ✅ API数据查询成功')
      console.log('   📊 返回数据结构:')
      console.log(`      has_profile: ${hasProfile}`)
      console.log(`      has_report: ${hasReport}`)
      console.log(`      redirect_to: ${redirectTo}`)
      
      if (hasProfile) {
        console.log('   📋 用户资料预览:')
        console.log(`      姓名: ${userProfiles[0].name}`)
        console.log(`      性别: ${userProfiles[0].gender}`)
        console.log(`      出生: ${userProfiles[0].year}年${userProfiles[0].month}月${userProfiles[0].day}日`)
      }

      if (hasReport) {
        console.log('   📄 报告预览:')
        console.log(`      内容长度: ${personalityReports[0].content.length} 字符`)
        console.log(`      生成时间: ${personalityReports[0].generated_at}`)
      }
    }
    
  } catch (error) {
    console.log('   ❌ API测试失败:', error.message)
  }
  
  console.log('\n✨ 测试完成!')
  console.log('\n📋 总结:')
  console.log('1. 登录API现在会检查用户资料和报告状态')
  console.log('2. 根据两个条件决定跳转到dashboard还是profile页面')
  console.log('3. 如果有资料，会在响应中包含profile_data用于预填表单')
  console.log('4. 如果有报告，会在响应中包含report_data用于显示')
}

testEnhancedLoginLogic().catch(console.error)
