import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { userSessionCache } from '@/lib/user-session-cache'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userProfileId = searchParams.get('id')

    if (!userProfileId) {
      return NextResponse.json(
        { error: 'MISSING_ID', message: '缺少用户资料ID参数' },
        { status: 400 }
      )
    }

    console.log('📋 获取用户资料详情:', { userProfileId })

    // 优先从缓存获取用户会话信息
    const userSession = await userSessionCache.getUserSessionByProfileId(userProfileId)

    if (userSession) {
      console.log('✅ 从缓存获取用户资料:', {
        source: userSession.source,
        name: userSession.name
      })

      // 构造响应数据（兼容原有格式）
      const profileData = {
        id: userSession.userProfileId,
        name: userSession.name,
        gender: userSession.gender,
        // 解析生日信息
        year: userSession.birthDate ? new Date(userSession.birthDate).getFullYear() : null,
        month: userSession.birthDate ? new Date(userSession.birthDate).getMonth() + 1 : null,
        day: userSession.birthDate ? new Date(userSession.birthDate).getDate() : null,
        // 解析时间信息
        hour: userSession.birthTime ? parseInt(userSession.birthTime.split(':')[0]) : null,
        minute: userSession.birthTime ? parseInt(userSession.birthTime.split(':')[1]) : null,
        // 地区信息（从缓存中暂时无法获取详细地区，需要从数据库补充）
        area_province: null,
        area_city: null,
        area_district: null,
        birth_location: userSession.birthLocation,
        user_id: userSession.userId,
        users: {
          phone_number: userSession.phoneNumber
        },
        // 缓存元数据
        cached_at: userSession.cachedAt,
        cache_source: userSession.source
      }

      // 如果需要详细地区信息，异步从数据库补充
      if (userSession.birthLocation) {
        // 这里可以异步查询地区信息，暂时跳过
      }

      return NextResponse.json({
        success: true,
        data: profileData
      })
    }

    // 缓存未命中，从数据库获取详细信息
    console.log('🔍 缓存未命中，查询数据库...')

    const { data: profile, error: profileError } = await supabaseAdmin
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
        created_at,
        updated_at,
        user_id,
        users!inner(
          phone_number
        )
      `)
      .eq('id', userProfileId)
      .single()

    if (profileError) {
      console.error('查询用户资料失败:', profileError)
      if (profileError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'PROFILE_NOT_FOUND', message: '用户资料不存在' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'QUERY_FAILED', message: '查询失败' },
        { status: 500 }
      )
    }

    console.log('✅ 找到用户资料:', profile.name)

    // 异步更新缓存（不等待结果）
    if (profile.user_id) {
      userSessionCache.getUserSession(profile.user_id).catch(err => {
        console.warn('⚠️ 异步更新用户会话缓存失败:', err)
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...profile,
        cache_source: 'database'
      }
    })

  } catch (error) {
    console.error('获取用户资料详情失败:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { 
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
    } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'MISSING_ID', message: '缺少用户资料ID' },
        { status: 400 }
      )
    }

    console.log('📝 更新用户资料:', { id, name, gender })

    // 更新用户资料
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({
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
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('更新用户资料失败:', updateError)
      return NextResponse.json(
        { error: 'UPDATE_FAILED', message: '更新失败' },
        { status: 500 }
      )
    }

    console.log('✅ 用户资料更新成功:', updatedProfile.name)

    // 清除相关缓存
    if (updatedProfile.user_id) {
      userSessionCache.clearUserSession(updatedProfile.user_id, id).catch(err => {
        console.warn('⚠️ 清除用户会话缓存失败:', err)
      })
    }

    return NextResponse.json({
      success: true,
      data: updatedProfile,
      message: '用户资料更新成功'
    })

  } catch (error) {
    console.error('更新用户资料失败:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 }
    )
  }
}
