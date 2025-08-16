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

const supabaseAdmin = createClient(
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
    const requestBody = await request.json()
    const { message, userInfo, conversationId, dbConversationId, userId, userProfileId: requestUserProfileId } = requestBody
    
    // 🔍 完整请求体调试信息
    console.log('🔍 Coze Chat API 收到请求:', {
      hasMessage: !!message,
      hasUserInfo: !!userInfo,
      conversationId: conversationId || 'undefined',
      dbConversationId: dbConversationId || 'undefined',
      userId: userId || 'undefined',
      requestUserProfileId: requestUserProfileId || 'undefined',
      requestBodyKeys: Object.keys(requestBody)
    })

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

    // 🔧 修复：优先使用userProfileId，确保参数一致性
    const consistentUserId = requestUserProfileId || userId || `user_${Date.now()}`
    console.log('🔑 Coze API参数检查:')
    console.log('   原始userId:', userId)
    console.log('   传入requestUserProfileId:', requestUserProfileId)
    console.log('   最终使用consistentUserId:', consistentUserId)

    // 检查并更新聊天次数（仅对user_profiles.id格式的用户）
    if (consistentUserId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(consistentUserId)) {
      console.log('🔍 检查用户聊天次数:', consistentUserId)
      
      const chatCountResult = await updateChatCount(consistentUserId)
      if (!chatCountResult.success) {
        console.error('❌ 聊天次数检查失败:', chatCountResult.error)
        return NextResponse.json(
          { error: chatCountResult.error || '聊天次数检查失败' },
          { status: 400 }
        )
      }

      console.log('✅ 聊天次数检查通过，剩余次数:', chatCountResult.remainingCount)
    } else {
      console.log('⚠️ 用户ID格式不是UUID，跳过聊天次数检查')
    }

    // 获取认证token
    const { client: coze, authMethod } = await createCozeClient(requestUserProfileId)
    const accessToken = null // 简化处理，在createCozeClient中已处理token
    const userProfileId = requestUserProfileId

    console.log('🎯 准备调用Coze API')
    console.log('   BOT_ID:', COZE_BOT_ID)
    console.log('   认证方式:', authMethod)
    console.log('   用户消息长度:', message.length)

    // 🎯 API调用参数配置 - 使用stream: true启用流式响应
    const apiParams: any = {
      bot_id: COZE_BOT_ID,
      user_id: consistentUserId,
      stream: true, // 启用流式响应
      auto_save_history: true,
      additional_messages: [
        {
          role: 'user' as const,
          content: message,
          content_type: 'text' as const
        }
      ]
    }

    // 🔧 添加对话ID（如果存在）
    if (conversationId) {
      apiParams.conversation_id = conversationId
    }

    console.log('📋 最终API调用参数:', {
      ...apiParams,
      additional_messages: apiParams.additional_messages.map((msg: any) => ({
        ...msg,
        content: `${msg.content.substring(0, 50)}...`
      }))
    })

    // 带重试机制的API调用函数
    const callCozeAPI = async (retryCount = 0) => {
      try {
        return await coze.chat.stream({
          ...apiParams
        })
      } catch (error: any) {
        console.error(`❌ Coze API调用失败 (尝试 ${retryCount + 1}):`, {
          message: error?.message,
          status: error?.status,
          data: error?.data
        })

        // 检查是否是token相关错误
        const isTokenError = 
          error?.message?.includes('authorization') ||
          error?.message?.includes('token') ||
          error?.message?.includes('Unauthorized') ||
          error?.status === 401

        if (isTokenError && retryCount === 0 && userProfileId) {
          console.log('🔄 检测到token错误，尝试强制刷新token...')
          
          try {
            // 强制刷新token
            const tokenResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/user-profiles/coze-token`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userProfileId: userProfileId,
                forceRefresh: true
              })
            })

            const tokenResult = await tokenResponse.json()

            if (tokenResult.success && tokenResult.token) {
              console.log('✅ Token强制刷新成功，重试API调用')
              
              // 使用新token重新创建客户端
              const newCoze = new CozeAPI({
                token: tokenResult.token,
                baseURL: `https://${process.env.COZE_API_BASE || 'api.coze.cn'}`
              })
              
              // 递归重试（只重试一次）
              return await newCoze.chat.stream({ ...apiParams })
            } else {
              console.error('❌ Token刷新失败:', tokenResult.message)
              throw new Error(`Token刷新失败: ${tokenResult.message}`)
            }
          } catch (refreshError) {
            console.error('❌ Token刷新过程失败:', refreshError)
            throw new Error(`Token刷新失败: ${refreshError instanceof Error ? refreshError.message : String(refreshError)}`)
          }
        }

        // 如果不是token错误，或者重试次数已达上限，或者没有userProfileId，直接抛出错误
        throw error
      }
    }

    const stream = await callCozeAPI()
    console.log('🚀 开始流式处理...')

    // ✨ 核心重构：分离AI接收和前端发送
    const {
      readableStream,
      backgroundProcessPromise
    } = await createSeparatedStreamProcessing(
      stream,
      dbConversationId,
      consistentUserId,
      conversationId,
      authMethod,
      accessToken
    )

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

