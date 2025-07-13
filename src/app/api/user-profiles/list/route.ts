import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'MISSING_PHONE', message: '缺少手机号参数' },
        { status: 400 }
      )
    }

    console.log('📱 获取用户资料列表:', { phoneNumber })

    // 1. 根据手机号找到用户ID
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone_number', phoneNumber)
      .single()

    if (userError) {
      if (userError.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          data: []
        })
      }
      console.error('查找用户失败:', userError)
      return NextResponse.json(
        { error: 'USER_NOT_FOUND', message: '用户不存在' },
        { status: 404 }
      )
    }

    // 2. 查询该用户ID下的所有用户资料
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('查询用户资料失败:', profilesError)
      return NextResponse.json(
        { error: 'QUERY_FAILED', message: '查询失败' },
        { status: 500 }
      )
    }

    console.log('✅ 找到用户资料:', profiles?.length || 0, '个')

    return NextResponse.json({
      success: true,
      data: profiles || []
    })

  } catch (error) {
    console.error('获取用户资料列表失败:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 }
    )
  }
} 