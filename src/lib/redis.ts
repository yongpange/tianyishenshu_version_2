import { createClient, RedisClientType } from 'redis'
import { devLog } from '@/utils/dev-logger'

// Redis客户端实例
let redisClient: RedisClientType | null = null
let isConnecting = false

/**
 * Redis配置
 */
interface RedisConfig {
  url: string
  password?: string
  retryDelayOnFailover: number
  maxRetriesPerRequest: number
  connectTimeout: number
  lazyConnect: boolean
}

/**
 * 获取Redis配置
 */二步：创建免费数据库
function getRedisConfig(): RedisConfig {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
  const redisPassword = process.env.REDIS_PASSWORD || undefined
  
  return {
    url: redisUrl,
    password: redisPassword,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    connectTimeout: 10000,
    lazyConnect: true
  }
}

/**
 * 创建Redis连接
 */
async function createRedisConnection(): Promise<RedisClientType> {
  const config = getRedisConfig()
  
  devLog.log('🔗 创建Redis连接...', { url: config.url })
  
  const client = createClient({
    url: config.url,
    password: config.password,
    socket: {
      connectTimeout: config.connectTimeout,
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          devLog.error('❌ Redis重连次数超限，停止重连')
          return false
        }
        const delay = Math.min(retries * 50, 500)
        devLog.log(`🔄 Redis重连中... (${retries}/10, 延迟${delay}ms)`)
        return delay
      }
    }
  })

  // 错误处理
  client.on('error', (err) => {
    devLog.error('❌ Redis连接错误:', err)
  })

  client.on('connect', () => {
    devLog.log('🔗 Redis连接建立')
  })

  client.on('ready', () => {
    devLog.log('✅ Redis连接就绪')
  })

  client.on('end', () => {
    devLog.log('🔌 Redis连接断开')
  })

  client.on('reconnecting', () => {
    devLog.log('🔄 Redis重连中...')
  })

  return client
}

/**
 * 获取Redis客户端实例（单例模式）
 */
export async function getRedisClient(): Promise<RedisClientType> {
  // 如果已有连接且状态正常，直接返回
  if (redisClient && redisClient.isReady) {
    return redisClient
  }

  // 如果正在连接中，等待连接完成
  if (isConnecting) {
    while (isConnecting) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    if (redisClient && redisClient.isReady) {
      return redisClient
    }
  }

  try {
    isConnecting = true

    // 如果有旧连接，先关闭
    if (redisClient) {
      try {
        await redisClient.quit()
      } catch (err) {
        devLog.warn('⚠️ 关闭旧Redis连接失败:', err)
      }
    }

    // 创建新连接
    redisClient = await createRedisConnection()

    // 设置连接超时
    const connectPromise = redisClient.connect()
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Redis连接超时')), 5000)
    })

    await Promise.race([connectPromise, timeoutPromise])

    devLog.log('✅ Redis客户端连接成功')
    return redisClient

  } catch (error) {
    devLog.error('❌ Redis连接失败:', error)
    redisClient = null
    throw error
  } finally {
    isConnecting = false
  }
}

/**
 * 检查Redis连接状态
 */
export async function checkRedisConnection(): Promise<boolean> {
  try {
    const client = await getRedisClient()
    await client.ping()
    return true
  } catch (error) {
    devLog.error('❌ Redis连接检查失败:', error)
    return false
  }
}

/**
 * 关闭Redis连接
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit()
      devLog.log('✅ Redis连接已关闭')
    } catch (error) {
      devLog.error('❌ 关闭Redis连接失败:', error)
    } finally {
      redisClient = null
    }
  }
}

/**
 * Redis缓存操作封装（带降级机制）
 */
export class RedisCache {
  private static instance: RedisCache
  private isRedisAvailable: boolean = true
  private lastHealthCheck: number = 0
  private healthCheckInterval: number = 30000 // 30秒检查一次

  private constructor() {}

  static getInstance(): RedisCache {
    if (!RedisCache.instance) {
      RedisCache.instance = new RedisCache()
    }
    return RedisCache.instance
  }

