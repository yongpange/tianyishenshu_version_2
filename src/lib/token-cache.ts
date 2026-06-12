import { redisCache } from '@/lib/redis'
import { supabaseAdmin } from '@/lib/supabase'
import { devLog } from '@/utils/dev-logger'

/**
 * Token缓存接口
 */
interface CachedToken {
  token: string
  expiresAt: string
  createdAt: string
  source: 'redis' | 'database'
}

/**
 * Token缓存管理器
 */
export class TokenCacheManager {
  private static instance: TokenCacheManager
  
  // 缓存键前缀
  private readonly TOKEN_PREFIX = 'coze_token:'
  private readonly TOKEN_VALIDATION_PREFIX = 'token_valid:'
  
  // 缓存TTL（秒）
  private readonly TOKEN_TTL = 1800 // 30分钟
  private readonly VALIDATION_TTL = 300 // 5分钟
  
  private constructor() {}
  
  static getInstance(): TokenCacheManager {
    if (!TokenCacheManager.instance) {
      TokenCacheManager.instance = new TokenCacheManager()
    }
    return TokenCacheManager.instance
  }

  /**
   * 生成缓存键
   */
  private getTokenKey(userProfileId: string): string {
    return `${this.TOKEN_PREFIX}${userProfileId}`
  }

  private getValidationKey(token: string): string {
    return `${this.TOKEN_VALIDATION_PREFIX}${token.substring(0, 16)}`
  }

  /**
   * 从Redis获取Token
   */
  async getTokenFromCache(userProfileId: string): Promise<CachedToken | null> {
    try {
      const key = this.getTokenKey(userProfileId)
      const cached = await redisCache.get<CachedToken>(key)
      
      if (cached) {
        devLog.log(`✅ Token缓存命中: ${userProfileId}`)
        return { ...cached, source: 'redis' }
      }
      
      devLog.log(`🔍 Token缓存未命中: ${userProfileId}`)
      return null
    } catch (error) {
      devLog.error(`❌ 获取Token缓存失败: ${userProfileId}`, error)
      return null
    }
  }

  /**
   * 将Token存储到Redis
   */
  async setTokenToCache(userProfileId: string, token: string, expiresAt: string, createdAt: string): Promise<boolean> {
    try {
      const key = this.getTokenKey(userProfileId)
      const tokenData: Omit<CachedToken, 'source'> = {
        token,
        expiresAt,
        createdAt
      }
      
      // 计算实际TTL（取较小值：配置TTL或token实际过期时间）
      const expiresAtTime = new Date(expiresAt).getTime()
      const now = Date.now()
      const tokenTTL = Math.floor((expiresAtTime - now) / 1000)
      const actualTTL = Math.min(this.TOKEN_TTL, Math.max(tokenTTL, 60)) // 最少60秒
      
      const success = await redisCache.set(key, tokenData, actualTTL)
      
      if (success) {
        devLog.log(`📝 Token已缓存: ${userProfileId}`, { ttl: actualTTL })
      }
      
      return success
    } catch (error) {
      devLog.error(`❌ 缓存Token失败: ${userProfileId}`, error)
      return false
    }
  }

  /**
   * 从数据库获取Token并缓存
   */
  async getTokenFromDatabase(userProfileId: string): Promise<CachedToken | null> {
    try {
      devLog.log(`🔍 从数据库获取Token: ${userProfileId}`)
      
      const { data: userProfile, error } = await supabaseAdmin
        .from('user_profiles')
        .select('coze_access_token, coze_token_expires_at, coze_token_created_at')
        .eq('id', userProfileId)
        .single()

      if (error || !userProfile) {
        devLog.error(`❌ 数据库查询失败: ${userProfileId}`, error)
        return null
      }

      if (!userProfile.coze_access_token) {
        devLog.log(`⚠️ 用户无Token: ${userProfileId}`)
        return null
      }

      const tokenData: CachedToken = {
        token: userProfile.coze_access_token,
        expiresAt: userProfile.coze_token_expires_at || '',
        createdAt: userProfile.coze_token_created_at || '',
        source: 'database'
      }

      // 异步缓存到Redis（不等待结果）
      this.setTokenToCache(
        userProfileId,
        tokenData.token,
        tokenData.expiresAt,
        tokenData.createdAt
      ).catch(err => {
        devLog.warn(`⚠️ 异步缓存Token失败: ${userProfileId}`, err)
      })

      devLog.log(`✅ 从数据库获取Token成功: ${userProfileId}`)
      return tokenData
    } catch (error) {
      devLog.error(`❌ 数据库获取Token失败: ${userProfileId}`, error)
      return null
    }
  }

  /**
   * 获取Token（优先Redis，降级数据库）
   */
  async getToken(userProfileId: string): Promise<CachedToken | null> {
    // 1. 先尝试从Redis获取
    let tokenData = await this.getTokenFromCache(userProfileId)
    
    // 2. Redis未命中，从数据库获取
    if (!tokenData) {
      tokenData = await this.getTokenFromDatabase(userProfileId)
    }
    
    // 3. 检查Token是否过期
    if (tokenData && this.isTokenExpired(tokenData.expiresAt)) {
      devLog.log(`⏰ Token已过期: ${userProfileId}`)
      await this.invalidateToken(userProfileId)
      return null
    }
    
    return tokenData
  }

