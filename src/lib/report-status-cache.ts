import { redisCache, getRedisClient } from '@/lib/redis'
import { supabaseAdmin } from '@/lib/supabase'
import { devLog } from '@/utils/dev-logger'

/**
 * 报告状态枚举
 */
export enum ReportStatus {
  NOT_STARTED = 'not_started',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * 报告类型枚举
 */
export enum ReportType {
  PERSONALITY = 'personality',
  WEALTH = 'wealth',
  MARRIAGE = 'marriage',
  HEALTH = 'health',
  BAZI = 'bazi'
}

/**
 * 缓存的报告状态信息
 */
interface CachedReportStatus {
  status: ReportStatus
  progress: number
  taskId?: string
  reportId?: string
  content?: string
  error?: string
  updatedAt: string
  source: 'redis' | 'database'
}

/**
 * 报告状态缓存管理器
 */
export class ReportStatusCacheManager {
  private static instance: ReportStatusCacheManager
  
  // 缓存键前缀
  private readonly STATUS_PREFIX = 'report_status:'
  private readonly LOCK_PREFIX = 'report_lock:'
  
  // 缓存TTL（秒）
  private readonly STATUS_TTL = 300 // 5分钟
  private readonly LOCK_TTL = 1800 // 30分钟（报告生成最大时间）
  
  private constructor() {}
  
  static getInstance(): ReportStatusCacheManager {
    if (!ReportStatusCacheManager.instance) {
      ReportStatusCacheManager.instance = new ReportStatusCacheManager()
    }
    return ReportStatusCacheManager.instance
  }

  /**
   * 生成缓存键
   */
  private getStatusKey(reportType: ReportType, userId: string): string {
    return `${this.STATUS_PREFIX}${reportType}:${userId}`
  }

  private getLockKey(reportType: ReportType, userId: string): string {
    return `${this.LOCK_PREFIX}${reportType}:${userId}`
  }

  /**
   * 获取报告状态（优先Redis，降级数据库）
   */
  async getReportStatus(reportType: ReportType, userId: string): Promise<CachedReportStatus | null> {
    try {
      // 1. 先从Redis获取
      const key = this.getStatusKey(reportType, userId)
      const cached = await redisCache.get<CachedReportStatus>(key)
      
      if (cached) {
        devLog.log(`✅ 报告状态缓存命中: ${reportType}:${userId}`)
        return { ...cached, source: 'redis' }
      }
      
      // 2. Redis未命中，从数据库获取
      devLog.log(`🔍 报告状态缓存未命中，查询数据库: ${reportType}:${userId}`)
      const dbStatus = await this.getStatusFromDatabase(reportType, userId)
      
      if (dbStatus) {
        // 异步缓存到Redis
        this.setReportStatus(reportType, userId, dbStatus).catch(err => {
          devLog.warn(`⚠️ 异步缓存报告状态失败: ${reportType}:${userId}`, err)
        })
        
        return { ...dbStatus, source: 'database' }
      }
      
      return null
    } catch (error) {
      devLog.error(`❌ 获取报告状态失败: ${reportType}:${userId}`, error)
      return null
    }
  }

  /**
   * 设置报告状态到Redis
   */
  async setReportStatus(reportType: ReportType, userId: string, status: Omit<CachedReportStatus, 'source'>): Promise<boolean> {
    try {
      const key = this.getStatusKey(reportType, userId)
      const success = await redisCache.set(key, status, this.STATUS_TTL)
      
      if (success) {
        devLog.log(`📝 报告状态已缓存: ${reportType}:${userId}`, { status: status.status, progress: status.progress })
      }
      
      return success
    } catch (error) {
      devLog.error(`❌ 缓存报告状态失败: ${reportType}:${userId}`, error)
      return false
    }
  }

  /**
   * 更新报告状态（同时更新缓存和数据库）
   */
  async updateReportStatus(
    reportType: ReportType, 
    userId: string, 
    status: ReportStatus, 
    progress: number = 0,
    options: {
      taskId?: string
      reportId?: string
      content?: string
      error?: string
    } = {}
  ): Promise<boolean> {
    try {
      const now = new Date().toISOString()
      const statusData: Omit<CachedReportStatus, 'source'> = {
        status,
        progress,
        taskId: options.taskId,
        reportId: options.reportId,
        content: options.content,
        error: options.error,
        updatedAt: now
      }
      
      // 1. 更新Redis缓存
      await this.setReportStatus(reportType, userId, statusData)
      
      // 2. 更新数据库（异步，不等待结果）
      this.updateStatusInDatabase(reportType, userId, statusData).catch(err => {
        devLog.warn(`⚠️ 异步更新数据库状态失败: ${reportType}:${userId}`, err)
      })
      
      devLog.log(`✅ 报告状态更新成功: ${reportType}:${userId}`, { status, progress })
      return true
    } catch (error) {
      devLog.error(`❌ 更新报告状态失败: ${reportType}:${userId}`, error)
      return false
    }
  }

  /**
   * 获取报告生成锁
   */
  async acquireReportLock(reportType: ReportType, userId: string, taskId: string): Promise<boolean> {
    try {
      const key = this.getLockKey(reportType, userId)
      const lockData = {
        taskId,
        acquiredAt: new Date().toISOString(),
        userId
      }
      
      // 使用Redis的SET NX命令实现分布式锁
      const client = await getRedisClient()
      if (!client) {
        devLog.warn('⚠️ Redis不可用，跳过锁机制')
        return true
      }
      
      const result = await client.set(key, JSON.stringify(lockData), {
        EX: this.LOCK_TTL,
        NX: true
      })
      
      const acquired = result === 'OK'
      
      if (acquired) {
        devLog.log(`🔒 获取报告生成锁成功: ${reportType}:${userId}`, { taskId })
      } else {
        devLog.log(`❌ 报告生成锁已被占用: ${reportType}:${userId}`)
      }
      
      return acquired
    } catch (error) {
      devLog.error(`❌ 获取报告生成锁失败: ${reportType}:${userId}`, error)
      return false
    }
  }

