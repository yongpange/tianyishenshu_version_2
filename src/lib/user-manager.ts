// 用户管理系统 - 处理用户创建、资料管理等
import { supabaseAdmin } from '@/lib/supabase'
import { UserInfo } from '@/lib/coze-client'

export interface User {
  id: string
  phone_number: string
  created_at: string
  updated_at: string
  invite_code_used?: string
  permissions: string[]
}

export interface UserProfile {
  id: string
  user_id: string
  name: string
  gender: 'male' | 'female'
  year: number
  month: number
  day: number
  hour: number
  minute: number
  area_province: string
  area_city: string
  area_district: string
  // 移除 phone_number 字段，避免与 users 表冗余，通过 users 表获取
  created_at: string
  updated_at: string
  parent_id?: string | null
}

// 创建或获取用户
export async function createOrGetUser(phoneNumber: string, inviteCode?: string): Promise<User> {
  try {
    // 首先尝试获取现有用户
    const { data: existingUser, error: selectError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single()

    if (existingUser) {
      console.log('✅ 找到现有用户:', existingUser.id)
      return existingUser
    }

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('查询用户失败:', selectError)
      throw selectError
    }

    console.log('📝 创建新用户:', phoneNumber)

    // 用户不存在，创建新用户（使用管理员权限）
    const userData: any = {
      phone_number: phoneNumber,
      permissions: ['basic'],
      is_profile_completed: false,
      last_login: new Date().toISOString()
    }

    if (inviteCode) {
      // 注意：不在注册时设置invite_code_used，等用户在profile页面完成时再标记
      // 如果有邀请码，给予额外权限
      userData.permissions = ['basic', 'premium']
      console.log('🎟️ 用户使用邀请码:', inviteCode)
    }

    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert(userData)
      .select()
      .single()

    if (insertError) {
      console.error('插入用户失败:', insertError)
      throw insertError
    }

    console.log('✅ 用户创建成功:', newUser.id)
    
    // 移除创建假用户资料记录的逻辑
    // 用户资料将在用户填写profile时由saveUserProfile函数创建
    console.log('ℹ️ 用户资料将在用户填写profile时创建')

    return newUser
  } catch (error) {
    console.error('创建或获取用户失败:', error)
    throw new Error('用户操作失败')
  }
}

