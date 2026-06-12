import { NextRequest, NextResponse } from 'next/server'
import { rateLimiter, RateLimitRule, RATE_LIMIT_RULES } from '@/lib/rate-limiter'
import { devLog } from '@/utils/dev-logger'

/**
 * 限流中间件选项
 */
export interface RateLimitMiddlewareOptions {
  // 限流规则
  rule: RateLimitRule
  // 标识符提取函数
  getIdentifier: (request: NextRequest) => Promise<string> | string
  // 自定义错误消息
  errorMessage?: string
  // 是否跳过限流（用于测试）
  skip?: boolean
}

/**
 * 限流响应
 */
export interface RateLimitResponse {
  success: boolean
  message: string
  retryAfter?: number
  remaining?: number
  resetTime?: number
}

/**
 * API限流中间件类
 */
export class RateLimitMiddleware {
  /**
   * 创建限流中间件
   */
  static create(options: RateLimitMiddlewareOptions) {
    return async (request: NextRequest): Promise<NextResponse | null> => {
      try {
        // 如果跳过限流
        if (options.skip) {
          return null
        }

        // 获取标识符
        const identifier = await options.getIdentifier(request)
        
        if (!identifier) {
          devLog.warn('⚠️ 限流中间件无法获取标识符')
          return null // 无法获取标识符时跳过限流
        }

        // 检查限流
        const result = await rateLimiter.checkRateLimit(identifier, options.rule)
        
        if (!result.allowed) {
          const errorMessage = options.errorMessage || 
            `请求过于频繁，请${result.retryAfter}秒后重试`
          
          devLog.warn(`🚫 API限流触发: ${options.rule.name}`, {
            identifier,
            retryAfter: result.retryAfter
          })
          
          return NextResponse.json({
            success: false,
            message: errorMessage,
            retryAfter: result.retryAfter,
            remaining: result.remaining,
            resetTime: result.resetTime,
            code: 'RATE_LIMIT_EXCEEDED'
          }, { 
            status: 429,
            headers: {
              'X-RateLimit-Limit': options.rule.maxRequests.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': result.resetTime.toString(),
              'Retry-After': (result.retryAfter || 0).toString()
            }
          })
        }

        // 添加限流信息到响应头
        return NextResponse.next({
          headers: {
            'X-RateLimit-Limit': options.rule.maxRequests.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString()
          }
        })

      } catch (error) {
        devLog.error('❌ 限流中间件执行失败:', error)
        return null // 出错时跳过限流
      }
    }
  }

  /**
   * 从IP地址获取标识符
   */
  static getIpIdentifier(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ip = forwarded?.split(',')[0] || realIp || 'unknown'
    return `ip:${ip}`
  }

  /**
   * 从用户ID获取标识符
   */
  static async getUserIdentifier(request: NextRequest): Promise<string> {
    try {
      // 从请求头获取
      const headerUserId = request.headers.get('x-user-id')
      if (headerUserId) {
        return `user:${headerUserId}`
      }

      // 从查询参数获取
      const { searchParams } = new URL(request.url)
      const queryUserId = searchParams.get('userId')
      if (queryUserId) {
        return `user:${queryUserId}`
      }

      // 从请求体获取
      if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
        try {
          const clonedRequest = request.clone()
          const body = await clonedRequest.json()
          const userId = body.userId || body.userProfileId || body.user_id
          if (userId) {
            return `user:${userId}`
          }
        } catch {
          // 忽略JSON解析错误
        }
      }

      // 降级到IP地址
      return RateLimitMiddleware.getIpIdentifier(request)
    } catch (error) {
      devLog.error('❌ 获取用户标识符失败:', error)
      return RateLimitMiddleware.getIpIdentifier(request)
    }
  }

  /**
   * 从手机号获取标识符
   */
  static async getPhoneIdentifier(request: NextRequest): Promise<string> {
    try {
      if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
        const clonedRequest = request.clone()
        const body = await clonedRequest.json()
        const phone = body.phone || body.phoneNumber || body.phone_number
        if (phone) {
          return `phone:${phone}`
        }
      }

      // 降级到IP地址
      return RateLimitMiddleware.getIpIdentifier(request)
    } catch (error) {
      devLog.error('❌ 获取手机号标识符失败:', error)
      return RateLimitMiddleware.getIpIdentifier(request)
    }
  }
}

