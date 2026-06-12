import { redisCache } from '@/lib/redis'
import { supabaseAdmin } from '@/lib/supabase'
import { devLog } from '@/utils/dev-logger'

/**
 * 用户权限枚举
 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

/**
 * 缓存的用户会话信息
 */
export interface CachedUserSession {
  // 基本信息
  userId: string
  userProfileId: string
  phoneNumber: string
  name?: string
  nickname?: string
  
  // 个人信息
  birthDate?: string
  birthTime?: string
  birthLocation?: string
  gender?: string
  
  // 权限信息
  role: UserRole
  permissions: string[]
  
  // 状态信息
  isActive: boolean
  chatCredits: number
  
  // 缓存元数据
  cachedAt: string
  source: 'redis' | 'database'
}

/**
 * 用户会话缓存管理器
 */
export class UserSessionCacheManager {
  private static instance: UserSessionCacheManager
  
  // 缓存键前缀
  private readonly SESSION_PREFIX = 'user_session:'
  private readonly PROFILE_PREFIX = 'user_profile:'
  private readonly PERMISSIONS_PREFIX = 'user_permissions:'
  
  // 缓存TTL（秒）
  private readonly SESSION_TTL = 1800 // 30分钟
  private readonly PROFILE_TTL = 3600 // 1小时
  private readonly PERMISSIONS_TTL = 7200 // 2小时
  
  private constructor() {}
  
  static getInstance(): UserSessionCacheManager {
    if (!UserSessionCacheManager.instance) {
      UserSessionCacheManager.instance = new UserSessionCacheManager()
    }
    return UserSessionCacheManager.instance
  }

  /**
   * 生成缓存键
   */
  private getSessionKey(userId: string): string {
    return `${this.SESSION_PREFIX}${userId}`
  }

  private getProfileKey(userProfileId: string): string {
    return `${this.PROFILE_PREFIX}${userProfileId}`
  }

  private getPermissionsKey(userId: string): string {
    return `${this.PERMISSIONS_PREFIX}${userId}`
  }

  /**
   * 获取用户会话信息（优先Redis，降级数据库）
   */
  async getUserSession(userId: string): Promise<CachedUserSession | null> {
    try {
      // 1. 先从Redis获取
      const key = this.getSessionKey(userId)
      const cached = await redisCache.get<CachedUserSession>(key)
      
      if (cached) {
        devLog.log(`✅ 用户会话缓存命中: ${userId}`)
        return { ...cached, source: 'redis' }
      }
      
      // 2. Redis未命中，从数据库获取
      devLog.log(`🔍 用户会话缓存未命中，查询数据库: ${userId}`)
      const dbSession = await this.getSessionFromDatabase(userId)
      
      if (dbSession) {
        // 异步缓存到Redis
        this.setUserSession(userId, dbSession).catch(err => {
          devLog.warn(`⚠️ 异步缓存用户会话失败: ${userId}`, err)
        })
        
        return { ...dbSession, source: 'database' }
      }
      
      return null
    } catch (error) {
      devLog.error(`❌ 获取用户会话失败: ${userId}`, error)
      return null
    }
  }

  /**
   * 设置用户会话到Redis
   */
  async setUserSession(userId: string, session: Omit<CachedUserSession, 'source'>): Promise<boolean> {
    try {
      const key = this.getSessionKey(userId)
      const success = await redisCache.set(key, session, this.SESSION_TTL)
      
      if (success) {
        devLog.log(`📝 用户会话已缓存: ${userId}`, { 
          name: session.name, 
          role: session.role,
          chatCredits: session.chatCredits 
        })
      }
      
      return success
    } catch (error) {
      devLog.error(`❌ 缓存用户会话失败: ${userId}`, error)
      return false
    }
  }

  /**
   * 通过手机号获取用户会话
   */
  async getUserSessionByPhone(phoneNumber: string): Promise<CachedUserSession | null> {
    try {
      // 先查找用户ID
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('phone_number', phoneNumber)
        .single()

      if (error || !user) {
        devLog.log(`❌ 手机号对应的用户不存在: ${phoneNumber}`)
        return null
      }

      return await this.getUserSession(user.id)
    } catch (error) {
      devLog.error(`❌ 通过手机号获取用户会话失败: ${phoneNumber}`, error)
      return null
    }
  }

  /**
   * 通过用户资料ID获取会话信息
   */
  async getUserSessionByProfileId(userProfileId: string): Promise<CachedUserSession | null> {
    try {
      // 1. 先从Redis获取
      const key = this.getProfileKey(userProfileId)
      const cached = await redisCache.get<CachedUserSession>(key)
      
      if (cached) {
        devLog.log(`✅ 用户资料缓存命中: ${userProfileId}`)
        return { ...cached, source: 'redis' }
      }
      
      // 2. 从数据库获取
      const { data: profile, error } = await supabaseAdmin
        .from('user_profiles')
        .select('user_id')
        .eq('id', userProfileId)
        .single()

      if (error || !profile) {
        devLog.log(`❌ 用户资料不存在: ${userProfileId}`)
        return null
      }

      const session = await this.getUserSession(profile.user_id)
      
      if (session) {
        // 同时缓存到资料ID键
        await redisCache.set(key, session, this.PROFILE_TTL).catch(err => {
          devLog.warn(`⚠️ 缓存用户资料会话失败: ${userProfileId}`, err)
        })
      }
      
      return session
    } catch (error) {
      devLog.error(`❌ 通过用户资料ID获取会话失败: ${userProfileId}`, error)
      return null
    }
  }

