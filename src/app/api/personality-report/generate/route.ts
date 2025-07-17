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
  createPersonalityReport, 
  savePersonalityReport,
  getAstrologyContext
} from '@/utils/personality-report'

// 请求接口
interface PersonalityReportRequest {
  userInfo: UserInfo
  userId: string
  isUserProfileId?: boolean // 新增：标识userId是否为user_profiles.id
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
    const { userInfo, userId, isUserProfileId } = body

    console.log('🚀 开始生成性格报告:', { userId, userInfo, isUserProfileId })
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

    // 获取八字排盘上下文信息 - 数据库优先
    console.log('🔮 获取八字排盘数据...')
    // 确定用户ID for 八字获取
    let baziUserId: string
    let isBaziUserProfileId = false

    if (isUserProfileId) {
      // 使用user_profiles.id
      baziUserId = userId
      isBaziUserProfileId = true
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
      isBaziUserProfileId = true
    }

    const astrologyContext = await getAstrologyContext(userInfo, baziUserId)
    console.log('✅ 八字排盘数据获取完成')

    // 生成性格报告prompt
    const prompt = formatPersonalityPrompt(userInfo, astrologyContext)

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
            // 获取用户资料ID - 支持子账户
            let userProfileId: string

            if (isUserProfileId) {
              // 直接使用提供的user_profiles.id
              userProfileId = userId
              console.log('📋 子账户模式：直接使用user_profiles.id:', userProfileId)
              
              // 验证user_profiles.id是否存在
              const { data: profile, error: profileError } = await supabaseAdmin
                .from('user_profiles')
                .select('id')
                .eq('id', userProfileId)
                .single()

              if (profileError || !profile) {
                console.error('❌ 子账户用户资料不存在:', userProfileId)
                throw new Error('子账户用户资料不存在')
              }
            } else {
              // 原有逻辑：通过手机号查找主用户资料
              console.log('📋 主账户模式：通过手机号查找用户资料')
              
              const { data: user, error: userError } = await supabaseAdmin
                .from('users')
                .select('id')
                .eq('phone_number', userId)
                .single()

              if (userError || !user) {
                console.error('❌ 主账户用户不存在:', userId)
                throw new Error('主账户用户不存在')
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

            // 保存到Supabase（包含八字上下文）
            console.log('💾 保存性格报告到数据库...')
            const reportData = createPersonalityReport(
              userId,
              reportContent,
              userInfo,
              result.chat.conversation_id
            )
            await savePersonalityReportWithAstrology(reportData, userProfileId, astrologyContext)

            console.log('✅ 性格报告保存成功:', { 
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
        // 获取用户资料ID（用于fallback保存）- 支持子账户
        let userProfileId: string

        if (isUserProfileId) {
          // 直接使用提供的user_profiles.id
          userProfileId = userId
          console.log('📋 Fallback子账户模式：直接使用user_profiles.id:', userProfileId)
          
          // 验证user_profiles.id是否存在
          const { data: profile, error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .select('id')
            .eq('id', userProfileId)
            .single()

          if (profileError || !profile) {
            console.error('❌ Fallback子账户用户资料不存在:', userProfileId)
            throw new Error('Fallback子账户用户资料不存在')
          }
        } else {
          // 原有逻辑：通过手机号查找主用户资料
          console.log('📋 Fallback主账户模式：通过手机号查找用户资料')
          
          const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('phone_number', userId)
            .single()

          if (userError || !user) {
            console.error('❌ Fallback主账户用户不存在:', userId)
            throw new Error('Fallback主账户用户不存在')
          }

          const { data: userProfile, error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .select('id')
            .eq('user_id', user.id)
            .is('parent_id', null) // 只查找主用户资料
            .single()

          if (profileError || !userProfile) {
            console.error('❌ Fallback主账户用户资料不存在:', user.id)
            throw new Error('Fallback主账户用户资料不存在')
          }

          userProfileId = userProfile.id
        }

        console.log('✅ Fallback确定用户资料ID:', userProfileId)

        // 尝试保存fallback内容
        const reportData = createPersonalityReport(
          userId,
          fallbackContent,
          userInfo
        )
        await savePersonalityReport(reportData, userProfileId)

        console.log('✅ Fallback报告保存成功:', { 
          reportId: reportData.id, 
          userProfileId: userProfileId,
          isUserProfileId: isUserProfileId 
        })

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
