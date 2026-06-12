import { redisCache } from '@/lib/redis'
import { devLog } from '@/utils/dev-logger'
import { AreaDataCache, PcaCodeData } from '@/types/area'

/**
 * 静态数据类型枚举
 */
export enum StaticDataType {
  AREA_DATA = 'area_data',
  INVITE_CODES = 'invite_codes',
  SYSTEM_CONFIG = 'system_config',
  DICTIONARY = 'dictionary'
}

/**
 * 缓存的静态数据
 */
export interface CachedStaticData<T = any> {
  data: T
  version: string
  cachedAt: string
  expiresAt: string
  source: 'redis' | 'file' | 'database'
}

/**
 * 静态数据缓存管理器
 */
export class StaticDataCacheManager {
  private static instance: StaticDataCacheManager
  
  // 缓存键前缀
  private readonly STATIC_PREFIX = 'static_data:'
  private readonly VERSION_PREFIX = 'static_version:'
  
  // 缓存TTL（秒）
  private readonly DEFAULT_TTL = 86400 // 24小时
  private readonly AREA_DATA_TTL = 604800 // 7天（省市区数据变化很少）
  private readonly CONFIG_TTL = 3600 // 1小时
  
  // 内存缓存（作为二级缓存）
  private memoryCache = new Map<string, CachedStaticData>()
  private memoryCacheExpiry = new Map<string, number>()
  
  private constructor() {}
  
  static getInstance(): StaticDataCacheManager {
    if (!StaticDataCacheManager.instance) {
      StaticDataCacheManager.instance = new StaticDataCacheManager()
    }
    return StaticDataCacheManager.instance
  }

  /**
   * 生成缓存键
   */
  private getDataKey(type: StaticDataType): string {
    return `${this.STATIC_PREFIX}${type}`
  }

  private getVersionKey(type: StaticDataType): string {
    return `${this.VERSION_PREFIX}${type}`
  }

  /**
   * 获取TTL
   */
  private getTTL(type: StaticDataType): number {
    switch (type) {
      case StaticDataType.AREA_DATA:
        return this.AREA_DATA_TTL
      case StaticDataType.SYSTEM_CONFIG:
        return this.CONFIG_TTL
      default:
        return this.DEFAULT_TTL
    }
  }

  /**
   * 检查内存缓存
   */
  private checkMemoryCache<T>(type: StaticDataType): CachedStaticData<T> | null {
    const key = type.toString()
    const cached = this.memoryCache.get(key)
    const expiry = this.memoryCacheExpiry.get(key)
    
    if (cached && expiry && Date.now() < expiry) {
      devLog.log(`✅ 静态数据内存缓存命中: ${type}`)
      return { ...cached, source: 'redis' } as CachedStaticData<T>
    }
    
    // 清理过期的内存缓存
    if (cached) {
      this.memoryCache.delete(key)
      this.memoryCacheExpiry.delete(key)
    }
    
    return null
  }

  /**
   * 设置内存缓存
   */
  private setMemoryCache<T>(type: StaticDataType, data: CachedStaticData<T>): void {
    const key = type.toString()
    const ttl = this.getTTL(type)
    const expiry = Date.now() + (ttl * 1000)
    
    this.memoryCache.set(key, data)
    this.memoryCacheExpiry.set(key, expiry)
    
    devLog.log(`📝 静态数据内存缓存已设置: ${type}`)
  }

  /**
   * 获取静态数据（三级缓存：内存 → Redis → 源数据）
   */
  async getStaticData<T>(
    type: StaticDataType,
    loader: () => Promise<T>,
    version?: string
  ): Promise<CachedStaticData<T>> {
    try {
      // 1. 检查内存缓存
      const memoryData = this.checkMemoryCache<T>(type)
      if (memoryData) {
        return memoryData
      }

      // 2. 检查Redis缓存
      const dataKey = this.getDataKey(type)
      const versionKey = this.getVersionKey(type)
      
      const [cachedData, cachedVersion] = await Promise.all([
        redisCache.get<CachedStaticData<T>>(dataKey),
        redisCache.get<string>(versionKey)
      ])
      
      // 检查版本是否匹配
      if (cachedData && (!version || cachedVersion === version)) {
        devLog.log(`✅ 静态数据Redis缓存命中: ${type}`)
        
        // 设置到内存缓存
        this.setMemoryCache(type, cachedData)
        
        return { ...cachedData, source: 'redis' }
      }
      
      // 3. 缓存未命中或版本不匹配，加载源数据
      devLog.log(`🔍 静态数据缓存未命中，加载源数据: ${type}`)
      const sourceData = await loader()
      
      const now = new Date().toISOString()
      const ttl = this.getTTL(type)
      const expiresAt = new Date(Date.now() + ttl * 1000).toISOString()
      const currentVersion = version || now
      
      const cachedResult: CachedStaticData<T> = {
        data: sourceData,
        version: currentVersion,
        cachedAt: now,
        expiresAt,
        source: 'file'
      }
      
      // 异步缓存到Redis
      this.setStaticData(type, cachedResult, currentVersion).catch(err => {
        devLog.warn(`⚠️ 异步缓存静态数据失败: ${type}`, err)
      })
      
      // 设置到内存缓存
      this.setMemoryCache(type, cachedResult)
      
      return cachedResult
      
    } catch (error) {
      devLog.error(`❌ 获取静态数据失败: ${type}`, error)
      throw error
    }
  }

