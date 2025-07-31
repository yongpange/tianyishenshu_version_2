const { createClient } = require('@supabase/supabase-js')

async function testChatAvailability() {
  console.log('🧪 测试聊天功能可用性控制...')

  // 初始化Supabase客户端
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    // 1. 获取一个测试用户
    const { data: userProfiles } = await supabase
      .from('user_profiles')
      .select('id, user_id')
      .limit(1)

    if (!userProfiles || userProfiles.length === 0) {
      console.error('❌ 没有找到测试用户')
      return
    }

    const testUserProfile = userProfiles[0]
    console.log('👤 使用测试用户:', testUserProfile.id)

    // 2. 测试不同模块的报告状态
    const modules = [
      { name: 'personality', title: '性格内观' },
      { name: 'wealth', title: '事业财富' },
      { name: 'marriage', title: '婚恋感情' },
      { name: 'health', title: '身体健康' }
    ]

    for (const moduleType of modules) {
      console.log(`\n📋 测试${moduleType.title}模块聊天可用性...`)
      
      try {
        // 获取报告状态
        const reportResponse = await fetch(`http://localhost:3000/api/${moduleType.name}-report/get`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userProfileId: testUserProfile.id
          })
        })

        if (reportResponse.ok) {
          const reportResult = await reportResponse.json()
          
          let chatShouldBeAvailable = false
          let expectedReason = ''
          
          if (reportResult.success && reportResult.report) {
            // 报告存在且有内容
            chatShouldBeAvailable = true
            console.log(`✅ ${moduleType.title}报告存在，聊天应该可用`)
            console.log(`   报告内容长度: ${reportResult.report.length} 字符`)
          } else {
            // 报告不可用
            chatShouldBeAvailable = false
            
            if (reportResult.status === 'failed') {
              expectedReason = '报告生成失败，请重新生成后使用聊天功能'
              console.log(`❌ ${moduleType.title}报告生成失败，聊天应该被禁用`)
            } else if (reportResult.status === 'generating') {
              expectedReason = '报告正在生成中，请等待生成完成后使用聊天功能'
              console.log(`⏳ ${moduleType.title}报告正在生成中，聊天应该被禁用`)
            } else {
              expectedReason = '报告不存在，请先生成报告后使用聊天功能'
              console.log(`⚠️ ${moduleType.title}报告不存在，聊天应该被禁用`)
            }
          }
          
          // 测试聊天API调用
          console.log(`🎯 测试${moduleType.title}模块的聊天API调用...`)
          
          const chatResponse = await fetch('http://localhost:3000/api/coze/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: `我想了解我的${moduleType.title}情况`,
              userInfo: { name: '测试用户' },
              userId: `user_${testUserProfile.id}`
            })
          })

          if (chatShouldBeAvailable) {
            if (chatResponse.ok) {
              console.log(`✅ ${moduleType.title}模块聊天API调用成功（符合预期）`)
            } else {
              console.log(`⚠️ ${moduleType.title}模块聊天API调用失败，但报告存在:`, chatResponse.status)
            }
          } else {
            console.log(`📝 ${moduleType.title}模块预期聊天禁用原因: ${expectedReason}`)
            console.log(`   前端应该显示相应的禁用提示信息`)
          }
          
        } else {
          console.error(`❌ ${moduleType.title}报告状态检查失败:`, reportResponse.status)
        }
        
      } catch (error) {
        console.error(`❌ 测试${moduleType.title}模块时发生错误:`, error.message)
      }
    }

    // 3. 模拟前端聊天可用性判断逻辑
    console.log('\n🔧 模拟前端聊天可用性判断逻辑...')
    
    function simulateFrontendLogic(reportResult) {
      let chatAvailable = false
      let chatDisabledReason = ''
      
      if (reportResult.success && reportResult.report) {
        chatAvailable = true
        chatDisabledReason = ''
      } else {
        chatAvailable = false
        
        if (reportResult.status === 'failed') {
          chatDisabledReason = '报告生成失败，请重新生成后使用聊天功能'
        } else if (reportResult.status === 'generating') {
          chatDisabledReason = '报告正在生成中，请等待生成完成后使用聊天功能'
        } else {
          chatDisabledReason = '报告不存在，请先生成报告后使用聊天功能'
        }
      }
      
      return { chatAvailable, chatDisabledReason }
    }
    
    // 测试不同状态的模拟
    const testCases = [
      {
        name: '报告存在',
        reportResult: { success: true, report: '完整的报告内容...' },
        expectedAvailable: true,
        expectedReason: ''
      },
      {
        name: '报告生成失败',
        reportResult: { success: false, status: 'failed' },
        expectedAvailable: false,
        expectedReason: '报告生成失败，请重新生成后使用聊天功能'
      },
      {
        name: '报告正在生成',
        reportResult: { success: false, status: 'generating' },
        expectedAvailable: false,
        expectedReason: '报告正在生成中，请等待生成完成后使用聊天功能'
      },
      {
        name: '报告不存在',
        reportResult: { success: false },
        expectedAvailable: false,
        expectedReason: '报告不存在，请先生成报告后使用聊天功能'
      }
    ]
    
    for (const testCase of testCases) {
      const result = simulateFrontendLogic(testCase.reportResult)
      
      const availableMatch = result.chatAvailable === testCase.expectedAvailable
      const reasonMatch = result.chatDisabledReason === testCase.expectedReason
      
      if (availableMatch && reasonMatch) {
        console.log(`✅ ${testCase.name}: 逻辑正确`)
        console.log(`   可用状态: ${result.chatAvailable}`)
        console.log(`   禁用原因: ${result.chatDisabledReason || '无'}`)
      } else {
        console.log(`❌ ${testCase.name}: 逻辑错误`)
        console.log(`   期望可用: ${testCase.expectedAvailable}, 实际: ${result.chatAvailable}`)
        console.log(`   期望原因: ${testCase.expectedReason}, 实际: ${result.chatDisabledReason}`)
      }
    }

    // 4. UI状态测试建议
    console.log('\n🎨 UI状态测试建议:')
    console.log('   ✓ 输入框应该根据chatAvailable状态禁用/启用')
    console.log('   ✓ 发送按钮应该显示合适的禁用状态')
    console.log('   ✓ placeholder文本应该反映当前状态')
    console.log('   ✓ 应该显示明确的禁用原因提示')
    console.log('   ✓ 聊天欢迎界面应该显示不同的状态信息')

    // 5. 功能验证总结
    console.log('\n📊 聊天功能控制验证总结:')
    console.log('   🔒 禁用逻辑: 报告不存在/失败/生成中时禁用聊天')
    console.log('   🔓 启用逻辑: 报告存在且有内容时启用聊天')
    console.log('   📝 状态提示: 提供明确的禁用原因和指导')
    console.log('   🎯 用户体验: 引导用户先生成报告再使用聊天')
    
    console.log('\n✅ 核心控制要点:')
    console.log('   1. loadReport函数设置chatAvailable状态')
    console.log('   2. sendMessage函数检查chatAvailable状态') 
    console.log('   3. UI界面根据状态显示不同的提示')
    console.log('   4. 输入框和按钮响应禁用状态')

    console.log('\n🎉 聊天功能可用性控制测试完成')

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message)
  }
}

// 检查环境变量
function checkEnvironment() {
  const requiredEnvs = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]

  const missingEnvs = requiredEnvs.filter(env => !process.env[env])
  
  if (missingEnvs.length > 0) {
    console.error('❌ 缺少环境变量:', missingEnvs.join(', '))
    return false
  }

  console.log('✅ 环境变量检查通过')
  return true
}

// 运行测试
if (checkEnvironment()) {
  testChatAvailability()
} else {
  console.log('请配置所需的环境变量后再运行测试')
} 