import { NextRequest, NextResponse } from 'next/server'
import { smsCodeStore, cleanExpiredCodes, debugSmsStore } from '@/lib/sms-store'

// 获取服务器存储的兑换码
const getServerInviteCodes = () => {
  const codes = globalThis.inviteCodesStore || []
  return codes
}

// 标记兑换码为已使用
const markInviteCodeAsUsed = (codeToMark: string) => {
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
    
    const { phone, code, inviteCode } = await request.json()

    // 验证手机号和验证码
    if (!phone || !code) {
      return NextResponse.json(
        { success: false, message: '请填写完整信息' },
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

    // 验证兑换码（如果提供）
    let inviteCodeValid = false
    if (inviteCode) {
      if (!/^[A-Z0-9]{16}$/.test(inviteCode)) {
        return NextResponse.json(
          { success: false, message: '兑换码格式不正确' },
          { status: 400 }
        )
      }

      const serverCodes = getServerInviteCodes()
      console.log('🎫 服务器兑换码列表:', serverCodes.map((c: any) => ({ code: c.code, status: c.status })))
      
      const foundCode = serverCodes.find((item: any) => item.code === inviteCode)
      
      if (!foundCode) {
        console.log('❌ 兑换码不存在:', inviteCode)
        return NextResponse.json(
          { success: false, message: '兑换码无效' },
          { status: 400 }
        )
      }

      if (foundCode.status === 'used') {
        console.log('❌ 兑换码已被使用:', inviteCode)
        return NextResponse.json(
          { success: false, message: '兑换码已被使用' },
          { status: 400 }
        )
      }

      // 标记兑换码已使用
      markInviteCodeAsUsed(inviteCode)
      console.log('✅ 兑换码验证成功并标记为已使用:', inviteCode)
      inviteCodeValid = true
    }

    // 验证成功，清除验证码
    smsCodeStore.delete(phone)

    // 生成用户token（实际项目中应使用JWT）
    const userToken = `token_${phone}_${Date.now()}`

    // 这里应该保存用户信息到数据库
    // 实际项目中应该：
    // 1. 检查用户是否已存在
    // 2. 创建新用户或更新现有用户
    // 3. 记录兑换码使用情况
    // 4. 生成JWT token

    return NextResponse.json({
      success: true,
      message: '登录成功',
      data: {
        token: userToken,
        phone,
        inviteCodeUsed: inviteCodeValid,
        // 根据兑换码给予不同权益
        permissions: inviteCodeValid ? ['premium', 'basic'] : ['basic']
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