import { NextRequest, NextResponse } from 'next/server'
import { ChatStatus, RoleType } from '@coze/api'
import { supabaseAdmin } from '@/lib/supabase'
import { UserInfo } from '@/lib/coze-client'
import { createCozeClient, validateBotId, checkAuthConfig } from '@/lib/coze-auth'
import {
  validateUserInfo,
  calculateUserDataHash,
  formatUserInfoDisplay
} from '@/utils/client-utils'
import {
  createWealthReport,
  saveWealthReport,
  getAstrologyContext
} from '@/utils/wealth-report'

// 请求接口
interface WealthReportRequest {
  userInfo: UserInfo
  userId: string
  isUserProfileId?: boolean // 新增：标识userId是否为user_profiles.id
}

// 响应接口
interface WealthReportResponse {
  success: boolean
  reportId?: string
  content?: string
  error?: string
  authMethod?: string
}

// 环境变量配置（使用事业财富专用的Bot ID）
const WEALTH_BOT_ID = process.env.WEALTH_BOT_ID || process.env.BOT_ID || ''

// 格式化用户信息为事业财富报告prompt
function formatWealthPrompt(userInfo: UserInfo, astrologyContext?: string): string {
  const { year, month, day, hour, minute, gender, area } = userInfo
  const location = `${area.province}${area.city}${area.district}`
  const birthInfo = `${year}年${month}月${day}日${hour}时${minute}分，${location}`

  let prompt = `请根据出生信息：${birthInfo}，性别：${gender === 'male' || gender === '男' ? '男' : '女'}，生成详细的事业财富分析报告。

`

  // 如果有八字排盘信息，加入上下文
  if (astrologyContext) {
    prompt += `**八字排盘分析数据：**

${astrologyContext}

请基于以上八字排盘信息，深入分析用户的事业发展潜力、财富积累能力、职业适性等方面，生成专业的事业财富报告。`
  } else {
    prompt += `请基于用户的出生时间和地点信息，分析其事业发展潜力、财富积累能力、职业适性等方面，生成专业的事业财富报告。`
  }

  return prompt
}

export async function POST(request: NextRequest): Promise<NextResponse<WealthReportResponse>> {
  try {
    const body: WealthReportRequest = await request.json()
    const { userInfo, userId, isUserProfileId } = body

    console.log('🚀 开始生成事业财富报告:', { userId, userInfo, isUserProfileId })
    console.log('🔍 详细参数检查:', {
      userId: userId,
      userIdType: typeof userId,
      userIdLength: userId ? userId.length : 0,
      isUserProfileId: isUserProfileId,
      isUserProfileIdType: typeof isUserProfileId,
      isUserProfileIdDefined: isUserProfileId !== undefined,
      isUserProfileIdBooleanTrue: isUserProfileId === true,
      requestBodyKeys: Object.keys(body),
      requestBodyString: JSON.stringify(body).substring(0, 200) + '...'
    })

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

    // 验证认证配置
    try {
      await checkAuthConfig()
    } catch (authError) {
      console.error('❌ 认证配置检查失败:', authError)
      return NextResponse.json({
        success: false,
        error: authError instanceof Error ? authError.message : 'Coze认证配置缺失'
      }, { status: 500 })
    }

    // 验证Bot ID
    let botId: string
    try {
      botId = validateBotId(WEALTH_BOT_ID)
    } catch (botError) {
      console.error('❌ Bot ID验证失败:', botError)
      return NextResponse.json({
        success: false,
        error: botError instanceof Error ? botError.message : 'Bot ID配置缺失'
      }, { status: 500 })
    }

    // 获取八字排盘上下文信息 - 数据库优先
    console.log('🔮 获取八字排盘数据...')
    // 确定用户ID for 八字获取
    let baziUserId: string

    if (isUserProfileId) {
      // 使用user_profiles.id
      baziUserId = userId
    } else {
      // 通过手机号查找user_profiles.id
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('phone_number', userId)
        .single()

      if (userError || !user) {
        throw new Error('找不到用户信息')
      }

      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .is('parent_id', null)
        .single()

      if (profileError || !userProfile) {
        throw new Error('找不到用户资料')
      }

      baziUserId = userProfile.id
    }

    const astrologyContext = await getAstrologyContext(userInfo, baziUserId)
    console.log('✅ 八字排盘数据获取完成')

    // 生成事业财富报告prompt
    const prompt = formatWealthPrompt(userInfo, astrologyContext)

    console.log('📝 发送给Coze的prompt:', prompt.substring(0, 200) + '...')

    // 创建Coze客户端（支持JWT和PAT认证）
    const { client: coze, authMethod } = await createCozeClient()

    // 尝试调用 Coze 智能体（带重试机制）
    let lastError: Error | null = null
    const maxRetries = 2

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🚀 开始调用Coze智能体 (尝试 ${attempt}/${maxRetries})`)

        // 设置更长的超时时间
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
            console.log('🎉 成功获取AI生成的事业财富报告!')
            console.log('📄 报告长度:', aiMessage.content.length)

            const reportContent = aiMessage.content

            // 确定用户资料ID
            let userProfileId: string

            if (isUserProfileId === true) {
              // 直接使用传入的userId作为user_profiles.id
              userProfileId = userId
              console.log('✅ 直接使用传入的user_profiles.id:', userProfileId)
            } else {
              // 根据手机号查找user_profiles.id
              console.log('🔍 根据手机号查找user_profiles.id:', userId)
              
              const { data: user, error: userError } = await supabaseAdmin
                .from('users')
                .select('id')
                .eq('phone', userId)
                .single()

              if (userError || !user) {
                console.error('❌ 用户不存在:', userId)
                throw new Error('用户不存在')
              }

              const { data: userProfile, error: profileError } = await supabaseAdmin
                .from('user_profiles')
                .select('id')
                .eq('user_id', user.id)
                .is('parent_id', null) // 只查找主用户资料
                .single()

              if (profileError || !userProfile) {
                console.error('❌ 主账户用户资料不存在:', user.id)
                throw new Error('主账户用户资料不存在')
              }

              userProfileId = userProfile.id
            }

            console.log('✅ 确定用户资料ID:', userProfileId)

            // 保存到Supabase
            console.log('💾 保存事业财富报告到数据库...')
            const reportData = createWealthReport(
              userId,
              reportContent,
              userInfo,
              result.chat.conversation_id
            )
            await saveWealthReport(reportData, userProfileId)

            console.log('✅ 事业财富报告保存成功:', { 
              reportId: reportData.id, 
              userProfileId: userProfileId,
              isUserProfileId: isUserProfileId 
            })

            return NextResponse.json({
              success: true,
              reportId: reportData.id,
              content: reportContent,
              authMethod: authMethod
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
        } else if (result.chat.status === ChatStatus.FAILED) {
          throw new Error(`Coze对话失败: ${result.chat.last_error?.msg || '未知错误'}`)
        } else {
          throw new Error(`Coze对话状态异常: ${result.chat.status}`)
        }

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        console.error(`❌ 第${attempt}次尝试失败:`, lastError.message)
        
        if (attempt < maxRetries) {
          console.log(`⏳ 等待${attempt * 2}秒后重试...`)
          await new Promise(resolve => setTimeout(resolve, attempt * 2000))
        }
      }
    }

    // 所有重试都失败了
    throw lastError || new Error('生成事业财富报告失败')

  } catch (error) {
    console.error('❌ 生成事业财富报告失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '生成报告失败，请稍后重试'
    }, { status: 500 })
  }
}
