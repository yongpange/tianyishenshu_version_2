import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json()

    if (!phone || !code) {
      return NextResponse.json(
        { error: 'MISSING_FIELDS', message: '请提供手机号和验证码' },
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

    // 验证验证码格式
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: 'INVALID_CODE', message: '验证码格式不正确' },
        { status: 400 }
      )
    }

    // 检查手机号是否已注册
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, phone_number, is_profile_completed, created_at')
      .eq('phone_number', cleanPhone)
      .single()

    if (userError && userError.code !== 'PGRST116') {
      console.error('Database error:', userError)
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: '数据库查询失败' },
        { status: 500 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: 'PHONE_NOT_REGISTERED', message: '该手机号尚未注册' },
        { status: 404 }
      )
    }

    // 获取用户资料
    const { data: userProfiles, error: profileError } = await supabase
      .from('user_profiles')
      .select(`
        id,
        name,
        gender,
        year,
        month,
        day,
        hour,
        minute,
        area_province,
        area_city,
        area_district
      `)
      .eq('user_id', user.id)

    // 获取性格报告
    const { data: personalityReports, error: reportError } = await supabase
      .from('personality_reports')
      .select(`
        id,
        content,
        generated_at,
        user_data_hash,
        coze_conversation_id
      `)
      .eq('user_id', user.id)

    if (profileError) {
      console.error('Profile query error:', profileError)
    }

    if (reportError) {
      console.error('Report query error:', reportError)
    }

    // 验证短信验证码
    const smsVerifyResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/sms/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code, type: 'login' })
    })

    if (!smsVerifyResponse.ok) {
      const smsError = await smsVerifyResponse.json()
      return NextResponse.json(
        { error: 'INVALID_CODE', message: smsError.message || '验证码错误' },
        { status: 400 }
      )
    }

    // 检查用户状态
    const hasProfile = userProfiles && userProfiles.length > 0
    const hasReport = personalityReports &&
                     personalityReports.length > 0 &&
                     personalityReports[0].content &&
                     personalityReports[0].content.trim().length > 0

    console.log('🔍 用户状态检查:', {
      userId: user.id,
      phone: user.phone_number,
      hasProfile,
      hasReport,
      profileCount: userProfiles?.length || 0,
      reportCount: personalityReports?.length || 0,
      reportContentLength: personalityReports?.[0]?.content?.length || 0
    })

    // 决定跳转目标
    const shouldGoToDashboard = hasProfile && hasReport
    const redirectTo = shouldGoToDashboard ? 'dashboard' : 'profile'

    // 更新最后登录时间
    const { error: updateError } = await supabase
      .from('users')
      .update({
        last_login: new Date().toISOString(),
        is_profile_completed: hasProfile
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Update last login error:', updateError)
      // 不阻止登录，只记录错误
    }

    // 准备返回的用户数据
    const responseData = {
      success: true,
      message: '登录成功',
      user: {
        id: user.id,
        phone: user.phone_number,
        is_profile_completed: hasProfile,
        has_profile: hasProfile,
        has_report: hasReport,
        redirect_to: redirectTo
      }
    }

    // 如果有完整数据，包含在响应中
    if (hasProfile && userProfiles[0]) {
      responseData.user.profile_data = {
        name: userProfiles[0].name,
        gender: userProfiles[0].gender,
        year: userProfiles[0].year,
        month: userProfiles[0].month,
        day: userProfiles[0].day,
        hour: userProfiles[0].hour,
        minute: userProfiles[0].minute,
        area: {
          province: userProfiles[0].area_province,
          city: userProfiles[0].area_city,
          district: userProfiles[0].area_district
        }
      }
    }

    if (hasReport && personalityReports[0]) {
      responseData.user.report_data = {
        id: personalityReports[0].id,
        content: personalityReports[0].content,
        generated_at: personalityReports[0].generated_at,
        coze_conversation_id: personalityReports[0].coze_conversation_id
      }
    }

    console.log('✅ 登录成功，跳转到:', redirectTo)
    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 }
    )
  }
}