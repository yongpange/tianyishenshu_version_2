import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { markInviteCodeAsUsed } from '@/lib/user-manager'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { phone, code, inviteCode } = await request.json()

    if (!phone || !code || !inviteCode) {
      return NextResponse.json(
        { error: 'MISSING_FIELDS', message: '请提供手机号、验证码和兑换码' },
        { status: 400 }
      )
    }

    // 清理手机号（去除空白字符）
    const cleanPhone = phone.trim()

    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(cleanPhone)) {
      return NextResponse.json(
        { error: 'INVALID_PHONE', message: '手机号格式不正确' },
        { status: 400 }
      )
    }

    // 验证验证码格式（6位数字）
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: 'INVALID_CODE', message: '验证码格式不正确' },
        { status: 400 }
      )
    }

    // 验证兑换码格式
    if (!/^[A-Z0-9]{16}$/.test(inviteCode)) {
      return NextResponse.json(
        { error: 'INVALID_INVITE_CODE', message: '兑换码格式不正确' },
        { status: 400 }
      )
    }

    // 检查手机号是否已注册
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, invite_code_used')
      .eq('phone_number', cleanPhone)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Database error:', checkError)
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: '数据库查询失败' },
        { status: 500 }
      )
    }

    // 如果用户存在且已有兑换码，返回错误
    if (existingUser && existingUser.invite_code_used) {
      return NextResponse.json(
        { error: 'PHONE_ALREADY_REGISTERED', message: '该手机号已注册，请直接登录' },
        { status: 409 }
      )
    }

    // 验证短信验证码
    const smsVerifyResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/sms/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code, type: 'register' })
    })

    if (!smsVerifyResponse.ok) {
      const smsError = await smsVerifyResponse.json()
      return NextResponse.json(
        { error: 'INVALID_CODE', message: smsError.message || '验证码错误' },
        { status: 400 }
      )
    }

    // 验证兑换码
    const inviteVerifyResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/invite-code/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: inviteCode })
    })

    if (!inviteVerifyResponse.ok) {
      const inviteError = await inviteVerifyResponse.json()
      return NextResponse.json(
        { error: 'INVALID_INVITE_CODE', message: inviteError.message || '兑换码无效' },
        { status: 400 }
      )
    }

    let user;
    
    if (existingUser) {
      // 用户存在但没有兑换码，更新现有用户
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          invite_code_used: inviteCode,
          last_login: new Date().toISOString()
        })
        .eq('id', existingUser.id)
        .select('id, phone_number, is_profile_completed')
        .single()

      if (updateError) {
        console.error('Update user error:', updateError)
        return NextResponse.json(
          { error: 'UPDATE_USER_FAILED', message: '更新用户失败' },
          { status: 500 }
        )
      }
      user = updatedUser;
    } else {
      // 创建新用户
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          phone_number: cleanPhone,
          invite_code_used: inviteCode,
          is_profile_completed: false,
          last_login: new Date().toISOString()
        })
        .select('id, phone_number, is_profile_completed')
        .single()

      if (createError) {
        console.error('Create user error:', createError)
        return NextResponse.json(
          { error: 'CREATE_USER_FAILED', message: '创建用户失败' },
          { status: 500 }
        )
      }
      user = newUser;
    }

    // 标记兑换码为已使用
    // try {
    //   await markInviteCodeAsUsed(inviteCode, cleanPhone)
    //   console.log('✅ 兑换码已标记为已使用:', inviteCode)
    // } catch (markError) {
    //   console.error('❌ 标记兑换码失败:', markError)
    //   // 不影响注册流程，只记录错误
    // }

    return NextResponse.json({
      success: true,
      message: '注册成功',
      user: {
        id: user.id,
        phone: user.phone_number,
        is_profile_completed: user.is_profile_completed,
        redirect_to: 'profile'  // 注册成功后跳转到profile页面
      }
    })

  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 }
    )
  }
}