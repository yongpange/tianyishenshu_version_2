import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { devLog } from '@/utils/dev-logger'
export interface UseAuthGuardOptions {
  redirectPath?: string
  checkInterval?: number // 检查间隔，单位：毫秒
  skipInitialCheck?: boolean // 是否跳过初始检查
}

export interface UseAuthGuardReturn {
  isAuthenticated: boolean
  isLoading: boolean
  checkUserStatus: () => Promise<boolean>
}

export function useAuthGuard(options: UseAuthGuardOptions = {}): UseAuthGuardReturn {
  const {
    redirectPath = '/login',
    checkInterval = 120000, // 默认2分钟检查一次
    skipInitialCheck = false
  } = options

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // 清除所有登录状态
  const clearAuthState = () => {
    localStorage.removeItem('loginData')
    localStorage.removeItem('userData')
    localStorage.removeItem('activeUser')
    sessionStorage.clear()
  }

  // 检查用户状态
  const checkUserStatus = async (): Promise<boolean> => {
    try {
      // 检查是否有登录数据
      const loginData = localStorage.getItem('loginData')
      const activeUser = localStorage.getItem('activeUser')
      
      if (!loginData) {
        devLog.log('🔒 没有登录数据')
        setIsAuthenticated(false)
        return false
      }

      // 解析登录数据
      const parsed = JSON.parse(loginData)
      const phone = parsed.phoneNumber

      if (!phone) {
        devLog.log('🔒 登录数据中没有手机号')
        clearAuthState()
        setIsAuthenticated(false)
        return false
      }

      // 验证用户是否存在
      const response = await fetch('/api/auth/verify-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      })

      if (!response.ok) {
        devLog.log('🔒 用户验证API调用失败')
        clearAuthState()
        setIsAuthenticated(false)
        return false
      }

      const result = await response.json()
      
      if (!result.success || !result.exists) {
        devLog.log('🔒 用户验证失败:', result.message)
        clearAuthState()
        setIsAuthenticated(false)
        return false
      }

      // 如果有activeUser，也验证它是否存在
      if (activeUser) {
        try {
          const parsedActiveUser = JSON.parse(activeUser)
          if (parsedActiveUser.id) {
            const activeUserResponse = await fetch('/api/auth/verify-user', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userProfileId: parsedActiveUser.id })
            })

            if (activeUserResponse.ok) {
              const activeUserResult = await activeUserResponse.json()
              if (!activeUserResult.success || !activeUserResult.exists) {
                devLog.log('🔒 当前激活用户已被删除')
                clearAuthState()
                setIsAuthenticated(false)
                return false
              }
            }
          }
        } catch (error) {
          devLog.warn('⚠️ 验证activeUser时出错:', error)
          // 不阻止登录，只清除activeUser
          localStorage.removeItem('activeUser')
        }
      }

      devLog.log('✅ 用户验证通过')
      setIsAuthenticated(true)
      return true

    } catch (error) {
      devLog.error('❌ 用户状态检查失败:', error)
      clearAuthState()
      setIsAuthenticated(false)
      return false
    }
  }

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    const initialize = async () => {
      setIsLoading(true)
      
      if (!skipInitialCheck) {
        const isValid = await checkUserStatus()
        
        if (!isValid) {
          router.push(redirectPath)
          setIsLoading(false)
          return
        }
      }

      // 设置定期检查
      if (checkInterval > 0) {
        interval = setInterval(async () => {
          const isValid = await checkUserStatus()
          if (!isValid) {
            router.push(redirectPath)
          }
        }, checkInterval)
      }

      setIsLoading(false)
    }

    initialize()

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [router, redirectPath, checkInterval, skipInitialCheck])

  return {
    isAuthenticated,
    isLoading,
    checkUserStatus
  }
} 