const { createClient } = require('@supabase/supabase-js')

async function testStreamingSpeed() {
  console.log('🧪 测试流式响应速度优化...')

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

    // 2. 测试流式响应时间
    const startTime = Date.now()
    let firstDataTime = null
    let firstContentTime = null
    let completionTime = null

    console.log('🚀 开始发送聊天请求...')
    
    const chatResponse = await fetch('http://localhost:3000/api/coze/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: '你好，请简单介绍一下自己',
        userInfo: {
          user_id: testUserProfile.user_id,
          name: '测试用户',
          gender: 'male',
          year: 1990,
          month: 1,
          day: 1,
          hour: 12,
          minute: 0,
          area: { province: '北京市', city: '北京市', district: '朝阳区' }
        },
        userId: testUserProfile.id
      })
    })

    if (!chatResponse.ok) {
      console.error('❌ 聊天请求失败:', chatResponse.status)
      return
    }

    console.log('✅ 流式响应开始')
    
    const reader = chatResponse.body?.getReader()
    const decoder = new TextDecoder()
    let receivedContent = ''
    let chunkCount = 0

    if (reader) {
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          chunkCount++
          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                
                // 记录第一次收到数据的时间
                if (!firstDataTime) {
                  firstDataTime = Date.now()
                  const timeToFirstData = firstDataTime - startTime
                  console.log(`⚡ 首次收到数据: ${timeToFirstData}ms, 类型: ${data.type}`)
                  
                  if (data.type === 'start') {
                    console.log('🎯 收到开始信号:', data.message)
                  }
                }

                // 记录第一次收到内容的时间
                if (data.type === 'content' && !firstContentTime) {
                  firstContentTime = Date.now()
                  const timeToFirstContent = firstContentTime - startTime
                  console.log(`📝 首次收到内容: ${timeToFirstContent}ms`)
                  console.log('   内容预览:', data.content.substring(0, 50) + '...')
                }

                if (data.type === 'content') {
                  receivedContent += data.content
                }

                if (data.type === 'done') {
                  completionTime = Date.now()
                  const totalTime = completionTime - startTime
                  console.log(`✅ 对话完成: ${totalTime}ms`)
                  console.log('   总内容长度:', receivedContent.length)
                  console.log('   总chunk数:', chunkCount)
                  
                  // 计算性能指标
                  console.log('\n📊 性能指标:')
                  console.log(`   启动延迟: ${firstDataTime ? firstDataTime - startTime : 'N/A'}ms`)
                  console.log(`   内容延迟: ${firstContentTime ? firstContentTime - startTime : 'N/A'}ms`)
                  console.log(`   总响应时间: ${totalTime}ms`)
                  
                  if (firstContentTime && firstDataTime) {
                    console.log(`   处理时间: ${firstContentTime - firstDataTime}ms`)
                  }
                  
                  // 评估优化效果
                  const startupDelay = firstDataTime - startTime
                  if (startupDelay < 2000) {
                    console.log('🎉 启动延迟优秀 (< 2秒)')
                  } else if (startupDelay < 5000) {
                    console.log('✅ 启动延迟良好 (< 5秒)')
                  } else {
                    console.log('⚠️ 启动延迟需要优化 (> 5秒)')
                  }

                  return
                }

                if (data.type === 'error') {
                  console.error('❌ 收到错误:', data.error)
                  return
                }

              } catch (parseError) {
                // 忽略解析错误
              }
            }
          }

          // 避免无限循环，最多读取30秒
          if (Date.now() - startTime > 30000) {
            console.log('⏰ 测试超时 (30秒)')
            break
          }
        }
      } finally {
        reader.releaseLock()
      }
    }

    // 3. 测试多次请求的一致性
    console.log('\n🔄 测试响应时间的一致性 (3次)...')
    const responseTimes = []
    
    for (let i = 0; i < 3; i++) {
      const testStart = Date.now()
      
      try {
        const testResponse = await fetch('http://localhost:3000/api/coze/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `测试消息 ${i + 1}`,
            userInfo: {
              user_id: testUserProfile.user_id,
              name: '测试用户',
              gender: 'male'
            },
            userId: testUserProfile.id
          })
        })

        if (testResponse.ok) {
          const testReader = testResponse.body?.getReader()
          const testDecoder = new TextDecoder()
          
          if (testReader) {
            const { value } = await testReader.read()
            const testChunk = testDecoder.decode(value)
            
            if (testChunk.includes('start')) {
              const responseTime = Date.now() - testStart
              responseTimes.push(responseTime)
              console.log(`   第${i + 1}次: ${responseTime}ms`)
            }
            
            testReader.releaseLock()
          }
        }
      } catch (error) {
        console.log(`   第${i + 1}次: 失败 -`, error.message)
      }

      // 间隔1秒
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    if (responseTimes.length > 0) {
      const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      const minTime = Math.min(...responseTimes)
      const maxTime = Math.max(...responseTimes)
      
      console.log('\n📈 响应时间统计:')
      console.log(`   平均时间: ${avgTime.toFixed(0)}ms`)
      console.log(`   最快时间: ${minTime}ms`)
      console.log(`   最慢时间: ${maxTime}ms`)
      console.log(`   时间差异: ${maxTime - minTime}ms`)
    }

    console.log('\n🎉 流式响应速度测试完成')

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message)
  }
}

// 检查环境变量
function checkEnvironment() {
  const requiredEnvs = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'CHAT_BOT_ID'
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
  testStreamingSpeed()
} else {
  console.log('请配置所需的环境变量后再运行测试')
} 