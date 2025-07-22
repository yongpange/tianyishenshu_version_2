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

    // 获取八字排盘上下文 - 数据库优先
    let astrologyContext = ''
    if (userInfo) {
      try {
        // 尝试从用户ID获取八字上下文
        let baziUserId: string | undefined
        let isUserProfileId = false
        
        if (consistentUserId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(consistentUserId)) {
          // 如果是UUID格式，假设是user_profiles.id
          baziUserId = consistentUserId
          isUserProfileId = true
          console.log('🆔 使用UUID格式的用户ID:', baziUserId)
        } else {
          // 尝试获取user_profiles.id
          const { supabaseAdmin } = await import('@/lib/supabase')
          try {
            let userId = userInfo.user_id || userInfo.userId || consistentUserId
            
            if (userId) {
              console.log('🔍 尝试转换用户ID到user_profiles.id:', userId)
              
              // 先尝试作为users.id查询
              let userRecord = null
              if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
                const { data } = await supabaseAdmin
                  .from('users')
                  .select('id')
                  .eq('id', userId)
                  .single()
                userRecord = data
              }
              
              // 如果不是users.id，尝试作为手机号查询
              if (!userRecord) {
                // 从consistentUserId中提取手机号（去掉user_前缀）
                const phoneNumber = userId.replace(/^user_/, '')
                const { data } = await supabaseAdmin
                  .from('users')
                  .select('id')
                  .eq('phone_number', phoneNumber)
                  .single()
                userRecord = data
              }
              
              if (userRecord) {
                const { data: userProfile } = await supabaseAdmin
                  .from('user_profiles')
                  .select('id')
                  .eq('user_id', userRecord.id)
                  .single()
                
                if (userProfile?.id) {
                  baziUserId = userProfile.id
                  isUserProfileId = true
                  console.log('✅ 成功获取user_profiles.id:', baziUserId)
                } else {
                  console.warn('⚠️ 未找到用户资料:', userRecord.id)
                }
              } else {
                console.warn('⚠️ 未找到用户记录:', userId)
              }
            }
          } catch (error) {
            console.warn('⚠️ 无法获取user_profiles.id，将跳过八字排盘:', error)
          }
        }
        
        astrologyContext = await getAstrologyContext(userInfo, baziUserId)
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

    // 获取用户的Access Token（优先使用缓存）
    let accessToken: string | null = null
    let authMethod = 'PAT Token' // 默认认证方式
    let userProfileId: string | null = null

    // 尝试多种方式获取用户的user_profile.id
    try {
      console.log('🔍 开始获取用户Profile ID...')
      console.log('  consistentUserId:', consistentUserId)
      console.log('  userInfo存在:', !!userInfo)
      
      // 方式1: 如果consistentUserId是UUID格式，直接作为user_profile.id使用
      if (consistentUserId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(consistentUserId)) {
        console.log('🆔 consistentUserId是UUID格式，尝试作为user_profile.id使用')
        const { data: checkProfile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('id', consistentUserId)
          .single()
        
        if (checkProfile) {
          userProfileId = consistentUserId
          console.log('✅ 直接使用UUID作为user_profile.id:', userProfileId)
        }
      }

      // 方式2: 通过userInfo中的用户ID查询
      if (!userProfileId && userInfo && (userInfo.user_id || userInfo.userId)) {
        console.log('🔍 通过userInfo.user_id查询user_profile.id')
        const userId = userInfo.user_id || userInfo.userId
        
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('user_id', userId)
          .single()

        if (userProfile?.id) {
          userProfileId = userProfile.id
          console.log('✅ 通过userInfo.user_id找到user_profile.id:', userProfileId)
        }
      }

      // 方式3: 通过手机号查询
      if (!userProfileId && consistentUserId) {
        console.log('🔍 通过手机号查询user_profile.id')
        // 从consistentUserId中提取手机号（去掉user_前缀）
        const phoneNumber = consistentUserId.replace(/^user_/, '')
        
        if (/^1[3-9]\d{9}$/.test(phoneNumber)) {
          console.log('📱 提取到手机号:', phoneNumber)
          
          const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('phone_number', phoneNumber)
            .single()

          if (user) {
            const { data: userProfile } = await supabase
              .from('user_profiles')
              .select('id')
              .eq('user_id', user.id)
              .single()

            if (userProfile?.id) {
              userProfileId = userProfile.id
              console.log('✅ 通过手机号找到user_profile.id:', userProfileId)
            }
          }
        }
      }

      // 如果找到了userProfileId，获取该用户的token
      if (userProfileId) {
        console.log('🔑 为用户获取Access Token:', userProfileId)
        
        // 调用token管理API
        const tokenResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/user-profiles/coze-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userProfileId: userProfileId
          })
        })

        const tokenResult = await tokenResponse.json()

        if (tokenResult.success && tokenResult.token) {
          accessToken = tokenResult.token
          authMethod = tokenResult.cached ? 'JWT OAuth (cached)' : 'JWT OAuth (new)'
          console.log('✅ 成功获取用户Access Token:', authMethod)
        } else {
          console.warn('⚠️ 获取用户Access Token失败:', tokenResult.message)
        }
      } else {
        console.log('❌ 未能找到用户Profile ID')
      }

    } catch (error) {
      console.error('❌ 获取用户Access Token失败:', error)
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
        // 检查是否是token过期错误
        const isTokenExpired = error?.message?.includes('401') || 
                              error?.message?.includes('Unauthorized') ||
                              error?.status === 401

        if (isTokenExpired && retryCount === 0 && (accessToken || userProfileId)) {
          console.log('🔄 Token可能过期，尝试刷新...')
          
          try {
            // 使用之前获取到的userProfileId或重新获取
            let refreshUserProfileId = userProfileId
            
            if (!refreshUserProfileId) {
              console.log('🔍 重新获取用户Profile ID用于token刷新')
              
              // 重新使用多种方式获取用户ID
              if (consistentUserId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(consistentUserId)) {
                const { data: checkProfile } = await supabase
                  .from('user_profiles')
                  .select('id')
                  .eq('id', consistentUserId)
                  .single()
                
                if (checkProfile) {
                  refreshUserProfileId = consistentUserId
                }
              }
              
              if (!refreshUserProfileId && userInfo && (userInfo.user_id || userInfo.userId)) {
                const { data: userProfile } = await supabase
                  .from('user_profiles')
                  .select('id')
                  .eq('user_id', userInfo.user_id || userInfo.userId)
                  .single()
                
                if (userProfile?.id) {
                  refreshUserProfileId = userProfile.id
                }
              }
              
              if (!refreshUserProfileId && consistentUserId) {
                const phoneNumber = consistentUserId.replace(/^user_/, '')
                if (/^1[3-9]\d{9}$/.test(phoneNumber)) {
                  const { data: user } = await supabase
                    .from('users')
                    .select('id')
                    .eq('phone_number', phoneNumber)
                    .single()
                  
                  if (user) {
                    const { data: userProfile } = await supabase
                      .from('user_profiles')
                      .select('id')
                      .eq('user_id', user.id)
                      .single()
                    
                    if (userProfile?.id) {
                      refreshUserProfileId = userProfile.id
                    }
                  }
                }
              }
            }

            if (refreshUserProfileId) {
              const tokenResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/user-profiles/coze-token`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userProfileId: refreshUserProfileId,
                  forceRefresh: true
                })
              })

              const tokenResult = await tokenResponse.json()

              if (tokenResult.success && tokenResult.token) {
                console.log('✅ Token刷新成功，重试API调用')
                
                // 使用新token重新创建客户端
                coze = new CozeAPI({
                  token: tokenResult.token,
                  baseURL: `https://${process.env.COZE_API_BASE || 'api.coze.cn'}`
                })

                // 递归重试（只重试一次）
                return await callCozeAPI(1)
              }
            }
          } catch (refreshError) {
            console.error('❌ Token刷新失败:', refreshError)
          }
        }

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

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            // console.log('📦 收到流式数据块:', chunk.event)

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