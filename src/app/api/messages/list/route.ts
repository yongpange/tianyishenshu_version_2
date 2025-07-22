import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { conversationId, limit, offset = 0 } = await request.json()

    if (!conversationId) {
      return NextResponse.json(
        { error: 'MISSING_CONVERSATION_ID', message: '缺少对话ID' },
        { status: 400 }
      )
    }

    console.log('📋 获取对话消息:', { conversationId, limit, offset })

    // 验证对话是否存在
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id, title, user_id')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'CONVERSATION_NOT_FOUND', message: '对话不存在' },
        { status: 404 }
      )
    }

    // 构建查询
    let query = supabaseAdmin
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('message_index', { ascending: true })

    // 如果指定了限制，应用分页
    if (limit) {
      query = query.range(offset, offset + limit - 1)
    }

    const { data: messages, error: messagesError } = await query

    if (messagesError) {
      console.error('❌ 获取消息失败:', messagesError)
      return NextResponse.json(
        { error: 'QUERY_FAILED', message: '查询消息失败' },
        { status: 500 }
      )
    }

    // 获取总消息数量（用于分页）
    const { count, error: countError } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)

    if (countError) {
      console.warn('⚠️ 获取消息总数失败:', countError)
    }

    console.log('✅ 成功获取消息:', messages?.length || 0, '条')

    return NextResponse.json({
      success: true,
      messages: messages || [],
      conversation: {
        id: conversation.id,
        title: conversation.title,
        user_id: conversation.user_id
      },
      pagination: {
        total: count || 0,
        offset: offset,
        limit: limit,
        hasMore: count ? (offset + (messages?.length || 0)) < count : false
      }
    })

  } catch (error) {
    console.error('❌ 获取消息失败:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 }
    )
  }
} 