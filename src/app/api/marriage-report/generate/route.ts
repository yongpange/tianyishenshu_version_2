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
  createMarriageReport, 
  saveMarriageReport,
  getAstrologyContext
} from '@/utils/marriage-report'

// 请求接口
interface MarriageReportRequest {
  userInfo: UserInfo
  userId: string
  isUserProfileId?: boolean
}

// 响应接口
interface MarriageReportResponse {
  success: boolean
  reportId?: string
  content?: string
  error?: string
  authMethod?: string
}

// 环境变量配置（使用婚恋感情专用的Bot ID）
const MARRIAGE_BOT_ID = process.env.MARRIAGE_BOT_ID || process.env.BOT_ID || ''

// 格式化用户信息为婚恋感情报告prompt
function formatMarriagePrompt(userInfo: UserInfo, astrologyContext?: string): string {
  const { year, month, day, hour, minute, gender, area } = userInfo
  const location = `${area.province}${area.city}${area.district}`
  const birthInfo = `${year}年${month}月${day}日${hour}时${minute}分，${location}`

  let prompt = `请根据出生信息：${birthInfo}，性别：${gender === 'male' || gender === '男' ? '男' : '女'}，生成详细的婚恋感情分析报告。

`

  // 如果有八字排盘信息，加入上下文
  if (astrologyContext) {
    prompt += `**八字排盘分析数据：**

${astrologyContext}

请基于以上八字排盘信息，深入分析用户的感情运势、婚姻状况、恋爱特质等方面，生成专业的婚恋感情报告。`
  } else {
    prompt += `请基于用户的出生时间和地点信息，分析其感情运势、婚姻状况、恋爱特质等方面，生成专业的婚恋感情报告。`
  }

  return prompt
}

export async function POST(request: NextRequest): Promise<NextResponse<MarriageReportResponse>> {
  try {
    const body: MarriageReportRequest = await request.json()
    const { userInfo, userId, isUserProfileId } = body

    console.log('🚀 开始生成婚恋感情报告:', { userId, userInfo, isUserProfileId })

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
      botId = validateBotId(MARRIAGE_BOT_ID)
    } catch (botError) {
      console.error('❌ Bot ID验证失败:', botError)
      return NextResponse.json({
        success: false,
        error: botError instanceof Error ? botError.message : 'Bot ID配置缺失'
      }, { status: 500 })
    }

    // 获取八字排盘上下文信息
    console.log('🔮 获取八字排盘数据...')
    const astrologyContext = await getAstrologyContext(userInfo)
    console.log('✅ 八字排盘数据获取完成')

    // 生成婚恋感情报告prompt
    const prompt = formatMarriagePrompt(userInfo, astrologyContext)

    console.log('📝 发送给Coze的prompt:', prompt.substring(0, 200) + '...')

    // 创建Coze客户端
    const { client: coze, authMethod } = await createCozeClient()

    // 尝试调用 Coze 智能体（带重试机制）
    let lastError: Error | null = null
    const maxRetries = 2

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🚀 开始调用Coze智能体 (尝试 ${attempt}/${maxRetries})`)

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
            console.log('🎉 成功获取AI生成的婚恋感情报告!')
            console.log('📄 报告长度:', aiMessage.content.length)

            const reportContent = aiMessage.content

            // 确定用户资料ID
            let userProfileId: string

            if (isUserProfileId === true) {
              userProfileId = userId
              console.log('✅ 直接使用传入的user_profiles.id:', userProfileId)
            } else {
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
                .is('parent_id', null)
                .single()

              if (profileError || !userProfile) {
                console.error('❌ 主账户用户资料不存在:', user.id)
                throw new Error('主账户用户资料不存在')
              }

              userProfileId = userProfile.id
            }

            console.log('✅ 确定用户资料ID:', userProfileId)

            // 保存到Supabase
            console.log('💾 保存婚恋感情报告到数据库...')
            const reportData = createMarriageReport(
              userId,
              reportContent,
              userInfo,
              result.chat.conversation_id
            )
            await saveMarriageReport(reportData, userProfileId)

            console.log('✅ 婚恋感情报告保存成功:', { 
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
    throw lastError || new Error('生成婚恋感情报告失败')

  } catch (error) {
    console.error('❌ 生成婚恋感情报告失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '生成报告失败，请稍后重试'
    }, { status: 500 })
  }
}
