import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// 请求接口
interface GetWealthReportRequest {
  userId: string
  isUserProfileId?: boolean // 标识userId是否为user_profiles.id
}

// 响应接口
interface GetWealthReportResponse {
  success: boolean
  report?: {
    id: string
    content: string
    generatedAt: string
    cozeConversationId?: string
  }
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<GetWealthReportResponse>> {
  try {
    const body: GetWealthReportRequest = await request.json()
    const { userId, isUserProfileId } = body

    console.log('📖 获取事业财富报告:', { userId, isUserProfileId })

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

        if (userError) {
          if (userError.code === 'PGRST116') {
            console.log('📱 用户不存在:', userId)
            return NextResponse.json({
              success: false,
              error: '用户不存在，请先注册'
            }, { status: 404 })
          }
          console.error('❌ 查询用户失败:', userError)
          return NextResponse.json({
            success: false,
            error: '查询用户失败'
          }, { status: 500 })
        }

        if (!user) {
          console.log('📱 用户不存在:', userId)
          return NextResponse.json({
            success: false,
            error: '用户不存在，请先注册'
          }, { status: 404 })
        }

        // 再查找用户资料
        const { data: userProfile, error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .select('id')
          .eq('user_id', user.id)
          .is('parent_id', null) // 只查找主用户资料
          .single()

        if (profileError) {
          if (profileError.code === 'PGRST116') {
            console.log('📋 用户资料不存在:', user.id)
            return NextResponse.json({
              success: false,
              error: '用户资料不存在，请先完善个人信息'
            }, { status: 404 })
          }
          console.error('❌ 查询用户资料失败:', profileError)
          return NextResponse.json({
            success: false,
            error: '查询用户资料失败'
          }, { status: 500 })
        }

        if (!userProfile) {
          console.log('📋 用户资料不存在:', user.id)
          return NextResponse.json({
            success: false,
            error: '用户资料不存在，请先完善个人信息'
          }, { status: 404 })
        }

        userProfileId = userProfile.id
        console.log('✅ 找到用户资料ID:', userProfileId)

      } catch (error) {
        console.error('❌ 查找用户资料过程出错:', error)
        return NextResponse.json({
          success: false,
          error: '查找用户资料失败'
        }, { status: 500 })
      }
    }

    try {
      // 查询事业财富报告
      const { data: report, error: reportError } = await supabaseAdmin
        .from('wealth_reports')
        .select('id, content, generated_at, coze_conversation_id')
        .eq('user_id', userProfileId)
        .single()

      if (reportError) {
        if (reportError.code === 'PGRST116') {
          console.log('📋 事业财富报告不存在:', userProfileId)
          return NextResponse.json({
            success: false,
            error: '事业财富报告未生成，请先生成报告'
          }, { status: 404 })
        }
        console.error('❌ 查询事业财富报告失败:', reportError)
        return NextResponse.json({
          success: false,
          error: '查询报告失败'
        }, { status: 500 })
      }

      // 检查报告内容是否有效
      if (!report.content || report.content.trim() === '') {
        console.log('📋 事业财富报告内容为空，可能正在生成中')
        return NextResponse.json({
          success: false,
          error: '报告正在生成中，请稍后再试'
        }, { status: 202 })
      }

      console.log('✅ 成功获取事业财富报告:', {
        reportId: report.id,
        contentLength: report.content.length,
        generatedAt: report.generated_at
      })

      return NextResponse.json({
        success: true,
        report: {
          id: report.id,
          content: report.content,
          generatedAt: report.generated_at,
          cozeConversationId: report.coze_conversation_id
        }
      })

    } catch (error) {
      console.error('❌ 获取事业财富报告过程出错:', error)
      return NextResponse.json({
        success: false,
        error: '获取报告失败，请稍后重试'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ 获取事业财富报告API错误:', error)
    return NextResponse.json({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 })
  }
}
