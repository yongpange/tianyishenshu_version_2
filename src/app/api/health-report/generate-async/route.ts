import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { UserInfo } from '@/lib/coze-client'
import { validateUserInfo, calculateUserDataHash } from '@/utils/client-utils'

// 异步生成请求接口
interface AsyncGenerateHealthRequest {
  userInfo: UserInfo
  userId: string
  isUserProfileId?: boolean
}

// 异步生成响应接口
interface AsyncGenerateHealthResponse {
  success: boolean
  taskId?: string
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<AsyncGenerateHealthResponse>> {
  try {
    const body: AsyncGenerateHealthRequest = await request.json()
    const { userInfo, userId, isUserProfileId } = body

    console.log('🚀 启动异步身体健康报告生成:', { userId, userInfo, isUserProfileId })

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
      userProfileId = userId
      console.log('✅ 直接使用传入的user_profiles.id:', userProfileId)
    } else {
      console.log('🔍 根据手机号查找user_profiles.id:', userId)
      
      try {
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

        const { data: userProfile, error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .select('id')
          .eq('user_id', user.id)
          .is('parent_id', null)
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
    const taskId = `health_task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // 计算用户数据hash
    const userDataHash = calculateUserDataHash(userInfo)

    // 创建或更新报告记录（初始状态）
    try {
      const { data: existingReport, error: checkError } = await supabaseAdmin
        .from('health_reports')
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
        console.log('🔄 更新现有身体健康报告记录:', existingReport.id)
        const { error: updateError } = await supabaseAdmin
          .from('health_reports')
          .update({
            content: '',
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
        console.log('🆕 创建新的身体健康报告记录')
        const { error: insertError } = await supabaseAdmin
          .from('health_reports')
          .insert({
            id: `health_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            user_id: userProfileId,
            content: '',
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

    // 启动后台生成任务
    generateHealthReportInBackground(taskId, userProfileId, userInfo, true).catch(error => {
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
async function generateHealthReportInBackground(taskId: string, userId: string, userInfo: UserInfo, isUserProfileId: boolean = false) {
  try {
    console.log('🔄 开始后台生成身体健康报告:', { taskId, userId, isUserProfileId })

    // 更新状态为生成中
    try {
      await supabaseAdmin
        .from('health_reports')
        .update({
          status: 'generating',
          progress: 10
        })
        .eq('task_id', taskId)
    } catch (e) {
      console.log('⚠️ 跳过状态更新（表结构不支持）')
    }

    // 调用原有的生成逻辑
    console.log('📡 调用generate接口，参数:', { userInfo, userId, isUserProfileId })
    const generateResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/health-report/generate`, {
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
          .from('health_reports')
          .update({
            status: 'completed',
            progress: 100
          })
          .eq('task_id', taskId)
      } catch (e) {
        console.log('⚠️ 跳过状态更新（表结构不支持）')
      }
      
      console.log('✅ 后台生成身体健康报告成功:', taskId)
    } else {
      // 更新状态为失败
      try {
        await supabaseAdmin
          .from('health_reports')
          .update({
            status: 'failed',
            progress: 0,
            error_message: result.error || '生成失败'
          })
          .eq('task_id', taskId)
      } catch (e) {
        console.log('⚠️ 跳过状态更新（表结构不支持）')
      }
      
      console.error('❌ 后台生成身体健康报告失败:', result.error)
    }

  } catch (error) {
    console.error('❌ 后台生成身体健康报告异常:', error)
    
    // 更新状态为失败
    try {
      await supabaseAdmin
        .from('health_reports')
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
