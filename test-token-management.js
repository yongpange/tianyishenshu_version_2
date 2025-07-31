const { createClient } = require('@supabase/supabase-js')

async function testTokenManagement() {
  console.log('🧪 开始测试Token管理功能...')

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

    // 2. 清除现有token（强制重新生成）
    console.log('🗑️ 清除现有token...')
    const clearResponse = await fetch('http://localhost:3000/api/user-profiles/coze-token', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userProfileId: testUserProfile.id
      })
    })

    const clearResult = await clearResponse.json()
    if (clearResult.success) {
      console.log('✅ Token清除成功')
    } else {
      console.log('⚠️ Token清除失败:', clearResult.message)
    }

    // 3. 获取新token（第一次）
    console.log('🔄 获取新token（第一次）...')
    const firstTokenResponse = await fetch('http://localhost:3000/api/user-profiles/coze-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userProfileId: testUserProfile.id
      })
    })

    const firstTokenResult = await firstTokenResponse.json()
    if (firstTokenResult.success) {
      console.log('✅ 首次token获取成功')
      console.log('   Token前缀:', firstTokenResult.token.substring(0, 20) + '...')
      console.log('   是否缓存:', firstTokenResult.cached)
      console.log('   过期时间:', firstTokenResult.expiresAt)
    } else {
      console.error('❌ 首次token获取失败:', firstTokenResult.message)
      return
    }

    // 4. 再次获取token（应该使用缓存）
    console.log('🔄 获取token（第二次，应该使用缓存）...')
    const secondTokenResponse = await fetch('http://localhost:3000/api/user-profiles/coze-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userProfileId: testUserProfile.id
      })
    })

    const secondTokenResult = await secondTokenResponse.json()
    if (secondTokenResult.success) {
      console.log('✅ 第二次token获取成功')
      console.log('   Token前缀:', secondTokenResult.token.substring(0, 20) + '...')
      console.log('   是否缓存:', secondTokenResult.cached)
      console.log('   Token一致性:', firstTokenResult.token === secondTokenResult.token ? '✅ 一致' : '❌ 不一致')
    } else {
      console.error('❌ 第二次token获取失败:', secondTokenResult.message)
    }

    // 5. 强制刷新token
    console.log('🔄 强制刷新token...')
    const refreshTokenResponse = await fetch('http://localhost:3000/api/user-profiles/coze-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userProfileId: testUserProfile.id,
        forceRefresh: true
      })
    })

    const refreshTokenResult = await refreshTokenResponse.json()
    if (refreshTokenResult.success) {
      console.log('✅ 强制刷新成功')
      console.log('   新Token前缀:', refreshTokenResult.token.substring(0, 20) + '...')
      console.log('   是否缓存:', refreshTokenResult.cached)
      console.log('   Token变化:', firstTokenResult.token !== refreshTokenResult.token ? '✅ 已更新' : '❌ 未变化')
    } else {
      console.error('❌ 强制刷新失败:', refreshTokenResult.message)
    }

    // 6. 测试聊天API（如果token有效）
    if (refreshTokenResult.success) {
      console.log('💬 测试聊天API...')
      
      const chatResponse = await fetch('http://localhost:3000/api/coze/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: '你好，测试一下',
          userInfo: {
            user_id: testUserProfile.user_id,
            name: '测试用户',
            gender: 'male'
          },
          userId: testUserProfile.id
        })
      })

      if (chatResponse.ok) {
        const contentType = chatResponse.headers.get('content-type')
        
        if (contentType?.includes('text/event-stream')) {
          console.log('✅ 聊天API流式响应开始')
          
          const reader = chatResponse.body?.getReader()
          const decoder = new TextDecoder()
          let hasContent = false

          if (reader) {
            for (let i = 0; i < 5; i++) { // 只读取前5个chunk来测试
              const { done, value } = await reader.read()
              if (done) break

              const chunk = decoder.decode(value)
              const lines = chunk.split('\n')

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6))
                    if (data.type === 'content' && data.content) {
                      hasContent = true
                      console.log('📝 收到内容:', data.content.substring(0, 50) + '...')
                      break
                    }
                  } catch (e) {
                    // 忽略解析错误
                  }
                }
              }
              
              if (hasContent) break
            }
            
            reader.releaseLock()
          }

          if (hasContent) {
            console.log('✅ 聊天API测试成功 - 接收到AI回复')
          } else {
            console.log('⚠️ 聊天API测试 - 未接收到内容，但连接正常')
          }
        } else {
          const result = await chatResponse.json()
          console.log('✅ 聊天API响应:', result.success ? '成功' : result.error)
        }
      } else {
        const errorText = await chatResponse.text()
        console.error('❌ 聊天API测试失败:', chatResponse.status, errorText)
      }
    }

    console.log('🎉 Token管理测试完成')

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message)
    console.error('详细错误:', error)
  }
}

// 检查环境变量
function checkEnvironment() {
  const requiredEnvs = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'COZE_CLIENT_ID',
    'COZE_PUBLIC_KEY_ID',
    'COZE_PRIVATE_KEY_FILE',
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
  testTokenManagement()
} else {
  console.log('请配置所需的环境变量后再运行测试')
} 