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
        area_district,
        parent_id
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

    // 验证短信验证码 - 使用内部API调用
    console.log('🔍 开始验证短信验证码:', { phone: phone.slice(0, 3) + '****' + phone.slice(-4), code, type: 'login' })

    // 构建内部API URL
    const baseUrl = process.env.NEXTAUTH_URL || `http://localhost:3000`
    const smsVerifyUrl = `${baseUrl}/api/sms/verify`

    console.log('📡 调用短信验证API:', smsVerifyUrl)

    const smsVerifyResponse = await fetch(smsVerifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code, type: 'login' })
    })

    if (!smsVerifyResponse.ok) {
      console.error('❌ 短信验证API调用失败:', {
        status: smsVerifyResponse.status,
        statusText: smsVerifyResponse.statusText,
        url: smsVerifyUrl
      })

      try {
        const smsError = await smsVerifyResponse.json()
        console.error('❌ 短信验证错误详情:', smsError)
        return NextResponse.json(
          { error: 'INVALID_CODE', message: smsError.message || '验证码错误' },
          { status: 400 }
        )
      } catch (parseError) {
        console.error('❌ 解析短信验证响应失败:', parseError)
        console.error('❌ 响应内容可能不是JSON格式')

        // 尝试获取响应文本内容
        try {
          const responseText = await smsVerifyResponse.text()
          console.error('❌ 实际响应内容:', responseText.substring(0, 200))
        } catch (textError) {
          console.error('❌ 无法获取响应文本:', textError)
        }

        return NextResponse.json(
          { error: 'SMS_VERIFY_ERROR', message: '短信验证服务异常，请稍后重试' },
          { status: 500 }
        )
      }
    }

    // 检查用户状态
    const hasProfile = userProfiles && userProfiles.length > 0
    const hasReport = personalityReports &&
                     personalityReports.length > 0 &&
                     personalityReports[0].content &&
                     personalityReports[0].content.trim().length > 0

    // 详细打印所有用户资料原始数据
    console.log('📊 用户资料原始数据:')
    console.log('  userId:', user.id)
    console.log('  phone:', user.phone_number)
    console.log('  userProfiles 数组:', userProfiles)
    console.log('  userProfiles 数量:', userProfiles?.length || 0)

    // 逐个检查每个资料的parent_id详细信息
    if (userProfiles && userProfiles.length > 0) {
      userProfiles.forEach((profile, index) => {
        console.log(`📋 资料 ${index + 1} 详细分析:`)
        console.log(`  ID: ${profile.id}`)
        console.log(`  姓名: ${profile.name}`)
        console.log(`  parent_id 原始值: ${JSON.stringify(profile.parent_id)}`)
        console.log(`  parent_id 类型: ${typeof profile.parent_id}`)
        console.log(`  是否 === null: ${profile.parent_id === null}`)
        console.log(`  是否 === undefined: ${profile.parent_id === undefined}`)
        console.log(`  是否 === '': ${profile.parent_id === ''}`)
        console.log(`  !profile.parent_id: ${!profile.parent_id}`)
        
        const isMainProfile = !profile.parent_id || profile.parent_id === null || profile.parent_id === undefined || profile.parent_id === ''
        console.log(`  最终判断是否为主资料: ${isMainProfile}`)
        console.log('  ---')
      })
    } else {
      console.log('❌ 没有找到任何用户资料')
    }

    // 检查是否有parent_id为空或null的主资料
    // parent_id 为 null, undefined, 空字符串都视为主资料
    const hasMainProfile = hasProfile && userProfiles.some(profile => 
      !profile.parent_id || profile.parent_id === null || profile.parent_id === undefined || profile.parent_id === ''
    )

    console.log('🎯 跳转逻辑判断:')
    console.log('  hasProfile:', hasProfile)
    console.log('  hasMainProfile:', hasMainProfile)
    console.log('  最终跳转目标:', hasMainProfile ? 'dashboard' : 'profile')

    console.log('🔍 用户状态检查:', {
      userId: user.id,
      phone: user.phone_number,
      hasProfile,
      hasMainProfile,
      hasReport,
      profileCount: userProfiles?.length || 0,
      reportCount: personalityReports?.length || 0,
      reportContentLength: personalityReports?.[0]?.content?.length || 0,
      profiles: userProfiles?.map(p => ({ 
        id: p.id, 
        name: p.name, 
        parent_id: p.parent_id,
        parent_id_type: typeof p.parent_id,
        isMainProfile: !p.parent_id || p.parent_id === null || p.parent_id === undefined || p.parent_id === ''
      }))
    })

    // 根据用户状态决定跳转页面
    // 如果有主资料（parent_id为空/null），跳转dashboard
    // 否则跳转profile页面让用户填写个人信息
    const redirectTo = hasMainProfile ? 'dashboard' : 'profile'

    console.log(`📍 用户登录跳转决策: ${redirectTo}`, {
      hasProfile,
      hasMainProfile,
      reason: hasMainProfile ? '用户已有主个人信息' : '用户需要填写主个人信息'
    })

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
    const responseData: any = {
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

    // 如果有主账户资料，确保生成OAuth token
    if (hasMainProfile && userProfiles) {
      try {
        // 找到主账户资料
        const mainProfile = userProfiles.find(profile => 
          !profile.parent_id || profile.parent_id === null || profile.parent_id === undefined || profile.parent_id === ''
        )
        
        if (mainProfile) {
          console.log('🔑 为主账户检查并生成OAuth Token:', mainProfile.id)
          
          // 动态导入ensureUserCozeToken函数
          const { ensureUserCozeToken } = await import('@/lib/coze-auth')
          const tokenResult = await ensureUserCozeToken(mainProfile.id)
          
          if (tokenResult.success) {
            console.log('✅ 主账户OAuth Token准备完成:', tokenResult.message)
          } else {
            console.warn('⚠️ 主账户OAuth Token生成失败:', tokenResult.message)
            // 不阻止登录，只记录警告
          }
        }
      } catch (tokenError) {
        console.error('❌ 登录时生成OAuth Token失败:', tokenError)
        // 不阻止登录，只记录错误
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