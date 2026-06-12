import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { UserInfo } from '@/lib/coze-client'
import { validateUserInfo, calculateUserDataHash } from '@/utils/client-utils'
import { reportStatusCache, ReportType, ReportStatus } from '@/lib/report-status-cache'
import { rateLimiter, RATE_LIMIT_RULES } from '@/lib/rate-limiter'

// 异步生成请求接口
interface AsyncGenerateRequest {
  userInfo: UserInfo
  userId: string
  isUserProfileId?: boolean // 新增：标识userId是否为user_profiles.id
}

// 异步生成响应接口
interface AsyncGenerateResponse {
  success: boolean
  taskId?: string
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<AsyncGenerateResponse>> {
  try {
    const body: AsyncGenerateRequest = await request.json()
    const { userInfo, userId, isUserProfileId } = body

    console.log('🚀 启动异步性格报告生成:', { userId, userInfo, isUserProfileId })

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

    let userProfileId: string

    if (isUserProfileId) {
      // 直接使用提供的user_profiles.id
      userProfileId = userId
      console.log('📋 直接使用user_profiles.id:', userProfileId)
      
      // 验证user_profiles.id是否存在
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('id')
        .eq('id', userProfileId)
        .single()

      if (profileError || !profile) {
        console.error('❌ 用户资料不存在:', userProfileId)
        return NextResponse.json({
          success: false,
          error: '用户资料不存在'
        }, { status: 404 })
      }
    } else {
      // 原有逻辑：通过手机号查找user_profiles.id
      let realUserId = userId
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
        // userId不是UUID格式，可能是手机号，需要查找对应的UUID
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('phone_number', userId)
          .single()

        if (user) {
          realUserId = user.id
          console.log('📞 通过手机号找到用户UUID:', { phoneNumber: userId, uuid: realUserId })
        } else {
          console.error('❌ 未找到对应的用户:', userId)
          return NextResponse.json({
            success: false,
            error: '用户不存在'
          }, { status: 404 })
        }
      }

      // 通过 users.id 找到对应的 user_profiles.id（取第一个主用户资料）
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('id')
        .eq('user_id', realUserId)
        .is('parent_id', null) // 只查找主用户资料
        .single()

      if (profileError || !userProfile) {
        console.error('❌ 找不到主用户资料:', profileError)
        return NextResponse.json({
          success: false,
          error: '主用户资料不存在'
        }, { status: 404 })
      }

      userProfileId = userProfile.id
    }

    console.log('✅ 确定用户资料ID:', userProfileId)

    // 检查报告生成限流
    const rateLimitResult = await rateLimiter.checkRateLimit(userProfileId, RATE_LIMIT_RULES.REPORT_GENERATE)

    if (!rateLimitResult.allowed) {
      console.log('🚫 报告生成限流触发:', {
        userProfileId,
        retryAfter: rateLimitResult.retryAfter
      })

      return NextResponse.json({
        success: false,
        error: `生成过于频繁，请${Math.ceil(rateLimitResult.retryAfter! / 60)}分钟后重试`,
        retryAfter: rateLimitResult.retryAfter
      }, { status: 429 })
    }

    // 检查防重复提交（5分钟内不能重复生成同类型报告）
    const isDuplicate = !(await rateLimiter.checkDuplicate(userProfileId, 'personality_report', 300))

    if (isDuplicate) {
      console.log('🔄 检测到报告重复生成:', userProfileId)

      return NextResponse.json({
        success: false,
        error: '请勿重复生成报告，请稍后再试'
      }, { status: 409 })
    }

    // 生成任务ID
    const taskId = `task_${userProfileId}_${Date.now()}`
    const userDataHash = calculateUserDataHash(userInfo)

    // 检查是否正在生成中（防重复提交）
    const isGenerating = await reportStatusCache.isReportGenerating(ReportType.PERSONALITY, userProfileId)
    if (isGenerating) {
      console.log('⚠️ 报告正在生成中，拒绝重复请求')
      return NextResponse.json({
        success: false,
        error: '报告正在生成中，请稍后查询状态'
      }, { status: 409 })
    }

    // 尝试获取生成锁
    const lockAcquired = await reportStatusCache.acquireReportLock(ReportType.PERSONALITY, userProfileId, taskId)
    if (!lockAcquired) {
      console.log('❌ 无法获取生成锁，可能有其他任务正在进行')
      return NextResponse.json({
        success: false,
        error: '系统繁忙，请稍后重试'
      }, { status: 429 })
    }

    // 检查是否已有相同的报告
    const { data: existingReport } = await supabaseAdmin
      .from('personality_reports')
      .select('id, content, user_data_hash')
      .eq('user_id', userProfileId)
      .single()

    if (existingReport && existingReport.user_data_hash === userDataHash && existingReport.content) {
      console.log('✅ 发现相同的报告，直接返回')

      // 释放锁
      await reportStatusCache.releaseReportLock(ReportType.PERSONALITY, userProfileId, taskId)

      // 更新缓存状态为已完成
      await reportStatusCache.updateReportStatus(
        ReportType.PERSONALITY,
        userProfileId,
        ReportStatus.COMPLETED,
        100,
        {
          reportId: existingReport.id,
          content: existingReport.content
        }
      )

      return NextResponse.json({
        success: true,
        taskId: 'existing'
      })
    }

    // 设置初始状态到缓存
    await reportStatusCache.updateReportStatus(
      ReportType.PERSONALITY,
      userProfileId,
      ReportStatus.GENERATING,
      0,
      { taskId }
    )

    // 创建生成任务记录（兼容旧表结构）
    const taskRecord: any = {
      user_id: userProfileId, // 使用 user_profiles.id
      content: '', // 空内容表示正在生成
      user_data_hash: userDataHash,
      generated_at: new Date().toISOString()
    }

    // 如果表支持新字段，添加它们
    try {
      taskRecord.task_id = taskId
      taskRecord.status = 'generating'
      taskRecord.progress = 0
    } catch (e) {
      // 忽略字段不存在的错误
    }

    const { error: taskError } = await supabaseAdmin
      .from('personality_reports')
      .upsert(taskRecord, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })

