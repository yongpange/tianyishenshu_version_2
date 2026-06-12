import { NextRequest, NextResponse } from 'next/server'
import { userSessionCache, CachedUserSession, UserRole } from '@/lib/user-session-cache'
import { devLog } from '@/utils/dev-logger'

/**
 * 认证结果接口
 */
export interface AuthResult {
  success: boolean
  user?: CachedUserSession
  error?: string
  statusCode?: number
}

/**
 * 权限检查选项
 */
export interface AuthOptions {
  requireAuth?: boolean
  requiredRole?: UserRole
  requiredPermissions?: string[]
  allowInactive?: boolean
}

/**
 * 用户认证中间件类
 */
export class AuthMiddleware {
  /**
   * 从请求中提取用户ID
   */
  static extractUserId(request: NextRequest): string | null {
    try {
      // 1. 从请求头获取
      const headerUserId = request.headers.get('x-user-id')
      if (headerUserId) {
        devLog.log('📋 从请求头获取用户ID:', headerUserId)
        return headerUserId
      }

      // 2. 从查询参数获取
      const { searchParams } = new URL(request.url)
      const queryUserId = searchParams.get('userId')
      if (queryUserId) {
        devLog.log('📋 从查询参数获取用户ID:', queryUserId)
        return queryUserId
      }

      // 3. 从Cookie获取（如果有JWT token）
      const cookies = request.cookies
      const token = cookies.get('auth-token')?.value
      if (token) {
        // 这里可以解析JWT token获取用户ID
        // 暂时跳过JWT解析，直接返回null
        devLog.log('📋 发现认证token，但暂未实现JWT解析')
      }

      return null
    } catch (error) {
      devLog.error('❌ 提取用户ID失败:', error)
      return null
    }
  }

  /**
   * 从请求体中提取用户ID
   */
  static async extractUserIdFromBody(request: NextRequest): Promise<string | null> {
    try {
      // 克隆请求以避免消费原始流
      const clonedRequest = request.clone()
      const body = await clonedRequest.json()
      
      // 支持多种字段名
      const userId = body.userId || body.userProfileId || body.user_id || body.user_profile_id
      
      if (userId) {
        devLog.log('📋 从请求体获取用户ID:', userId)
        return userId
      }

      return null
    } catch (error) {
      devLog.warn('⚠️ 解析请求体失败，可能不是JSON格式')
      return null
    }
  }

