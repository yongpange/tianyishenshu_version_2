import { CozeAPI } from '@coze/api'

// 环境变量配置接口
interface CozeAuthConfig {
  // PAT 认证配置
  patToken?: string
  
  // JWT OAuth 认证配置
  clientId?: string
  privateKeyFile?: string
  publicKeyId?: string
  apiBase?: string
  
  // Bot ID (可选，用于特定场景)
  botId?: string
}

// 认证结果接口
interface CozeAuthResult {
  client: CozeAPI
  authMethod: string
  token: string
}

// 默认配置
const DEFAULT_CONFIG: CozeAuthConfig = {
  patToken: process.env.COZE_API_TOKEN || '',
  clientId: process.env.COZE_CLIENT_ID || '',
  privateKeyFile: process.env.COZE_PRIVATE_KEY_FILE || '',
  publicKeyId: process.env.COZE_PUBLIC_KEY_ID || '',
  apiBase: process.env.COZE_API_BASE || 'api.coze.cn',
  botId: process.env.BOT_ID || ''
}

// 读取私钥内容
function getPrivateKey(privateKeyFile: string): string {
  if (!privateKeyFile) {
    throw new Error('私钥文件路径未配置')
  }
  
  try {
    const fs = require('fs')
    const path = require('path')
    
    // 支持相对路径和绝对路径
    const keyPath = path.isAbsolute(privateKeyFile) 
      ? privateKeyFile 
      : path.join(process.cwd(), privateKeyFile)
    
    if (!fs.existsSync(keyPath)) {
      throw new Error(`私钥文件不存在: ${keyPath}`)
    }
    
    const privateKey = fs.readFileSync(keyPath, 'utf8')
    console.log('🔑 从文件读取私钥成功:', keyPath)
    console.log('🔑 私钥长度:', privateKey.length, '字符')
    
    // 验证私钥格式
    if (!privateKey.includes('BEGIN') || !privateKey.includes('END')) {
      throw new Error('私钥格式不正确，必须是PEM格式')
    }
    
    return privateKey
  } catch (error) {
    console.error('❌ 读取私钥文件失败:', error instanceof Error ? error.message : String(error))
    throw error
  }
}

