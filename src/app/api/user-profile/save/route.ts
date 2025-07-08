import { NextRequest, NextResponse } from 'next/server'
import { saveUserProfile } from '@/lib/user-manager'
import { UserInfo } from '@/lib/coze-client'

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, userInfo } = await request.json()

    if (!phoneNumber || !userInfo) {
      return NextResponse.json(
        { error: 'MISSING_FIELDS', message: '缺少必要字段' },
        { status: 400 }
      )
    }

    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phoneNumber)) {
      return NextResponse.json(
        { error: 'INVALID_PHONE', message: '手机号格式不正确' },
        { status: 400 }
      )
    }

    // 验证用户信息
    if (!userInfo.name || !userInfo.gender || !userInfo.year || !userInfo.month || !userInfo.day) {
      return NextResponse.json(
        { error: 'INVALID_USER_INFO', message: '用户信息不完整' },
        { status: 400 }
      )
    }

    console.log('📝 API: 保存用户资料', { phoneNumber, userInfo })

    // 调用用户管理器保存资料
    const profile = await saveUserProfile(phoneNumber, userInfo)

    return NextResponse.json({
      success: true,
      message: '用户资料保存成功',
      profile: {
        id: profile.id,
        user_id: profile.user_id,
        name: profile.name,
        gender: profile.gender,
        year: profile.year,
        month: profile.month,
        day: profile.day,
        hour: profile.hour,
        minute: profile.minute,
        area: {
          province: profile.area_province,
          city: profile.area_city,
          district: profile.area_district
        }
      }
    })

  } catch (error) {
    console.error('❌ API: 保存用户资料失败:', error)
    
    return NextResponse.json(
      { 
        error: 'SAVE_FAILED', 
        message: error instanceof Error ? error.message : '保存用户资料失败' 
      },
      { status: 500 }
    )
  }
}
