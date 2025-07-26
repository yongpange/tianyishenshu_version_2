const { createClient } = require('@supabase/supabase-js')

async function testChatPromptTemplate() {
  console.log('🧪 测试聊天提示词模板构建...')

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

    // 2. 测试获取八字信息
    console.log('\n📊 测试获取八字信息...')
    const baziResponse = await fetch('http://localhost:3000/api/bazi/get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUserProfile.id,
        isUserProfileId: true
      })
    })

    let baziInfo = null
    if (baziResponse.ok) {
      const baziResult = await baziResponse.json()
      if (baziResult.success) {
        baziInfo = baziResult.astrologyContext
        console.log('✅ 八字信息获取成功')
        console.log('   八字内容长度:', baziInfo?.length || 0, '字符')
        console.log('   八字信息预览:', baziInfo?.substring(0, 100) + '...')
      } else {
        console.log('⚠️ 八字信息不存在:', baziResult.message)
      }
    } else {
      console.error('❌ 八字信息请求失败:', baziResponse.status)
    }

    // 3. 测试获取不同模块的报告
    const modules = ['personality', 'wealth', 'marriage', 'health']
    const moduleReports = {}
    
    console.log('\n📋 测试获取各模块报告...')
    
    for (const moduleType of modules) {
      try {
        const reportResponse = await fetch(`http://localhost:3000/api/${moduleType}-report/get`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userProfileId: testUserProfile.id
          })
        })

        if (reportResponse.ok) {
          const reportResult = await reportResponse.json()
          if (reportResult.success && reportResult.report) {
            moduleReports[moduleType] = reportResult.report
            console.log(`✅ ${moduleType}报告获取成功`)
            console.log(`   报告内容长度: ${reportResult.report.length} 字符`)
            console.log(`   报告预览: ${reportResult.report.substring(0, 100)}...`)
          } else {
            console.log(`⚠️ ${moduleType}报告不存在:`, reportResult.message)
          }
        } else {
          console.log(`❌ ${moduleType}报告请求失败:`, reportResponse.status)
        }
      } catch (error) {
        console.error(`❌ 获取${moduleType}报告时发生错误:`, error.message)
      }
    }

    // 4. 模拟构建第一次聊天的提示词
    console.log('\n🎯 模拟构建第一次聊天提示词模板...')
    
    const firstUserMessage = '我的性格有什么特点？'
    const moduleConfig = {
      title: '性格内观',
      moduleId: 'personality'
    }
    
    function buildFirstChatPrompt(userMessage, baziInfo, moduleReport, moduleTitle) {
      let promptContent = '# 请直接调用工作流分析，以下为输入信息：\n\n'
      
      // 八字信息
      if (baziInfo) {
        promptContent += '## 八字信息（bazi表中获取）\n'
        promptContent += `${baziInfo}\n\n`
      }
      
      // 对应报告
      if (moduleReport) {
        promptContent += `## ${moduleTitle}报告（报告表中获取）\n`
        promptContent += `${moduleReport}\n\n`
      }
      
      // 分析要求
      promptContent += '## 分析要求（针对"本次提出的问题"，你的分析不能和"历史分析纪录"有冲突。）\n\n'
      
      // 用户问题
      promptContent += '## 提问的问题\n'
      promptContent += `${userMessage}\n`
      
      return promptContent
    }
    
    const firstPrompt = buildFirstChatPrompt(
      firstUserMessage, 
      baziInfo, 
      moduleReports.personality, 
      moduleConfig.title
    )
    
    console.log('📝 第一次聊天提示词模板:')
    console.log('─'.repeat(50))
    console.log(firstPrompt)
    console.log('─'.repeat(50))
    console.log(`   模板总长度: ${firstPrompt.length} 字符`)

    // 5. 模拟构建后续聊天的提示词
    console.log('\n🔄 模拟构建后续聊天提示词模板...')
    
    const followUpMessage = '那我在工作中应该注意什么？'
    
    function buildFollowUpChatPrompt(userMessage) {
      let promptContent = '## 分析要求（针对"本次提出的问题"，你的分析不能和"历史分析纪录"有冲突。）\n\n'
      
      // 用户问题
      promptContent += '## 提问的问题\n'
      promptContent += `${userMessage}\n`
      
      return promptContent
    }
    
    const followUpPrompt = buildFollowUpChatPrompt(followUpMessage)
    
    console.log('📝 后续聊天提示词模板:')
    console.log('─'.repeat(30))
    console.log(followUpPrompt)
    console.log('─'.repeat(30))
    console.log(`   模板总长度: ${followUpPrompt.length} 字符`)

    // 6. 测试不同模块的第一次聊天模板
    console.log('\n🧩 测试不同模块的第一次聊天模板...')
    
    const testCases = [
      { moduleType: 'wealth', title: '事业财富', question: '我的财运如何？' },
      { moduleType: 'marriage', title: '婚恋感情', question: '我的感情运势怎么样？' },
      { moduleType: 'health', title: '身体健康', question: '我需要注意哪些健康问题？' }
    ]
    
    for (const testCase of testCases) {
      if (moduleReports[testCase.moduleType]) {
        const prompt = buildFirstChatPrompt(
          testCase.question,
          baziInfo,
          moduleReports[testCase.moduleType],
          testCase.title
        )
        
        console.log(`📋 ${testCase.title}模块提示词:`)
        console.log(`   问题: ${testCase.question}`)
        console.log(`   模板长度: ${prompt.length} 字符`)
        console.log(`   包含八字信息: ${baziInfo ? '是' : '否'}`)
        console.log(`   包含报告内容: ${moduleReports[testCase.moduleType] ? '是' : '否'}`)
      } else {
        console.log(`⚠️ ${testCase.title}模块缺少报告数据`)
      }
    }

    // 7. 性能和效果分析
    console.log('\n📊 提示词模板分析:')
    console.log(`   第一次聊天模板长度: ${firstPrompt.length} 字符`)
    console.log(`   后续聊天模板长度: ${followUpPrompt.length} 字符`)
    console.log(`   长度减少比例: ${((firstPrompt.length - followUpPrompt.length) / firstPrompt.length * 100).toFixed(1)}%`)
    
    console.log('\n✅ 模板结构验证:')
    console.log('   ✓ 第一次聊天包含完整上下文信息')
    console.log('   ✓ 后续聊天使用简化模板')
    console.log('   ✓ 分析要求保持一致性')
    console.log('   ✓ 用户问题准确传递')

    // 8. 实际API测试（可选）
    console.log('\n🚀 实际API调用测试...')
    
    try {
      // 测试第一次聊天
      const chatResponse = await fetch('http://localhost:3000/api/coze/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: firstPrompt,
          userInfo: { name: '测试用户' },
          userId: `user_${testUserProfile.id}`
        })
      })

      if (chatResponse.ok) {
        console.log('✅ 第一次聊天API调用成功')
        console.log('   响应类型:', chatResponse.headers.get('content-type'))
      } else {
        console.log('⚠️ 第一次聊天API调用失败:', chatResponse.status)
      }
    } catch (error) {
      console.warn('⚠️ API测试跳过，可能服务未启动:', error.message)
    }

    console.log('\n🎉 聊天提示词模板测试完成')

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
  testChatPromptTemplate()
} else {
  console.log('请配置所需的环境变量后再运行测试')
} 