  /**
   * 认证用户
   */
  static async authenticateUser(
    request: NextRequest, 
    options: AuthOptions = {}
  ): Promise<AuthResult> {
    try {
      const {
        requireAuth = true,
        requiredRole,
        requiredPermissions = [],
        allowInactive = false
      } = options

      // 1. 提取用户ID
      let userId = this.extractUserId(request)
      
      // 如果从URL/Header没有获取到，尝试从请求体获取
      if (!userId && (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH')) {
        userId = await this.extractUserIdFromBody(request)
      }

      if (!userId) {
        if (requireAuth) {
          return {
            success: false,
            error: '缺少用户认证信息',
            statusCode: 401
          }
        } else {
          return { success: true }
        }
      }

      // 2. 获取用户会话信息
      const userSession = await userSessionCache.getUserSession(userId)
      
      if (!userSession) {
        return {
          success: false,
          error: '用户不存在或会话已过期',
          statusCode: 401
        }
      }

      // 3. 检查用户状态
      if (!userSession.isActive && !allowInactive) {
        return {
          success: false,
          error: '用户账户已被禁用',
          statusCode: 403
        }
      }

      // 4. 检查角色权限
      if (requiredRole && !this.hasRole(userSession, requiredRole)) {
        return {
          success: false,
          error: '权限不足，需要更高级别的角色',
          statusCode: 403
        }
      }

      // 5. 检查具体权限
      if (requiredPermissions.length > 0) {
        const hasAllPermissions = await this.hasAllPermissions(userId, requiredPermissions)
        if (!hasAllPermissions) {
          return {
            success: false,
            error: '权限不足，缺少必要的操作权限',
            statusCode: 403
          }
        }
      }

      devLog.log(`✅ 用户认证成功: ${userId}`, {
        name: userSession.name,
        role: userSession.role,
        permissions: userSession.permissions.length
      })

      return {
        success: true,
        user: userSession
      }

    } catch (error) {
      devLog.error('❌ 用户认证失败:', error)
      return {
        success: false,
        error: '认证过程出错',
        statusCode: 500
      }
    }
  }

  /**
   * 检查用户是否有指定角色
   */
  private static hasRole(userSession: CachedUserSession, requiredRole: UserRole): boolean {
    const roleHierarchy = {
      [UserRole.USER]: 1,
      [UserRole.ADMIN]: 2,
      [UserRole.SUPER_ADMIN]: 3
    }

    const userRoleLevel = roleHierarchy[userSession.role] || 0
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0

    return userRoleLevel >= requiredRoleLevel
  }

  /**
   * 检查用户是否有所有指定权限
   */
  private static async hasAllPermissions(userId: string, requiredPermissions: string[]): Promise<boolean> {
    try {
      for (const permission of requiredPermissions) {
        const hasPermission = await userSessionCache.hasPermission(userId, permission)
        if (!hasPermission) {
          return false
        }
      }
      return true
    } catch (error) {
      devLog.error(`❌ 检查用户权限失败: ${userId}`, error)
      return false
    }
  }

  /**
   * 创建认证响应
   */
  static createAuthResponse(authResult: AuthResult): NextResponse | null {
    if (authResult.success) {
      return null // 认证成功，继续处理
    }

    return NextResponse.json({
      success: false,
      error: authResult.error,
      code: 'AUTH_FAILED'
    }, { status: authResult.statusCode || 401 })
  }

  /**
   * API路由认证装饰器
   */
  static withAuth(
    handler: (request: NextRequest, user: CachedUserSession) => Promise<NextResponse>,
    options: AuthOptions = {}
  ) {
    return async (request: NextRequest): Promise<NextResponse> => {
      try {
        const authResult = await this.authenticateUser(request, options)
        
        if (!authResult.success) {
          return this.createAuthResponse(authResult)!
        }

        if (!authResult.user) {
          return NextResponse.json({
            success: false,
            error: '用户信息获取失败',
            code: 'USER_INFO_MISSING'
          }, { status: 500 })
        }

        // 调用原始处理器
        return await handler(request, authResult.user)

      } catch (error) {
        devLog.error('❌ 认证装饰器执行失败:', error)
        return NextResponse.json({
          success: false,
          error: '服务器内部错误',
          code: 'INTERNAL_ERROR'
        }, { status: 500 })
      }
    }
  }

  /**
   * 管理员权限装饰器
   */
  static withAdminAuth(
    handler: (request: NextRequest, user: CachedUserSession) => Promise<NextResponse>
  ) {
    return this.withAuth(handler, {
      requireAuth: true,
      requiredRole: UserRole.ADMIN
    })
  }

  /**
   * 超级管理员权限装饰器
   */
  static withSuperAdminAuth(
    handler: (request: NextRequest, user: CachedUserSession) => Promise<NextResponse>
  ) {
    return this.withAuth(handler, {
      requireAuth: true,
      requiredRole: UserRole.SUPER_ADMIN
    })
  }

  /**
   * 特定权限装饰器
   */
  static withPermissions(
    permissions: string[],
    handler: (request: NextRequest, user: CachedUserSession) => Promise<NextResponse>
  ) {
    return this.withAuth(handler, {
      requireAuth: true,
      requiredPermissions: permissions
    })
  }
}

/**
 * 便捷的认证函数
 */
export async function authenticateRequest(
  request: NextRequest, 
  options?: AuthOptions
): Promise<AuthResult> {
  return AuthMiddleware.authenticateUser(request, options)
}

/**
 * 便捷的权限检查函数
 */
export async function requireAuth(
  request: NextRequest,
  requiredRole?: UserRole,
  requiredPermissions?: string[]
): Promise<CachedUserSession | null> {
  const authResult = await AuthMiddleware.authenticateUser(request, {
    requireAuth: true,
    requiredRole,
    requiredPermissions
  })

  if (!authResult.success) {
    throw new Error(authResult.error || '认证失败')
  }

  return authResult.user || null
}
