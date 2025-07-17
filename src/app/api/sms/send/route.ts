import { NextRequest, NextResponse } from 'next/server'
import { sendSmsCode, validatePhoneNumber, generateVerificationCode } from '@/lib/tencent-sms'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { phone, type = 'register' } = await request.json()

    // 验证手机号格式
    if (!phone || !validatePhoneNumber(phone)) {
      return NextResponse.json(
        { success: false, message: '请输入正确的手机号' },
        { status: 400 }
      )
    }

    // 清理手机号
    const cleanPhone = phone.trim()

    // 检查用户是否存在
    let { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, latest_verification_code, verification_code_expires_at, invite_code_used')
      .eq('phone_number', cleanPhone)
      .single()

    // 如果是登录类型，但用户不存在，返回错误
    if (type === 'login' && (userError && userError.code === 'PGRST116')) {
      return NextResponse.json(
        { success: false, message: '该手机号尚未注册' },
        { status: 404 }
      )
    }

    // 如果是登录类型，用户存在但没有invite_code，返回错误
    if (type === 'login' && user && !user.invite_code_used) {
      return NextResponse.json(
        { success: false, message: '该账户尚未完成注册，请使用注册流程' },
        { status: 400 }
      )
    }

    // 如果是注册类型，但用户不存在，创建临时用户记录
    if (type === 'register' && (userError && userError.code === 'PGRST116')) {
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          phone_number: cleanPhone,
          is_profile_completed: false
        })
        .select('id, latest_verification_code, verification_code_expires_at, invite_code_used')
        .single()

      if (createError || !newUser) {
        console.error('创建临时用户失败:', createError)
        return NextResponse.json(
          { success: false, message: '系统错误，请稍后重试' },
          { status: 500 }
        )
      }
      user = newUser
    } else if (userError || !user) {
      console.error('查询用户失败:', userError)
      return NextResponse.json(
        { success: false, message: '系统错误，请稍后重试' },
        { status: 500 }
      )
    }

    // 检查发送频率限制（1分钟内只能发送一次）
    if (user && user.verification_code_expires_at) {
      const lastSendTime = new Date(user.verification_code_expires_at).getTime() - 5 * 60 * 1000 // 过期时间减去5分钟就是发送时间
      const now = Date.now()
      if (now - lastSendTime < 60000) {
        const remainingTime = Math.ceil((60000 - (now - lastSendTime)) / 1000)
        return NextResponse.json(
          { success: false, message: `请${remainingTime}秒后再试` },
          { status: 429 }
        )
      }
    }

    // 生成验证码
    const code = generateVerificationCode()

    // 暂时不使用腾讯云发送功能，直接将验证码写入数据库
    // const sendResult = await sendSmsCode(cleanPhone, code)
    // 
    // if (!sendResult) {
    //   return NextResponse.json(
    //     { success: false, message: '短信发送失败，请稍后重试' },
    //     { status: 500 }
    //   )
    // }

    // 存储验证码到数据库（5分钟有效期）
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()
    
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        latest_verification_code: code,
        verification_code_expires_at: expiresAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', user!.id)

    if (updateError) {
      console.error('存储验证码失败:', updateError)
      return NextResponse.json(
        { success: false, message: '验证码存储失败，请稍后重试' },
        { status: 500 }
      )
    }

    console.log('📝 验证码已存储到数据库:', {
      phone: cleanPhone,
      userId: user.id,
      code,
      expiresAt,
      type
    })

    return NextResponse.json({
      success: true,
      message: '验证码已发送'
    })

  } catch (error) {
    console.error('发送短信验证码失败:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
} 