// 保存用户资料
export async function saveUserProfile(phoneNumber: string, userInfo: UserInfo): Promise<UserProfile> {
  try {
    console.log('🔄 开始保存用户资料:', { phoneNumber, userInfo })

    // 获取用户ID
    const user = await createOrGetUser(phoneNumber)
    console.log('✅ 获取到用户:', user.id)

    // 检查该用户是否已有任何用户资料记录
    const { data: existingProfiles, error: checkError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, parent_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (checkError) {
      console.error('查询现有用户资料失败:', checkError)
      throw new Error('查询现有用户资料失败')
    }

    let parentId: string | null = null

    if (!existingProfiles || existingProfiles.length === 0) {
      // 这是该用户的第一个资料记录，作为主用户，parent_id设置为null
      console.log('ℹ️ 这是用户的第一个资料记录，将作为主用户创建（parent_id为空）')
      parentId = null
    } else {
      // 查找现有的主用户资料（parent_id为空的记录）
      const parentProfile = existingProfiles.find(profile => profile.parent_id === null)
      if (parentProfile) {
        parentId = parentProfile.id
        console.log('✅ 找到主用户资料，将作为父级:', parentId)
      } else {
        // 如果没有找到parent_id为空的记录，说明数据可能有问题
        // 这种情况下，新建的记录作为主用户
        console.log('⚠️ 未找到主用户资料，新建记录将作为主用户（parent_id为空）')
        parentId = null
      }
    }

    // 获取用户的invite_code_used（如果存在）
    const { data: userWithInviteCode, error: userQueryError } = await supabaseAdmin
      .from('users')
      .select('invite_code_used')
      .eq('id', user.id)
      .single()

    if (userQueryError) {
      console.error('查询用户invite_code失败:', userQueryError)
    }

    const inviteCodeUsed = userWithInviteCode?.invite_code_used

    const profileData = {
      user_id: user.id,
      name: userInfo.name,
      gender: userInfo.gender,
      year: userInfo.year,
      month: userInfo.month,
      day: userInfo.day,
      hour: userInfo.hour,
      minute: userInfo.minute,
      area_province: userInfo.area.province,
      area_city: userInfo.area.city,
      area_district: userInfo.area.district,
      phone_number: phoneNumber, // 保留 phone_number 字段，因为它是 NOT NULL
      invite_code_used: inviteCodeUsed, // 保存invite_code到user_profiles表
      parent_id: parentId // 设置父级ID
    }

    console.log('📝 准备保存的资料数据:', profileData)

    // 使用管理员权限保存用户资料
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .insert(profileData)
      .select()
      .single()

    if (error) {
      console.error('❌ Supabase保存错误:', error)
      console.error('错误详情:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      throw error
    }

    console.log('✅ 用户资料保存成功:', data.id)

    // 如果有invite_code，更新invite_codes表
    if (inviteCodeUsed) {
      try {
        console.log('🔄 更新invite_codes表，invite_code:', inviteCodeUsed)
        await markInviteCodeAsUsed(inviteCodeUsed, data.id)
        console.log('✅ invite_codes表更新成功')
      } catch (inviteCodeError) {
        console.error('❌ 更新invite_codes表失败:', inviteCodeError)
        // 不抛出错误，因为用户资料已经保存成功
        console.warn('⚠️ invite_codes表更新失败，但用户资料保存成功')
      }
    } else {
      console.log('ℹ️ 用户没有使用invite_code，跳过invite_codes表更新')
    }

    return data
  } catch (error) {
    console.error('❌ 保存用户资料失败:', error)
    if (error instanceof Error && error.message) {
      throw new Error(`保存用户资料失败: ${error.message}`)
    } else {
      throw new Error('保存用户资料失败')
    }
  }
}

// 获取用户资料
export async function getUserProfile(phoneNumber: string): Promise<UserProfile | null> {
  try {
    // 使用管理员权限查询用户
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone_number', phoneNumber)
      .single()

    if (userError) {
      if (userError.code === 'PGRST116') {
        return null
      }
      throw userError
    }

    // 使用管理员权限查询用户的最新资料（按创建时间倒序）
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw error
    }

    return data
  } catch (error) {
    console.error('获取用户资料失败:', error)
    return null
  }
}

// 保存对话历史
export async function saveConversation(phoneNumber: string, conversation: any): Promise<void> {
  try {
    const user = await createOrGetUser(phoneNumber)

    // 通过 users.id 找到对应的 user_profiles.id（获取最新的资料）
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (profileError || !userProfile) {
      console.error('找不到用户资料:', profileError)
      throw new Error('用户资料不存在，无法保存对话')
    }

    // 检查对话是否已存在（通过前端ID查找）
    const { data: existingConversation } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('user_id', userProfile.id)
      .eq('title', conversation.title)
      .eq('created_at', conversation.createdAt?.toISOString() || new Date().toISOString())
      .single()

    if (existingConversation) {
      // 更新现有对话
      const { error } = await supabaseAdmin
        .from('conversations')
        .update({
          title: conversation.title,
          messages: conversation.messages,
          coze_conversation_id: conversation.cozeConversationId
        })
        .eq('id', existingConversation.id)

      if (error) {
        console.error('更新对话失败:', error)
        throw error
      }
      console.log('✅ 对话更新成功:', existingConversation.id)
    } else {
      // 创建新对话（让数据库自动生成UUID）
      const { data, error } = await supabaseAdmin
        .from('conversations')
        .insert({
          user_id: userProfile.id, // 使用 user_profiles.id
          title: conversation.title,
          messages: conversation.messages,
          coze_conversation_id: conversation.cozeConversationId
        })
        .select('id')
        .single()

      if (error) {
        console.error('创建对话失败:', error)
        throw error
      }
      console.log('✅ 对话创建成功:', data.id)
    }
  } catch (error) {
    console.error('保存对话失败:', error)
    throw new Error('保存对话失败')
  }
}

// 获取用户对话历史
export async function getUserConversations(phoneNumber: string): Promise<any[]> {
  try {
    // 查询用户
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone_number', phoneNumber)
      .single()

    if (userError) {
      if (userError.code === 'PGRST116') {
        return []
      }
      throw userError
    }

    // 通过 users.id 找到对应的 user_profiles.id（获取最新的资料）
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        return []
      }
      throw profileError
    }

    // 使用管理员权限查询对话历史
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('user_id', userProfile.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error('获取对话历史失败:', error)
    return []
  }
}