// ✨ 新增：分离的流式处理函数
async function createSeparatedStreamProcessing(
  stream: any,
  dbConversationId: string,
  consistentUserId: string,
  conversationId: string,
  authMethod: string,
  accessToken: string | null
) {
  const encoder = new TextEncoder()
  
  // 共享的状态变量
  let fullResponse = ''
  let finalConversationId = ''
  let finalChatId = ''
  let hasReceivedData = false
  let isCompleted = false
  
  // 前端连接状态追踪
  let isFrontendConnected = true
  
  // 🔥 后台独立处理AI流式接收 - 这个Promise确保完整消息被保存
  const backgroundProcessPromise = (async () => {
    console.log('🔄 开始后台独立处理AI流式接收')
    
    try {
      for await (const chunk of stream) {
        hasReceivedData = true
        console.log('📦 后台收到流式数据块:', {
          event: chunk.event,
          hasData: !!chunk.data,
          isCompleted,
          fullResponseLength: fullResponse.length
        })

        // 保存对话信息
        if (chunk.event === 'conversation.chat.created') {
          finalConversationId = chunk.data?.conversation_id || ''
          finalChatId = chunk.data?.id || ''
          console.log('💬 后台记录对话创建:', { finalConversationId, finalChatId })
        }

        // 处理消息内容
        if (chunk.event === 'conversation.message.delta' || 
            chunk.event === 'message.delta' ||
            chunk.event === 'conversation.message.completed' ||
            chunk.event === 'message.completed') {
          
          const content = chunk.data?.content || chunk.data?.text || chunk.data?.message || ''
          
          if (content) {
            fullResponse += content
            console.log('📝 后台累积内容:', {
              newContentLength: content.length,
              totalLength: fullResponse.length
            })
          }
        }

        // 处理完成事件
        if (chunk.event === 'conversation.chat.completed' ||
            chunk.event === 'chat.completed' ||
            chunk.event === 'conversation.completed' ||
            chunk.event === 'done') {
          
          console.log('✅ 后台检测到对话完成，事件类型:', chunk.event)
          isCompleted = true
          break
        }
      }

      // 🔥 关键：无论前端是否连接，都要保存完整消息
      console.log('🔥 后台AI接收完成，开始保存完整消息:', {
        fullResponseLength: fullResponse.length,
        hasDbConversationId: !!dbConversationId,
        hasConsistentUserId: !!consistentUserId,
        isCompleted
      })

      if (fullResponse && dbConversationId && consistentUserId) {
        console.log('✅ 开始后台保存完整assistant消息')
        await saveAssistantMessageAsync(
          dbConversationId,
          fullResponse,
          finalConversationId,
          finalChatId,
          consistentUserId
        )
        console.log('✅ 后台保存完整assistant消息成功')
      } else {
        console.warn('⚠️ 后台保存跳过，缺少必要参数:', {
          hasFullResponse: !!fullResponse,
          fullResponseLength: fullResponse.length,
          hasDbConversationId: !!dbConversationId,
          hasConsistentUserId: !!consistentUserId
        })
      }

    } catch (error) {
      console.error('❌ 后台AI接收处理失败:', error)
      
      // 即使出错，也尝试保存已接收的内容
      if (fullResponse && dbConversationId && consistentUserId) {
        console.log('⚠️ 尝试保存部分接收的内容:', fullResponse.length, '字符')
        try {
          await saveAssistantMessageAsync(
            dbConversationId,
            fullResponse,
            finalConversationId,
            finalChatId,
            consistentUserId
          )
          console.log('✅ 部分内容保存成功')
        } catch (saveError) {
          console.error('❌ 部分内容保存也失败:', saveError)
        }
      }
    }
  })()

  // 🎯 前端流式响应 - 可以被中断但不影响后台处理
  const readableStream = new ReadableStream({
    async start(controller) {
      console.log('🚀 前端流式响应开始')
      
      // 立即发送开始信号
      const startData = JSON.stringify({
        type: 'start',
        message: 'AI正在思考中...',
        timestamp: new Date().toISOString()
      })
      controller.enqueue(encoder.encode(`data: ${startData}\n\n`))
      console.log('🚀 已发送开始信号给前端')

      // 前端流式发送逻辑
      let lastSentLength = 0
      
      // 定期检查并发送新内容给前端
      const sendInterval = setInterval(() => {
        try {
          // 检查是否有新内容需要发送
          if (fullResponse.length > lastSentLength) {
            const newContent = fullResponse.substring(lastSentLength)
            lastSentLength = fullResponse.length
            
            const data = JSON.stringify({
              type: 'content',
              content: newContent,
              conversationId: finalConversationId,
              chatId: finalChatId
            })
            
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            console.log('📤 发送新内容给前端:', newContent.length, '字符')
          }
          
          // 检查是否完成
          if (isCompleted && lastSentLength === fullResponse.length) {
            clearInterval(sendInterval)
            
            // 发送完成信号
            const finalData = JSON.stringify({
              type: 'done',
              fullResponse: fullResponse,
              conversationId: finalConversationId,
              chatId: finalChatId,
              authMethod: authMethod,
              authInfo: {
                method: authMethod,
                tokenType: accessToken ? '用户Token' : '系统Token',
                tokenPrefix: accessToken ? `${accessToken.substring(0, 12)}...` : '系统级Token',
                userId: consistentUserId
              }
            })
            
            controller.enqueue(encoder.encode(`data: ${finalData}\n\n`))
            console.log('🏁 前端流式响应完成')
            controller.close()
          }
        } catch (error) {
          console.error('❌ 前端发送过程出错:', error)
          clearInterval(sendInterval)
          
          // 标记前端连接断开，但不影响后台处理
          isFrontendConnected = false
          console.log('⚠️ 前端连接已断开，但后台处理继续进行')
          
          try {
            controller.close()
          } catch (closeError) {
            console.log('⚠️ 前端controller已关闭')
          }
        }
      }, 100) // 每100ms检查一次

      // 设置清理超时
      setTimeout(() => {
        if (!isCompleted) {
          console.log('⏰ 前端响应超时，关闭连接但后台继续处理')
          clearInterval(sendInterval)
          isFrontendConnected = false
          
          try {
            const timeoutData = JSON.stringify({
              type: 'error',
              error: '响应超时，但消息仍在后台处理中'
            })
            controller.enqueue(encoder.encode(`data: ${timeoutData}\n\n`))
            controller.close()
          } catch (error) {
            console.log('⚠️ 超时关闭时controller已无效')
          }
        }
      }, 120000) // 2分钟超时
    },
    
    cancel() {
      console.log('🚫 前端取消连接，但后台AI接收继续进行')
      isFrontendConnected = false
      // 不中断后台处理
    }
  })

  return {
    readableStream,
    backgroundProcessPromise
  }
}

