// 简单检查当前登录逻辑
const testPhone = '13800138000' // 使用一个测试手机号

async function testLoginLogic() {
  try {
    console.log('🔍 测试登录跳转逻辑')
    console.log(`📱 测试手机号: ${testPhone}\n`)

    // 模拟检查手机号
    const checkResponse = await fetch('http://localhost:3000/api/auth/check-phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: testPhone })
    })

    const checkResult = await checkResponse.json()
    console.log('✅ 手机号检查结果:', checkResult)

    if (checkResult.exists && checkResult.user_profiles) {
      console.log('\n📊 用户资料分析:')
      checkResult.user_profiles.forEach((profile, index) => {
        const isMainProfile = profile.parent_id === null || 
                              profile.parent_id === undefined || 
                              profile.parent_id === ''
        
        console.log(`  ${index + 1}. ${profile.name || '未命名'} (parent_id: ${profile.parent_id}) ${isMainProfile ? '🔥 主资料' : '👶 子资料'}`)
      })

      // 判断登录后的跳转逻辑
      const hasMainProfile = checkResult.user_profiles.some(profile => 
        profile.parent_id === null || 
        profile.parent_id === undefined || 
        profile.parent_id === ''
      )

      const redirectTo = hasMainProfile ? 'dashboard' : 'profile'
      console.log(`\n🎯 登录跳转决策: ${redirectTo}`)
      console.log(`📝 理由: ${hasMainProfile ? '用户已有主资料' : '用户需要创建主资料'}`)
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message)
  }
}

testLoginLogic() 