    if (taskError) {
      console.error('❌ 创建任务记录失败:', taskError)

      // 释放锁和清除状态
      await reportStatusCache.releaseReportLock(ReportType.PERSONALITY, userProfileId, taskId)
      await reportStatusCache.clearReportStatus(ReportType.PERSONALITY, userProfileId)

      return NextResponse.json({
        success: false,
        error: '创建生成任务失败'
      }, { status: 500 })
    }

    // 启动后台生成任务（不等待完成）
    // 注意：这里的userId已经是userProfileId了，所以isUserProfileId应该是true
    generateReportInBackground(taskId, userProfileId, userInfo, true).catch(error => {
      console.error('❌ 后台生成任务失败:', error)

      // 更新状态为失败
      reportStatusCache.updateReportStatus(
        ReportType.PERSONALITY,
        userProfileId,
        ReportStatus.FAILED,
        0,
        {
          taskId,
          error: error instanceof Error ? error.message : '生成失败'
        }
      ).catch(console.error)

      // 释放锁
      reportStatusCache.releaseReportLock(ReportType.PERSONALITY, userProfileId, taskId).catch(console.error)
    })

    console.log('✅ 异步生成任务已启动:', { taskId, userProfileId, isUserProfileId: true })

    return NextResponse.json({
      success: true,
      taskId: taskId
    })

  } catch (error) {
    console.error('❌ 启动异步生成失败:', error)
    return NextResponse.json({
      success: false,
      error: '启动生成任务失败，请稍后重试'
    }, { status: 500 })
  }
}

