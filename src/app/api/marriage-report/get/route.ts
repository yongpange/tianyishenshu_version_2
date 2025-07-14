import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// 请求接口
interface GetMarriageReportRequest {
  userId: string
  isUserProfileId?: boolean
}

// 响应接口
interface GetMarriageReportResponse {
  success: boolean
  report?: {
    id: string
    content: string
    generatedAt: string
    cozeConversationId?: string
  }
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<GetMarriageReportResponse>> {
  try {
    const body: GetMarriageReportRequest = await request.json()
    const { userId, isUserProfileId } = body

    console.log('📖 获取婚恋感情报告:', { userId, isUserProfileId })

    // 验证请求参数
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: '缺少用户ID参数'
      }, { status: 400 })
    }

    let userProfileId: string

    if (isUserProfileId === true) {
      userProfileId = userId
      console.log('✅ 直接使用传入的user_profiles.id:', userProfileId)
    } else {
      console.log('🔍 根据手机号查找user_profiles.id:', userId)
      
      try {
        const { data: user, error: userError } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('phone', userId)
          .single()

        if (userError) {
          if (userError.code === 'PGRST116') {
            return NextResponse.json({
              success: false,
              error: '用户不存在，请先注册'
            }, { status: 404 })
          }
          return NextResponse.json({
            success: false,
            error: '查询用户失败'
          }, { status: 500 })
        }

        const { data: userProfile, error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .select('id')
          .eq('user_id', user.id)
          .is('parent_id', null)
          .single()

        if (profileError) {
          if (profileError.code === 'PGRST116') {
            return NextResponse.json({
              success: false,
              error: '用户资料不存在，请先完善个人信息'
            }, { status: 404 })
          }
          return NextResponse.json({
            success: false,
            error: '查询用户资料失败'
          }, { status: 500 })
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
      // 查询婚恋感情报告
      const { data: report, error: reportError } = await supabaseAdmin
        .from('marriage_reports')
        .select('id, content, generated_at, coze_conversation_id')
        .eq('user_id', userProfileId)
        .single()

      if (reportError) {
        if (reportError.code === 'PGRST116') {
          console.log('📋 婚恋感情报告不存在:', userProfileId)
          return NextResponse.json({
            success: false,
            error: '婚恋感情报告未生成，请先生成报告'
          }, { status: 404 })
        }
        console.error('❌ 查询婚恋感情报告失败:', reportError)
        return NextResponse.json({
          success: false,
          error: '查询报告失败'
        }, { status: 500 })
      }

      // 检查报告内容是否有效
      if (!report.content || report.content.trim() === '') {
        console.log('📋 婚恋感情报告内容为空，可能正在生成中')
        return NextResponse.json({
          success: false,
          error: '报告正在生成中，请稍后再试'
        }, { status: 202 })
      }

      console.log('✅ 成功获取婚恋感情报告:', {
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
      console.error('❌ 获取婚恋感情报告过程出错:', error)
      return NextResponse.json({
        success: false,
        error: '获取报告失败，请稍后重试'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ 获取婚恋感情报告API错误:', error)
    return NextResponse.json({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 })
  }
}
