'use client'

import { useEffect, useState } from 'react'
import { devLog } from '@/utils/dev-logger'
import { getCurrentAuthConfig } from '@/config/auth'

interface AuthStatus {
  isAuthenticated: boolean
  loginData: any
  activeUser: any
  lastCheck: string
  checkCount: number
  errors: string[]
}

export function DevAuthMonitor() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    isAuthenticated: false,
    loginData: null,
    activeUser: null,
    lastCheck: '',
    checkCount: 0,
    errors: []
  })
  const [isVisible, setIsVisible] = useState(false)

  // 只在开发环境显示
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const loginData = localStorage.getItem('loginData')
        const activeUser = localStorage.getItem('activeUser')
        
        setAuthStatus(prev => ({
          ...prev,
          isAuthenticated: !!loginData,
          loginData: loginData ? JSON.parse(loginData) : null,
          activeUser: activeUser ? JSON.parse(activeUser) : null,
          lastCheck: new Date().toLocaleTimeString(),
          checkCount: prev.checkCount + 1
        }))
      } catch (error) {
        setAuthStatus(prev => ({
          ...prev,
          errors: [...prev.errors.slice(-4), `${new Date().toLocaleTimeString()}: ${error}`]
        }))
      }
    }

    // 初始检查
    checkAuthStatus()

    // 定期检查
    const interval = setInterval(checkAuthStatus, 10000) // 每10秒检查一次

    return () => clearInterval(interval)
  }, [])

  const config = getCurrentAuthConfig()

  return (
    <>
      {/* 悬浮按钮 */}
      <div 
        className="fixed bottom-4 right-4 z-50 bg-blue-500 text-white p-2 rounded-full cursor-pointer shadow-lg hover:bg-blue-600 transition-colors"
        onClick={() => setIsVisible(!isVisible)}
        title="开发环境认证监控"
      >
        🔍
      </div>

      {/* 监控面板 */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-xl p-4 w-96 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-lg">认证状态监控</h3>
            <button 
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3 text-sm">
            {/* 基本状态 */}
            <div>
              <div className="font-semibold">认证状态:</div>
              <div className={`${authStatus.isAuthenticated ? 'text-green-600' : 'text-red-600'}`}>
                {authStatus.isAuthenticated ? '✅ 已登录' : '❌ 未登录'}
              </div>
            </div>

            {/* 配置信息 */}
            <div>
              <div className="font-semibold">配置:</div>
              <div className="text-xs bg-gray-100 p-2 rounded">
                <div>跳过认证: {config.skipAuthCheck ? '是' : '否'}</div>
                <div>检查间隔: {config.checkInterval / 1000}秒</div>
                <div>验证间隔: {config.verifyInterval / 1000}秒</div>
                <div>宽松错误处理: {config.lenientErrorHandling ? '是' : '否'}</div>
              </div>
            </div>

            {/* 检查信息 */}
            <div>
              <div className="font-semibold">检查信息:</div>
              <div className="text-xs">
                <div>最后检查: {authStatus.lastCheck}</div>
                <div>检查次数: {authStatus.checkCount}</div>
              </div>
            </div>

            {/* 登录数据 */}
            {authStatus.loginData && (
              <div>
                <div className="font-semibold">登录数据:</div>
                <div className="text-xs bg-gray-100 p-2 rounded max-h-20 overflow-y-auto">
                  <div>手机号: {authStatus.loginData.phoneNumber}</div>
                  <div>时间戳: {new Date(authStatus.loginData.timestamp).toLocaleString()}</div>
                </div>
              </div>
            )}

            {/* 激活用户 */}
            {authStatus.activeUser && (
              <div>
                <div className="font-semibold">激活用户:</div>
                <div className="text-xs bg-gray-100 p-2 rounded">
                  <div>ID: {authStatus.activeUser.id}</div>
                  <div>姓名: {authStatus.activeUser.name || '未设置'}</div>
                </div>
              </div>
            )}

            {/* 错误信息 */}
            {authStatus.errors.length > 0 && (
              <div>
                <div className="font-semibold text-red-600">错误:</div>
                <div className="text-xs bg-red-50 p-2 rounded max-h-20 overflow-y-auto">
                  {authStatus.errors.map((error, index) => (
                    <div key={index} className="text-red-600">{error}</div>
                  ))}
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  localStorage.removeItem('loginData')
                  localStorage.removeItem('activeUser')
                  sessionStorage.clear()
                  devLog.log('🧹 手动清除登录状态')
                }}
                className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
              >
                清除登录
              </button>
              <button 
                onClick={() => {
                  setAuthStatus(prev => ({ ...prev, errors: [] }))
                }}
                className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
              >
                清除错误
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
