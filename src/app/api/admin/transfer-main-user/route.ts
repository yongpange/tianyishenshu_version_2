import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// 转移主用户身份 - 将子用户提升为主用户
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, message: '服务未正确配置' },
        { status: 503 }
      )
    }

    const { mainUserId, newMainUserId } = await request.json()

    if (!mainUserId || !newMainUserId) {
      return NextResponse.json(
        { success: false, message: '缺少必要参数' },
        { status: 400 }
      )
    }

    console.log('🔄 开始转移主用户身份:', { mainUserId, newMainUserId })

    // 1. 检查当前主用户是否存在且确实是主用户
    const { data: currentMainUser, error: mainUserError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, name, parent_id, user_id')
      .eq('id', mainUserId)
      .single()

    if (mainUserError || !currentMainUser) {
      return NextResponse.json(
        { success: false, message: '主用户不存在' },
        { status: 404 }
      )
    }

    if (currentMainUser.parent_id) {
      return NextResponse.json(
        { success: false, message: '指定的用户不是主用户' },
        { status: 400 }
      )
    }

    // 2. 检查目标子用户是否存在且确实是子用户
    const { data: targetChildUser, error: childUserError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, name, parent_id, user_id')
      .eq('id', newMainUserId)
      .single()

    if (childUserError || !targetChildUser) {
      return NextResponse.json(
        { success: false, message: '目标子用户不存在' },
        { status: 404 }
      )
    }

    if (targetChildUser.parent_id !== mainUserId) {
      return NextResponse.json(
        { success: false, message: '目标用户不是指定主用户的子用户' },
        { status: 400 }
      )
    }

    // 3. 获取所有其他子用户
    const { data: otherChildUsers, error: otherChildError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, name')
      .eq('parent_id', mainUserId)
      .neq('id', newMainUserId)

    if (otherChildError) {
      console.error('❌ 查询其他子用户失败:', otherChildError)
      throw otherChildError
    }

    console.log('📋 转移计划:', {
      currentMain: currentMainUser.name,
      newMain: targetChildUser.name,
      otherChildren: otherChildUsers?.length || 0
    })

    // 4. 开始转移操作
    try {
      // 4.1 将目标子用户提升为主用户（清除parent_id）
      const { error: promoteError } = await supabaseAdmin
        .from('user_profiles')
        .update({
          parent_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', newMainUserId)

      if (promoteError) {
        console.error('❌ 提升子用户为主用户失败:', promoteError)
        throw promoteError
      }

      // 4.2 将原主用户降级为子用户
      const { error: demoteError } = await supabaseAdmin
        .from('user_profiles')
        .update({
          parent_id: newMainUserId,
          updated_at: new Date().toISOString()
        })
        .eq('id', mainUserId)

      if (demoteError) {
        console.error('❌ 降级主用户失败:', demoteError)
        // 回滚：将新主用户重新设为子用户
        await supabaseAdmin
          .from('user_profiles')
          .update({
            parent_id: mainUserId,
            updated_at: new Date().toISOString()
          })
          .eq('id', newMainUserId)
        
        throw demoteError
      }

      // 4.3 将其他子用户的parent_id改为新主用户
      if (otherChildUsers && otherChildUsers.length > 0) {
        const { error: updateOthersError } = await supabaseAdmin
          .from('user_profiles')
          .update({
            parent_id: newMainUserId,
            updated_at: new Date().toISOString()
          })
          .in('id', otherChildUsers.map(user => user.id))

        if (updateOthersError) {
          console.error('❌ 更新其他子用户失败:', updateOthersError)
          // 这里可以选择回滚或者继续，因为主要操作已完成
          console.warn('⚠️ 部分子用户parent_id更新失败，但主用户转移已完成')
        }
      }

      console.log('✅ 主用户身份转移成功')

      return NextResponse.json({
        success: true,
        message: `成功将主用户身份从 "${currentMainUser.name}" 转移给 "${targetChildUser.name}"`
      })

    } catch (transferError) {
      console.error('❌ 转移过程中出现错误:', transferError)
      throw transferError
    }

  } catch (error) {
    console.error('转移主用户身份失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: '转移失败: ' + (error instanceof Error ? error.message : '未知错误')
      },
      { status: 500 }
    )
  }
} 