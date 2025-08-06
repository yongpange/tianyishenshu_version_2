import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()

    // 验证手机号格式
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        { success: false, message: '请输入正确的手机号' },
        { status: 400 }
      )
    }

    const cleanPhone = phone.trim()

    // 查找用户
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone_number', cleanPhone)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: '该手机号尚未注册' },
        { status: 404 }
      )
    }

    // 查找用户资料
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, user_role')
      .eq('user_id', user.id)
      .is('parent_id', null) // 只查找主用户资料
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { success: false, message: '用户资料不存在' },
        { status: 404 }
      )
    }

    // 检查是否为管理员
    const isAdmin = userProfile.user_role === 'admin'

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: '您没有管理员权限，无法登录管理后台' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '验证通过',
      data: {
        userId: user.id,
        userProfileId: userProfile.id,
        isAdmin: true
      }
    })

  } catch (error) {
    console.error('检查管理员权限失败:', error)
    return NextResponse.json(
      { success: false, message: '系统错误，请稍后重试' },
      { status: 500 }
    )
  }
} 