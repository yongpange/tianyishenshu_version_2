import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

// 生成兑换码
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// 获取所有兑换码
export async function GET() {
  try {
    // 打印环境变量调试信息
    console.log('🔍 API路由环境变量检查:')
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 10)}...` : 'undefined')
    console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10)}...` : 'undefined')
    
    // 检查Supabase连接是否可用
    if (!supabase) {
      console.warn('⚠️ Supabase 未正确配置，返回空数据')
      return NextResponse.json({
        success: true,
        data: []
      })
    }
    
    console.log('✅ Supabase 客户端已初始化，尝试连接数据库...')

    const { data, error } = await supabase
      .from('invite_codes')
      .select('*')
      .order('created_at', { ascending: false })

    console.log('📊 数据库查询结果:')
    console.log('错误信息:', error)
    console.log('数据条数:', data ? data.length : 0)
    
    if (error) {
      console.error('❌ Supabase查询错误:', error)
      throw error
    }

    console.log('✅ 成功获取兑换码数据:', data?.length || 0, '条')
    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('❌ 获取兑换码失败:', error)
    console.error('错误详情:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    return NextResponse.json(
      { 
        success: false, 
        message: '获取兑换码失败，可能是环境配置问题',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

// 创建新兑换码
export async function POST(request: NextRequest) {
  try {
    // 检查Supabase管理员连接是否可用
    if (!supabaseAdmin) {
      console.warn('⚠️ Supabase 管理员权限未正确配置，无法生成兑换码')
      return NextResponse.json(
        { success: false, message: '服务未正确配置，无法生成兑换码' },
        { status: 503 }
      )
    }

    const { count = 1, remarks } = await request.json()

    const codes = []
    for (let i = 0; i < count; i++) {
      const code = generateInviteCode()
      codes.push({
        code,
        status: 'active',
        remarks: remarks || `批量生成 ${new Date().toLocaleString()}`
      })
    }

    const { data, error } = await supabaseAdmin
      .from('invite_codes')
      .insert(codes)
      .select()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: `成功生成 ${count} 个兑换码`,
      data: data
    })
  } catch (error) {
    console.error('生成兑换码失败:', error)
    return NextResponse.json(
      { success: false, message: '生成兑换码失败，可能是环境配置问题' },
      { status: 500 }
    )
  }
}

// 删除兑换码
export async function DELETE(request: NextRequest) {
  try {
    // 检查Supabase管理员连接是否可用
    if (!supabaseAdmin) {
      console.warn('⚠️ Supabase 管理员权限未正确配置，无法删除兑换码')
      return NextResponse.json(
        { success: false, message: '服务未正确配置，无法删除兑换码' },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: '缺少兑换码ID' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('invite_codes')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: '兑换码删除成功'
    })
  } catch (error) {
    console.error('删除兑换码失败:', error)
    return NextResponse.json(
      { success: false, message: '删除兑换码失败，可能是环境配置问题' },
      { status: 500 }
    )
  }
}
