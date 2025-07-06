import { CozeAPI, COZE_CN_BASE_URL, ChatStatus, RoleType } from '@coze/api'
import * as jwt from 'jsonwebtoken'
import * as fs from 'fs'
import * as path from 'path'

// OAuth配置接口
interface CozeOAuthConfig {
  clientId: string
  publicKeyId: string
  privateKeyFile: string
  apiBase: string
}

// 聊天请求接口
export interface ChatRequest {
  botId: string
  message: string
  userInfo?: any
  conversationId?: string
  userId?: string
}

// 聊天响应接口
export interface ChatResponse {
  success: boolean
  response?: string
  conversationId?: string
  chatId?: string
  error?: string
  authMethod?: string
}

// 性格报告请求接口
export interface PersonalityReportRequest {
  botId: string
  userInfo: any
  userId: string
}

// 性格报告响应接口
export interface PersonalityReportResponse {
  success: boolean
  report?: string
  conversationId?: string
  error?: string
  authMethod?: string
}

/**
 * Coze OAuth 2.0 认证客户端
 * 支持动态BOT_ID和JWT认证
 */
export class CozeOAuthClient {
  private config: CozeOAuthConfig
  private accessToken: string | null = null
  private tokenExpiry: number = 0

  constructor(config: CozeOAuthConfig) {
    this.config = config
  }

  /**
   * 创建JWT Token用于OAuth认证
   */
  private createJWTToken(): string {
    try {
      console.log('🔐 开始创建JWT Token...')
      console.log('   当前工作目录:', process.cwd())
      console.log('   私钥文件名:', this.config.privateKeyFile)

      const privateKeyPath = path.resolve(process.cwd(), this.config.privateKeyFile)
      console.log('   私钥文件完整路径:', privateKeyPath)

      if (!fs.existsSync(privateKeyPath)) {
        throw new Error(`私钥文件不存在: ${privateKeyPath}`)
      }
      console.log('   ✅ 私钥文件存在')

      const privateKey = fs.readFileSync(privateKeyPath, 'utf8')
      console.log('   ✅ 私钥文件读取成功，长度:', privateKey.length)

      const now = Math.floor(Date.now() / 1000)
      const payload = {
        iss: this.config.clientId,
        aud: 'api.coze.cn',
        iat: now,
        exp: now + 3600, // 1小时过期
        jti: `${this.config.clientId}-${now}-${Math.random().toString(36).substring(2, 11)}`
      }
      console.log('   JWT Payload:', JSON.stringify(payload, null, 2))

      const token = jwt.sign(payload, privateKey, {
        algorithm: 'RS256',
        keyid: this.config.publicKeyId,
      })

      console.log('✅ JWT Token创建成功，长度:', token.length)
      console.log('   Token前缀:', token.substring(0, 50) + '...')
      return token
    } catch (error) {
      console.error('❌ JWT Token创建失败:', error)
      if (error instanceof Error) {
        console.error('   错误类型:', error.constructor.name)
        console.error('   错误消息:', error.message)
      }
      throw error
    }
  }

  /**
   * 获取OAuth Access Token
   */
  private async getOAuthAccessToken(): Promise<string> {
    try {
      // 检查现有token是否还有效
      if (this.accessToken && Date.now() < this.tokenExpiry) {
        console.log('🔄 使用缓存的Access Token')
        return this.accessToken
      }

      console.log('🔐 获取新的OAuth Access Token...')

      const jwtToken = this.createJWTToken()
      console.log('   JWT Token 长度:', jwtToken?.length || 0)
      console.log('   JWT Token 前缀:', jwtToken?.substring(0, 50) + '...')

      const requestBody = {
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        duration_seconds: 86400, // 24小时
      }

      console.log('   OAuth 请求体:', JSON.stringify(requestBody, null, 2))
      console.log('   请求 URL:', `https://${this.config.apiBase}/api/permission/oauth2/token`)
      console.log('   Authorization 头:', `Bearer ${jwtToken.substring(0, 50)}...`)

      const response = await fetch(`https://${this.config.apiBase}/api/permission/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`,
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`OAuth请求失败: ${response.status} ${response.statusText} - ${errorText}`)
      }
      
      const tokenData = await response.json()
      
      if (!tokenData.access_token) {
        throw new Error('OAuth响应中缺少access_token')
      }
      
      // 缓存token
      this.accessToken = tokenData.access_token
      this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000) - 60000 // 提前1分钟过期
      
      console.log('✅ OAuth Access Token获取成功')
      console.log(`   过期时间: ${new Date(this.tokenExpiry).toLocaleString()}`)
      
