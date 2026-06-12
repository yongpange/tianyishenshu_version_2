import { redisCache } from '@/lib/redis'
import { devLog } from '@/utils/dev-logger'

/**
 * 限流规则配置
 */
export interface RateLimitRule {
  // 时间窗口（秒）
  windowSize: number
  // 最大请求数
  maxRequests: number
  // 规则名称
  name: string
}

/**
 * 限流结果
 */
export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
}

/**
 * 预定义的限流规则
 */
export const RATE_LIMIT_RULES = {
  // SMS发送限流
  SMS_SEND: {
    windowSize: 60, // 1分钟
    maxRequests: 3, // 最多3条
    name: 'SMS发送'
  } as RateLimitRule,
  
  // 报告生成限流
  REPORT_GENERATE: {
    windowSize: 300, // 5分钟
    maxRequests: 2, // 最多2个报告
    name: '报告生成'
  } as RateLimitRule,
  
  // 登录尝试限流
  LOGIN_ATTEMPT: {
    windowSize: 900, // 15分钟
    maxRequests: 5, // 最多5次尝试
    name: '登录尝试'
  } as RateLimitRule,
  
  // 聊天消息限流
  CHAT_MESSAGE: {
    windowSize: 60, // 1分钟
    maxRequests: 20, // 最多20条消息
    name: '聊天消息'
  } as RateLimitRule,
  
  // API调用限流
  API_CALL: {
    windowSize: 60, // 1分钟
    maxRequests: 100, // 最多100次调用
    name: 'API调用'
  } as RateLimitRule,
  
  // 文件上传限流
  FILE_UPLOAD: {
    windowSize: 3600, // 1小时
    maxRequests: 10, // 最多10个文件
    name: '文件上传'
  } as RateLimitRule
}

/**
 * Redis限流器
 */
export class RateLimiter {
  private static instance: RateLimiter
  
  // 缓存键前缀
  private readonly RATE_LIMIT_PREFIX = 'rate_limit:'
  private readonly DUPLICATE_PREFIX = 'duplicate_check:'
  
