import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { conversationId, userProfileId } = await request.json()

    if (!conversationId || !userProfileId) {
      return NextResponse.json(
        { error: 'MISSING_REQUIRED_FIELDS', message: '缺少必要参数' },
        { status: 400 }
      )
    }

    console.log('🗑️ 删除对话:', { conversationId, userProfileId })

    // 验证对话是否存在且属于该用户
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id, user_id')
      .eq('id', conversationId)
      .eq('user_id', userProfileId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'CONVERSATION_NOT_FOUND', message: '对话不存在或无权限' },
        { status: 404 }
      )
    }

    // 首先删除该对话的所有消息
    const { error: messagesDeleteError } = await supabaseAdmin
      .from('messages')
      .delete()
      .eq('conversation_id', conversationId)

    if (messagesDeleteError) {
      console.error('❌ 删除对话消息失败:', messagesDeleteError)
      return NextResponse.json(
        { error: 'DELETE_MESSAGES_FAILED', message: '删除对话消息失败' },
        { status: 500 }
      )
    }

    console.log('✅ 对话消息删除成功')

    // 然后删除对话本身
    const { error: conversationDeleteError } = await supabaseAdmin
      .from('conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', userProfileId)

    if (conversationDeleteError) {
      console.error('❌ 删除对话失败:', conversationDeleteError)
      return NextResponse.json(
        { error: 'DELETE_CONVERSATION_FAILED', message: '删除对话失败' },
        { status: 500 }
      )
    }

    console.log('✅ 对话删除成功:', conversationId)

    return NextResponse.json({
      success: true,
      message: '对话删除成功'
    })

  } catch (error) {
    console.error('❌ 删除对话失败:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 }
    )
  }
} 