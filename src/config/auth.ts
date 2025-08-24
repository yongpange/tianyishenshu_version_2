// 认证配置
export const authConfig = {
  // 开发环境配置
  development: {
    // 是否跳过认证检查
    skipAuthCheck: process.env.NEXT_PUBLIC_SKIP_AUTH_CHECK === 'true',
    // 用户状态检查间隔（毫秒）
    checkInterval: 300000, // 5分钟
    // 用户验证间隔（毫秒）
    verifyInterval: 300000, // 5分钟
    // 数据刷新间隔（毫秒）
    refreshInterval: 120000, // 2分钟
    // 是否启用宽松的错误处理
    lenientErrorHandling: true,
    // 网络超时时间（毫秒）
    networkTimeout: 10000, // 10秒
  },
  
  // 生产环境配置
  production: {
    // 是否跳过认证检查
    skipAuthCheck: false,
    // 用户状态检查间隔（毫秒）
    checkInterval: 120000, // 2分钟
    // 用户验证间隔（毫秒）
    verifyInterval: 120000, // 2分钟
    // 数据刷新间隔（毫秒）
    refreshInterval: 30000, // 30秒
    // 是否启用宽松的错误处理
    lenientErrorHandling: false,
    // 网络超时时间（毫秒）
    networkTimeout: 5000, // 5秒
  }
}

// 获取当前环境的配置
export const getCurrentAuthConfig = () => {
  const env = process.env.NODE_ENV as 'development' | 'production'
  return authConfig[env] || authConfig.production
}

// 检查是否应该跳过认证
export const shouldSkipAuth = () => {
  const config = getCurrentAuthConfig()
  return config.skipAuthCheck
}

// 获取检查间隔
export const getCheckInterval = () => {
  const config = getCurrentAuthConfig()
  return config.checkInterval
}

// 获取验证间隔
export const getVerifyInterval = () => {
  const config = getCurrentAuthConfig()
  return config.verifyInterval
}

// 获取刷新间隔
export const getRefreshInterval = () => {
  const config = getCurrentAuthConfig()
  return config.refreshInterval
}

// 检查是否启用宽松的错误处理
export const isLenientErrorHandling = () => {
  const config = getCurrentAuthConfig()
  return config.lenientErrorHandling
}

// 获取网络超时时间
export const getNetworkTimeout = () => {
  const config = getCurrentAuthConfig()
  return config.networkTimeout
}