  /**
   * 更新Token（同时更新数据库和缓存）
   */
  async updateToken(userProfileId: string, token: string, expiresAt: string, createdAt: string): Promise<boolean> {
    try {
      devLog.log(`🔄 更新Token: ${userProfileId}`)
      
      // 1. 更新数据库
      const { error } = await supabaseAdmin
        .from('user_profiles')
        .update({
          coze_access_token: token,
          coze_token_expires_at: expiresAt,
          coze_token_created_at: createdAt
        })
        .eq('id', userProfileId)

      if (error) {
        devLog.error(`❌ 数据库更新Token失败: ${userProfileId}`, error)
        return false
      }

      // 2. 更新Redis缓存
      await this.setTokenToCache(userProfileId, token, expiresAt, createdAt)
      
      // 3. 清除验证缓存
      await this.clearValidationCache(token)
      
      devLog.log(`✅ Token更新成功: ${userProfileId}`)
      return true
    } catch (error) {
      devLog.error(`❌ 更新Token失败: ${userProfileId}`, error)
      return false
    }
  }

  /**
   * 删除Token（同时删除数据库和缓存）
   */
  async invalidateToken(userProfileId: string): Promise<boolean> {
    try {
      devLog.log(`🗑️ 删除Token: ${userProfileId}`)
      
      // 1. 获取当前token（用于清除验证缓存）
      const currentToken = await this.getTokenFromCache(userProfileId)
      
      // 2. 删除Redis缓存
      const key = this.getTokenKey(userProfileId)
      await redisCache.del(key)
      
      // 3. 清除验证缓存
      if (currentToken) {
        await this.clearValidationCache(currentToken.token)
      }
      
      // 4. 清除数据库中的token（可选，根据业务需求）
      // 这里我们保留数据库记录，只是标记为过期
      
      devLog.log(`✅ Token删除成功: ${userProfileId}`)
      return true
    } catch (error) {
      devLog.error(`❌ 删除Token失败: ${userProfileId}`, error)
      return false
    }
  }

  /**
   * 缓存Token验证结果
   */
  async cacheTokenValidation(token: string, isValid: boolean): Promise<void> {
    try {
      const key = this.getValidationKey(token)
      await redisCache.set(key, { isValid, timestamp: Date.now() }, this.VALIDATION_TTL)
      devLog.log(`📝 Token验证结果已缓存: ${isValid}`)
    } catch (error) {
      devLog.warn('⚠️ 缓存Token验证结果失败:', error)
    }
  }

  /**
   * 获取缓存的Token验证结果
   */
  async getCachedTokenValidation(token: string): Promise<boolean | null> {
    try {
      const key = this.getValidationKey(token)
      const cached = await redisCache.get<{ isValid: boolean; timestamp: number }>(key)
      
      if (cached) {
        devLog.log(`✅ Token验证缓存命中: ${cached.isValid}`)
        return cached.isValid
      }
      
      return null
    } catch (error) {
      devLog.warn('⚠️ 获取Token验证缓存失败:', error)
      return null
    }
  }

  /**
   * 清除Token验证缓存
   */
  async clearValidationCache(token: string): Promise<void> {
    try {
      const key = this.getValidationKey(token)
      await redisCache.del(key)
    } catch (error) {
      devLog.warn('⚠️ 清除Token验证缓存失败:', error)
    }
  }

  /**
   * 检查Token是否过期
   */
  private isTokenExpired(expiresAt: string): boolean {
    if (!expiresAt) return true
    
    const expiresAtTime = new Date(expiresAt).getTime()
    const now = Date.now()
    
    // 提前1分钟认为过期
    return (expiresAtTime - now) < 60000
  }

  /**
   * 批量清除用户Token缓存
   */
  async clearUserTokens(userProfileIds: string[]): Promise<number> {
    try {
      const keys = userProfileIds.map(id => this.getTokenKey(id))
      let cleared = 0
      
      for (const key of keys) {
        const success = await redisCache.del(key)
        if (success) cleared++
      }
      
      devLog.log(`🗑️ 批量清除Token缓存: ${cleared}/${userProfileIds.length}`)
      return cleared
    } catch (error) {
      devLog.error('❌ 批量清除Token缓存失败:', error)
      return 0
    }
  }

  /**
   * 获取缓存统计信息
   */
  async getCacheStats(): Promise<{ totalTokens: number; validTokens: number }> {
    try {
      // 这里可以实现更详细的统计逻辑
      // 由于Redis keys命令在生产环境中性能较差，这里只是示例
      return { totalTokens: 0, validTokens: 0 }
    } catch (error) {
      devLog.error('❌ 获取缓存统计失败:', error)
      return { totalTokens: 0, validTokens: 0 }
    }
  }
}

// 导出单例实例
export const tokenCache = TokenCacheManager.getInstance()
