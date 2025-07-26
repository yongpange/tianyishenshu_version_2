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

    // 快速准备基础上下文消息（不等待八字排盘，提高响应速度）
    const contextMessage = userInfo ? `
用户信息：
- 昵称：${userInfo.name || userInfo.nickname || '用户'}
- 性别：${userInfo.gender === 'male' ? '男' : userInfo.gender === 'female' ? '女' : userInfo.gender}
- 出生日期：${userInfo.year}年${userInfo.month}月${userInfo.day}日
- 出生时间：${userInfo.hour}时${userInfo.minute}分
- 出生地区：${formatAreaDisplay(userInfo.area)}

用户问题：${message}
` : message

    // 移除重复的contextMessage声明，使用上面的快速版本

    console.log('📝 发送给Coze的上下文消息:', contextMessage.substring(0, 200) + '...')

    // 快速获取用户token（简化流程以提高响应速度）
    let accessToken: string | null = null
    let authMethod = 'PAT Token' // 默认认证方式
    let userProfileId: string | null = null

    // 🚀 快速模式：只尝试最直接的方式，如果失败则使用系统token
    console.log('🚀 快速获取token模式启动')
    
    if (consistentUserId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(consistentUserId)) {
      userProfileId = consistentUserId
      console.log('⚡ 使用UUID格式的用户ID:', userProfileId)
      
      try {
        // 快速获取token，设置较短的超时时间
        const tokenResponse = await Promise.race([
          fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/user-profiles/coze-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userProfileId })
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Token获取超时')), 2000)
          )
        ]) as Response

        const tokenResult = await tokenResponse.json()

        if (tokenResult.success && tokenResult.token) {
          accessToken = tokenResult.token
          authMethod = tokenResult.cached ? 'JWT OAuth (cached)' : 'JWT OAuth (new)'
          console.log('⚡ 快速获取Access Token成功:', authMethod)
        }
      } catch (error) {
        console.warn('⚠️ 快速token获取失败，将使用系统token:', error)
      }
    }

    // 创建Coze客户端
    let coze: any
    console.log('🔍 accessToken:', accessToken)
    if (accessToken) {
      // 使用用户的Access Token
      coze = new CozeAPI({
        token: accessToken,
        baseURL: `https://${process.env.COZE_API_BASE || 'api.coze.cn'}`
      })
      console.log('🔐 使用用户Access Token创建客户端')
    } else {
      // 降级使用系统级认证，但仍优先尝试使用数据库中的token
      console.log('🔄 用户token获取失败，尝试系统级token管理')
      
      try {
        // 尝试从数据库中获取任何可用的有效token
        const { data: availableProfiles } = await supabase
          .from('user_profiles')
          .select('id, coze_access_token, coze_token_expires_at')
          .not('coze_access_token', 'is', null)
          .not('coze_token_expires_at', 'is', null)
          .limit(1)

        let systemAccessToken: string | null = null

        if (availableProfiles && availableProfiles.length > 0) {
          const profile = availableProfiles[0]
          const tokenExpiresAt = new Date(profile.coze_token_expires_at)
          const now = new Date()

          if (tokenExpiresAt > now) {
            // 有可用的有效token
            systemAccessToken = profile.coze_access_token
            authMethod = 'JWT OAuth (system cache)'
            console.log('✅ 使用数据库中的系统级token')
          } else {
            // token过期，尝试刷新
            console.log('🔄 数据库中的token已过期，尝试刷新')
            const { ensureUserCozeToken } = await import('@/lib/coze-auth')
            const tokenResult = await ensureUserCozeToken(profile.id)
            
            if (tokenResult.success && tokenResult.token) {
              systemAccessToken = tokenResult.token
              authMethod = 'JWT OAuth (system refresh)'
              console.log('✅ 系统级token刷新成功')
            }
          }
        }

        if (systemAccessToken) {
          coze = new CozeAPI({
            token: systemAccessToken,
            baseURL: `https://${process.env.COZE_API_BASE || 'api.coze.cn'}`
          })
          console.log('🔐 使用系统级Access Token创建客户端')
        } else {
          // 最后降级：生成新的系统级token
          console.log('🔄 无可用token，生成新的系统级token')
          const { createCozeClient } = await import('@/lib/coze-auth')
          const { client, authMethod: fallbackAuth } = await createCozeClient()
          coze = client
          authMethod = fallbackAuth
          console.log('🔄 使用新生成的系统级认证:', authMethod)
        }

      } catch (systemError) {
        console.error('❌ 系统级token管理失败:', systemError)
        // 最终降级：直接使用JWT认证
        console.log('🔄 降级到直接JWT认证')
        const { createCozeClient } = await import('@/lib/coze-auth')
        const { client, authMethod: fallbackAuth } = await createCozeClient()
        coze = client
        authMethod = fallbackAuth
        console.log('🔄 使用直接JWT认证:', authMethod)
      }
    }

    // 调用 Coze 智能体 - 使用流式输出（支持token自动刷新）
    const callCozeAPI = async (retryCount = 0) => {
      try {
        return await coze.chat.stream({
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
      } catch (error: any) {
        console.error('❌ Coze API调用失败:', {
          error: error.message,
          status: error.status,
          retryCount,
          hasAccessToken: !!accessToken,
          hasUserProfileId: !!userProfileId
        })

        // 检查是否是token相关错误
        const isTokenError = error?.message?.includes('401') || 
                            error?.message?.includes('Unauthorized') ||
                            error?.message?.includes('4101') ||
                            error?.message?.includes('incorrect') ||
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
              coze = new CozeAPI({
                token: tokenResult.token,
                baseURL: `https://${process.env.COZE_API_BASE || 'api.coze.cn'}`
              })

              // 递归重试（只重试一次）
              return await callCozeAPI(1)
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
    console.log('� 开始流式处理...')

    // 创建流式响应
    const encoder = new TextEncoder()
    let finalConversationId = ''
    let finalChatId = ''
    let fullResponse = ''
    let hasReceivedData = false
    let streamTimeout: NodeJS.Timeout

    const readableStream = new ReadableStream({
      async start(controller) {
        // 🚀 立即发送开始信号，让前端马上显示"正在思考"状态
        const startData = JSON.stringify({
          type: 'start',
          message: 'AI正在思考中...',
          timestamp: new Date().toISOString()
        })
        controller.enqueue(encoder.encode(`data: ${startData}\n\n`))
        console.log('🚀 已发送开始信号给前端')

        // 添加超时机制，如果30秒内没有收到任何数据，则超时
        streamTimeout = setTimeout(() => {
          if (!hasReceivedData) {
            console.error('❌ 流式处理超时：30秒内没有收到任何数据')
            const errorData = JSON.stringify({
              type: 'error',
              error: '流式处理超时，请检查网络连接或稍后重试'
            })
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
            controller.close()
          }
        }, 30000)

        try {
          for await (const chunk of stream) {
            hasReceivedData = true
            console.log('📦 收到流式数据块:', {
              event: chunk.event,
              hasData: !!chunk.data,
              dataKeys: chunk.data ? Object.keys(chunk.data) : [],
              rawChunk: JSON.stringify(chunk, null, 2).substring(0, 500)
            })

            // 保存对话信息
            if (chunk.event === 'conversation.chat.created') {
              finalConversationId = chunk.data?.conversation_id || ''
              finalChatId = chunk.data?.id || ''
              console.log('💬 对话创建:', { finalConversationId, finalChatId })
            }

            // 处理消息内容 - 增加更多的事件类型检测
            if (chunk.event === 'conversation.message.delta' || 
                chunk.event === 'message.delta' ||
                chunk.event === 'conversation.message.completed' ||
                chunk.event === 'message.completed') {
              
              const content = chunk.data?.content || chunk.data?.text || chunk.data?.message || ''
              console.log('📝 收到消息内容:', {
                event: chunk.event,
                content: content.substring(0, 100),
                contentLength: content.length,
                dataStructure: chunk.data ? Object.keys(chunk.data) : []
              })
              
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

            // 处理完成事件 - 增加更多的完成事件类型
            if (chunk.event === 'conversation.chat.completed' ||
                chunk.event === 'chat.completed' ||
                chunk.event === 'conversation.completed' ||
                chunk.event === 'done') {
              console.log('✅ 对话完成，事件类型:', chunk.event)

              // 清除超时
              if (streamTimeout) {
                clearTimeout(streamTimeout)
              }

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

              // 打印认证信息到服务器控制台
              console.log('🔐 聊天完成 - 认证信息汇总:')
              console.log('   认证方式:', authMethod)
              console.log('   Token类型:', accessToken ? '用户Token' : '系统Token')
              console.log('   Token前缀:', accessToken ? 
                `${accessToken.substring(0, 12)}...` : '系统级Token')
              console.log('   用户ID:', consistentUserId)
              console.log('   消息长度:', fullResponse.length)

              const finalData = JSON.stringify({
                type: 'done',
                fullResponse: fullResponse,
                conversationId: finalConversationId,
                chatId: finalChatId,
                authMethod: authMethod,
                remainingCount: remainingCount,
                authInfo: {
                  method: authMethod,
                  tokenType: accessToken ? '用户Token' : '系统Token',
                  tokenPrefix: accessToken ? `${accessToken.substring(0, 12)}...` : '系统级Token',
                  userId: consistentUserId
                }
              })
              controller.enqueue(encoder.encode(`data: ${finalData}\n\n`))
              controller.close()
              return
            }

            // 处理错误事件 - 增加更多的错误事件类型
            if (chunk.event === 'conversation.chat.failed' ||
                chunk.event === 'chat.failed' ||
                chunk.event === 'error') {
              console.error('❌ 对话失败:', {
                event: chunk.event,
                data: chunk.data,
                error: chunk.error
              })
              const errorData = JSON.stringify({
                type: 'error',
                error: chunk.data?.error || chunk.error || '对话生成失败，请重试'
              })
              controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
              controller.close()
              return
            }
          }

          // 清除超时
          if (streamTimeout) {
            clearTimeout(streamTimeout)
          }

          // 如果循环结束但没有收到完成事件，发送完成信号
          if (fullResponse) {
            console.log('🔚 流式处理结束，发送最终响应:', fullResponse.length, '字符')
            
            // 打印认证信息到服务器控制台
            console.log('🔐 聊天完成 - 认证信息汇总:')
            console.log('   认证方式:', authMethod)
            console.log('   Token类型:', accessToken ? '用户Token' : '系统Token')
            console.log('   Token前缀:', accessToken ? 
              `${accessToken.substring(0, 12)}...` : '系统级Token')
            console.log('   用户ID:', consistentUserId)
            console.log('   消息长度:', fullResponse.length)
            
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
          } else {
            console.warn('⚠️ 流式处理结束但没有收到任何内容')
            const errorData = JSON.stringify({
              type: 'error',
              error: '未收到AI回复，请重试'
            })
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
          }
          
          controller.close()
        } catch (error) {
          // 清除超时
          if (streamTimeout) {
            clearTimeout(streamTimeout)
          }
          
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