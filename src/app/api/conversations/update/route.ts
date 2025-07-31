import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { conversationId, title, isPinned, isManualTitle, cozeConversationId } = await request.json()

    if (!conversationId) {
      return NextResponse.json(
        { error: 'MISSING_CONVERSATION_ID', message: '缺少对话ID' },
        { status: 400 }
      )
    }

    console.log('🔄 更新对话:', { conversationId, title, isPinned, isManualTitle, cozeConversationId })

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

    // 构建更新数据
    const updateData: any = {}
    
    if (title !== undefined) {
      updateData.title = title
    }
    
    if (isPinned !== undefined) {
      updateData.is_pinned = isPinned
    }
    
    if (isManualTitle !== undefined) {
      updateData.is_manual_title = isManualTitle
    }
    
    if (cozeConversationId !== undefined) {
      updateData.coze_conversation_id = cozeConversationId
    }

    // 总是更新updated_at
    updateData.updated_at = new Date().toISOString()

    // 更新对话
    const { data: updatedConversation, error: updateError } = await supabaseAdmin
      .from('conversations')
      .update(updateData)
      .eq('id', conversationId)
      .select('*')
      .single()

    if (updateError) {
      console.error('❌ 更新对话失败:', updateError)
      return NextResponse.json(
        { error: 'UPDATE_FAILED', message: '更新对话失败' },
        { status: 500 }
      )
    }

    console.log('✅ 对话更新成功:', conversationId)

    return NextResponse.json({
      success: true,
      conversation: updatedConversation
    })

  } catch (error) {
    console.error('❌ 更新对话失败:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 }
    )
  }
} 