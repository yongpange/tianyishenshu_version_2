import { NextRequest, NextResponse } from 'next/server'
import { saveUserProfile, saveUserProfileToUser, createOrGetUser } from '@/lib/user-manager'
import { supabaseAdmin } from '@/lib/supabase'
import { UserInfo } from '@/lib/coze-client'

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, userInfo, isAddingNewUser, targetUserId, inviteCode } = await request.json()

    if (!phoneNumber || !userInfo) {
      return NextResponse.json(
        { error: 'MISSING_FIELDS', message: '缺少必要字段' },
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

    console.log('📝 API: 保存用户资料', { phoneNumber, userInfo, isAddingNewUser, targetUserId, inviteCode })

    let profile
    if (isAddingNewUser && inviteCode) {
      // 新增用户模式：需要获取当前登录用户的ID
      console.log('🔄 新增用户模式开始处理')
      
      // 验证手机号格式
      if (!/^1[3-9]\d{9}$/.test(phoneNumber)) {
        return NextResponse.json(
          { error: 'INVALID_PHONE', message: '手机号格式不正确' },
          { status: 400 }
        )
      }

      // 验证兑换码
      if (!inviteCode || inviteCode.length !== 16) {
        return NextResponse.json(
          { error: 'INVALID_INVITE_CODE', message: '兑换码格式不正确' },
          { status: 400 }
        )
      }

      let actualUserId = targetUserId
      
      // 检查并获取有效的用户ID
      if (!actualUserId || actualUserId === '' || actualUserId === 'null' || actualUserId === 'undefined') {
        console.log('🔍 获取当前登录用户ID，手机号:', phoneNumber)
        try {
          const currentUser = await createOrGetUser(phoneNumber)
          if (!currentUser || !currentUser.id) {
            console.error('❌ 无法获取用户信息')
            return NextResponse.json(
              { error: 'USER_NOT_FOUND', message: '无法获取用户信息' },
              { status: 404 }
            )
          }
          actualUserId = currentUser.id
          console.log('✅ 获取到当前用户ID:', actualUserId)
        } catch (userError) {
          console.error('❌ 获取用户失败:', userError)
          return NextResponse.json(
            { error: 'GET_USER_FAILED', message: '获取用户信息失败' },
            { status: 500 }
          )
        }
      }

      // 再次验证用户ID的有效性
      if (!actualUserId || actualUserId === '' || typeof actualUserId !== 'string' || actualUserId.length < 10) {
        console.error('❌ 用户ID无效:', actualUserId)
        return NextResponse.json(
          { error: 'INVALID_USER_ID', message: '用户ID无效' },
          { status: 400 }
        )
      }

      console.log('🔄 新增用户模式：创建新的用户资料，主用户ID:', actualUserId)
      profile = await saveUserProfileToUser(actualUserId, userInfo, inviteCode)
      console.log('✅ 新增用户资料保存成功:', profile.id)
    } else {
      // 普通模式：根据手机号保存
      if (!/^1[3-9]\d{9}$/.test(phoneNumber)) {
        return NextResponse.json(
          { error: 'INVALID_PHONE', message: '手机号格式不正确' },
          { status: 400 }
        )
      }
     
      console.log('🔄 普通模式：检查是否已有主资料')
      
      // 先检查用户是否已有主资料
      const user = await createOrGetUser(phoneNumber)
      const { data: existingMainProfile, error: checkError } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .is('parent_id', null)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('检查主资料失败:', checkError)
        return NextResponse.json(
          { error: 'DATABASE_ERROR', message: '检查用户资料失败' },
          { status: 500 }
        )
      }

      if (existingMainProfile) {
        console.log('✅ 用户已有主资料，直接返回现有资料:', existingMainProfile.id)
        profile = existingMainProfile
      } else {
        console.log('🔄 用户没有主资料，开始保存')
        profile = await saveUserProfile(phoneNumber, userInfo)
        console.log('✅ 普通用户资料保存成功:', profile.id)
      }
    }

    // 自动生成八字报告
    try {
      console.log('🔮 开始生成八字报告...')
      const baziResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/bazi/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userInfo,
          userId: profile.id,
          isUserProfileId: true
        })
      })

      const baziResult = await baziResponse.json()
      
      if (baziResult.success) {
        console.log('✅ 八字报告生成成功')
        
        // 启动其他报告的异步生成
        console.log('🚀 开始启动其他报告的异步生成...')
        
        const reportGenerationPromises = [
          // 性格报告异步生成
          fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/personality-report/generate-async`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userInfo,
              userId: profile.id,
              isUserProfileId: true
            })
          }).then(response => response.json()).then(result => {
            if (result.success) {
              console.log('✅ 性格报告异步生成已启动:', result.taskId)
            } else {
              console.error('❌ 性格报告异步生成启动失败:', result.error)
            }
            return { type: 'personality', success: result.success }
          }).catch(error => {
            console.error('❌ 性格报告异步生成失败:', error)
            return { type: 'personality', success: false }
          }),

          // 健康报告异步生成
          fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/health-report/generate-async`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userInfo,
              userId: profile.id,
              isUserProfileId: true
            })
          }).then(response => response.json()).then(result => {
            if (result.success) {
              console.log('✅ 健康报告异步生成已启动:', result.taskId)
            } else {
              console.error('❌ 健康报告异步生成启动失败:', result.error)
            }
            return { type: 'health', success: result.success }
          }).catch(error => {
            console.error('❌ 健康报告异步生成失败:', error)
            return { type: 'health', success: false }
          }),

          // 婚恋感情报告异步生成
          fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/marriage-report/generate-async`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userInfo,
              userId: profile.id,
              isUserProfileId: true
            })
          }).then(response => response.json()).then(result => {
            if (result.success) {
              console.log('✅ 婚恋感情报告异步生成已启动:', result.taskId)
            } else {
              console.error('❌ 婚恋感情报告异步生成启动失败:', result.error)
            }
            return { type: 'marriage', success: result.success }
          }).catch(error => {
            console.error('❌ 婚恋感情报告异步生成失败:', error)
            return { type: 'marriage', success: false }
          }),

          // 事业财富报告异步生成
          fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/wealth-report/generate-async`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userInfo,
              userId: profile.id,
              isUserProfileId: true
            })
          }).then(response => response.json()).then(result => {
            if (result.success) {
              console.log('✅ 事业财富报告异步生成已启动:', result.taskId)
            } else {
              console.error('❌ 事业财富报告异步生成启动失败:', result.error)
            }
            return { type: 'wealth', success: result.success }
          }).catch(error => {
            console.error('❌ 事业财富报告异步生成失败:', error)
            return { type: 'wealth', success: false }
          })
        ]

        // 启动所有异步生成任务（不等待完成）
        Promise.allSettled(reportGenerationPromises).then(results => {
          const successful = results.filter(result => 
            result.status === 'fulfilled' && result.value.success
          ).length
          
          console.log(`✅ 成功启动了 ${successful}/${results.length} 个后台报告生成任务`)
        }).catch(error => {
          console.error('❌ 启动后台报告生成任务失败:', error)
        })
        
      } else {
        console.warn('⚠️ 八字报告生成失败，但不影响用户创建:', baziResult.message)
      }
    } catch (baziError) {
      console.warn('⚠️ 八字报告生成异常，但不影响用户创建:', baziError)
    }

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
