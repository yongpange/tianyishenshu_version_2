import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { UserInfo } from '@/lib/coze-client'
import { validateUserInfo, calculateUserDataHash } from '@/utils/personality-report'

// 请求接口
interface AsyncGenerateRequest {
  userInfo: UserInfo
  userId: string
}

// 响应接口
interface AsyncGenerateResponse {
  success: boolean
  taskId?: string
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<AsyncGenerateResponse>> {
  try {
    const body: AsyncGenerateRequest = await request.json()
    const { userInfo, userId } = body

    console.log('🚀 启动异步性格报告生成:', { userId, userInfo })

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

    // 获取真实的用户UUID（如果userId是手机号）
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

    // 生成任务ID
    const taskId = `task_${realUserId}_${Date.now()}`
    const userDataHash = calculateUserDataHash(userInfo)

    // 检查是否已有相同的报告
    const { data: existingReport } = await supabaseAdmin
      .from('personality_reports')
      .select('id, content, user_data_hash')
      .eq('user_id', realUserId)
      .single()

    if (existingReport && existingReport.user_data_hash === userDataHash && existingReport.content) {
      console.log('✅ 发现相同的报告，直接返回')
      return NextResponse.json({
        success: true,
        taskId: 'existing'
      })
    }

    // 创建生成任务记录（兼容旧表结构）
    const taskRecord = {
      user_id: realUserId,
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
      .upsert(taskRecord)

    if (taskError) {
      console.error('❌ 创建任务记录失败:', taskError)
      return NextResponse.json({
        success: false,
        error: '创建生成任务失败'
      }, { status: 500 })
    }

    // 启动后台生成任务（不等待完成）
    generateReportInBackground(taskId, realUserId, userInfo).catch(error => {
      console.error('❌ 后台生成任务失败:', error)
    })

    console.log('✅ 异步任务已启动:', taskId)
    return NextResponse.json({
      success: true,
      taskId: taskId
    })

  } catch (error) {
    console.error('❌ 异步生成API错误:', error)
    return NextResponse.json({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 })
  }
}

// 后台生成报告的函数
async function generateReportInBackground(taskId: string, userId: string, userInfo: UserInfo) {
  try {
    console.log('🔄 开始后台生成报告:', taskId)

    // 计算用户数据hash
    const userDataHash = calculateUserDataHash(userInfo)

    // 更新状态为生成中（兼容旧表结构）
    try {
      await supabaseAdmin
        .from('personality_reports')
        .update({
          status: 'generating',
          progress: 10
        })
        .eq('task_id', taskId)
    } catch (e) {
      // 如果新字段不存在，跳过状态更新
      console.log('⚠️ 跳过状态更新（表结构不支持）')
    }

    // 调用原有的生成逻辑
    const generateResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/personality-report/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userInfo, userId })
    })

    const result = await generateResponse.json()

    if (result.success && result.content) {
      // 更新为完成状态（兼容旧表结构）
      const updateData = {
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

      console.log('✅ 后台报告生成完成:', taskId)
    } else {
      // 更新为失败状态（兼容旧表结构）
      const updateData = {
        content: `生成失败: ${result.error || '未知错误'}`
      }

      try {
        updateData.status = 'failed'
        updateData.progress = 0
        updateData.error_message = result.error || '生成失败'
      } catch (e) {
        // 忽略新字段
      }

      await supabaseAdmin
        .from('personality_reports')
        .update(updateData)
        .eq('user_id', userId)
        .eq('user_data_hash', userDataHash)

      console.error('❌ 后台报告生成失败:', result.error)
    }

  } catch (error) {
    console.error('❌ 后台生成过程出错:', error)
    
    // 更新为失败状态（兼容旧表结构）
    const updateData = {
      content: `生成过程出错: ${error.message || '未知错误'}`
    }

    try {
      updateData.status = 'failed'
      updateData.progress = 0
      updateData.error_message = error.message || '生成过程出错'
    } catch (e) {
      // 忽略新字段
    }

    await supabaseAdmin
      .from('personality_reports')
      .update(updateData)
      .eq('user_id', userId)
  }
}