// 删除对话
export async function deleteConversationFromSupabase(phoneNumber: string, conversationId: string): Promise<void> {
  try {
    // 查询用户
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone_number', phoneNumber)
      .single()

    if (userError) {
      console.error('查询用户失败:', userError)
      throw userError
    }

    // 删除对话
    const { error } = await supabaseAdmin
      .from('conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', user.id)

    if (error) {
      console.error('删除对话失败:', error)
      throw error
    }

    console.log('✅ 对话删除成功:', conversationId)
  } catch (error) {
    console.error('删除对话失败:', error)
    throw new Error('删除对话失败')
  }
}

// 删除对话
export async function deleteConversation(phoneNumber: string, conversationId: string): Promise<void> {
  try {
    const user = await createOrGetUser(phoneNumber)

    // 通过 users.id 找到对应的 user_profiles.id（获取最新的资料）
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (profileError || !userProfile) {
      console.error('找不到用户资料:', profileError)
      throw new Error('用户资料不存在，无法删除对话')
    }

    // 使用管理员权限删除对话
    const { error } = await supabaseAdmin
      .from('conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', userProfile.id)

    if (error) {
      console.error('删除对话失败:', error)
      throw error
    }

    console.log('✅ 对话删除成功:', conversationId)
  } catch (error) {
    console.error('删除对话失败:', error)
    throw new Error('删除对话失败')
  }
}

// 为指定用户ID保存用户资料（新增用户模式）
export async function saveUserProfileToUser(userId: string, userInfo: UserInfo, inviteCode?: string): Promise<UserProfile> {
  try {
    console.log('🔄 开始为指定用户保存资料:', { userId, userInfo, inviteCode })

    // 验证用户ID格式
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      console.error('❌ 用户ID为空或无效:', userId)
      throw new Error('用户ID不能为空')
    }

    // 简单的UUID格式验证
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      console.error('❌ 用户ID格式无效，不是有效的UUID:', userId)
      throw new Error('用户ID格式无效')
    }

    console.log('✅ 用户ID验证通过:', userId)

    // 先查询用户信息获取手机号
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('phone_number')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('查询用户失败:', userError)
      throw new Error('查询用户失败')
    }

    if (!user) {
      console.error('❌ 用户不存在:', userId)
      throw new Error('用户不存在')
    }

    console.log('✅ 找到用户信息:', { userId, phone: user.phone_number })

    // 检查该用户是否已有任何用户资料记录
    const { data: existingProfiles, error: checkError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, parent_id, name')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (checkError) {
      console.error('查询现有用户资料失败:', checkError)
      throw new Error('查询现有用户资料失败')
    }

    let parentId: string | null = null

    if (!existingProfiles || existingProfiles.length === 0) {
      // 新增用户模式下，如果该用户没有任何资料记录，说明这是主用户的第一次使用
      // 这种情况下，我们需要先创建一个主用户记录作为父级
      console.log('ℹ️ 该用户还没有任何资料记录，先创建主用户记录')
      throw new Error('该账户还没有主用户资料，请先完善主用户信息')
    } else {
      // 查找现有的主用户资料（parent_id为空的记录）
      const parentProfile = existingProfiles.find(profile => profile.parent_id === null)
      if (parentProfile) {
        parentId = parentProfile.id
        console.log('✅ 找到主用户资料，将作为子账户的父级:', parentId, '主用户名称:', parentProfile.name)
      } else {
        // 如果没有找到parent_id为空的记录，说明数据有问题
        console.error('❌ 数据异常：找不到主用户资料（parent_id为空的记录）')
        throw new Error('数据异常：找不到主用户资料')
      }
    }

    const profileData = {
      user_id: userId,
      name: userInfo.name,
      gender: userInfo.gender,
      year: userInfo.year,
      month: userInfo.month,
      day: userInfo.day,
      hour: userInfo.hour,
      minute: userInfo.minute,
      area_province: userInfo.area.province,
      area_city: userInfo.area.city,
      area_district: userInfo.area.district,
      phone_number: user.phone_number, // 使用查询到的手机号
      invite_code_used: inviteCode, // 在用户资料中记录使用的兑换码
      parent_id: parentId // 设置父级ID（指向主用户的user_profiles.id）
    }

    console.log('📝 准备保存的子账户资料数据:', {
      ...profileData,
      parent_id: parentId,
      isChildAccount: true
    })

    // 使用管理员权限保存用户资料
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .insert(profileData)
      .select('*, phone_number')
      .single()

    if (error) {
      console.error('❌ Supabase保存错误:', error)
      throw error
    }

    console.log('✅ 子账户资料保存成功:', {
      id: data.id,
      name: data.name,
      parent_id: data.parent_id,
      是子账户: true
    })

    // 如果有invite_code，更新invite_codes表
    if (inviteCode) {
      try {
        console.log('🔄 更新invite_codes表，invite_code:', inviteCode)
        await markInviteCodeAsUsed(inviteCode, data.id)
        console.log('✅ invite_codes表更新成功')
      } catch (inviteCodeError) {
        console.error('❌ 更新invite_codes表失败:', inviteCodeError)
        // 不抛出错误，因为用户资料已经保存成功
        console.warn('⚠️ invite_codes表更新失败，但用户资料保存成功')
      }
    } else {
      console.log('ℹ️ 没有提供invite_code，跳过invite_codes表更新')
    }

    return data
  } catch (error) {
    console.error('❌ 保存用户资料失败:', error)
    if (error instanceof Error && error.message) {
      throw new Error(`保存用户资料失败: ${error.message}`)
    } else {
      throw new Error('保存用户资料失败')
    }
  }
}

