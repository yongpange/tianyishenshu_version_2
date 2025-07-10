import { NextRequest, NextResponse } from 'next/server'
import { verifyInviteCode } from '@/lib/user-manager'

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code || typeof code !== 'string' || code.length !== 16) {
      return NextResponse.json({
        success: false,
        message: '兑换码格式不正确'
      }, { status: 400 })
    }

    console.log('🔍 验证兑换码:', code)

    // 使用真正的验证逻辑检查数据库中的兑换码
    const isValid = await verifyInviteCode(code)

    if (!isValid) {
      return NextResponse.json({
        success: false,
        message: '兑换码无效或已被使用'
      }, { status: 400 })
    }

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