/**
 * 预定义的限流中间件
 */
export const RateLimitMiddlewares = {
  /**
   * SMS发送限流
   */
  sms: RateLimitMiddleware.create({
    rule: RATE_LIMIT_RULES.SMS_SEND,
    getIdentifier: RateLimitMiddleware.getPhoneIdentifier,
    errorMessage: '短信发送过于频繁，请稍后重试'
  }),

  /**
   * 报告生成限流
   */
  reportGenerate: RateLimitMiddleware.create({
    rule: RATE_LIMIT_RULES.REPORT_GENERATE,
    getIdentifier: RateLimitMiddleware.getUserIdentifier,
    errorMessage: '报告生成过于频繁，请稍后重试'
  }),

  /**
   * 登录尝试限流
   */
  login: RateLimitMiddleware.create({
    rule: RATE_LIMIT_RULES.LOGIN_ATTEMPT,
    getIdentifier: RateLimitMiddleware.getPhoneIdentifier,
    errorMessage: '登录尝试过于频繁，请稍后重试'
  }),

  /**
   * 聊天消息限流
   */
  chat: RateLimitMiddleware.create({
    rule: RATE_LIMIT_RULES.CHAT_MESSAGE,
    getIdentifier: RateLimitMiddleware.getUserIdentifier,
    errorMessage: '消息发送过于频繁，请稍后重试'
  }),

  /**
   * 通用API限流
   */
  api: RateLimitMiddleware.create({
    rule: RATE_LIMIT_RULES.API_CALL,
    getIdentifier: RateLimitMiddleware.getIpIdentifier,
    errorMessage: 'API调用过于频繁，请稍后重试'
  }),

  /**
   * 文件上传限流
   */
  upload: RateLimitMiddleware.create({
    rule: RATE_LIMIT_RULES.FILE_UPLOAD,
    getIdentifier: RateLimitMiddleware.getUserIdentifier,
    errorMessage: '文件上传过于频繁，请稍后重试'
  })
}

/**
 * API路由限流装饰器
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  middleware: (request: NextRequest) => Promise<NextResponse | null>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // 先执行限流检查
      const rateLimitResponse = await middleware(request)
      
      if (rateLimitResponse) {
        return rateLimitResponse // 返回限流响应
      }

      // 限流通过，执行原始处理器
      return await handler(request)

    } catch (error) {
      devLog.error('❌ 限流装饰器执行失败:', error)
      return NextResponse.json({
        success: false,
        message: '服务器内部错误',
        code: 'INTERNAL_ERROR'
      }, { status: 500 })
    }
  }
}

/**
 * 便捷的限流装饰器函数
 */
export const withSmsRateLimit = (handler: (request: NextRequest) => Promise<NextResponse>) =>
  withRateLimit(handler, RateLimitMiddlewares.sms)

export const withReportRateLimit = (handler: (request: NextRequest) => Promise<NextResponse>) =>
  withRateLimit(handler, RateLimitMiddlewares.reportGenerate)

export const withLoginRateLimit = (handler: (request: NextRequest) => Promise<NextResponse>) =>
  withRateLimit(handler, RateLimitMiddlewares.login)

export const withChatRateLimit = (handler: (request: NextRequest) => Promise<NextResponse>) =>
  withRateLimit(handler, RateLimitMiddlewares.chat)

export const withApiRateLimit = (handler: (request: NextRequest) => Promise<NextResponse>) =>
  withRateLimit(handler, RateLimitMiddlewares.api)

export const withUploadRateLimit = (handler: (request: NextRequest) => Promise<NextResponse>) =>
  withRateLimit(handler, RateLimitMiddlewares.upload)
