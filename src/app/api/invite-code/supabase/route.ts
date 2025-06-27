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
    const { data, error } = await supabase
      .from('invite_codes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('获取兑换码失败:', error)
    return NextResponse.json(
      { success: false, message: '获取兑换码失败' },
      { status: 500 }
    )
  }
}

// 创建新兑换码
export async function POST(request: NextRequest) {
  try {
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
      { success: false, message: '生成兑换码失败' },
      { status: 500 }
    )
  }
}

// 删除兑换码
export async function DELETE(request: NextRequest) {
  try {
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
      { success: false, message: '删除兑换码失败' },
      { status: 500 }
    )
  }
}
