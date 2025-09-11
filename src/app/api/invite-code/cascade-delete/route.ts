import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// 应用层事务删除兑换码及其关联的所有用户数据
export async function DELETE(request: NextRequest) {
  try {
    // 检查Supabase管理员连接是否可用
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, message: '服务未正确配置，无法执行删除操作' },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url)
    const inviteCodeId = searchParams.get('id')
    const deleteUserData = searchParams.get('deleteUserData') !== 'false' // 默认删除用户数据

    if (!inviteCodeId) {
      return NextResponse.json(
        { success: false, message: '缺少兑换码ID' },
        { status: 400 }
      )
    }

    console.log('🗑️ 开始应用层事务删除兑换码:', inviteCodeId, '删除用户数据:', deleteUserData)

    // 在事务中执行所有删除操作
    const result = await executeTransactionalDelete(inviteCodeId, deleteUserData)
    
    console.log('✅ 事务删除执行结果:', result)
    
    if (!result.success) {
      const statusCode = result.has_child_users ? 409 : 400
      return NextResponse.json(result, { status: statusCode })
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ API删除操作失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: '删除操作失败: ' + (error instanceof Error ? error.message : '未知错误'),
        error_type: 'api_error'
      },
      { status: 500 }
    )
  }
}

// 应用层事务删除逻辑
async function executeTransactionalDelete(inviteCodeId: string, deleteUserData: boolean = true) {
  const stats = {
    conversations: 0,
    messages: 0,
    personality_reports: 0,
    wealth_reports: 0,
    health_reports: 0,
    marriage_reports: 0,
    bazi_reports: 0,
    user_profile: false,
    user_account: false,
    invite_code: false
  }

  try {
    // 1. 获取兑换码信息
    console.log('🔍 获取兑换码信息...')
    const { data: inviteCode, error: inviteCodeError } = await supabaseAdmin
      .from('invite_codes')
      .select(`
        id,
        code,
        status,
        used_by,
        user_profiles!left (
          id,
          name,
          parent_id,
          user_id,
          users!left (
            id,
            phone_number
          )
        )
      `)
      .eq('id', inviteCodeId)
      .single()

    if (inviteCodeError) {
      throw new Error('查询兑换码失败: ' + inviteCodeError.message)
    }

    if (!inviteCode) {
      return {
        success: false,
        message: '兑换码不存在'
      }
    }

    console.log('📋 兑换码信息:', inviteCode)

    // 2. 如果兑换码未被使用，直接删除
    if (inviteCode.status !== 'used' || !inviteCode.used_by || !deleteUserData) {
      console.log('💡 删除未使用的兑换码或仅删除兑换码')
      
      const { error: deleteError } = await supabaseAdmin
        .from('invite_codes')
        .delete()
        .eq('id', inviteCodeId)

      if (deleteError) {
        throw new Error('删除兑换码失败: ' + deleteError.message)
      }

      stats.invite_code = true

      return {
        success: true,
        message: '兑换码删除成功',
        deleted_items: stats
      }
    }

    // 3. 检查主用户是否有子用户
    const userProfile = Array.isArray(inviteCode.user_profiles) ? inviteCode.user_profiles[0] : inviteCode.user_profiles
    if (!userProfile) {
      return {
        success: false,
        message: '用户资料不存在，无法删除'
      }
    }

    if (!userProfile.parent_id) {
      console.log('🔍 检查主用户是否有子用户...')
      
      const { data: childUsers, error: childError } = await supabaseAdmin
        .from('user_profiles')
        .select('id, name')
        .eq('parent_id', userProfile.id)

      if (childError) {
        throw new Error('查询子用户失败: ' + childError.message)
      }

      if (childUsers && childUsers.length > 0) {
        return {
          success: false,
          message: `无法删除主用户，因为存在 ${childUsers.length} 个子用户：${childUsers.map(u => u.name).join(', ')}`,
          has_child_users: true,
          child_users: childUsers
        }
      }
    }

    // 4. 开始级联删除（按正确顺序）
    console.log('🗑️ 开始级联删除用户数据...')

    // 4.1 统计并删除对话和消息
    console.log('📊 统计对话和消息数量...')
    const { data: conversationsData } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('user_id', userProfile.id)

    if (conversationsData) {
      stats.conversations = conversationsData.length
      
      // 统计消息数量
      if (conversationsData.length > 0) {
        const conversationIds = conversationsData.map(c => c.id)
        const { count: messagesCount } = await supabaseAdmin
          .from('messages')
          .select('id', { count: 'exact' })
          .in('conversation_id', conversationIds)
        
        stats.messages = messagesCount || 0
      }
    }

    console.log('🗑️ 删除对话和消息...')
    const { error: conversationsError } = await supabaseAdmin
      .from('conversations')
      .delete()
      .eq('user_id', userProfile.id)

    if (conversationsError) {
      throw new Error('删除对话失败: ' + conversationsError.message)
    }

    // 4.2 删除各类报告
    const reportTables = [
      { table: 'personality_reports', key: 'personality_reports' },
      { table: 'wealth_reports', key: 'wealth_reports' },
      { table: 'health_reports', key: 'health_reports' },
      { table: 'marriage_reports', key: 'marriage_reports' },
      { table: 'bazi_reports', key: 'bazi_reports' }
    ]

    for (const { table, key } of reportTables) {
      console.log(`🗑️ 删除${table}...`)
      
      // 先统计数量
      const { count } = await supabaseAdmin
        .from(table)
        .select('id', { count: 'exact' })
        .eq('user_id', userProfile.id)
      
      stats[key as keyof typeof stats] = count || 0

      // 执行删除
      const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .eq('user_id', userProfile.id)

      if (error && error.code !== 'PGRST116') { // 忽略没有数据的错误
        console.warn(`⚠️ 删除${table}失败，但继续执行:`, error.message)
        // 不抛出错误，继续执行其他删除操作
      }
    }

    // 4.3 保留用户角色关联（不删除）
    console.log('ℹ️ 跳过用户角色删除，保留用户权限数据')

    // 4.4 删除用户资料
    console.log('🗑️ 删除用户资料...')
    const { error: userProfileError } = await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('id', userProfile.id)

    if (userProfileError) {
      throw new Error('删除用户资料失败: ' + userProfileError.message)
    }
    
    stats.user_profile = true

    // 4.5 检查是否需要删除users表记录
    if (userProfile.user_id) {
      console.log('🗑️ 检查并删除用户账户...')
      
      const { data: otherProfiles } = await supabaseAdmin
        .from('user_profiles')
        .select('id')
        .eq('user_id', userProfile.user_id)

      if (!otherProfiles || otherProfiles.length === 0) {
        console.log('🗑️ 删除用户账户记录...')
        const { error: userError } = await supabaseAdmin
          .from('users')
          .delete()
          .eq('id', userProfile.user_id)

        if (userError) {
          console.warn('⚠️ 删除用户账户失败，但不影响主流程:', userError.message)
        } else {
          stats.user_account = true
        }
      }
    }

    // 4.6 最后删除兑换码
    console.log('🗑️ 删除兑换码...')
    const { error: deleteInviteCodeError } = await supabaseAdmin
      .from('invite_codes')
      .delete()
      .eq('id', inviteCodeId)

    if (deleteInviteCodeError) {
      throw new Error('删除兑换码失败: ' + deleteInviteCodeError.message)
    }
    
    stats.invite_code = true

    console.log('✅ 级联删除完成')

    return {
      success: true,
      message: `成功删除兑换码及关联的用户数据 (${userProfile.name})`,
      deleted_user: {
        name: userProfile.name,
        phone: userProfile.users?.phone_number,
        user_id: userProfile.user_id,
        profile_id: userProfile.id
      },
      deleted_items: stats
    }

  } catch (error) {
    console.error('❌ 事务删除过程失败:', error)
    return {
      success: false,
      message: '删除操作失败: ' + (error instanceof Error ? error.message : '未知错误'),
      error_type: 'transaction_error',
      partial_stats: stats // 返回部分执行的统计信息
    }
  }
}

