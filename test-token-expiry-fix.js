const { createClient } = require('@supabase/supabase-js')

async function testTokenExpiryFix() {
  console.log('🧪 测试Token过期时间修复...')

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

    // 2. 清除现有token
    console.log('🗑️ 清除现有token...')
    await fetch('http://localhost:3000/api/user-profiles/coze-token', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userProfileId: testUserProfile.id })
    })

    // 3. 获取新token并检查过期时间
    console.log('🔄 获取新token...')
    const tokenResponse = await fetch('http://localhost:3000/api/user-profiles/coze-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userProfileId: testUserProfile.id })
    })

    const tokenResult = await tokenResponse.json()
    
    if (tokenResult.success) {
      console.log('✅ Token获取成功')
      console.log('📅 过期时间信息:', {
        expiresAt: tokenResult.expiresAt,
        createdAt: tokenResult.createdAt
      })

      // 验证过期时间是否合理
      const expiresAt = new Date(tokenResult.expiresAt)
      const createdAt = new Date(tokenResult.createdAt)
      const now = new Date()
      
      const timeDiffHours = (expiresAt - createdAt) / (1000 * 60 * 60)
      const timeToExpireHours = (expiresAt - now) / (1000 * 60 * 60)
      
      console.log('⏰ 时间验证:', {
        currentTime: now.toISOString(),
        createdTime: createdAt.toISOString(),
        expiresTime: expiresAt.toISOString(),
        durationHours: timeDiffHours.toFixed(2),
        hoursUntilExpiry: timeToExpireHours.toFixed(2),
        isReasonable: timeDiffHours > 20 && timeDiffHours < 25 ? '✅ 合理' : '❌ 异常'
      })

      // 4. 测试token是否有效（通过聊天API）
      console.log('💬 测试token有效性...')
      const chatResponse = await fetch('http://localhost:3000/api/coze/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: '你好，测试token',
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
          console.log('✅ Token有效 - 聊天API流式响应成功')
          
          // 读取一点流式响应来确认
          const reader = chatResponse.body?.getReader()
          const decoder = new TextDecoder()
          
          if (reader) {
            try {
              const { value } = await reader.read()
              const chunk = decoder.decode(value)
              
              if (chunk.includes('error') && chunk.includes('4101')) {
                console.log('❌ Token仍然无效 - 收到4101错误')
              } else {
                console.log('✅ Token验证通过 - 没有收到错误')
              }
              
              reader.releaseLock()
            } catch (e) {
              console.log('⚠️ 读取响应时出错，但连接成功')
            }
          }
        } else {
          const result = await chatResponse.json()
          console.log('📝 聊天API响应:', result.success ? '✅ 成功' : '❌ ' + result.error)
        }
      } else {
        const errorText = await chatResponse.text()
        console.log('❌ 聊天API失败:', chatResponse.status, errorText.substring(0, 200))
      }

      // 5. 检查数据库中的实际存储值
      console.log('🗄️ 检查数据库存储...')
      const { data: dbRecord } = await supabase
        .from('user_profiles')
        .select('coze_access_token, coze_token_expires_at, coze_token_created_at')
        .eq('id', testUserProfile.id)
        .single()

      if (dbRecord) {
        console.log('📋 数据库记录:', {
          hasToken: !!dbRecord.coze_access_token,
          tokenPrefix: dbRecord.coze_access_token?.substring(0, 20) + '...',
          expiresAt: dbRecord.coze_token_expires_at,
          createdAt: dbRecord.coze_token_created_at
        })
      }

    } else {
      console.error('❌ Token获取失败:', tokenResult.message)
    }

    console.log('🎉 Token过期时间修复测试完成')

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message)
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
  testTokenExpiryFix()
} else {
  console.log('请配置所需的环境变量后再运行测试')
} 