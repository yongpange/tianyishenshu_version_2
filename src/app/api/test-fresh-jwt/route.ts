import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 测试强制生成新JWT token...')
    
    // 强制使用createReportCozeClient生成新token
    const { createReportCozeClient } = await import('@/lib/coze-auth')
    const { client, authMethod } = await createReportCozeClient()
    
    console.log('✅ 新JWT认证成功:', authMethod)
    
    // 简单测试API调用
    const { RoleType } = await import('@coze/api')
    const testResult = await client.chat.createAndPoll({
      bot_id: process.env.PERSONALITY_BOT_ID || process.env.BOT_ID,
      user_id: 'test_user',
      additional_messages: [
        {
          role: RoleType.User,
          content: '你好，这是一个认证测试',
          content_type: 'text',
        },
      ],
    })
    
    console.log('✅ API调用测试成功!')
    
    return NextResponse.json({
      success: true,
      authMethod,
      message: '新JWT token认证测试成功！'
    })
    
  } catch (error) {
    console.error('❌ 新JWT token测试失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 