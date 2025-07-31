import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// 级联删除兑换码及其关联的所有用户数据
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

    if (!inviteCodeId) {
      return NextResponse.json(
        { success: false, message: '缺少兑换码ID' },
        { status: 400 }
      )
    }

    console.log('🗑️ 开始级联删除兑换码:', inviteCodeId)

    // 1. 获取兑换码信息，查看是否已被使用
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
          users (phone_number)
        )
      `)
      .eq('id', inviteCodeId)
      .single()

    if (inviteCodeError) {
      console.error('❌ 查询兑换码失败:', inviteCodeError)
      throw inviteCodeError
    }

    if (!inviteCode) {
      return NextResponse.json(
        { success: false, message: '兑换码不存在' },
        { status: 404 }
      )
    }

    console.log('📋 兑换码信息:', inviteCode)

    // 2. 如果兑换码未被使用，直接删除兑换码
    if (inviteCode.status !== 'used' || !inviteCode.used_by) {
      console.log('💡 兑换码未被使用，直接删除')
      
      const { error: deleteError } = await supabaseAdmin
        .from('invite_codes')
        .delete()
        .eq('id', inviteCodeId)

      if (deleteError) {
        throw deleteError
      }

      return NextResponse.json({
        success: true,
        message: '兑换码删除成功'
      })
    }

    // 3. 兑换码已被使用，需要级联删除用户数据
    const userProfileId = inviteCode.used_by
    const userProfile = inviteCode.user_profiles

    if (!userProfile) {
      return NextResponse.json(
        { success: false, message: '用户资料不存在，无法删除' },
        { status: 404 }
      )
    }

    console.log('👤 用户资料信息:', userProfile)

    // 4. 检查是否为主用户，如果是主用户且有子用户则不能删除
    if (!(userProfile as any).parent_id) {
      console.log('🔍 检查主用户是否有子用户...')
      
      const { data: childUsers, error: childError } = await supabaseAdmin
        .from('user_profiles')
        .select('id, name')
        .eq('parent_id', userProfileId)

      if (childError) {
        console.error('❌ 查询子用户失败:', childError)
        throw childError
      }

      if (childUsers && childUsers.length > 0) {
        console.log('⚠️ 发现子用户:', childUsers)
        return NextResponse.json({
          success: false,
          message: `无法删除主用户，因为存在 ${childUsers.length} 个子用户。请先删除或转移子用户：${childUsers.map((u: any) => u.name).join(', ')}`,
          hasChildUsers: true,
          childUsers: childUsers
        }, { status: 409 })
      }
    }

    // 5. 开始级联删除用户数据
    console.log('🗑️ 开始级联删除用户数据...')

    try {
      // 删除顺序：从子表到父表，避免外键约束问题
      
      // 5.1 删除消息 (通过conversations级联删除)
      console.log('🗑️ 删除对话和消息...')
      const { error: conversationsError } = await supabaseAdmin
        .from('conversations')
        .delete()
        .eq('user_id', userProfileId)

      if (conversationsError) {
        console.error('❌ 删除对话失败:', conversationsError)
        throw conversationsError
      }

      // 5.2 删除各类报告
      console.log('🗑️ 删除性格报告...')
      const { error: personalityError } = await supabaseAdmin
        .from('personality_reports')
        .delete()
        .eq('user_id', userProfileId)

      if (personalityError && personalityError.code !== 'PGRST116') { // 忽略没有数据的错误
        console.error('❌ 删除性格报告失败:', personalityError)
        throw personalityError
      }

      console.log('🗑️ 删除财富报告...')
      const { error: wealthError } = await supabaseAdmin
        .from('wealth_reports')
        .delete()
        .eq('user_id', userProfileId)

      if (wealthError && wealthError.code !== 'PGRST116') {
        console.error('❌ 删除财富报告失败:', wealthError)
        throw wealthError
      }

      console.log('🗑️ 删除健康报告...')
      const { error: healthError } = await supabaseAdmin
        .from('health_reports')
        .delete()
        .eq('user_id', userProfileId)

      if (healthError && healthError.code !== 'PGRST116') {
        console.error('❌ 删除健康报告失败:', healthError)
        throw healthError
      }

      console.log('🗑️ 删除婚姻报告...')
      const { error: marriageError } = await supabaseAdmin
        .from('marriage_reports')
        .delete()
        .eq('user_id', userProfileId)

      if (marriageError && marriageError.code !== 'PGRST116') {
        console.error('❌ 删除婚姻报告失败:', marriageError)
        throw marriageError
      }

      console.log('🗑️ 删除八字报告...')
      const { error: baziError } = await supabaseAdmin
        .from('bazi_reports')
        .delete()
        .eq('user_id', userProfileId)

      if (baziError && baziError.code !== 'PGRST116') {
        console.error('❌ 删除八字报告失败:', baziError)
        throw baziError
      }

      // 5.3 删除用户资料
      console.log('🗑️ 删除用户资料...')
      const { error: userProfileError } = await supabaseAdmin
        .from('user_profiles')
        .delete()
        .eq('id', userProfileId)

      if (userProfileError) {
        console.error('❌ 删除用户资料失败:', userProfileError)
        throw userProfileError
      }

      // 5.4 如果用户资料删除成功，检查并删除users表中的记录
      if ((userProfile as any).user_id) {
        console.log('🗑️ 检查并删除用户账户...')
        
        // 检查该用户是否还有其他用户资料
        const { data: otherProfiles, error: checkError } = await supabaseAdmin
          .from('user_profiles')
          .select('id')
          .eq('user_id', (userProfile as any).user_id)

        if (checkError) {
          console.error('❌ 检查其他用户资料失败:', checkError)
          throw checkError
        }

        // 如果没有其他资料，删除users表记录
        if (!otherProfiles || otherProfiles.length === 0) {
          console.log('🗑️ 删除用户账户记录...')
          const { error: userError } = await supabaseAdmin
            .from('users')
            .delete()
            .eq('id', (userProfile as any).user_id)

          if (userError) {
            console.error('❌ 删除用户账户失败:', userError)
            // 不抛出错误，因为主要的删除已经完成
          }
        }
      }

      // 5.5 最后删除兑换码
      console.log('🗑️ 删除兑换码...')
      const { error: deleteInviteCodeError } = await supabaseAdmin
        .from('invite_codes')
        .delete()
        .eq('id', inviteCodeId)

      if (deleteInviteCodeError) {
        console.error('❌ 删除兑换码失败:', deleteInviteCodeError)
        throw deleteInviteCodeError
      }

      console.log('✅ 级联删除成功完成')

      return NextResponse.json({
        success: true,
        message: `成功删除兑换码及关联的用户数据 (${(userProfile as any).name})`
      })

    } catch (deleteError) {
      console.error('❌ 级联删除过程中出现错误:', deleteError)
      throw deleteError
    }

  } catch (error) {
    console.error('删除操作失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: '删除操作失败: ' + (error instanceof Error ? error.message : '未知错误')
      },
      { status: 500 }
    )
  }
} 