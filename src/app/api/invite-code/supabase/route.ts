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
    
    // 检查Supabase管理员连接是否可用
    if (!supabaseAdmin) {
      console.warn('⚠️ Supabase 管理员权限未正确配置，返回空数据')
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    console.log('✅ Supabase 管理员客户端已初始化，尝试连接数据库...')

    const { data, error } = await supabase
  .from('invite_codes')
  .select(`
    *,
    user_profiles!left (
      id,
      name,
      chat_remaining_count,
      user_role,
      users!left (
        id,
        phone_number
      )
    )
  `)
  .order('created_at', { ascending: false })

    console.log('📊 数据库查1111询结果:')
    // console.log('错误信息:', error)
    // console.log('data:', data)
    console.log('数据条数:', data ? data.length : 0)
    
    if (error) {
      console.error('❌ Supabase查询错误:', error)
      throw error
    }

    // 处理数据格式，展平用户信息，与SQL查询结果保持一致
    const processedData = data?.map(item => ({
      ...item,
      // 添加与SQL查询一致的字段名
      user_profiles_id: item.user_profiles?.id || null,
      user_profiles_name: item.user_profiles?.name || null,
      user_profiles_chat_remaining_count: item.user_profiles?.chat_remaining_count || null,
      user_profiles_user_role: item.user_profiles?.user_role || null,
      users_id: item.user_profiles?.users?.id || null,
      users_phone_number: item.user_profiles?.users?.phone_number || null,
      // 保留原有字段以保持兼容性
      user_phone: item.user_profiles?.phone_number || item.user_profiles?.users?.phone_number || null,
      user_name: item.user_profiles?.name || null, 
      remaining_tokens: item.user_profiles?.chat_remaining_count || null,
      user_role: item.user_profiles?.user_role || null
    })) || []

    console.log('✅ 成功获取兑换码数据:', processedData?.length || 0, '条')
    return NextResponse.json({
      success: true,
      data: processedData
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

// 更新兑换码
export async function PUT(request: NextRequest) {
  try {
    // 检查Supabase管理员连接是否可用
    if (!supabaseAdmin) {
      console.warn('⚠️ Supabase 管理员权限未正确配置，无法更新兑换码')
      return NextResponse.json(
        { success: false, message: '服务未正确配置，无法更新兑换码' },
        { status: 503 }
      )
    }

    const { id, remarks, remainingTokens, userRole, hasUserData } = await request.json()

    if (!id) {
      return NextResponse.json(
        { success: false, message: '缺少兑换码ID' },
        { status: 400 }
      )
    }

    // 更新兑换码备注
    const { data: inviteCodeData, error: inviteCodeError } = await supabaseAdmin
      .from('invite_codes')
      .update({
        remarks: remarks || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()

    if (inviteCodeError) {
      throw inviteCodeError
    }

    // 如果有用户数据，则更新用户信息
    if (hasUserData && inviteCodeData && inviteCodeData[0]?.used_by) {
      const userProfileId = inviteCodeData[0].used_by
      
      const { data: userUpdateData, error: userUpdateError } = await supabaseAdmin
        .from('user_profiles')
        .update({
          chat_remaining_count: remainingTokens,
          user_role: userRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userProfileId) // 直接使用 user_profiles.id
        .select()

      if (userUpdateError) {
        console.error('更新用户信息失败:', userUpdateError)
        // 不抛出错误，因为兑换码更新已成功
      } else {
        console.log('✅ 用户信息更新成功:', userProfileId, userUpdateData)
      }
    }

    // 重新查询更新后的完整数据，确保关联查询获取最新信息
    const { data: updatedData, error: refetchError } = await supabaseAdmin
      .from('invite_codes')
      .select(`
        *,
        user_profiles!used_by (
          id,
          name,
          phone_number,
          chat_remaining_count,
          user_role,
          users!user_id (
            id,
            phone_number
          )
        )
      `)
      .eq('id', id)
      .single()

    if (refetchError) {
      console.error('重新查询数据失败:', refetchError)
      // 如果重新查询失败，返回原始数据
      return NextResponse.json({
        success: true,
        message: '兑换码更新成功',
        data: inviteCodeData,
        needRefresh: true // 告诉前端需要手动刷新
      })
    }

    // 处理数据格式，确保字段名一致，与SQL查询结果保持一致
    const processedUpdatedData = {
      ...updatedData,
      // 添加与SQL查询一致的字段名
      user_profiles_id: updatedData.user_profiles?.id || null,
      user_profiles_name: updatedData.user_profiles?.name || null,
      user_profiles_chat_remaining_count: updatedData.user_profiles?.chat_remaining_count || null,
      user_profiles_user_role: updatedData.user_profiles?.user_role || null,
      users_id: updatedData.user_profiles?.users?.id || null,
      users_phone_number: updatedData.user_profiles?.users?.phone_number || null,
      // 保留原有字段以保持兼容性
      user_phone: updatedData.user_profiles?.phone_number || updatedData.user_profiles?.users?.phone_number || null,
      user_name: updatedData.user_profiles?.name || null,
      remaining_tokens: updatedData.user_profiles?.chat_remaining_count || null,
      user_role: updatedData.user_profiles?.user_role || null
    }

    return NextResponse.json({
      success: true,
      message: '兑换码更新成功',
      data: processedUpdatedData
    })
  } catch (error) {
    console.error('更新兑换码失败:', error)
    return NextResponse.json(
      { success: false, message: '更新兑换码失败，可能是环境配置问题' },
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
