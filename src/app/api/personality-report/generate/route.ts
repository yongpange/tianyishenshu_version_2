import { NextRequest, NextResponse } from 'next/server'
import { ChatStatus, RoleType } from '@coze/api'
import { supabaseAdmin } from '@/lib/supabase'
import { UserInfo } from '@/lib/coze-client'
import { createCozeClient, validateBotId, checkAuthConfig } from '@/lib/coze-auth'
import { 
  createPersonalityReport, 
  savePersonalityReport,
  validateUserInfo,
  calculateUserDataHash,
  formatUserInfoDisplay
} from '@/utils/personality-report'

// 请求接口
interface PersonalityReportRequest {
  userInfo: UserInfo
  userId: string
}

// 响应接口
interface PersonalityReportResponse {
  success: boolean
  reportId?: string
  content?: string
  error?: string
  authMethod?: string
}

// 环境变量配置（可能需要特定的Bot ID）
const PERSONALITY_BOT_ID = process.env.PERSONALITY_BOT_ID || process.env.BOT_ID || ''

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

    // 检查认证配置
    try {
      checkAuthConfig()
    } catch (configError) {
      console.error('❌ 认证配置检查失败:', configError)
      return NextResponse.json({
        success: false,
        error: configError instanceof Error ? configError.message : '认证配置缺失'
      }, { status: 500 })
    }

    // 验证Bot ID
    let botId: string
    try {
      botId = validateBotId(PERSONALITY_BOT_ID)
    } catch (botError) {
      console.error('❌ Bot ID验证失败:', botError)
      return NextResponse.json({
        success: false,
        error: botError instanceof Error ? botError.message : 'Bot ID配置缺失'
      }, { status: 500 })
    }

    // 生成性格报告prompt
    const prompt = formatPersonalityPrompt(userInfo)

    try {
      console.log('📡 调用 Coze API...')
      
      // 创建Coze客户端（支持JWT和PAT认证）
      const { client: coze, authMethod } = await createCozeClient()
      
      // 设置更长的超时时间，并添加重试机制
      const result = await Promise.race([
        coze.chat.createAndPoll({
          bot_id: botId,
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
        messages_count: result.messages?.length || 0,
        authMethod: authMethod
      })

      if (result.chat.status === ChatStatus.COMPLETED && result.messages) {
                  // 找到AI的回复
          const aiMessage = result.messages.find(
            (msg: any) => msg.role === RoleType.Assistant && msg.type === 'answer'
          )

          if (aiMessage && aiMessage.content) {
            const reportContent = aiMessage.content

            console.log('✅ 获取到AI生成的性格报告:', {
              length: reportContent.length,
              preview: reportContent.substring(0, 100) + '...'
            })

            try {
              // 保存到Supabase
              console.log('💾 保存性格报告到数据库...')
              const reportData = createPersonalityReport(
                userId,
                reportContent,
                userInfo,
                result.chat.conversation_id
              )
              await savePersonalityReport(reportData)

              console.log('✅ 性格报告保存成功:', { reportId: reportData.id })

              return NextResponse.json({
                success: true,
                reportId: reportData.id,
                content: reportContent,
                authMethod: authMethod
              })

            } catch (saveError) {
              console.error('❌ 保存性格报告失败:', saveError)
              
              // 即使保存失败，也返回生成的内容
              return NextResponse.json({
                success: true,
                content: reportContent,
                error: '报告生成成功，但保存失败',
                authMethod: authMethod
              })
            }

        } else {
          console.error('❌ AI响应中没有找到有效内容')
          throw new Error('AI生成的报告内容为空')
        }

      } else {
        console.error('❌ Coze API调用失败:', {
          status: result.chat.status,
          result: result
        })
        throw new Error(`智能体响应失败: ${result.chat.status}`)
      }

    } catch (cozeError) {
      console.error('❌ Coze API调用异常:', cozeError)
      
             // 生成fallback内容
       const fallbackContent = `# 性格分析报告

基于您的出生信息：${formatUserInfoDisplay(userInfo)}

## 基础分析

由于AI服务暂时不可用，这里提供基础的性格分析框架。您可以稍后重新生成完整的报告。

## 出生信息
- 出生年份：${userInfo.year}年
- 出生月日：${userInfo.month}月${userInfo.day}日  
- 出生时辰：${userInfo.hour}时${userInfo.minute}分
- 出生地区：${userInfo.area.province} ${userInfo.area.city} ${userInfo.area.district}
- 性别：${userInfo.gender === 'male' || userInfo.gender === '男' ? '男' : '女'}

请稍后重试以获取完整的AI分析报告。`

       try {
         // 尝试保存fallback内容
         const reportData = createPersonalityReport(
           userId,
           fallbackContent,
           userInfo
         )
         await savePersonalityReport(reportData)

         return NextResponse.json({
           success: true,
           reportId: reportData.id,
           content: fallbackContent,
           error: 'AI服务暂时不可用，使用了备用分析',
           authMethod: 'fallback'
         })

      } catch (fallbackError) {
        console.error('❌ Fallback保存也失败:', fallbackError)
        
        return NextResponse.json({
          success: false,
          error: 'AI服务暂时不可用，请稍后重试',
          details: cozeError instanceof Error ? cozeError.message : String(cozeError)
        }, { status: 500 })
      }
    }

  } catch (error) {
    console.error('❌ 性格报告生成失败:', error)
    return NextResponse.json({
      success: false,
      error: '报告生成失败，请稍后重试',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