  /**
   * 设置静态数据到Redis
   */
  async setStaticData<T>(
    type: StaticDataType,
    data: CachedStaticData<T>,
    version?: string
  ): Promise<boolean> {
    try {
      const dataKey = this.getDataKey(type)
      const versionKey = this.getVersionKey(type)
      const ttl = this.getTTL(type)
      
      const [dataSuccess, versionSuccess] = await Promise.all([
        redisCache.set(dataKey, data, ttl),
        redisCache.set(versionKey, version || data.version, ttl)
      ])
      
      if (dataSuccess && versionSuccess) {
        devLog.log(`📝 静态数据已缓存到Redis: ${type}`, { 
          version: version || data.version,
          ttl 
        })
        
        // 同时更新内存缓存
        this.setMemoryCache(type, data)
      }
      
      return dataSuccess && versionSuccess
    } catch (error) {
      devLog.error(`❌ 缓存静态数据失败: ${type}`, error)
      return false
    }
  }

  /**
   * 清除静态数据缓存
   */
  async clearStaticData(type: StaticDataType): Promise<boolean> {
    try {
      const dataKey = this.getDataKey(type)
      const versionKey = this.getVersionKey(type)
      
      const [dataDeleted, versionDeleted] = await Promise.all([
        redisCache.del(dataKey),
        redisCache.del(versionKey)
      ])
      
      // 清除内存缓存
      const key = type.toString()
      this.memoryCache.delete(key)
      this.memoryCacheExpiry.delete(key)
      
      devLog.log(`🗑️ 清除静态数据缓存: ${type}`, { 
        dataDeleted, 
        versionDeleted 
      })
      
      return dataDeleted || versionDeleted
    } catch (error) {
      devLog.error(`❌ 清除静态数据缓存失败: ${type}`, error)
      return false
    }
  }

  /**
   * 预热静态数据缓存
   */
  async preloadStaticData(
    loaders: Array<{
      type: StaticDataType
      loader: () => Promise<any>
      version?: string
    }>
  ): Promise<number> {
    try {
      let loaded = 0
      
      for (const { type, loader, version } of loaders) {
        try {
          await this.getStaticData(type, loader, version)
          loaded++
        } catch (error) {
          devLog.warn(`⚠️ 预热静态数据失败: ${type}`, error)
        }
      }
      
      devLog.log(`🔥 静态数据预热完成`, { total: loaders.length, loaded })
      return loaded
    } catch (error) {
      devLog.error(`❌ 静态数据预热失败`, error)
      return 0
    }
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats(): {
    memoryCache: number
    memoryCacheKeys: string[]
  } {
    return {
      memoryCache: this.memoryCache.size,
      memoryCacheKeys: Array.from(this.memoryCache.keys())
    }
  }

  /**
   * 清理过期的内存缓存
   */
  cleanupMemoryCache(): number {
    const now = Date.now()
    let cleaned = 0
    
    for (const [key, expiry] of this.memoryCacheExpiry.entries()) {
      if (now >= expiry) {
        this.memoryCache.delete(key)
        this.memoryCacheExpiry.delete(key)
        cleaned++
      }
    }
    
    if (cleaned > 0) {
      devLog.log(`🧹 清理过期内存缓存: ${cleaned}个`)
    }
    
    return cleaned
  }
}

// 导出单例实例
export const staticDataCache = StaticDataCacheManager.getInstance()

/**
 * 便捷的静态数据获取函数
 */
export async function getStaticData<T>(
  type: StaticDataType,
  loader: () => Promise<T>,
  version?: string
): Promise<T> {
  const result = await staticDataCache.getStaticData(type, loader, version)
  return result.data
}

/**
 * 便捷的省市区数据获取函数
 */
export async function getAreaData(): Promise<AreaDataCache> {
  return getStaticData(
    StaticDataType.AREA_DATA,
    async () => {
      // 加载省市区数据的逻辑
      const response = await fetch('/pca-code.json')
      if (!response.ok) {
        throw new Error(`Failed to load area data: ${response.status}`)
      }
      
      const rawData: PcaCodeData = await response.json()
      
      // 构建缓存结构（复用原有逻辑）
      const provinces = rawData
      const cities = new Map()
      const districts = new Map()
      
      provinces.forEach(province => {
        if (province.children) {
          cities.set(province.code, province.children)
          province.children.forEach(city => {
            if (city.children) {
              districts.set(city.code, city.children)
            }
          })
        }
      })
      
      return {
        provinces,
        cities,
        districts,
        loadedAt: new Date().toISOString()
      }
    },
    '1.0.0' // 版本号
  )
}
