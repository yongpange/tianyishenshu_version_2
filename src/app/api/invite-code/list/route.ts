import { NextRequest, NextResponse } from 'next/server'

// 全局兑换码存储
declare global {
  var inviteCodesStore: any[] | undefined
}

const getInviteCodesStore = () => {
  if (!globalThis.inviteCodesStore) {
    globalThis.inviteCodesStore = []
  }
  return globalThis.inviteCodesStore
}

export async function GET() {
  try {
    const codes = getInviteCodesStore()
    return NextResponse.json({
      success: true,
      data: codes
    })
  } catch (error) {
    console.error('获取兑换码列表失败:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { codes } = await request.json()
    
    // 同步兑换码到全局存储
    globalThis.inviteCodesStore = codes
    
    console.log('📝 兑换码已同步到服务器:', codes.length, '个')
    
    return NextResponse.json({
      success: true,
      message: '兑换码同步成功'
    })
  } catch (error) {
    console.error('同步兑换码失败:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
} 