// 验证兑换码
export async function verifyInviteCode(code: string): Promise<boolean> {
  try {
    // 使用管理员权限验证兑换码
    const { data, error } = await supabaseAdmin
      .from('invite_codes')
      .select('*')
      .eq('code', code)
      .eq('status', 'active')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('🔍 兑换码不存在或已使用:', code)
        return false
      }
      console.error('验证兑换码失败:', error)
      throw error
    }

    console.log('✅ 兑换码验证成功:', code)
    return !!data
  } catch (error) {
    console.error('验证兑换码失败:', error)
    return false
  }
}

// 标记兑换码为已使用
export async function markInviteCodeAsUsed(code: string, phoneNumberOrProfileId: string): Promise<void> {
  try {
    let profileId: string

    // 判断传入的是手机号还是 profile ID
    // 手机号通常是11位数字，profile ID 是 UUID 格式
    if (/^1[3-9]\d{9}$/.test(phoneNumberOrProfileId)) {
      // 传入的是手机号，需要查询获取 userProfile.id
      console.log('📱 传入的是手机号，查询用户资料...')
      const user = await createOrGetUser(phoneNumberOrProfileId)

      // 通过 users.id 找到对应的 user_profiles.id（获取最新的资料）
      const { data: existingProfile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (profileError && profileError.code === 'PGRST116') {
        // 用户资料不存在，不创建假数据，抛出错误
        console.log('⚠️ 用户资料不存在，无法标记兑换码')
        throw new Error('用户资料不存在，请先完善用户资料')
      } else if (profileError) {
        console.error('查询用户资料失败:', profileError)
        throw new Error('查询用户资料失败，无法标记兑换码')
      } else {
        profileId = existingProfile.id
      }
    } else {
      // 传入的是 profile ID，直接使用
      console.log('🆔 传入的是 profile ID，直接使用...')
      profileId = phoneNumberOrProfileId
    }

    console.log('🔄 标记兑换码为已使用:', { code, profileId })

    // 使用管理员权限更新兑换码状态
    const { error } = await supabaseAdmin
      .from('invite_codes')
      .update({
        status: 'used',
        used_by: profileId, // 使用 user_profiles.id
        used_at: new Date().toISOString()
      })
      .eq('code', code)

    if (error) {
      console.error('标记兑换码失败:', error)
      throw error
    }

    console.log('✅ 兑换码已标记为已使用:', code)
  } catch (error) {
    console.error('标记兑换码失败:', error)
    throw new Error('标记兑换码失败')
  }
}
