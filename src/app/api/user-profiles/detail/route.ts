import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

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

    // 根据user_profiles.id获取详细信息
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

    return NextResponse.json({
      success: true,
      data: profile
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
