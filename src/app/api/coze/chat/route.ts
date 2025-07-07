import { NextRequest, NextResponse } from 'next/server'
import { CozeAPI, COZE_CN_BASE_URL, ChatStatus, RoleType } from '@coze/api'
import { getAstrologyContext } from '@/utils/personality-report'

// 环境变量配置
const COZE_API_TOKEN = process.env.COZE_API_TOKEN || ''
const COZE_BOT_ID = process.env.BOT_ID || ''
// OAuth JWT认证配置
const COZE_CLIENT_ID = process.env.COZE_CLIENT_ID || ''
const COZE_PRIVATE_KEY_FILE = process.env.COZE_PRIVATE_KEY_FILE || ''
const COZE_PUBLIC_KEY_ID = process.env.COZE_PUBLIC_KEY_ID || ''
const COZE_API_BASE = process.env.COZE_API_BASE || 'api.coze.cn'

// 读取私钥内容
function getPrivateKey(): string {
  // 优先使用文件路径方式（推荐）
  if (COZE_PRIVATE_KEY_FILE) {
    try {
      const fs = require('fs')
      const path = require('path')
      
      // 支持相对路径和绝对路径
      const keyPath = path.isAbsolute(COZE_PRIVATE_KEY_FILE) 
        ? COZE_PRIVATE_KEY_FILE 
        : path.join(process.cwd(), COZE_PRIVATE_KEY_FILE)
      
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
      console.warn('⚠️ 读取私钥文件失败，尝试环境变量:', error instanceof Error ? error.message : String(error))
    }
  }
  
  
  throw new Error('私钥配置缺失：请设置 COZE_PRIVATE_KEY_FILE ')
}

