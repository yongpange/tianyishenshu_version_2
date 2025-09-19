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

// 获取兑换码 - 支持分页和搜索
export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || ''
    
    // 验证参数
    const validatedPage = Math.max(1, page)
    const validatedPageSize = Math.min(Math.max(1, pageSize), 100) // 限制最大每页100条
    const offset = (validatedPage - 1) * validatedPageSize

    console.log('📊 分页查询参数:', {
      page: validatedPage,
      pageSize: validatedPageSize,
      search,
      offset
    })
    
    // 检查Supabase管理员连接是否可用
    if (!supabaseAdmin) {
      console.warn('⚠️ Supabase 管理员权限未正确配置，返回空数据')
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          page: validatedPage,
          pageSize: validatedPageSize,
          total: 0,
          totalPages: 0
        }
      })
    }

    console.log('✅ Supabase 管理员客户端已初始化，尝试连接数据库...')

    let data, error, count

    if (search && search.trim()) {
      const searchTerm = search.trim()
      console.log('🔍 执行搜索:', searchTerm)
      
      // 使用数据库级搜索，分别查询用户名和手机号，然后合并结果
      try {
        let searchResults: any[] = []
        let searchIds = new Set<string>()

        // 1. 先搜索用户名
        try {
          const nameSearchQuery = supabase
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
                  phone_number,
                  latest_verification_code,
                  verification_code_expires_at
                )
              )
            `)
            .not('user_profiles', 'is', null) // 只查询有用户资料的兑换码
            .ilike('user_profiles.name', `%${searchTerm}%`)
            .order('created_at', { ascending: false })

          const nameResult = await nameSearchQuery
          
          if (nameResult.data) {
            nameResult.data.forEach(item => {
              if (!searchIds.has(item.id)) {
                searchResults.push(item)
                searchIds.add(item.id)
              }
            })
          }
        } catch (nameError) {
          console.warn('🔍 用户名搜索失败:', nameError)
        }

        // 2. 再搜索手机号（如果还没有足够结果）
        try {
          const phoneSearchQuery = supabase
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
                  phone_number,
                  latest_verification_code,
                  verification_code_expires_at
                )
              )
            `)
            .not('user_profiles', 'is', null) // 只查询有用户资料的兑换码
            .not('user_profiles.users', 'is', null) // 确保有用户数据
            .ilike('user_profiles.users.phone_number', `%${searchTerm}%`)
            .order('created_at', { ascending: false })

          const phoneResult = await phoneSearchQuery
          
          if (phoneResult.data) {
            phoneResult.data.forEach(item => {
              if (!searchIds.has(item.id)) {
                searchResults.push(item)
                searchIds.add(item.id)
              }
            })
          }
        } catch (phoneError) {
          console.warn('🔍 手机号搜索失败:', phoneError)
        }

        // 3. 按创建时间倒序排序合并的结果
        searchResults.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        // 4. 手动分页
        const totalFiltered = searchResults.length
        const startIndex = offset
        const endIndex = Math.min(startIndex + validatedPageSize, totalFiltered)
        const paginatedData = searchResults.slice(startIndex, endIndex)

        data = paginatedData
        error = null
        count = totalFiltered

        console.log('✅ 搜索完成:', {
          searchTerm,
          totalFound: totalFiltered,
          currentPage: paginatedData.length,
          searchMethod: '数据库级分别搜索'
        })
        
      } catch (searchError) {
        console.error('🔍 搜索查询失败:', searchError)
        throw searchError
      }
    } else {
      // 没有搜索，执行普通分页查询
      const query = supabase
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
              phone_number,
              latest_verification_code,
              verification_code_expires_at
            )
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + validatedPageSize - 1)

      const result = await query
      data = result.data
      error = result.error
      count = result.count
      console.log('✅ 普通查询完成:', { dataCount: data?.length, count })
    }
    
    if (error) {
      console.error('❌ Supabase查询错误:', error)
      throw error
    }

    // 处理数据格式，展平用户信息
    const processedData = data?.map(item => ({
      ...item,
      // 添加与SQL查询一致的字段名
      user_profiles_id: item.user_profiles?.id || null,
      user_profiles_name: item.user_profiles?.name || null,
      user_profiles_chat_remaining_count: item.user_profiles?.chat_remaining_count || null,
      user_profiles_user_role: item.user_profiles?.user_role || null,
      users_id: item.user_profiles?.users?.id || null,
      users_phone_number: item.user_profiles?.users?.phone_number || null,
      // 添加验证码相关字段
      latest_verification_code: item.user_profiles?.users?.latest_verification_code || null,
      verification_code_expires_at: item.user_profiles?.users?.verification_code_expires_at || null,
      // 保留原有字段以保持兼容性
      user_phone: item.user_profiles?.phone_number || item.user_profiles?.users?.phone_number || null,
      user_name: item.user_profiles?.name || null, 
      remaining_tokens: item.user_profiles?.chat_remaining_count || null,
      chat_total_count: item.chat_total_count || null,
      user_role: item.user_profiles?.user_role || item.user_role || null
    })) || []

    const total = count || 0
    const totalPages = Math.ceil(total / validatedPageSize)

    console.log('✅ 成功获取兑换码数据:', {
      dataCount: processedData.length,
      total,
      page: validatedPage,
      pageSize: validatedPageSize,
      totalPages,
      hasSearch: !!search
    })

    return NextResponse.json({
      success: true,
      data: processedData,
      pagination: {
        page: validatedPage,
        pageSize: validatedPageSize,
        total,
        totalPages,
        hasNext: validatedPage < totalPages,
        hasPrev: validatedPage > 1
      }
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
        remarks: remarks || `批量生成 ${new Date().toLocaleString()}`,
        chat_total_count: 2, // 设置默认的预设对话次数为2
        user_role: 'basic_user' // 设置默认的用户角色
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

    const { id, remarks, remainingTokens, chatTotalCount, userRole, hasUserData } = await request.json()

    if (!id) {
      return NextResponse.json(
        { success: false, message: '缺少兑换码ID' },
        { status: 400 }
      )
    }

    // 首先获取当前兑换码数据以检查激活状态
    const { data: currentCodeData, error: fetchError } = await supabaseAdmin
      .from('invite_codes')
      .select('used_by')
      .eq('id', id)
      .single()

    if (fetchError) {
      throw fetchError
    }

    const isActivated = !!currentCodeData?.used_by

    // 根据激活状态更新不同的字段
    if (isActivated) {
      // 已激活用户：更新兑换码备注和用户资料信息
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

      // 更新用户资料中的信息
      const userProfileId = currentCodeData.used_by
      const { data: userUpdateData, error: userUpdateError } = await supabaseAdmin
        .from('user_profiles')
        .update({
          chat_remaining_count: remainingTokens,
          user_role: userRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userProfileId)
        .select()

      if (userUpdateError) {
        console.error('更新用户信息失败:', userUpdateError)
        // 不抛出错误，因为兑换码更新已成功
      } else {
        console.log('✅ 用户信息更新成功:', userProfileId, userUpdateData)
      }
    } else {
      // 未激活用户：更新兑换码的备注、预设角色和预设对话次数
      const updateData: any = {
        remarks: remarks || null,
        user_role: userRole, // 更新预设的用户角色
        updated_at: new Date().toISOString()
      }
      
      // 如果提供了 chatTotalCount，则更新预设对话次数
      if (chatTotalCount !== undefined && chatTotalCount !== null) {
        updateData.chat_total_count = chatTotalCount
      }
      
      const { data: inviteCodeData, error: inviteCodeError } = await supabaseAdmin
        .from('invite_codes')
        .update(updateData)
        .eq('id', id)
        .select()

      if (inviteCodeError) {
        throw inviteCodeError
      }

      console.log('✅ 未激活兑换码更新成功，预设角色:', userRole, '预设对话次数:', chatTotalCount)
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
            phone_number,
            latest_verification_code,
            verification_code_expires_at
          )
        )
      `)
      .eq('id', id)
      .single()

    if (refetchError) {
      console.error('重新查询数据失败:', refetchError)
      // 如果重新查询失败，返回成功但要求前端刷新
      return NextResponse.json({
        success: true,
        message: '兑换码更新成功，请刷新页面查看最新数据',
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
      // 添加验证码相关字段
      latest_verification_code: updatedData.user_profiles?.users?.latest_verification_code || null,
      verification_code_expires_at: updatedData.user_profiles?.users?.verification_code_expires_at || null,
      // 保留原有字段以保持兼容性
      user_phone: updatedData.user_profiles?.phone_number || updatedData.user_profiles?.users?.phone_number || null,
      user_name: updatedData.user_profiles?.name || null,
      remaining_tokens: updatedData.user_profiles?.chat_remaining_count || null,
      chat_total_count: updatedData.chat_total_count || null, // 添加 invite_codes 表的 chat_total_count 字段
      user_role: updatedData.user_profiles?.user_role || updatedData.user_role || null // 已激活用户从user_profiles取，未激活从invite_codes取
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
