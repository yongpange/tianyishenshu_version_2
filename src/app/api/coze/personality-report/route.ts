import { NextRequest, NextResponse } from 'next/server'
import { ChatStatus, RoleType } from '@coze/api'
import { callCozeAPIWithRetry, validateBotId, checkAuthConfig } from '@/lib/coze-auth'
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
const COZE_BOT_ID = process.env.BOT_ID || ''

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

请基于以上八字排盘信息，深入分析用户的性格特点、行为模式、潜在能力等方面，生成专业的性格分析报告。`
  } else {
    prompt += `请基于用户的出生时间和地点信息，分析其性格特点、行为模式、潜在能力等方面，生成专业的性格分析报告。`
  }

  return prompt
}

export async function POST(request: NextRequest): Promise<NextResponse<PersonalityReportResponse>> {
  try {
    const body: PersonalityReportRequest = await request.json()
    const { userInfo, userId } = body

    console.log('🚀 开始生成性格报告:', { userId, userInfo })

    // 验证必要参数
    if (!userInfo || !userId) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数'
      }, { status: 400 })
    }

    // 验证用户信息格式
    try {
      validateUserInfo(userInfo)
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : '用户信息格式无效'
      }, { status: 400 })
    }

    // 验证认证配置
    try {
      checkAuthConfig()
    } catch (error) {
      console.error('❌ 认证配置检查失败:', error)
      return NextResponse.json({
        success: false,
        error: 'API认证配置错误'
      }, { status: 500 })
    }

    // 验证Bot ID
    const botId = validateBotId(COZE_BOT_ID)
    if (!botId) {
      return NextResponse.json({
        success: false,
        error: 'BOT_ID未配置'
      }, { status: 500 })
    }

    console.log('✅ 配置验证通过, 使用Bot ID:', botId)

    // 获取八字排盘上下文
    let astrologyContext = ''
    try {
      astrologyContext = await getAstrologyContext(userInfo)
      console.log('✅ 八字排盘数据获取完成')
    } catch (error) {
      console.warn('⚠️ 获取八字排盘数据失败，将使用基础用户信息:', error)
    }

    // 生成性格报告prompt
    const prompt = formatPersonalityPrompt(userInfo, astrologyContext)
    console.log('📝 发送给Coze的prompt:', prompt.substring(0, 200) + '...')

    // 使用带重试的Coze API调用，优先使用用户token
    const result = await Promise.race([
      callCozeAPIWithRetry(
        async (coze: any) => {
          return await coze.chat.createAndPoll({
            bot_id: botId,
            user_id: userId || `user_${Date.now()}`,
            additional_messages: [
              {
                role: RoleType.User,
                content: prompt,
                content_type: 'text',
              },
            ],
          })
        },
        userInfo
      ),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Coze API调用超时，请稍后重试')), 300000)
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
        console.log('🎉 成功获取AI生成的性格报告!')
        console.log('📄 报告长度:', aiMessage.content.length)

        return NextResponse.json({
          success: true,
          report: aiMessage.content,
          conversationId: result.chat.conversation_id
        })

      } else {
        console.error('❌ AI响应中没有找到有效内容')
        throw new Error('AI生成的报告内容为空')
      }
    } else {
      console.error('❌ Chat状态异常:', result.chat.status)
      throw new Error(`Coze对话状态异常: ${result.chat.status}`)
    }

  } catch (error) {
    console.error('❌ 生成性格报告失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '生成报告失败，请稍后重试'
    }, { status: 500 })
  }
}