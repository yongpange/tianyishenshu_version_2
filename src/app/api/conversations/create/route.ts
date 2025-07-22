import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userProfileId, title, moduleType = 'personality', cozeConversationId } = await request.json()

    if (!userProfileId || !title) {
      return NextResponse.json(
        { error: 'MISSING_REQUIRED_FIELDS', message: '缺少必要参数' },
        { status: 400 }
      )
    }

    console.log('🆕 创建新对话:', { userProfileId, title, moduleType, cozeConversationId })

    // 验证用户资料是否存在
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('id', userProfileId)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'USER_PROFILE_NOT_FOUND', message: '用户资料不存在' },
        { status: 404 }
      )
    }

    // 创建新对话
    const { data: conversation, error: createError } = await supabaseAdmin
      .from('conversations')
      .insert({
        user_id: userProfileId,
        title: title,
        module_type: moduleType,
        coze_conversation_id: cozeConversationId,
        is_pinned: false,
        is_manual_title: false
      })
      .select('*')
      .single()

    if (createError) {
      console.error('❌ 创建对话失败:', createError)
      return NextResponse.json(
        { error: 'CREATE_FAILED', message: '创建对话失败' },
        { status: 500 }
      )
    }

    console.log('✅ 对话创建成功:', conversation.id)

    return NextResponse.json({
      success: true,
      conversation: conversation
    })

  } catch (error) {
    console.error('❌ 创建对话失败:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 }
    )
  }
} 