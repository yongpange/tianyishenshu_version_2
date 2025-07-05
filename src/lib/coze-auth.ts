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
async function createJWTToken(config: CozeAuthConfig): Promise<string> {
  const { clientId, privateKeyFile, publicKeyId, apiBase } = config
  
  if (!clientId || !publicKeyId || !privateKeyFile) {
    throw new Error('JWT 认证配置缺失：需要 clientId, publicKeyId, privateKeyFile')
  }
  
  try {
    // 获取私钥内容
    const privateKey = getPrivateKey(privateKeyFile)
    
    // 使用jsonwebtoken库生成JWT
    const jwt = require('jsonwebtoken')
    const now = Math.floor(Date.now() / 1000)
    
    // 符合Coze OAuth JWT规范的payload
    const payload = {
      iss: clientId,                     // 应用ID (issuer)
      aud: apiBase,                      // 受众 - Coze API域名 (不含https://)
      iat: now,                          // 签发时间 (issued at)
      exp: now + 3600,                   // 过期时间 (expiry) - 1小时后
      jti: `${clientId}_${now}_${Math.random().toString(36).substring(2, 11)}` // JWT ID - 唯一标识
    }
    
    // 生成JWT Token，包含kid（key ID）
    const token = jwt.sign(payload, privateKey, { 
      algorithm: 'RS256',
      header: {
        typ: 'JWT',
        alg: 'RS256',
        kid: publicKeyId  // 公钥ID
      }
    })
    
    console.log('✅ JWT Token生成成功')
    return token
    
  } catch (error) {
    console.error('❌ JWT生成失败:', error)
    
    // 提供更详细的错误信息
    if (error instanceof Error) {
      if (error.message.includes('key')) {
        throw new Error('私钥格式错误或无效')
      } else if (error.message.includes('algorithm')) {
        throw new Error('JWT算法配置错误')
      } else {
        throw new Error(`JWT认证失败: ${error.message}`)
      }
    }
    
    throw new Error('JWT认证失败')
  }
}

// 获取OAuth Access Token - 符合Coze官方规范
async function getOAuthAccessToken(config: CozeAuthConfig): Promise<string> {
  try {
    console.log('🔄 通过JWT获取OAuth Access Token...')
    
    // 生成JWT token
    const jwtToken = await createJWTToken(config)
    
    // 使用官方API端点
    const tokenEndpoint = `https://${config.apiBase}/api/permission/oauth2/token`
    
    // 请求access token - 使用官方文档规范
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify({
        duration_seconds: 86399, // 24小时 - 1秒 (最大值)
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer'
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OAuth token请求失败: ${response.status} ${errorText}`)
    }
    
    const tokenData = await response.json()
    
    if (!tokenData.access_token) {
      throw new Error('OAuth响应中缺少access_token')
    }
    
    console.log('✅ OAuth Access Token获取成功')
    console.log(`   Access Token: ${tokenData.access_token.substring(0, 20)}...`)
    console.log(`   过期时间戳: ${tokenData.expires_in}`)
    
    return tokenData.access_token
    
  } catch (error) {
    console.error('❌ OAuth Access Token获取失败:', error)
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
  
  // 优先使用JWT OAuth认证，降级到PAT认证
  if (hasJWTConfig) {
    console.log('🔐 尝试使用JWT OAuth认证')
    try {
      authToken = await getOAuthAccessToken(config)
      authMethod = 'JWT OAuth'
      console.log('✅ JWT OAuth认证成功')
    } catch (error) {
      console.warn('⚠️ JWT OAuth认证失败，降级到PAT认证:', error instanceof Error ? error.message : String(error))
      
      if (!config.patToken) {
        throw new Error('JWT OAuth认证失败且PAT Token未配置，请检查认证配置')
      }
      
      authToken = config.patToken
      authMethod = 'PAT Token (降级)'
    }
  } else if (config.patToken) {
    console.log('🔑 使用PAT Token认证')
    authToken = config.patToken
    authMethod = 'PAT Token'
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

// 导出配置接口供外部使用
export type { CozeAuthConfig, CozeAuthResult } 