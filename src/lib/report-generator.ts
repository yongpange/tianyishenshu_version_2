import { NextResponse } from 'next/server'
import { ChatStatus, RoleType } from '@coze/api'
import { supabaseAdmin } from '@/lib/supabase'
import { UserInfo } from '@/lib/coze-client'
import { createReportCozeClient } from '@/lib/coze-auth'
import { validateUserInfo } from '@/utils/client-utils'
import { getAstrologyContext } from '@/utils/personality-report'

export interface UniversalReportRequest {
  userInfo: UserInfo
  userId: string
  isUserProfileId?: boolean
}

export interface UniversalReportResponse {
  success: boolean
  reportId?: string
  content?: string
  error?: string
  details?: string
  authMethod?: string
}

export interface ReportConfig {
  reportType: string
  reportName: string
  botId: string
  tableName: string
  formatPrompt: (userInfo: UserInfo, astrologyContext?: string) => string
  createReport: (userId: string, content: string, userInfo: UserInfo, conversationId?: string) => any
  saveReport: (reportData: any, userProfileId: string) => Promise<void>
  includeAstrology?: boolean
  fallbackContent?: (userInfo: UserInfo) => string
}

/**
 * 统一的报告生成引擎 - 优先JWT OAuth认证，PAT Token作为降级方案
 */
export async function generateReport(
  request: UniversalReportRequest,
  config: ReportConfig
): Promise<NextResponse<UniversalReportResponse>> {
  try {
    console.log(`🚀 开始生成${config.reportName}`, { 
      userId: request.userId, 
      isUserProfileId: request.isUserProfileId,
      reportType: config.reportType
    })

    // 验证请求参数
    if (!request.userId || !request.userInfo) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数'
      }, { status: 400 })
    }

    // 验证用户信息完整性
    if (!validateUserInfo(request.userInfo)) {
      console.error('❌ 用户信息验证失败:', request.userInfo)
      return NextResponse.json({
        success: false,
        error: '用户信息不完整，请检查所有必填字段'
      }, { status: 400 })
    }

    // 确定用户资料ID
    let userProfileId: string

    if (request.isUserProfileId === true) {
      userProfileId = request.userId
      console.log('✅ 直接使用传入的user_profiles.id:', userProfileId)
    } else {
      console.log('🔍 根据手机号查找user_profiles.id:', request.userId)
      
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('phone', request.userId)
        .single()

      if (userError || !user) {
        console.error('❌ 用户不存在:', request.userId)
        return NextResponse.json({
          success: false,
          error: '用户不存在'
        }, { status: 404 })
      }

      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .is('parent_id', null)
        .single()

      if (profileError || !userProfile) {
        console.error('❌ 主账户用户资料不存在:', user.id)
        return NextResponse.json({
          success: false,
          error: '主账户用户资料不存在'
        }, { status: 404 })
      }

      userProfileId = userProfile.id
    }

    console.log('✅ 确定用户资料ID:', userProfileId)

    // 获取八字排盘上下文信息（如果需要）
    let astrologyContext = ''
    if (config.includeAstrology) {
      try {
        console.log('🔮 获取八字排盘数据...')
        astrologyContext = await getAstrologyContext(request.userInfo, userProfileId, true)
        console.log('✅ 八字排盘数据获取完成:', astrologyContext.length, '字符')
      } catch (astrologyError) {
        console.warn('⚠️ 八字排盘数据获取异常，继续使用基本信息:', astrologyError)
        astrologyContext = ''
      }
    }

    // 生成报告prompt
    const prompt = config.formatPrompt(request.userInfo, astrologyContext)
    console.log('📝 发送给Coze的prompt:', prompt.substring(0, 200) + '...')

    // 创建Coze客户端 - 使用专门的报告认证函数（优先JWT，降级PAT）
    const { client: coze, authMethod } = await createReportCozeClient()
    console.log('🔐 使用认证方式:', authMethod)

    // 尝试调用 Coze 智能体（带重试机制）
    let lastError: Error | null = null
    const maxRetries = 2

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🚀 开始调用Coze智能体 (尝试 ${attempt}/${maxRetries})`)

        const result = await Promise.race([
          coze.chat.createAndPoll({
            bot_id: config.botId,
            user_id: userProfileId,
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
            console.log(`🎉 成功获取AI生成的${config.reportName}!`)
            console.log('📄 报告长度:', aiMessage.content.length)

            const reportContent = aiMessage.content

            // 保存到Supabase
            console.log(`💾 保存${config.reportName}到数据库...`)
            const reportData = config.createReport(
              request.userId,
              reportContent,
              request.userInfo,
              result.chat.conversation_id
            )
            await config.saveReport(reportData, userProfileId)

            console.log(`✅ ${config.reportName}保存成功:`, { 
              reportId: reportData.id, 
              userProfileId: userProfileId,
              isUserProfileId: request.isUserProfileId,
              authMethod: authMethod
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

    // 所有重试都失败了，尝试生成fallback内容
    if (config.fallbackContent) {
      try {
        console.log('🔄 API调用失败，尝试生成fallback内容')
        const fallbackContent = config.fallbackContent(request.userInfo)
        
        const reportData = config.createReport(
          request.userId,
          fallbackContent,
          request.userInfo
        )
        await config.saveReport(reportData, userProfileId)

        return NextResponse.json({
          success: true,
          reportId: reportData.id,
          content: fallbackContent,
          error: 'AI服务暂时不可用，使用了备用分析',
          authMethod: 'fallback'
        })
      } catch (fallbackError) {
        console.error('❌ Fallback保存也失败:', fallbackError)
      }
    }

    // 所有尝试都失败
    throw lastError || new Error(`生成${config.reportName}失败`)

  } catch (error) {
    console.error(`❌ 生成${config.reportName}失败:`, error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '生成报告失败，请稍后重试'
    }, { status: 500 })
  }
} 