// JWT认证函数 - 符合Coze官方OAuth JWT规范
export async function createJWTToken(config: CozeAuthConfig): Promise<string> {
  const { clientId, privateKeyFile, publicKeyId, apiBase } = config
  
  console.log('🔍 === JWT Token 创建详细调试 ===')
  console.log('📋 输入参数:')
  console.log('   clientId:', clientId ? `${clientId.substring(0, 8)}...` : '空值')
  console.log('   publicKeyId:', publicKeyId ? `${publicKeyId.substring(0, 10)}...` : '空值')
  console.log('   privateKeyFile:', privateKeyFile || '空值')
  console.log('   apiBase:', apiBase || '空值')
  
  if (!clientId || !publicKeyId || !privateKeyFile) {
    console.error('❌ JWT 认证配置缺失')
    throw new Error('JWT 认证配置缺失：需要 clientId, publicKeyId, privateKeyFile')
  }
  
  try {
    console.log('📂 开始读取私钥文件...')
    
    // 获取私钥内容
    const privateKey = getPrivateKey(privateKeyFile)
    console.log('✅ 私钥读取成功，长度:', privateKey.length)
    console.log('🔑 私钥格式检查:')
    console.log('   包含BEGIN:', privateKey.includes('BEGIN'))
    console.log('   包含END:', privateKey.includes('END'))
    console.log('   包含PRIVATE KEY:', privateKey.includes('PRIVATE KEY'))
    console.log('   私钥前50字符:', privateKey.substring(0, 50))
    
    // 使用jsonwebtoken库生成JWT
    const jwt = require('jsonwebtoken')
    const now = Math.floor(Date.now() / 1000)
    
    console.log('⏰ 时间信息:')
    console.log('   当前时间戳:', now)
    console.log('   当前时间:', new Date(now * 1000).toISOString())
    console.log('   过期时间戳:', now + 3600)
    console.log('   过期时间:', new Date((now + 3600) * 1000).toISOString())
    
    // 符合Coze OAuth JWT规范的payload
    const payload = {
      iss: clientId,                     // 应用ID (issuer)
      aud: 'api.coze.cn',               // 受众 - 固定为 api.coze.cn（重要：不使用变量）
      iat: now,                          // 签发时间 (issued at)
      exp: now + 3600,                   // 过期时间 (expiry) - 1小时后
      jti: `${clientId}_${now}_${Math.random().toString(36).substring(2, 11)}` // JWT ID - 唯一标识
    }
    
    console.log('📦 JWT Payload:')
    console.log('   iss (issuer):', payload.iss)
    console.log('   aud (audience):', payload.aud)
    console.log('   iat (issued at):', payload.iat, '(' + new Date(payload.iat * 1000).toISOString() + ')')
    console.log('   exp (expires):', payload.exp, '(' + new Date(payload.exp * 1000).toISOString() + ')')
    console.log('   jti (JWT ID):', payload.jti)
    
    const header = {
      typ: 'JWT',
      alg: 'RS256',
      kid: publicKeyId  // 公钥ID
    }
    
    console.log('📋 JWT Header:')
    console.log('   typ:', header.typ)
    console.log('   alg:', header.alg)
    console.log('   kid:', header.kid)
    
    console.log('🔐 开始生成JWT Token...')
    
    // 生成JWT Token，包含kid（key ID）
    const token = jwt.sign(payload, privateKey, { 
      algorithm: 'RS256',
      header: header
    })
    
    console.log('✅ JWT Token 生成成功!')
    console.log('🔑 Token 长度:', token.length)
    console.log('🔑 Token 前100字符:', token.substring(0, 100) + '...')
    console.log('🔑 Token 结构检查:')
    const tokenParts = token.split('.')
    console.log('   Token 部分数量:', tokenParts.length, '(应该是3)')
    console.log('   Header 部分长度:', tokenParts[0]?.length || 0)
    console.log('   Payload 部分长度:', tokenParts[1]?.length || 0)
    console.log('   Signature 部分长度:', tokenParts[2]?.length || 0)
    
    console.log('=================================')
    
    return token
    
  } catch (error) {
    console.error('❌ JWT生成失败详细信息:')
    console.error('   错误类型:', error?.constructor?.name)
    console.error('   错误消息:', error instanceof Error ? error.message : String(error))
    console.error('   错误堆栈:', error instanceof Error ? error.stack : '无堆栈信息')
    
    // 提供更详细的错误信息
    if (error instanceof Error) {
      if (error.message.includes('key')) {
        console.error('🔑 私钥相关错误，请检查:')
        console.error('   1. 私钥文件路径是否正确')
        console.error('   2. 私钥文件是否存在')
        console.error('   3. 私钥格式是否为PEM格式')
        console.error('   4. 私钥是否为RSA格式')
        throw new Error('私钥格式错误或无效')
      } else if (error.message.includes('algorithm')) {
        console.error('🔧 算法相关错误')
        throw new Error('JWT算法配置错误')
      } else {
        console.error('📋 完整错误信息:', error)
        throw new Error(`JWT认证失败: ${error.message}`)
      }
    }
    
    throw new Error('JWT认证失败')
  }
}

