import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface UserInfo {
  name: string
  gender: 'male' | 'female'
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

// 生成用户数据的哈希值
function generateUserDataHash(userInfo: UserInfo): string {
  const dataToHash = `${userInfo.gender}-${userInfo.year}-${userInfo.month}-${userInfo.day}-${userInfo.hour}-${userInfo.minute}-${userInfo.area.province}-${userInfo.area.city}-${userInfo.area.district}`
  return crypto.createHash('md5').update(dataToHash).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const { userInfo, userId, isUserProfileId = false } = await request.json()

    if (!userInfo || !userId) {
      return NextResponse.json(
        { error: 'MISSING_FIELDS', message: '缺少必要字段' },
        { status: 400 }
      )
    }

    console.log('🔮 八字API: 开始生成八字报告', { userId, isUserProfileId })

    // 生成用户数据哈希
    const userDataHash = generateUserDataHash(userInfo)

    // 检查是否已存在相同的八字报告
    const { data: existingReport } = await supabase
      .from('bazi_reports')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (existingReport) {
      console.log('✅ 八字报告已存在，返回现有报告')
      return NextResponse.json({
        success: true,
        message: '八字报告已存在',
        report: existingReport,
        isExisting: true
      })
    }

    // 构建API请求参数
    const apiParams = {
      name: userInfo.name,
      gender: userInfo.gender === 'male' ? '男' : '女',
      year: userInfo.year,
      month: userInfo.month,
      day: userInfo.day,
      hour: userInfo.hour,
      minute: userInfo.minute,
      province: userInfo.area.province,
      city: userInfo.area.city,
      district: userInfo.area.district
    }

    console.log('🚀 调用外部八字API:', apiParams)

    // 调用外部八字API
    const response = await fetch(`${process.env.NEXT_PUBLIC_ASTROLOGY_API_URL}/astrology/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiParams)
    })

    if (!response.ok) {
      throw new Error(`八字API调用失败: ${response.status}`)
    }

    const baziData = await response.json()
    
    console.log('✅ 八字API调用成功，数据长度:', JSON.stringify(baziData).length)

    // 保存到数据库
    const { data: savedReport, error: saveError } = await supabase
      .from('bazi_reports')
      .insert({
        user_id: userId,
        raw_payload: baziData,
        user_data_hash: userDataHash,
        api_request_id: `bazi_${Date.now()}_${Math.random().toString(36).substring(7)}`
      })
      .select()
      .single()

    if (saveError) {
      console.error('❌ 保存八字报告失败:', saveError)
      throw new Error('保存八字报告失败')
    }

    console.log('✅ 八字报告保存成功:', savedReport.id)

    return NextResponse.json({
      success: true,
      message: '八字报告生成成功',
      report: savedReport,
      isExisting: false
    })

  } catch (error) {
    console.error('❌ 八字API错误:', error)
    return NextResponse.json(
      { 
        error: 'BAZI_GENERATION_FAILED', 
        message: error instanceof Error ? error.message : '八字报告生成失败' 
      },
      { status: 500 }
    )
  }
} 