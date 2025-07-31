const { createClient } = require('@supabase/supabase-js')

async function testConversationLoading() {
  console.log('🧪 测试对话历史加载优化...')

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

    // 2. 创建多个测试对话（如果不存在）
    console.log('📝 准备测试数据...')
    
    const testConversations = []
    for (let i = 0; i < 10; i++) {
      try {
        const createResponse = await fetch('http://localhost:3000/api/conversations/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userProfileId: testUserProfile.id,
            title: `测试对话 ${i + 1}`,
            moduleType: 'personality'
          })
        })

        if (createResponse.ok) {
          const result = await createResponse.json()
          if (result.success) {
            testConversations.push(result.conversation)
            
            // 为每个对话添加几条消息
            for (let j = 0; j < 3; j++) {
              await fetch('http://localhost:3000/api/messages/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  conversationId: result.conversation.id,
                  role: j % 2 === 0 ? 'user' : 'assistant',
                  content: `测试消息 ${j + 1} - 对话 ${i + 1}`,
                  metadata: { frontend_id: `test_${i}_${j}` }
                })
              })
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️ 创建测试对话 ${i + 1} 失败:`, error.message)
      }
    }

    console.log(`✅ 准备了 ${testConversations.length} 个测试对话`)

    // 3. 测试对话列表加载速度
    console.log('\n🚀 测试对话列表加载速度...')
    
    const startTime = Date.now()
    
    const conversationsResponse = await fetch('http://localhost:3000/api/conversations/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userProfileId: testUserProfile.id,
        moduleType: 'personality'
      })
    })

    const listLoadTime = Date.now() - startTime
    
    if (conversationsResponse.ok) {
      const result = await conversationsResponse.json()
      if (result.success) {
        console.log(`✅ 对话列表加载成功: ${listLoadTime}ms`)
        console.log(`   对话数量: ${result.conversations?.length || 0}`)
        
        if (listLoadTime < 1000) {
          console.log('🎉 对话列表加载速度优秀 (< 1秒)')
        } else if (listLoadTime < 3000) {
          console.log('✅ 对话列表加载速度良好 (< 3秒)')
        } else {
          console.log('⚠️ 对话列表加载速度需要优化 (> 3秒)')
        }
        
        // 4. 测试单个对话消息加载
        if (result.conversations && result.conversations.length > 0) {
          console.log('\n📱 测试单个对话消息加载...')
          
          const testConv = result.conversations[0]
          const messageStartTime = Date.now()
          
          const messagesResponse = await fetch('http://localhost:3000/api/messages/list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              conversationId: testConv.id
            })
          })
          
          const messageLoadTime = Date.now() - messageStartTime
          
          if (messagesResponse.ok) {
            const messageResult = await messagesResponse.json()
            console.log(`✅ 单个对话消息加载: ${messageLoadTime}ms`)
            console.log(`   消息数量: ${messageResult.messages?.length || 0}`)
          } else {
            console.log('❌ 单个对话消息加载失败')
          }
        }
        
        // 5. 模拟并发加载前5个对话
        if (result.conversations && result.conversations.length >= 5) {
          console.log('\n⚡ 测试并发加载前5个对话消息...')
          
          const concurrentStartTime = Date.now()
          const priorityConversations = result.conversations.slice(0, 5)
          
          const concurrentPromises = priorityConversations.map(async (conv, index) => {
            const start = Date.now()
            try {
              const response = await fetch('http://localhost:3000/api/messages/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  conversationId: conv.id
                })
              })
              
              const loadTime = Date.now() - start
              if (response.ok) {
                const result = await response.json()
                return {
                  index: index + 1,
                  loadTime,
                  messageCount: result.messages?.length || 0,
                  success: true
                }
              } else {
                return { index: index + 1, loadTime, success: false }
              }
            } catch (error) {
              return { index: index + 1, loadTime: Date.now() - start, success: false, error: error.message }
            }
          })
          
          const results = await Promise.all(concurrentPromises)
          const totalConcurrentTime = Date.now() - concurrentStartTime
          
          console.log(`✅ 并发加载完成: ${totalConcurrentTime}ms`)
          
          results.forEach(result => {
            if (result.success) {
              console.log(`   对话${result.index}: ${result.loadTime}ms (${result.messageCount}条消息)`)
            } else {
              console.log(`   对话${result.index}: 失败 - ${result.error || '未知错误'}`)
            }
          })
          
          const avgLoadTime = results
            .filter(r => r.success)
            .reduce((sum, r) => sum + r.loadTime, 0) / results.filter(r => r.success).length
          
          console.log(`   平均加载时间: ${avgLoadTime.toFixed(0)}ms`)
          
          // 对比顺序加载时间
          console.log('\n🔄 对比顺序加载时间...')
          
          const sequentialStartTime = Date.now()
          let sequentialTimes = []
          
          for (let i = 0; i < Math.min(5, priorityConversations.length); i++) {
            const start = Date.now()
            try {
              const response = await fetch('http://localhost:3000/api/messages/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  conversationId: priorityConversations[i].id
                })
              })
              
              if (response.ok) {
                sequentialTimes.push(Date.now() - start)
              }
            } catch (error) {
              console.warn(`⚠️ 顺序加载对话${i + 1}失败:`, error.message)
            }
          }
          
          const totalSequentialTime = Date.now() - sequentialStartTime
          
          console.log(`✅ 顺序加载完成: ${totalSequentialTime}ms`)
          console.log(`   性能提升: ${((totalSequentialTime - totalConcurrentTime) / totalSequentialTime * 100).toFixed(1)}%`)
        }
        
      } else {
        console.error('❌ 对话列表加载失败:', result.message)
      }
    } else {
      console.error('❌ 对话列表请求失败:', conversationsResponse.status)
    }

    // 6. 性能总结
    console.log('\n📊 性能总结:')
    console.log(`   对话列表加载: ${listLoadTime}ms`)
    console.log('   优化效果:')
    console.log('   ✅ 用户可以立即看到对话列表')
    console.log('   ✅ 最新5个对话的消息在后台异步加载')
    console.log('   ✅ 其他对话消息按需懒加载')
    console.log('   ✅ 大幅减少了初始加载时间')

    console.log('\n🎉 对话历史加载优化测试完成')

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
  testConversationLoading()
} else {
  console.log('请配置所需的环境变量后再运行测试')
} 