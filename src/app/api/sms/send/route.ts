import { NextRequest, NextResponse } from 'next/server'
import { sendSmsCode, validatePhoneNumber, generateVerificationCode } from '@/lib/tencent-sms'
import { smsCodeStore, cleanExpiredCodes, debugSmsStore } from '@/lib/sms-store'

export async function POST(request: NextRequest) {
  try {
    // 清理过期验证码
    cleanExpiredCodes()
    
    const { phone } = await request.json()

    // 验证手机号格式
    if (!phone || !validatePhoneNumber(phone)) {
      return NextResponse.json(
        { success: false, message: '请输入正确的手机号' },
        { status: 400 }
      )
    }

    // 检查发送频率限制（1分钟内只能发送一次）
    const existingRecord = smsCodeStore.get(phone)
    if (existingRecord && Date.now() - existingRecord.timestamp < 60000) {
      const remainingTime = Math.ceil((60000 - (Date.now() - existingRecord.timestamp)) / 1000)
      return NextResponse.json(
        { success: false, message: `请${remainingTime}秒后再试` },
        { status: 429 }
      )
    }

    // 生成验证码
    const code = generateVerificationCode()

    // 发送短信
    const sendResult = await sendSmsCode(phone, code)
    
    if (!sendResult) {
      return NextResponse.json(
        { success: false, message: '短信发送失败，请稍后重试' },
        { status: 500 }
      )
    }

    // 存储验证码（5分钟有效期）
    const timestamp = Date.now()
    smsCodeStore.set(phone, {
      code,
      timestamp,
      attempts: 0
    })

    console.log('📝 验证码已存储:', {
      phone,
      code,
      timestamp,
      currentTime: new Date(timestamp).toLocaleString()
    })
    
    // 输出调试信息
    debugSmsStore()

    // 注意：不使用setTimeout自动清除，因为会在热重载时丢失
    // 验证码过期检查在verify API中处理

    return NextResponse.json({
      success: true,
      message: '验证码已发送'
    })

  } catch (error) {
    console.error('发送短信验证码失败:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
} 