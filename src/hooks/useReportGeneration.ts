import { useState, useCallback } from 'react'
import { message } from 'antd'
import { ReportModuleConfig } from '@/config/reportModules'
import { getUserPhoneNumber, getActiveUser } from '@/utils/client-utils'

interface UseReportGenerationProps {
  moduleConfig: ReportModuleConfig
  userInfo: any
}

interface ReportGenerationState {
  reportContent: string | null
  reportLoading: boolean
  reportError: string | null
  isGenerating: boolean
  generationProgress: number
  generationStatus: string
  taskId: string | null
}

export const useReportGeneration = ({ moduleConfig, userInfo }: UseReportGenerationProps) => {
  const [state, setState] = useState<ReportGenerationState>({
    reportContent: null,
    reportLoading: true,
    reportError: null,
    isGenerating: false,
    generationProgress: 0,
    generationStatus: '',
    taskId: null
  })

  // 加载报告
  const loadReport = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, reportLoading: true, reportError: null }))

      // 优先从当前激活用户获取信息
      const activeUser = getActiveUser()
      let reportUserId: string
      let isUserProfileId = false

      console.log('🔍 开始确定用户身份:', { activeUser, moduleId: moduleConfig.moduleId })

      if (activeUser && activeUser.id) {
        // 激活子用户模式：使用激活用户的user_profiles.id
        reportUserId = activeUser.id
        isUserProfileId = true
        console.log('📋 激活子用户模式：使用激活用户的user_profiles.id:', reportUserId)
      } else {
        // 备用方案：从URL参数中获取userId
        const searchParams = new URLSearchParams(window.location.search)
        const urlUserId = searchParams.get('userId')
        
        console.log('🔍 URL参数检查:', { urlUserId })
        
        if (urlUserId) {
          // 子用户模式：使用URL中的user_profiles.id
          reportUserId = urlUserId
          isUserProfileId = true
          console.log('📋 子用户模式：使用URL中的user_profiles.id:', reportUserId)
        } else {
          // 主用户模式：使用手机号
          const phoneNumber = getUserPhoneNumber()
          console.log('📱 获取到的手机号:', phoneNumber)
          
          if (!phoneNumber) {
            setState(prev => ({ ...prev, reportError: '未找到用户信息，请重新登录', reportLoading: false }))
            return
          }
          reportUserId = phoneNumber
          console.log('📋 主用户模式：使用手机号:', reportUserId)
        }
      }

      console.log('📖 开始获取报告:', { reportUserId, isUserProfileId, moduleId: moduleConfig.moduleId })

      // 使用模块配置的API端点获取报告
      const response = await fetch(`${moduleConfig.apiEndpoint}/get`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: reportUserId,
          isUserProfileId: isUserProfileId
        })
      })

      const result = await response.json()
      console.log('📋 API响应结果:', { 
        success: result.success, 
        error: result.error, 
        hasReport: !!result.report,
        reportContentLength: result.report?.content?.length || 0
      })

      if (result.success && result.report) {
        console.log('✅ 成功获取报告:', {
          contentLength: result.report.content?.length || 0,
          generatedAt: result.report.generatedAt,
          reportUserId: reportUserId,
          isUserProfileId: isUserProfileId
        })
        setState(prev => ({ 
          ...prev, 
          reportContent: result.report.content,
          reportLoading: false,
          reportError: null
        }))
      } else {
        console.log('❌ 获取报告失败:', { 
          error: result.error, 
          reportUserId: reportUserId,
          isUserProfileId: isUserProfileId 
        })
        setState(prev => ({ 
          ...prev, 
          reportError: result.error || `${moduleConfig.title}报告未生成，请返回信息填写页重新生成`,
          reportLoading: false
        }))
      }
    } catch (error) {
      console.error('❌ 加载报告失败:', error)
      setState(prev => ({ 
        ...prev, 
        reportError: '加载报告失败，请稍后重试',
        reportLoading: false
      }))
    }
  }, [moduleConfig, userInfo])

  // 转换用户信息为标准格式
  const convertUserInfoFormat = useCallback((rawUserInfo: any) => {
    if (!rawUserInfo) return null

    // 如果已经是标准格式，直接返回
    if (rawUserInfo.area && typeof rawUserInfo.area === 'object') {
      return rawUserInfo
    }

    // 转换格式（处理激活用户的格式）
    return {
      year: rawUserInfo.year,
      month: rawUserInfo.month,
      day: rawUserInfo.day,
      hour: rawUserInfo.hour,
      minute: rawUserInfo.minute,
      gender: rawUserInfo.gender,
      nickname: rawUserInfo.name || rawUserInfo.nickname,
      area: {
        province: rawUserInfo.area_province || '',
        city: rawUserInfo.area_city || '',
        district: rawUserInfo.area_district || ''
      }
    }
  }, [])

  // 重新生成报告
  const regenerateReport = useCallback(async () => {
    try {
      console.log('🔄 开始重新生成报告...', moduleConfig.moduleId)

      // 防止重复点击
      if (state.isGenerating) {
        console.log('⚠️ 报告正在生成中，忽略重复点击')
        return
      }

      // 获取用户信息
      if (!userInfo) {
        console.error('❌ 用户信息缺失')
        message.error('用户信息缺失，请刷新页面重试')
        return
      }

      // 转换用户信息格式
      const convertedUserInfo = convertUserInfoFormat(userInfo)
      if (!convertedUserInfo) {
        console.error('❌ 用户信息转换失败')
        message.error('用户信息格式错误，请刷新页面重试')
        return
      }

      console.log('📝 转换后的用户信息:', convertedUserInfo)

      // 确定用户ID和模式
      const activeUser = getActiveUser()
      let reportUserId: string
      let isUserProfileId = false

      if (activeUser && activeUser.id) {
        // 激活子用户模式：使用激活用户的user_profiles.id
        reportUserId = activeUser.id
        isUserProfileId = true
        console.log('📋 重新生成-子用户模式：使用激活用户的user_profiles.id:', reportUserId)
      } else {
        // 主用户模式：使用手机号
        const phoneNumber = getUserPhoneNumber()
        if (!phoneNumber) {
          console.error('❌ 无法获取用户手机号')
          message.error('未找到用户信息，请重新登录')
          return
        }
        reportUserId = phoneNumber
        console.log('📋 重新生成-主用户模式：使用手机号:', reportUserId)
      }

      // 启动异步生成
      setState(prev => ({ 
        ...prev, 
        isGenerating: true, 
        generationProgress: 0,
        generationStatus: '正在准备生成...',
        reportError: null
      }))

      const response = await fetch(`${moduleConfig.apiEndpoint}/generate-async`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userInfo: convertedUserInfo, // 使用转换后的用户信息
          userId: reportUserId,
          isUserProfileId: isUserProfileId
        })
      })

      const result = await response.json()
      
      if (result.success && result.taskId) {
        setState(prev => ({ ...prev, taskId: result.taskId }))
        console.log('✅ 异步生成任务启动成功:', result.taskId)
        
        // 开始轮询状态
        pollGenerationStatus(result.taskId, reportUserId, isUserProfileId)
      } else {
        console.error('❌ 启动异步生成失败:', result.error)
        setState(prev => ({ 
          ...prev, 
          isGenerating: false,
          reportError: result.error || '启动生成失败，请稍后重试'
        }))
        message.error(result.error || '启动生成失败，请稍后重试')
      }

    } catch (error) {
      console.error('❌ 重新生成报告失败:', error)
      setState(prev => ({ 
        ...prev, 
        isGenerating: false,
        reportError: '生成失败，请稍后重试'
      }))
      message.error('生成失败，请稍后重试')
    }
  }, [moduleConfig, userInfo, convertUserInfoFormat])

  // 轮询生成状态
  const pollGenerationStatus = useCallback(async (taskId: string, userId: string, isUserProfileId: boolean = false) => {
    const maxAttempts = 60 // 最多轮询60次（5分钟）
    let attempts = 0

    const poll = async () => {
      try {
        attempts++
        console.log(`🔄 轮询生成状态 (${attempts}/${maxAttempts}):`, taskId)
        console.log(`📡 状态查询参数:`, { userId, taskId, isUserProfileId, apiEndpoint: moduleConfig.apiEndpoint })

        const response = await fetch(`${moduleConfig.apiEndpoint}/status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, taskId, isUserProfileId })
        })

        const result = await response.json()
        console.log('📊 状态轮询结果:', result)

        if (result.success) {
          setState(prev => ({ 
            ...prev, 
            generationProgress: result.progress || 0,
            generationStatus: result.message || '正在生成中...'
          }))

          if (result.status === 'completed') {
            console.log('✅ 报告生成完成')
            setState(prev => ({ 
              ...prev, 
              isGenerating: false,
              generationProgress: 100,
              generationStatus: '生成完成'
            }))
            
            // 重新加载报告
            setTimeout(() => {
              loadReport()
            }, 1000)
            
            message.success(`${moduleConfig.title}报告生成完成！`)
            return
          } else if (result.status === 'failed') {
            console.error('❌ 报告生成失败:', result.error)
            setState(prev => ({ 
              ...prev, 
              isGenerating: false,
              reportError: result.error || '生成失败'
            }))
            message.error(result.error || '生成失败，请稍后重试')
            return
          }
        }

        // 继续轮询
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000) // 5秒后再次轮询
        } else {
          console.warn('⚠️ 轮询超时')
          setState(prev => ({ 
            ...prev, 
            isGenerating: false,
            reportError: '生成超时，请稍后重试'
          }))
          message.error('生成超时，请稍后重试')
        }

      } catch (error) {
        console.error('❌ 状态轮询失败:', error)
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000) // 出错后也继续轮询
        } else {
          setState(prev => ({ 
            ...prev, 
            isGenerating: false,
            reportError: '生成状态检查失败'
          }))
          message.error('生成状态检查失败，请稍后重试')
        }
      }
    }

    // 开始轮询
    setTimeout(poll, 2000) // 2秒后开始第一次轮询
  }, [moduleConfig, loadReport])

  return {
    ...state,
    loadReport,
    regenerateReport
  }
}
