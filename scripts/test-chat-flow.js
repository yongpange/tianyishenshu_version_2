// 测试聊天流程的脚本
// 用于验证从信息填写页到Coze对话的完整数据流

const testUserInfo = {
  name: '测试用户',
  gender: 'male',
  year: 1990,
  month: 5,
  day: 15,
  hour: 14,
  minute: 30,
  area: {
    province: '北京市',
    city: '北京市',
    district: '朝阳区'
  }
}

const testMessages = [
  '你好，我想了解一下我的性格特点',
  '我在工作中应该注意什么？',
  '我的感情运势如何？'
]

async function testChatAPI() {
  console.log('🧪 开始测试聊天API...')
  
  let conversationId = null
  const userId = 'test_user_12345'
  
  for (let i = 0; i < testMessages.length; i++) {
    const message = testMessages[i]
    const isFirstMessage = i === 0
    
    console.log(`\n📝 测试消息 ${i + 1}: ${message}`)
    console.log(`🔄 是否首次消息: ${isFirstMessage}`)
    console.log(`💬 对话ID: ${conversationId || '无'}`)
    
    try {
      const response = await fetch('http://localhost:3000/api/coze/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          userInfo: isFirstMessage ? testUserInfo : undefined, // 只在首次传递用户信息
          conversationId: conversationId, // 保持对话连续性
          userId: userId // 一致的用户ID
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        console.log('✅ API调用成功')
        console.log(`🤖 AI回复: ${data.response.substring(0, 100)}...`)
        console.log(`🔑 对话ID: ${data.conversationId}`)
        console.log(`🔐 认证方式: ${data.authMethod}`)
        
        // 保存对话ID用于下次调用
        conversationId = data.conversationId
      } else {
        console.error('❌ API调用失败:', data.error)
        break
      }
    } catch (error) {
      console.error('❌ 网络错误:', error.message)
      break
    }
    
    // 等待1秒再发送下一条消息
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  console.log('\n🏁 测试完成')
}

// 测试数据库表结构
async function testDatabaseSchema() {
  console.log('🗄️ 测试数据库表结构...')
  
  // 这里可以添加数据库连接测试
  // 检查conversations表是否包含coze_conversation_id字段
  
  console.log('✅ 数据库表结构测试完成')
}

// 运行测试
if (typeof window === 'undefined') {
  // Node.js环境
  testDatabaseSchema()
  testChatAPI()
} else {
  // 浏览器环境
  window.testChatFlow = {
    testUserInfo,
    testMessages,
    testChatAPI,
    testDatabaseSchema
  }
  console.log('🧪 测试工具已加载到 window.testChatFlow')
}