// 后台生成报告的函数
async function generateReportInBackground(taskId: string, userId: string, userInfo: UserInfo, isUserProfileId: boolean = false) {
  try {
    console.log('🔄 开始后台生成报告:', { taskId, userId, isUserProfileId })

    // 计算用户数据hash
    const userDataHash = calculateUserDataHash(userInfo)

    // 更新状态为生成中（使用缓存）
    await reportStatusCache.updateReportStatus(
      ReportType.PERSONALITY,
      userId,
      ReportStatus.GENERATING,
      10,
      { taskId }
    )

    // 调用原有的生成逻辑 - 添加isUserProfileId参数
    console.log('📡 调用generate接口，参数:', { userInfo, userId, isUserProfileId })
    const generateResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/personality-report/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userInfo, userId, isUserProfileId })
    })

    const result = await generateResponse.json()
    console.log('📋 generate接口响应:', result)

    if (result.success && result.content) {
      // 更新为完成状态（使用缓存）
      await reportStatusCache.updateReportStatus(
        ReportType.PERSONALITY,
        userId,
        ReportStatus.COMPLETED,
        100,
        {
          taskId,
          content: result.content
        }
      )

      // 同时更新数据库（兼容旧表结构）
      const updateData: any = {
        content: result.content,
        coze_conversation_id: result.conversationId
      }

      try {
        updateData.status = 'completed'
        updateData.progress = 100
      } catch (e) {
        // 忽略新字段
      }

      await supabaseAdmin
        .from('personality_reports')
        .update(updateData)
        .eq('user_id', userId)
        .eq('user_data_hash', userDataHash)

      // 释放锁
      await reportStatusCache.releaseReportLock(ReportType.PERSONALITY, userId, taskId)

      console.log('✅ 后台报告生成完成:', { taskId, userId, isUserProfileId })
    } else {
      // 更新为失败状态（使用缓存）
      const errorMessage = result.error || '未知错误'

      await reportStatusCache.updateReportStatus(
        ReportType.PERSONALITY,
        userId,
        ReportStatus.FAILED,
        0,
        {
          taskId,
          error: errorMessage
        }
      )

      // 同时更新数据库（兼容旧表结构）
      const updateData: any = {
        content: `生成失败: ${errorMessage}`
      }

      try {
        updateData.status = 'failed'
        updateData.progress = 0
        updateData.error_message = errorMessage
      } catch (e) {
        // 忽略新字段
      }

      await supabaseAdmin
        .from('personality_reports')
        .update(updateData)
        .eq('user_id', userId)
        .eq('user_data_hash', userDataHash)

      // 释放锁
      await reportStatusCache.releaseReportLock(ReportType.PERSONALITY, userId, taskId)

      console.error('❌ 后台报告生成失败:', { taskId, userId, isUserProfileId, error: result.error })
    }

  } catch (error: any) {
    console.error('❌ 后台生成过程出错:', { taskId, userId, isUserProfileId, error: error.message })

    const errorMessage = error.message || '生成过程出错'

    // 更新为失败状态（使用缓存）
    await reportStatusCache.updateReportStatus(
      ReportType.PERSONALITY,
      userId,
      ReportStatus.FAILED,
      0,
      {
        taskId,
        error: errorMessage
      }
    ).catch(console.error)

    // 释放锁
    await reportStatusCache.releaseReportLock(ReportType.PERSONALITY, userId, taskId).catch(console.error)

    // 同时更新数据库（兼容旧表结构）
    const updateData: any = {
      content: `生成过程出错: ${errorMessage}`
    }

    try {
      updateData.status = 'failed'
      updateData.progress = 0
      updateData.error_message = errorMessage
    } catch (e) {
      // 忽略新字段
    }

    try {
      await supabaseAdmin
        .from('personality_reports')
        .update(updateData)
        .eq('user_id', userId)
    } catch (dbError) {
      console.error('❌ 更新数据库失败状态失败:', dbError)
    }
  }
}
