// 测试聊天前置prompt内容
const fetch = require('node-fetch').default || require('node-fetch')

async function testChatPrompt() {
  console.log('🧪 测试聊天前置prompt内容...\n')
  
  // 模拟用户信息（与您实际测试的数据一致）
  const userInfo = {
    nickname: '葛跳绳',
    name: '葛跳绳',
    gender: '男',
    year: 1989,
    month: 7,
    day: 10,
    hour: 14,
    minute: 30,
    area: {
      province: '北京市',
      city: '市辖区',
      district: '朝阳区'
    }
  }
  
  const testMessage = '你好'
  const userId = 'user_15900675256'
  
  console.log('👤 测试用户信息:')
  console.log(JSON.stringify(userInfo, null, 2))
  console.log('\n💬 测试消息:', testMessage)
  console.log('🔑 用户ID:', userId)
  
  try {
    // 1. 先测试八字排盘上下文获取
    console.log('\n1️⃣ 测试八字排盘上下文获取...')
    const astrologyResponse = await fetch('http://localhost:3000/api/test-astrology-context')
    
    if (astrologyResponse.ok) {
      const astrologyData = await astrologyResponse.json()
      console.log('✅ 八字排盘上下文获取成功')
      console.log('📊 上下文长度:', astrologyData.length, '字符')
      console.log('📝 上下文内容预览:')
      console.log(astrologyData.context.substring(0, 500) + '...')
    } else {
      console.log('❌ 八字排盘上下文获取失败')
    }
    
    // 2. 测试聊天API调用（模拟首次消息）
    console.log('\n2️⃣ 测试聊天API调用（首次消息）...')
    const chatResponse = await fetch('http://localhost:3000/api/coze/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: testMessage,
        userInfo: userInfo, // 首次消息传递用户信息
        conversationId: undefined, // 首次消息没有对话ID
        userId: userId
      })
    })
    
    console.log('📡 聊天API响应状态:', chatResponse.status)
    
    if (chatResponse.ok) {
      const chatData = await chatResponse.json()
      console.log('✅ 聊天API调用成功')
      console.log('🤖 AI回复:', chatData.response?.substring(0, 200) + '...')
      console.log('🔑 对话ID:', chatData.conversationId)
      console.log('🔐 认证方式:', chatData.authMethod)
    } else {
      const errorData = await chatResponse.json()
      console.log('❌ 聊天API调用失败')
      console.log('🚨 错误信息:', errorData.error)
      console.log('📋 错误详情:', errorData.details)
    }
    
    // 3. 测试后续消息（不传递用户信息）
    console.log('\n3️⃣ 测试后续消息（不传递用户信息）...')
    const followUpResponse = await fetch('http://localhost:3000/api/coze/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: '请介绍一下我的性格特点',
        userInfo: undefined, // 后续消息不传递用户信息
        conversationId: 'fake_conversation_id', // 模拟对话ID
        userId: userId
      })
    })
    
    console.log('📡 后续消息响应状态:', followUpResponse.status)
    
    if (followUpResponse.ok) {
      const followUpData = await followUpResponse.json()
      console.log('✅ 后续消息调用成功')
      console.log('🤖 AI回复:', followUpData.response?.substring(0, 200) + '...')
    } else {
      const errorData = await followUpResponse.json()
      console.log('❌ 后续消息调用失败')
      console.log('🚨 错误信息:', errorData.error)
    }
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message)
  }
}

// 运行测试
testChatPrompt()
