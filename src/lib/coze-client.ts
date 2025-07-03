// Coze API客户端
export interface CozeConfig {
  baseUrl: string
  apiToken: string
  botId: string
}

export interface CozeResponse {
  success: boolean
  response?: string
  conversationId?: string
  error?: string
}

export interface UserInfo {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  gender: string
  area: {
    province: string
    city: string
    district: string
  }
}

export class CozeClient {
  private config: CozeConfig

  constructor(config: CozeConfig) {
    this.config = config
  }

  // 格式化用户信息为Coze prompt
  private formatUserInfoForCoze(userInfo: UserInfo): string {
    const { year, month, day, hour, minute, gender, area } = userInfo
    const location = `${area.province}${area.city}${area.district}`
    const birthInfo = `${year}年${month}月${day}日${hour}时${minute}分，${location}`

    return `请根据出生信息：${birthInfo}，性别：${gender}，生成详细的性格分析报告。

请自由发挥，生成丰富全面的性格分析内容，可以包含但不限于：八字排盘、五行分析、性格特征、情感表达、处事风格、人际关系、优势潜力、发展建议等方面。

请使用markdown格式，合理组织内容结构，让报告既专业又易读。`
  }

  // 调用Coze API生成性格报告
  async generatePersonalityReport(userInfo: UserInfo, conversationId?: string): Promise<CozeResponse> {
    try {
      const prompt = this.formatUserInfoForCoze(userInfo)
      
      const response = await fetch(`${this.config.baseUrl}/v3/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiToken}`,
        },
        body: JSON.stringify({
          bot_id: this.config.botId,
          user_id: userInfo.year.toString(), // 使用年份作为临时用户ID
          stream: false,
          auto_save_history: true,
          additional_messages: [
            {
              role: 'user',
              content: prompt,
              content_type: 'text'
            }
          ],
          conversation_id: conversationId
        })
      })

      if (!response.ok) {
        throw new Error(`Coze API请求失败: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      // 根据Coze API的实际响应格式解析数据
      if (data.code === 0 && data.data) {
        return {
          success: true,
          response: data.data.content || data.data.answer || '生成的性格报告内容',
          conversationId: data.data.conversation_id
        }
      } else {
        throw new Error(data.msg || 'Coze API返回错误')
      }
    } catch (error) {
      console.error('Coze API调用失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  // 继续对话（用于性格报告页的聊天功能）
  async continueConversation(
    message: string, 
    userInfo: UserInfo, 
    conversationId?: string
  ): Promise<CozeResponse> {
    try {
      const response = await fetch(`${this.config.baseUrl}/v3/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiToken}`,
        },
        body: JSON.stringify({
          bot_id: this.config.botId,
          user_id: userInfo.year.toString(),
          stream: false,
          auto_save_history: true,
          additional_messages: [
            {
              role: 'user',
              content: message,
              content_type: 'text'
            }
          ],
          conversation_id: conversationId
        })
      })

      if (!response.ok) {
        throw new Error(`Coze API请求失败: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.code === 0 && data.data) {
        return {
          success: true,
          response: data.data.content || data.data.answer || '回复内容',
          conversationId: data.data.conversation_id
        }
      } else {
        throw new Error(data.msg || 'Coze API返回错误')
      }
    } catch (error) {
      console.error('Coze API调用失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }
}

// 创建默认的Coze客户端实例
export function createCozeClient(): CozeClient {
  const config: CozeConfig = {
    baseUrl: process.env.COZE_BASE_URL || '',
    apiToken: process.env.COZE_API_TOKEN || '',
    botId: process.env.BOT_ID || ''
  }

  if (!config.baseUrl || !config.apiToken || !config.botId) {
    throw new Error('Coze配置不完整，请检查环境变量')
  }

  return new CozeClient(config)
}