  /**
   * 检查Redis是否可用
   */
  private async checkRedisHealth(): Promise<boolean> {
    const now = Date.now()

    // 如果最近检查过且Redis可用，直接返回
    if (this.isRedisAvailable && (now - this.lastHealthCheck) < this.healthCheckInterval) {
      return true
    }

    try {
      const client = await getRedisClient()
      await client.ping()
      this.isRedisAvailable = true
      this.lastHealthCheck = now
      return true
    } catch (error) {
      this.isRedisAvailable = false
      this.lastHealthCheck = now
      devLog.warn('⚠️ Redis不可用，将使用降级方案')
      return false
    }
  }

  /**
   * 设置缓存
   */
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      // 检查Redis健康状态
      if (!(await this.checkRedisHealth())) {
        devLog.warn(`⚠️ Redis不可用，跳过缓存设置: ${key}`)
        return false
      }

      const client = await getRedisClient()
      const serializedValue = JSON.stringify(value)

      if (ttl) {
        await client.setEx(key, ttl, serializedValue)
      } else {
        await client.set(key, serializedValue)
      }

      devLog.log(`📝 Redis缓存设置: ${key}`, { ttl })
      return true
    } catch (error) {
      devLog.error(`❌ Redis设置失败: ${key}`, error)
      this.isRedisAvailable = false
      return false
    }
  }

  /**
   * 获取缓存
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      // 检查Redis健康状态
      if (!(await this.checkRedisHealth())) {
        devLog.log(`🔍 Redis不可用，缓存未命中: ${key}`)
        return null
      }

      const client = await getRedisClient()
      const value = await client.get(key)

      if (value === null) {
        devLog.log(`🔍 Redis缓存未命中: ${key}`)
        return null
      }

      const parsed = JSON.parse(value)
      devLog.log(`✅ Redis缓存命中: ${key}`)
      return parsed
    } catch (error) {
      devLog.error(`❌ Redis获取失败: ${key}`, error)
      this.isRedisAvailable = false
      return null
    }
  }

  /**
   * 删除缓存
   */
  async del(key: string): Promise<boolean> {
    try {
      // 检查Redis健康状态
      if (!(await this.checkRedisHealth())) {
        devLog.warn(`⚠️ Redis不可用，跳过缓存删除: ${key}`)
        return false
      }

      const client = await getRedisClient()
      const result = await client.del(key)

      devLog.log(`🗑️ Redis缓存删除: ${key}`, { deleted: result > 0 })
      return result > 0
    } catch (error) {
      devLog.error(`❌ Redis删除失败: ${key}`, error)
      this.isRedisAvailable = false
      return false
    }
  }

  /**
   * 检查键是否存在
   */
  async exists(key: string): Promise<boolean> {
    try {
      const client = await getRedisClient()
      const result = await client.exists(key)
      return result === 1
    } catch (error) {
      devLog.error(`❌ Redis存在检查失败: ${key}`, error)
      return false
    }
  }

  /**
   * 设置过期时间
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const client = await getRedisClient()
      const result = await client.expire(key, ttl)
      return result
    } catch (error) {
      devLog.error(`❌ Redis设置过期时间失败: ${key}`, error)
      return false
    }
  }

  /**
   * 获取剩余过期时间
   */
  async ttl(key: string): Promise<number> {
    try {
      const client = await getRedisClient()
      return await client.ttl(key)
    } catch (error) {
      devLog.error(`❌ Redis获取TTL失败: ${key}`, error)
      return -1
    }
  }

  /**
   * 原子递增
   */
  async incr(key: string): Promise<number> {
    try {
      const client = await getRedisClient()
      return await client.incr(key)
    } catch (error) {
      devLog.error(`❌ Redis递增失败: ${key}`, error)
      throw error
    }
  }

  /**
   * 批量删除（支持模式匹配）
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      const client = await getRedisClient()
      const keys = await client.keys(pattern)
      
      if (keys.length === 0) {
        return 0
      }
      
      const result = await client.del(keys)
      devLog.log(`🗑️ Redis批量删除: ${pattern}`, { count: result })
      return result
    } catch (error) {
      devLog.error(`❌ Redis批量删除失败: ${pattern}`, error)
      return 0
    }
  }
}

// 导出单例实例
export const redisCache = RedisCache.getInstance()

// 优雅关闭处理
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    await closeRedisConnection()
    process.exit(0)
  })
  
  process.on('SIGTERM', async () => {
    await closeRedisConnection()
    process.exit(0)
  })
}
