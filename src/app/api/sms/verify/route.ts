import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { phone, code, type = 'register' } = await request.json()

    // 验证手机号和验证码
    if (!phone || !code) {
      return NextResponse.json(
        { success: false, message: '请填写完整信息' },
        { status: 400 }
      )
    }

    // 验证类型参数
    if (!['login', 'register'].includes(type)) {
      return NextResponse.json(
        { success: false, message: '无效的验证类型' },
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

    // 清理手机号
    const cleanPhone = phone.trim()

    // 从数据库查询验证码记录
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, latest_verification_code, verification_code_expires_at')
      .eq('phone_number', cleanPhone)
      .single()

    if (userError || !user) {
      console.error('查询用户验证码记录失败:', userError)
      return NextResponse.json(
        { success: false, message: '验证码不存在或已过期，请重新获取' },
        { status: 400 }
      )
    }

    console.log('🔍 验证码验证 - 手机号:', cleanPhone, '用户ID:', user.id)

    // 检查验证码是否存在
    if (!user.latest_verification_code || !user.verification_code_expires_at) {
      console.log('❌ 验证码不存在或已过期')
      return NextResponse.json(
        { success: false, message: '验证码已过期，请重新获取' },
        { status: 400 }
      )
    }

    // 检查验证码是否过期
    const now = new Date()
    const expiresAt = new Date(user.verification_code_expires_at)
    const isExpired = now > expiresAt
    
    console.log('⏰ 验证码时间检查:', {
      currentTime: now.toLocaleString(),
      expiresAt: expiresAt.toLocaleString(),
      isExpired
    })
    
    if (isExpired) {
      console.log('⏱️ 验证码已过期，清理记录')
      // 清空过期的验证码
      await supabaseAdmin
        .from('users')
        .update({
          latest_verification_code: null,
          verification_code_expires_at: null,
          updated_at: new Date().toISOString()
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

    // 验证成功，立即清除验证码
    const { error: clearError } = await supabaseAdmin
      .from('users')
      .update({
        latest_verification_code: null,
        verification_code_expires_at: null,
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (clearError) {
      console.error('清除验证码失败:', clearError)
      // 不影响验证成功的结果，只记录错误
    }

    console.log('✅ 验证码验证成功，已清除验证码记录')

    // 简化的验证成功响应，不处理用户创建逻辑
    // 用户创建和登录逻辑由各自的auth API处理
    return NextResponse.json({
      success: true,
      message: '验证码验证成功',
      data: {
        phone: cleanPhone,
        type,
        verified: true,
        userId: user.id
      }
    })

  } catch (error) {
    console.error('验证短信验证码失败:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
} 