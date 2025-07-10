import { NextRequest, NextResponse } from 'next/server'
import { CozeAPI, COZE_CN_BASE_URL, ChatStatus, RoleType } from '@coze/api'
import { getAstrologyContext } from '@/utils/personality-report'
import { createCozeClient } from '@/lib/coze-auth'
import { formatAreaDisplay } from '@/utils/client-utils'

// 环境变量配置
const COZE_BOT_ID = process.env.BOT_ID || ''



export async function POST(request: NextRequest) {
  try {
    const { message, userInfo, conversationId, userId } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: '消息内容不能为空' },
        { status: 400 }
      )
    }

    // 检查基本配置
    if (!COZE_BOT_ID) {
      return NextResponse.json(
        { error: 'Bot ID配置缺失' },
        { status: 500 }
      )
    }

    // 生成一致的用户ID（基于手机号或传入的userId）
    const consistentUserId = userId || `user_${Date.now()}`
    console.log('🔑 使用用户ID:', consistentUserId)

    // 获取八字排盘上下文
    let astrologyContext = ''
    if (userInfo) {
      try {
        astrologyContext = await getAstrologyContext(userInfo)
        console.log('✅ 成功获取八字排盘上下文')
      } catch (error) {
        console.warn('⚠️ 获取八字排盘上下文失败，将使用基础用户信息:', error)
        astrologyContext = ''
      }
    }

    // 构建用户上下文信息 - 修复字段映射问题
    const contextMessage = userInfo ? `
${astrologyContext ? astrologyContext : `用户信息：
- 昵称：${userInfo.name || userInfo.nickname || '用户'}
- 性别：${userInfo.gender === 'male' ? '男' : userInfo.gender === 'female' ? '女' : userInfo.gender}
- 出生日期：${userInfo.year}年${userInfo.month}月${userInfo.day}日
- 出生时间：${userInfo.hour}时${userInfo.minute}分
- 出生地区：${formatAreaDisplay(userInfo.area)}`}

用户问题：${message}
` : message

    console.log('📝 发送给Coze的上下文消息:', contextMessage.substring(0, 200) + '...')

    // 创建Coze客户端（支持JWT和PAT认证）
    const { client: coze, authMethod } = await createCozeClient()

    // 调用 Coze 智能体
    const result = await coze.chat.createAndPoll({
      bot_id: COZE_BOT_ID,
      user_id: consistentUserId, // 使用一致的用户ID
      additional_messages: [
        {
          role: RoleType.User,
          content: contextMessage,
          content_type: 'text',
        },
      ],
      conversation_id: conversationId, // 如果有对话ID则传入，用于保持对话连续性
    })
    console.log('🔑 AI返回结果: ', result)
    console.log('🔑 Chat状态: ', result.chat.status)
    console.log('🔑 Messages数量: ', result.messages?.length || 0)
    console.log('🔑 所有Messages: ', JSON.stringify(result.messages, null, 2))

    if (result.chat.status === ChatStatus.COMPLETED && result.messages) {
      // 找到AI的回复 - 尝试多种消息类型
      let aiMessage = result.messages.find(
        (msg: any) => msg.role === RoleType.Assistant && msg.type === 'answer'
      )

      // 如果没找到answer类型，尝试其他类型
      if (!aiMessage) {
        aiMessage = result.messages.find(
          (msg: any) => msg.role === RoleType.Assistant
        )
      }

      console.log('🔑 AI返回的aiMessage回复: ', aiMessage)
      console.log('🔑 AI返回的aiMessage.CONTENT回复: ', aiMessage?.content)

      const responseContent = aiMessage?.content || '抱歉，我现在无法回答这个问题。'

      return NextResponse.json({
        success: true,
        response: responseContent,
        conversationId: result.chat.conversation_id,
        chatId: result.chat.id,
        authMethod: authMethod, // 返回实际使用的认证方式
        debug: {
          chatStatus: result.chat.status,
          messagesCount: result.messages?.length || 0,
          aiMessageFound: !!aiMessage,
          aiMessageType: aiMessage?.type
        }
      })
    } else {
      console.log('❌ Chat未完成或无消息:', {
        status: result.chat.status,
        hasMessages: !!result.messages,
        messagesCount: result.messages?.length || 0
      })
      return NextResponse.json(
        { error: '智能体响应失败', status: result.chat.status, debug: result },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Coze API调用失败:', error)
    return NextResponse.json(
      { 
        error: 'AI服务暂时不可用，请稍后重试',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
} 