import { useState, useEffect } from 'react'
import { devLog } from '@/utils/dev-logger'
// 权限类型定义
export interface UserPermissions {
  [module: string]: string[]
}

export interface UserRole {
  role_name: string
  role_display_name: string
  permissions: UserPermissions
}

export interface UsePermissionsReturn {
  userRole: UserRole | null
  permissions: UserPermissions
  hasPermission: (module: string, action: string) => boolean
  hasAnyPermission: (module: string, actions?: string[]) => boolean
  isAdmin: boolean
  isVip: boolean
  isBasicUser: boolean
  isGuest: boolean
  loading: boolean
  refresh: () => Promise<void>
}

export function usePermissions(): UsePermissionsReturn {
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [permissions, setPermissions] = useState<UserPermissions>({})
  const [loading, setLoading] = useState(true)

  // 获取用户权限信息
  const fetchPermissions = async () => {
    try {
      setLoading(true)
      
      // 获取当前激活的用户
      const activeUser = localStorage.getItem('activeUser')
      if (!activeUser) {
        devLog.warn('没有找到当前激活用户')
        return
      }

      const parsedUser = JSON.parse(activeUser)
      if (!parsedUser.id) {
        devLog.warn('用户ID无效')
        return
      }

      // 验证activeUser是否仍然存在于数据库中
      const verifyResponse = await fetch('/api/auth/verify-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userProfileId: parsedUser.id })
      })

      if (verifyResponse.ok) {
        const verifyResult = await verifyResponse.json()
        if (!verifyResult.success || !verifyResult.exists) {
          devLog.warn('当前用户已被删除，清除登录状态')
          // 清除所有本地存储
          localStorage.removeItem('loginData')
          localStorage.removeItem('userData')
          localStorage.removeItem('activeUser')
          sessionStorage.clear()
          // 刷新页面回到登录状态
          window.location.href = '/login'
          return
        }
      } else {
        // API调用失败，但不清除登录状态
        devLog.warn('用户验证API调用失败，状态码:', verifyResponse.status)
        if (verifyResponse.status >= 500) {
          // 服务器错误：保持当前状态，继续加载权限
          devLog.warn('服务器错误，跳过用户验证，继续加载权限')
        } else if (verifyResponse.status === 401 || verifyResponse.status === 403) {
          // 明确的认证错误：清除登录状态
          devLog.warn('认证失败，清除登录状态')
          localStorage.removeItem('loginData')
          localStorage.removeItem('userData')
          localStorage.removeItem('activeUser')
          sessionStorage.clear()
          window.location.href = '/login'
          return
        }
        // 其他错误：继续执行，但可能权限功能受限
      }

      // 调用API获取用户角色和权限
      const response = await fetch('/api/user-profiles/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userProfileId: parsedUser.id })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setUserRole(result.data)
          setPermissions(result.data.permissions || {})
        } else {
          devLog.warn('获取权限失败:', result.message)
        }
      } else {
        devLog.error('权限API调用失败:', response.status)
      }
    } catch (error) {
      devLog.error('获取用户权限失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 检查是否有特定权限
  const hasPermission = (module: string, action: string): boolean => {
    if (!permissions[module]) return false
    return permissions[module].includes(action)
  }

  // 检查是否有模块的任一权限
  const hasAnyPermission = (module: string, actions?: string[]): boolean => {
    if (!permissions[module] || permissions[module].length === 0) return false
    if (!actions || actions.length === 0) return permissions[module].length > 0
    return actions.some(action => permissions[module].includes(action))
  }

  // 角色判断
  const isAdmin = userRole?.role_name === 'admin'
  const isVip = userRole?.role_name === 'vip_user'
  const isBasicUser = userRole?.role_name === 'basic_user'
  const isGuest = userRole?.role_name === 'guest'

  // 监听用户切换事件
  useEffect(() => {
    const handleUserSwitched = () => {
      fetchPermissions()
    }

    // 初始加载
    fetchPermissions()

    // 监听用户切换事件
    window.addEventListener('userSwitched', handleUserSwitched)

    return () => {
      window.removeEventListener('userSwitched', handleUserSwitched)
    }
  }, [])

  return {
    userRole,
    permissions,
    hasPermission,
    hasAnyPermission,
    isAdmin,
    isVip,
    isBasicUser,
    isGuest,
    loading,
    refresh: fetchPermissions
  }
} 