import { useState, useEffect } from 'react'

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
        console.warn('没有找到当前激活用户')
        return
      }

      const parsedUser = JSON.parse(activeUser)
      if (!parsedUser.id) {
        console.warn('用户ID无效')
        return
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
          console.warn('获取权限失败:', result.message)
        }
      } else {
        console.error('权限API调用失败:', response.status)
      }
    } catch (error) {
      console.error('获取用户权限失败:', error)
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