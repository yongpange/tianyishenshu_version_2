import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { conversationId, role, content, metadata = {} } = await request.json()

    if (!conversationId || !role || !content) {
      return NextResponse.json(
        { error: 'MISSING_REQUIRED_FIELDS', message: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 验证role字段
    if (!['user', 'assistant', 'system', 'tool'].includes(role)) {
      return NextResponse.json(
        { error: 'INVALID_ROLE', message: '无效的消息角色' },
        { status: 400 }
      )
    }

    console.log('💬 创建新消息:', { conversationId, role, contentLength: content.length })

    // 验证对话是否存在
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'CONVERSATION_NOT_FOUND', message: '对话不存在' },
        { status: 404 }
      )
    }

    // 获取该对话中消息的最大索引
    const { data: maxIndexResult, error: indexError } = await supabaseAdmin
      .from('messages')
      .select('message_index')
      .eq('conversation_id', conversationId)
      .order('message_index', { ascending: false })
      .limit(1)

    if (indexError) {
      console.error('❌ 获取消息索引失败:', indexError)
      return NextResponse.json(
        { error: 'INDEX_QUERY_FAILED', message: '查询消息索引失败' },
        { status: 500 }
      )
    }

    const nextIndex = maxIndexResult && maxIndexResult.length > 0 
      ? maxIndexResult[0].message_index + 1 
      : 0

    // 创建新消息
    const { data: message, error: createError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: role,
        content: content,
        metadata: metadata,
        message_index: nextIndex
      })
      .select('*')
      .single()

    if (createError) {
      console.error('❌ 创建消息失败:', createError)
      return NextResponse.json(
        { error: 'CREATE_FAILED', message: '创建消息失败' },
        { status: 500 }
      )
    }

    // 更新对话的updated_at时间戳
    const { error: updateError } = await supabaseAdmin
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)

    if (updateError) {
      console.warn('⚠️ 更新对话时间戳失败:', updateError)
    }

    console.log('✅ 消息创建成功:', message.id, '索引:', nextIndex)

    return NextResponse.json({
      success: true,
      message: message
    })

  } catch (error) {
    console.error('❌ 创建消息失败:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 }
    )
  }
} 