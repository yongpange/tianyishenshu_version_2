import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code || typeof code !== 'string' || code.length !== 16) {
      return NextResponse.json({ 
        success: false, 
        message: '兑换码格式不正确' 
      }, { status: 400 })
    }

    // 这里暂时返回成功，实际验证逻辑将在客户端实现
    // 后续迁移到Supabase时会在此处实现真正的验证逻辑
    
    console.log('🔍 验证兑换码:', code)
    
    return NextResponse.json({ 
      success: true, 
      message: '兑换码验证成功',
      code: code
    })

  } catch (error) {
    console.error('兑换码验证失败:', error)
    return NextResponse.json({ 
      success: false, 
      message: '验证失败，请重试' 
    }, { status: 500 })
  }
} 