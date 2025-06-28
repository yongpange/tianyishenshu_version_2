import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// 请求接口
interface GetReportRequest {
  userId: string
}

// 响应接口
interface GetReportResponse {
  success: boolean
  report?: {
    id: string
    userId: string
    content: string
    generatedAt: string
    userDataHash: string
    cozeConversationId?: string
  }
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<GetReportResponse>> {
  try {
    const body: GetReportRequest = await request.json()
    const { userId } = body

    console.log('📖 获取性格报告:', { userId })

    // 验证请求参数
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: '缺少用户ID参数'
      }, { status: 400 })
    }

    // 验证环境变量
    if (!supabaseAdmin) {
      console.error('❌ Supabase Admin 客户端未初始化')
      return NextResponse.json({
        success: false,
        error: '服务配置错误'
      }, { status: 500 })
    }

    try {
      // 首先通过手机号查找用户ID
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('phone_number', userId)
        .single()

      if (userError) {
        if (userError.code === 'PGRST116') {
          console.log('📋 用户不存在:', userId)
          return NextResponse.json({
            success: false,
            error: '用户不存在'
          }, { status: 404 })
        }
        console.error('❌ 查找用户失败:', userError)
        return NextResponse.json({
          success: false,
          error: '查找用户失败'
        }, { status: 500 })
      }

      // 通过用户ID查找性格报告
      const { data: reportData, error: reportError } = await supabaseAdmin
        .from('personality_reports')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (reportError) {
        if (reportError.code === 'PGRST116') {
          console.log('📋 报告不存在:', { userId, userDbId: user.id })
          return NextResponse.json({
            success: false,
            error: '性格报告未生成，请返回信息填写页重新生成'
          }, { status: 404 })
        }
        console.error('❌ 查找报告失败:', reportError)
        return NextResponse.json({
          success: false,
          error: '查找报告失败'
        }, { status: 500 })
      }

      if (!reportData) {
        return NextResponse.json({
          success: false,
          error: '报告数据为空'
        }, { status: 404 })
      }

      console.log('✅ 成功获取报告:', {
        userId,
        userDbId: user.id,
        reportId: reportData.id,
        contentLength: reportData.content?.length || 0
      })

      // 返回报告数据
      return NextResponse.json({
        success: true,
        report: {
          id: reportData.id,
          userId: userId, // 返回手机号作为userId
          content: reportData.content,
          generatedAt: reportData.generated_at,
          userDataHash: reportData.user_data_hash,
          cozeConversationId: reportData.coze_conversation_id
        }
      })

    } catch (supabaseError: any) {
      console.error('❌ Supabase 操作失败:', supabaseError)
      return NextResponse.json({
        success: false,
        error: '数据库操作失败'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ 获取性格报告API错误:', error)
    return NextResponse.json({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 })
  }
}
