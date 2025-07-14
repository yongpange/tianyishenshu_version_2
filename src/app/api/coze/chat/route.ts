import { NextRequest, NextResponse } from 'next/server'
import { CozeAPI, COZE_CN_BASE_URL, ChatStatus, RoleType } from '@coze/api'
import { getAstrologyContext } from '@/utils/personality-report'
import { createCozeClient } from '@/lib/coze-auth'
import { formatAreaDisplay } from '@/utils/client-utils'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 环境变量配置
const COZE_BOT_ID = process.env.CHAT_BOT_ID || ''

// 更新聊天次数
async function updateChatCount(userId: string): Promise<{ success: boolean; remainingCount?: number; error?: string }> {
  try {
    // 先获取当前用户的聊天次数
    const { data: userProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('chat_remaining_count, chat_used_count, chat_total_count')
      .eq('id', userId)
      .single()

    if (fetchError) {
      console.error('❌ 获取用户聊天次数失败:', fetchError)
      return { success: false, error: '获取用户信息失败' }
    }

    if (!userProfile) {
      return { success: false, error: '用户不存在' }
    }

    // 检查剩余次数
    if (userProfile.chat_remaining_count <= 0) {
      return { success: false, error: '聊天次数已用完', remainingCount: 0 }
    }

    // 扣减次数
    const newRemainingCount = userProfile.chat_remaining_count - 1
    const newUsedCount = userProfile.chat_used_count + 1

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        chat_remaining_count: newRemainingCount,
        chat_used_count: newUsedCount
      })
      .eq('id', userId)

    if (updateError) {
      console.error('❌ 更新聊天次数失败:', updateError)
      return { success: false, error: '更新聊天次数失败' }
    }

    console.log('✅ 聊天次数更新成功:', {
      userId,
      newRemainingCount,
      newUsedCount
    })

    return { success: true, remainingCount: newRemainingCount }

  } catch (error) {
    console.error('❌ 更新聊天次数异常:', error)
    return { success: false, error: '系统错误' }
  }
}



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

    // 检查并更新聊天次数（仅对user_profiles.id格式的用户）
    if (consistentUserId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(consistentUserId)) {
      // 这是user_profiles.id格式（UUID）
      console.log('💬 检查用户聊天次数:', consistentUserId)
      
      const chatCountResult = await updateChatCount(consistentUserId)
      
      if (!chatCountResult.success) {
        return NextResponse.json(
          { 
            error: chatCountResult.error || '聊天次数检查失败',
            remainingCount: chatCountResult.remainingCount || 0
          },
          { status: 403 }
        )
      }
      
      console.log('✅ 聊天次数扣减成功，剩余次数:', chatCountResult.remainingCount)
    } else {
      // 对于手机号格式的用户，暂时跳过次数检查
      console.log('📱 手机号用户，跳过聊天次数检查')
    }

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

    // 调用 Coze 智能体 - 使用流式输出
    const stream = await coze.chat.stream({
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
    console.log('� 开始流式处理...')

    // 创建流式响应
    const encoder = new TextEncoder()
    let finalConversationId = ''
    let finalChatId = ''
    let fullResponse = ''

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            console.log('📦 收到流式数据块:', chunk.event)

            // 保存对话信息
            if (chunk.event === 'conversation.chat.created') {
              finalConversationId = chunk.data?.conversation_id || ''
              finalChatId = chunk.data?.id || ''
              console.log('💬 对话创建:', { finalConversationId, finalChatId })
            }

            // 处理消息内容
            if (chunk.event === 'conversation.message.delta') {
              const content = chunk.data?.content || ''
              if (content) {
                fullResponse += content
                // 发送流式数据到前端
                const data = JSON.stringify({
                  type: 'content',
                  content: content,
                  conversationId: finalConversationId,
                  chatId: finalChatId
                })
                controller.enqueue(encoder.encode(`data: ${data}\n\n`))
              }
            }

            // 处理完成事件
            if (chunk.event === 'conversation.chat.completed') {
              console.log('✅ 对话完成')

              // 获取更新后的聊天次数信息
              let remainingCount: number | undefined
              if (consistentUserId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(consistentUserId)) {
                try {
                  const { data: userProfile } = await supabase
                    .from('user_profiles')
                    .select('chat_remaining_count')
                    .eq('id', consistentUserId)
                    .single()

                  remainingCount = userProfile?.chat_remaining_count
                } catch (error) {
                  console.warn('⚠️ 获取剩余次数失败:', error)
                }
              }

              const finalData = JSON.stringify({
                type: 'done',
                fullResponse: fullResponse,
                conversationId: finalConversationId,
                chatId: finalChatId,
                authMethod: authMethod,
                remainingCount: remainingCount
              })
              controller.enqueue(encoder.encode(`data: ${finalData}\n\n`))
              controller.close()
              return
            }

            // 处理错误事件
            if (chunk.event === 'conversation.chat.failed') {
              console.error('❌ 对话失败:', chunk.data)
              const errorData = JSON.stringify({
                type: 'error',
                error: '对话生成失败，请重试'
              })
              controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
              controller.close()
              return
            }
          }
        } catch (error) {
          console.error('❌ 流式处理错误:', error)
          const errorData = JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : '未知错误'
          })
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
          controller.close()
        }
      }
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })

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