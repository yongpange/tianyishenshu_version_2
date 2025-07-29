'use client'

import { ReactNode } from 'react'
import { Spin } from 'antd'
import { useAuthGuard, UseAuthGuardOptions } from '@/hooks/useAuthGuard'

interface AuthGuardProps extends UseAuthGuardOptions {
  children: ReactNode
  loadingComponent?: ReactNode
  fallback?: ReactNode
}

export function AuthGuard({ 
  children, 
  loadingComponent,
  fallback,
  ...options 
}: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuthGuard(options)

  // 显示加载状态
  if (isLoading) {
    return loadingComponent || (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Spin size="large" />
          <p className="text-gray-600 mt-4">验证用户身份中...</p>
        </div>
      </div>
    )
  }

  // 如果未通过验证，显示fallback组件
  if (!isAuthenticated) {
    return fallback || (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">正在跳转到登录页面...</p>
        </div>
      </div>
    )
  }

  // 验证通过，显示子组件
  return <>{children}</>
} 