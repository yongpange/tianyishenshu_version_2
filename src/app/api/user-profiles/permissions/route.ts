import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userProfileId } = await request.json()

    if (!userProfileId) {
      return NextResponse.json(
        { success: false, error: '缺少用户资料ID' },
        { status: 400 }
      )
    }

    // 查询用户资料和角色信息
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, name, user_role')
      .eq('id', userProfileId)
      .single()

    if (profileError || !userProfile) {
      console.error('查询用户资料失败:', profileError)
      return NextResponse.json(
        { success: false, error: '用户资料不存在' },
        { status: 404 }
      )
    }

    const userRole = userProfile.user_role || 'basic_user'

    // 查询角色权限信息
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles_permissions')
      .select('role_name, role_display_name, permissions')
      .eq('role_name', userRole)
      .eq('is_active', true)
      .single()

    if (roleError || !roleData) {
      console.error('查询角色权限失败:', roleError)
      
      // 如果角色不存在，返回默认的basic_user权限
      const defaultPermissions = {
        role_name: 'basic_user',
        role_display_name: '普通用户',
        permissions: {
          personality: ['view'],
          astrology: ['view'],
          wealth: ['view'],
          marriage: ['view'],
          health: ['view'],
          consultation: []
        }
      }

      return NextResponse.json({
        success: true,
        data: defaultPermissions,
        message: '使用默认权限'
      })
    }

    return NextResponse.json({
      success: true,
      data: roleData,
      message: '获取权限成功'
    })

  } catch (error) {
    console.error('获取用户权限失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取权限失败'
      },
      { status: 500 }
    )
  }
} 