  /**
   * 释放报告生成锁
   */
  async releaseReportLock(reportType: ReportType, userId: string, taskId: string): Promise<boolean> {
    try {
      const key = this.getLockKey(reportType, userId)
      
      // 验证锁的所有者
      const lockData = await redisCache.get<{ taskId: string; acquiredAt: string; userId: string }>(key)
      
      if (!lockData || lockData.taskId !== taskId) {
        devLog.warn(`⚠️ 锁验证失败，无法释放: ${reportType}:${userId}`, { expectedTaskId: taskId, actualTaskId: lockData?.taskId })
        return false
      }
      
      const success = await redisCache.del(key)
      
      if (success) {
        devLog.log(`🔓 释放报告生成锁成功: ${reportType}:${userId}`, { taskId })
      }
      
      return success
    } catch (error) {
      devLog.error(`❌ 释放报告生成锁失败: ${reportType}:${userId}`, error)
      return false
    }
  }

  /**
   * 检查报告是否正在生成
   */
  async isReportGenerating(reportType: ReportType, userId: string): Promise<boolean> {
    try {
      const status = await this.getReportStatus(reportType, userId)
      return status?.status === ReportStatus.GENERATING
    } catch (error) {
      devLog.error(`❌ 检查报告生成状态失败: ${reportType}:${userId}`, error)
      return false
    }
  }

  /**
   * 清除报告状态缓存
   */
  async clearReportStatus(reportType: ReportType, userId: string): Promise<boolean> {
    try {
      const statusKey = this.getStatusKey(reportType, userId)
      const lockKey = this.getLockKey(reportType, userId)
      
      const statusDeleted = await redisCache.del(statusKey)
      const lockDeleted = await redisCache.del(lockKey)
      
      devLog.log(`🗑️ 清除报告状态缓存: ${reportType}:${userId}`, { 
        statusDeleted, 
        lockDeleted 
      })
      
      return statusDeleted || lockDeleted
    } catch (error) {
      devLog.error(`❌ 清除报告状态缓存失败: ${reportType}:${userId}`, error)
      return false
    }
  }

  /**
   * 从数据库获取报告状态
   */
  private async getStatusFromDatabase(reportType: ReportType, userId: string): Promise<Omit<CachedReportStatus, 'source'> | null> {
    try {
      const tableName = this.getTableName(reportType)
      
      const { data, error } = await supabaseAdmin
        .from(tableName)
        .select('id, status, progress, task_id, content, created_at, updated_at')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        devLog.error(`❌ 数据库查询报告状态失败: ${reportType}:${userId}`, error)
        return null
      }

      if (!data) {
        return {
          status: ReportStatus.NOT_STARTED,
          progress: 0,
          updatedAt: new Date().toISOString()
        }
      }

      return {
        status: data.status || ReportStatus.NOT_STARTED,
        progress: data.progress || 0,
        taskId: data.task_id,
        reportId: data.id,
        content: data.content,
        updatedAt: data.updated_at || data.created_at || new Date().toISOString()
      }
    } catch (error) {
      devLog.error(`❌ 数据库获取报告状态失败: ${reportType}:${userId}`, error)
      return null
    }
  }

  /**
   * 更新数据库中的报告状态
   */
  private async updateStatusInDatabase(
    reportType: ReportType, 
    userId: string, 
    statusData: Omit<CachedReportStatus, 'source'>
  ): Promise<boolean> {
    try {
      const tableName = this.getTableName(reportType)
      
      const updateData: any = {
        status: statusData.status,
        progress: statusData.progress,
        updated_at: statusData.updatedAt
      }
      
      if (statusData.taskId) updateData.task_id = statusData.taskId
      if (statusData.content) updateData.content = statusData.content
      if (statusData.error) updateData.error_message = statusData.error
      
      const { error } = await supabaseAdmin
        .from(tableName)
        .upsert(updateData, {
          onConflict: 'user_id'
        })
        .eq('user_id', userId)

      if (error) {
        devLog.error(`❌ 数据库更新报告状态失败: ${reportType}:${userId}`, error)
        return false
      }

      return true
    } catch (error) {
      devLog.error(`❌ 数据库更新报告状态失败: ${reportType}:${userId}`, error)
      return false
    }
  }

  /**
   * 根据报告类型获取表名
   */
  private getTableName(reportType: ReportType): string {
    const tableMap = {
      [ReportType.PERSONALITY]: 'personality_reports',
      [ReportType.WEALTH]: 'wealth_reports',
      [ReportType.MARRIAGE]: 'marriage_reports',
      [ReportType.HEALTH]: 'health_reports',
      [ReportType.BAZI]: 'bazi_reports'
    }
    
    return tableMap[reportType] || 'personality_reports'
  }

  /**
   * 批量清除用户的所有报告状态缓存
   */
  async clearUserReportStatuses(userId: string): Promise<number> {
    try {
      let cleared = 0
      
      for (const reportType of Object.values(ReportType)) {
        const success = await this.clearReportStatus(reportType, userId)
        if (success) cleared++
      }
      
      devLog.log(`🗑️ 批量清除用户报告状态缓存: ${userId}`, { cleared })
      return cleared
    } catch (error) {
      devLog.error(`❌ 批量清除用户报告状态缓存失败: ${userId}`, error)
      return 0
    }
  }
}

// 导出单例实例
export const reportStatusCache = ReportStatusCacheManager.getInstance()
