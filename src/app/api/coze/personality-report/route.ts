import { NextRequest, NextResponse } from 'next/server'
import { CozeAPI, COZE_CN_BASE_URL, ChatStatus, RoleType } from '@coze/api'
import {
  createPersonalityReport,
  savePersonalityReport,
  validateUserInfo
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
function formatPersonalityPrompt(userInfo: UserInfo): string {
  const { year, month, day, hour, minute, gender, area } = userInfo
  const location = `${area.province}${area.city}${area.district}`
  const birthInfo = `${year}年${month}月${day}日${hour}时${minute}分，${location}`

  return `
请根据以下出生信息生成详细的性格分析报告：

出生信息：${birthInfo}
性别：${gender === 'male' ? '男' : '女'}

请按照以下结构返回详细的性格分析：

1. 基本性格特征
2. 情感表达方式
3. 处事风格
4. 人际关系
5. 优势与潜力

每个部分请提供深入的分析，字数控制在100-200字之间。请确保分析内容专业、准确且具有指导意义。
`
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

    // 生成性格报告prompt
    const prompt = formatPersonalityPrompt(userInfo)

    // 尝试调用 Coze 智能体
    try {
      console.log('🚀 开始调用Coze智能体')
      console.log('📝 Prompt:', prompt.substring(0, 200) + '...')

      const result = await coze.chat.createAndPoll({
        bot_id: COZE_BOT_ID,
        user_id: 'user_' + Date.now(),
        additional_messages: [
          {
            role: RoleType.User,
            content: prompt,
            content_type: 'text',
          },
        ],
      })

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
        }
      } else {
        console.log('❌ Chat未完成，状态:', result.chat.status)
        console.log('❌ 消息数量:', result.messages?.length || 0)
      }

    } catch (cozeError: any) {
      console.error('❌ Coze API调用失败:', cozeError.message)
      console.error('❌ 错误详情:', cozeError)
    }

    // 如果所有尝试都失败，返回错误而不是fallback
    console.log('💥 所有尝试都失败，返回错误')
    return NextResponse.json({
      success: false,
      error: 'AI服务暂时不可用，请稍后重试'
    }, { status: 500 })

  } catch (error) {
    console.error('生成性格报告API错误:', error)
    return NextResponse.json({
      success: false,
      error: 'AI服务暂时不可用，请稍后重试'
    }, { status: 500 })
  }
}