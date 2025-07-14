import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// 状态查询请求接口
interface StatusRequest {
  userId: string
  taskId?: string
  isUserProfileId?: boolean
}

// 状态查询响应接口
interface StatusResponse {
  success: boolean
  status: 'not_found' | 'generating' | 'completed' | 'failed'
  progress: number
  message?: string
  error?: string
  reportId?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<StatusResponse>> {
  try {
    const body: StatusRequest = await request.json()
    const { userId, taskId, isUserProfileId } = body

    console.log('📊 查询事业财富报告生成状态:', { userId, taskId, isUserProfileId })

    // 验证请求参数
    if (!userId) {
      return NextResponse.json({
        success: false,
        status: 'not_found',
        progress: 0,
        error: '缺少用户ID参数'
      }, { status: 400 })
    }

    let userProfileId: string

    if (isUserProfileId === true) {
      // 直接使用传入的userId作为user_profiles.id
      userProfileId = userId
      console.log('✅ 直接使用传入的user_profiles.id:', userProfileId)
    } else {
      // 根据手机号查找user_profiles.id
      console.log('🔍 根据手机号查找user_profiles.id:', userId)
      
      try {
        // 先查找用户
        const { data: user, error: userError } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('phone', userId)
          .single()

        if (userError || !user) {
          console.log('📱 用户不存在:', userId)
          return NextResponse.json({
            success: false,
            status: 'not_found',
            progress: 0,
            error: '用户不存在'
          }, { status: 404 })
        }

        // 再查找用户资料
        const { data: userProfile, error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .select('id')
          .eq('user_id', user.id)
          .is('parent_id', null) // 只查找主用户资料
          .single()

        if (profileError || !userProfile) {
          console.log('📋 用户资料不存在:', user.id)
          return NextResponse.json({
            success: false,
            status: 'not_found',
            progress: 0,
            error: '用户资料不存在'
          }, { status: 404 })
        }

        userProfileId = userProfile.id
        console.log('✅ 找到用户资料ID:', userProfileId)

      } catch (error) {
        console.error('❌ 查找用户资料过程出错:', error)
        return NextResponse.json({
          success: false,
          status: 'not_found',
          progress: 0,
          error: '查找用户资料失败'
        }, { status: 500 })
      }
    }

    try {
      // 构建查询条件
      let query = supabaseAdmin
        .from('wealth_reports')
        .select('id, status, progress, error_message, content, task_id')
        .eq('user_id', userProfileId)

      // 如果提供了taskId，则按taskId查询
      if (taskId) {
        query = query.eq('task_id', taskId)
      }

      const { data: report, error: reportError } = await query.single()

      if (reportError) {
        if (reportError.code === 'PGRST116') {
          console.log('📋 事业财富报告不存在:', { userProfileId, taskId })
          return NextResponse.json({
            success: false,
            status: 'not_found',
            progress: 0,
            message: '报告不存在，请先生成报告'
          })
        }
        console.error('❌ 查询事业财富报告状态失败:', reportError)
        return NextResponse.json({
          success: false,
          status: 'not_found',
          progress: 0,
          error: '查询报告状态失败'
        }, { status: 500 })
      }

      if (!report) {
        return NextResponse.json({
          success: false,
          status: 'not_found',
          progress: 0,
          message: '报告不存在'
        })
      }

      // 检查报告状态
      let status: 'not_found' | 'generating' | 'completed' | 'failed' = 'not_found'
      let progress = 0
      let message = ''

      // 如果有新的状态字段，使用新字段
      if (report.status) {
        status = report.status
        progress = report.progress || 0
        
        switch (status) {
          case 'generating':
            message = '正在生成事业财富报告...'
            break
          case 'completed':
            message = '事业财富报告生成完成'
            break
          case 'failed':
            message = report.error_message || '生成失败'
            break
          default:
            message = '未知状态'
        }
      } else {
        // 兼容旧版本，根据content判断状态
        if (!report.content || report.content.trim() === '') {
          status = 'generating'
          progress = 50 // 假设进度
          message = '正在生成事业财富报告...'
        } else {
          status = 'completed'
          progress = 100
          message = '事业财富报告生成完成'
        }
      }

      console.log('📊 事业财富报告状态查询结果:', {
        reportId: report.id,
        status,
        progress,
        message,
        taskId: report.task_id
      })

      return NextResponse.json({
        success: true,
        status,
        progress,
        message,
        reportId: report.id
      })

    } catch (error) {
      console.error('❌ 查询事业财富报告状态过程出错:', error)
      return NextResponse.json({
        success: false,
        status: 'not_found',
        progress: 0,
        error: '查询状态失败，请稍后重试'
      }, { status: 500 })
    }

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
  const isUserProfileId = searchParams.get('isUserProfileId') === 'true'

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
    json: async () => ({ userId, taskId, isUserProfileId })
  } as NextRequest

  return POST(mockRequest)
}
