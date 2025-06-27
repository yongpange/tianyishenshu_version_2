import { NextRequest, NextResponse } from 'next/server'
import { CozeAPI, COZE_CN_BASE_URL, ChatStatus, RoleType } from '@coze/api'

// 环境变量配置
const COZE_API_TOKEN = process.env.COZE_API_TOKEN || ''
const COZE_BOT_ID = process.env.BOT_ID || ''

// 初始化 Coze API 客户端
const coze = new CozeAPI({
  token: COZE_API_TOKEN,
  baseURL: COZE_CN_BASE_URL, // 使用国内版本
})

export async function POST(request: NextRequest) {
  try {
    const { message, userInfo, conversationId } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: '消息内容不能为空' },
        { status: 400 }
      )
    }

    if (!COZE_API_TOKEN || !COZE_BOT_ID) {
      return NextResponse.json(
        { error: 'Coze API配置缺失，请检查环境变量' },
        { status: 500 }
      )
    }

    // 构建用户上下文信息
    const contextMessage = userInfo ? `
用户信息：
- 昵称：${userInfo.nickname}
- 性别：${userInfo.gender === 'male' ? '男' : '女'}
- 出生日期：${userInfo.year}年${userInfo.month}月${userInfo.day}日
- 出生时间：${userInfo.hour}时${userInfo.minute}分
- 出生地区：${userInfo.area?.province} ${userInfo.area?.city} ${userInfo.area?.county}

用户问题：${message}
` : message

    // 调用 Coze 智能体
    const result = await coze.chat.createAndPoll({
      bot_id: COZE_BOT_ID,
      user_id: 'user_' + Date.now(), // 生成唯一用户ID
      additional_messages: [
        {
          role: RoleType.User,
          content: contextMessage,
          content_type: 'text',
        },
      ],
      conversation_id: conversationId, // 如果有对话ID则传入，用于保持对话连续性
    })

    if (result.chat.status === ChatStatus.COMPLETED && result.messages) {
      // 找到AI的回复
      const aiMessage = result.messages.find(
        msg => msg.role === RoleType.Assistant && msg.type === 'answer'
      )

      return NextResponse.json({
        success: true,
        response: aiMessage?.content || '抱歉，我现在无法回答这个问题。',
        conversationId: result.chat.conversation_id,
        chatId: result.chat.id,
      })
    } else {
      return NextResponse.json(
        { error: '智能体响应失败', status: result.chat.status },
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