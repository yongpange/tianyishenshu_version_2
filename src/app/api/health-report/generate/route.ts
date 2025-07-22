import { NextRequest, NextResponse } from 'next/server'
import { ChatStatus, RoleType } from '@coze/api'
import { supabaseAdmin } from '@/lib/supabase'
import { UserInfo } from '@/lib/coze-client'
import { callCozeAPIWithRetry, validateBotId, checkAuthConfig } from '@/lib/coze-auth'
import {
  validateUserInfo,
  calculateUserDataHash,
  formatUserInfoDisplay
} from '@/utils/client-utils'
import { 
  createHealthReport, 
  saveHealthReport,
  getAstrologyContext
} from '@/utils/health-report'

// 请求接口
interface HealthReportRequest {
  userInfo: UserInfo
  userId: string
  isUserProfileId?: boolean
}

// 响应接口
interface HealthReportResponse {
  success: boolean
  reportId?: string
  content?: string
  error?: string
}

// 环境变量配置（使用身体健康专用的Bot ID）
const HEALTH_BOT_ID = process.env.HEALTH_BOT_ID || process.env.BOT_ID || ''

// 格式化用户信息为身体健康报告prompt
function formatHealthPrompt(userInfo: UserInfo, astrologyContext?: string): string {
  const { year, month, day, hour, minute, gender, area } = userInfo
  const location = `${area.province}${area.city}${area.district}`
  const birthInfo = `${year}年${month}月${day}日${hour}时${minute}分，${location}`

  let prompt = `请根据出生信息：${birthInfo}，性别：${gender === 'male' || gender === '男' ? '男' : '女'}，生成详细的身体健康分析报告。

`

  // 如果有八字排盘信息，加入上下文
  if (astrologyContext) {
    prompt += `**八字排盘分析数据：**

${astrologyContext}

请基于以上八字排盘信息，深入分析用户的体质特点、健康倾向、养生建议等方面，生成专业的身体健康报告。`
  } else {
    prompt += `请基于用户的出生时间和地点信息，分析其体质特点、健康倾向、养生建议等方面，生成专业的身体健康报告。`
  }

  return prompt
}

export async function POST(request: NextRequest): Promise<NextResponse<HealthReportResponse>> {
  try {
    const body: HealthReportRequest = await request.json()
    const { userInfo, userId, isUserProfileId } = body

    console.log('🚀 开始生成身体健康报告:', { userId, userInfo, isUserProfileId })

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
    const botId = validateBotId(HEALTH_BOT_ID)
    if (!botId) {
      return NextResponse.json({
        success: false,
        error: '身体健康BOT_ID未配置'
      }, { status: 500 })
    }

    console.log('✅ 配置验证通过, 使用Bot ID:', botId)

    // 获取八字排盘上下文
    let baziUserId: string | undefined
    let isUserProfileId_final = isUserProfileId

    if (isUserProfileId === true) {
      baziUserId = userId
      console.log('✅ 使用传入的user_profiles.id:', baziUserId)
    } else {
      console.log('🔍 根据手机号查找user_profiles.id:', userId)
      
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('phone_number', userId)
        .single()

      if (userError || !user) {
        console.warn('⚠️ 根据手机号未找到用户，将跳过八字排盘')
      } else {
        const { data: userProfile, error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (profileError || !userProfile) {
          console.warn('⚠️ 未找到用户资料，将跳过八字排盘')
        } else {
          baziUserId = userProfile.id
          isUserProfileId_final = true
          console.log('✅ 找到用户资料ID:', baziUserId)
        }
      }
    }

    const astrologyContext = await getAstrologyContext(userInfo, baziUserId)
    console.log('✅ 八字排盘数据获取完成')

    // 生成身体健康报告prompt
    const prompt = formatHealthPrompt(userInfo, astrologyContext)
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
        console.log('🎉 成功获取AI生成的身体健康报告!')
        console.log('📄 报告长度:', aiMessage.content.length)

        const reportContent = aiMessage.content

        // 确定用户资料ID用于保存
        let userProfileId: string

        if (isUserProfileId_final === true) {
          userProfileId = baziUserId || userId
          console.log('✅ 使用user_profiles.id保存:', userProfileId)
        } else {
          console.log('🔍 根据手机号查找user_profiles.id用于保存:', userId)
          
          const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('phone_number', userId)
            .single()

          if (userError || !user) {
            throw new Error('找不到用户记录，无法保存报告')
          }

          const { data: userProfile, error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .select('id')
            .eq('user_id', user.id)
            .single()

          if (profileError || !userProfile) {
            throw new Error('找不到用户资料，无法保存报告')
          }

          userProfileId = userProfile.id
          console.log('✅ 确定用户资料ID:', userProfileId)
        }

        // 保存到Supabase
        console.log('💾 保存身体健康报告到数据库...')
        const reportData = createHealthReport(
          userProfileId,
          reportContent,
          userInfo,
          result.chat.conversation_id
        )
        await saveHealthReport(reportData, userProfileId)

        console.log('✅ 身体健康报告保存成功:', { 
          reportId: reportData.id, 
          userProfileId: userProfileId 
        })

        return NextResponse.json({
          success: true,
          reportId: reportData.id,
          content: reportContent
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
    console.error('❌ 生成身体健康报告失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '生成报告失败，请稍后重试'
    }, { status: 500 })
  }
}