      return this.accessToken!
      
    } catch (error) {
      console.error('❌ OAuth Access Token获取失败:', error)
      throw error
    }
  }

  /**
   * 创建Coze API客户端
   */
  private async createCozeClient(): Promise<{ client: CozeAPI, authMethod: string }> {
    try {
      const accessToken = await this.getOAuthAccessToken()
      const baseURL = `https://${this.config.apiBase}/`
      
      console.log(`🌐 使用API地址: ${baseURL}`)
      
      const client = new CozeAPI({
        token: accessToken,
        baseURL: baseURL,
      })
      
      return { client, authMethod: 'OAuth 2.0 JWT' }
    } catch (error) {
      console.error('❌ Coze客户端创建失败:', error)
      throw error
    }
  }

  /**
   * 发送聊天消息
   */
  async sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      const { botId, message, userInfo, conversationId, userId } = request

      if (!botId) {
        throw new Error('BOT_ID不能为空')
      }

      if (!message) {
        throw new Error('消息内容不能为空')
      }

      // 构建用户上下文信息
      const contextMessage = userInfo ? `
用户信息：
- 昵称：${userInfo.nickname}
- 性别：${userInfo.gender === 'male' ? '男' : '女'}
- 出生日期：${userInfo.year}年${userInfo.month}月${userInfo.day}日
- 出生时间：${userInfo.hour}时${userInfo.minute}分
- 出生地区：${userInfo.area?.province} ${userInfo.area?.city} ${userInfo.area?.county}

用户问题：${message}
` : message

      console.log(`🤖 调用智能体 ${botId}...`)
      
      // 创建Coze客户端
      const { client: coze, authMethod } = await this.createCozeClient()

      // 调用 Coze 智能体
      const result = await coze.chat.createAndPoll({
        bot_id: botId,
        user_id: userId || `user_${Date.now()}`,
        additional_messages: [
          {
            role: RoleType.User,
            content: contextMessage,
            content_type: 'text',
          },
        ],
        conversation_id: conversationId,
      })

      console.log('📡 聊天完成:', {
        status: result.chat.status,
        conversation_id: result.chat.conversation_id,
        botId: botId
      })

      if (result.chat.status === ChatStatus.COMPLETED && result.messages) {
        // 找到AI的回复
        const aiMessage = result.messages.find(
          (msg: any) => msg.role === RoleType.Assistant && msg.type === 'answer'
        )

        return {
          success: true,
          response: aiMessage?.content || '抱歉，我现在无法回答这个问题。',
          conversationId: result.chat.conversation_id,
          chatId: result.chat.id,
          authMethod: authMethod
        }
      } else {
        throw new Error(`智能体响应失败，状态: ${result.chat.status}`)
      }

    } catch (error) {
      console.error('❌ 聊天消息发送失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  /**
   * 生成性格报告
   */
  async generatePersonalityReport(request: PersonalityReportRequest): Promise<PersonalityReportResponse> {
    try {
      const { botId, userInfo, userId } = request

      if (!botId) {
        throw new Error('BOT_ID不能为空')
      }

      if (!userInfo) {
        throw new Error('用户信息不能为空')
      }

      // 构建性格分析prompt
      const prompt = `请根据出生信息：${userInfo.year}年${userInfo.month}月${userInfo.day}日${userInfo.hour}时${userInfo.minute}分，${userInfo.area?.province}${userInfo.area?.city}${userInfo.area?.county}，性别：${userInfo.gender === 'male' ? '男' : '女'}，生成详细的性格分析报告。`

      console.log(`🔮 生成性格报告，智能体: ${botId}`)
      
      // 创建Coze客户端
      const { client: coze, authMethod } = await this.createCozeClient()

      // 调用 Coze 智能体
      const result = await Promise.race([
        coze.chat.createAndPoll({
          bot_id: botId,
          user_id: userId || `user_${Date.now()}`,
          additional_messages: [
            {
              role: RoleType.User,
              content: prompt,
              content_type: 'text',
            },
          ],
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('性格报告生成超时，请稍后重试')), 300000) // 5分钟超时
        )
      ]) as any

      console.log('📡 性格报告生成完成:', {
        status: result.chat.status,
        conversation_id: result.chat.conversation_id,
        botId: botId
      })

      if (result.chat.status === ChatStatus.COMPLETED && result.messages) {
        // 找到AI的回复
        const aiMessage = result.messages.find(
          (msg: any) => msg.role === RoleType.Assistant && msg.type === 'answer'
        )

        if (aiMessage && aiMessage.content) {
          return {
            success: true,
            report: aiMessage.content,
            conversationId: result.chat.conversation_id,
            authMethod: authMethod
          }
        } else {
          throw new Error('未找到AI回复消息')
        }
      } else {
        throw new Error(`性格报告生成失败，状态: ${result.chat.status}`)
      }

    } catch (error) {
      console.error('❌ 性格报告生成失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }
}

/**
 * 创建默认的Coze OAuth客户端实例
 */
export function createCozeOAuthClient(): CozeOAuthClient {
  const config: CozeOAuthConfig = {
    clientId: process.env.COZE_CLIENT_ID || '',
    publicKeyId: process.env.COZE_PUBLIC_KEY_ID || '',
    privateKeyFile: process.env.COZE_PRIVATE_KEY_FILE || '',
    apiBase: process.env.COZE_API_BASE || 'api.coze.cn'
  }

  // 验证配置完整性
  if (!config.clientId || !config.publicKeyId || !config.privateKeyFile) {
    throw new Error('Coze OAuth配置不完整，请检查环境变量: COZE_CLIENT_ID, COZE_PUBLIC_KEY_ID, COZE_PRIVATE_KEY_FILE')
  }

  return new CozeOAuthClient(config)
}
