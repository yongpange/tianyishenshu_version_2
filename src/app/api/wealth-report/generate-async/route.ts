import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { UserInfo } from '@/lib/coze-client'
import { validateUserInfo, calculateUserDataHash } from '@/utils/client-utils'

// 异步生成请求接口
interface AsyncGenerateWealthRequest {
  userInfo: UserInfo
  userId: string
  isUserProfileId?: boolean // 新增：标识userId是否为user_profiles.id
}

// 异步生成响应接口
interface AsyncGenerateWealthResponse {
  success: boolean
  taskId?: string
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<AsyncGenerateWealthResponse>> {
  try {
    const body: AsyncGenerateWealthRequest = await request.json()
    const { userInfo, userId, isUserProfileId } = body

    console.log('🚀 启动异步事业财富报告生成:', { userId, userInfo, isUserProfileId })

    // 验证请求参数
    if (!userId || !userInfo) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数'
      }, { status: 400 })
    }

    // 验证用户信息完整性
    if (!validateUserInfo(userInfo)) {
      console.error('❌ 用户信息验证失败:', userInfo)
      return NextResponse.json({
        success: false,
        error: '用户信息不完整，请检查所有必填字段'
      }, { status: 400 })
    }

    let userProfileId: string

    if (isUserProfileId === true) {
      // 直接使用传入的userId作为user_profiles.id
      userProfileId = userId
      console.log('✅ 直接使用传入的user_profiles.id:', userProfileId)
    } else {
      // 根据手机号查找user_profiles.id
      console.log('🔍 根据手机号查找user_profiles.id:', userId)
      
      try {
        // 先查找用户
        const { data: user, error: userError } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('phone', userId)
          .single()

        if (userError || !user) {
          console.error('❌ 用户不存在:', userId)
          return NextResponse.json({
            success: false,
            error: '用户不存在，请先注册'
          }, { status: 404 })
        }

        // 再查找用户资料
        const { data: userProfile, error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .select('id')
          .eq('user_id', user.id)
          .is('parent_id', null) // 只查找主用户资料
          .single()

        if (profileError || !userProfile) {
          console.error('❌ 用户资料不存在:', user.id)
          return NextResponse.json({
            success: false,
            error: '用户资料不存在，请先完善个人信息'
          }, { status: 404 })
        }

        userProfileId = userProfile.id
        console.log('✅ 找到用户资料ID:', userProfileId)

      } catch (error) {
        console.error('❌ 查找用户资料过程出错:', error)
        return NextResponse.json({
          success: false,
          error: '查找用户资料失败'
        }, { status: 500 })
      }
    }

    // 生成任务ID
    const taskId = `wealth_task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // 计算用户数据hash
    const userDataHash = calculateUserDataHash(userInfo)

    // 创建或更新报告记录（初始状态）
    try {
      // 检查是否已存在报告
      const { data: existingReport, error: checkError } = await supabaseAdmin
        .from('wealth_reports')
        .select('id')
        .eq('user_id', userProfileId)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ 检查现有报告失败:', checkError)
        return NextResponse.json({
          success: false,
          error: '检查现有报告失败'
        }, { status: 500 })
      }

      if (existingReport) {
        // 更新现有报告
        console.log('🔄 更新现有事业财富报告记录:', existingReport.id)
        const { error: updateError } = await supabaseAdmin
          .from('wealth_reports')
          .update({
            content: '', // 清空内容，表示正在生成
            user_data_hash: userDataHash,
            task_id: taskId,
            status: 'generating',
            progress: 0,
            generated_at: new Date().toISOString()
          })
          .eq('user_id', userProfileId)

        if (updateError) {
          console.error('❌ 更新报告记录失败:', updateError)
          return NextResponse.json({
            success: false,
            error: '更新报告记录失败'
          }, { status: 500 })
        }
      } else {
        // 创建新报告记录
        console.log('🆕 创建新的事业财富报告记录')
        const { error: insertError } = await supabaseAdmin
          .from('wealth_reports')
          .insert({
            id: `wealth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            user_id: userProfileId,
            content: '', // 空内容，表示正在生成
            user_data_hash: userDataHash,
            task_id: taskId,
            status: 'generating',
            progress: 0,
            generated_at: new Date().toISOString()
          })

        if (insertError) {
          console.error('❌ 创建报告记录失败:', insertError)
          return NextResponse.json({
            success: false,
            error: '创建报告记录失败'
          }, { status: 500 })
        }
      }

      console.log('✅ 报告记录创建/更新成功:', { taskId, userProfileId })

    } catch (error) {
      console.error('❌ 操作报告记录失败:', error)
      return NextResponse.json({
        success: false,
        error: '操作报告记录失败'
      }, { status: 500 })
    }

    // 启动后台生成任务（不等待完成）
    // 注意：这里的userId已经是userProfileId了，所以isUserProfileId应该是true
    generateWealthReportInBackground(taskId, userProfileId, userInfo, true).catch(error => {
      console.error('❌ 后台生成任务失败:', error)
    })

    console.log('✅ 异步生成任务已启动:', { taskId, userProfileId, isUserProfileId: true })

    return NextResponse.json({
      success: true,
      taskId: taskId
    })

  } catch (error) {
    console.error('❌ 启动异步生成失败:', error)
    return NextResponse.json({
      success: false,
      error: '启动生成任务失败，请稍后重试'
    }, { status: 500 })
  }
}