// 获取OAuth Access Token - 符合Coze官方规范
async function getOAuthAccessToken(config: CozeAuthConfig): Promise<string> {
  try {
    console.log('🔍 === OAuth Access Token 获取详细调试 ===')
    console.log('🔄 开始通过JWT获取OAuth Access Token...')
    
    // 生成JWT token
    console.log('🎯 步骤1: 生成JWT Token')
    const jwtToken = await createJWTToken(config)
    console.log('✅ JWT Token 生成完成，长度:', jwtToken.length)
    
    // 使用官方API端点
    const tokenEndpoint = `https://${config.apiBase}/api/permission/oauth2/token`
    console.log('🎯 步骤2: 准备OAuth请求')
    console.log('   请求地址:', tokenEndpoint)
    
    const requestBody = {
      duration_seconds: 86399, // 24小时 - 1秒 (最大值)
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer'
    }
    
    console.log('📦 请求体:', JSON.stringify(requestBody, null, 2))
    console.log('🔑 Authorization Header:', `Bearer ${jwtToken.substring(0, 50)}...`)
    
    const requestHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwtToken}`
    }
    
    console.log('📋 请求头:', Object.keys(requestHeaders))
    
    console.log('🎯 步骤3: 发送OAuth请求')
    console.log('⏰ 请求开始时间:', new Date().toISOString())
    
    // 请求access token - 使用官方文档规范
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(requestBody)
    })
    
    console.log('📨 OAuth响应信息:')
    console.log('   状态码:', response.status)
    console.log('   状态文本:', response.statusText)
    console.log('   响应头:', Object.fromEntries(response.headers.entries()))
    
    const responseText = await response.text()
    console.log('📄 原始响应内容:', responseText)
    
    if (!response.ok) {
      console.error('❌ OAuth请求失败详细信息:')
      console.error('   HTTP状态:', response.status, response.statusText)
      console.error('   响应内容:', responseText)
      throw new Error(`OAuth token请求失败: ${response.status} ${responseText}`)
    }
    
    console.log('🎯 步骤4: 解析响应数据')
    let tokenData: any
    try {
      tokenData = JSON.parse(responseText)
      console.log('📦 解析后的响应数据:', JSON.stringify(tokenData, null, 2))
    } catch (parseError) {
      console.error('❌ JSON解析失败:', parseError)
      console.error('   原始响应:', responseText)
      throw new Error('OAuth响应格式无效')
    }
    
    if (!tokenData.access_token) {
      console.error('❌ 响应中缺少access_token')
      console.error('   响应字段:', Object.keys(tokenData))
      throw new Error('OAuth响应中缺少access_token')
    }
    
    console.log('✅ OAuth Access Token获取成功!')
    console.log('🔑 Access Token 信息:')
    console.log('   Token 长度:', tokenData.access_token.length)
    console.log('   Token 前30字符:', tokenData.access_token.substring(0, 30) + '...')
    console.log('   expires_in:', tokenData.expires_in)
    console.log('   token_type:', tokenData.token_type)
    
    if (tokenData.expires_in) {
      const expiresAt = new Date(tokenData.expires_in * 1000)
      console.log('   过期时间:', expiresAt.toISOString())
      console.log('   距离过期:', Math.floor((tokenData.expires_in * 1000 - Date.now()) / 1000 / 3600), '小时')
    }
    
    console.log('=================================')
    
    return tokenData.access_token
    
  } catch (error) {
    console.error('❌ OAuth Access Token获取失败详细信息:')
    console.error('   错误类型:', error?.constructor?.name)
    console.error('   错误消息:', error instanceof Error ? error.message : String(error))
    console.error('   错误堆栈:', error instanceof Error ? error.stack?.substring(0, 500) : '无堆栈信息')
    console.error('=================================')
    throw error
  }
}

// 创建 Coze API 客户端 - 支持多种认证方式
export async function createCozeClient(customConfig?: Partial<CozeAuthConfig>): Promise<CozeAuthResult> {
  // 合并配置
  const config: CozeAuthConfig = { ...DEFAULT_CONFIG, ...customConfig }
  
  let authToken = ''
  let authMethod = ''
  
  // 检查JWT配置的完整性
  const hasJWTConfig = config.clientId && config.privateKeyFile && config.publicKeyId
  
  // 暂时强制使用PAT Token认证，避免JWT OAuth问题
  if (config.patToken) {
    console.log('🔑 强制使用PAT Token认证（临时解决方案）')
    authToken = config.patToken
    authMethod = 'PAT Token (强制)'
  } else if (hasJWTConfig) {
    console.log('🔐 尝试使用JWT OAuth认证')
    try {
      authToken = await getOAuthAccessToken(config)
      authMethod = 'JWT OAuth'
      console.log('✅ JWT OAuth认证成功')
    } catch (error) {
      console.warn('⚠️ JWT OAuth认证失败:', error instanceof Error ? error.message : String(error))
      throw new Error('JWT OAuth认证失败且PAT Token未配置，请检查认证配置')
    }
  } else {
    throw new Error('认证配置缺失：请配置JWT OAuth 或 PAT Token')
  }
  
  // 确定API基础URL
  const baseURL = `https://${config.apiBase}/`
  
  console.log(`🌐 使用API地址: ${baseURL}`)
  console.log(`🔐 认证方式: ${authMethod}`)
  
  const client = new CozeAPI({
    token: authToken,
    baseURL: baseURL,
  })
  
  return { client, authMethod, token: authToken }
}

