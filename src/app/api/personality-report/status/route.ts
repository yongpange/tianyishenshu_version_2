import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// 请求接口
interface StatusRequest {
  userId: string
  taskId?: string
  isUserProfileId?: boolean // 新增：标识userId是否为user_profiles.id
}

// 响应接口
interface StatusResponse {
  success: boolean
  status: 'generating' | 'completed' | 'failed' | 'not_found'
  progress: number
  content?: string
  error?: string
  taskId?: string
  generatedAt?: string
  cozeConversationId?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<StatusResponse>> {
  try {
    const body: StatusRequest = await request.json()
    const { userId, taskId, isUserProfileId } = body

    console.log('🔍 查询报告状态:', { userId, taskId, isUserProfileId })

    if (!userId) {
      return NextResponse.json({
        success: false,
        status: 'not_found',
        progress: 0,
        error: '缺少用户ID参数'
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
          status: 'not_found',
          progress: 0,
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
            status: 'not_found',
            progress: 0,
            error: '用户不存在'
          }, { status: 404 })
        }
      }

      // 通过 users.id 找到对应的 user_profiles.id（取主用户资料）
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
          status: 'not_found',
          progress: 0,
          error: '主用户资料不存在'
        }, { status: 404 })
      }

      userProfileId = userProfile.id
    }

    console.log('✅ 确定用户资料ID:', userProfileId)

    // 构建查询条件
    let query = supabaseAdmin
      .from('personality_reports')
      .select('*')
      .eq('user_id', userProfileId)

    // 如果提供了taskId，优先查询特定任务
    if (taskId && taskId !== 'existing') {
      query = query.eq('task_id', taskId)
    }

    // 按创建时间倒序，获取最新的记录
    const { data: reports, error } = await query
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('❌ 查询报告状态失败:', error)
      return NextResponse.json({
        success: false,
        status: 'not_found',
        progress: 0,
        error: '查询失败'
      }, { status: 500 })
    }

    if (!reports || reports.length === 0) {
      console.log('❌ 未找到报告记录')
      return NextResponse.json({
        success: true,
        status: 'not_found',
        progress: 0
      })
    }

    const report = reports[0]
    console.log('📊 报告状态:', {
      status: report.status,
      progress: report.progress,
      contentLength: report.content?.length || 0,
      taskId: report.task_id
    })

    // 处理不同状态（兼容旧表结构）
    let responseStatus: StatusResponse['status'] = 'not_found'
    let progress = 0
    let content = undefined
    let errorMessage = undefined

    // 检查是否有新的status字段
    if (report.status) {
      switch (report.status) {
        case 'generating':
          responseStatus = 'generating'
          progress = report.progress || 0
          break

        case 'completed':
          responseStatus = 'completed'
          progress = 100
          content = report.content
          break

        case 'failed':
          responseStatus = 'failed'
          progress = 0
          errorMessage = report.error_message || '生成失败'
          break

        default:
          responseStatus = 'not_found'
      }
    } else {
      // 兼容旧数据：根据content判断状态
      if (report.content && report.content.trim().length > 0) {
        if (report.content.startsWith('生成失败:') || report.content.startsWith('生成过程出错:')) {
          responseStatus = 'failed'
          progress = 0
          errorMessage = report.content
        } else {
          responseStatus = 'completed'
          progress = 100
          content = report.content
        }
      } else {
        // 空内容可能表示正在生成
        responseStatus = 'generating'
        progress = 50 // 假设进度
      }
    }

    return NextResponse.json({
      success: true,
      status: responseStatus,
      progress: progress,
      content: content,
      error: errorMessage,
      taskId: report.task_id,
      generatedAt: report.generated_at,
      cozeConversationId: report.coze_conversation_id
    })

  } catch (error) {
    console.error('❌ 状态查询API错误:', error)
    return NextResponse.json({
      success: false,
      status: 'not_found',
      progress: 0,
      error: '服务器内部错误'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<StatusResponse>> {
  // 支持GET请求，从URL参数获取userId和taskId
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const taskId = searchParams.get('taskId')

  if (!userId) {
    return NextResponse.json({
      success: false,
      status: 'not_found',
      progress: 0,
      error: '缺少用户ID参数'
    }, { status: 400 })
  }

  // 重用POST逻辑
  const mockRequest = {
    json: async () => ({ userId, taskId })
  } as NextRequest

  return POST(mockRequest)
}
