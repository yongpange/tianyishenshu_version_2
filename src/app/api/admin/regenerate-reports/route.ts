import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// 请求接口
interface RegenerateReportsRequest {
  reportType: string
  adminToken: string
  userPhone?: string // 可选：特定用户的手机号
  singleUser?: boolean // 是否为单个用户重新生成
}

// 响应接口
interface RegenerateReportsResponse {
  success: boolean
  count?: number
  error?: string
  message?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<RegenerateReportsResponse>> {
  try {
    const body: RegenerateReportsRequest = await request.json()
    const { reportType, adminToken, userPhone, singleUser } = body

    console.log('🔧 管理员重新生成报告请求:', { reportType, singleUser, userPhone })

    // 验证管理员token
    if (!adminToken) {
      return NextResponse.json({
        success: false,
        error: '缺少管理员令牌'
      }, { status: 401 })
    }

    // 验证报告类型
    const validReportTypes = ['astrology', 'personality', 'wealth', 'marriage', 'health']
    if (!validReportTypes.includes(reportType)) {
      return NextResponse.json({
        success: false,
        error: '无效的报告类型'
      }, { status: 400 })
    }

    let userProfiles: any[] = []

    if (singleUser && userPhone) {
      // 单个用户模式：根据手机号查找用户资料
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('phone_number', userPhone)
        .single()

      if (userError || !user) {
        return NextResponse.json({
          success: false,
          error: '找不到指定用户'
        }, { status: 404 })
      }

      const { data: profile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('id, name, gender, year, month, day, hour, minute, area_province, area_city, area_district')
        .eq('user_id', user.id)
        .single()

      if (profileError || !profile) {
        return NextResponse.json({
          success: false,
          error: '找不到用户资料'
        }, { status: 404 })
      }

      userProfiles = [profile]
      console.log(`📊 找到用户 ${profile.name} 的资料`)
    } else {
      // 批量模式：获取所有用户资料
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('user_profiles')
        .select('id, name, gender, year, month, day, hour, minute, area_province, area_city, area_district')

      if (profilesError) {
        console.error('❌ 获取用户资料失败:', profilesError)
        return NextResponse.json({
          success: false,
          error: '获取用户资料失败'
        }, { status: 500 })
      }

      if (!profiles || profiles.length === 0) {
        return NextResponse.json({
          success: false,
          error: '没有找到用户资料'
        }, { status: 404 })
      }

      userProfiles = profiles
      console.log(`📊 找到 ${userProfiles.length} 个用户资料`)
    }

    // 根据报告类型获取对应的表名
    const getTableName = (type: string) => {
      switch (type) {
        case 'astrology': return 'astrology_reports'
        case 'personality': return 'personality_reports'
        case 'wealth': return 'wealth_reports'
        case 'marriage': return 'marriage_reports'
        case 'health': return 'health_reports'
        default: return null
      }
    }

    const tableName = getTableName(reportType)
    if (!tableName) {
      return NextResponse.json({
        success: false,
        error: '无效的报告类型'
      }, { status: 400 })
    }

    // 删除现有报告
    if (singleUser && userProfiles.length === 1) {
      // 单个用户模式：只删除该用户的报告
      console.log(`🗑️ 删除用户 ${userProfiles[0].name} 的${reportType}报告...`)
      const { error: deleteError } = await supabaseAdmin
        .from(tableName)
        .delete()
        .eq('user_id', userProfiles[0].id)

      if (deleteError) {
        console.error('❌ 删除用户报告失败:', deleteError)
        return NextResponse.json({
          success: false,
          error: '删除用户报告失败'
        }, { status: 500 })
      }

      console.log(`✅ 成功删除用户 ${userProfiles[0].name} 的${reportType}报告`)
    } else {
      // 批量模式：删除所有报告
      console.log(`🗑️ 删除所有${reportType}报告...`)
      const { error: deleteError } = await supabaseAdmin
        .from(tableName)
        .delete()
        .neq('id', '') // 删除所有记录

      if (deleteError) {
        console.error('❌ 删除现有报告失败:', deleteError)
        return NextResponse.json({
          success: false,
          error: '删除现有报告失败'
        }, { status: 500 })
      }

      console.log(`✅ 成功删除所有${reportType}报告`)
    }

    // 为每个用户启动异步报告生成
    let successCount = 0
    const generatePromises = userProfiles.map(async (profile) => {
      try {
        const userInfo = {
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

        // 调用对应的异步生成API
        const apiEndpoint = `/api/${reportType === 'astrology' ? 'astrology' : reportType + '-report'}/generate-async`
        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${apiEndpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userInfo,
            userId: profile.id,
            isUserProfileId: true
          })
        })

        const result = await response.json()
        if (result.success) {
          console.log(`✅ 为用户 ${profile.name} 启动${reportType}报告生成`)
          return true
        } else {
          console.error(`❌ 为用户 ${profile.name} 启动${reportType}报告生成失败:`, result.error)
          return false
        }
      } catch (error) {
        console.error(`❌ 为用户 ${profile.name} 启动${reportType}报告生成异常:`, error)
        return false
      }
    })

    // 等待所有异步生成任务启动（限制并发数量）
    const batchSize = 5 // 每批处理5个用户
    for (let i = 0; i < generatePromises.length; i += batchSize) {
      const batch = generatePromises.slice(i, i + batchSize)
      const batchResults = await Promise.allSettled(batch)
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          successCount++
        }
      })

      // 批次之间稍作延迟，避免服务器压力过大
      if (i + batchSize < generatePromises.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    console.log(`✅ 成功为 ${successCount}/${userProfiles.length} 个用户启动${reportType}报告重新生成`)

    return NextResponse.json({
      success: true,
      count: successCount,
      message: `成功为 ${successCount} 个用户启动${reportType}报告重新生成`
    })

  } catch (error) {
    console.error('❌ 重新生成报告失败:', error)
    return NextResponse.json({
      success: false,
      error: '重新生成报告失败，请稍后重试'
    }, { status: 500 })
  }
} 