/**
 * 获取用户的 Coze Access Token
 * 优先使用数据库缓存的token，过期时自动刷新
 */
export async function getUserCozeToken(userInfo: any): Promise<{
  token: string | null
  authMethod: string
  client: CozeAPI | null
}> {
  let accessToken: string | null = null
  let authMethod = 'PAT Token' // 默认认证方式

  if (userInfo) {
    try {
      const { supabaseAdmin } = await import('@/lib/supabase')
      
      // 从user_profiles获取用户资料和token信息
      const { data: userProfile } = await supabaseAdmin
        .from('user_profiles')
        .select('id, coze_access_token, coze_token_expires_at, coze_token_created_at')
        .eq(userInfo.userProfileId ? 'id' : 'user_id', userInfo.userProfileId || userInfo.user_id || userInfo.userId)
        .single()

      if (userProfile?.id) {
        console.log('🔑 检查用户Access Token:', userProfile.id)
        
        // 检查是否有有效的token
        const now = new Date()
        const tokenExpiresAt = userProfile.coze_token_expires_at ? new Date(userProfile.coze_token_expires_at) : null
        
        if (userProfile.coze_access_token && tokenExpiresAt && tokenExpiresAt > now) {
          // token仍然有效，直接使用
          accessToken = userProfile.coze_access_token
          authMethod = 'JWT OAuth (cached)'
          console.log('✅ 使用缓存的Access Token，过期时间:', tokenExpiresAt.toISOString())
        } else {
          // token不存在或已过期，重新获取
          console.log('🔄 Token不存在或已过期，重新获取...')
          
          try {
            // 使用JWT OAuth获取新token
            const newToken = await getOAuthAccessToken(DEFAULT_CONFIG)
            
            // 由于getOAuthAccessToken只返回access_token字符串，我们使用默认过期时间（24小时）
            const expiresAt = new Date()
            expiresAt.setHours(expiresAt.getHours() + 23, 59, 0, 0) // 23小时59分钟后过期（提前1分钟）
            
            // 更新数据库中的token信息
            const { error: updateError } = await supabaseAdmin
              .from('user_profiles')
              .update({
                coze_access_token: newToken,
                coze_token_expires_at: expiresAt.toISOString(),
                coze_token_created_at: now.toISOString()
              })
              .eq('id', userProfile.id)
            
            if (updateError) {
              console.error('❌ 更新用户token失败:', updateError)
              throw updateError
            }
            
            accessToken = newToken
            authMethod = 'JWT OAuth (new)'
            console.log('✅ 获取新Access Token并存储到数据库，过期时间:', expiresAt.toISOString())
            
          } catch (jwtError) {
            console.error('❌ JWT认证失败:', jwtError)
            console.log('🔄 将降级使用系统认证')
          }
        }
      }
    } catch (error) {
      console.error('❌ 获取用户Access Token失败:', error)
      console.log('🔄 将降级使用系统认证')
    }
  }

  // 创建Coze客户端
  let client: CozeAPI | null = null
  if (accessToken) {
    // 使用用户的Access Token
    client = new CozeAPI({
      token: accessToken,
      baseURL: `https://${process.env.COZE_API_BASE || 'api.coze.cn'}/`
    })
    console.log('🔐 使用用户Access Token创建客户端')
  } else {
    // 降级使用系统级认证
    try {
      const systemAuth = await createCozeClient()
      client = systemAuth.client
      authMethod = systemAuth.authMethod
      console.log('🔄 使用系统级认证:', authMethod)
    } catch (error) {
      console.error('❌ 系统级认证也失败:', error)
      client = null
    }
  }

  return { token: accessToken, authMethod, client }
}

