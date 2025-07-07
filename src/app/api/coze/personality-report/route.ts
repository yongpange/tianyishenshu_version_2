import { NextRequest, NextResponse } from 'next/server'
import { CozeAPI, COZE_CN_BASE_URL, ChatStatus, RoleType } from '@coze/api'
import {
  validateUserInfo
} from '@/utils/client-utils'
import {
  createPersonalityReport,
  savePersonalityReport,
  getAstrologyContext
} from '@/utils/personality-report'
import { UserInfo } from '@/lib/coze-client'

// 请求接口
interface PersonalityReportRequest {
  userInfo: UserInfo
  userId: string
}

// 响应接口
interface PersonalityReportResponse {
  success: boolean
  report?: string
  conversationId?: string
  error?: string
}

// 环境变量配置
const COZE_API_TOKEN = process.env.COZE_API_TOKEN || ''
const COZE_BOT_ID = process.env.BOT_ID || ''

// 初始化 Coze API 客户端
const coze = new CozeAPI({
  token: COZE_API_TOKEN,
  baseURL: COZE_CN_BASE_URL, // 使用国内版本
})

// 格式化用户信息为性格报告prompt
function formatPersonalityPrompt(userInfo: UserInfo, astrologyContext?: string): string {
  const { year, month, day, hour, minute, gender, area } = userInfo
  const location = `${area.province}${area.city}${area.district}`
  const birthInfo = `${year}年${month}月${day}日${hour}时${minute}分，${location}`

  let prompt = `请根据出生信息：${birthInfo}，性别：${gender === 'male' || gender === '男' ? '男' : '女'}，生成详细的性格分析报告。

`

  // 如果有八字排盘信息，加入上下文
  if (astrologyContext) {
    prompt += `**八字排盘分析数据：**

${astrologyContext}

**请基于以上八字排盘信息，结合传统命理学知识，生成深度的性格分析报告。**

`
  }

  prompt += `请自由发挥，生成丰富全面的性格分析内容，可以包含但不限于：八字排盘、五行分析、性格特征、情感表达、处事风格、人际关系、优势潜力、发展建议等方面。

请使用markdown格式，合理组织内容结构，让报告既专业又易读。`

  return prompt
}

export async function POST(request: NextRequest): Promise<NextResponse<PersonalityReportResponse>> {
  try {
    const body: PersonalityReportRequest = await request.json()
    const { userInfo, userId } = body

    // 验证请求参数
    if (!userId || !userInfo) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数'
      }, { status: 400 })
    }

    // 验证用户信息完整性
    if (!validateUserInfo(userInfo)) {
      return NextResponse.json({
        success: false,
        error: '用户信息不完整'
      }, { status: 400 })
    }

    // 验证环境变量
    if (!COZE_API_TOKEN || !COZE_BOT_ID) {
      console.error('环境变量检查失败:', {
        COZE_API_TOKEN: COZE_API_TOKEN ? '已设置' : '未设置',
        COZE_BOT_ID: COZE_BOT_ID ? '已设置' : '未设置'
      })
      return NextResponse.json({
        success: false,
        error: 'Coze API配置缺失，请检查环境变量'
      }, { status: 500 })
    }

    console.log('环境变量检查通过:', {
      COZE_API_TOKEN: COZE_API_TOKEN ? '已设置' : '未设置',
      COZE_BOT_ID: COZE_BOT_ID ? '已设置' : '未设置'
    })

    // 获取八字排盘上下文信息
    console.log('🔮 获取八字排盘数据...')
    const astrologyContext = await getAstrologyContext(userInfo)
    console.log('✅ 八字排盘数据获取完成')

    // 生成性格报告prompt
    const prompt = formatPersonalityPrompt(userInfo, astrologyContext)

    // 尝试调用 Coze 智能体（带重试机制）
    let lastError: Error | null = null
    const maxRetries = 2

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🚀 开始调用Coze智能体 (尝试 ${attempt}/${maxRetries})`)
        console.log('📝 Prompt:', prompt.substring(0, 200) + '...')

        // 设置更长的超时时间
        const result = await Promise.race([
          coze.chat.createAndPoll({
            bot_id: COZE_BOT_ID,
            user_id: 'user_' + Date.now(),
            additional_messages: [
              {
                role: RoleType.User,
                content: prompt,
                content_type: 'text',
              },
            ],
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Coze API调用超时，请稍后重试')), 300000) // 5分钟超时
          )
        ]) as any

      console.log('📡 Chat完成:', {
        status: result.chat.status,
        conversation_id: result.chat.conversation_id
      })

      if (result.chat.status === ChatStatus.COMPLETED && result.messages) {
        console.log('📋 消息数量:', result.messages.length)

        // 找到AI的回复
        const aiMessage = result.messages.find(
          (msg: any) => msg.role === RoleType.Assistant && msg.type === 'answer'
        )

        if (aiMessage && aiMessage.content) {
          console.log('🎉 成功获取AI生成的报告!')
          console.log('📄 报告长度:', aiMessage.content.length)

          return NextResponse.json({
            success: true,
            report: aiMessage.content,
            conversationId: result.chat.conversation_id,
            userInfo: userInfo
          })
        } else {
          console.log('⚠️ 未找到AI回复消息')
          console.log('📋 所有消息:', result.messages.map((m: any) => ({
            role: m.role,
            type: m.type,
            content_preview: m.content?.substring(0, 50) + '...'
          })))
          throw new Error('未找到AI回复消息')
        }
      } else {
        console.log('❌ Chat未完成，状态:', result.chat.status)
        console.log('❌ 消息数量:', result.messages?.length || 0)
        throw new Error(`Chat未完成，状态: ${result.chat.status}`)
      }

      } catch (cozeError: any) {
        console.error(`❌ Coze API调用失败 (尝试 ${attempt}/${maxRetries}):`, cozeError.message)
        lastError = cozeError

        // 如果不是最后一次尝试，等待一下再重试
        if (attempt < maxRetries) {
          console.log(`⏳ 等待 ${attempt * 2} 秒后重试...`)
          await new Promise(resolve => setTimeout(resolve, attempt * 2000))
        }
      }
    }

    // 如果所有尝试都失败，返回详细错误信息
    console.log('💥 所有尝试都失败，返回错误')
    const errorMessage = lastError?.message || 'AI服务暂时不可用'

    return NextResponse.json({
      success: false,
      error: `生成失败：${errorMessage}。请稍后重试，或联系客服获取帮助。`,
      details: lastError?.message
    }, { status: 500 })

  } catch (error) {
    console.error('生成性格报告API错误:', error)
    return NextResponse.json({
      success: false,
      error: 'AI服务暂时不可用，请稍后重试'
    }, { status: 500 })
  }
}