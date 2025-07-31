import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userProfileId, moduleType = 'personality' } = await request.json()

    if (!userProfileId) {
      return NextResponse.json(
        { error: 'MISSING_USER_PROFILE_ID', message: '缺少用户资料ID' },
        { status: 400 }
      )
    }

    console.log('📋 获取对话列表:', { userProfileId, moduleType })

    // 获取用户的对话列表，包含最新的3条消息预览
    const { data: conversations, error: conversationsError } = await supabaseAdmin
      .from('conversations')
      .select(`
        id,
        title,
        module_type,
        coze_conversation_id,
        is_pinned,
        is_manual_title,
        created_at,
        updated_at
      `)
      .eq('user_id', userProfileId)
      .eq('module_type', moduleType)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })

    if (conversationsError) {
      console.error('❌ 获取对话列表失败:', conversationsError)
      return NextResponse.json(
        { error: 'QUERY_FAILED', message: '查询对话列表失败' },
        { status: 500 }
      )
    }

    // 为每个对话获取最新的消息预览
    const conversationsWithMessages = await Promise.all(
      (conversations || []).map(async (conversation) => {
        // 获取该对话的最新3条消息
        const { data: messages, error: messagesError } = await supabaseAdmin
          .from('messages')
          .select('id, role, content, created_at, message_index')
          .eq('conversation_id', conversation.id)
          .order('message_index', { ascending: false })
          .limit(3)

        if (messagesError) {
          console.warn('⚠️ 获取对话消息失败:', conversation.id, messagesError)
        }

        return {
          ...conversation,
          messages: messages || [],
          messageCount: messages?.length || 0
        }
      })
    )

    console.log('✅ 成功获取对话列表:', conversationsWithMessages.length, '个对话')

    return NextResponse.json({
      success: true,
      conversations: conversationsWithMessages
    })

  } catch (error) {
    console.error('❌ 获取对话列表失败:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 }
    )
  }
} 