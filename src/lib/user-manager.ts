// 用户管理系统 - 处理用户创建、资料管理等
import { supabase, supabaseAdmin } from '@/lib/supabase'
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
  phone_number: string
  created_at: string
  updated_at: string
}

// 创建或获取用户
export async function createOrGetUser(phoneNumber: string, inviteCode?: string): Promise<User> {
  try {
    // 首先尝试获取现有用户（使用管理员权限）
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
      permissions: ['basic']
    }

    if (inviteCode) {
      userData.invite_code_used = inviteCode
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
    return newUser
  } catch (error) {
    console.error('创建或获取用户失败:', error)
    throw new Error('用户操作失败')
  }
}

// 保存用户资料
export async function saveUserProfile(phoneNumber: string, userInfo: UserInfo): Promise<UserProfile> {
  try {
    // 获取用户ID
    const user = await createOrGetUser(phoneNumber)

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
      phone_number: phoneNumber
    }

    // 使用管理员权限保存用户资料
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .upsert(profileData)
      .select()
      .single()

    if (error) {
      console.error('保存用户资料失败:', error)
      throw error
    }

    console.log('✅ 用户资料保存成功:', data.id)
    return data
  } catch (error) {
    console.error('保存用户资料失败:', error)
    throw new Error('保存用户资料失败')
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

    // 使用管理员权限查询用户资料
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
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

    // 使用管理员权限保存对话
    const { error } = await supabaseAdmin
      .from('conversations')
      .upsert({
        id: conversation.id,
        user_id: user.id,
        title: conversation.title,
        messages: conversation.messages
      })

    if (error) {
      console.error('保存对话失败:', error)
      throw error
    }

    console.log('✅ 对话保存成功:', conversation.id)
  } catch (error) {
    console.error('保存对话失败:', error)
    throw new Error('保存对话失败')
  }
}

// 获取用户对话历史
export async function getUserConversations(phoneNumber: string): Promise<any[]> {
  try {
    // 使用管理员权限查询用户
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

    // 使用管理员权限查询对话历史
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
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
export async function deleteConversation(phoneNumber: string, conversationId: string): Promise<void> {
  try {
    const user = await createOrGetUser(phoneNumber)

    // 使用管理员权限删除对话
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
export async function markInviteCodeAsUsed(code: string, phoneNumber: string): Promise<void> {
  try {
    const user = await createOrGetUser(phoneNumber)

    // 使用管理员权限更新兑换码状态
    const { error } = await supabaseAdmin
      .from('invite_codes')
      .update({
        status: 'used',
        used_by: user.id,
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
