import { NextRequest, NextResponse } from 'next/server'
import { smsCodeStore, cleanExpiredCodes, debugSmsStore } from '@/lib/sms-store'
import { createOrGetUser, verifyInviteCode, markInviteCodeAsUsed } from '@/lib/user-manager'

// 获取服务器存储的兑换码（保留作为备用）
const getServerInviteCodes = () => {
  const codes = globalThis.inviteCodesStore || []
  return codes
}

// 旧的标记兑换码函数（已废弃，保留作为备用）
const markInviteCodeAsUsedLocal = (codeToMark: string) => {
  const codes = globalThis.inviteCodesStore || []
  const codeIndex = codes.findIndex((item: any) => item.code === codeToMark)
  if (codeIndex !== -1) {
    codes[codeIndex].status = 'used'
    codes[codeIndex].usedAt = new Date().toISOString()
  }
}

export async function POST(request: NextRequest) {
  try {
    // 清理过期的验证码
    cleanExpiredCodes()

    const { phone, code, type = 'register' } = await request.json()

    // 验证手机号和验证码
    if (!phone || !code) {
      return NextResponse.json(
        { success: false, message: '请填写完整信息' },
        { status: 400 }
      )
    }

    // 验证类型参数
    if (!['login', 'register'].includes(type)) {
      return NextResponse.json(
        { success: false, message: '无效的验证类型' },
        { status: 400 }
      )
    }

    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        { success: false, message: '手机号格式不正确' },
        { status: 400 }
      )
    }

    // 验证码格式
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { success: false, message: '验证码格式不正确' },
        { status: 400 }
      )
    }

    // 检查验证码是否存在
    const storedRecord = smsCodeStore.get(phone)
    console.log('🔍 验证码验证 - 手机号:', phone, '存储的记录:', storedRecord)
    
    // 输出详细调试信息
    debugSmsStore()
    
    if (!storedRecord) {
      console.log('❌ 验证码不存在或已过期')
      return NextResponse.json(
        { success: false, message: '验证码已过期，请重新获取' },
        { status: 400 }
      )
    }

    // 检查验证码是否过期（5分钟）
    const now = Date.now()
    const timeDiff = now - storedRecord.timestamp
    const isExpired = timeDiff > 5 * 60 * 1000
    
    console.log('⏰ 验证码时间检查:', {
      currentTime: new Date(now).toLocaleString(),
      codeTime: new Date(storedRecord.timestamp).toLocaleString(),
      timeDiffSeconds: Math.floor(timeDiff / 1000),
      isExpired
    })
    
    if (isExpired) {
      console.log('⏱️ 验证码已过期，删除记录')
      smsCodeStore.delete(phone)
      return NextResponse.json(
        { success: false, message: '验证码已过期，请重新获取' },
        { status: 400 }
      )
    }

    // 检查尝试次数
    if (storedRecord.attempts >= 5) {
      smsCodeStore.delete(phone)
      return NextResponse.json(
        { success: false, message: '验证码错误次数过多，请重新获取' },
        { status: 400 }
      )
    }

    // 验证码错误
    if (storedRecord.code !== code) {
      storedRecord.attempts++
      return NextResponse.json(
        { success: false, message: `验证码错误，还可尝试${5 - storedRecord.attempts}次` },
        { status: 400 }
      )
    }

    // 验证成功，清除验证码
    smsCodeStore.delete(phone)

    // 简化的验证成功响应，不处理用户创建逻辑
    // 用户创建和登录逻辑由各自的auth API处理
    return NextResponse.json({
      success: true,
      message: '验证码验证成功',
      data: {
        phone,
        type,
        verified: true
      }
    })

  } catch (error) {
    console.error('验证短信验证码失败:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
}

// smsCodeStore 从 send route 导入 