// 批量删除兑换码
export async function POST(request: NextRequest) {
  try {
    // 检查Supabase管理员连接是否可用
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, message: '服务未正确配置，无法执行删除操作' },
        { status: 503 }
      )
    }

    const { inviteCodeIds, deleteUserData = true } = await request.json()

    if (!inviteCodeIds || !Array.isArray(inviteCodeIds) || inviteCodeIds.length === 0) {
      return NextResponse.json(
        { success: false, message: '缺少兑换码ID列表' },
        { status: 400 }
      )
    }

    console.log('🗑️ 开始批量应用层事务删除兑换码:', inviteCodeIds.length, '个')

    // 执行批量删除
    const results = []
    let successCount = 0
    let errorCount = 0

    for (const codeId of inviteCodeIds) {
      try {
        console.log(`🔄 处理兑换码: ${codeId}`)
        const result = await executeTransactionalDelete(codeId, deleteUserData)
        
        results.push({
          id: codeId,
          result: result
        })

        if (result.success) {
          successCount++
        } else {
          errorCount++
        }

      } catch (error) {
        console.error(`❌ 删除兑换码 ${codeId} 失败:`, error)
        errorCount++
        results.push({
          id: codeId,
          result: {
            success: false,
            message: '删除失败：' + (error instanceof Error ? error.message : '未知错误'),
            error_type: 'batch_error'
          }
        })
      }
    }

    const finalResult = {
      success: errorCount === 0,
      message: `批量删除完成：成功 ${successCount} 个，失败 ${errorCount} 个`,
      summary: {
        total: inviteCodeIds.length,
        success: successCount,
        error: errorCount
      },
      results: results
    }

    console.log('✅ 批量删除执行结果:', finalResult.summary)

    return NextResponse.json(finalResult)

  } catch (error) {
    console.error('❌ API批量删除操作失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: '批量删除操作失败: ' + (error instanceof Error ? error.message : '未知错误'),
        error_type: 'api_error'
      },
      { status: 500 }
    )
  }
} 