// JWT认证函数 - 符合Coze官方OAuth JWT规范
async function createJWTToken(): Promise<string> {
  if (!COZE_CLIENT_ID || !COZE_PUBLIC_KEY_ID) {
    throw new Error('COZE_CLIENT_ID 和 COZE_PUBLIC_KEY_ID 配置缺失')
  }
  
  try {
    // 获取私钥内容
    const privateKey = getPrivateKey()
    
    // 使用jsonwebtoken库生成JWT
    const jwt = require('jsonwebtoken')
    const now = Math.floor(Date.now() / 1000)
    
    // 符合Coze OAuth JWT规范的payload
    const payload = {
      iss: COZE_CLIENT_ID,           // 应用ID (issuer)
      aud: COZE_API_BASE,            // 受众 - Coze API域名 (不含https://)
      iat: now,                      // 签发时间 (issued at)
      exp: now + 3600,               // 过期时间 (expiry) - 1小时后
      jti: `${COZE_CLIENT_ID}_${now}_${Math.random().toString(36).substring(2, 11)}` // JWT ID - 唯一标识
    }
    
    // 生成JWT Token，包含kid（key ID）
    const token = jwt.sign(payload, privateKey, { 
      algorithm: 'RS256',
      header: {
        typ: 'JWT',
        alg: 'RS256',
        kid: COZE_PUBLIC_KEY_ID  // 公钥ID
      }
    })
    
    console.log('✅ JWT Token生成成功')
    console.log('JWT Token:', token)
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
async function getOAuthAccessToken(): Promise<string> {
  try {
    console.log('🔄 通过JWT获取OAuth Access Token...')
    
    // 生成JWT token
    const jwtToken = await createJWTToken()
    
    // 使用官方API端点
    const tokenEndpoint = `https://${COZE_API_BASE}/api/permission/oauth2/token`
    
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

// 初始化 Coze API 客户端
async function createCozeClient(): Promise<{ client: CozeAPI, authMethod: string }> {
  let authToken = ''
  let authMethod = ''
  
  // 检查JWT配置的完整性
  const hasJWTConfig = COZE_CLIENT_ID && COZE_PRIVATE_KEY_FILE && COZE_PUBLIC_KEY_ID
  
  // 优先使用JWT OAuth认证，降级到PAT认证
  if (hasJWTConfig) {
    console.log('🔐 尝试使用JWT OAuth认证')
    try {
      authToken = await getOAuthAccessToken()
      authMethod = 'JWT OAuth'
      console.log('✅ JWT OAuth认证成功')
    } catch (error) {
      console.warn('⚠️ JWT OAuth认证失败，降级到PAT认证:', error instanceof Error ? error.message : String(error))
      
      if (!COZE_API_TOKEN) {
        throw new Error('JWT OAuth认证失败且PAT Token未配置，请检查认证配置')
      }
      
      authToken = COZE_API_TOKEN
      authMethod = 'PAT Token (降级)'
    }
  } else if (COZE_API_TOKEN) {
    console.log('🔑 使用PAT Token认证')
    authToken = COZE_API_TOKEN
    authMethod = 'PAT Token'
  } else {
    throw new Error('认证配置缺失：请配置JWT OAuth (COZE_CLIENT_ID + COZE_PRIVATE_KEY_FILE + COZE_PUBLIC_KEY_ID) 或 PAT Token (COZE_API_TOKEN)')
  }
  
  // 确定API基础URL
  const baseURL = 'https://api.coze.cn/'
  
  console.log(`🌐 使用API地址: ${baseURL}`)
  
  const client = new CozeAPI({
    token: authToken,
    baseURL: baseURL,
  })
  
  return { client, authMethod }
}

export async function POST(request: NextRequest) {
  try {
    const { message, userInfo, conversationId } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: '消息内容不能为空' },
        { status: 400 }
      )
    }

    // 检查基本配置
    if (!COZE_BOT_ID) {
      return NextResponse.json(
        { error: 'Bot ID配置缺失' },
        { status: 500 }
      )
    }

    // 获取八字排盘上下文
    let astrologyContext = ''
    if (userInfo) {
      try {
        astrologyContext = await getAstrologyContext(userInfo)
        console.log('✅ 成功获取八字排盘上下文')
      } catch (error) {
        console.warn('⚠️ 获取八字排盘上下文失败，将使用基础用户信息:', error)
        astrologyContext = ''
      }
    }

    // 构建用户上下文信息
    const contextMessage = userInfo ? `
${astrologyContext ? astrologyContext : `用户信息：
- 昵称：${userInfo.nickname}
- 性别：${userInfo.gender === 'male' ? '男' : '女'}
- 出生日期：${userInfo.year}年${userInfo.month}月${userInfo.day}日
- 出生时间：${userInfo.hour}时${userInfo.minute}分
- 出生地区：${userInfo.area?.province} ${userInfo.area?.city} ${userInfo.area?.county}`}

用户问题：${message}
` : message

    // 创建Coze客户端（支持JWT和PAT认证）
    const { client: coze, authMethod } = await createCozeClient()

    // 调用 Coze 智能体
    const result = await coze.chat.createAndPoll({
      bot_id: COZE_BOT_ID,
      user_id: 'user_' + Date.now(), // 生成唯一用户ID
      additional_messages: [
        {
          role: RoleType.User,
          content: contextMessage,
          content_type: 'text',
        },
      ],
      conversation_id: conversationId, // 如果有对话ID则传入，用于保持对话连续性
    })
    console.log('🔑 AI返回结果: ', result)
    if (result.chat.status === ChatStatus.COMPLETED && result.messages) {
      // 找到AI的回复
      const aiMessage = result.messages.find(
        (msg: any) => msg.role === RoleType.Assistant && msg.type === 'answer'
      )
      console.log('🔑 AI返回的aiMessage回复: ', aiMessage)
      console.log('🔑 AI返回的aiMessagE.CONTENT回复: ', aiMessage?.content)
      return NextResponse.json({
        success: true,
        response: aiMessage?.content || '抱歉，我现在无法回答这个问题。',
        conversationId: result.chat.conversation_id,
        chatId: result.chat.id,
        authMethod: authMethod // 返回实际使用的认证方式
      })
    } else {
      return NextResponse.json(
        { error: '智能体响应失败', status: result.chat.status },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Coze API调用失败:', error)
    return NextResponse.json(
      { 
        error: 'AI服务暂时不可用，请稍后重试',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
} 