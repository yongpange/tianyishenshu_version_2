import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userProfileId } = await request.json()

    if (!userProfileId) {
      return NextResponse.json(
        { error: 'MISSING_USER_PROFILE_ID', message: '缺少用户资料ID' },
        { status: 400 }
      )
    }

    console.log('📊 更新用户聊天次数:', { userProfileId })

    // 获取当前用户聊天次数信息
    const { data: currentProfile, error: fetchError } = await supabaseAdmin
      .from('user_profiles')
      .select('chat_total_count, chat_used_count, chat_remaining_count')
      .eq('id', userProfileId)
      .single()

    if (fetchError || !currentProfile) {
      return NextResponse.json(
        { error: 'USER_NOT_FOUND', message: '用户不存在' },
        { status: 404 }
      )
    }

    // 检查剩余次数
    if (currentProfile.chat_remaining_count <= 0) {
      return NextResponse.json(
        { 
          error: 'NO_CREDITS_LEFT', 
          message: '聊天次数已用完',
          credits: {
            total: currentProfile.chat_total_count,
            used: currentProfile.chat_used_count,
            remaining: currentProfile.chat_remaining_count
          }
        },
        { status: 403 }
      )
    }

    // 计算新的次数
    const newUsedCount = currentProfile.chat_used_count + 1
    const newRemainingCount = currentProfile.chat_remaining_count - 1

    // 更新数据库
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        chat_used_count: newUsedCount,
        chat_remaining_count: newRemainingCount
      })
      .eq('id', userProfileId)
      .select('chat_total_count, chat_used_count, chat_remaining_count')
      .single()

    if (updateError) {
      console.error('❌ 更新聊天次数失败:', updateError)
      return NextResponse.json(
        { error: 'UPDATE_FAILED', message: '更新聊天次数失败' },
        { status: 500 }
      )
    }

    console.log('✅ 聊天次数更新成功:', updatedProfile)

    return NextResponse.json({
      success: true,
      message: '聊天次数更新成功',
      credits: {
        total: updatedProfile.chat_total_count,
        used: updatedProfile.chat_used_count,
        remaining: updatedProfile.chat_remaining_count
      }
    })

  } catch (error) {
    console.error('❌ 更新聊天次数失败:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 }
    )
  }
} 