// 异步保存assistant消息到数据库的函数
async function saveAssistantMessageAsync(
  conversationId: string,
  content: string,
  cozeConversationId: string,
  cozeChatId: string,
  userProfileId: string
): Promise<void> {
  try {
    console.log('💾 开始异步保存assistant消息:', {
      conversationId,
      contentLength: content.length,
      cozeConversationId,
      cozeChatId,
      userProfileId
    })

    // 获取该对话中消息的最大索引
    const { data: maxIndexResult, error: indexError } = await supabaseAdmin
      .from('messages')
      .select('message_index')
      .eq('conversation_id', conversationId)
      .order('message_index', { ascending: false })
      .limit(1)

    if (indexError) {
      console.error('❌ 获取消息索引失败:', indexError)
      // 继续执行，使用默认索引
    }

    const nextIndex = maxIndexResult && maxIndexResult.length > 0 
      ? maxIndexResult[0].message_index + 1 
      : 0

    console.log('📝 准备创建assistant消息，索引:', nextIndex)

    // 直接创建新的assistant消息，不做重复检查
    const { data: message, error: createError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: content,
        metadata: {
          coze_conversation_id: cozeConversationId,
          coze_chat_id: cozeChatId,
          user_profile_id: userProfileId,
          saved_by: 'backend_async',
          saved_at: new Date().toISOString()
        },
        message_index: nextIndex
      })
      .select('*')
      .single()

    if (createError) {
      console.error('❌ 创建assistant消息失败:', createError)
      console.error('❌ 创建失败详情:', JSON.stringify(createError, null, 2))
      throw new Error(`创建消息失败: ${createError.message}`)
    }

    console.log('✅ Assistant消息创建成功:', {
      messageId: message.id,
      messageIndex: nextIndex,
      conversationId,
      contentLength: content.length
    })

    // 更新对话的updated_at时间戳
    const { error: updateError } = await supabaseAdmin
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)

    if (updateError) {
      console.warn('⚠️ 更新对话时间戳失败:', updateError)
    } else {
      console.log('✅ 对话时间戳更新成功')
    }

    console.log('✅ Assistant消息异步保存完成:', {
      messageId: message.id,
      messageIndex: nextIndex,
      conversationId
    })

  } catch (error) {
    console.error('❌ 异步保存assistant消息失败:', error)
    console.error('❌ 错误详情:', JSON.stringify(error, null, 2))
    // 重新抛出错误，但不影响流式响应
    throw error
  }
}