/**
 * 重新获取用户的 Coze Access Token（强制刷新）
 */
export async function refreshUserCozeToken(userInfo: any): Promise<{
  token: string | null
  client: CozeAPI | null
}> {
  let newToken: string | null = null
  let client: CozeAPI | null = null

  if (userInfo) {
    try {
      const { supabaseAdmin } = await import('@/lib/supabase')
      
      // 从user_profiles获取用户资料ID
      const { data: userProfile } = await supabaseAdmin
        .from('user_profiles')
        .select('id')
        .eq(userInfo.userProfileId ? 'id' : 'user_id', userInfo.userProfileId || userInfo.user_id || userInfo.userId)
        .single()

      if (userProfile?.id) {
        console.log('🔄 强制刷新用户Token:', userProfile.id)
        
        try {
          // 使用JWT OAuth获取新token
          newToken = await getOAuthAccessToken(DEFAULT_CONFIG)
          
          // 计算过期时间（24小时减1秒）
          const now = new Date()
          const expiresAt = new Date()
          expiresAt.setHours(expiresAt.getHours() + 23, 59, 0, 0) // 23小时59分钟后过期（提前1分钟）
          
          // 更新数据库中的token信息
          const { error: updateError } = await supabaseAdmin
            .from('user_profiles')
            .update({
              coze_access_token: newToken,
              coze_token_expires_at: expiresAt.toISOString(),
              coze_token_created_at: now.toISOString()
            })
            .eq('id', userProfile.id)
          
          if (updateError) {
            console.error('❌ 更新用户token失败:', updateError)
            throw updateError
          }
          
          console.log('✅ Token强制刷新成功并存储到数据库，过期时间:', expiresAt.toISOString())
          
          // 使用新token创建客户端
          client = new CozeAPI({
            token: newToken,
            baseURL: `https://${process.env.COZE_API_BASE || 'api.coze.cn'}/`
          })
          
        } catch (jwtError) {
          console.error('❌ JWT认证失败:', jwtError)
        }
      }
    } catch (refreshError) {
      console.error('❌ Token刷新过程失败:', refreshError)
    }
  }

  return { token: newToken, client }
}

/**
 * 带自动重试的 Coze API 调用包装器
 * 自动处理token过期和重试逻辑
 */
export async function callCozeWithRetry<T>(
  apiCall: (client: CozeAPI) => Promise<T>,
  userInfo: any,
  maxRetries: number = 1
): Promise<T> {
  // 获取初始客户端
  const { client: initialClient, authMethod } = await getUserCozeToken(userInfo)
  
  if (!initialClient) {
    throw new Error('无法创建Coze客户端')
  }

  console.log(`📡 使用 ${authMethod} 调用Coze API`)

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall(initialClient)
    } catch (error: any) {
      // 检查是否是token过期错误
      const isTokenExpired = error?.message?.includes('401') || 
                            error?.message?.includes('Unauthorized') ||
                            error?.status === 401 ||
                            error?.code === 4100 ||
                            error?.message?.includes('authentication is invalid') ||
                            error?.message?.includes('4100')

      if (isTokenExpired && attempt < maxRetries && userInfo) {
        console.log('🔄 Token可能过期，尝试刷新...')
        
        const { client: refreshedClient } = await refreshUserCozeToken(userInfo)
        
        if (refreshedClient) {
          console.log('✅ Token刷新成功，重试API调用')
          // 更新客户端并继续重试
          Object.assign(initialClient, refreshedClient)
          continue
        } else {
          console.error('❌ Token刷新失败')
        }
      }

      throw error
    }
  }

  throw new Error('API调用重试次数超限')
}