  private constructor() {}
  
  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter()
    }
    return RateLimiter.instance
  }

  /**
   * 生成限流键
   */
  private getRateLimitKey(identifier: string, rule: RateLimitRule): string {
    const timestamp = Math.floor(Date.now() / 1000 / rule.windowSize)
    return `${this.RATE_LIMIT_PREFIX}${rule.name}:${identifier}:${timestamp}`
  }

  /**
   * 生成防重复键
   */
  private getDuplicateKey(identifier: string, action: string): string {
    return `${this.DUPLICATE_PREFIX}${action}:${identifier}`
  }

  /**
   * 检查限流
   */
  async checkRateLimit(identifier: string, rule: RateLimitRule): Promise<RateLimitResult> {
    try {
      const key = this.getRateLimitKey(identifier, rule)
      const now = Math.floor(Date.now() / 1000)
      
      // 获取当前计数
      const currentCount = await redisCache.get<number>(key) || 0
      
      if (currentCount >= rule.maxRequests) {
        // 超出限制
        const resetTime = Math.ceil(now / rule.windowSize) * rule.windowSize
        const retryAfter = resetTime - now
        
        devLog.warn(`🚫 ${rule.name}限流触发: ${identifier}`, {
          currentCount,
          maxRequests: rule.maxRequests,
          retryAfter
        })
        
        return {
          allowed: false,
          remaining: 0,
          resetTime,
          retryAfter
        }
      }
      
      // 增加计数
      const newCount = await redisCache.incr(key)
      
      // 设置过期时间（如果是第一次设置）
      if (newCount === 1) {
        await redisCache.expire(key, rule.windowSize)
      }
      
      const remaining = Math.max(0, rule.maxRequests - newCount)
      const resetTime = Math.ceil(now / rule.windowSize) * rule.windowSize
      
      devLog.log(`✅ ${rule.name}限流检查通过: ${identifier}`, {
        currentCount: newCount,
        remaining,
        maxRequests: rule.maxRequests
      })
      
      return {
        allowed: true,
        remaining,
        resetTime
      }
      
    } catch (error) {
      devLog.error(`❌ ${rule.name}限流检查失败: ${identifier}`, error)
      
      // Redis不可用时，允许请求通过（降级策略）
      return {
        allowed: true,
        remaining: rule.maxRequests - 1,
        resetTime: Math.floor(Date.now() / 1000) + rule.windowSize
      }
    }
  }

  /**
   * 防重复提交检查
   */
  async checkDuplicate(
    identifier: string, 
    action: string, 
    ttl: number = 300
  ): Promise<boolean> {
    try {
      const key = this.getDuplicateKey(identifier, action)
      
      // 检查是否已存在
      const exists = await redisCache.exists(key)
      
      if (exists) {
        devLog.warn(`🔄 检测到重复提交: ${action}:${identifier}`)
        return false // 重复提交
      }
      
      // 设置防重复标记
      await redisCache.set(key, Date.now(), ttl)
      
      devLog.log(`✅ 防重复检查通过: ${action}:${identifier}`)
      return true // 允许提交
      
    } catch (error) {
      devLog.error(`❌ 防重复检查失败: ${action}:${identifier}`, error)
      
      // Redis不可用时，允许请求通过（降级策略）
      return true
    }
  }

  /**
   * 清除防重复标记
   */
  async clearDuplicate(identifier: string, action: string): Promise<boolean> {
    try {
      const key = this.getDuplicateKey(identifier, action)
      const success = await redisCache.del(key)
      
      if (success) {
        devLog.log(`🗑️ 清除防重复标记: ${action}:${identifier}`)
      }
      
      return success
    } catch (error) {
      devLog.error(`❌ 清除防重复标记失败: ${action}:${identifier}`, error)
      return false
    }
  }

  /**
   * 获取剩余限流时间
   */
  async getRemainingTime(identifier: string, rule: RateLimitRule): Promise<number> {
    try {
      const key = this.getRateLimitKey(identifier, rule)
      const ttl = await redisCache.ttl(key)
      
      return Math.max(0, ttl)
    } catch (error) {
      devLog.error(`❌ 获取限流剩余时间失败: ${identifier}`, error)
      return 0
    }
  }

  /**
   * 重置限流计数
   */
  async resetRateLimit(identifier: string, rule: RateLimitRule): Promise<boolean> {
    try {
      const key = this.getRateLimitKey(identifier, rule)
      const success = await redisCache.del(key)
      
      if (success) {
        devLog.log(`🔄 重置限流计数: ${rule.name}:${identifier}`)
      }
      
      return success
    } catch (error) {
      devLog.error(`❌ 重置限流计数失败: ${rule.name}:${identifier}`, error)
      return false
    }
  }

  /**
   * 批量检查多个限流规则
   */
  async checkMultipleRules(
    identifier: string, 
    rules: RateLimitRule[]
  ): Promise<{ rule: RateLimitRule; result: RateLimitResult }[]> {
    const results = []
    
    for (const rule of rules) {
      const result = await this.checkRateLimit(identifier, rule)
      results.push({ rule, result })
      
      // 如果任何一个规则不通过，可以选择提前返回
      if (!result.allowed) {
        devLog.warn(`🚫 多重限流检查失败: ${rule.name}:${identifier}`)
      }
    }
    
    return results
  }

  /**
   * 获取限流统计信息
   */
  async getRateLimitStats(identifier: string, rule: RateLimitRule): Promise<{
    currentCount: number
    remaining: number
    resetTime: number
    windowSize: number
  }> {
    try {
      const key = this.getRateLimitKey(identifier, rule)
      const currentCount = await redisCache.get<number>(key) || 0
      const ttl = await redisCache.ttl(key)
      const now = Math.floor(Date.now() / 1000)
      
      return {
        currentCount,
        remaining: Math.max(0, rule.maxRequests - currentCount),
        resetTime: now + Math.max(0, ttl),
        windowSize: rule.windowSize
      }
    } catch (error) {
      devLog.error(`❌ 获取限流统计失败: ${rule.name}:${identifier}`, error)
      
      return {
        currentCount: 0,
        remaining: rule.maxRequests,
        resetTime: Math.floor(Date.now() / 1000) + rule.windowSize,
        windowSize: rule.windowSize
      }
    }
  }
}

// 导出单例实例
export const rateLimiter = RateLimiter.getInstance()

/**
 * 便捷的限流检查函数
 */
export async function checkRateLimit(
  identifier: string, 
  rule: RateLimitRule
): Promise<RateLimitResult> {
  return rateLimiter.checkRateLimit(identifier, rule)
}

/**
 * 便捷的防重复检查函数
 */
export async function checkDuplicate(
  identifier: string, 
  action: string, 
  ttl?: number
): Promise<boolean> {
  return rateLimiter.checkDuplicate(identifier, action, ttl)
}

/**
 * 便捷的限流中间件生成器
 */
export function createRateLimitMiddleware(rule: RateLimitRule) {
  return async (identifier: string): Promise<RateLimitResult> => {
    return rateLimiter.checkRateLimit(identifier, rule)
  }
}
