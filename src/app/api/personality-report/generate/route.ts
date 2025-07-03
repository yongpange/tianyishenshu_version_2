import { NextRequest, NextResponse } from 'next/server'
import { CozeAPI, COZE_CN_BASE_URL, ChatStatus, RoleType } from '@coze/api'
import { supabaseAdmin } from '@/lib/supabase'
import { UserInfo } from '@/lib/coze-client'
import { 
  createPersonalityReport, 
  savePersonalityReport,
  validateUserInfo,
  calculateUserDataHash
} from '@/utils/personality-report'

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
  baseURL: COZE_CN_BASE_URL,
})

// 格式化用户信息为性格报告prompt
function formatPersonalityPrompt(userInfo: UserInfo): string {
  const { year, month, day, hour, minute, gender, area } = userInfo
  const location = `${area.province}${area.city}${area.district}`
  const birthInfo = `${year}年${month}月${day}日${hour}时${minute}分，${location}`

  return `请根据出生信息：${birthInfo}，性别：${gender === 'male' || gender === '男' ? '男' : '女'}，生成详细的性格分析报告。

请自由发挥，生成丰富全面的性格分析内容，可以包含但不限于：八字排盘、五行分析、性格特征、情感表达、处事风格、人际关系、优势潜力、发展建议等方面。

请使用markdown格式，合理组织内容结构，让报告既专业又易读。`
}

export async function POST(request: NextRequest): Promise<NextResponse<PersonalityReportResponse>> {
  try {
    const body: PersonalityReportRequest = await request.json()
    const { userInfo, userId } = body

    console.log('🚀 开始生成性格报告:', { userId, userInfo })

    // 验证请求参数
    if (!userId || !userInfo) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数'
      }, { status: 400 })
    }

    // 验证用户信息完整性
    if (!validateUserInfo(userInfo)) {
      console.error('❌ 用户信息验证失败:', userInfo)
      return NextResponse.json({
        success: false,
        error: '用户信息不完整，请检查所有必填字段'
      }, { status: 400 })
    }

    // 验证环境变量
    if (!COZE_API_TOKEN || !COZE_BOT_ID) {
      console.error('❌ 环境变量检查失败:', {
        COZE_API_TOKEN: COZE_API_TOKEN ? '已设置' : '未设置',
        COZE_BOT_ID: COZE_BOT_ID ? '已设置' : '未设置'
      })
      return NextResponse.json({
        success: false,
        error: 'Coze API配置缺失，请检查环境变量'
      }, { status: 500 })
    }

    // 生成性格报告prompt
    const prompt = formatPersonalityPrompt(userInfo)

    try {
      console.log('📡 调用 Coze API...')
      
      // 设置更长的超时时间，并添加重试机制
      const result = await Promise.race([
        coze.chat.createAndPoll({
          bot_id: COZE_BOT_ID,
          user_id: `user_${userId}_${Date.now()}`,
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

      console.log('📋 Coze API 响应:', {
        status: result.chat.status,
        conversation_id: result.chat.conversation_id,
        messages_count: result.messages?.length || 0
      })

      if (result.chat.status === ChatStatus.COMPLETED && result.messages) {
        // 找到AI的回复
        const aiMessage = result.messages.find(
          (msg: any) => msg.role === RoleType.Assistant && msg.type === 'answer'
        )

        if (aiMessage && aiMessage.content) {
          console.log('✅ 成功获取AI生成的报告，长度:', aiMessage.content.length)

          // 创建性格报告对象
          const report = createPersonalityReport(
            userId,
            aiMessage.content,
            userInfo,
            result.chat.conversation_id
          )

          // 保存到 Supabase
          try {
            await savePersonalityReport(report)
            console.log('✅ 报告已保存到 Supabase')
          } catch (saveError) {
            console.error('⚠️ 保存报告失败，但生成成功:', saveError)
            // 即使保存失败，也返回生成的报告
          }

          return NextResponse.json({
            success: true,
            report: aiMessage.content,
            conversationId: result.chat.conversation_id
          })
        } else {
          console.error('❌ 未找到AI回复消息')
        }
      } else {
        console.error('❌ Coze API 调用未完成:', result.chat.status)
      }

    } catch (cozeError: any) {
      console.error('❌ Coze API调用失败:', cozeError)
    }

    // 如果 Coze API 失败，返回错误
    return NextResponse.json({
      success: false,
      error: 'AI服务暂时不可用，请稍后重试'
    }, { status: 500 })

  } catch (error) {
    console.error('❌ 生成性格报告API错误:', error)
    return NextResponse.json({
      success: false,
      error: 'AI服务暂时不可用，请稍后重试'
    }, { status: 500 })
  }
}
