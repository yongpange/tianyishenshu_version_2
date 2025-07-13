import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId, isUserProfileId = false } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'MISSING_USER_ID', message: '缺少用户ID' },
        { status: 400 }
      )
    }

    console.log('🔮 获取八字报告:', { userId, isUserProfileId })

    // 从数据库获取八字报告
    const { data: baziReport, error } = await supabase
      .from('bazi_reports')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // 没有找到报告
        console.log('📋 未找到八字报告:', userId)
        return NextResponse.json({
          success: false,
          error: 'REPORT_NOT_FOUND',
          message: '未找到八字报告'
        })
      }
      
      console.error('❌ 获取八字报告失败:', error)
      throw new Error('数据库查询失败')
    }

    if (!baziReport) {
      return NextResponse.json({
        success: false,
        error: 'REPORT_NOT_FOUND',
        message: '未找到八字报告'
      })
    }

    console.log('✅ 成功获取八字报告:', baziReport.id)

    return NextResponse.json({
      success: true,
      message: '成功获取八字报告',
      report: baziReport.raw_payload,
      generatedAt: baziReport.generated_at,
      userDataHash: baziReport.user_data_hash
    })

  } catch (error) {
    console.error('❌ 获取八字报告错误:', error)
    return NextResponse.json(
      { 
        error: 'GET_BAZI_FAILED', 
        message: error instanceof Error ? error.message : '获取八字报告失败' 
      },
      { status: 500 }
    )
  }
} 