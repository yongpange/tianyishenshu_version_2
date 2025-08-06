import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json()

    // 验证参数
    if (!phone || !code) {
      return NextResponse.json(
        { success: false, message: '请填写完整信息' },
        { status: 400 }
      )
    }

    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        { success: false, message: '手机号格式不正确' },
        { status: 400 }
      )
    }

    // 验证码格式
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { success: false, message: '验证码格式不正确' },
        { status: 400 }
      )
    }

    const cleanPhone = phone.trim()

    // 查找用户并验证验证码
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, latest_verification_code, verification_code_expires_at')
      .eq('phone_number', cleanPhone)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      )
    }

    // 检查验证码
    if (!user.latest_verification_code || !user.verification_code_expires_at) {
      return NextResponse.json(
        { success: false, message: '验证码已过期，请重新获取' },
        { status: 400 }
      )
    }

    // 检查验证码是否过期
    const now = new Date()
    const expiresAt = new Date(user.verification_code_expires_at)
    if (now > expiresAt) {
      // 清空过期的验证码
      await supabaseAdmin
        .from('users')
        .update({
          latest_verification_code: null,
          verification_code_expires_at: null
        })
        .eq('id', user.id)
      
      return NextResponse.json(
        { success: false, message: '验证码已过期，请重新获取' },
        { status: 400 }
      )
    }

    // 验证码错误
    if (user.latest_verification_code !== code) {
      return NextResponse.json(
        { success: false, message: '验证码错误，请检查后重试' },
        { status: 400 }
      )
    }

    // 检查用户是否为管理员
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, name, user_role')
      .eq('user_id', user.id)
      .is('parent_id', null)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { success: false, message: '用户资料不存在' },
        { status: 404 }
      )
    }

    if (userProfile.user_role !== 'admin') {
      return NextResponse.json(
        { success: false, message: '您没有管理员权限' },
        { status: 403 }
      )
    }

    // 验证成功，清除验证码
    await supabaseAdmin
      .from('users')
      .update({
        latest_verification_code: null,
        verification_code_expires_at: null,
        last_login: new Date().toISOString()
      })
      .eq('id', user.id)

    // 返回管理员信息
    return NextResponse.json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user.id,
          phone: cleanPhone,
          profile: userProfile
        }
      }
    })

  } catch (error) {
    console.error('管理员登录失败:', error)
    return NextResponse.json(
      { success: false, message: '登录失败，请重试' },
      { status: 500 }
    )
  }
} 