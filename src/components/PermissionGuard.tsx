import React from 'react'
import { usePermissions } from '@/hooks/usePermissions'

interface PermissionGuardProps {
  // 权限控制模式
  module?: string  // 模块名（可选，用于模块权限检查）
  action?: string  // 具体操作
  actions?: string[]  // 多个操作中的任一个
  requireAll?: boolean  // 是否需要所有action都有权限（当有actions时）
  
  // 角色控制模式
  roles?: string[]  // 允许的角色列表
  requireAdmin?: boolean  // 是否需要管理员权限
  requireVip?: boolean  // 是否需要VIP权限
  
  // 渲染控制
  children: React.ReactNode
  fallback?: React.ReactNode  // 无权限时显示的内容
  loading?: React.ReactNode  // 加载时显示的内容
  
  // 控制模式
  mode?: 'show' | 'disable'  // 'show': 显示/隐藏, 'disable': 禁用/启用
  className?: string  // 禁用时的样式类
}

export function PermissionGuard({
  module,
  action,
  actions,
  requireAll = false,
  roles,
  requireAdmin = false,
  requireVip = false,
  children,
  fallback = null,
  loading = null,
  mode = 'show',
  className = 'opacity-50 cursor-not-allowed'
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, userRole, isAdmin, isVip, loading: permissionsLoading } = usePermissions()

  // 加载中
  if (permissionsLoading) {
    return loading ? <>{loading}</> : null
  }

  // 检查权限
  let hasAccess = false

  // 1. 检查管理员权限
  if (requireAdmin) {
    hasAccess = isAdmin
  }
  // 2. 检查VIP权限
  else if (requireVip) {
    hasAccess = isVip || isAdmin
  }
  // 3. 检查角色权限
  else if (roles && roles.length > 0) {
    hasAccess = userRole ? roles.includes(userRole.role_name) : false
  }
  // 4. 检查模块操作权限
  else if (module) {
    if (action) {
      // 检查单个操作权限
      hasAccess = hasPermission(module, action)
    } else if (actions && actions.length > 0) {
      // 检查多个操作权限
      if (requireAll) {
        // 需要所有权限
        hasAccess = actions.every(act => hasPermission(module, act))
      } else {
        // 只需要任一权限
        hasAccess = actions.some(act => hasPermission(module, act))
      }
    } else {
      // 检查模块是否有任何权限
      hasAccess = hasAnyPermission(module)
    }
  }
  // 5. 如果没有设置任何权限检查条件，默认允许访问
  else {
    hasAccess = true
  }

  // 根据模式渲染
  if (mode === 'disable') {
    // 禁用模式：始终显示，但根据权限决定是否禁用
    return (
      <div className={hasAccess ? '' : className}>
        {React.cloneElement(children as React.ReactElement, {
          disabled: !hasAccess,
          ...(children as React.ReactElement).props
        })}
      </div>
    )
  } else {
    // 显示模式：根据权限决定是否显示
    if (hasAccess) {
      return <>{children}</>
    } else {
      return fallback ? <>{fallback}</> : null
    }
  }
}

// 权限检查Hook的简化版本，用于在组件中快速检查权限
export function usePermissionCheck() {
  const permissions = usePermissions()
  
  return {
    ...permissions,
    // 快速检查函数
    canView: (module: string) => permissions.hasPermission(module, 'view'),
    canGenerate: (module: string) => permissions.hasPermission(module, 'generate'),
    canChat: (module: string) => permissions.hasPermission(module, 'chat'),
    canManage: (module: string) => permissions.hasPermission(module, 'manage'),
    
    // 模块访问检查
    canAccessModule: (module: string) => permissions.hasAnyPermission(module),
    
    // 角色检查
    isAdminOrVip: () => permissions.isAdmin || permissions.isVip
  }
} 