  /**
   * 更新用户会话信息
   */
  async updateUserSession(
    userId: string, 
    updates: Partial<Omit<CachedUserSession, 'userId' | 'cachedAt' | 'source'>>
  ): Promise<boolean> {
    try {
      // 获取当前会话
      const currentSession = await this.getUserSession(userId)
      
      if (!currentSession) {
        devLog.warn(`⚠️ 用户会话不存在，无法更新: ${userId}`)
        return false
      }
      
      // 合并更新
      const updatedSession: Omit<CachedUserSession, 'source'> = {
        ...currentSession,
        ...updates,
        cachedAt: new Date().toISOString()
      }
      
      // 更新Redis缓存
      const success = await this.setUserSession(userId, updatedSession)
      
      if (success) {
        // 同时清除相关的资料ID缓存
        const profileKey = this.getProfileKey(updatedSession.userProfileId)
        await redisCache.del(profileKey).catch(err => {
          devLog.warn(`⚠️ 清除用户资料缓存失败: ${updatedSession.userProfileId}`, err)
        })
        
        devLog.log(`✅ 用户会话更新成功: ${userId}`, updates)
      }
      
      return success
    } catch (error) {
      devLog.error(`❌ 更新用户会话失败: ${userId}`, error)
      return false
    }
  }

  /**
   * 获取用户权限
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    try {
      // 1. 先从Redis获取
      const key = this.getPermissionsKey(userId)
      const cached = await redisCache.get<string[]>(key)
      
      if (cached) {
        devLog.log(`✅ 用户权限缓存命中: ${userId}`)
        return cached
      }
      
      // 2. 从数据库获取
      const { data: permissions, error } = await supabaseAdmin
        .from('user_permissions')
        .select('permission')
        .eq('user_id', userId)

      if (error) {
        devLog.error(`❌ 查询用户权限失败: ${userId}`, error)
        return []
      }

      const permissionList = permissions?.map(p => p.permission) || []
      
      // 异步缓存权限
      redisCache.set(key, permissionList, this.PERMISSIONS_TTL).catch(err => {
        devLog.warn(`⚠️ 缓存用户权限失败: ${userId}`, err)
      })
      
      devLog.log(`📋 用户权限查询成功: ${userId}`, { count: permissionList.length })
      return permissionList
    } catch (error) {
      devLog.error(`❌ 获取用户权限失败: ${userId}`, error)
      return []
    }
  }

  /**
   * 检查用户是否有特定权限
   */
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const permissions = await this.getUserPermissions(userId)
      return permissions.includes(permission)
    } catch (error) {
      devLog.error(`❌ 检查用户权限失败: ${userId}`, error)
      return false
    }
  }

  /**
   * 清除用户会话缓存
   */
  async clearUserSession(userId: string, userProfileId?: string): Promise<boolean> {
    try {
      const sessionKey = this.getSessionKey(userId)
      const permissionsKey = this.getPermissionsKey(userId)
      
      const sessionDeleted = await redisCache.del(sessionKey)
      const permissionsDeleted = await redisCache.del(permissionsKey)
      
      let profileDeleted = false
      if (userProfileId) {
        const profileKey = this.getProfileKey(userProfileId)
        profileDeleted = await redisCache.del(profileKey)
      }
      
      devLog.log(`🗑️ 清除用户会话缓存: ${userId}`, { 
        sessionDeleted, 
        permissionsDeleted,
        profileDeleted 
      })
      
      return sessionDeleted || permissionsDeleted || profileDeleted
    } catch (error) {
      devLog.error(`❌ 清除用户会话缓存失败: ${userId}`, error)
      return false
    }
  }

  /**
   * 从数据库获取用户会话信息
   */
  private async getSessionFromDatabase(userId: string): Promise<Omit<CachedUserSession, 'source'> | null> {
    try {
      // 查询用户基本信息
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, phone_number, role, is_active, chat_credits')
        .eq('id', userId)
        .single()

      if (userError || !user) {
        devLog.error(`❌ 用户不存在: ${userId}`, userError)
        return null
      }

      // 查询用户资料信息（主资料）
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('id, name, nickname, birth_date, birth_time, birth_location, gender')
        .eq('user_id', userId)
        .is('parent_id', null) // 只查找主用户资料
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        devLog.error(`❌ 查询用户资料失败: ${userId}`, profileError)
      }

      // 获取用户权限
      const permissions = await this.getUserPermissions(userId)

      const session: Omit<CachedUserSession, 'source'> = {
        userId: user.id,
        userProfileId: profile?.id || '',
        phoneNumber: user.phone_number,
        name: profile?.name,
        nickname: profile?.nickname,
        birthDate: profile?.birth_date,
        birthTime: profile?.birth_time,
        birthLocation: profile?.birth_location,
        gender: profile?.gender,
        role: user.role || UserRole.USER,
        permissions,
        isActive: user.is_active || true,
        chatCredits: user.chat_credits || 0,
        cachedAt: new Date().toISOString()
      }

      return session
    } catch (error) {
      devLog.error(`❌ 数据库获取用户会话失败: ${userId}`, error)
      return null
    }
  }

  /**
   * 批量预热用户会话缓存
   */
  async preloadUserSessions(userIds: string[]): Promise<number> {
    try {
      let loaded = 0
      
      for (const userId of userIds) {
        try {
          const session = await this.getUserSession(userId)
          if (session) loaded++
        } catch (error) {
          devLog.warn(`⚠️ 预热用户会话失败: ${userId}`, error)
        }
      }
      
      devLog.log(`🔥 批量预热用户会话缓存完成`, { total: userIds.length, loaded })
      return loaded
    } catch (error) {
      devLog.error(`❌ 批量预热用户会话缓存失败`, error)
      return 0
    }
  }
}

// 导出单例实例
export const userSessionCache = UserSessionCacheManager.getInstance()
