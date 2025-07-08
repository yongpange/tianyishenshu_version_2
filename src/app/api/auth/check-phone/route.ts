import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json(
        { error: 'MISSING_PHONE', message: '请提供手机号' },
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

    // 检查手机号是否已注册
    const { data: user, error } = await supabase
      .from('users')
      .select('id, phone_number, is_profile_completed')
      .eq('phone_number', cleanPhone)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: '数据库查询失败' },
        { status: 500 }
      )
    }

    if (!user) {
      return NextResponse.json({
        success: true,
        exists: false,
        message: '该手机号尚未注册'
      })
    }

    return NextResponse.json({
      success: true,
      exists: true,
      user: {
        id: user.id,
        phone: user.phone_number,
        is_profile_completed: user.is_profile_completed
      }
    })

  } catch (error) {
    console.error('Check phone error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 }
    )
  }
}