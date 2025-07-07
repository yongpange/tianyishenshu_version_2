import { NextRequest, NextResponse } from 'next/server'
import { createPersonalityReport, savePersonalityReport } from '@/utils/personality-report'

interface TestSaveRequest {
  userInfo: {
    name: string
    gender: string
    year: number
    month: number
    day: number
    hour: number
    minute: number
    area: {
      province: string
      city: string
      district: string
    }
  }
  userId: string
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const body: TestSaveRequest = await request.json()
    const { userInfo, userId, content } = body

    console.log('🧪 测试保存报告:', { userId, contentLength: content.length })

    // 创建报告对象
    const reportData = createPersonalityReport(
      userId,
      content,
      userInfo,
      'test_conversation_' + Date.now()
    )

    console.log('📝 创建的报告对象:', {
      id: reportData.id,
      userId: reportData.userId,
      contentLength: reportData.content.length,
      generatedAt: reportData.generatedAt,
      userDataHash: reportData.userDataHash
    })

    // 尝试保存
    try {
      await savePersonalityReport(reportData)
      console.log('✅ 报告保存成功')

      return NextResponse.json({
        success: true,
        message: '报告保存成功',
        reportId: reportData.id,
        details: {
          userId: reportData.userId,
          contentLength: reportData.content.length,
          generatedAt: reportData.generatedAt,
          userDataHash: reportData.userDataHash
        }
      })

    } catch (saveError) {
      console.error('❌ 保存失败:', saveError)
      
      return NextResponse.json({
        success: false,
        error: '保存失败',
        details: {
          errorMessage: saveError instanceof Error ? saveError.message : String(saveError),
          errorStack: saveError instanceof Error ? saveError.stack : undefined,
          reportData: {
            id: reportData.id,
            userId: reportData.userId,
            contentLength: reportData.content.length
          }
        }
      })
    }

  } catch (error) {
    console.error('❌ 测试保存API错误:', error)
    return NextResponse.json({
      success: false,
      error: '服务器内部错误',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