// 验证Bot ID配置
export function validateBotId(botId?: string): string {
  const finalBotId = botId || DEFAULT_CONFIG.botId
  
  if (!finalBotId) {
    throw new Error('Bot ID配置缺失，请设置 BOT_ID 环境变量或传入 botId 参数')
  }
  
  return finalBotId
}

// 检查认证配置完整性
export function checkAuthConfig(config?: Partial<CozeAuthConfig>): void {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
  const hasJWTConfig = finalConfig.clientId && finalConfig.privateKeyFile && finalConfig.publicKeyId
  const hasPATConfig = finalConfig.patToken
  
  if (!hasJWTConfig && !hasPATConfig) {
    throw new Error('认证配置检查失败: 既没有JWT也没有PAT配置')
  }
}

/**
 * 通用获取用户Coze客户端函数
 * 供各个API使用，统一token缓存逻辑
 */
export async function getUserCozeClient(userInfo: any): Promise<{
  client: any
  authMethod: string
  accessToken: string | null
}> {
  let accessToken: string | null = null
  let authMethod = 'PAT Token' // 默认认证方式

  if (userInfo) {
    try {
      const { supabaseAdmin } = await import('@/lib/supabase')
      
      // 从user_profiles获取用户资料ID
      const { data: userProfile } = await supabaseAdmin
        .from('user_profiles')
        .select('id')
        .eq('user_id', userInfo.user_id || userInfo.userId)
        .single()

      if (userProfile?.id) {
        console.log('🔑 获取用户Access Token:', userProfile.id)
        
        // 调用token管理API
        const tokenResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/user-profiles/coze-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userProfileId: userProfile.id
          })
        })

        const tokenResult = await tokenResponse.json()

        if (tokenResult.success && tokenResult.token) {
          accessToken = tokenResult.token
          authMethod = tokenResult.cached ? 'JWT OAuth (cached)' : 'JWT OAuth (new)'
          console.log('✅ 成功获取Access Token:', authMethod)
        } else {
          console.warn('⚠️ 获取Access Token失败，使用PAT Token:', tokenResult.message)
        }
      }
    } catch (error) {
      console.error('❌ 获取Access Token失败:', error)
      console.log('🔄 降级使用PAT Token')
    }
  }

  // 创建Coze客户端
  let client: any
  if (accessToken) {
    // 使用用户的Access Token
    const { CozeAPI } = await import('@coze/api')
    client = new CozeAPI({
      token: accessToken,
      baseURL: `https://${process.env.COZE_API_BASE || 'api.coze.cn'}/`
    })
    console.log('🔐 使用用户Access Token创建客户端')
  } else {
    // 降级使用系统级认证
    const { client: systemClient, authMethod: fallbackAuth } = await createCozeClient()
    client = systemClient
    authMethod = fallbackAuth
    console.log('🔄 使用系统级认证:', authMethod)
  }

  return { client, authMethod, accessToken }
}

/**
 * 带token刷新重试的API调用包装器
 * 供各个API使用，自动处理token过期和重试逻辑
 */
export async function callCozeAPIWithRetry<T>(
  apiCall: (client: any) => Promise<T>,
  userInfo: any,
  maxRetries: number = 1
): Promise<T> {
  // 获取初始客户端
  const { client: initialClient, authMethod, accessToken } = await getUserCozeClient(userInfo)

  console.log(`📡 使用 ${authMethod} 调用Coze API`)

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall(initialClient)
    } catch (error: any) {
      // 检查是否是token过期错误
      const isTokenExpired = error?.message?.includes('401') || 
                            error?.message?.includes('Unauthorized') ||
                            error?.status === 401 ||
                            error?.code === 4100 ||
                            error?.message?.includes('authentication is invalid') ||
                            error?.message?.includes('4100')

      if (isTokenExpired && attempt < maxRetries && accessToken && userInfo) {
        console.log('🔄 Token可能过期，尝试刷新...')
        
        try {
          const { client: refreshedClient } = await refreshUserCozeToken(userInfo)
          
          if (refreshedClient) {
            console.log('✅ Token刷新成功，重试API调用')
            // 更新客户端并继续重试
            Object.assign(initialClient, refreshedClient)
            continue
          } else {
            console.error('❌ Token刷新失败')
          }
        } catch (refreshError) {
          console.error('❌ Token刷新过程失败:', refreshError)
        }
      }

      throw error
    }
  }

  throw new Error('API调用重试次数超限')
}

