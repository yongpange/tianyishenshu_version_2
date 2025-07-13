import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// 获取角色列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const simple = searchParams.get('simple') // 如果有simple参数，只返回角色选项

    if (simple === 'true') {
      // 简化版本：只返回角色选项，用于下拉选择
      const { data, error } = await supabaseAdmin
        .from('user_roles_permissions')
        .select('role_name, role_display_name, is_active')
        .eq('is_active', true)
        .order('role_name')

      if (error) {
        throw error
      }

      return NextResponse.json({
        success: true,
        data: data || []
      })
    }

    // 完整版本：返回完整的角色信息
    const { data, error } = await supabaseAdmin
      .from('user_roles_permissions')
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
    console.error('获取角色列表失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取角色列表失败'
      },
      { status: 500 }
    )
  }
}

// 创建角色
export async function POST(request: NextRequest) {
  try {
    const { role_name, role_display_name, permissions, description, is_active } = await request.json()

    if (!role_name || !role_display_name || !permissions) {
      return NextResponse.json(
        { success: false, error: '缺少必要字段' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('user_roles_permissions')
      .insert({
        role_name,
        role_display_name,
        permissions,
        description,
        is_active: is_active ?? true
      })
      .select()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: '角色创建成功',
      data: data[0]
    })
  } catch (error) {
    console.error('创建角色失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '创建角色失败'
      },
      { status: 500 }
    )
  }
}

// 更新角色
export async function PUT(request: NextRequest) {
  try {
    const { id, role_name, role_display_name, permissions, description, is_active } = await request.json()

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少角色ID' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('user_roles_permissions')
      .update({
        role_name,
        role_display_name,
        permissions,
        description,
        is_active
      })
      .eq('id', id)
      .select()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: '角色更新成功',
      data: data[0]
    })
  } catch (error) {
    console.error('更新角色失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '更新角色失败'
      },
      { status: 500 }
    )
  }
}

// 删除角色
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少角色ID' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('user_roles_permissions')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: '角色删除成功'
    })
  } catch (error) {
    console.error('删除角色失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '删除角色失败'
      },
      { status: 500 }
    )
  }
} 