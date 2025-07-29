import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId, isUserProfileId = false } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'MISSING_USER_ID', message: '缺少用户ID' },
        { status: 400 }
      )
    }

    console.log('🔮 获取八字报告:', { userId, isUserProfileId })

    let finalUserId = userId

    // 如果不是user_profiles.id，需要转换
    if (!isUserProfileId) {
      console.log('🔍 需要转换用户ID，当前值:', userId)
      
      // 假设传入的是手机号，查找对应的user_profiles.id
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('phone_number', userId)
        .single()

      if (userError || !user) {
        console.log('❌ 根据手机号未找到用户:', userId)
        return NextResponse.json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: '用户不存在'
        })
      }

      // 查找user_profiles
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (profileError || !userProfile) {
        console.log('❌ 未找到用户资料:', user.id)
        return NextResponse.json({
          success: false,
          error: 'USER_PROFILE_NOT_FOUND',
          message: '用户资料不存在'
        })
      }

      finalUserId = userProfile.id
      console.log('✅ 转换用户ID成功:', finalUserId)
    }

    // 从数据库获取八字报告和用户原始信息
    const { data: baziReport, error } = await supabase
      .from('bazi_reports')
      .select(`
        *,
        user_profiles!inner(
          name,
          year,
          month,
          day,
          hour,
          minute,
          area_province,
          area_city,
          area_district
        )
      `)
      .eq('user_id', finalUserId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // 没有找到报告
        console.log('📋 未找到八字报告:', finalUserId)
        return NextResponse.json({
          success: false,
          error: 'REPORT_NOT_FOUND',
          message: '未找到八字报告'
        })
      }
      
      console.error('❌ 获取八字报告失败:', error)
      throw new Error('数据库查询失败')
    }

    if (!baziReport) {
      return NextResponse.json({
        success: false,
        error: 'REPORT_NOT_FOUND',
        message: '未找到八字报告'
      })
    }

    console.log('✅ 成功获取八字报告:', baziReport.id)

    // 提取用户原始信息
    const userProfile = baziReport.user_profiles
    const originalUserInfo = userProfile ? {
      name: userProfile.name,
      year: userProfile.year,
      month: userProfile.month,
      day: userProfile.day,
      hour: userProfile.hour,
      minute: userProfile.minute,
      area: {
        province: userProfile.area_province,
        city: userProfile.area_city,
        district: userProfile.area_district
      }
    } : null

    return NextResponse.json({
      success: true,
      message: '成功获取八字报告',
      report: baziReport.raw_payload,
      astrologyContext: baziReport.astrology_context,
      generatedAt: baziReport.generated_at,
      userDataHash: baziReport.user_data_hash,
      originalUserInfo: originalUserInfo  // 添加用户原始信息
    })

  } catch (error) {
    console.error('❌ 获取八字报告错误:', error)
    return NextResponse.json(
      { 
        error: 'GET_BAZI_FAILED', 
        message: error instanceof Error ? error.message : '获取八字报告失败' 
      },
      { status: 500 }
    )
  }
} 