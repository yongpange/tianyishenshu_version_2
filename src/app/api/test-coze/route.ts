import { NextRequest, NextResponse } from 'next/server'
import { createCozeClient, validateBotId, checkAuthConfig } from '@/lib/coze-auth'
import { ChatStatus, RoleType } from '@coze/api'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 开始测试Coze API...')
    
    // 1. 检查认证配置
    try {
      checkAuthConfig()
      console.log('✅ 认证配置检查通过')
    } catch (configError) {
      console.error('❌ 认证配置检查失败:', configError)
      return NextResponse.json({
        success: false,
        error: '认证配置检查失败',
        details: configError instanceof Error ? configError.message : String(configError)
      }, { status: 500 })
    }

    // 2. 验证Bot ID
    let botId: string
    try {
      botId = validateBotId(process.env.BOT_ID)
      console.log('✅ Bot ID验证通过:', botId)
    } catch (botError) {
      console.error('❌ Bot ID验证失败:', botError)
      return NextResponse.json({
        success: false,
        error: 'Bot ID验证失败',
        details: botError instanceof Error ? botError.message : String(botError)
      }, { status: 500 })
    }

    // 3. 创建Coze客户端
    let coze: any
    let authMethod: string
    try {
      const result = await createCozeClient()
      coze = result.client
      authMethod = result.authMethod
      console.log('✅ Coze客户端创建成功，认证方式:', authMethod)
    } catch (authError) {
      console.error('❌ Coze客户端创建失败:', authError)
      return NextResponse.json({
        success: false,
        error: 'Coze客户端创建失败',
        details: authError instanceof Error ? authError.message : String(authError)
      }, { status: 500 })
    }

    // 4. 调用Coze API
    try {
      console.log('🚀 调用Coze API...')
      const result = await coze.chat.createAndPoll({
        bot_id: botId,
        user_id: 'test_user_' + Date.now(),
        additional_messages: [
          {
            role: RoleType.User,
            content: '你好，这是一个测试消息',
            content_type: 'text',
          },
        ],
      })

      console.log('📡 Coze API响应:', {
        status: result.chat.status,
        conversation_id: result.chat.conversation_id,
        messages_count: result.messages?.length || 0
      })

      if (result.chat.status === ChatStatus.COMPLETED && result.messages) {
        const aiMessage = result.messages.find(
          (msg: any) => msg.role === RoleType.Assistant && msg.type === 'answer'
        )

        return NextResponse.json({
          success: true,
          response: aiMessage?.content || '无AI回复',
          conversationId: result.chat.conversation_id,
          authMethod: authMethod,
          debug: {
            chatStatus: result.chat.status,
            messagesCount: result.messages?.length || 0,
            aiMessageFound: !!aiMessage
          }
        })
      } else {
        console.log('❌ Chat未完成或无消息:', {
          status: result.chat.status,
          hasMessages: !!result.messages,
          messagesCount: result.messages?.length || 0
        })
        return NextResponse.json({
          success: false,
          error: '智能体响应失败',
          details: `Chat状态: ${result.chat.status}, 消息数量: ${result.messages?.length || 0}`
        }, { status: 500 })
      }

    } catch (apiError) {
      console.error('❌ Coze API调用失败:', apiError)
      return NextResponse.json({
        success: false,
        error: 'Coze API调用失败',
        details: apiError instanceof Error ? apiError.message : String(apiError)
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ 测试API总体错误:', error)
    return NextResponse.json({
      success: false,
      error: '服务器内部错误',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