// 后台生成报告的函数
async function generateWealthReportInBackground(taskId: string, userId: string, userInfo: UserInfo, isUserProfileId: boolean = false) {
  try {
    console.log('🔄 开始后台生成事业财富报告:', { taskId, userId, isUserProfileId })

    // 计算用户数据hash
    const userDataHash = calculateUserDataHash(userInfo)

    // 更新状态为生成中（兼容旧表结构）
    try {
      await supabaseAdmin
        .from('wealth_reports')
        .update({
          status: 'generating',
          progress: 10
        })
        .eq('task_id', taskId)
    } catch (e) {
      // 如果新字段不存在，跳过状态更新
      console.log('⚠️ 跳过状态更新（表结构不支持）')
    }

    // 调用原有的生成逻辑 - 添加isUserProfileId参数
    console.log('📡 调用generate接口，参数:', { userInfo, userId, isUserProfileId })
    const generateResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/wealth-report/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userInfo, userId, isUserProfileId })
    })

    const result = await generateResponse.json()
    console.log('📋 generate接口响应:', result)

    if (result.success) {
      // 更新状态为完成
      try {
        await supabaseAdmin
          .from('wealth_reports')
          .update({
            status: 'completed',
            progress: 100
          })
          .eq('task_id', taskId)
      } catch (e) {
        console.log('⚠️ 跳过状态更新（表结构不支持）')
      }
      
      console.log('✅ 后台生成事业财富报告成功:', taskId)
    } else {
      // 更新状态为失败
      try {
        await supabaseAdmin
          .from('wealth_reports')
          .update({
            status: 'failed',
            progress: 0,
            error_message: result.error || '生成失败'
          })
          .eq('task_id', taskId)
      } catch (e) {
        console.log('⚠️ 跳过状态更新（表结构不支持）')
      }
      
      console.error('❌ 后台生成事业财富报告失败:', result.error)
    }

  } catch (error) {
    console.error('❌ 后台生成事业财富报告异常:', error)
    
    // 更新状态为失败
    try {
      await supabaseAdmin
        .from('wealth_reports')
        .update({
          status: 'failed',
          progress: 0,
          error_message: error instanceof Error ? error.message : '生成异常'
        })
        .eq('task_id', taskId)
    } catch (e) {
      console.log('⚠️ 跳过状态更新（表结构不支持）')
    }
  }
}