/**
 * 确保用户有有效的 Coze Access Token
 * 如果没有token或token已过期，则生成新的token并保存到数据库
 */
export async function ensureUserCozeToken(userProfileId: string): Promise<{
  success: boolean
  token?: string
  message?: string
}> {
  try {
    console.log('🔍 检查用户Coze Token:', userProfileId)
    
    const { supabaseAdmin } = await import('@/lib/supabase')
    
    // 1. 获取用户当前的token信息
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('coze_access_token, coze_token_expires_at, coze_token_created_at')
      .eq('id', userProfileId)
      .single()

    if (profileError) {
      console.error('❌ 获取用户资料失败:', profileError)
      return { success: false, message: '用户资料不存在' }
    }

    const now = new Date()
    const tokenExpiresAt = userProfile.coze_token_expires_at ? new Date(userProfile.coze_token_expires_at) : null
    const isTokenValid = tokenExpiresAt && tokenExpiresAt > now && userProfile.coze_access_token
    
    console.log('🔍 Token状态检查:', {
      hasToken: !!userProfile.coze_access_token,
      expiresAt: tokenExpiresAt?.toISOString(),
      isValid: isTokenValid
    })

    // 2. 如果token有效，直接返回
    if (isTokenValid) {
      console.log('✅ 用户已有有效Token')
      return { 
        success: true, 
        token: userProfile.coze_access_token,
        message: '用户已有有效Token'
      }
    }

    // 3. 需要生成新token
    console.log('🔄 需要为用户生成新的Access Token')

    try {
      // 使用JWT认证获取新的Access Token
      const config = {
        clientId: process.env.COZE_CLIENT_ID!,
        publicKeyId: process.env.COZE_PUBLIC_KEY_ID!,
        privateKeyFile: process.env.COZE_PRIVATE_KEY_FILE!,
        apiBase: process.env.COZE_API_BASE || 'api.coze.cn'
      }

      // 验证配置
      if (!config.clientId || !config.publicKeyId || !config.privateKeyFile) {
        throw new Error('Coze OAuth配置缺失')
      }

      // 创建JWT Token
      const jwtToken = await createJWTToken(config)
      console.log('✅ JWT Token创建成功')

      // 请求Access Token
      const tokenResponse = await fetch(`https://${config.apiBase}/api/permission/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          duration_seconds: 86400, // 24小时
        }),
      })

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text()
        throw new Error(`OAuth请求失败: ${tokenResponse.status} ${errorText}`)
      }

      const tokenData = await tokenResponse.json()

      if (!tokenData.access_token) {
        throw new Error('OAuth响应中缺少access_token')
      }

      console.log('✅ 新Access Token获取成功')

      // 4. 保存新token到数据库  
      // 这里直接从API响应获取正确的expires_in时间戳
      const newExpiresAt = new Date(tokenData.expires_in * 1000 - 60000) // 提前1分钟过期
      
      console.log('📅 Token过期时间计算（ensureUserCozeToken）:', {
        expires_in_timestamp: tokenData.expires_in,
        expires_in_date: new Date(tokenData.expires_in * 1000).toISOString(),
        final_expires_at: newExpiresAt.toISOString(),
        current_time: now.toISOString()
      })
      
      const { error: updateError } = await supabaseAdmin
        .from('user_profiles')
        .update({
          coze_access_token: tokenData.access_token,
          coze_token_expires_at: newExpiresAt.toISOString(),
          coze_token_created_at: now.toISOString()
        })
        .eq('id', userProfileId)

      if (updateError) {
        console.error('❌ 保存Token失败:', updateError)
        return { 
          success: false, 
          message: '保存Token失败，但token已生成',
          token: tokenData.access_token
        }
      }

      console.log('✅ Token已成功生成并保存到数据库')
      return { 
        success: true, 
        token: tokenData.access_token,
        message: 'Token已成功生成并保存'
      }

    } catch (tokenError) {
      console.error('❌ 生成Token失败:', tokenError)
      return { 
        success: false, 
        message: tokenError instanceof Error ? tokenError.message : '生成Access Token失败'
      }
    }

  } catch (error) {
    console.error('❌ ensureUserCozeToken失败:', error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : '检查Token失败'
    }
  }
}

/**
 * 简化的JWT认证函数，专门用于报告生成
 * 临时优先使用PAT Token绕过OAuth 4100错误
 */
export async function createReportCozeClient(): Promise<{
  client: CozeAPI
  authMethod: string
}> {
  try {
    console.log('🔄 报告生成专用认证（临时优先PAT Token）')
    
    // 临时优先使用PAT Token绕过OAuth 4100错误
    const patToken = process.env.COZE_API_TOKEN
    if (patToken) {
      console.log('🔑 优先使用PAT Token认证（绕过OAuth 4100问题）')
      const client = new CozeAPI({
        token: patToken,
        baseURL: `https://${process.env.COZE_API_BASE || 'api.coze.cn'}/`
      })
      
      return {
        client,
        authMethod: 'PAT Token (4100 workaround)'
      }
    }
    
    // 如果没有PAT Token，尝试JWT OAuth认证
    const config = {
      clientId: process.env.COZE_CLIENT_ID!,
      publicKeyId: process.env.COZE_PUBLIC_KEY_ID!,
      privateKeyFile: process.env.COZE_PRIVATE_KEY_FILE!,
      apiBase: process.env.COZE_API_BASE || 'api.coze.cn'
    }

    // 检查JWT配置完整性
    const hasJWTConfig = config.clientId && config.publicKeyId && config.privateKeyFile
    
    if (hasJWTConfig) {
      console.log('🔐 尝试JWT OAuth认证（报告生成）')
      
      try {
        // 创建JWT Token
        const jwtToken = await createJWTToken(config)
        console.log('✅ JWT Token创建成功')

        // 请求Access Token
        const tokenResponse = await fetch(`https://${config.apiBase}/api/permission/oauth2/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwtToken}`,
          },
          body: JSON.stringify({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            duration_seconds: 86400, // 24小时
          }),
        })

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text()
          throw new Error(`OAuth请求失败: ${tokenResponse.status} ${errorText}`)
        }

        const tokenData = await tokenResponse.json()

        if (!tokenData.access_token) {
          throw new Error('OAuth响应中缺少access_token')
        }

        console.log('✅ JWT OAuth认证成功')

        // 创建客户端
        const client = new CozeAPI({
          token: tokenData.access_token,
          baseURL: `https://${config.apiBase}/`
        })

        return {
          client,
          authMethod: 'JWT OAuth (reports)'
        }
      } catch (jwtError) {
        console.warn('⚠️ JWT OAuth认证失败（可能是4100错误）:', jwtError instanceof Error ? jwtError.message : String(jwtError))
        // 如果JWT失败且没有PAT Token，抛出错误
        throw new Error('JWT OAuth认证失败且PAT Token未配置，请检查Bot权限或配置PAT Token')
      }
    } else {
      throw new Error('认证配置缺失：请配置JWT OAuth或PAT Token')
    }
    
  } catch (error) {
    console.error('❌ 报告生成认证失败:', error)
    throw error
  }
}

// 导出配置接口供外部使用
export type { CozeAuthConfig, CozeAuthResult } 