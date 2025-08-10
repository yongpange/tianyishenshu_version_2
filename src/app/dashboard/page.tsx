'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, Avatar, Button, message, Divider, Spin, Collapse, Tag, Tooltip } from 'antd'
import {
  UserOutlined,
  WechatOutlined,
  UsergroupAddOutlined,
  SettingOutlined,
  MessageOutlined,
  DownOutlined,
  RightOutlined,
  CrownOutlined,
  SecurityScanOutlined,
  LockOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons'
import { PermissionGuard, usePermissionCheck } from '@/components/PermissionGuard'
import { useGlobalSessionManager } from '@/hooks/useGlobalSessionManager'

// 直接导入页面组件
import AstrologyPage from '@/app/astrology/page'
import PersonalityPage from '@/app/personality/page'
import WealthPage from '@/app/wealth/page'
import MarriagePage from '@/app/marriage/page'
import HealthPage from '@/app/health/page'
import AddUserPage from '@/components/AddUserPage'
import AddUserProfilePage from '@/components/AddUserProfilePage'
import { devLog } from '@/utils/dev-logger'
import TianIcon from '@/components/icons/TianIcon'
import GenIcon from '@/components/icons/GenIcon'
import ZhexianIcon from '@/components/icons/ZhexianIcon'
// 导入所有天干图标
import JiaIcon from '@/components/icons/JiaIcon'
import YiIcon from '@/components/icons/YiIcon'
import BingIcon from '@/components/icons/BingIcon'
import DingIcon from '@/components/icons/DingIcon'
import WuIcon from '@/components/icons/WuIcon'
import JiIcon from '@/components/icons/JiIcon'
import XinIcon from '@/components/icons/XinIcon'
import RenIcon from '@/components/icons/RenIcon'
import KuiIcon from '@/components/icons/kuiIcon'

export default function DashboardPage() {
  const [userInfo, setUserInfo] = useState<any>(null)
  const [mainUser, setMainUser] = useState<any>(null)
  const [childUsers, setChildUsers] = useState<any[]>([])
  const [activeUser, setActiveUser] = useState<any>(null)
  const [currentView, setCurrentView] = useState<string>('dashboard') // 'dashboard', 'astrology', 'personality', etc.
  const [userListCollapsed, setUserListCollapsed] = useState<boolean>(true) // 用户列表折叠状态
  const [baziData, setBaziData] = useState<any>(null) // 当前用户八字数据
  const [allUsersBaziData, setAllUsersBaziData] = useState<{[key: string]: any}>({}) // 所有用户八字数据
  const router = useRouter()
  
  // 使用权限检查Hook
  const {
    userRole,
    canView,
    canGenerate,
    canChat,
    canAccessModule,
    isAdmin,
    isVip,
    isAdminOrVip,
    loading: permissionsLoading
  } = usePermissionCheck()
  
  // 全局会话管理
  const globalSessionManager = useGlobalSessionManager()

  // 天干图标映射函数
  const getTianganIcon = (tiangan: string, iconProps?: any) => {
    const defaultProps = { width: 50, height: 50, className: "text-green-600 transform translate-y-2 translate-x-1" }
    const finalProps = { ...defaultProps, ...iconProps }
    
    switch (tiangan) {
      case '甲': return <JiaIcon {...finalProps} />
      case '乙': return <YiIcon {...finalProps} />
      case '丙': return <BingIcon {...finalProps} />
      case '丁': return <DingIcon {...finalProps} />
      case '戊': return <WuIcon {...finalProps} />
      case '己': return <JiIcon {...finalProps} />
      case '庚': return <GenIcon {...finalProps} />
      case '辛': return <XinIcon {...finalProps} />
      case '壬': return <RenIcon {...finalProps} />
      case '癸': return <KuiIcon {...finalProps} />
      default: return <GenIcon {...finalProps} /> // 默认图标
    }
  }

  // 获取用户八字数据
  const fetchUserBaziData = async (userId: string, setAsActive: boolean = true) => {
    try {
      const response = await fetch('/api/bazi/get', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          isUserProfileId: true
        })
      })

      const data = await response.json()
      if (data.success && data.report) {
        // 更新所有用户的八字数据
        setAllUsersBaziData(prev => ({
          ...prev,
          [userId]: data.report
        }))
        
        // 如果是当前激活用户，也更新单独的baziData状态
        if (setAsActive) {
          setBaziData(data.report)
        }
        
        devLog.log('✅ 获取八字数据成功:', data.report)
      } else {
        devLog.warn('⚠️ 未能获取八字数据:', data.message)
        if (setAsActive) {
          setBaziData(null)
        }
      }
    } catch (error) {
      devLog.error('❌ 获取八字数据失败:', error)
      if (setAsActive) {
        setBaziData(null)
      }
    }
  }

  // 批量获取所有用户的八字数据
  const fetchAllUsersBaziData = async (users: any[]) => {
    const fetchPromises = users.map(user => 
      fetchUserBaziData(user.id, false)
    )
    await Promise.allSettled(fetchPromises)
  }

  useEffect(() => {
    // 检查登录状态并获取用户信息
    const loginData = localStorage.getItem('loginData')
    if (!loginData) {
      // 如果没有登录信息，跳转到登录页面
      router.push('/login')
      return
    }

    // 验证用户是否仍然存在于数据库
    const verifyUserExistence = async () => {
      try {
        const parsed = JSON.parse(loginData)
        const phone = parsed.phoneNumber
        
        const response = await fetch('/api/auth/verify-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone })
        })

        if (!response.ok) {
          // API调用失败，但不清除登录状态
          devLog.warn('用户验证API调用失败，状态码:', response.status)
          if (response.status >= 500) {
            // 服务器错误：保持登录状态
            devLog.warn('服务器错误，保持当前登录状态')
            return true
          }
          if (response.status === 401 || response.status === 403) {
            // 明确的认证错误：清除登录状态
            devLog.log('认证失败，清除登录状态')
            localStorage.removeItem('loginData')
            localStorage.removeItem('userData')
            localStorage.removeItem('activeUser')
            sessionStorage.clear()
            router.push('/login')
            return false
          }
          // 其他错误：保持登录状态
          return true
        }

        const result = await response.json()

        if (!result.success || !result.exists) {
          devLog.log('用户验证失败，清除登录状态', result.message)
          // 清除所有本地存储的登录信息
          localStorage.removeItem('loginData')
          localStorage.removeItem('userData')
          localStorage.removeItem('activeUser')
          sessionStorage.clear()

          // 跳转到登录页
          router.push('/login')
          return false
        }
        
        devLog.log('用户验证通过')
        return true
      } catch (error) {
        devLog.error('用户验证过程出错:', error)

        // 区分错误类型，只有明确的认证错误才清除登录状态
        if (error instanceof TypeError && error.message.includes('fetch')) {
          // 网络错误：保持登录状态，显示提示
          devLog.warn('网络连接问题，保持当前登录状态')
          return true // 允许继续使用，但可能功能受限
        }

        // 其他未知错误：记录但不清除状态，允许用户继续使用
        devLog.warn('验证请求失败，保持当前状态，用户可继续使用')
        return true
      }
    }

    // 初始化函数
    const initializeDashboard = async () => {
      // 先验证用户存在
      const isValid = await verifyUserExistence();
      if (!isValid) return;

      // 用户验证通过，继续原有的初始化逻辑
    // 检查是否有待生成的报告
    const pendingReportsData = sessionStorage.getItem('pending_reports_data')
    if (pendingReportsData) {
      try {
        const { userInfo, userId, isUserProfileId } = JSON.parse(pendingReportsData)
        devLog.log('🚀 检测到待生成报告，启动异步生成...', { userId, isUserProfileId })
        
        // 启动其他报告的异步生成
        const reportPromises = [
          // 身体健康报告
          fetch('/api/health-report/generate-async', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userInfo, userId, isUserProfileId })
          }).then(response => response.json()).then(result => {
            if (result.success) {
              devLog.log('身体健康报告异步生成已启动', result.taskId)
            } else {
              devLog.error('身体健康报告异步生成启动失败:', result.error)
            }
            return { type: 'health', success: result.success }
          }).catch(error => {
            devLog.error('?身体健康报告异步生成失败:', error)
            return { type: 'health', success: false }
          }),
        ]
          // 事业财富报告
          fetch('/api/wealth-report/generate-async', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userInfo, userId, isUserProfileId })
          }).then(response => response.json()).then(result => {
            if (result.success) {
              devLog.log('事业财富报告异步生成已启动', result.taskId)
            } else {
              devLog.error('事业财富报告异步生成启动失败:', result.error)
            }
            return { type: 'wealth', success: result.success }
          }).catch(error => {
            devLog.error('事业财富报告异步生成失败:', error)
            return { type: 'wealth', success: false }
          }),

          // 婚恋感情报告
          fetch('/api/marriage-report/generate-async', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userInfo, userId, isUserProfileId })
          }).then(response => response.json()).then(result => {
            if (result.success) {
              devLog.log('婚恋感情报告异步生成已启动', result.taskId)

            } else {
              devLog.error('婚恋感情报告异步生成启动失败:', result.error)
            }
            return { type: 'marriage', success: result.success }
          }).catch(error => {
            devLog.error('婚恋感情报告异步生成失败:', error)
            return { type: 'marriage', success: false }
          }),


        // 等待所有异步生成任务启动
        Promise.allSettled(reportPromises).then(results => {
          const successful = results.filter(result => 
            result.status === 'fulfilled' && result.value.success
          ).length
          
          devLog.log(`成功启动${successful}/${results.length} 个后台报告生成任务`)
          
          if (successful > 0) {
            message.success(`已启动${successful} 个报告的后台生成，请稍后查看`)
          }
        })

        // 清理sessionStorage中的数据
        sessionStorage.removeItem('pending_reports_data')
        
      } catch (error) {
        devLog.error('启动后台报告生成失败:', error)
        sessionStorage.removeItem('pending_reports_data')
      }
    }

    try {
      const parsed = JSON.parse(loginData)
      devLog.log('Dashboard检查登录数据', parsed)

      // 检查登录数据中是否包含完整的用户资料
      if (parsed.user?.profile_data) {
        devLog.log('发现登录时已有的用户资料:', parsed.user.profile_data)
        // 将登录时获取的资料转换为userInfo格式
        const userInfoFromLogin = {
          nickname: parsed.user.profile_data.name,
          gender: parsed.user.profile_data.gender === 'male' ? '男' : 
                  parsed.user.profile_data.gender === 'female' ? '女' : parsed.user.profile_data.gender,
          year: parsed.user.profile_data.year,
          month: parsed.user.profile_data.month,
          day: parsed.user.profile_data.day,
          hour: parsed.user.profile_data.hour,
          minute: parsed.user.profile_data.minute,
          area: parsed.user.profile_data.area
        }
        setUserInfo(userInfoFromLogin)
      } else {
        // 检查localStorage中是否有手动填写的userData
        const userData = localStorage.getItem('userData')
        if (userData) {
          devLog.log('发现localStorage中的用户资料:', JSON.parse(userData))
          setUserInfo(JSON.parse(userData))
        } else {
          // 如果既没有登录时的资料，也没有手动填写的资料，跳转到profile页面
          devLog.log('未找到用户资料，跳转到profile页面')
          router.push('/profile')       
          return
        }
      }
    } catch (error) {
      devLog.error('解析登录数据失败:', error)
      router.push('/login')
      return
    }
      
      // 加载用户层级结构
      loadUserHierarchy()
    }

    // 启动初始化
    initializeDashboard()
    
    // 监听页面焦点，当从其他页面返回时重新加载用户列表
    const handleFocus = () => {
      loadUserHierarchy()
    }
    
    window.addEventListener('focus', handleFocus)
    
    // 定期刷新用户列表（每30秒）
    const interval = setInterval(loadUserHierarchy, 30000)
    
    // 定期验证用户是否仍然存在（每30秒）
    const verifyInterval = setInterval(async () => {
      await verifyUserExistence()
    }, 30000)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      clearInterval(interval)
      clearInterval(verifyInterval)
    }
  }, [router])

  // 加载用户层级结构
  const loadUserHierarchy = async () => {
    try {
      const loginData = localStorage.getItem('loginData')
      if (!loginData) return

      const parsed = JSON.parse(loginData)
      const currentUserPhone = parsed.phoneNumber
      
      if (!currentUserPhone) return

      const response = await fetch('/api/user-profiles/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: currentUserPhone })
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          const profiles = result.data
          
          // 找到主账号（parent_id 为 null）
          const mainProfile = profiles.find((profile: any) => profile.parent_id === null)
          setMainUser(mainProfile)
          
          // 找到所有子账号（parent_id 为主账号 id）并按创建时间升序排序
          const childProfiles = profiles
            .filter((profile: any) => profile.parent_id === mainProfile?.id)
            .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          setChildUsers(childProfiles)
          
          // 设置当前激活的用户（优先使用localStorage中保存的，否则使用主账户）
          const savedActiveUser = localStorage.getItem('activeUser')
          if (savedActiveUser) {
            try {
              const parsedActiveUser = JSON.parse(savedActiveUser)
              // 验证该用户是否仍在列表中（主账户或子账户）
              const isMainUser = parsedActiveUser.id === mainProfile?.id
              const isValidChildUser = childProfiles.find((profile: any) => profile.id === parsedActiveUser.id)
              
              if (isMainUser || isValidChildUser) {
                // 对于已保存的有效用户，直接设置，无需重新生成token
                setActiveUser(parsedActiveUser)
              } else if (mainProfile) {
                // 如果保存的用户不在列表中，使用主账户并生成token
                await setActiveUserWithToken(mainProfile)
              }
            } catch (error) {
              // 如果解析失败，使用主账户并生成token
              if (mainProfile) {
                await setActiveUserWithToken(mainProfile)
              }
            }
          } else if (mainProfile) {
            // 如果没有保存的用户，使用主账户并生成token
            await setActiveUserWithToken(mainProfile)
          }
          
          // 批量获取所有用户的八字数据
          const allUsers = [mainProfile, ...childProfiles].filter(Boolean)
          if (allUsers.length > 0) {
            await fetchAllUsersBaziData(allUsers)
          }
        }
      }
    } catch (error) {
      devLog.error('加载用户层级结构失败:', error)
    }
  }

  // 辅助函数：设置activeUser并确保生成OAuth token
  const setActiveUserWithToken = async (user: any, showMessage: boolean = false) => {
    setActiveUser(user)
    localStorage.setItem('activeUser', JSON.stringify(user))
    
    if (showMessage) {
      message.success(`已切换到${user.name}`)
    }
    
    // 为设置的用户确保生成OAuth token
    try {
      devLog.log('🔑 为用户检查并生成OAuth Token:', user.id)
      
      // 动态导入ensureUserCozeToken函数
      const { ensureUserCozeToken } = await import('@/lib/coze-auth')
      const tokenResult = await ensureUserCozeToken(user.id)
      
      if (tokenResult.success) {
        devLog.log('用户OAuth Token准备完成:', tokenResult.message)
      } else {
        devLog.warn('⚠️ 用户OAuth Token生成失败:', tokenResult.message)
        // 不阻止操作，只记录警报
      }
    } catch (tokenError) {
      devLog.error('生成用户OAuth Token失败:', tokenError)
      // 不阻止操作，只记录错误
    }
    
    // 触发用户切换事件，通知权限系统重新获取权限
    window.dispatchEvent(new Event('userSwitched'))
    
    // 获取用户八字数据
    await fetchUserBaziData(user.id)
  }

  // 处理用户切换
  const handleUserSwitch = async (user: any) => {
    await setActiveUserWithToken(user, true)
    
    // 触发自定义事件，通知其他页面用户已切换
    window.dispatchEvent(new Event('userSwitched'))
  }

  // 获取用户显示列表（当前用户不在列表中，主账户排第一个，其他按创建时间升序）
  const getUserDisplayList = () => {
    const displayList = []
    
    // 主账户不是当前用户时，排在第一
    if (mainUser && activeUser?.id !== mainUser.id) {
      displayList.push(mainUser)
    }
    
    // 添加不是当前用户的子账户，按创建时间升序排列
    const availableChildUsers = childUsers.filter(user => user.id !== activeUser?.id)
    displayList.push(...availableChildUsers)
    
    return displayList
  }

  // 渲染模块图标函数
  const renderModuleIcon = (module: any) => {
    if (module.id === 'astrology') {
      return (
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" x="0px"
          y="0px" viewBox="0 0 155.871 155.871" xmlSpace="preserve" width="84" height="84">
          <g>
            <g>
              <path style={{ fill: "#CC2C1F" }} d="M129.162,8.729c-0.602-0.27-1.31-0.588-1.845-0.827c-3.928,1.422-7.608-0.582-11.316-0.054
                c-0.657,0.094-1.373-0.221-2.271-0.386c-0.54,0.117-1.053,0.314-1.57,0.327c-4.82,0.121-9.647,0.398-14.455,0.435
                c-23.139,0.181-26.28,0.083-49.42,0.055c-1.321-0.002-2.673-0.5-3.957-0.342c-2.437,0.3-4.834,0.913-7.252,1.379
                c-0.15,0.029-0.327-0.081-0.491-0.128c0.064-0.161,0.128-0.322,0.252-0.631c-3.09-1.605-6.185-0.2-9.265-0.139
                c-0.283,0.544-0.525,1.01-0.609,1.172c0,1.088,0.019,1.85-0.006,2.611c-0.023,0.708-0.17,1.419-0.125,2.121
                c0.084,1.322,0.357,2.636,0.387,3.957c0.062,2.689,0.014,5.381,0.012,8.072c-0.002,2.78-0.001,5.561-0.005,8.341
                c-0.004,2.691-0.024,5.381-0.015,8.072c0.01,2.735-0.066,5.467-0.031,8.204c0.093,7.085,0.059,14.171,0.061,21.256
                c0.004,23.23,0.002,46.46,0.002,69.868c-2.496,1.541-0.026,3.406-0.447,5.42c1.648,0.272,3.111,0.709,4.574,0.711
                c2.302,0.002,4.643,0.404,6.916-0.37c0.312-0.106,0.707,0.012,1.061,0.049c0.967,0.104,1.931,0.298,2.898,0.316
                c2.69,0.05,5.381,0.034,8.072,0.034c27.266,0.004,34.532,0.007,61.798,0.009c2.063,0,4.139-0.157,6.184,0.032
                c2.066,0.191,4.104,0.116,6.156-0.009c1.712-0.104,3.364-0.33,4.393-1.894c0-4.11,0-8.143,0-12.175
                c0-0.09-0.004-0.179-0.011-0.269c-0.315-4.344-0.71-8.684-0.913-13.034c-0.107-2.302,0.002-4.603,0.321-6.927
                c0.363-2.643,0.121-5.37,0.123-8.061c0.012-16.324,0.016-32.648,0.029-48.971c0.001-1.345-0.136-2.725,0.109-4.028
                c0.612-3.241,1.019-6.485,0.987-9.788c-0.048-5.022-0.062-10.045-0.062-15.068c0-3.946-0.259-7.925,0.173-11.826
                C129.888,13.703,129.811,11.332,129.162,8.729z M103.118,145.563c-0.646,0.235-1.365,0.272-2.251,0.433
                c-1.741-0.258-3.717-0.552-6.212-0.922c0.798-0.559,1.122-0.982,1.453-0.988c2.938-0.052,5.877-0.03,8.816-0.03
                c0.083,0.147,0.165,0.293,0.248,0.44C104.491,144.859,103.837,145.301,103.118,145.563z M123.971,80.57
                c-0.629,3.656-0.334,7.313-0.406,10.969c-0.069,3.476,0.352,6.963-0.464,10.421c-0.241,1.021-0.062,2.144-0.062,3.22
                c-0.004,9.774-0.025,19.549,0.015,29.323c0.005,1.214,0.329,2.426,0.468,3.389c-1.08,1.931-2.06,3.683-3.14,5.613
                c-3.967-0.337-8.083,0.566-12.144-0.517c-0.169-0.045-0.357-0.019-0.536-0.027c-4.458-0.189-8.916-0.382-13.374-0.563
                c-0.713-0.029-1.429-0.004-2.062-0.004c-0.367,0.428-0.644,0.751-0.932,1.086c-1.093,0-2.167,0-3.32,0
                c-0.464-0.329-0.965-0.685-1.568-1.113c-4.276,0.303,11.349-0.255,6.976,0.434c-2.014,0.317-4.133-0.088-6.176,0.12
                c-5.973,0.608-11.96,0.576-17.949,0.64c-2.399,0.026-4.824,0.537-7.19,0.319c-7.332-0.676-14.665-0.293-21.997-0.356
                c-1.475-0.013-2.963,0.347-4.636-0.265c-1.633-1.176-1.616-3.712-3.914-4.313c1.119-3.989,0.687-7.937,0.39-11.8
                c-0.295-3.842-0.182-7.674-0.397-11.504c-0.109-1.952-0.337-3.896-0.47-5.847c-0.239-3.502,0.455-6.898,1.2-10.29
                c0.169-0.771,0.409-1.616,0.258-2.353c-0.683-3.325-0.81-6.694-1.136-10.054c-0.338-3.489-0.295-6.957-0.283-10.43
                c0.012-3.384,0.293-6.768,0.484-10.151c0.024-0.429,0.194-0.858,0.34-1.272c0.888-2.506,0.859-5.014,0.377-7.623
                c-0.449-2.434-0.682-4.934-0.733-7.411c-0.115-5.557-0.038-11.119-0.08-16.678c-0.016-2.042,0.088-4.066-0.362-6.123
                c-0.437-1.999,0.005-4.061,0.638-6.046c0.365-1.144,0.798-2.27,0.524-3.575c-0.21-0.997,0.403-1.862,1.194-2.515
                c0.599-0.493,1.209-0.973,1.922-1.545c0.814,0.127,1.693,0.272,2.683,0.152c2.479-0.3,5.012-0.129,7.52-0.224
                c1.231-0.047,2.455-0.282,3.684-0.404c1.627-0.161,3.233-0.231,4.331,1.771c2.173-0.227,4.46-0.567,6.757-0.681
                c2.954-0.146,5.917-0.079,8.875-0.167c1.235-0.037,2.464-0.249,3.698-0.361c0.445-0.04,0.926-0.125,1.339-0.007
                c2.461,0.704,4.98,0.406,7.467,0.414c10.939,0.034,1.881,0.069,12.818-0.11c2.384-0.039,4.753,0.132,7.128,0.07
                c5.268-0.138,10.536-0.318,15.804-0.466c1.162-0.033,2.326-0.005,3.342-0.005c1.637,0.866,2.161,2.396,2.556,3.794
                c0.476,1.683,0.667,3.505,0.637,5.261c-0.069,4.012-0.098,8.052-0.601,12.023c-0.769,6.076-0.279,12.152-0.451,18.224
                c-0.099,3.494-0.109,7,0.058,10.49c0.187,3.903,0.665,7.792,0.927,11.693C124.116,76.986,124.27,78.829,123.971,80.57z
                M128.197,145.95c-0.857-0.221-0.857-0.221-0.667-2.179C127.854,144.83,128.025,145.388,128.197,145.95z"/>
              <path style={{ fill: "#CC2C1F" }} d="M38.046,17.316c-0.836,0.289-1.625,0.582-1.154,1.74C37.277,18.476,37.662,17.896,38.046,17.316z" />
              <g>
                <path style={{ fill: "#CC2C1F" }} d="M69.275,55.422c0-4.621-1.294-5.792-5.73-5.792c-4.313,0-3.389,3.512-3.389,6.716
                  c0,0.493,0.185,0.924,0.431,1.355l0.186,0.863c0.185,0.801-0.432,2.033,1.108,2.033C65.762,60.598,69.275,60.29,69.275,55.422z"/>
                <path style={{ fill: "#CC2C1F" }} d="M85.893,141.164c-0.955-0.035-1.912-0.092-2.869-0.151
                  C80.153,141.358,91.465,141.372,85.893,141.164z"/>
                <path style={{ fill: "#CC2C1F" }} d="M120.885,26.96c0.001-2.087-0.202-4.083-1.09-5.652c-1.794-1.546-3.369-2.904-5.113-4.408
                  c-2.573,0-5.356,0.111-8.127-0.025c-4.71-0.232-9.41-0.857-14.118-0.897c-14.704-0.128-9.409-0.109-24.114-0.033
                  c-3.829,0.02-7.674-0.309-11.504,0.378c-1.465,0.263-3.053,0.141-4.543-0.085c-4.203-0.637-8.321-0.315-12.409,0.737
                  c-0.236,0.061-0.448,0.215-0.653,0.316c0.16,0.721,0.306,1.378,0.466,2.101c-1.199,0.636-2.278,1.208-3.505,1.86
                  c-0.413,0.809-0.896,1.754-1.157,2.266c-0.247,6.072-0.533,11.69-0.685,17.312c-0.124,4.57-0.059,9.145-0.137,13.717
                  c-0.026,1.505-0.547,3.06-0.3,4.499c0.521,3.036,0.224,6.063,0.345,9.09c0.214,5.355-0.343,10.733,0.497,16.07
                  c0.068,0.431-0.009,0.891-0.056,1.334c-0.103,0.967-0.324,1.931-0.329,2.896c-0.029,5.2-0.008,10.401-0.002,15.601
                  c0.001,0.538-0.012,1.078,0.026,1.613c0.306,4.257,0.686,8.51,0.907,12.771c0.106,2.035-0.055,4.068-0.343,6.119
                  c-0.346,2.466-0.087,5.011-0.174,7.52c-0.053,1.542,0.1,2.999,0.938,4.274c0.78,0.51,1.521,0.994,2.262,1.48
                  c0.096,0.418,0.191,0.834,0.283,1.232c0.714,0.1,1.317,0.184,1.908,0.266c0.327,0.496,0.616,0.934,0.841,1.276
                  c2.213,0.219,4.333,0.437,6.455,0.631c0.35,0.032,0.711-0.029,1.065-0.065c1.056-0.107,2.116-0.342,3.167-0.309
                  c2.037,0.063,4.07,0.413,6.103,0.4c5.357-0.034,10.709,0.181,16.075-0.347c3.032-0.298,6.098-0.074,9.16,0.115
                  c0.252-0.03,0.6-0.063,1.091-0.098c5.495-0.396,11.079-0.594,16.599,0.29c0.611,0.098,1.255,0.037,1.88-0.011
                  c1.324-0.102,2.644-0.318,3.968-0.352c2.325-0.059,4.653-0.017,6.717-0.017c1.339-0.866,2.271-1.962,3.991-1.241
                  c1.145-2.027,2.261-4.002,3.378-5.977c-0.086-0.083-0.173-0.166-0.259-0.248c0-1.059-0.048-2.121,0.01-3.177
                  c0.107-1.95,0.391-3.897,0.4-5.846c0.04-8.338-0.004-16.677,0.002-25.016C120.818,75.2,120.835,51.08,120.885,26.96z
                  M77.161,18.207c3.327,0,8.38,3.019,8.38,6.778c0,1.047-0.802,1.725-1.849,1.725c-2.403,0-1.294-3.204-7.209-3.204
                  c-5.176,0-6.285,3.635-7.641,3.635c-1.109,0-1.849-1.355-1.849-2.341C66.994,19.377,72.909,18.207,77.161,18.207z M87.759,48.645
                  c-1.849,0-3.389,0.678-5.176,0.801c-0.062,0.739-0.185,1.479-0.185,2.218c0,1.91-0.493,3.635-0.493,5.484
                  c0,1.293,0.493,2.587,0.493,3.943v5.237c0,1.356,0.308,2.65,0.308,4.005c0,1.725-0.616,4.066-2.711,4.066
                  c-1.664,0-2.465-1.787-2.465-3.204c0-1.417,0.493-2.834,0.493-4.189l-0.062-5.361c0-1.664,0.431-3.204,0.431-4.744
                  c0-2.834-0.862-5.792-0.862-8.688c0-1.725,0.739-3.635,2.711-3.635c0.863,0,1.355,0.432,1.91,0.986
                  c3.143-0.554,7.086-0.554,10.352-0.554c2.219,0,4.56,2.649,4.56,4.806c0,3.389,0.185,13.309-3.82,14.665
                  c-0.431,0.123-0.801,0.493-1.108,0.863c-0.616,0.554-1.294,0.431-1.849,0.924c-0.309,0.062-0.678,0.124-1.048,0.124
                  c-2.465,0-5.854-2.157-5.854-4.929c0-0.986,0.863-1.91,1.91-1.91c0.616,0,1.171,0.247,1.726,0.616
                  c0.431,0.616,1.355,1.294,2.218,1.294c3.636,0,3.697-5.977,3.697-8.441C92.935,49.569,90.902,48.645,87.759,48.645z
                  M82.522,40.018c-0.801,0-1.603-0.37-2.526-0.37c-1.294,0-2.342,0.678-3.636,0.678c-0.739,0-1.479-0.308-2.218-0.308
                  c-1.787,0-3.327,0.863-5.114,0.863c-1.479,0-2.711-0.739-2.711-2.403c0-1.417,1.048-2.896,2.526-2.896
                  c2.957,0,4.56-0.555,6.963-0.555c1.047,0,2.033,0.308,3.08,0.308c1.048,0,2.033-0.493,3.081-0.493
                  c1.603,0,2.896,1.109,2.896,2.772C84.864,38.971,83.816,40.018,82.522,40.018z M63.174,64.788h-0.431
                  c-1.787,0.555-2.342,2.341-3.697,2.341c-2.033,0-2.772-2.157-2.772-3.882c0-1.047,0.246-2.095,0.246-3.204
                  c0-1.047-0.493-1.91-0.493-2.896c0-1.048-0.185-2.034-0.185-3.02l-0.062-5.36c0-1.725,1.972-3.389,3.636-3.389
                  c0.862,0,1.294,0.678,2.095,0.678c8.995,0,12.015-0.555,12.015,9.92c0,6.162-1.171,4.005-2.156,6.408
                  c-0.247,0.555-0.801,0.863-1.417,0.924c-1.541,0.185-1.603,1.294-3.204,1.294C65.516,64.603,64.345,64.788,63.174,64.788z
                  M66.255,85.421c0.062,0.924-3.081,2.711-4.005,2.711c-1.664,0-2.526-0.493-3.02-2.095c0.186-1.726,1.664-2.588,3.327-2.588
                  C63.79,83.45,65.639,84.251,66.255,85.421z M47.525,44.455c0-0.801,0.246-1.541,0.615-2.218c0.247-0.554,5.854-3.943,6.778-4.436
                  c5.052-2.588,3.943-4.621,6.839-6.778c0.986-0.739,2.896-3.389,3.882-3.389c0.801,0,1.479,0.801,1.479,1.602
                  c0,4.375-12.631,17.622-16.697,17.622C49.065,46.857,47.525,45.872,47.525,44.455z M64.222,108.281
                  c0,2.896-7.764,20.518-10.104,21.873c-0.616,0.37-1.356,0.678-2.096,0.678c-1.355,0-2.588-1.109-2.588-2.526
                  c0-1.047,0.37-2.095,1.109-2.834c2.342-2.342,5.73-5.854,6.654-9.181c0.616-2.033,1.479-3.943,2.649-5.669
                  c1.048-1.479,1.171-3.45,1.171-5.175c0-1.232-0.062-2.588-0.123-3.82c-0.123-1.603-1.232-2.588-1.232-4.437s1.294-6.1,3.573-6.1
                  c0.986,0,1.91,0.739,1.972,1.725l0.37,0.309c0.555-0.186,1.109-0.247,1.664-0.247c1.479,0,2.896,0.616,4.374,0.616
                  c2.526,0,5.237-0.678,7.764-0.678c0.678,0,1.294,0.555,1.972,0.555c2.219,0,4.683-0.493,7.024-0.493
                  c2.711,0,5.483,0.493,5.483-3.08c0-0.986-0.123-2.28-1.108-2.835c-0.678-0.801-2.157-1.294-3.204-1.294
                  c-1.048,0-2.033,0.493-3.081,0.493c-0.985,0-1.972-0.308-2.958-0.308c-1.108,0-2.156,0.369-3.266,0.369
                  c-1.17,0-2.279-0.308-3.512-0.308c-2.033,0-4.005,0.678-6.038,0.678c-0.925,0-2.896-0.123-2.896-1.417
                  c0-3.451,15.034-3.451,17.685-3.451c1.355,0,2.711,0.493,3.943,0.493c8.071,0,9.118,0.986,9.118,8.996
                  c0,5.053-5.729,5.977-9.611,5.977c-2.835,0-6.162-0.678-8.257-0.678c-1.109,0-2.28,0.555-3.512,0.555
                  c-1.479,0-2.896-0.801-4.252-0.801c-1.787,0-3.635,1.355-5.977,1.355c-0.616,0-1.232-0.124-1.726-0.493
                  c-0.431,0.432-0.862,0.801-1.355,1.171c0.247,1.663,0.802,3.819,0.802,5.483C64.654,105.261,64.222,106.864,64.222,108.281z
                  M79.687,125.594c-1.17-0.062-1.972,0.678-3.019,0.678c-2.711,0-3.266,0.493-4.498,0.493c-1.048,0-1.602,0.185-2.649,0.432
                  c-3.266,0.801-4.683-4.868-4.683-7.024c0-1.664,0.308-6.593,2.834-6.593c1.109,0,1.355,1.294,1.355,2.156
                  c0,2.033-0.985,6.716,2.342,6.716c1.232,0,2.341,0.124,3.327,0.124c0.369,0,0.739-0.124,1.109-0.37
                  c0.308,0,0.678-0.123,0.985-0.123c0.616,0,1.232,0.185,1.849,0.308c0.678,0.124,1.663-0.678,2.526-0.678
                  c2.095,0,4.066-0.062,4.066-2.834c0-1.664-0.185-3.882-2.341-3.882c-0.678,0.432-1.295-0.308-2.034-0.308
                  c-1.479,0-2.834-0.309-4.189-0.309c-1.232,0-2.342,0.616-3.574,0.616c-1.17,0-2.588-0.308-2.588-1.726
                  c0-1.663,2.835-2.464,4.19-2.464c0.862,0,1.232,0.308,2.156-0.186c0.37-0.062,0.801-0.123,1.232-0.123
                  c3.636,0,9.858,0.555,10.783,4.868c-0.062,0.431,0.123,0.862,0.431,1.17c0,0.678,0,1.355,0,2.096
                  c0,6.346-1.232,7.209-7.394,7.209C81.166,125.841,80.427,125.656,79.687,125.594z M101.622,116.229
                  c0,3.635-0.185,12.015-1.355,15.28c-0.862,2.28-4.867,3.204-7.086,3.204c-2.711,0-9.181-1.726-9.181-4.991
                  c0-1.231,0.678-1.972,1.972-1.972c1.849,0,3.574,1.294,5.669,1.294c5.915,0,5.606-4.497,5.606-9.304
                  c0-2.341,0.493-4.683,0.493-7.023c0-8.195-11.398-7.271-17.129-7.271c-3.512,0-7.086,1.909-10.659,1.909
                  c-1.232,0-2.711-0.246-2.711-1.786c0-3.759,14.109-4.56,17.067-4.56c1.047,0,2.095,0.369,3.142,0.369
                  c2.65,0,4.93,1.294,7.518,1.664C102.239,103.967,101.622,110.746,101.622,116.229z M101.253,46.549
                  c-3.02,0-7.764-4.005-9.243-6.593c-0.431-0.616-0.924-1.17-1.602-1.54c-1.232-0.74-5.607-7.271-5.607-8.873
                  c0-1.109,0.679-1.541,1.603-1.849c0.493,0,0.862,0.37,1.109,0.678c3.635,3.943,9.118,9.55,14.048,11.707
                  c1.479,0.616,2.772,1.91,2.772,3.635C104.333,45.564,103.101,46.549,101.253,46.549z"/>
              </g>
            </g>
          </g>
        </svg>
      )
    } else if (module.id === 'personality') {
      return (
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" x="0px"
          y="0px" viewBox="0 0 155.871 155.871" xmlSpace="preserve" width="84" height="84">
          <g>
            <g>
              <path style={{ fill: "#CC2C1F" }} d="M129.8,9.4c-0.6-0.3-1.3-0.6-1.8-0.8c-3.9,1.4-7.6-0.6-11.3-0.1c-0.7,0.1-1.4-0.2-2.3-0.4
              c-0.5,0.1-1.1,0.3-1.6,0.3c-4.8,0.1-9.6,0.4-14.5,0.4C75.2,9.1,72.1,9,49,9c-1.3,0-2.7-0.5-4-0.3c-2.4,0.3-4.8,0.9-7.3,1.4
              c-0.2,0-0.3-0.1-0.5-0.1c0.1-0.2,0.1-0.3,0.3-0.6c-3.1-1.6-6.2-0.2-9.3-0.1c-0.3,0.5-0.5,1-0.6,1.2c0,1.1,0,1.8,0,2.6
              c0,0.7-0.2,1.4-0.1,2.1c0.1,1.3,0.4,2.6,0.4,4c0.1,2.7,0,5.4,0,8.1c0,2.8,0,5.6,0,8.3c0,2.7,0,5.4,0,8.1c0,2.7-0.1,5.5,0,8.2
              c0.1,7.1,0.1,14.2,0.1,21.3c0,23.2,0,46.5,0,69.9c-2.5,1.5,0,3.4-0.4,5.4c1.6,0.3,3.1,0.7,4.6,0.7c2.3,0,4.6,0.4,6.9-0.4
              c0.3-0.1,0.7,0,1.1,0c1,0.1,1.9,0.3,2.9,0.3c2.7,0,5.4,0,8.1,0c27.3,0,34.5,0,61.8,0c2.1,0,4.1-0.2,6.2,0c2.1,0.2,4.1,0.1,6.2,0
              c1.7-0.1,3.4-0.3,4.4-1.9c0-4.1,0-8.1,0-12.2c0-0.1,0-0.2,0-0.3c-0.3-4.3-0.7-8.7-0.9-13c-0.1-2.3,0-4.6,0.3-6.9
              c0.4-2.6,0.1-5.4,0.1-8.1c0-16.3,0-32.6,0-49c0-1.3-0.1-2.7,0.1-4c0.6-3.2,1-6.5,1-9.8c0-5-0.1-10-0.1-15.1
              c0-3.9-0.3-7.9,0.2-11.8C130.6,14.4,130.5,12,129.8,9.4z M103.8,146.3c-0.6,0.2-1.4,0.3-2.3,0.4c-1.7-0.3-3.7-0.6-6.2-0.9
              c0.8-0.6,1.1-1,1.5-1c2.9-0.1,5.9,0,8.8,0c0.1,0.1,0.2,0.3,0.2,0.4C105.2,145.6,104.5,146,103.8,146.3z M124.7,81.3
              c-0.6,3.7-0.3,7.3-0.4,11c-0.1,3.5,0.4,7-0.5,10.4c-0.2,1-0.1,2.1-0.1,3.2c0,9.8,0,19.5,0,29.3c0,1.2,0.3,2.4,0.5,3.4
              c-1.1,1.9-2.1,3.7-3.1,5.6c-4-0.3-8.1,0.6-12.1-0.5c-0.2,0-0.4,0-0.5,0c-4.5-0.2-8.9-0.4-13.4-0.6c-0.7,0-1.4,0-2.1,0
              c-0.4,0.4-0.6,0.8-0.9,1.1c-1.1,0-2.2,0-3.3,0c-0.5-0.3-1-0.7-1.6-1.1c-4.3,0.3,11.3-0.3,7,0.4c-2,0.3-4.1-0.1-6.2,0.1
              c-6,0.6-12,0.6-17.9,0.6c-2.4,0-4.8,0.5-7.2,0.3c-7.3-0.7-14.7-0.3-22-0.4c-1.5,0-3,0.3-4.6-0.3c-1.6-1.2-1.6-3.7-3.9-4.3
              c1.1-4,0.7-7.9,0.4-11.8c-0.3-3.8-0.2-7.7-0.4-11.5c-0.1-2-0.3-3.9-0.5-5.8c-0.2-3.5,0.5-6.9,1.2-10.3c0.2-0.8,0.4-1.6,0.3-2.4
              c-0.7-3.3-0.8-6.7-1.1-10.1c-0.3-3.5-0.3-7-0.3-10.4c0-3.4,0.3-6.8,0.5-10.2c0-0.4,0.2-0.9,0.3-1.3c0.9-2.5,0.9-5,0.4-7.6
              c-0.4-2.4-0.7-4.9-0.7-7.4c-0.1-5.6,0-11.1-0.1-16.7c0-2,0.1-4.1-0.4-6.1c-0.4-2,0-4.1,0.6-6c0.4-1.1,0.8-2.3,0.5-3.6
              c-0.2-1,0.4-1.9,1.2-2.5c0.6-0.5,1.2-1,1.9-1.5c0.8,0.1,1.7,0.3,2.7,0.2c2.5-0.3,5-0.1,7.5-0.2c1.2,0,2.5-0.3,3.7-0.4
              c1.6-0.2,3.2-0.2,4.3,1.8c2.2-0.2,4.5-0.6,6.8-0.7c3-0.1,5.9-0.1,8.9-0.2c1.2,0,2.5-0.2,3.7-0.4c0.4,0,0.9-0.1,1.3,0
              c2.5,0.7,5,0.4,7.5,0.4c10.9,0,1.9,0.1,12.8-0.1c2.4,0,4.8,0.1,7.1,0.1c5.3-0.1,10.5-0.3,15.8-0.5c1.2,0,2.3,0,3.3,0
              c1.6,0.9,2.2,2.4,2.6,3.8c0.5,1.7,0.7,3.5,0.6,5.3c-0.1,4-0.1,8.1-0.6,12c-0.8,6.1-0.3,12.2-0.5,18.2c-0.1,3.5-0.1,7,0.1,10.5
              c0.2,3.9,0.7,7.8,0.9,11.7C124.8,77.7,125,79.5,124.7,81.3z M128.9,146.7c-0.9-0.2-0.9-0.2-0.7-2.2
              C128.5,145.5,128.7,146.1,128.9,146.7z"/>
              <path style={{ fill: "#CC2C1F" }} d="M38.7,18c-0.8,0.3-1.6,0.6-1.2,1.7C38,19.2,38.3,18.6,38.7,18z" />
              <g>
                <path style={{ fill: "#CC2C1F" }} d="M83.8,97.7c-0.7-0.7-1.3-0.9-2.3-0.9c-0.6,0-1.2,0.4-1.7,0.7c0.4,1.7-0.4,3.3-0.2,4.9
				          c0.4,0.4,0.8,0.8,1.2,1.2c0.5-0.2,1-0.4,1.5-0.4c0.3,0,0.6,0.1,0.9,0.1l1-0.7c-0.2-0.4-0.4-3.5-0.4-4.3V97.7z"/>
                <path style={{ fill: "#CC2C1F" }} d="M93.9,98.5c-0.3-0.6-1-0.9-1.6-0.9c-1.2,0-1.4,0.6-2.6-0.3c-0.5,0.2-1,0.4-1.5,0.6c0.1,1-0.5,3.3-0.8,3.9
				          c0.4,0.6,0.8,0.8,1.2,1.3c2.2-0.7,5.2,0.9,5.8-2.5C94.3,99.9,94.6,99,93.9,98.5z"/>
                <path style={{ fill: "#CC2C1F" }} d="M90.6,57.1l0.6,0.3c1.7,0,5.1,0,5.1,2.4c0,1.8-3.8,1.8-5,1.9L90.8,62l-0.2,0.5l-0.1,0.9l0.1,2.1
                  c0.5,0.6,1.2,1.1,1.8,1.6c0.6-0.2,1.3-0.4,1.9-0.4c3.8,0,4.7-1.5,4.7-5.3c0-1.7-0.4-3.5-0.4-5.2c0-0.7,0.2-1.3-0.4-1.8
                  c-0.4-0.7-1.1-1-1.8-1.2c-2.2,0.7-1.8-0.6-3.5-0.6c-1.1,0-2,0.7-2.6,1.5c0.1,0.9,0,1.7,0.1,2.6L90.6,57.1z"/>
                <path style={{ fill: "#CC2C1F" }} d="M86.6,141.9c-1,0-1.9-0.1-2.9-0.2C80.8,142.1,92.1,142.1,86.6,141.9z"/>
                <path style={{ fill: "#CC2C1F" }} d="M121.6,27.7c0-2.1-0.2-4.1-1.1-5.7c-1.8-1.5-3.4-2.9-5.1-4.4c-2.6,0-5.4,0.1-8.1,0
				c-4.7-0.2-9.4-0.9-14.1-0.9c-14.7-0.1-9.4-0.1-24.1,0c-3.8,0-7.7-0.3-11.5,0.4c-1.5,0.3-3.1,0.1-4.5-0.1
				c-4.2-0.6-8.3-0.3-12.4,0.7c-0.2,0.1-0.4,0.2-0.7,0.3c0.2,0.7,0.3,1.4,0.5,2.1c-1.2,0.6-2.3,1.2-3.5,1.9
				c-0.4,0.8-0.9,1.8-1.2,2.3c-0.2,6.1-0.5,11.7-0.7,17.3c-0.1,4.6-0.1,9.1-0.1,13.7c0,1.5-0.5,3.1-0.3,4.5c0.5,3,0.2,6.1,0.3,9.1
				c0.2,5.4-0.3,10.7,0.5,16.1c0.1,0.4,0,0.9-0.1,1.3c-0.1,1-0.3,1.9-0.3,2.9c0,5.2,0,10.4,0,15.6c0,0.5,0,1.1,0,1.6
				c0.3,4.3,0.7,8.5,0.9,12.8c0.1,2-0.1,4.1-0.3,6.1c-0.3,2.5-0.1,5-0.2,7.5c-0.1,1.5,0.1,3,0.9,4.3c0.8,0.5,1.5,1,2.3,1.5
				c0.1,0.4,0.2,0.8,0.3,1.2c0.7,0.1,1.3,0.2,1.9,0.3c0.3,0.5,0.6,0.9,0.8,1.3c2.2,0.2,4.3,0.4,6.5,0.6c0.3,0,0.7,0,1.1-0.1
				c1.1-0.1,2.1-0.3,3.2-0.3c2,0.1,4.1,0.4,6.1,0.4c5.4,0,10.7,0.2,16.1-0.3c3-0.3,6.1-0.1,9.2,0.1c0.3,0,0.6-0.1,1.1-0.1
				c5.5-0.4,11.1-0.6,16.6,0.3c0.6,0.1,1.3,0,1.9,0c1.3-0.1,2.6-0.3,4-0.4c2.3-0.1,4.7,0,6.7,0c1.3-0.9,2.3-2,4-1.2
				c1.1-2,2.3-4,3.4-6c-0.1-0.1-0.2-0.2-0.3-0.2c0-1.1,0-2.1,0-3.2c0.1-2,0.4-3.9,0.4-5.8c0-8.3,0-16.7,0-25
				C121.5,75.9,121.5,51.8,121.6,27.7z M79.8,22.5c1.2,0,2.3,0.6,3.6,0.6c1,0,2.2-0.4,3.3-0.4c1.2,0,2.3,0.6,3.5,0.6
				c2.5,0,11.5-1.6,11.5,2.4c0,2-3.3,1.9-4.5,1.9c-2.5,0-5-1-6.2-1c-1.5,0-3.3,0.8-5,0.8c-1.5,0-2.8,0.5-4.3,0.5
				c-1.8,0-3.6,0.2-5.5,0.2c-1.4,0-2.9-0.4-2.9-2C73.3,23.5,77.7,22.5,79.8,22.5z M99.6,41.2c0.4,4-5.2,3.9-7.7,3.9
				c-0.8,0-1.6-0.2-2.4-0.2c-1.3,0-2.3,0.7-3.4,0.7c-3,0-3.5,0.6-4.7,0.6c-1,0-1-0.5-2,0.2l-0.9,0.2c-1.1,0.3-4.1-1.7-4.1-2.9
				c0-0.6-0.1-1.3-0.5-1.8c-0.2-0.6-0.3-1.3-0.3-1.9c0-1.6,0.6-5.9,2.9-5.9c1.3,0,1.5,1.5,1.5,2.5c0,0.6-0.1,1.3-0.2,1.9
				c0.4,1.5,0.9,3,2.7,3c1.2,0,2.4,0.1,3.6,0.1c0.9,0,1.5-0.6,2.5-0.6c0.7,0,1.4,0.4,2,0.4c1,0,1.7-0.8,2.8-0.8c2,0,3.5,0.2,4.2-2.2
				c-0.4-1.4-0.4-2.9-2.3-2.9c-0.9,0-1.5-0.3-2.3-0.3c-1.6,0-3.1-0.3-4.7-0.3c-1.4,0-2.6,0.7-4,0.7c-1.2,0-2.5-0.4-2.5-1.8
				c0-1,0.9-1.7,1.8-2.2c0.8-0.1,1.8-0.5,2.6-0.5c1,0,1.4,0.5,2.4-0.2c0.5-0.1,1-0.2,1.5-0.2c3.8,0,10.7,0.7,11.5,5.2
				c-0.1,0.5,0.1,0.9,0.4,1.2v0.6c0.1,0.1,0.1,0.7-0.1,0.8C99.9,39.2,99.5,40.5,99.6,41.2z M74.7,51.8c1.1,0,1.8,1.1,1.7,2.1l-0.1,2
				c0.4,0.7,2.1,3.8,2.1,4.6s-1.8,2.3-2.2,3.4c0.6,1.5,0.3,3.7,2.7,3.7c2,0,2.3-0.4,4.3,0.4c0.9-0.4,2.7-1.2,3.2-2
				c-0.2-1.1,0.1-2.5-0.4-3.5l-0.6-0.6c-1.2-0.3-4.7,0.1-4.7-1.9c0-3.1,4.7-1.4,5.5-3.1l0.1-0.7l-0.1-2.2c-0.4-0.6-0.8-0.9-1.2-1.4
				c-1.5,0-2.8,0.7-4.4,0.7c-1.2,0-2.6-0.4-2.6-1.8c0-1,0.9-1.7,1.8-2.2c1-0.1,2-0.5,3-0.5c3.1,0,3.5-0.7,5.9-0.7
				c4.3,0,13.6,0.7,14.5,6.1c-0.1,0.5,0.1,1,0.4,1.4c0.2,1.6,0.2,3.6,0.2,5.2c0,1.8-0.4,3.7-0.4,5.5c0,5.1-4.8,4.9-8.4,4.9
				c-1.3,0-2.4-0.4-3.7-0.4c-1.6,0-2.9,0.9-4.4,0.9c-0.9,0-1.8-0.4-2.6-0.4c-1.5,0-2.7,1-4.2,1c-1.1,0-1.2-0.6-2.3,0.2l-1,0.2
				c-1.1,0.2-4.6-1.9-4.6-3.1c0-0.7-0.1-1.4-0.6-1.9c-0.2-0.5-0.3-1-0.3-1.5c0-1.7-0.4-3.3-0.4-5c0-0.9,0.4-1.7,0.4-2.6
				C71.4,56.6,72,51.8,74.7,51.8z M98.6,103.2c0.4,3.9-5.2,3.9-7.6,3.9c-1.4,0-2.7-0.6-4.2-0.6c-1.6,0-2.9,0.9-4.4,0.9
				c-0.9,0-1.8-0.4-2.8-0.4c-1.6,0-2.8,1-4.4,1c-0.4,0-0.7-0.1-1-0.2c-0.4,0-0.9,0.1-1.3,0.4l-0.9,0.2c-2.9,0.8-4.7-4.3-4.7-6.4
				c0-1.7,0.6-5.9,2.8-5.9c1.3,0,1.5,1.5,1.5,2.5c0,0.7-0.1,1.4-0.2,2c0.4,1.4,0.9,3,2.6,3c0.6,0,1.1-0.2,1.7-0.2
				c0.5-0.4,0.7-0.9,1-1.4c-0.1-0.3-0.9-3.5-1-3.9c-0.1-0.2-0.2-0.4-0.3-0.6c-1-0.1-2.3-0.3-2.3-1.7c0-1.8,3.3-2.6,4.7-2.6
				c0.3,0,0.7,0.1,1,0.1c0.5-0.2,1.2-0.4,1.5-0.8v-1c-0.2-0.4-0.6-0.7-0.9-1c-1-0.1-4.3-0.6-4.3-2c0-1.5,2.6-2.2,3.8-2.2l0.8-0.7
				c-0.1-1.7,0.1-4.4,2.5-4.4c2,0,3.1,1.6,3,3.5l-0.1,0.9c0.2,0.2,0.5,0.4,0.7,0.6c1.5-0.1,2.8,0.2,4.3,0.2c1.5,0,3-0.4,4.4-0.4
				c1.6,0,3.6,0.4,3.6,2.4c0,1.8-2,2.5-3.5,2.5c-1.8,0-3.5-0.6-5.3-0.6c-2.2,0-3.5,0.1-5.2,1.5c0.5,0.5,1,0.7,1.4,1
				c3.8-0.2,12,0.7,12.8,5.4c-0.1,0.4,0.2,0.9,0.4,1.2l0.1,0.6l-0.1,0.5c0,0.1,0,0.2-0.1,0.2C99,101.4,98.5,102.5,98.6,103.2z
				 M65.5,89.1c0-1.5,1.4-2.7,2.8-2.7c1.4,0,5,0.6,5,2.5c0,1.3-4.3,2.3-5.4,2.3C66.7,91.2,65.5,90.3,65.5,89.1z M100.2,120.8
				c0,1.9-3,5.2-4.9,5.2c-1.2,0-1.3-1-1.3-2c0-1.5,1.5-5.5,3.5-5.5h0.9C99.2,118.5,100.2,120,100.2,120.8z M56.7,20
				c1.8,0,3.3,0.2,4.9,1.2c1.7,1.1,8.1,0.4,8.1,3.3c0,1.8-2,2.1-3.5,2.1c-1.3,0-2.4-0.7-3.8-0.7c-0.9,0-1.8,0.2-2.7,0.2
				c-1,0-1.9-0.6-3-0.6c-1.6,0-4-1.4-4-3.1C52.8,20.6,55.3,20,56.7,20z M53.7,31.7c2.6,0,5.7-1.7,9.6-1.7c2,0,3.8,0.6,5.5,1.6
				c0.9,1.8,1.9,1,1.9,3.9c0,2.3-3.1,6-5.4,6c-0.7,0-1.6-0.4-1.6-1.2c0-0.7,1.4-3,1.4-3.9c0-1.2-3.4-2.6-4.6-2.6
				c-2.6,0-5.8,3.5-8.6,3.5c-1,0-2-0.7-2-1.8C50,33.3,51.8,31.7,53.7,31.7z M48.5,53.2c0-1.5,1.8-3,3.3-3.1c5.5-0.7,9-7.6,10.9-7.6
				l0.7,0.1l0.4,0.9c0,0.3-0.1,0.8-0.2,1.1l0.7,1.6c1.3,0.4,2.2,1.5,3.5,1.8c1.3,0.8,3.5,2.9,3.5,4.4c0,1.3-1.4,1.2-2.3,1.2
				c-1.4,0-3-1-4.3-1.7c-0.4,0.4-0.7,0.7-1.2,1.1c0,2.9-0.2,5.8-0.2,8.7c0,0.9,0.4,1.8,0.4,2.8c0,1.9,0.6,3.8,0.6,5.7
				c0,1.8-0.8,3.7-2.8,3.7c-2.2,0-3-2.3-3-4.2c0-1,0.5-2,0.5-3c0-1.4,0.2-2.6,0.2-4c0-2.6,0.4-5.2,0.4-7.7c0-0.9-0.3-1.7-0.4-2.5
				c-0.2-0.3-0.4-0.6-0.6-0.8c-2.5,2.1-3.4,3.7-7,3.7C49.9,55.5,48.5,55,48.5,53.2z M62.9,85.3c0,3.3-4.6,4.9-7.1,5.9
				c-1,1-3.3,3.1-4.9,3.1c-1,0-1.8-0.6-1.8-1.7c0-2.2,4-4.4,5.4-5.7c2-1.7,2.6-4.1,5.8-4.1C61.8,82.8,62.9,83.8,62.9,85.3z
				 M59.8,103.3c-0.1,3.1,1.7,5.6,1.7,8.8c0,5.2-2.3,21.3-8.7,21.3c-1.4,0-2.5-1-2.5-2.4c0-0.2,0-0.5,0.1-0.7c0.4-2.6,2.6-3.1,3.3-5
				c0.2-0.8,0.6-1.5,1-2.2c2.3-4.3,3.8-9.2,3.8-14.2c0-2.7-1.2-2-2.5-3.6c-2,1.6-2.3,5.5-4.8,5.5c-1.4,0-2-0.9-2-2.2
				c0-5.3,7-12.8,12.3-12.8c1,0,1.8,0.7,1.8,1.7c0,1.6-2.2,2.6-3.3,3.5c-0.1,0.2-0.2,0.5-0.3,0.7C59.8,102.2,59.8,102.8,59.8,103.3z
				 M68.9,125.2c0,0.2-0.1,0.5-0.1,0.7c-0.6,1.6-1.9,5.5-3.8,5.5c-1.7,0-2.3-1.4-2.3-2.8c0-1.9,2.5-9.2,4.6-9.2c1.1,0,1.5,1,1.5,2
				C68.9,122.8,68.7,123.8,68.9,125.2z M67.1,113.2c0-1.4,1.7-2.6,3-2.6c1.7,0,3.3,0.7,5.1,0.7c3.5,0,6.8-0.7,10.3-0.7
				c1.2,0,2.3,0.4,3.5,0.4c1,0,1.8-0.6,2.9-0.6c1.6,0,6.8-0.2,6.8,2.3c0,2-2.8,2.5-4.4,2.5c-1.2,0-2.3-0.4-3.5-0.4
				c-1.4,0-2.7-0.4-4.1-0.4c-1.7,0-3.5,0.6-5.2,0.6c-3.3,0-6.8,0.6-10.1,0.1c-0.6,0.2-1,0.2-1.6,0.2
				C68.6,115.5,67.1,114.8,67.1,113.2z M89.6,118.2c0,0.8-0.2,1.7-0.7,2.3l-0.4,0.2c-0.8,1.2-1.4,2.4-3.1,2.4c-1.3,0-1.3-2-1.3-3
				c0-1.8,1.6-4.1,3.6-4.1C88.5,116,89.6,117.2,89.6,118.2z M100.3,135.7c-1.8,0-3.8-0.6-5.5-0.6c-1.6,0-3-0.4-4.4-0.4
				c-1.8,0-5.7-1.7-6.8-3c-1.8-1.1-3.4-2.2-3.6-4.4c-0.8-0.7-1.8-0.8-2.3-1.8c-0.2-0.3-0.4-0.7-0.7-0.9c-0.4-0.1-0.8-0.2-1.2-0.2
				l-0.7,0.6c-0.2,0.4-0.2,0.7-0.2,1.2c0,0.9-0.6,1.5-0.6,2.4c0,0.9-0.5,2.4-1.7,2.4c-0.9,0-1.5-0.7-1.5-1.5c0-2.5,1-10.5,4.1-10.8
				c0.5-0.2,1-0.7,1.7-0.7c1.4,0,2.7,1.4,2.7,2.7c0,0.7-0.4,1.2-0.2,1.9c2.5,2.9,5.5,6.5,9.7,6.7c1.4,0.1,2.7,0.2,4,0.6
				c1,0.3,2.3,0.6,3.4,0.6c1.6,0,3.2-0.7,4.8-0.7c1.1,0,1.8,0.6,2.5,1.4c0.4,0.2,0.6,0.5,0.9,0.8c0.1,0.2,0.1,0.5,0.1,0.7
				C104.8,134.8,102.1,135.7,100.3,135.7z"/>
              </g>
            </g>
          </g>
        </svg>
      )
    }else if (module.id === 'wealth') {
      return (
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" x="0px"
          y="0px" viewBox="0 0 155.871 155.871" xmlSpace="preserve" width="84" height="84">
          <g>
            <g>
              <path style={{ fill: "#CC2C1F" }} d="M129.8,9.4c-0.6-0.3-1.3-0.6-1.8-0.8c-3.9,1.4-7.6-0.6-11.3-0.1c-0.7,0.1-1.4-0.2-2.3-0.4
                c-0.5,0.1-1.1,0.3-1.6,0.3c-4.8,0.1-9.6,0.4-14.5,0.4C75.2,9.1,72.1,9,49,9c-1.3,0-2.7-0.5-4-0.3c-2.4,0.3-4.8,0.9-7.3,1.4
                c-0.2,0-0.3-0.1-0.5-0.1c0.1-0.2,0.1-0.3,0.3-0.6c-3.1-1.6-6.2-0.2-9.3-0.1c-0.3,0.5-0.5,1-0.6,1.2c0,1.1,0,1.8,0,2.6
                c0,0.7-0.2,1.4-0.1,2.1c0.1,1.3,0.4,2.6,0.4,4c0.1,2.7,0,5.4,0,8.1c0,2.8,0,5.6,0,8.3c0,2.7,0,5.4,0,8.1c0,2.7-0.1,5.5,0,8.2
                c0.1,7.1,0.1,14.2,0.1,21.3c0,23.2,0,46.5,0,69.9c-2.5,1.5,0,3.4-0.4,5.4c1.6,0.3,3.1,0.7,4.6,0.7c2.3,0,4.6,0.4,6.9-0.4
                c0.3-0.1,0.7,0,1.1,0c1,0.1,1.9,0.3,2.9,0.3c2.7,0,5.4,0,8.1,0c27.3,0,34.5,0,61.8,0c2.1,0,4.1-0.2,6.2,0c2.1,0.2,4.1,0.1,6.2,0
                c1.7-0.1,3.4-0.3,4.4-1.9c0-4.1,0-8.1,0-12.2c0-0.1,0-0.2,0-0.3c-0.3-4.3-0.7-8.7-0.9-13c-0.1-2.3,0-4.6,0.3-6.9
                c0.4-2.6,0.1-5.4,0.1-8.1c0-16.3,0-32.6,0-49c0-1.3-0.1-2.7,0.1-4c0.6-3.2,1-6.5,1-9.8c0-5-0.1-10-0.1-15.1
                c0-3.9-0.3-7.9,0.2-11.8C130.6,14.4,130.5,12,129.8,9.4z M103.8,146.3c-0.6,0.2-1.4,0.3-2.3,0.4c-1.7-0.3-3.7-0.6-6.2-0.9
                c0.8-0.6,1.1-1,1.5-1c2.9-0.1,5.9,0,8.8,0c0.1,0.1,0.2,0.3,0.2,0.4C105.2,145.6,104.5,146,103.8,146.3z M124.7,81.3
                c-0.6,3.7-0.3,7.3-0.4,11c-0.1,3.5,0.4,7-0.5,10.4c-0.2,1-0.1,2.1-0.1,3.2c0,9.8,0,19.5,0,29.3c0,1.2,0.3,2.4,0.5,3.4
                c-1.1,1.9-2.1,3.7-3.1,5.6c-4-0.3-8.1,0.6-12.1-0.5c-0.2,0-0.4,0-0.5,0c-4.5-0.2-8.9-0.4-13.4-0.6c-0.7,0-1.4,0-2.1,0
                c-0.4,0.4-0.6,0.8-0.9,1.1c-1.1,0-2.2,0-3.3,0c-0.5-0.3-1-0.7-1.6-1.1c-4.3,0.3,11.3-0.3,7,0.4c-2,0.3-4.1-0.1-6.2,0.1
                c-6,0.6-12,0.6-17.9,0.6c-2.4,0-4.8,0.5-7.2,0.3c-7.3-0.7-14.7-0.3-22-0.4c-1.5,0-3,0.3-4.6-0.3c-1.6-1.2-1.6-3.7-3.9-4.3
                c1.1-4,0.7-7.9,0.4-11.8c-0.3-3.8-0.2-7.7-0.4-11.5c-0.1-2-0.3-3.9-0.5-5.8c-0.2-3.5,0.5-6.9,1.2-10.3c0.2-0.8,0.4-1.6,0.3-2.4
                c-0.7-3.3-0.8-6.7-1.1-10.1c-0.3-3.5-0.3-7-0.3-10.4c0-3.4,0.3-6.8,0.5-10.2c0-0.4,0.2-0.9,0.3-1.3c0.9-2.5,0.9-5,0.4-7.6
                c-0.4-2.4-0.7-4.9-0.7-7.4c-0.1-5.6,0-11.1-0.1-16.7c0-2,0.1-4.1-0.4-6.1c-0.4-2,0-4.1,0.6-6c0.4-1.1,0.8-2.3,0.5-3.6
                c-0.2-1,0.4-1.9,1.2-2.5c0.6-0.5,1.2-1,1.9-1.5c0.8,0.1,1.7,0.3,2.7,0.2c2.5-0.3,5-0.1,7.5-0.2c1.2,0,2.5-0.3,3.7-0.4
                c1.6-0.2,3.2-0.2,4.3,1.8c2.2-0.2,4.5-0.6,6.8-0.7c3-0.1,5.9-0.1,8.9-0.2c1.2,0,2.5-0.2,3.7-0.4c0.4,0,0.9-0.1,1.3,0
                c2.5,0.7,5,0.4,7.5,0.4c10.9,0,1.9,0.1,12.8-0.1c2.4,0,4.8,0.1,7.1,0.1c5.3-0.1,10.5-0.3,15.8-0.5c1.2,0,2.3,0,3.3,0
                c1.6,0.9,2.2,2.4,2.6,3.8c0.5,1.7,0.7,3.5,0.6,5.3c-0.1,4-0.1,8.1-0.6,12c-0.8,6.1-0.3,12.2-0.5,18.2c-0.1,3.5-0.1,7,0.1,10.5
                c0.2,3.9,0.7,7.8,0.9,11.7C124.8,77.7,125,79.5,124.7,81.3z M128.9,146.7c-0.9-0.2-0.9-0.2-0.7-2.2
                C128.5,145.5,128.7,146.1,128.9,146.7z"/>
              <path style={{ fill: "#CC2C1F" }} d="M38.7,18c-0.8,0.3-1.6,0.6-1.2,1.7C38,19.2,38.3,18.6,38.7,18z" />
              <g>
                <path style={{ fill: "#CC2C1F" }} d="M86.6,141.9c-1,0-1.9-0.1-2.9-0.2C80.8,142.1,92.1,142.1,86.6,141.9z"/>
                <path style={{ fill: "#CC2C1F" }} d="M121.6,27.7c0-2.1-0.2-4.1-1.1-5.7c-1.8-1.5-3.4-2.9-5.1-4.4c-2.6,0-5.4,0.1-8.1,0
                  c-4.7-0.2-9.4-0.9-14.1-0.9c-14.7-0.1-9.4-0.1-24.1,0c-3.8,0-7.7-0.3-11.5,0.4c-1.5,0.3-3.1,0.1-4.5-0.1
                  c-4.2-0.6-8.3-0.3-12.4,0.7c-0.2,0.1-0.4,0.2-0.7,0.3c0.2,0.7,0.3,1.4,0.5,2.1c-1.2,0.6-2.3,1.2-3.5,1.9
                  c-0.4,0.8-0.9,1.8-1.2,2.3c-0.2,6.1-0.5,11.7-0.7,17.3c-0.1,4.6-0.1,9.1-0.1,13.7c0,1.5-0.5,3.1-0.3,4.5c0.5,3,0.2,6.1,0.3,9.1
                  c0.2,5.4-0.3,10.7,0.5,16.1c0.1,0.4,0,0.9-0.1,1.3c-0.1,1-0.3,1.9-0.3,2.9c0,5.2,0,10.4,0,15.6c0,0.5,0,1.1,0,1.6
                  c0.3,4.3,0.7,8.5,0.9,12.8c0.1,2-0.1,4.1-0.3,6.1c-0.3,2.5-0.1,5-0.2,7.5c-0.1,1.5,0.1,3,0.9,4.3c0.8,0.5,1.5,1,2.3,1.5
                  c0.1,0.4,0.2,0.8,0.3,1.2c0.7,0.1,1.3,0.2,1.9,0.3c0.3,0.5,0.6,0.9,0.8,1.3c2.2,0.2,4.3,0.4,6.5,0.6c0.3,0,0.7,0,1.1-0.1
                  c1.1-0.1,2.1-0.3,3.2-0.3c2,0.1,4.1,0.4,6.1,0.4c5.4,0,10.7,0.2,16.1-0.3c3-0.3,6.1-0.1,9.2,0.1c0.3,0,0.6-0.1,1.1-0.1
                  c5.5-0.4,11.1-0.6,16.6,0.3c0.6,0.1,1.3,0,1.9,0c1.3-0.1,2.6-0.3,4-0.4c2.3-0.1,4.7,0,6.7,0c1.3-0.9,2.3-2,4-1.2
                  c1.1-2,2.3-4,3.4-6c-0.1-0.1-0.2-0.2-0.3-0.2c0-1.1,0-2.1,0-3.2c0.1-2,0.4-3.9,0.4-5.8c0-8.3,0-16.7,0-25
                  C121.5,75.9,121.5,51.8,121.6,27.7z M51.7,52.1c0.1-1.4,0.2-2.6,0.1-3.8c0-1,0.1-2.3,0.3-3.8c0.2-0.8,0.1-2.2-0.3-4.3
                  c-0.1-0.8,0-1.5,0.2-2.1c0.2-0.5,0.2-1.2,0.1-2c-0.2-1.1-0.2-2.7,0-4.6c0.1-0.7,0.1-1.2,0-1.5c-0.2-1.3,0-2.6,0.5-4.1
                  c0.4-0.9,0.9-1.6,1.7-2.2c1-0.7,1.9-1,2.5-0.9c0.5,0.1,1.1,0,1.8-0.2c0.5-0.1,1.1-0.2,2-0.4c0.7,0,1.4,0,2,0.1
                  c1.1,0.2,2.4,0.2,3.9,0.1c0.7,0,1.7,0.1,2.8,0.3c1.7,0.2,2.9,0.7,3.6,1.5c0.7,0.7,1.2,1.6,1.6,2.8c0.3,0.8,0.3,1.8,0.1,3
                  c-0.2,0.5-0.4,1.3-0.5,2.3c-0.1,1.1-0.4,1.9-0.8,2.4c-0.4,0.8-0.9,1.3-1.5,1.3c-0.8,0-1.3-0.4-1.6-1.4c-0.3-0.9-0.4-1.8-0.2-2.8
                  c0-0.7-0.1-1.3-0.3-2c-0.2-0.8-0.5-1.4-0.8-1.8c-0.4-0.4-0.9-0.7-1.6-0.9c-0.8-0.2-1.3-0.3-1.6-0.3c-0.5,0-0.8,0-1.1,0
                  c-0.4-0.1-1.2-0.1-2.2-0.1c-0.8,0.1-1.5,0.2-2,0.5c-0.4,0.2-0.8,0.3-1.3,0.3c-0.3,0-0.6,0.1-1,0.4c-0.7,0.6-1.1,1.2-1.3,1.7
                  c-0.4,1.1-0.5,2.2-0.5,3.2c0.1,1.8,0.1,3.2-0.1,4.1c-0.4,1.8-0.5,3.4-0.3,4.9c0.1,1.3,0.2,2.6,0.1,3.9c-0.1,3,0,5.3,0.3,7
                  c0.3,1.5,0.2,2.7-0.2,3.7c-0.5,0.9-1,1.4-1.8,1.4c-1,0-1.7-0.4-2.3-1.2C51.7,55.8,51.6,54.3,51.7,52.1z M75.1,64
                  c-0.5-0.8-0.5-1.6,0.1-2.5c0.5-0.7,1.4-1.4,2.6-1.9c0.9-0.4,1.5-0.7,1.8-1c1.5-1.5,2.5-2.4,3.1-2.8c0.9-0.6,1.5-1.3,1.9-2.1
                  c0.4-0.8,0.8-1.5,1.3-2.1c0.8-0.9,1.4-1.6,1.7-2.3c0.4-0.7,0.8-1.1,1.2-1.3c0.7-0.3,1.2-0.2,1.5,0.5c0.2,0.4,0,1.5-0.7,3.2
                  c-0.8,2-1.5,3.3-2,3.9c-0.6,0.7-1.2,1.5-1.7,2.6c-0.5,1-1.4,2-2.6,3c-0.5,0.4-1.1,1-1.8,1.8c-0.5,0.6-1.1,1-1.7,1.3
                  c-1.4,0.7-2.4,0.9-3.1,0.7C76,65,75.4,64.6,75.1,64z M77,92.2c0.4-0.1,0.7-0.2,0.9-0.2c0.3,0,0.6,0,0.9,0
                  c0.2-0.1,0.5-0.1,0.8-0.1c0.3,0,0.6,0,0.7-0.2c0.2-0.1,0.5-0.1,1-0.1c0.4,0,0.8-0.1,1.2-0.1c0.5-0.1,1.3-0.1,2.2-0.1
                  c0.7,0.1,1.4,0.1,2,0.1c0.7,0,1.2,0.2,1.7,0.6c0.6,0.4,0.9,1,1,1.9c0,0.6-0.4,1.1-1.2,1.5c-0.9,0.4-1.9,0.3-3-0.1
                  c-0.6-0.1-1.2-0.1-1.7,0c-0.4,0.1-0.8,0.2-1.2,0.1c-0.2,0-0.5,0-0.8,0c-0.4,0.1-0.7,0.2-1,0.1c-0.4,0-0.7,0.1-0.9,0.2
                  c-0.3,0.2-0.6,0.3-0.7,0.3c-0.2,0-0.5,0.1-0.6,0.1c-0.7,0.4-1.5,0.5-2.4,0.3c-0.7-0.3-1.1-0.9-1.2-1.7c0-0.6,0.1-1.2,0.6-1.7
                  C75.6,92.8,76.3,92.4,77,92.2z M74.3,50c0.4,2.6,0.2,4.5-0.4,5.6c-0.4,0.7-1,1.1-1.9,1.2c-0.9,0.1-1.6-0.2-2-1
                  c-0.5-0.9-0.7-2.1-0.4-3.8c0.3-0.8,0.4-1.7,0.4-2.7c0-1.4,0-2.5,0.2-3.3c0.2-0.8,0.2-1.7,0.2-2.7c0-1.6,0.1-2.8,0.4-3.6
                  c0.5-1.3,0.9-1.9,1.3-1.8c0.7,0.1,1.3,0.6,1.7,1.4c0.4,0.7,0.5,1.5,0.5,2.3c-0.1,1.2,0,2,0.1,2.6c0.2,0.7,0.3,1.5,0.1,2.2
                  C74.3,47.1,74.2,48.2,74.3,50z M63.7,97.5c-1.8-1.6-3.6-1.9-5.3-0.9c-1.3,0.7-2.6,1.4-3.9,2c-1.1,0.4-1.9,0.6-2.5,0.4
                  c-0.9-0.2-1.4-0.8-1.4-1.8c0-0.9,0.4-1.7,1.3-2.6c0.7-0.7,1.6-1,2.6-1c1-0.1,2-0.4,3-0.9c0.9-0.4,2.6-0.7,5.3-0.7
                  c1.6-0.1,3.4,0.4,5.2,1.5c0.2,0.4,0.6,0.8,1.2,1.3c0.5,0.5,0.8,1.3,0.8,2.5c0,0.9-0.3,1.8-0.7,2.5c-0.2,0.4-0.5,0.8-0.8,1
                  c-0.5,0.5-1.1,1-2,1.7c-0.9,0.8-1.7,1-2.5,0.6c-0.9-0.4-1-1-0.6-1.9c0.2-0.8,0.5-1.5,0.7-2.3C64.5,98.2,64.3,97.7,63.7,97.5z
                  M61.5,43c-0.1-0.6-0.1-1.2,0-1.7c0-0.2,0-0.4-0.1-0.6c-0.1-0.3-0.2-0.6-0.1-0.9c0-0.4,0-0.8-0.1-1.2c0-0.2,0-0.4,0-0.6
                  c0.1-0.2,0.1-0.6-0.1-1c-0.2-0.6-0.3-1-0.4-1.4c-0.1-0.8-0.1-1.8,0.1-2.8c0.2-1.1,0.5-1.9,0.9-2.2c0.5-0.4,0.9-0.6,1.4-0.6
                  c0.7,0,1.4,0.2,1.9,0.7c0.5,0.7,0.9,1.5,1,2.5c0.1,0.6,0.1,1.3-0.1,2.1c-0.1,0.5-0.2,0.9-0.1,1.3c0.1,0.4,0,0.8-0.1,1.3
                  c-0.2,0.7-0.3,1.8-0.2,3.1c0,0.4,0,0.8-0.1,1.2c-0.1,0.3-0.2,0.7-0.1,1.2c0,0.9-0.1,1.7-0.2,2.5c-0.1,0.9-0.3,1.5-0.6,2
                  c-0.2,0.2-0.5,0.4-0.9,0.4c-0.7,0-1.2-0.4-1.6-1.3c-0.4-0.8-0.5-1.7-0.4-2.7C61.7,44,61.6,43.6,61.5,43z M66.6,84.4
                  c0.7,0.2,1.4,0.6,1.9,1.2c0.3,0.4,0.5,0.8,0.4,1.2c0,0.7-0.3,1.1-0.8,1.4c-0.5,0.3-1.3,0.5-2.4,0.5c-0.5,0-1-0.1-1.5-0.3
                  c-0.3-0.2-0.8-0.4-1.5-0.4c-0.4,0-1,0-1.9,0.1c-0.7,0.1-1.2,0.1-1.5,0c-0.9-0.4-1.7-0.6-2.3-0.6c-1.1,0-2-0.3-2.8-1.2
                  c-0.9-1-1.2-1.8-1.1-2.3c0.2-0.5,0.6-1,1.2-1.4c0.8-0.5,1.7-0.7,2.8-0.7c0.8,0.1,1.6,0.2,2.2,0.3c0.7,0.3,1.4,0.6,2,1
                  c0.7,0.5,1.6,0.8,2.9,0.8C65.4,84.1,66.1,84.2,66.6,84.4z M68.3,67.6c-1.1-1.3-1.7-2.2-1.8-2.7c-0.2-0.4-0.5-1-0.9-2
                  c-0.2-0.8-0.2-1.3,0-1.4c0.2-0.2,0.3-0.4,0.4-0.7c0-0.4,0.5-0.7,1.5-0.9c0.7-0.2,1.3-0.1,1.8,0.3c0.7,0.6,1.2,1.2,1.5,1.8
                  c0.3,0.6,0.7,1.1,1.1,1.5c0.3,0.4,0.5,0.9,0.6,1.5c0.2,0.6,0.5,1,0.6,1.4c0.2,0.3,0.3,0.8,0.2,1.5c-0.1,0.9-0.4,1.4-0.7,1.7
                  c-0.4,0.3-1.1,0.2-2-0.3C69.3,68.8,68.6,68.3,68.3,67.6z M51.2,65.7c0.6-0.8,1.6-1.5,3-2c0.2-0.1,0.3-0.2,0.6-0.5
                  c0.2-0.2,0.8-0.5,1.7-0.7c0.2-0.1,0.4-0.3,0.7-0.6c0.2-0.3,0.6-0.6,0.9-0.7c0.4-0.2,0.9-0.8,1.7-1.7c0.6-0.7,0.9-1.2,0.9-1.7
                  c0.1-0.6,0.2-1.1,0.5-1.5c0.2-0.2,0.3-0.4,0.3-0.6c0-0.3,0.1-0.6,0.2-1c0.1-0.4,0.2-0.8,0.2-1.1c0.1-1,0.3-1.7,0.6-2.2
                  c0.1-0.3,0.4-0.5,0.9-0.5c0.5,0.1,0.8,0.2,0.9,0.5c0.2,0.3,0.3,0.9,0.3,1.7c0,0.6-0.1,1.2-0.1,1.7c-0.1,0.4-0.1,0.7-0.1,0.9
                  c0,0.6,0,1.2-0.2,1.8c-0.2,0.5-0.3,1-0.2,1.4c0,0.6-0.2,1.1-0.6,1.5c-0.3,0.3-0.5,0.7-0.6,1.4c0,0.5-0.3,1.1-0.8,1.8
                  c-0.5,0.7-0.9,1.2-1.3,1.5c-0.4,0.3-0.7,0.8-1.1,1.3c-0.4,0.5-0.7,0.8-1.1,1c-0.4,0.2-0.7,0.5-0.9,0.9c-0.3,0.4-0.6,0.6-0.7,0.6
                  c-0.4,0-0.7,0.2-0.9,0.4c-0.5,0.8-1.3,1.3-2.5,1.3c-1.1,0.1-1.7-0.2-2-0.8c-0.1-0.3-0.3-0.5-0.7-0.7c-0.3-0.2-0.4-0.6-0.4-1.2
                  C50.4,66.9,50.7,66.2,51.2,65.7z M68.2,115.4c-1,0-1.8-0.1-2.3-0.5c-0.7-0.4-1.3-0.7-1.7-1c-0.2,0.2-0.4,0.4-0.6,0.6
                  c-0.2,0.2-0.3,0.3-0.5,0.5c0,0.6,0,1,0.1,1.2c0.2,0.6,0.2,1.2,0.1,1.6c-0.1,0.4-0.2,0.9-0.1,1.5c0.1,1.2,0,2.4-0.1,3.6
                  c-0.1,0.7-0.1,1.2,0.1,1.6c0.2,0.9,0.3,1.7,0.3,2.4c-0.1,0.5-0.1,0.8,0.1,0.9c0.2,0.4,0.3,0.9,0.2,1.6c0,0.4,0.1,0.9,0.1,1.4
                  c0.3,1.3,0.2,2.4-0.3,3.5c-0.5,1-1.3,1.5-2.3,1.5c-1.1,0-1.9-0.6-2.5-1.8c-0.6-1.4-0.7-2.8-0.2-4.1c0.2-0.8,0.3-1.4,0.1-1.9
                  c0-0.4,0-1,0.2-1.8c0.1-0.6,0.2-1.3,0.1-2.2c-0.1-0.9-0.1-1.8,0.1-2.6c0.2-0.9,0.2-1.7,0.1-2.3c-0.1-0.5-0.1-0.9,0.1-1.3
                  c0.1-0.6,0.1-1.3-0.2-2.2c-0.1-0.2-0.2-0.5-0.2-0.8c-0.2-0.2-0.3-0.3-0.3-0.4c-0.1-0.1-0.2-0.2-0.2-0.2c-0.4,0.3-0.7,0.6-0.9,1
                  c-0.2,0.2-0.9,0.7-1.8,1.5c-0.6,0.5-1.7,0.7-3.1,0.9c-1.4,0-2.3-0.3-2.7-0.9c-0.6-0.9-0.6-1.8,0-2.6c0.7-0.9,1.5-1.5,2.6-1.8
                  c0.9,0,1.8-0.3,2.5-0.9c0.8-0.5,1.7-1.1,2.5-1.8c0.8-0.7,1.7-1.7,2.7-3.1c0.7-1,1.3-1.6,1.7-1.8c0.6-0.2,1-0.2,1.3-0.1
                  c0.5,0.3,0.5,0.9,0.2,1.8c0,0.1-0.1,0.1-0.1,0.2c0.2,0.5,0.4,1,0.7,1.5c0.5,0.2,1,0.5,1.4,0.8c0.6,0.5,1.2,0.9,1.8,1.1
                  c0.5,0.2,0.9,0.7,1.3,1.3c0.4,0.4,0.8,0.7,1,0.9c0.3,0.2,0.5,0.6,0.7,1.1c0.2,0.8,0.2,1.4-0.1,1.7
                  C69.7,115.4,69.1,115.5,68.2,115.4z M81,124.5c-0.2,1.2-0.7,2-1.3,2.4c-1.6,2-2.9,3.2-3.6,3.6c-0.6,0.3-1.5,0.9-2.9,1.9
                  c-0.7,0.2-1.2,0.3-1.3,0.1c-0.3-0.1-0.6-0.2-0.9-0.2c-0.3,0.1-0.7-0.4-1-1.4c-0.2-0.6-0.2-1.3,0.1-1.9c0.5-0.7,0.9-1.3,1.5-1.7
                  c1-0.8,1.8-1.7,2.3-2.5c0.7-0.7,1.5-1.2,2.6-1.6c0.6-0.4,1-0.6,1.3-0.8c0.3-0.3,0.8-0.4,1.4-0.4c0.9,0,1.5,0.1,1.8,0.6
                  C81.4,122.9,81.4,123.6,81,124.5z M72,112.3c-0.2-0.3,0.2-0.8,1-1.5c0.6-0.5,1.3-0.6,2-0.4c0.9,0.3,1.6,0.7,2.2,1.2
                  c0.3,0.4,0.7,0.6,1,0.8c0.4,0.2,0.6,0.5,0.8,0.9c0.5,0.4,0.9,0.8,1.2,1c0.3,0.3,0.6,0.7,0.7,1.4c0.2,0.9,0.2,1.6-0.2,2
                  c-0.3,0.5-0.9,0.6-1.9,0.4c-1.2,0-2.2-0.2-2.8-0.7c-1.3-0.7-2.1-1.2-2.3-1.6c-0.2-0.2-0.7-0.7-1.3-1.3c-0.5-0.7-0.7-1.2-0.6-1.4
                  C72.1,112.9,72.1,112.6,72,112.3z M88.1,135.3c-0.6,0.4-1.4,0.4-2.4,0c-0.6-0.5-1-1.1-1.3-1.8c-0.2-0.8-0.1-1.8,0.1-3
                  c0.1-1.2,0.2-2.2,0.1-2.8c-0.1-0.6-0.2-1.1-0.2-1.6c0-0.5,0-0.8,0.1-1.1c0.1-0.5,0.2-1,0.1-1.7c0-0.7,0.2-1.6,0.7-2.9
                  c0.4-1,0.9-1.5,1.7-1.7c0.5,0,0.8,0.2,1,0.7c0.4,0.9,0.6,1.7,0.6,2.5c0,0.7,0.1,1.5,0.4,2.4c0.1,0.9,0.1,2-0.1,3.5
                  c-0.1,0.4,0,0.9,0.1,1.6c0.1,0.9,0.2,1.9,0.2,3.1C89.1,133.6,88.7,134.5,88.1,135.3z M103,131.2c-0.4,0.6-0.9,0.9-1.7,0.9
                  c-0.5,0.1-1.1,0.1-1.6-0.2c-0.9-0.5-1.6-1-2-1.7c-0.2-0.3-0.5-0.6-0.9-0.9c-0.7-0.4-1.2-0.9-1.6-1.4c-0.4-0.6-0.7-1.1-0.9-1.7
                  c-0.1-0.2-0.3-0.5-0.4-0.7c-1.2-1.7-1.9-2.8-2-3.5c-0.1-0.5,0.1-1,0.7-1.5c0.3-0.2,0.7-0.3,1.2-0.2c0.7,0,1.3,0.2,1.5,0.6
                  c0.2,0.3,0.4,0.6,0.5,1c0.2,0.4,0.6,0.7,0.9,0.8c0.7,0.4,1.2,0.6,1.6,0.6c0.3,0.1,0.6,0.3,0.9,0.6c0.2,0.4,0.6,0.7,1,0.8
                  c1.4,0.6,2.3,1.3,3,2.2c0.5,0.8,0.7,1.6,0.6,2.3C103.7,130.1,103.5,130.7,103,131.2z M92.3,115.5c0-1.1,0.3-2,0.9-2.5
                  c0.8-1.5,1.4-2.4,1.8-2.6c0.3-0.2,0.9-0.7,1.6-1.5c0.7-0.5,1.2-0.6,1.3-0.4c0.3,0.1,0.6,0.1,0.8,0.1c0.4-0.2,0.8,0.2,1.4,1.1
                  c0.4,0.6,0.5,1.2,0.3,1.8c-0.3,0.8-0.7,1.5-1.2,2c-0.5,0.5-0.8,1-1,1.5c-0.3,0.3-0.7,0.6-1.2,0.9c-0.5,0.5-0.8,0.8-1.1,1.1
                  c-0.2,0.3-0.6,0.6-1.3,0.7c-0.9,0.1-1.5,0.1-1.8-0.2C92.2,117.1,92.1,116.5,92.3,115.5z M103.5,104.5c-0.7,0.7-1.7,1.1-2.9,1.1
                  c-1.5,0.2-2.9,0.1-4.3-0.3c-0.4,0-0.7,0-0.9,0c-0.5,0-0.9,0-1.2-0.1c-0.2-0.1-0.4-0.1-0.6-0.1c-0.2,0-0.6,0-0.9,0
                  c-0.5-0.2-1-0.2-1.7-0.1c-0.7,0.4-1.3,0.7-1.5,1c-0.1,0-0.1,0.1-0.1,0.1c0,0.6-0.1,1.3-0.2,2c-0.1,0.5-0.1,1-0.1,1.4
                  c0,0.5,0,0.9-0.1,1.2c-0.2,0.5-0.3,1-0.2,1.7c0,0.4-0.1,1.1-0.4,2.1c-0.2,1.1-0.5,1.9-0.9,2.4c-0.3,0.4-0.6,0.5-0.9,0.5
                  c-0.5,0-0.8-0.1-1-0.4c-0.4-0.4-0.6-1.4-0.6-3c-0.1-0.7-0.2-1.5-0.3-2.3c-0.1-1.1-0.1-2-0.1-2.5c0-0.4-0.1-0.9-0.2-1.4
                  c-0.1-0.5-0.2-0.9-0.2-1.2c-0.4-0.3-0.8-0.6-1.2-0.9l-0.1-0.1c-0.8,0.1-1.7,0.1-2.5,0.2c-0.9,0.1-1.5,0-1.8-0.1
                  c-0.3,0-0.6,0-0.8,0c-0.5,0.2-1.2,0.2-2.1,0.1c-1.4,0.4-2.6,0.3-3.6-0.2c-0.7-0.5-1.1-1.1-1.1-1.8c0-0.7,0.3-1.4,1-1.8
                  c0.6-0.6,1.3-0.9,2.2-0.9c0.9-0.1,1.9,0.1,2.9,0.4c1,0.3,2,0.4,3.1,0.2c0.6-0.1,1.6-0.2,3.1-0.2c0.6,0,1.1-0.1,1.5-0.2
                  c0.5,0,0.8,0,0.9,0c0.2,0,0.4,0,0.6,0c1.6-0.6,2.8-1,3.5-1.4c0.3-0.2,0.6-0.5,0.9-0.8c0.1-0.5,0.3-0.9,0.6-1.4
                  c0.4-0.5,0.6-0.9,0.6-1.2c0.2-0.6,0.3-1.1,0.5-1.5c0.2-0.3,0.3-0.9,0.3-1.8c0.1-0.9,0.3-1.7,0.4-2.2c0-0.5-0.1-1-0.3-1.4
                  c-1-1-2.4-1.6-4.1-1.7c-2.2-0.5-4.4-0.2-6.7,0.8c-2.5,0.6-4.1,0.7-4.9,0.4c-0.8-0.2-1.3-0.6-1.4-1.2c-0.1-0.7,0.2-1.3,0.9-1.8
                  c0.7-0.8,1.5-1.3,2.4-1.3c0.9,0,2.2-0.4,4.1-1c2.4-0.4,4.2-0.5,5.4-0.5c1.6,0.7,3,1.1,4.3,1c0.8,0.1,1.6,0.5,2.2,1.1
                  c0.2,0.5,0.7,0.9,1.4,1c0.6,0.2,1.2,0.6,1.8,1.4c0.6,0.9,0.8,2.2,0.5,3.6c-0.3,0.7-0.5,1.2-0.6,1.6c0,0.3-0.1,0.6-0.4,1
                  c-0.2,0.4-0.5,1-0.6,1.7c0,0.5-0.1,0.9-0.4,1.4c-0.2,0.3-0.4,0.9-0.5,1.8c0,0.1-0.1,0.3-0.1,0.4c0.2,0.1,0.4,0.3,0.6,0.4
                  c0.7,0.5,1.5,0.9,2.3,1.1l0.2,0.1c0.4,0,0.8,0,1.2-0.1c0.9-0.1,1.9,0.1,2.8,0.6c0.9,0.6,1.3,1.2,1.3,1.8
                  C104.2,103.6,104,104.1,103.5,104.5z M104.4,36.4c-0.1,0.9-0.5,1.4-1.2,1.7c-0.9,0.2-2,0.3-3.2,0.1c-0.3-0.1-0.7-0.1-1-0.2
                  c-0.1,0.2-0.2,0.5-0.4,0.8c-0.5,0.9-0.9,2-1.2,3.3c0,0.1,0,0.3,0,0.4c-0.1,1.2-0.1,1.9-0.1,2.3c0.1,0.3,0.1,1.3-0.1,3
                  c0,0.9,0.1,1.7,0.1,2.3c0,0.5-0.1,1-0.4,1.6c-0.4,0.7-0.4,1.8,0,3.3c0.3,0.9,0.5,2,0.4,3.1c-0.1,1.4,0,2.4,0.1,3
                  c0.5,1.2,0.9,2.7,1.1,4.7c0.2,1.2,0.3,2.1,0.3,2.9c0,0.7-0.1,1.4-0.1,2.2c0.1,0.7-0.1,1.4-0.4,2.2c-0.4,0.7-1,1-1.7,1.2
                  c-0.7,0.1-1.3-0.1-2-0.7c-0.7-0.9-1.1-1.9-1-3.1c0-2.1,0-3.6,0-4.4c0-0.9-0.1-1.6-0.2-2.2c-0.2-0.7-0.1-2.4,0.2-5.4
                  c0.4-3.8,0.5-6.1,0.2-6.8c-0.2-0.7-0.3-1.3-0.2-1.7c0.2-0.6,0.1-1.2-0.1-1.9c-0.2-0.3-0.2-0.8,0-1.3c0.1-0.8,0.1-1.3,0-1.6
                  c-0.1-0.2-0.2-0.5-0.2-0.7c-0.5,0.1-0.8,0.1-0.9,0.2c-1,1-1.6,1.4-1.8,1.3c-0.5-0.3-0.7-0.8-0.6-1.3c0-0.9,0.1-1.7,0.4-2.5
                  c0.1-0.9,0.2-1.7,0.2-2.3c0-0.6,0.1-1,0.1-1.4c-0.7,0-1.4,0.1-2.1,0.2c-0.6,0.1-1.2,0.2-1.8,0.2c-1.2,0.1-2.2,0.4-3.1,0.9
                  c-1,0.6-2.1,1-3.3,1.3c-1.8,0.5-3.2,0.5-4.1-0.1c-0.6-0.4-1-0.8-1.1-1.4c-0.2-0.8,0-1.5,0.6-2.1c0.9-0.8,1.8-1.4,2.8-1.7
                  c0.8-0.3,1.7-0.5,2.6-0.5c1.6-0.2,3.1-0.6,4.3-1.1c1-0.5,2.7-0.7,5.1-0.5c0.3,0,0.6,0,0.9,0c0.6-0.5,1-1.1,1.3-1.7
                  c-0.3-0.9-0.4-1.8-0.2-2.6c0-0.6-0.1-1.5-0.4-2.8c-0.3-1.3-0.4-2.6-0.2-4.1c0.1-0.9,0.5-1.6,1.2-2c0.6-0.3,1.2-0.4,1.8-0.4
                  c0.9,0.2,1.6,0.6,2,1.2c0.5,0.9,0.7,1.7,0.5,2.4c-0.6,1.8-0.8,3.3-0.5,4.4c0.3,1.1,0.3,2.2,0,3.3c0,0.1-0.1,0.2-0.1,0.4l0.1,0.1
                  c0.4,0.5,0.9,0.9,1.4,1.4c0.2-0.1,0.6-0.1,0.9-0.2c0.7-0.1,1.3-0.1,1.9,0.1c1.3,0.3,2.2,0.8,2.7,1.5
                  C104.3,35.1,104.5,35.7,104.4,36.4z"/>
              </g>
            </g>
          </g>
        </svg>
      )
    }else if (module.id === 'marriage') {
      return (
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" x="0px"
          y="0px" viewBox="0 0 155.871 155.871" xmlSpace="preserve" width="84" height="84">
          <g>
            <g>
              <path style={{ fill: "#CC2C1F" }} d="M129.8,9.4c-0.6-0.3-1.3-0.6-1.8-0.8c-3.9,1.4-7.6-0.6-11.3-0.1c-0.7,0.1-1.4-0.2-2.3-0.4
                c-0.5,0.1-1.1,0.3-1.6,0.3c-4.8,0.1-9.6,0.4-14.5,0.4C75.2,9.1,72.1,9,49,9c-1.3,0-2.7-0.5-4-0.3c-2.4,0.3-4.8,0.9-7.3,1.4
                c-0.2,0-0.3-0.1-0.5-0.1c0.1-0.2,0.1-0.3,0.3-0.6c-3.1-1.6-6.2-0.2-9.3-0.1c-0.3,0.5-0.5,1-0.6,1.2c0,1.1,0,1.8,0,2.6
                c0,0.7-0.2,1.4-0.1,2.1c0.1,1.3,0.4,2.6,0.4,4c0.1,2.7,0,5.4,0,8.1c0,2.8,0,5.6,0,8.3c0,2.7,0,5.4,0,8.1c0,2.7-0.1,5.5,0,8.2
                c0.1,7.1,0.1,14.2,0.1,21.3c0,23.2,0,46.5,0,69.9c-2.5,1.5,0,3.4-0.4,5.4c1.6,0.3,3.1,0.7,4.6,0.7c2.3,0,4.6,0.4,6.9-0.4
                c0.3-0.1,0.7,0,1.1,0c1,0.1,1.9,0.3,2.9,0.3c2.7,0,5.4,0,8.1,0c27.3,0,34.5,0,61.8,0c2.1,0,4.1-0.2,6.2,0c2.1,0.2,4.1,0.1,6.2,0
                c1.7-0.1,3.4-0.3,4.4-1.9c0-4.1,0-8.1,0-12.2c0-0.1,0-0.2,0-0.3c-0.3-4.3-0.7-8.7-0.9-13c-0.1-2.3,0-4.6,0.3-6.9
                c0.4-2.6,0.1-5.4,0.1-8.1c0-16.3,0-32.6,0-49c0-1.3-0.1-2.7,0.1-4c0.6-3.2,1-6.5,1-9.8c0-5-0.1-10-0.1-15.1
                c0-3.9-0.3-7.9,0.2-11.8C130.6,14.4,130.5,12,129.8,9.4z M103.8,146.3c-0.6,0.2-1.4,0.3-2.3,0.4c-1.7-0.3-3.7-0.6-6.2-0.9
                c0.8-0.6,1.1-1,1.5-1c2.9-0.1,5.9,0,8.8,0c0.1,0.1,0.2,0.3,0.2,0.4C105.2,145.6,104.5,146,103.8,146.3z M124.7,81.3
                c-0.6,3.7-0.3,7.3-0.4,11c-0.1,3.5,0.4,7-0.5,10.4c-0.2,1-0.1,2.1-0.1,3.2c0,9.8,0,19.5,0,29.3c0,1.2,0.3,2.4,0.5,3.4
                c-1.1,1.9-2.1,3.7-3.1,5.6c-4-0.3-8.1,0.6-12.1-0.5c-0.2,0-0.4,0-0.5,0c-4.5-0.2-8.9-0.4-13.4-0.6c-0.7,0-1.4,0-2.1,0
                c-0.4,0.4-0.6,0.8-0.9,1.1c-1.1,0-2.2,0-3.3,0c-0.5-0.3-1-0.7-1.6-1.1c-4.3,0.3,11.3-0.3,7,0.4c-2,0.3-4.1-0.1-6.2,0.1
                c-6,0.6-12,0.6-17.9,0.6c-2.4,0-4.8,0.5-7.2,0.3c-7.3-0.7-14.7-0.3-22-0.4c-1.5,0-3,0.3-4.6-0.3c-1.6-1.2-1.6-3.7-3.9-4.3
                c1.1-4,0.7-7.9,0.4-11.8c-0.3-3.8-0.2-7.7-0.4-11.5c-0.1-2-0.3-3.9-0.5-5.8c-0.2-3.5,0.5-6.9,1.2-10.3c0.2-0.8,0.4-1.6,0.3-2.4
                c-0.7-3.3-0.8-6.7-1.1-10.1c-0.3-3.5-0.3-7-0.3-10.4c0-3.4,0.3-6.8,0.5-10.2c0-0.4,0.2-0.9,0.3-1.3c0.9-2.5,0.9-5,0.4-7.6
                c-0.4-2.4-0.7-4.9-0.7-7.4c-0.1-5.6,0-11.1-0.1-16.7c0-2,0.1-4.1-0.4-6.1c-0.4-2,0-4.1,0.6-6c0.4-1.1,0.8-2.3,0.5-3.6
                c-0.2-1,0.4-1.9,1.2-2.5c0.6-0.5,1.2-1,1.9-1.5c0.8,0.1,1.7,0.3,2.7,0.2c2.5-0.3,5-0.1,7.5-0.2c1.2,0,2.5-0.3,3.7-0.4
                c1.6-0.2,3.2-0.2,4.3,1.8c2.2-0.2,4.5-0.6,6.8-0.7c3-0.1,5.9-0.1,8.9-0.2c1.2,0,2.5-0.2,3.7-0.4c0.4,0,0.9-0.1,1.3,0
                c2.5,0.7,5,0.4,7.5,0.4c10.9,0,1.9,0.1,12.8-0.1c2.4,0,4.8,0.1,7.1,0.1c5.3-0.1,10.5-0.3,15.8-0.5c1.2,0,2.3,0,3.3,0
                c1.6,0.9,2.2,2.4,2.6,3.8c0.5,1.7,0.7,3.5,0.6,5.3c-0.1,4-0.1,8.1-0.6,12c-0.8,6.1-0.3,12.2-0.5,18.2c-0.1,3.5-0.1,7,0.1,10.5
                c0.2,3.9,0.7,7.8,0.9,11.7C124.8,77.7,125,79.5,124.7,81.3z M128.9,146.7c-0.9-0.2-0.9-0.2-0.7-2.2
                C128.5,145.5,128.7,146.1,128.9,146.7z"/>
              <path style={{ fill: "#CC2C1F" }} d="M38.7,18c-0.8,0.3-1.6,0.6-1.2,1.7C38,19.2,38.3,18.6,38.7,18z" />
              <g>
                <path style={{ fill: "#CC2C1F" }} d="M89.7,28.7c0.2-0.2,0.3-0.3,0.5-0.5c0-0.9-0.2-1.6-0.5-2.2c-0.2-0.4-0.6-0.6-1.1-0.7c-0.7,0-1.3-0.1-1.7-0.2
                  C86.5,25,86.1,25,85.5,25c-0.5,0-0.9,0.1-1.2,0.1c-0.9,0.2-1.6,0.2-2.2,0.2c-0.9-0.1-1.8-0.1-2.9,0.1c-0.5,0.1-1,0.1-1.7,0.1
                  c-0.4,0.2-0.8,0.5-1,0.8c0,0.2,0,0.5,0,0.8c-0.2,0.3-0.2,0.6-0.2,0.9c0.1,0.3,0.1,0.6-0.1,1c0,0.3,0.1,0.6,0.4,0.9
                  c0.3,0.3,0.6,0.4,1,0.4c0.7-0.1,1.4-0.1,2.3-0.2c0.6,0.1,1.2,0,1.7-0.1c0.5-0.2,1.2-0.4,2.1-0.4c0.9,0.1,2,0,3.4-0.3
                  C88,29,88.6,29,89.2,29C89.3,28.9,89.5,28.8,89.7,28.7z"/>
                <path style={{ fill: "#CC2C1F" }} d="M56.3,51.2c0.6,0,1,0.1,1.2,0.3c0.4,0.2,0.8,0.3,1,0.2c0.6-0.2,1-0.2,1.2-0.1c0.5,0.1,1,0,1.8-0.2
                  c0.7-0.3,1.3-0.8,1.8-1.4c0-0.5,0.1-0.9,0.3-1.2c0.2-0.5,0.3-1.1,0.2-1.9c0-0.7-0.2-1.2-0.5-1.5c-0.2-0.1-0.3-0.4-0.3-0.7
                  c-0.2-0.5-0.4-0.8-0.7-1.1c-0.1-0.2-0.2-0.3-0.2-0.4c0-0.1-0.1-0.3-0.2-0.4c-0.4-0.4-0.7-0.8-0.9-1c-0.4,0-0.8,0.2-1.2,0.5
                  c-0.3,0.2-0.8,0.4-1.5,0.6c-0.6,0.1-1,0.4-1.2,0.9c-0.2,0.9-0.7,1.6-1.6,2.1c-0.5,0.2-0.7,0.6-0.7,1c0,0.6-0.2,1-0.4,1.3
                  c-0.5,0.3-0.7,0.7-0.6,1.1c0.1,0.6,0.4,1.2,0.9,1.7C55.4,51.1,55.8,51.2,56.3,51.2z"/>
                <path style={{ fill: "#CC2C1F" }} d="M75.9,109.7l-3.3,0.6c-0.8,0.1-1.8,0.3-3.1,0.6c0.7,0.7,1.2,1.7,1.4,3l1.7,0.8c0.8-0.1,1.8-0.2,3-0.2h2.9
                  c2.3-0.1,4.1-0.7,5.5-1.8c0.1-0.1,0.1-0.2,0.1-0.4l0.1-0.4c0-0.2,0.1-0.3,0.2-0.6c0-0.2,0.1-0.3,0.2-0.6l0.6-1.1
                  c-0.8-0.2-1.8-0.3-3-0.3C80.4,109.2,78.3,109.3,75.9,109.7z"/>
                <path style={{ fill: "#CC2C1F" }} d="M121.6,27.7c0-2.1-0.2-4.1-1.1-5.7c-1.8-1.5-3.4-2.9-5.1-4.4c-2.6,0-5.4,0.1-8.1,0
                  c-4.7-0.2-9.4-0.9-14.1-0.9c-14.7-0.1-9.4-0.1-24.1,0c-3.8,0-7.7-0.3-11.5,0.4c-1.5,0.3-3.1,0.1-4.5-0.1
                  c-4.2-0.6-8.3-0.3-12.4,0.7c-0.2,0.1-0.4,0.2-0.7,0.3c0.2,0.7,0.3,1.4,0.5,2.1c-1.2,0.6-2.3,1.2-3.5,1.9
                  c-0.4,0.8-0.9,1.8-1.2,2.3c-0.2,6.1-0.5,11.7-0.7,17.3c-0.1,4.6-0.1,9.1-0.1,13.7c0,1.5-0.5,3.1-0.3,4.5c0.5,3,0.2,6.1,0.3,9.1
                  c0.2,5.4-0.3,10.7,0.5,16.1c0.1,0.4,0,0.9-0.1,1.3c-0.1,1-0.3,1.9-0.3,2.9c0,5.2,0,10.4,0,15.6c0,0.5,0,1.1,0,1.6
                  c0.3,4.3,0.7,8.5,0.9,12.8c0.1,2-0.1,4.1-0.3,6.1c-0.3,2.5-0.1,5-0.2,7.5c-0.1,1.5,0.1,3,0.9,4.3c0.8,0.5,1.5,1,2.3,1.5
                  c0.1,0.4,0.2,0.8,0.3,1.2c0.7,0.1,1.3,0.2,1.9,0.3c0.3,0.5,0.6,0.9,0.8,1.3c2.2,0.2,4.3,0.4,6.5,0.6c0.3,0,0.7,0,1.1-0.1
                  c1.1-0.1,2.1-0.3,3.2-0.3c2,0.1,4.1,0.4,6.1,0.4c5.4,0,10.7,0.2,16.1-0.3c3-0.3,6.1-0.1,9.2,0.1c0.3,0,0.6-0.1,1.1-0.1
                  c5.5-0.4,11.1-0.6,16.6,0.3c0.6,0.1,1.3,0,1.9,0c1.3-0.1,2.6-0.3,4-0.4c2.3-0.1,4.7,0,6.7,0c1.3-0.9,2.3-2,4-1.2
                  c1.1-2,2.3-4,3.4-6c-0.1-0.1-0.2-0.2-0.3-0.2c0-1.1,0-2.1,0-3.2c0.1-2,0.4-3.9,0.4-5.8c0-8.3,0-16.7,0-25
                  C121.5,75.9,121.5,51.8,121.6,27.7z M69.3,57.1c0.4-0.6,1-1,1.7-1.2c0.9-0.3,1.7-0.6,2.3-0.8c0.5-0.3,1.1-0.6,1.8-0.7
                  c0.6-0.2,1.2-0.4,1.8-0.8c0.9-0.6,1.5-1.1,1.8-1.7c0.8-0.7,1.5-1.3,2-2c0.6-0.7,1.3-1.1,2-1.1c0.6,0,1.1,0.3,1.4,0.8
                  c0.5,0.5,0.6,1,0.3,1.4c-0.1,0.5-0.4,1-0.8,1.4c-0.3,0.5-0.7,0.8-1.2,1c-0.6,0.2-1.1,0.6-1.6,1.2c-0.2,0.3-0.8,0.8-1.8,1.4
                  c-0.8,0.7-1.4,1.1-1.7,1.2c-0.2,0-0.6,0.3-1.3,0.7c-0.4,0.3-0.9,0.6-1.5,0.8c-0.5,0.1-1,0.4-1.7,0.7c-0.7,0.5-1.5,0.7-2.3,0.5
                  c-0.8-0.2-1.4-0.6-1.7-1.2C68.8,58.2,68.9,57.6,69.3,57.1z M85.5,54.7c0.7-0.2,1.2-0.1,1.6,0.3c0.4,0.4,0.4,0.9,0.2,1.5
                  c-0.2,0.6-0.6,1.3-1.3,2c-0.4,0.5-0.7,0.8-1.1,0.9c-0.3,0.2-0.5,0.3-0.7,0.5c-0.5,0.7-1,1.1-1.5,1.1c-0.6,0.1-1.1,0-1.4-0.3
                  c-0.3-0.3-0.4-0.7-0.2-1.2c0.3-0.8,0.6-1.4,0.9-1.8c0.5-0.7,1-1.2,1.5-1.7C84.2,55.3,84.9,54.9,85.5,54.7z M80.5,91.6
                  c1.1-0.2,2.6-0.1,4.5,0.1l2.2,0.3c0.9,0.1,1.6,0.1,2.2,0.1c1.1,0,1.9,0.2,2.6,0.5c0.8,0.5,1.2,1.2,1.2,2.2c0,1.4-0.9,2-2.8,2
                  c-0.5,0-0.9-0.1-1.5-0.2c-0.2,0-0.4,0-0.7-0.1l-1.4-0.4c-0.3,0-0.5-0.1-0.7-0.2c-0.5-0.1-1-0.1-1.5-0.1c-0.4,0-1.1,0.1-2,0.2
                  c-0.9,0.1-1.5,0.2-2,0.2c-0.4,0-1-0.1-1.7-0.2c-0.8-0.2-1.4-0.2-1.7-0.2c-0.3,0-0.8,0.1-1.5,0.2c-0.7,0.1-1.2,0.2-1.5,0.2
                  l-1.8-0.1c-0.2,0-0.4,0-0.6-0.1c-0.9,0-1.7,0.1-2.4,0.4l-1,0.4c-0.4,0.2-0.7,0.3-0.9,0.3c-0.6,0.2-1.3,0.3-2,0.2l-0.7-0.1
                  c-0.6,0.3-1.2,0.4-1.9,0.4c-1.4,0-2.2-0.7-2.2-2.2c0-1,0.6-1.8,1.8-2.5c1-0.6,2.1-0.9,3.1-0.9h4.8l0.7,0.1
                  c0.3,0.1,0.5,0.1,0.6,0.1c1.4-0.6,2.3-1.2,2.7-1.7c-0.3-0.3-0.8-0.6-1.5-0.9h-1.4c-0.4,0-0.9,0.1-1.6,0.2
                  c-0.7,0.1-1.2,0.2-1.6,0.2c-0.9,0-2.1,0.1-3.6,0.4c-1.6,0.2-2.8,0.4-3.6,0.4c-1,0-2.1-0.2-3.1-0.7c-1.3-0.5-2-1.2-2-2.1
                  c0-1,0.7-1.8,2.1-2.3c1.1-0.4,2.2-0.6,3.4-0.6c0.7,0,1.9,0.1,3.4,0.4c1.5,0.3,2.6,0.4,3.3,0.4c0.4,0,0.8,0,1.2-0.1l1.1-0.2
                  c0.3-0.1,0.5-0.1,0.6-0.1l0.6-0.1c0.4-0.1,0.8-0.1,1.1-0.1h0.3c0.3-0.2,0.7-0.5,1.1-0.9c-0.1-1.2,0-2.2,0.2-3
                  c0.4-1,1.1-1.5,2.3-1.5c0.9,0,1.6,0.5,2.1,1.4c0.4,0.7,0.6,1.6,0.6,2.6l0.7,0.6c0.3,0,0.8,0.1,1.5,0.2c0.7,0.1,1.2,0.2,1.5,0.2
                  c0.3,0,0.8-0.1,1.5-0.2c0.7-0.1,1.2-0.1,1.6-0.1c0.5,0,1.2,0.1,2.2,0.2c0.9,0.2,1.7,0.2,2.2,0.2h1.8c0.9,0,1.8,0.1,2.5,0.2
                  c2.1,0.4,3.1,1.2,3.1,2.3c0,0.8-0.5,1.4-1.4,1.8c-0.7,0.3-1.6,0.5-2.5,0.5c-0.7,0-1.7-0.1-3.1-0.4c-1.4-0.3-2.5-0.4-3.2-0.4
                  l-6.2-0.1c-1.2,0.6-2,1.2-2.6,1.8C79.7,91,80.2,91.4,80.5,91.6z M76.6,66.5c-0.7,0.8-1.3,1.4-2,1.8c-1.2,0.6-2.4,1-3.5,1.3
                  c-0.7,0.2-1.4,0.3-2,0.1c-0.6-0.1-0.9-0.4-1-0.7c-0.2-0.4-0.3-0.9-0.2-1.6c0.1-0.5,0.5-1,1-1.5c0.9-0.8,2-1.4,3.2-1.7
                  c0.4-0.1,0.7-0.2,1-0.3c0.5-0.3,1.1-0.6,1.8-0.7c0.3-0.1,0.7-0.2,1-0.5c1-0.9,1.9-1.4,2.6-1.5c0.5-0.1,0.9,0,1.4,0.1
                  c0.3,0.1,0.6,0.3,0.8,0.6c0.2,0.3,0.2,0.6,0.1,0.9c-0.1,0.3-0.3,0.6-0.7,1c-0.5,0.6-1.2,1.1-2.1,1.7
                  C77.6,65.7,77.1,66.1,76.6,66.5z M49.6,33.2c0.3-0.2,0.4-0.4,0.4-0.7c0-0.4,0.4-1.2,1.2-2.5c0.8-1.4,1.4-2.2,1.7-2.4
                  c0.2-0.2,0.4-0.5,0.5-0.9c0.1-0.4,0.4-0.6,0.7-0.8c0.3-0.1,0.5-0.3,0.5-0.6c0.1-0.4,0.3-0.6,0.6-0.7c0.2-0.1,0.5-0.4,0.8-0.9
                  c0.7-1,1.2-1.5,1.4-1.4c0.3,0.1,0.6,0,0.9-0.1c0.4-0.2,0.8-0.2,1.4-0.1c0.4,0.2,0.7,0.2,1,0.2c0.6-0.1,1.2,0,1.9,0.5
                  c0.9,0.7,1.3,1.4,1.3,2.1c0,0.6-0.1,0.9-0.4,1.1c-0.6,0.5-1.1,0.7-1.5,0.7c-0.4-0.1-0.7-0.1-0.9,0.1c-0.3,0.2-0.6,0.3-1,0.2
                  c-0.2-0.1-0.5,0-0.8,0.2c-0.3,0.2-0.5,0.3-0.7,0.2c-0.2,0-0.5,0.1-0.8,0.4c-0.3,0.4-0.5,0.7-0.6,1c-0.1,0.4-0.3,0.7-0.6,0.9
                  c-0.4,0.2-0.6,0.6-0.8,1c-0.2,0.5-0.5,0.8-0.6,0.9c-0.3,0.2-0.6,0.8-0.8,1.8c-0.4,1-0.5,1.7-0.4,2.1c0.4,0.6,0.7,0.9,0.9,1.1
                  c0.3,0.1,0.5,0.2,0.5,0.5c0.1,0.3,0.4,0.5,0.9,0.6c0.5,0.1,0.8,0.2,0.9,0.4c0.7,0.1,1.1-0.1,1.4-0.6c0.3-0.5,0.6-0.7,0.9-0.7
                  c0.4,0,0.7-0.4,0.9-1c0.1-0.2,0.2-0.5,0.4-0.6c0.4-0.3,0.7-0.7,0.9-1.4c0.2-0.5,0.3-0.8,0.5-0.9c0.2-0.4,0.3-0.8,0.2-1
                  c-0.1-0.3-0.5-0.7-1.3-1.1c-0.4-0.2-0.4-0.6-0.2-1.3c0.2-0.4,0.6-0.6,1.2-0.7c0.3,0,0.6-0.1,0.7-0.4c0.3-0.2,0.6-0.2,1-0.1
                  c0.2,0.1,0.6,0.2,1,0.2c1.2,0,2.2,0.5,2.9,1.5c0.5,0.6,0.7,1,0.6,1.3c-0.2,0.3-0.2,0.7,0.1,1.4c0.2,0.5,0.2,0.9,0.1,1.5
                  c-0.3,0.7-0.7,1.2-1,1.3c-1,0.3-1.8,0.7-2.3,1.4c-0.3,0.4-0.5,0.7-0.6,1.1c-0.2,0.6-0.4,1.2-0.6,1.7c0,0.2,0,0.3,0,0.5
                  c0.3,0.1,0.6,0.4,0.9,0.7c0.1,0.2,0.3,0.3,0.4,0.4c0.4,0.2,0.7,0.5,0.9,1c0.2,0.4,0.5,0.7,0.7,1c0.2,0.2,0.4,0.5,0.6,1
                  c0.4,0.9,0.6,1.6,0.7,2.2c0.2,0.9,0.3,1.5,0.5,1.9c0.2,0.5,0.3,1,0.3,1.4c0,1-0.3,1.8-0.9,2.5c-0.5,0.6-1.1,0.9-1.8,1
                  c-0.2,0-0.4,0-0.5,0c-0.1,0-0.1,0.1-0.2,0.1c-0.7,0.4-1.4,0.9-2,1.6c-0.8,0.9-2,1.4-3.4,1.5c-0.5,0-1,0-1.7,0.2
                  c-0.7,0.2-1.3,0-1.9-0.4c-0.8-0.5-1.6-0.7-2.3-0.6c-1.2,0.1-2.3-0.3-3.3-1.3c-1-1.4-1.5-2.4-1.4-3c0-0.5,0-0.9-0.1-1.5
                  c-0.2-0.5-0.1-1.1,0.2-1.8c0.6-1.4,1.1-2.2,1.7-2.3c0.3-0.2,0.5-0.6,0.6-1.1c0.1-0.6,0.5-1.3,1.2-2.1c0.5-0.7,0.6-1.4,0.3-2.1
                  c0-0.3-0.2-0.6-0.4-1c-0.2-0.4-0.5-0.6-0.8-0.7c-0.7-0.2-1.1-0.6-1.3-0.9c-0.1-0.2-0.3-0.4-0.6-0.5C50.1,37.2,50,37,50,36.6
                  c0-0.2-0.1-0.4-0.3-0.7c-0.2-0.3-0.4-0.6-0.4-0.9C49.4,34,49.4,33.4,49.6,33.2z M49,64.8c0.4-0.8,0.9-1.4,1.7-1.8
                  c0.9-0.5,1.8-0.8,2.8-0.9c0.5,0,0.8-0.1,1-0.2c0.5-0.3,1.1-0.4,1.7-0.4c0.5,0,0.8-0.1,1-0.2c0.7-0.3,1.3-0.5,1.8-0.6
                  c0.5,0,1.2,0,2,0.2c0.2,0,0.5,0,0.8-0.1c0.3-0.2,0.6-0.3,0.9-0.3c0.7-0.1,1.3-0.2,2-0.4c0.5-0.1,0.9-0.1,1.5-0.1
                  c0.5,0.2,1.1,0.4,1.7,0.7c0.5,0.5,0.7,1.1,0.6,2c-0.2,0.8-0.6,1.4-1.4,1.7c-0.8,0.4-1.7,0.5-2.8,0.4c-0.8,0-1.6,0.1-2.4,0.4
                  c-0.6,0.1-1.3,0.2-2,0.1c-1,0-1.8,0.2-2.4,0.7c-0.4,0.3-0.8,0.5-1.2,0.6c-0.5,0.1-0.8,0.3-1,0.6c-0.2,0.4-0.7,0.7-1.4,1.1
                  c-1.2,0.5-2.2,0.7-3.1,0.4c-0.9-0.3-1.6-0.8-1.8-1.5C48.7,66.4,48.7,65.7,49,64.8z M57.4,121.1c-1,0.2-2,0.5-3.1,0.6
                  c-1,0.1-1.7,0.2-2.3,0.2c-1.9,0-2.9-0.8-2.9-2.5c0-2.2,1.3-3.3,3.8-3.3c0.2,0,0.4,0,0.7,0.1l1.4,0.4c0.3,0,0.5,0.1,0.7,0.1
                  l1.5-0.1c0.8,0,1.4,0,2,0.1c1.6,0.2,2.3,0.9,2.3,1.9C61.5,119.5,60.1,120.4,57.4,121.1z M95.3,132.5c-0.5,1.2-1.2,1.8-2.2,1.8
                  c-0.2,0-0.4,0-0.7,0.1l-1.1,0.4c-0.2,0-0.4,0.1-0.6,0.1c-0.4,0-0.9,0-1.6,0.1c-0.7,0.1-1.2,0.1-1.5,0.1c-0.2,0-0.4,0-0.7-0.1
                  l-1.2-0.4c-0.2,0-0.5-0.1-0.7-0.1c-0.1,0-0.3,0-0.4,0.1l-0.9,0.2c-0.2,0-0.3,0.1-0.4,0.1c-0.2,0-0.4,0-0.6-0.1l-1.3-0.3
                  c-0.2,0-0.5-0.1-0.7-0.1c-0.4,0-1,0-1.8,0.1c-0.8,0.1-1.5,0.2-1.9,0.2c-0.5,0-1.2-0.1-2-0.3c-0.9-0.2-1.5-0.2-1.9-0.2h-4.2
                  c-0.4,0-0.8,0-1.2,0.1l-2.4,0.6c-0.5,0.1-0.9,0.1-1.3,0.1c-1.3,0-2.4-0.8-3.3-2.4c-0.7-1.4-1.1-2.8-1.1-4.3
                  c0-1.7,0.3-3.3,0.9-4.7c0.8-1.9,1.9-2.8,3.5-2.8c0.4,0,0.9,0.1,1.4,0.3c0.2,0.1,0.4,0.2,0.6,0.4l0.6,0.4c0.6,0,1.2,0.3,1.7,0.9
                  l0.2,0.8c0,0.8-0.8,1.3-2.3,1.6c-1.6,0.3-2.3,1.4-2.3,3.1c0,1.9,0.9,2.8,2.6,2.8c0.7,0,1.8-0.1,3.2-0.3c1.4-0.2,2.5-0.3,3.2-0.3
                  l4.4-0.1c0.2,0,0.4,0,0.7,0.1l0.6,0.1c0.3,0.1,0.5,0.1,0.7,0.1c0.2,0,0.4,0.1,0.6,0.1c0.2,0,0.4,0,0.7-0.1l1.4-0.3
                  c0.2,0,0.5-0.1,0.7-0.1c0.4,0,0.9,0.1,1.5,0.2c0.7,0.2,1.1,0.3,1.5,0.3h1.7c0.7,0,1.4-0.1,1.9-0.2c1.5-0.3,2.3-1,2.3-2.1
                  c0-0.5-0.1-1-0.4-1.4c0-0.7-0.2-1.3-0.6-1.8c0-0.3-0.1-0.5-0.3-0.7c-0.1-0.1-0.2-0.3-0.5-0.4l-0.6-0.3c-0.2-0.1-0.5-0.3-0.6-0.4
                  l-0.1-0.6c0-1.1,0.6-1.7,1.8-1.7c1.8,0,3.3,1,4.4,3c0.9,1.7,1.4,3.5,1.4,5.4C95.8,130.6,95.6,131.6,95.3,132.5z M70.4,122.4v-0.2
                  c0.2-0.4,0.8-0.7,1.5-1.1c0.8-0.3,1.4-0.5,1.8-0.5l2.1,0.1c0.5-0.3,1.1-0.5,2-0.5h2c0.3,0,0.7,0,1.1,0.1l1.6,0.2h0.7
                  c0.7,0,1.3,0,1.7,0.1c1.4,0.2,2.2,0.7,2.2,1.6c0,0.9-0.5,1.6-1.5,1.9c-0.3,0.1-0.8,0.2-1.3,0.2c-0.2,0-0.4,0.1-0.7,0.1H83
                  c-1.1,0-2.4-0.1-3.9-0.3c-0.5,0-1.2,0-2.3,0.2l-1.3,0.2c-0.5,0.1-0.8,0.1-1.2,0.1c-1.3,0-2.5-0.5-3.7-1.4
                  C70.4,123,70.4,122.8,70.4,122.4z M100.6,121.4c-0.7,0-1.4-0.1-2.2-0.4c-0.3-0.1-0.6-0.2-1-0.4l-0.7-0.3c0,0-0.1-0.1-0.2-0.1
                  c0,0-0.1-0.1-0.1-0.1c-0.9-0.4-1.6-0.6-2.1-0.8c-0.8-0.2-1.6-0.4-2.3-0.4c-0.4,0-0.8,0-1.3-0.1l-2.6-0.5
                  c-0.5-0.1-0.9-0.1-1.2-0.1l-5.8-0.2c-1.1,0-2.3,0.1-3.7,0.2l-7.5,0.9c-1.4,0.1-2.6,0.2-3.7,0.2c-0.7,0-1.4-0.1-2-0.3
                  c-0.9-0.3-1.3-0.8-1.3-1.4c0-0.7,0.4-1.2,1.1-1.6c0.2-0.2,0.6-0.3,1-0.5l1-0.3c0.2-0.2,0.3-0.4,0.4-0.6c0.1-0.2,0.1-0.4,0.2-0.7
                  c-0.2-0.3-0.3-0.7-0.5-1.3l-0.4-1.3l-1-0.2c-0.4-0.1-0.8-0.2-1-0.4c-0.8-0.3-1.2-0.8-1.4-1.4c-0.5-0.5-0.7-1-0.7-1.5l0.1-1.1
                  c0-0.4-0.1-0.7-0.2-1.1l-0.1-0.6c0-0.4,0-0.9,0.1-1.5c0.2-0.7,0.2-1.2,0.2-1.5c0-1.7,0.8-2.8,2.5-3.1c0.5-0.1,1.3-0.2,2.2-0.2
                  h1.1c0.5,0,0.8,0,1-0.1l4.2-0.2c1.6-0.1,2.9-0.1,4-0.1l2.4,0.4c1,0.2,1.5,0.6,1.5,1.3c0,0.8-1.7,1.5-5.2,2
                  c-1.2,0.2-2.5,0.3-3.9,0.4l-2.5,0.1c-1.9,0-2.9,0.9-2.9,2.6c0,1.4,0.7,2.2,2.2,2.2c0.6,0,1.4-0.1,2.3-0.2l5.1-1.2
                  c0.9-0.2,1.6-0.2,2.2-0.2c0.7,0,1.4,0,2.2-0.1l4.4-0.1c0.8,0,1.5-0.1,2.2-0.1c1.3,0,1.9-0.9,1.9-2.6c0-0.4-0.1-0.7-0.4-1
                  l-2.2-0.1c-0.9,0-1.7-0.1-2.4-0.4c-1.1-0.3-1.6-0.8-1.6-1.5c0-0.7,1-1.1,3.1-1.3c0.7-0.1,1.5-0.1,2.4-0.2H89c1,0,1.9,0.3,2.8,0.9
                  c1,0.7,1.5,1.4,1.5,2.3l-1.5,6.7c-0.1,0.5-0.4,0.8-0.9,1l-1.4,0.3c0,0.1-0.1,0.3-0.2,0.6c-0.1,0.3-0.2,0.6-0.4,1l-0.4,1
                  c-0.1,0.3-0.2,0.5-0.2,0.6c0.2,0.2,0.5,0.4,0.8,0.7l0.8,0.6c0.5,0,1,0.1,1.7,0.2l1.2,0.3c0.2,0,0.3,0.1,0.4,0.1
                  c1.4,0.3,2.5,0.5,3.3,0.5h2.2c1,0,1.8,0.1,2.6,0.3c2,0.5,3,1.5,3,3.1C104.3,120.5,103.1,121.4,100.6,121.4z M105.1,65.3
                  c-0.4,0.8-0.8,1.2-1.4,1.3c-0.6,0.2-1.4,0.2-2.5-0.1c-0.5-0.1-1.1-0.4-1.8-0.9c-0.4-0.3-0.7-0.6-0.9-0.9
                  c-0.1-0.2-0.2-0.4-0.3-0.6c-0.2-0.1-0.5-0.4-0.7-0.9c-0.2-0.4-0.4-0.6-0.6-0.7c-0.2-0.2-0.5-0.5-0.6-0.9c-0.1-0.3-0.5-0.9-1-1.7
                  c-0.5-0.6-0.8-1-1-1.3c-0.3-0.4-0.6-0.9-0.9-1.4c-0.3,0.1-0.5,0.1-0.5,0.2c0,0-0.1,0-0.1,0.1c0,0.4,0.1,0.8,0.3,1.2
                  c0.2,1.8,0.2,3.3-0.2,4.7c-0.2,1.2-0.6,2.1-1.2,2.8c-0.6,0.8-1,1.8-1.3,2.9c-0.2,0.7-0.4,1.3-0.7,1.7c-0.3,0.4-0.6,0.9-0.9,1.7
                  c-0.1,0.5-0.5,1-1.2,1.4c-0.9,0.5-1.8,0.7-2.7,0.7c-0.9,0.2-1.8,0.1-2.5-0.2c-0.3-0.3-0.9-0.6-1.8-0.7c-0.2,0-0.5-0.2-0.6-0.5
                  c-0.1-0.4-0.4-0.8-0.9-1.2c-1-0.5-1.6-1.1-1.6-1.6c-0.2-1-0.1-1.7,0.2-2.3c0.7-0.5,1.2-0.7,1.6-0.6c1.1,0.6,1.9,1.1,2.2,1.4
                  c0.1,0.2,0.3,0.3,0.4,0.4c1,0.2,1.8,0.2,2.3,0.1c0.2-0.2,0.5-0.3,0.9-0.4c0.3,0,0.9-0.6,1.7-1.6c0.8-1.1,1.3-2,1.3-2.5
                  c0.1-0.6,0.2-1.1,0.4-1.4c0.2-0.2,0.2-0.6,0.1-1.2c0.1-0.5,0.3-1.1,0.4-1.8C89,59.7,89.1,59,89.2,58c0-1.1,0-1.8-0.1-2.2
                  c-0.3-0.7-0.5-1.4-0.6-2.3c-0.1-0.7-0.3-1.1-0.4-1.4c-0.2-0.3-0.3-0.6-0.3-1c0-0.3-0.2-0.9-0.5-1.7c-0.3-0.4-0.7-0.8-1.1-1.2
                  c-0.7-0.4-1.1-0.8-1.4-1c-0.2-0.3-0.4-0.5-0.7-0.5c-0.9-0.2-1.7-0.5-2.3-0.9c-0.3,0-0.5,0-0.7,0.1c0,0-0.1,0-0.1,0.1
                  c-0.2,0.2-0.4,0.3-0.6,0.5c-0.1,0.2-0.3,0.3-0.7,0.5c-0.2,0.1-0.4,0.2-0.6,0.5c-0.2,0.2-0.5,0.4-0.9,0.6
                  c-0.5,0.3-0.9,0.5-1.2,0.5c-0.3,0-0.8,0.2-1.5,0.7c-0.7,0.5-1.5,0.8-2.2,0.8c-0.9,0.1-1.6,0-2.1-0.3c-0.7-0.5-1.1-1-1.2-1.8
                  c-0.1-0.5,0.2-1.1,0.8-1.7c0.6-0.6,1.4-0.9,2.2-0.9c1.5-0.2,2.5-0.4,3.1-0.8c0.2-0.2,0.5-0.3,0.7-0.3c0.8-0.3,1.3-0.6,1.4-0.7
                  c0.1-0.1,0.3-0.2,0.6-0.4c0.2-0.1,0.4-0.2,0.6-0.4c0.3-0.3,0.5-0.5,0.7-0.5c0.3-0.2,0.7-0.5,1.1-0.8c0.1-0.1,0.2-0.2,0.4-0.2
                  c-0.1-0.2-0.1-0.3-0.2-0.3C80.7,41,79.9,41,79,41c-0.9,0.1-1.5,0-1.8-0.1c-0.4,0-0.7,0-0.9,0c-0.4,0.2-1.1,0.2-2,0.1
                  c-1.4,0.4-2.6,0.3-3.6-0.2c-0.7-0.5-1.1-1.1-1.1-1.8c0-0.7,0.3-1.3,0.9-1.8c0.7-0.6,1.4-0.9,2.3-1c0.9-0.1,1.8,0.1,2.8,0.4
                  c1.1,0.3,2.1,0.4,3.2,0.2c0.7-0.2,1.7-0.3,3.2-0.3c0.6,0,1.1,0,1.5-0.2c0.5-0.1,0.8-0.1,0.9-0.1c0.6,0,1.5,0,2.8-0.2
                  c0.2,0,0.3,0,0.5,0c0,0,0.1-0.1,0.2-0.1c0-0.2,0.1-0.3,0.2-0.4c0.2-0.5,0.5-1,0.8-1.5c-0.2-0.2-0.5-0.5-0.6-0.7
                  c-0.8,0.1-1.7,0.1-2.8-0.1c-0.8-0.1-1.7,0-2.6,0.2c-0.8,0.2-1.7,0.2-2.7,0.1c-1.4-0.2-2.7-0.2-3.8,0.1c-1.1,0-2-0.2-2.6-0.9
                  c-0.9-0.8-1.3-1.5-1.2-2c0.1-0.6,0.1-0.9,0.1-1.1c0-0.2,0-0.5,0.1-0.7c0.2-0.5,0.2-1,0.2-1.4c-0.1-0.5,0-0.8,0.1-1.1
                  c0.2-0.6,0.3-1.4,0.4-2.4c0-0.7,0.1-1.4,0.6-2c0.5-0.6,1-0.9,1.7-1h0.1c0-0.2,0.1-0.2,0.3-0.1h0.1H76c0.1,0,0.2,0,0.3,0.1h0.1
                  c0.1,0,0.2,0.1,0.2,0.1c0.4,0.1,0.7,0.2,1,0.4c0.5-0.1,1.2-0.2,2-0.2c0.5,0,0.9,0.1,1.3,0.2c0.6,0.1,1.2,0.2,1.8,0.1
                  c0.6,0,1.4,0,2.3,0.1c0.6,0,1.2,0,1.7-0.2c0.5-0.2,1.1-0.2,1.7-0.1c0.9,0.1,1.4,0.3,1.7,0.4c0.3,0.2,0.7,0.4,1.2,0.4
                  c0.7,0,1.3,0.3,1.9,0.9c0.7,0.7,1,1.3,1.2,1.9c0.2,1.6,0.1,3.1-0.4,4.5c-0.5,1.3-0.8,2.8-0.9,4.5c0,0.5-0.2,1-0.4,1.7
                  c0.2,0.1,0.3,0.3,0.6,0.6v0.1c0.9-0.5,1.8-0.7,2.9-0.6c1,0.1,1.8,0.1,2.5,0.1c1-0.1,1.9,0.1,2.8,0.6c0.9,0.6,1.4,1.2,1.4,1.8
                  c0,0.6-0.2,1.1-0.7,1.5c-0.8,0.7-1.8,1.1-3,1.2c-1.4,0.1-2.8,0-4.2-0.4c-0.4,0-0.7,0-1,0.1c-0.5,0-0.9,0-1.1-0.1
                  c-0.2-0.1-0.4-0.1-0.6-0.1c-0.2,0-0.6,0-1,0c-0.6-0.2-1.4-0.2-2.4,0c-0.4,0.1-0.7,0.1-0.9,0.2c-0.5,0.2-0.9,0.3-1.2,0.4
                  c-0.2,0.1-0.3,0.2-0.3,0.2c-0.2,0.1-0.3,0.1-0.3,0.2c-0.1,0.4-0.2,0.7-0.2,1.1c0,0-0.1,0.1-0.1,0.1c0.3,0.1,0.5,0.3,0.6,0.6
                  c0.1,0.2,0.3,0.4,0.6,0.6c0.3,0.3,0.6,0.7,0.8,1.2c0,0.3,0.2,0.7,0.7,1c0.5,0.7,1,1.3,1.5,1.7c0.1,0.2,0.3,0.7,0.6,1.4
                  c0.2,0.3,0.4,0.6,0.6,0.9c0.2,0,0.3,0.1,0.3,0.1c0.5,0.4,1,0.9,1.7,1.5c0.4,0.5,0.7,0.9,0.9,1.4c0.2,0.4,0.4,0.7,0.6,0.8
                  c0.3,0.4,0.5,0.7,0.7,1c0.1,0.2,0.3,0.5,0.4,0.6c0.2,0.2,0.4,0.4,0.4,0.6c0.1,0.3,0.4,0.6,0.7,0.9c0.2,0.2,0.5,0.5,0.8,0.7
                  c0.2,0.3,0.5,0.5,0.7,0.7c0.4,0.2,0.7,0.5,0.9,0.7c0.3,0.2,0.6,0.4,0.9,0.6c0.3,0.1,0.6,0.3,0.7,0.4c0.6,0.5,1.3,0.9,2,1.2
                  c1,0.4,1.6,1,1.9,1.8C105.6,63.7,105.5,64.5,105.1,65.3z M102.3,47.4c-0.3,0.3-0.6,0.6-1,0.8c-0.3,0.1-0.6,0.3-0.9,0.6
                  c-0.2,0.2-0.4,0.3-0.6,0.3c-0.2,0-0.5,0.1-0.7,0.3c-0.9,0.9-2,1.3-3.1,1.3c-1-0.1-1.6-0.5-1.6-1c0-0.5,0.1-0.9,0.6-1.4
                  c0.8-0.7,1.2-1.2,1.2-1.6c0-0.2,0.1-0.3,0.3-0.4c0.2-0.2,0.4-0.5,0.4-0.7c0.1-0.1,0.2-0.2,0.4-0.4c0.2-0.2,0.4-0.5,0.7-0.9
                  c0.5-0.7,1-1,1.7-1.2c0.7-0.2,1.5-0.1,2.3,0.4c0.5,0.3,0.9,0.8,1,1.5C103,45.8,102.8,46.6,102.3,47.4z"/>
                <path style={{ fill: "#CC2C1F" }} d="M86.6,141.9c-1,0-1.9-0.1-2.9-0.2C80.8,142.1,92.1,142.1,86.6,141.9z"/>
              </g>
            </g>
          </g>
        </svg>
      )
    }else if (module.id === 'health') {
      return (
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" x="0px"
          y="0px" viewBox="0 0 155.871 155.871" xmlSpace="preserve" width="84" height="84">
          <g>
            <g>
              <path style={{ fill: "#CC2C1F" }} d="M129.8,9.4c-0.6-0.3-1.3-0.6-1.8-0.8c-3.9,1.4-7.6-0.6-11.3-0.1c-0.7,0.1-1.4-0.2-2.3-0.4
                c-0.5,0.1-1.1,0.3-1.6,0.3c-4.8,0.1-9.6,0.4-14.5,0.4C75.2,9.1,72.1,9,49,9c-1.3,0-2.7-0.5-4-0.3c-2.4,0.3-4.8,0.9-7.3,1.4
                c-0.2,0-0.3-0.1-0.5-0.1c0.1-0.2,0.1-0.3,0.3-0.6c-3.1-1.6-6.2-0.2-9.3-0.1c-0.3,0.5-0.5,1-0.6,1.2c0,1.1,0,1.8,0,2.6
                c0,0.7-0.2,1.4-0.1,2.1c0.1,1.3,0.4,2.6,0.4,4c0.1,2.7,0,5.4,0,8.1c0,2.8,0,5.6,0,8.3c0,2.7,0,5.4,0,8.1c0,2.7-0.1,5.5,0,8.2
                c0.1,7.1,0.1,14.2,0.1,21.3c0,23.2,0,46.5,0,69.9c-2.5,1.5,0,3.4-0.4,5.4c1.6,0.3,3.1,0.7,4.6,0.7c2.3,0,4.6,0.4,6.9-0.4
                c0.3-0.1,0.7,0,1.1,0c1,0.1,1.9,0.3,2.9,0.3c2.7,0,5.4,0,8.1,0c27.3,0,34.5,0,61.8,0c2.1,0,4.1-0.2,6.2,0c2.1,0.2,4.1,0.1,6.2,0
                c1.7-0.1,3.4-0.3,4.4-1.9c0-4.1,0-8.1,0-12.2c0-0.1,0-0.2,0-0.3c-0.3-4.3-0.7-8.7-0.9-13c-0.1-2.3,0-4.6,0.3-6.9
                c0.4-2.6,0.1-5.4,0.1-8.1c0-16.3,0-32.6,0-49c0-1.3-0.1-2.7,0.1-4c0.6-3.2,1-6.5,1-9.8c0-5-0.1-10-0.1-15.1
                c0-3.9-0.3-7.9,0.2-11.8C130.6,14.4,130.5,12,129.8,9.4z M103.8,146.3c-0.6,0.2-1.4,0.3-2.3,0.4c-1.7-0.3-3.7-0.6-6.2-0.9
                c0.8-0.6,1.1-1,1.5-1c2.9-0.1,5.9,0,8.8,0c0.1,0.1,0.2,0.3,0.2,0.4C105.2,145.6,104.5,146,103.8,146.3z M124.7,81.3
                c-0.6,3.7-0.3,7.3-0.4,11c-0.1,3.5,0.4,7-0.5,10.4c-0.2,1-0.1,2.1-0.1,3.2c0,9.8,0,19.5,0,29.3c0,1.2,0.3,2.4,0.5,3.4
                c-1.1,1.9-2.1,3.7-3.1,5.6c-4-0.3-8.1,0.6-12.1-0.5c-0.2,0-0.4,0-0.5,0c-4.5-0.2-8.9-0.4-13.4-0.6c-0.7,0-1.4,0-2.1,0
                c-0.4,0.4-0.6,0.8-0.9,1.1c-1.1,0-2.2,0-3.3,0c-0.5-0.3-1-0.7-1.6-1.1c-4.3,0.3,11.3-0.3,7,0.4c-2,0.3-4.1-0.1-6.2,0.1
                c-6,0.6-12,0.6-17.9,0.6c-2.4,0-4.8,0.5-7.2,0.3c-7.3-0.7-14.7-0.3-22-0.4c-1.5,0-3,0.3-4.6-0.3c-1.6-1.2-1.6-3.7-3.9-4.3
                c1.1-4,0.7-7.9,0.4-11.8c-0.3-3.8-0.2-7.7-0.4-11.5c-0.1-2-0.3-3.9-0.5-5.8c-0.2-3.5,0.5-6.9,1.2-10.3c0.2-0.8,0.4-1.6,0.3-2.4
                c-0.7-3.3-0.8-6.7-1.1-10.1c-0.3-3.5-0.3-7-0.3-10.4c0-3.4,0.3-6.8,0.5-10.2c0-0.4,0.2-0.9,0.3-1.3c0.9-2.5,0.9-5,0.4-7.6
                c-0.4-2.4-0.7-4.9-0.7-7.4c-0.1-5.6,0-11.1-0.1-16.7c0-2,0.1-4.1-0.4-6.1c-0.4-2,0-4.1,0.6-6c0.4-1.1,0.8-2.3,0.5-3.6
                c-0.2-1,0.4-1.9,1.2-2.5c0.6-0.5,1.2-1,1.9-1.5c0.8,0.1,1.7,0.3,2.7,0.2c2.5-0.3,5-0.1,7.5-0.2c1.2,0,2.5-0.3,3.7-0.4
                c1.6-0.2,3.2-0.2,4.3,1.8c2.2-0.2,4.5-0.6,6.8-0.7c3-0.1,5.9-0.1,8.9-0.2c1.2,0,2.5-0.2,3.7-0.4c0.4,0,0.9-0.1,1.3,0
                c2.5,0.7,5,0.4,7.5,0.4c10.9,0,1.9,0.1,12.8-0.1c2.4,0,4.8,0.1,7.1,0.1c5.3-0.1,10.5-0.3,15.8-0.5c1.2,0,2.3,0,3.3,0
                c1.6,0.9,2.2,2.4,2.6,3.8c0.5,1.7,0.7,3.5,0.6,5.3c-0.1,4-0.1,8.1-0.6,12c-0.8,6.1-0.3,12.2-0.5,18.2c-0.1,3.5-0.1,7,0.1,10.5
                c0.2,3.9,0.7,7.8,0.9,11.7C124.8,77.7,125,79.5,124.7,81.3z M128.9,146.7c-0.9-0.2-0.9-0.2-0.7-2.2
                C128.5,145.5,128.7,146.1,128.9,146.7z"/>
              <path style={{ fill: "#CC2C1F" }} d="M38.7,18c-0.8,0.3-1.6,0.6-1.2,1.7C38,19.2,38.3,18.6,38.7,18z" />
              <g>
                <path style={{ fill: "#CC2C1F" }} d="M86.6,141.9c-1,0-1.9-0.1-2.9-0.2C80.8,142.1,92.1,142.1,86.6,141.9z"/>
                <path style={{ fill: "#CC2C1F" }} d="M121.6,27.7c0-2.1-0.2-4.1-1.1-5.7c-1.8-1.5-3.4-2.9-5.1-4.4c-2.6,0-5.4,0.1-8.1,0
                  c-4.7-0.2-9.4-0.9-14.1-0.9c-14.7-0.1-9.4-0.1-24.1,0c-3.8,0-7.7-0.3-11.5,0.4c-1.5,0.3-3.1,0.1-4.5-0.1
                  c-4.2-0.6-8.3-0.3-12.4,0.7c-0.2,0.1-0.4,0.2-0.7,0.3c0.2,0.7,0.3,1.4,0.5,2.1c-1.2,0.6-2.3,1.2-3.5,1.9
                  c-0.4,0.8-0.9,1.8-1.2,2.3c-0.2,6.1-0.5,11.7-0.7,17.3c-0.1,4.6-0.1,9.1-0.1,13.7c0,1.5-0.5,3.1-0.3,4.5c0.5,3,0.2,6.1,0.3,9.1
                  c0.2,5.4-0.3,10.7,0.5,16.1c0.1,0.4,0,0.9-0.1,1.3c-0.1,1-0.3,1.9-0.3,2.9c0,5.2,0,10.4,0,15.6c0,0.5,0,1.1,0,1.6
                  c0.3,4.3,0.7,8.5,0.9,12.8c0.1,2-0.1,4.1-0.3,6.1c-0.3,2.5-0.1,5-0.2,7.5c-0.1,1.5,0.1,3,0.9,4.3c0.8,0.5,1.5,1,2.3,1.5
                  c0.1,0.4,0.2,0.8,0.3,1.2c0.7,0.1,1.3,0.2,1.9,0.3c0.3,0.5,0.6,0.9,0.8,1.3c2.2,0.2,4.3,0.4,6.5,0.6c0.3,0,0.7,0,1.1-0.1
                  c1.1-0.1,2.1-0.3,3.2-0.3c2,0.1,4.1,0.4,6.1,0.4c5.4,0,10.7,0.2,16.1-0.3c3-0.3,6.1-0.1,9.2,0.1c0.3,0,0.6-0.1,1.1-0.1
                  c5.5-0.4,11.1-0.6,16.6,0.3c0.6,0.1,1.3,0,1.9,0c1.3-0.1,2.6-0.3,4-0.4c2.3-0.1,4.7,0,6.7,0c1.3-0.9,2.3-2,4-1.2
                  c1.1-2,2.3-4,3.4-6c-0.1-0.1-0.2-0.2-0.3-0.2c0-1.1,0-2.1,0-3.2c0.1-2,0.4-3.9,0.4-5.8c0-8.3,0-16.7,0-25
                  C121.5,75.9,121.5,51.8,121.6,27.7z M56.2,24.6c1-0.8,2.3-1,3.8-0.4c1.9,0.2,3.3,0.6,4,1c0.5,0.5,0.8,0.9,0.8,1.5
                  c0,0.5-0.5,0.9-1.4,1.3c-1.2,0.5-2.5,0.9-4,1c-1.3,0.4-2.3,0.3-3.1-0.2c-0.9-0.5-1.3-1.2-1.3-2C55.1,25.8,55.5,25.1,56.2,24.6z
                  M49.5,59c0.5-0.8,1.4-1.4,2.5-1.7c2.3-0.4,3.9-1,4.7-1.7c0.8-0.9,1.8-1.7,3-2.3c1.7-1,2.9-2.4,3.6-4.1c0.7-0.9,1.4-1.9,2.1-3
                  c-0.2-0.2-0.4-0.5-0.5-0.6c-0.4,0-0.7,0-1,0c-1.7,0.1-2.9,0-3.6-0.2c-0.7-0.2-1.2-0.2-1.6,0c-0.9,0.3-2.2,0.3-3.9,0.1
                  c-1.6,0.5-3,0.4-4.1-0.2c-0.8-0.5-1.2-1.2-1.2-2.1c0-0.8,0.4-1.5,1-2.1c0.7-0.6,1.6-0.9,2.5-1c1-0.1,2.1,0.1,3.2,0.5
                  c2,0.5,4,0.7,6.1,0.5c0.9-0.1,2.4-0.2,4.6-0.2c0.3-0.2,0.5-0.3,0.7-0.4c0.6-0.4,1.1-0.8,1.5-1c0.2-0.6,0.3-1.1,0.5-1.6
                  c-0.4-0.5-0.8-0.9-1.4-1.2c-0.2-0.2-0.4-0.3-0.6-0.3c-0.4,0-0.8,0-1.2,0.2c-0.6,0.3-1.3,0.4-2,0.2c-1.3,0-2.5,0.1-3.7,0.4
                  c-1.4,0.4-2.6,0.3-3.6-0.2c-0.8-0.6-1.2-1.3-1.2-2.2c0-0.8,0.4-1.4,1-1.9c0.6-0.5,1.6-0.7,3-0.4c1.5,0.2,3.1,0.2,4.8-0.1
                  c1.2-0.3,2.4-0.3,3.6-0.1c0.3,0.1,0.6,0.1,1,0.2c0.1-0.2,0.2-0.3,0.4-0.3c0.5-0.5,1-0.9,1.4-1.4c0-0.2-0.1-0.4-0.1-0.6
                  c0-0.4,0-0.7,0.1-1c-0.2-0.3-0.3-0.5-0.5-0.7c-1.2-0.2-2-0.4-2.5-0.7c-0.6-0.4-0.9-0.8-0.9-1.2c0-0.6,0.4-1.2,1.3-1.7
                  c0.7-0.5,1.6-0.7,2.7-0.7c0.5-0.3,0.9-0.6,1.2-0.9c0,0,0-0.1,0.1-0.1c0-0.2,0-0.5-0.1-0.6c0.1-1.5,0.4-2.5,0.9-3
                  c0.6-0.7,1.2-1,2-1c0.9,0,1.7,0.2,2.2,0.9c0.4,0.7,0.5,1.5,0.4,2.5c0,0.4-0.1,0.8-0.1,1.2c0.1,0.1,0.2,0.2,0.4,0.4
                  s0.3,0.3,0.6,0.5c2.5,0,4.4,0.1,5.8,0.3c2,0.3,3.9,0.3,5.8-0.1c1.8-0.2,3.2-0.2,4.3,0.1c1.1,0.5,1.7,1.2,1.7,2.2
                  c0,1-0.6,1.8-1.5,2.2c-1.1,0.6-2.5,0.6-4.3,0.1c-1.2-0.3-2.8-0.5-4.7-0.5c-1.5-0.1-3.2,0-5.1,0.4c-1.3,0.2-2.6,0.3-3.8,0.3
                  c-0.5,0.2-0.9,0.5-1.3,0.8c-0.2,0.5-0.4,0.9-0.6,1.3c0.2,0.2,0.5,0.4,0.7,0.6c0.1,0.1,0.3,0.2,0.4,0.3c1,0.1,1.9,0,2.6-0.2
                  c0.7-0.2,1.5-0.2,2.2,0.1c0.7,0.2,1.9,0.3,3.8,0.4c0.9-0.1,1.7-0.1,2.5-0.2c1.3-0.2,2.6-0.3,3.9-0.3c1.3-0.1,2.4,0.4,3.2,1.4
                  c0.7,0.8,0.7,1.6,0.2,2.6c-0.5,0.5-1,0.9-1.8,1s-1.5,0.2-2.3,0c-0.8-0.2-1.8-0.5-2.8-0.6c-1.2-0.1-2.5,0-3.9,0.2
                  c-1.4,0.2-2.5,0.2-3.3-0.1c-1.2-0.4-2.3-0.4-3.4-0.1c-0.6,0.2-1.1,0.3-1.5,0.3c-0.8,0.5-1.5,1-2.2,1.7c0,0.2-0.1,0.5-0.1,0.8
                  c0.4,0.3,0.8,0.7,1.4,1.1c0.1,0.1,0.1,0.1,0.2,0.2c1,0,2.2-0.1,3.5-0.3c3.9-0.4,6.7-0.3,8.4,0.4c2.1,0.5,3.3,0.5,3.8,0.2
                  c1.6-0.9,3.5-1.3,5.5-1.1c1.1,0.1,2,0.2,2.8,0.1c1.1-0.2,2.1,0.1,3.1,0.7c1,0.6,1.5,1.3,1.5,1.9c0,0.6-0.3,1.2-0.8,1.6
                  c-0.9,0.8-2,1.2-3.3,1.4c-1.6,0.2-3.2,0-4.7-0.4c-0.8-0.1-1.4-0.1-1.8,0c-0.8,0-1.4,0-1.9,0c0.2,0.2,0.5,0.4,0.7,0.5
                  c0.4,0.4,0.6,1.1,0.6,2.2c-0.1,0.6-0.2,1.1-0.4,1.5c0.4,0.5,0.9,0.9,1.5,1.4c0.2,0,0.5-0.1,0.7-0.1c0.3-0.1,0.5-0.1,0.7-0.2
                  c0.1,0,0.2-0.1,0.2-0.1c0.2-0.1,0.3-0.1,0.5-0.1c0.1,0,0.2-0.1,0.4-0.1c1.2-0.1,2.4,0,3.6,0.2c0.9,0.2,1.6,0.6,2,1.2
                  c0.3,0.6,0.5,1.1,0.4,1.5c-0.2,0.8-0.7,1.4-1.4,1.8c-0.8,0.4-2.3,0.4-4.5,0.1l-0.3-0.1c-0.2,0-0.3,0-0.3-0.1
                  c-0.1,0-0.2-0.1-0.2-0.1c-0.1,0-0.2,0-0.2,0c-0.6-0.2-1-0.3-1.3-0.2c-0.2,0-0.3,0-0.4,0.1c-0.1,0.2-0.2,0.4-0.4,0.6
                  c-0.4,0.4-0.8,0.9-1,1.5c0,0,0,0.1,0.1,0.3c0,0.2,0,0.4-0.1,0.5c0,0.2,0,0.4,0,0.6c0.1,0.2,0.1,0.4,0.1,0.6s0.1,0.4,0.2,0.6
                  c0.2,0.4,0.3,0.8,0.3,1.2c0,0.2,0,0.3,0,0.4c0.2,0.6,0.2,1.2,0.2,2c-0.1,0.5-0.1,0.9-0.1,1.2c0.1,0.2,0.1,0.5,0,0.7
                  c-0.1,0.3-0.1,0.6,0.1,0.9c0,0.2,0,0.5-0.2,0.7c0,0.3,0,0.7,0.1,1c0.1,0.6-0.2,1.3-0.9,2.2c-0.2,0.9-0.5,1.6-0.8,1.8
                  c-0.4,0.3-0.6,0.8-0.8,1.4c-0.6,0.9-1.3,1.5-2.2,1.8c-0.6,0.2-1.1,0.4-1.5,0.7c-0.2,0.3-0.7,0.5-1.4,0.6
                  c-0.4,0.2-0.8,0.2-1.2,0.2c-0.4,0-0.8,0.1-1.2,0.2c-0.5,0.1-1.5-0.1-3.1-0.6c-0.8-0.3-1.3-0.4-1.5-0.4c-0.4,0.1-0.7,0-1-0.3
                  c-0.3-0.2-0.6-0.4-0.9-0.4c-0.5,0-0.8-0.1-0.9-0.4c-0.2-0.2-0.5-0.4-0.7-0.4c-0.4-0.1-0.9-0.5-1.7-1.2c-0.6-0.7-0.9-1.5-0.9-2.5
                  c0.1-0.7,0.4-1.3,0.9-1.7c0.3-0.2,0.9-0.3,1.9-0.3c1.2,0.2,2,0.6,2.4,1.3c0.4,0.4,0.8,0.8,1.2,1c1.4,0.5,2.6,0.9,3.8,1
                  c0.9,0.3,1.6,0.1,2.1-0.5c0.3-0.4,0.9-0.8,1.6-1.3c0.6-0.1,0.9-0.5,1-1.1c0.3-0.5,0.6-1,0.9-1.4c0.4-0.4,0.5-1.7,0.2-3.9
                  c0.1-0.3,0.1-0.8,0-1.4c0-0.5-0.1-0.8-0.1-0.9c0-0.3,0.1-0.6,0.1-0.9c0-0.2,0.1-0.6,0.1-0.9c0.1-0.2,0.1-0.4-0.1-0.7
                  c-0.2-0.6-0.4-1.1-0.4-1.5c0-0.2-0.1-0.5-0.1-0.6c0-0.1-0.1-0.3-0.1-0.4c-0.2-0.2-0.5-0.4-0.6-0.5c-0.3-0.2-0.5-0.3-0.7-0.4
                  c-0.3,0.1-0.6,0.1-0.7,0.2c-1.8,0.4-3.6,0.6-5.2,0.4c-0.4-0.1-0.6-0.1-0.8-0.1c-0.2,0.1-0.4,0.1-0.7,0.1
                  c-0.3-0.1-0.8-0.1-1.4,0.1c-0.7,0-1.3,0-1.8-0.1c-0.6-0.1-1.1-0.1-1.5,0.2c-0.4,0.2-0.7,0.4-1,0.4c-0.4,0-0.7,0.1-0.9,0.1
                  c-0.6,0.2-1.4,0.3-2.2,0.3c-1,0-1.8-0.1-2.5-0.5c-0.6-0.4-1-0.9-1.2-1.7c0-0.9,0.3-1.6,0.9-2c0.8-0.5,1.7-0.9,2.8-1
                  c1.2-0.3,2.2-0.3,2.9-0.2c0.6,0.1,1.1,0.1,1.5,0.2c0.2,0,0.5,0.1,0.9,0.2c0.5,0.2,0.9,0.2,1.4,0c0.8-0.5,1.7-0.6,2.9-0.5
                  c0.3,0,0.6,0,0.8-0.1c0.1-0.1,0.3-0.1,0.6,0.1c0.4,0.1,0.9,0.1,1.7,0.1c0.3,0,0.7,0,1,0.1c0.3,0.2,0.8,0.4,1.4,0.5
                  c0.8-0.7,1.4-1.3,2-1.9c0-0.1,0-0.1,0.1-0.1c0-0.2-0.1-0.5-0.1-0.8c-0.1-0.4-0.1-0.8-0.1-1.4c0.1-0.5,0.4-1,0.8-1.4
                  c0.4-0.5,0.8-0.8,1.2-0.9c-0.4,0-0.7-0.1-1.1-0.1c-1.2-0.5-2.8-0.5-4.6-0.1c-1.6,0.4-2.5,0.5-2.9,0.3c-0.9-0.2-1.8-0.2-2.8,0.2
                  c-1.5,0.4-2.8,0.5-3.8,0.2h-0.2c-0.1,0-0.2,0.1-0.4,0.2c-0.9,0.5-1.7,1-2.5,1.6c-1,2.1-2.1,3.6-3.5,4.4c-1.8,1.2-3,2.1-3.4,2.7
                  c-0.7,1.3-1.5,2.2-2.4,2.6c-0.8,0.6-1.4,1.3-1.8,2c-0.7,0.8-1.4,1.4-2.1,1.8c-0.8,0.2-1.4,0.7-1.6,1.4c-0.8,0.8-1.7,1.3-2.8,1.6
                  c-1.1,0.3-2.1,0.4-3,0.2c-0.7-0.3-1.2-0.9-1.4-1.7C48.6,60.9,48.8,59.9,49.5,59z M77,92.2c0.4-0.1,0.7-0.2,0.9-0.2
                  c0.3,0,0.6,0,0.9,0c0.2-0.1,0.5-0.1,0.8-0.1c0.3,0,0.6,0,0.7-0.2c0.2-0.1,0.5-0.1,1-0.1c0.4,0,0.8-0.1,1.2-0.1
                  c0.5-0.1,1.3-0.1,2.2-0.1c0.7,0.1,1.4,0.1,2,0.1c0.7,0,1.2,0.2,1.7,0.6c0.6,0.4,0.9,1,1,1.9c0,0.6-0.4,1.1-1.2,1.5
                  c-0.9,0.4-1.9,0.3-3-0.1c-0.6-0.1-1.2-0.1-1.7,0c-0.4,0.1-0.8,0.2-1.2,0.1c-0.2,0-0.5,0-0.8,0c-0.4,0.1-0.7,0.2-1,0.1
                  c-0.4,0-0.7,0.1-0.9,0.2c-0.3,0.2-0.6,0.3-0.7,0.3c-0.2,0-0.5,0.1-0.6,0.1c-0.7,0.4-1.5,0.5-2.4,0.3c-0.7-0.3-1.1-0.9-1.2-1.7
                  c0-0.6,0.1-1.2,0.6-1.7C75.6,92.8,76.3,92.4,77,92.2z M63.7,97.5c-1.8-1.6-3.6-1.9-5.3-0.9c-1.3,0.7-2.6,1.4-3.9,2
                  c-1.1,0.4-1.9,0.6-2.5,0.4c-0.9-0.2-1.4-0.8-1.4-1.8c0-0.9,0.4-1.7,1.3-2.6c0.7-0.7,1.6-1,2.6-1c1-0.1,2-0.4,3-0.9
                  c0.9-0.4,2.6-0.7,5.3-0.7c1.6-0.1,3.4,0.4,5.2,1.5c0.2,0.4,0.6,0.8,1.2,1.3c0.5,0.5,0.8,1.3,0.8,2.5c0,0.9-0.3,1.8-0.7,2.5
                  c-0.2,0.4-0.5,0.8-0.8,1c-0.5,0.5-1.1,1-2,1.7c-0.9,0.8-1.7,1-2.5,0.6c-0.9-0.4-1-1-0.6-1.9c0.2-0.8,0.5-1.5,0.7-2.3
                  C64.5,98.2,64.3,97.7,63.7,97.5z M54.3,86.3c-0.9-1-1.2-1.8-1.1-2.3c0.2-0.5,0.6-1,1.2-1.4c0.8-0.5,1.7-0.7,2.8-0.7
                  c0.8,0.1,1.6,0.2,2.2,0.3c0.7,0.3,1.4,0.6,2,1c0.7,0.5,1.6,0.8,2.9,0.8c1,0,1.8,0.2,2.3,0.4c0.7,0.2,1.4,0.6,1.9,1.2
                  c0.3,0.4,0.5,0.8,0.4,1.2c0,0.7-0.3,1.1-0.8,1.4c-0.5,0.3-1.3,0.5-2.4,0.5c-0.5,0-1-0.1-1.5-0.3c-0.3-0.2-0.8-0.4-1.5-0.4
                  c-0.4,0-1,0-1.9,0.1c-0.7,0.1-1.2,0.1-1.5,0c-0.9-0.4-1.7-0.6-2.3-0.6C56,87.5,55,87.1,54.3,86.3z M69.8,60.8
                  c-0.7-0.9-0.8-1.5-0.6-1.9c0.5-0.6,0.9-0.9,1.2-0.9c0.5,0,0.9,0.1,1.4,0.1c0.3-0.1,0.5-0.1,0.6-0.1c0.2,0.1,0.4,0.1,0.7,0.1
                  c0.5,0,1.3,0.1,2.4,0.4c0.5,0.1,1,0.4,1.5,0.7c0.7,0.6,1.4,1.3,2.1,1.9c0.7,0.6,1.1,1.3,1.5,2.1c0.2,0.9,0.2,1.5-0.2,1.9
                  c-0.5,0.4-1.3,0.3-2.3-0.1c-0.5-0.1-0.9-0.2-1.5-0.4c-0.5-0.2-0.9-0.4-1.4-0.6c-0.4-0.2-0.7-0.3-0.9-0.2c-0.2,0-0.6-0.2-1-0.5
                  c-0.5-0.4-1.2-0.9-2.1-1.4C70.6,61.7,70.1,61.3,69.8,60.8z M68.2,115.4c-1,0-1.8-0.1-2.3-0.5c-0.7-0.4-1.3-0.7-1.7-1
                  c-0.2,0.2-0.4,0.4-0.6,0.6c-0.2,0.2-0.3,0.3-0.5,0.5c0,0.6,0,1,0.1,1.2c0.2,0.6,0.2,1.2,0.1,1.6c-0.1,0.4-0.2,0.9-0.1,1.5
                  c0.1,1.2,0,2.4-0.1,3.6c-0.1,0.7-0.1,1.2,0.1,1.6c0.2,0.9,0.3,1.7,0.3,2.4c-0.1,0.5-0.1,0.8,0.1,0.9c0.2,0.4,0.3,0.9,0.2,1.6
                  c0,0.4,0.1,0.9,0.1,1.4c0.3,1.3,0.2,2.4-0.3,3.5c-0.5,1-1.3,1.5-2.3,1.5c-1.1,0-1.9-0.6-2.5-1.8c-0.6-1.4-0.7-2.8-0.2-4.1
                  c0.2-0.8,0.3-1.4,0.1-1.9c0-0.4,0-1,0.2-1.8c0.1-0.6,0.2-1.3,0.1-2.2c-0.1-0.9-0.1-1.8,0.1-2.6c0.2-0.9,0.2-1.7,0.1-2.3
                  c-0.1-0.5-0.1-0.9,0.1-1.3c0.1-0.6,0.1-1.3-0.2-2.2c-0.1-0.2-0.2-0.5-0.2-0.8c-0.2-0.2-0.3-0.3-0.3-0.4c-0.1-0.1-0.2-0.2-0.2-0.2
                  c-0.4,0.3-0.7,0.6-0.9,1c-0.2,0.2-0.9,0.7-1.8,1.5c-0.6,0.5-1.7,0.7-3.1,0.9c-1.4,0-2.3-0.3-2.7-0.9c-0.6-0.9-0.6-1.8,0-2.6
                  c0.7-0.9,1.5-1.5,2.6-1.8c0.9,0,1.8-0.3,2.5-0.9c0.8-0.5,1.7-1.1,2.5-1.8c0.8-0.7,1.7-1.7,2.7-3.1c0.7-1,1.3-1.6,1.7-1.8
                  c0.6-0.2,1-0.2,1.3-0.1c0.5,0.3,0.5,0.9,0.2,1.8c0,0.1-0.1,0.1-0.1,0.2c0.2,0.5,0.4,1,0.7,1.5c0.5,0.2,1,0.5,1.4,0.8
                  c0.6,0.5,1.2,0.9,1.8,1.1c0.5,0.2,0.9,0.7,1.3,1.3c0.4,0.4,0.8,0.7,1,0.9c0.3,0.2,0.5,0.6,0.7,1.1c0.2,0.8,0.2,1.4-0.1,1.7
                  C69.7,115.4,69.1,115.5,68.2,115.4z M81,124.5c-0.2,1.2-0.7,2-1.3,2.4c-1.6,2-2.9,3.2-3.6,3.6c-0.6,0.3-1.5,0.9-2.9,1.9
                  c-0.7,0.2-1.2,0.3-1.3,0.1c-0.3-0.1-0.6-0.2-0.9-0.2c-0.3,0.1-0.7-0.4-1-1.4c-0.2-0.6-0.2-1.3,0.1-1.9c0.5-0.7,0.9-1.3,1.5-1.7
                  c1-0.8,1.8-1.7,2.3-2.5c0.7-0.7,1.5-1.2,2.6-1.6c0.6-0.4,1-0.6,1.3-0.8c0.3-0.3,0.8-0.4,1.4-0.4c0.9,0,1.5,0.1,1.8,0.6
                  C81.4,122.9,81.4,123.6,81,124.5z M72,112.3c-0.2-0.3,0.2-0.8,1-1.5c0.6-0.5,1.3-0.6,2-0.4c0.9,0.3,1.6,0.7,2.2,1.2
                  c0.3,0.4,0.7,0.6,1,0.8s0.6,0.5,0.8,0.9c0.5,0.4,0.9,0.8,1.2,1c0.3,0.3,0.6,0.7,0.7,1.4c0.2,0.9,0.2,1.6-0.2,2
                  c-0.3,0.5-0.9,0.6-1.9,0.4c-1.2,0-2.2-0.2-2.8-0.7c-1.3-0.7-2.1-1.2-2.3-1.6c-0.2-0.2-0.7-0.7-1.3-1.3c-0.5-0.7-0.7-1.2-0.6-1.4
                  C72.1,112.9,72.1,112.6,72,112.3z M88.1,135.3c-0.6,0.4-1.4,0.4-2.4,0c-0.6-0.5-1-1.1-1.3-1.8c-0.2-0.8-0.1-1.8,0.1-3
                  c0.1-1.2,0.2-2.2,0.1-2.8c-0.1-0.6-0.2-1.1-0.2-1.6c0-0.5,0-0.8,0.1-1.1c0.1-0.5,0.2-1,0.1-1.7c0-0.7,0.2-1.6,0.7-2.9
                  c0.4-1,0.9-1.5,1.7-1.7c0.5,0,0.8,0.2,1,0.7c0.4,0.9,0.6,1.7,0.6,2.5c0,0.7,0.1,1.5,0.4,2.4c0.1,0.9,0.1,2-0.1,3.5
                  c-0.1,0.4,0,0.9,0.1,1.6c0.1,0.9,0.2,1.9,0.2,3.1C89.1,133.6,88.7,134.5,88.1,135.3z M103,131.2c-0.4,0.6-0.9,0.9-1.7,0.9
                  c-0.5,0.1-1.1,0.1-1.6-0.2c-0.9-0.5-1.6-1-2-1.7c-0.2-0.3-0.5-0.6-0.9-0.9c-0.7-0.4-1.2-0.9-1.6-1.4c-0.4-0.6-0.7-1.1-0.9-1.7
                  c-0.1-0.2-0.3-0.5-0.4-0.7c-1.2-1.7-1.9-2.8-2-3.5c-0.1-0.5,0.1-1,0.7-1.5c0.3-0.2,0.7-0.3,1.2-0.2c0.7,0,1.3,0.2,1.5,0.6
                  c0.2,0.3,0.4,0.6,0.5,1c0.2,0.4,0.6,0.7,0.9,0.8c0.7,0.4,1.2,0.6,1.6,0.6c0.3,0.1,0.6,0.3,0.9,0.6c0.2,0.4,0.6,0.7,1,0.8
                  c1.4,0.6,2.3,1.3,3,2.2c0.5,0.8,0.7,1.6,0.6,2.3C103.7,130.1,103.5,130.7,103,131.2z M92.3,115.5c0-1.1,0.3-2,0.9-2.5
                  c0.8-1.5,1.4-2.4,1.8-2.6c0.3-0.2,0.9-0.7,1.6-1.5c0.7-0.5,1.2-0.6,1.3-0.4c0.3,0.1,0.6,0.1,0.8,0.1c0.4-0.2,0.8,0.2,1.4,1.1
                  c0.4,0.6,0.5,1.2,0.3,1.8c-0.3,0.8-0.7,1.5-1.2,2c-0.5,0.5-0.8,1-1,1.5c-0.3,0.3-0.7,0.6-1.2,0.9c-0.5,0.5-0.8,0.8-1.1,1.1
                  c-0.2,0.3-0.6,0.6-1.3,0.7c-0.9,0.1-1.5,0.1-1.8-0.2C92.2,117.1,92.1,116.5,92.3,115.5z M103.5,104.5c-0.7,0.7-1.7,1.1-2.9,1.1
                  c-1.5,0.2-2.9,0.1-4.3-0.3c-0.4,0-0.7,0-0.9,0c-0.5,0-0.9,0-1.2-0.1c-0.2-0.1-0.4-0.1-0.6-0.1c-0.2,0-0.6,0-0.9,0
                  c-0.5-0.2-1-0.2-1.7-0.1c-0.7,0.4-1.3,0.7-1.5,1c-0.1,0-0.1,0.1-0.1,0.1c0,0.6-0.1,1.3-0.2,2c-0.1,0.5-0.1,1-0.1,1.4
                  c0,0.5,0,0.9-0.1,1.2c-0.2,0.5-0.3,1-0.2,1.7c0,0.4-0.1,1.1-0.4,2.1c-0.2,1.1-0.5,1.9-0.9,2.4c-0.3,0.4-0.6,0.5-0.9,0.5
                  c-0.5,0-0.8-0.1-1-0.4c-0.4-0.4-0.6-1.4-0.6-3c-0.1-0.7-0.2-1.5-0.3-2.3c-0.1-1.1-0.1-2-0.1-2.5c0-0.4-0.1-0.9-0.2-1.4
                  c-0.1-0.5-0.2-0.9-0.2-1.2c-0.4-0.3-0.8-0.6-1.2-0.9l-0.1-0.1c-0.8,0.1-1.7,0.1-2.5,0.2c-0.9,0.1-1.5,0-1.8-0.1
                  c-0.3,0-0.6,0-0.8,0c-0.5,0.2-1.2,0.2-2.1,0.1c-1.4,0.4-2.6,0.3-3.6-0.2c-0.7-0.5-1.1-1.1-1.1-1.8c0-0.7,0.3-1.4,1-1.8
                  c0.6-0.6,1.3-0.9,2.2-0.9c0.9-0.1,1.9,0.1,2.9,0.4c1,0.3,2,0.4,3.1,0.2c0.6-0.1,1.6-0.2,3.1-0.2c0.6,0,1.1-0.1,1.5-0.2
                  c0.5,0,0.8,0,0.9,0c0.2,0,0.4,0,0.6,0c1.6-0.6,2.8-1,3.5-1.4c0.3-0.2,0.6-0.5,0.9-0.8c0.1-0.5,0.3-0.9,0.6-1.4
                  c0.4-0.5,0.6-0.9,0.6-1.2c0.2-0.6,0.3-1.1,0.5-1.5c0.2-0.3,0.3-0.9,0.3-1.8c0.1-0.9,0.3-1.7,0.4-2.2c0-0.5-0.1-1-0.3-1.4
                  c-1-1-2.4-1.6-4.1-1.7c-2.2-0.5-4.4-0.2-6.7,0.8c-2.5,0.6-4.1,0.7-4.9,0.4c-0.8-0.2-1.3-0.6-1.4-1.2c-0.1-0.7,0.2-1.3,0.9-1.8
                  c0.7-0.8,1.5-1.3,2.4-1.3c0.9,0,2.2-0.4,4.1-1c2.4-0.4,4.2-0.5,5.4-0.5c1.6,0.7,3,1.1,4.3,1c0.8,0.1,1.6,0.5,2.2,1.1
                  c0.2,0.5,0.7,0.9,1.4,1c0.6,0.2,1.2,0.6,1.8,1.4c0.6,0.9,0.8,2.2,0.5,3.6c-0.3,0.7-0.5,1.2-0.6,1.6c0,0.3-0.1,0.6-0.4,1
                  c-0.2,0.4-0.5,1-0.6,1.7c0,0.5-0.1,0.9-0.4,1.4c-0.2,0.3-0.4,0.9-0.5,1.8c0,0.1-0.1,0.3-0.1,0.4c0.2,0.1,0.4,0.3,0.6,0.4
                  c0.7,0.5,1.5,0.9,2.3,1.1l0.2,0.1c0.4,0,0.8,0,1.2-0.1c0.9-0.1,1.9,0.1,2.8,0.6c0.9,0.6,1.3,1.2,1.3,1.8
                  C104.2,103.6,104,104.1,103.5,104.5z"/>
              </g>
            </g>
          </g>
        </svg>
      )
    }else if (module.id === 'fortune') {
      return (
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" x="0px"
          y="0px" viewBox="0 0 155.871 155.871" xmlSpace="preserve" width="84" height="84">
          <g>
            <g>
              <path style={{ fill: "#CC2C1F" }} d="M129.8,9.4c-0.6-0.3-1.3-0.6-1.8-0.8c-3.9,1.4-7.6-0.6-11.3-0.1c-0.7,0.1-1.4-0.2-2.3-0.4
                c-0.5,0.1-1.1,0.3-1.6,0.3c-4.8,0.1-9.6,0.4-14.5,0.4C75.2,9.1,72.1,9,49,9c-1.3,0-2.7-0.5-4-0.3c-2.4,0.3-4.8,0.9-7.3,1.4
                c-0.2,0-0.3-0.1-0.5-0.1c0.1-0.2,0.1-0.3,0.3-0.6c-3.1-1.6-6.2-0.2-9.3-0.1c-0.3,0.5-0.5,1-0.6,1.2c0,1.1,0,1.8,0,2.6
                c0,0.7-0.2,1.4-0.1,2.1c0.1,1.3,0.4,2.6,0.4,4c0.1,2.7,0,5.4,0,8.1c0,2.8,0,5.6,0,8.3c0,2.7,0,5.4,0,8.1c0,2.7-0.1,5.5,0,8.2
                c0.1,7.1,0.1,14.2,0.1,21.3c0,23.2,0,46.5,0,69.9c-2.5,1.5,0,3.4-0.4,5.4c1.6,0.3,3.1,0.7,4.6,0.7c2.3,0,4.6,0.4,6.9-0.4
                c0.3-0.1,0.7,0,1.1,0c1,0.1,1.9,0.3,2.9,0.3c2.7,0,5.4,0,8.1,0c27.3,0,34.5,0,61.8,0c2.1,0,4.1-0.2,6.2,0c2.1,0.2,4.1,0.1,6.2,0
                c1.7-0.1,3.4-0.3,4.4-1.9c0-4.1,0-8.1,0-12.2c0-0.1,0-0.2,0-0.3c-0.3-4.3-0.7-8.7-0.9-13c-0.1-2.3,0-4.6,0.3-6.9
                c0.4-2.6,0.1-5.4,0.1-8.1c0-16.3,0-32.6,0-49c0-1.3-0.1-2.7,0.1-4c0.6-3.2,1-6.5,1-9.8c0-5-0.1-10-0.1-15.1
                c0-3.9-0.3-7.9,0.2-11.8C130.6,14.4,130.5,12,129.8,9.4z M103.8,146.3c-0.6,0.2-1.4,0.3-2.3,0.4c-1.7-0.3-3.7-0.6-6.2-0.9
                c0.8-0.6,1.1-1,1.5-1c2.9-0.1,5.9,0,8.8,0c0.1,0.1,0.2,0.3,0.2,0.4C105.2,145.6,104.5,146,103.8,146.3z M124.7,81.3
                c-0.6,3.7-0.3,7.3-0.4,11c-0.1,3.5,0.4,7-0.5,10.4c-0.2,1-0.1,2.1-0.1,3.2c0,9.8,0,19.5,0,29.3c0,1.2,0.3,2.4,0.5,3.4
                c-1.1,1.9-2.1,3.7-3.1,5.6c-4-0.3-8.1,0.6-12.1-0.5c-0.2,0-0.4,0-0.5,0c-4.5-0.2-8.9-0.4-13.4-0.6c-0.7,0-1.4,0-2.1,0
                c-0.4,0.4-0.6,0.8-0.9,1.1c-1.1,0-2.2,0-3.3,0c-0.5-0.3-1-0.7-1.6-1.1c-4.3,0.3,11.3-0.3,7,0.4c-2,0.3-4.1-0.1-6.2,0.1
                c-6,0.6-12,0.6-17.9,0.6c-2.4,0-4.8,0.5-7.2,0.3c-7.3-0.7-14.7-0.3-22-0.4c-1.5,0-3,0.3-4.6-0.3c-1.6-1.2-1.6-3.7-3.9-4.3
                c1.1-4,0.7-7.9,0.4-11.8c-0.3-3.8-0.2-7.7-0.4-11.5c-0.1-2-0.3-3.9-0.5-5.8c-0.2-3.5,0.5-6.9,1.2-10.3c0.2-0.8,0.4-1.6,0.3-2.4
                c-0.7-3.3-0.8-6.7-1.1-10.1c-0.3-3.5-0.3-7-0.3-10.4c0-3.4,0.3-6.8,0.5-10.2c0-0.4,0.2-0.9,0.3-1.3c0.9-2.5,0.9-5,0.4-7.6
                c-0.4-2.4-0.7-4.9-0.7-7.4c-0.1-5.6,0-11.1-0.1-16.7c0-2,0.1-4.1-0.4-6.1c-0.4-2,0-4.1,0.6-6c0.4-1.1,0.8-2.3,0.5-3.6
                c-0.2-1,0.4-1.9,1.2-2.5c0.6-0.5,1.2-1,1.9-1.5c0.8,0.1,1.7,0.3,2.7,0.2c2.5-0.3,5-0.1,7.5-0.2c1.2,0,2.5-0.3,3.7-0.4
                c1.6-0.2,3.2-0.2,4.3,1.8c2.2-0.2,4.5-0.6,6.8-0.7c3-0.1,5.9-0.1,8.9-0.2c1.2,0,2.5-0.2,3.7-0.4c0.4,0,0.9-0.1,1.3,0
                c2.5,0.7,5,0.4,7.5,0.4c10.9,0,1.9,0.1,12.8-0.1c2.4,0,4.8,0.1,7.1,0.1c5.3-0.1,10.5-0.3,15.8-0.5c1.2,0,2.3,0,3.3,0
                c1.6,0.9,2.2,2.4,2.6,3.8c0.5,1.7,0.7,3.5,0.6,5.3c-0.1,4-0.1,8.1-0.6,12c-0.8,6.1-0.3,12.2-0.5,18.2c-0.1,3.5-0.1,7,0.1,10.5
                c0.2,3.9,0.7,7.8,0.9,11.7C124.8,77.7,125,79.5,124.7,81.3z M128.9,146.7c-0.9-0.2-0.9-0.2-0.7-2.2
                C128.5,145.5,128.7,146.1,128.9,146.7z"/>
              <path style={{ fill: "#CC2C1F" }} d="M38.7,18c-0.8,0.3-1.6,0.6-1.2,1.7C38,19.2,38.3,18.6,38.7,18z" />
              <g>
                <path style={{ fill: "#CC2C1F" }} d="M86.6,141.9c-1,0-1.9-0.1-2.9-0.2C80.8,142.1,92.1,142.1,86.6,141.9z"/>
                <path style={{ fill: "#CC2C1F" }} d="M121.6,27.7c0-2.1-0.2-4.1-1.1-5.7c-1.8-1.5-3.4-2.9-5.1-4.4c-2.6,0-5.4,0.1-8.1,0
                  c-4.7-0.2-9.4-0.9-14.1-0.9c-14.7-0.1-9.4-0.1-24.1,0c-3.8,0-7.7-0.3-11.5,0.4c-1.5,0.3-3.1,0.1-4.5-0.1
                  c-4.2-0.6-8.3-0.3-12.4,0.7c-0.2,0.1-0.4,0.2-0.7,0.3c0.2,0.7,0.3,1.4,0.5,2.1c-1.2,0.6-2.3,1.2-3.5,1.9
                  c-0.4,0.8-0.9,1.8-1.2,2.3c-0.2,6.1-0.5,11.7-0.7,17.3c-0.1,4.6-0.1,9.1-0.1,13.7c0,1.5-0.5,3.1-0.3,4.5c0.5,3,0.2,6.1,0.3,9.1
                  c0.2,5.4-0.3,10.7,0.5,16.1c0.1,0.4,0,0.9-0.1,1.3c-0.1,1-0.3,1.9-0.3,2.9c0,5.2,0,10.4,0,15.6c0,0.5,0,1.1,0,1.6
                  c0.3,4.3,0.7,8.5,0.9,12.8c0.1,2-0.1,4.1-0.3,6.1c-0.3,2.5-0.1,5-0.2,7.5c-0.1,1.5,0.1,3,0.9,4.3c0.8,0.5,1.5,1,2.3,1.5
                  c0.1,0.4,0.2,0.8,0.3,1.2c0.7,0.1,1.3,0.2,1.9,0.3c0.3,0.5,0.6,0.9,0.8,1.3c2.2,0.2,4.3,0.4,6.5,0.6c0.3,0,0.7,0,1.1-0.1
                  c1.1-0.1,2.1-0.3,3.2-0.3c2,0.1,4.1,0.4,6.1,0.4c5.4,0,10.7,0.2,16.1-0.3c3-0.3,6.1-0.1,9.2,0.1c0.3,0,0.6-0.1,1.1-0.1
                  c5.5-0.4,11.1-0.6,16.6,0.3c0.6,0.1,1.3,0,1.9,0c1.3-0.1,2.6-0.3,4-0.4c2.3-0.1,4.7,0,6.7,0c1.3-0.9,2.3-2,4-1.2
                  c1.1-2,2.3-4,3.4-6c-0.1-0.1-0.2-0.2-0.3-0.2c0-1.1,0-2.1,0-3.2c0.1-2,0.4-3.9,0.4-5.8c0-8.3,0-16.7,0-25
                  C121.5,75.9,121.5,51.8,121.6,27.7z M92.5,51.9c-0.7-1.2-1.5-2.3-2.2-3.3c-0.4-0.5-0.4-1-0.1-1.5c0.3-0.5,0.6-0.7,1-0.7
                  c0.4,0,0.6,0.1,0.7,0.2c0.2,0.2,0.5,0.4,0.6,0.4c0.9,0.2,1.5,0.6,1.8,1.2c0.1,0.4,0.6,0.8,1.3,1.2c0.8,0.5,1.6,1.2,2.4,2.3
                  c0.1,0.5,0.4,0.9,0.9,1c0.4,0.3,0.6,0.7,0.6,1.4c0.3,0.7,0.6,1.1,0.9,1.3c0.3,0.3,0.4,0.7,0.2,1.2c0,0.5,0.1,1.1,0.3,1.6
                  c0.1,0.4,0.2,0.9,0.1,1.4c-0.1,0.5-0.4,0.9-0.9,1.3c-0.5,0.2-1.1,0.2-1.6,0c-0.5-0.2-0.9-0.8-1.4-1.7c-0.3-0.9-0.6-1.5-1-2
                  c-0.5-0.4-1.2-0.6-2.2-0.6c-1.2-0.1-1.8-0.3-2-0.6c-0.2-0.5-0.1-1,0.2-1.5C92.8,53.5,92.9,52.6,92.5,51.9z M84.4,44
                  c-0.2,0.2-0.5,0.7-0.7,1.4c-0.5,0.9-1.4,1.7-2.6,2.5c-0.5,0.2-0.9,0.5-1.3,0.9c-0.3,0.3-0.6,0.6-1,0.7c-0.3,0.2-0.7,0.6-1.2,1.1
                  c-0.4,0.4-0.7,0.6-1.1,0.7c-0.4,0.2-0.7,0.5-0.8,0.9c-0.4,0.9-0.5,1.4-0.4,1.7c0.1,0.4,0.1,0.7-0.1,1c-0.2,0.9-0.1,1.5,0.2,2
                  c0.1,0.2,0.3,0.3,0.4,0.4c0.2,0.1,0.5,0.2,0.6,0.4c0.1,0.2,0.3,0.3,0.6,0.4c0.7,0.4,1.3,0.5,1.7,0.5c0.5-0.2,0.9-0.3,1.2-0.3
                  c0.3-0.1,0.7-0.1,1.2-0.1c0.5,0.1,0.9,0.1,1.2-0.1c0.4-0.1,0.7-0.2,0.9-0.2c0.5-0.2,1.8-0.6,3.8-1.4c1.1-0.4,2.1-0.5,2.8-0.5
                  c0.6,0,0.9,0.3,1.1,0.9c0,0.4-0.1,0.8-0.4,1.3c-0.2,0.6-0.6,1-1,1.3c-0.8,0.4-1.5,0.8-2.3,1.2c-0.7,0.5-1.2,0.7-1.6,0.7
                  c-0.3,0.1-0.7,0.2-1.1,0.4c-0.7,0.5-1.7,0.9-3,1c-0.7,0.2-1.5,0.1-2.3-0.2c-1.2-0.4-2.2-0.4-2.8,0c-0.5,0.2-1.2,0.2-2,0.1
                  c-0.8,0-1.4-0.3-1.7-0.8c-0.4-0.6-1.1-1.1-2-1.5c-0.9-0.5-1.5-1-2-1.8c-0.5-0.6-0.6-1.2-0.4-1.8c0.1-0.8,0.5-1.4,1-1.9
                  c0.4-0.2,0.7-0.5,0.9-0.7c0.3-0.4,0.7-0.7,1.4-0.8c0.9-0.5,1.4-1.1,1.7-2c0.5-1,1.1-1.9,1.7-2.6c0.5-0.6,0.9-1.1,1.2-1.7
                  c0.4-0.5,0.7-1,1-1.7c0.3-0.4,0.6-0.8,1-1.2c0.5-0.4,0.9-0.9,1.4-1.7c0.3-0.9,0.7-1.4,1.2-1.5c0.7-0.2,1.4-0.2,2.1,0
                  c0.6,0.2,1,0.5,1.3,1c0.2,0.2,0.2,0.6,0.2,1.3C84.5,43.7,84.5,44,84.4,44z M73,25c0.5-0.5,1.2-0.7,2.1-0.7c0.6,0,1.2-0.2,2-0.5
                  c0.6-0.2,1.3-0.4,1.9-0.4c0.9-0.1,1.7-0.2,2.2-0.4c0.7-0.3,1.8-0.5,3.3-0.6c1.2-0.2,2.2-0.4,2.8-0.7c0.4-0.2,1.2-0.4,2.4-0.6
                  c1.5-0.1,2.8,0.1,3.8,0.6c0.5,0.3,0.9,1,1.2,2c0.1,0.5-0.1,1-0.7,1.7c-0.6,0.9-1.2,1.3-1.7,1.2c-0.4,0-0.8,0.1-1.4,0.2
                  c-0.2,0.1-1.2,0-2.9-0.2c-0.8,0-1.3,0-1.6,0.2c-0.7,0.4-1.3,0.5-2,0.5c-0.6-0.1-1.2,0-1.7,0.1c-0.7,0.2-1.4,0.3-2,0.2
                  c-0.5,0-1,0-1.5,0.1c-0.7,0.1-1.2,0.2-1.7,0.1c-0.6-0.1-1.2,0-1.8,0.1c-0.5,0.1-1.2,0-1.9-0.2c-0.6-0.2-1-0.7-1-1.3
                  C72.6,25.8,72.7,25.3,73,25z M68.2,35.1c0.7-0.6,1.4-1,2.3-1.1c1-0.1,2,0,3.1,0.3c1.1,0.2,2.1,0.2,3.1,0.1
                  c0.6-0.1,1.6-0.3,3.1-0.4c0.6,0,1.1-0.1,1.5-0.2c0.5-0.1,0.8-0.2,0.9-0.1c0.6,0,1.5-0.1,2.6-0.3c2-0.3,3.4-0.3,4.2-0.1
                  c1.1,0.1,1.8,0.1,2-0.1c0.9-0.5,1.8-0.7,2.8-0.7c1.1,0.1,2,0.1,2.7-0.1c1-0.2,2,0,3,0.6c1,0.5,1.5,1.1,1.5,1.7
                  c0,0.6-0.2,1.2-0.7,1.6c-0.8,0.8-1.8,1.3-3.1,1.4c-1.5,0.2-3,0.1-4.5-0.2c-0.4,0-0.7,0-0.9,0.1c-0.5,0.1-0.9,0.1-1.1,0
                  c-0.2,0-0.4-0.1-0.5-0.1c-0.2,0.1-0.6,0.1-1,0.1c-0.7-0.2-1.4-0.2-2.3,0.1c-0.8,0.3-1.3,0.4-1.5,0.2c-0.5,0-0.9,0-1.4,0.2
                  c-0.7,0.2-1.4,0.3-1.9,0.2c-0.6,0-1.3,0.1-2.2,0.2C79,38.7,78,38.8,77,38.8c-0.9,0.1-1.5,0.1-1.8,0c-0.3-0.1-0.6-0.1-0.8,0.1
                  c-0.5,0.1-1.1,0.2-2,0.1c-1.5,0.5-2.8,0.5-3.9-0.1c-0.8-0.5-1.2-1.1-1.2-1.9C67.3,36.3,67.6,35.6,68.2,35.1z M51,23.4
                  c0.5-0.6,1-0.9,1.8-1c1-0.1,1.9,0.2,2.7,0.8c0.6,0.5,1.1,1.2,1.5,2c0.2,0.5,0.5,1.1,1,1.8c0.3,0.4,0.5,0.7,0.6,1.1
                  c0.1,0.5,0.3,0.9,0.6,1.4c0.8,1.1,1.1,2.2,1.1,3.3c-0.1,1.1-0.5,1.6-1,1.7c-0.5,0.1-1-0.1-1.5-0.7c-0.7-0.9-1.2-1.3-1.6-1.4
                  c-0.3-0.2-0.6-0.4-0.8-0.8c-0.4-0.5-0.8-0.9-1.3-1.1c-0.3-0.2-0.5-0.5-0.7-0.7c-0.5-0.5-1-1.1-1.8-1.7c-0.7-0.7-1.2-1.3-1.4-2
                  C50.3,25.5,50.5,24.5,51,23.4z M101.1,134.9c-0.3-0.1-0.7,0-1.1,0.3c-0.5,0.3-1.7,0.6-3.7,0.7c-0.7,0.1-1.5,0.1-2.3,0.1
                  c-0.3,0-0.6,0.1-0.9,0.1l-5.9,0.2c-0.5,0-1.1-0.1-2-0.2c-0.9-0.2-1.7-0.2-2.2-0.2c-0.9,0-2.1-0.2-3.6-0.6
                  c-1.1-0.3-2.5-0.7-4.1-1.3l-3.6-1.3c-0.6-0.2-1-0.3-1.4-0.4c-0.4-0.1-0.7-0.2-0.9-0.2c-0.5,0-1.1-0.1-2-0.3
                  c-0.9-0.2-1.5-0.2-1.9-0.2c-0.3,0-0.7,0-1.1,0.1l-2.2,0.6c-0.4,0.1-0.8,0.1-1.1,0.1c-0.2,0-0.5,0-0.7-0.1l-1.3-0.7
                  c-0.2-0.1-0.5-0.1-0.8-0.1l-1.5,0.1c-0.6,0-1.1-0.1-1.6-0.4c-0.2-0.1-0.5-0.3-0.9-0.8c-0.4-0.4-0.8-0.8-1.2-1.4l-1-1.5
                  c-0.3-0.5-0.4-0.8-0.4-1c0-0.1,0-0.3,0.1-0.4c0-0.1,0-0.2,0.1-0.4l0.1-0.4c0-0.2,0.1-0.3,0.1-0.4c0-2.1,0.6-3.8,1.8-5.2
                  c0.5-0.5,1.1-1.1,1.9-1.8l2.3-1.8l1-0.3c0.4-0.2,0.7-0.3,1-0.5c0.7-0.5,1-1,1-1.7c0-0.9-0.5-1.9-1.6-3.1c-1-1.2-1.9-1.8-2.7-1.8
                  h-4.1c-1.2,0-1.8-0.7-1.8-2.2c0-2.3,1.2-3.5,3.7-3.5H55c0.5,0.3,1.3,0.5,2.3,0.6l0.6,0.1c0.2,0,0.4,0,0.6,0.1
                  c0.5,0.1,0.8,0.2,1.2,0.3c0.8,0.3,1.8,1.2,3,2.6c1.3,1.5,2,2.7,2,3.5c0,0.9-0.2,1.7-0.6,2.3l-0.1,0.5c0,0.2,0,0.5,0.1,0.7
                  l0.5,1.3c0.1,0.3,0.1,0.5,0.1,0.7c0,1-0.8,2.1-2.3,3.3c-1.2,0.9-2.4,1.6-3.6,2.1c-1.6,0-2.4,1.1-2.4,3.2c0,1.3,0.6,2.2,1.9,2.8
                  c0.9,0.4,2.1,0.6,3.6,0.6c0.5,0,1.1-0.1,2-0.2c0.9-0.2,1.5-0.2,2-0.2c0.3,0,1.1,0.1,2.2,0.3c1.1,0.2,2.3,0.4,3.7,0.6
                  c1.4,0.3,2.6,0.6,3.6,0.8c1.1,0.2,1.8,0.4,2,0.6c0.2,0.1,0.4,0.2,0.5,0.2c0.2,0.1,0.3,0.1,0.5,0.2c0.4,0.2,0.8,0.2,1,0.2
                  c0.9,0,1.8,0.1,2.8,0.4c0.9,0.2,2.4,0.4,4.3,0.4c0.6,0,1.4,0,2.3,0H91c0.5,0,1.1-0.1,1.8-0.4c0.8-0.2,1.4-0.3,1.8-0.3
                  c0.5,0,1-0.1,1.5-0.2c0.2,0,0.5-0.1,0.7-0.2l1.4-0.6l0.7-0.2c0.5-0.2,1-0.2,1.5-0.2c2.3,0,3.5,1.1,3.5,3.3
                  C104,133.4,103,134.4,101.1,134.9z M51.2,86.8c0-2,0.9-3,2.8-3c1.2,0,2.9,1.2,5,3.7c2.1,2.4,3.1,4.2,3.1,5.4c0,0.2,0,0.4-0.1,0.6
                  L61.9,94c-0.2,0.5-0.5,0.7-1,0.7c-0.4,0-0.9-0.2-1.5-0.7c-0.7-0.5-1.2-0.8-1.5-0.9c-0.2-0.1-0.3-0.2-0.6-0.4
                  c-0.1,0-0.2-0.1-0.2-0.2c-0.1-0.1-0.2-0.2-0.3-0.2l-0.6-0.4c-0.2-0.1-0.4-0.2-0.6-0.2l-2.8-2C51.7,88.5,51.2,87.6,51.2,86.8z
                  M93.6,89.7l0.9,0.2c0.1,0,0.2,0,0.2,0.1c0.5,0.1,0.8,0.1,1.1,0.1h0.9c0.4,0,0.7,0,1,0.1c0.9,0,1.6,0.1,2.2,0.3
                  c1.7,0.5,2.6,1.5,2.6,2.9c0,1.6-1.1,2.3-3.3,2.3c-0.4,0-1-0.1-1.9-0.4l-1.7-0.4l-1-0.4c-1.2-0.3-2.3-0.6-3.1-0.7
                  c-1.2-0.2-2.2-0.4-3.1-0.4c-0.2,0-0.5,0.1-1.1,0.4c-0.5,0.3-0.9,0.5-1,0.7l-0.4,2.3l1.7,1.2l1.4,0.2c0.5,0.1,1,0.1,1.4,0.1
                  c2.8,0,5,0.9,6.7,2.8c1.6,1.8,2.4,4.1,2.4,6.9l-0.2,2.5c0,0.4,0.1,1,0.3,1.7c0.2,0.8,0.4,1.4,0.4,1.7c0,0.5,0.1,1.1,0.2,1.9
                  c0.2,0.8,0.2,1.4,0.2,1.8c0,2.7-0.7,4.8-2,6.4c-1.4,1.7-3.5,2.6-6.1,2.6c-0.8,0-2-0.2-3.6-0.5c-1.6-0.3-2.8-0.5-3.6-0.5
                  c-0.4,0-1,0.1-1.7,0.2c-0.7,0.2-1.3,0.2-1.7,0.2l-1.4-0.1c-0.6,0-1,0.1-1.4,0.4l-0.4,0.1c-0.1,0-0.2,0.1-0.4,0.1
                  c-0.5,0-1.4,0.1-2.5,0.2L74,127c-0.5,0.1-0.8,0.2-1,0.3c-1.2-0.1-2.2-0.9-3.3-2.5c-0.9-1.4-1.4-2.8-1.4-3.9c0-0.7,0-1.4,0.1-2.2
                  l0.2-2.2c0-0.2,0-0.4,0.1-0.6c0-0.2,0-0.3,0.1-0.5c0-0.4,0.1-0.8,0.1-1.1c0.1-0.8,0.1-1.5,0.1-2.2v-0.9c0-0.5,0-0.9,0.1-1.3
                  c0-1.1,0.1-2.2,0.2-3c0.4-2.6,1.1-3.9,2.2-3.9c1.3,0,2,0.9,2,2.8c-0.1,0,0,0.1,0.1,0.3l1.5,1.7l0.1,0.4c0,0.3-0.4,0.9-1,1.6
                  l-0.8,0.9c-0.2,0.5-0.4,0.9-0.6,1.4l0.1,1.3L73,114c1,0.5,1.8,1.4,2.3,2.5l-0.3,0.8c-1.3,0.9-2.1,2.1-2.3,3.5
                  c0.2,0.8,0.7,1.3,1.4,1.7l0.7,0.1c0.5,0,1.2-0.1,2.2-0.4c0.9-0.2,1.7-0.3,2.2-0.3c0.4,0,0.8,0,1.3-0.1c0.2,0,0.4,0,0.6-0.1
                  l1.3-0.2c0.2,0,0.4-0.1,0.6-0.1c0.5-0.1,0.9-0.1,1.3-0.1c0.8,0,2,0.1,3.5,0.2c1.6,0.2,2.8,0.2,3.5,0.2c2.8,0,4.1-1.5,4.1-4.6
                  c0-0.5,0-1.1-0.1-1.9c-0.1-0.9-0.2-1.5-0.2-1.9c0-0.3,0-0.6,0.1-1l0.1-1c0.1-0.9,0.1-1.5,0.1-2c-0.2-1.1-0.4-2.1-0.6-3
                  c-0.4-1.3-0.8-2.1-1.2-2.6c-0.9-0.9-2.8-1.6-5.7-2.1c-1.1-0.1-2.2-0.2-3.5-0.3c-0.9,0-1.9-0.1-2.8-0.1c-0.8,0-1.8,0.2-3.1,0.7
                  l-0.4,0.1c-0.1,0.1-0.2,0.1-0.4,0.1c-0.2,0.1-0.5,0.2-0.6,0.2c-0.5,0.2-0.9,0.2-1.4,0.2c-1.2,0-1.7-0.5-1.7-1.6
                  c0-1,0.7-1.9,2-2.7c1.1-0.7,2.3-1,3.4-1h0.2l1.5-0.9l0.3-1.5c0-0.2,0.1-0.3,0.1-0.4c-0.5-0.5-0.9-0.9-1.3-1.2
                  c-0.8-0.1-1.3-0.2-1.7-0.4c-0.6-0.2-0.9-0.7-0.9-1.2c0-0.8,0.9-1.5,2.6-2c0.7-0.2,1.4-0.3,2.1-0.4c0.6-0.1,1.1-0.1,1.5-0.1
                  c0.8,0,1.7-0.3,2.9-0.8c1.3-0.6,2-1.2,2.1-1.8c0.2-0.3,0.6-0.9,1-1.8l0.4-1c0.1-0.4,0.2-0.7,0.2-0.9c0-2.3,0.9-3.5,2.6-3.5
                  c1.7,0,2.5,1.1,2.5,3.3c0,1.2-0.7,2.4-2,3.6c-0.1,0.2-0.3,0.5-0.7,0.8L92,88.1L93.6,89.7z M86.5,109.9c-0.7,0.2-1.4,0.3-2.2,0.4
                  c-0.7,0.1-1.2,0.1-1.7,0.1c-1.2,0-2.3-0.1-3.3-0.4c-1.4-0.3-2.4-0.8-2.8-1.5c0-0.5,0.4-1,1.1-1.5c0.7-0.5,1.3-0.7,1.8-0.7
                  c0.4,0,0.9-0.1,1.7-0.4c0.8-0.2,1.4-0.4,1.8-0.4c0.4,0,0.9,0,1.5,0.1c0.7,0.1,1.4,0.2,2.1,0.3c1.8,0.5,2.6,1,2.6,1.8
                  C89.2,108.6,88.3,109.4,86.5,109.9z M90,115.9c0,0.9-1,1.6-3,2.1c-0.7,0.2-1.5,0.3-2.3,0.4c-0.7,0.1-1.2,0.1-1.7,0.1
                  c-0.5,0-1.1,0-1.6-0.1c-0.7-0.1-1.3-0.2-1.8-0.3c-1.5-0.3-2.4-0.8-2.9-1.5c0-0.2,0.1-0.4,0.3-0.7c0.2-0.2,0.5-0.5,0.8-0.7
                  c0.7-0.5,1.2-0.7,1.7-0.7c0.4,0,1.1-0.1,2-0.4c0.9-0.3,1.5-0.4,2-0.4c0.4,0,0.9,0,1.5,0.1c0.8,0.1,1.6,0.2,2.2,0.3
                  C89.1,114.6,90,115.2,90,115.9z M80.1,87.9c-0.3,0.1-0.6,0.1-1,0.1h-0.9c-1.3,0-2.6-0.5-4-1.5c-1.4-1.1-2.2-2.2-2.2-3.4
                  c0-1.4,0.8-2.2,2.5-2.2c0.5,0,1.3,0.2,2.3,0.7c0.5,0.2,0.9,0.5,1.2,0.7c0.4,0.2,0.6,0.5,0.7,0.7l1,0.7c0.3,0.2,0.6,0.5,0.8,0.7
                  c0.5,0.5,0.7,1.2,0.7,2C81.2,87.3,80.9,87.7,80.1,87.9z M72.5,91.1c0.7,0,1.2,0,1.7,0.1c1.4,0.2,2.1,0.8,2.1,1.7
                  c0,0.9-1.2,1.7-3.6,2.3c-0.9,0.2-1.9,0.4-2.9,0.6c-0.9,0.1-1.5,0.2-2,0.2c-1.8,0-2.6-0.7-2.6-2.2c0-2.1,1.2-3.1,3.5-3.1
                  c0.2,0,0.4,0,0.6,0.1l1.3,0.3c0.2,0,0.4,0.1,0.6,0.1H72.5z M103.9,70c-0.4,0.6-1.1,1-2.1,1.3c-0.5,0-0.9,0.1-1.1,0.3
                  c-0.7,0.6-2.1,0.9-4.2,0.9c-1,0-1.7,0-2.1,0.1c-1.1,0.4-1.9,0.6-2.3,0.4c-0.7-0.2-1.3-0.2-1.8,0c-1.8,0.6-3.3,0.8-4.3,0.6
                  c-0.9-0.2-2.1-0.2-3.6-0.1c-1.1,0.2-2.6-0.1-4.7-0.9c-0.8-0.3-1.6-0.5-2.5-0.6c-1.5,0-2.7-0.3-3.6-0.9c-0.9-0.5-1.7-0.7-2.6-0.6
                  c-1,0.1-2,0-3-0.2c-0.9-0.1-2.3,0.2-4.3,1c-0.9,0.3-1.6,0.2-2.2-0.2c-0.7-0.5-1.4-0.6-2.2-0.5c-1.3,0.2-2.4,0.2-3.2-0.2
                  c-0.9-0.5-1.6-1.1-2-2.1c-0.2-0.4-0.6-0.8-1-1c-0.4-0.3-0.6-0.6-0.8-1c-0.2-0.5-0.2-0.9-0.1-1.3c0.3-0.6,0.4-1.2,0.2-1.8
                  c-0.1-1.1,0.2-2.1,1-2.8c0.4-0.4,0.7-1,0.9-1.7c0.3-0.8,0.7-1.3,1.2-1.5c0.8-0.3,1.3-0.6,1.6-0.8c0.5-0.4,1.2-0.9,1.9-1.5
                  c1.5-0.3,2.5-0.7,3-1.2c0.4-0.4,0.5-1,0.5-1.9c-0.1-0.9-0.4-1.5-1-1.8c-0.9-0.7-1.8-1.4-2.5-2.2c-0.5-0.5-1.3-0.6-2.4-0.2
                  c-0.5,0.1-0.9,0.2-1.3,0.1c-0.9-0.1-1.6-0.1-2.2-0.1c-0.9,0.1-1.5-0.2-1.8-1.1c-0.3-0.8-0.3-1.6,0-2.5c0.3-0.9,0.7-1.5,1.1-1.8
                  c0.9-0.5,1.9-0.7,2.8-0.7c0.8,0.3,1.7,0.5,2.8,0.4c0.9,0,1.6,0.1,2.3,0.3c0.9,0.3,1.5,0.8,1.9,1.5c0.3,0.6,0.9,1.1,1.8,1.5
                  c0.7,0.4,1.3,1,1.7,1.7c0.2,0.5,0.4,1.2,0.4,2.1c-0.1,0.7-0.3,1.4-0.6,2c-0.2,0.7-0.2,1.5,0.2,2.3c0.2,0.5,0.3,0.9,0.2,1.5
                  c0,0.7-0.4,1.2-1,1.5c-0.5,0.4-0.9,0.8-1.2,1.4c-0.5,0.8-1.9,1.6-4.3,2.3c-1-0.1-1.7,0.3-2.1,1.2C55,62.7,55,64,55.9,65
                  c0.5,0.7,1.2,1.1,1.9,1.2c0.7,0,1.5,0.1,2.2,0.2c0.7,0.1,1.4,0.1,2.2,0.1c2-0.5,3.4-0.7,4.3-0.7c1.4,0.2,2.6,0.4,3.7,0.5
                  c0.5,0,1.2,0.2,2,0.4c0.7,0.2,1.5,0.3,2.5,0.3c1.1,0,2.1,0.2,3,0.6c1.1,0.5,2,0.7,2.6,0.6c0.7,0,1.5,0.1,2.5,0.2
                  c0.7,0.1,1.7,0.1,2.9-0.1c1.6-0.2,3.3-0.2,5.1-0.2c1.2,0,2.2-0.1,3-0.5c0.7-0.4,1.5-0.6,2.2-0.6c0.8,0,1.8-0.3,2.9-0.9
                  c0.9-0.5,1.7-0.7,2.4-0.7c0.7,0,1.3,0.2,2,0.7c0.7,0.5,1.1,0.9,1.2,1.4C104.4,68.5,104.3,69.3,103.9,70z"/>
              </g>
            </g>
          </g>
        </svg>
      )
    }
    return <span className="text-6xl">{module.icon}</span>
  }

  // 显示所有报告模块，不进行权限过虑
  const reportModules = [
    {
      id: 'astrology',
      title: '八字排盘',
      icon: 'svg', // 将使用SVG图标
      subtitle: '八字推演 运程排布',
      status: null,
      requiresPermission: null, // 基础功能，无需权限
      isBasic: true // 标记为基础功能
    },
    {
      id: 'personality',
      title: '性格内观',
      icon: 'svg',
      subtitle: '灵魂内观 观心悟道',
      status: null,
      requiresPermission: null, // 基础功能，无需权限
      isBasic: true // 标记为基础功能
    },
    {
      id: 'wealth',
      title: '事业财富',
      icon: '💰',
      subtitle: '事业规划 财富格局',
      status: null,
      requiresPermission: 'wealth',
      isPremium: true,
    },
    {
      id: 'marriage',
      title: '婚恋感情',
      icon: '💕',
      subtitle: '恋爱情缘 婚姻美满',
      status: null,
      requiresPermission: 'marriage',
      isPremium: true,
    },
    {
      id: 'health',
      title: '身体健康',
      icon: '🏥',
      subtitle: '身心同修 形神俱佳',
      status: null,
      requiresPermission: 'health',
      isPremium: true,
    },
    {
      id: 'fortune',
      title: '2026年运',
      icon: '🔮',
      subtitle: '丙午流年 运势解析',
      status: null,
      requiresPermission: 'consultation',
      isPremium: true,
    }
  ]
  
  // 计算有权限的模块数量
  const accessibleModulesCount = reportModules.filter(module => 
    module.requiresPermission ? canAccessModule(module.requiresPermission) : true
  ).length

  const handleReportClick = (reportId: string, reportTitle: string) => {
    // 🔄 检查是否有该模块的活跃会话，如果有则提示用户
    const activeSession = globalSessionManager.getActiveSessionByModule(reportId)
    if (activeSession) {
      devLog.log('🔄 检测到活跃会话，继续在dashboard内部显示:', reportId)
      // 显示提示信息，但仍然在dashboard内部切换
      message.info(`检测到${reportTitle}的进行中对话，已为您切换到该模块`)
    }

    // 始终在dashboard内部切换内容，不跳转到独立页面
    switch (reportId) {
      case 'astrology':
        setCurrentView('astrology')
        break
      case 'personality':
        setCurrentView('personality')
        break
      case 'wealth':
        setCurrentView('wealth')
        break
      case 'marriage':
        setCurrentView('marriage')
        break
      case 'health':
        setCurrentView('health')
        break
      case 'fortune':
        message.info('功能开发中，敬请期待...')
        break
      default:
        message.info(`即将为您生成${reportTitle}...`)
    }
  }

  const handleConsultation = () => {
    setCurrentView('consultation')
  }

  // 渲染主内容区
  const renderMainContent = () => {
    switch (currentView) {
      case 'astrology':
        return <AstrologyPage />
      case 'personality':
        // 确保设置用户数据到localStorage，避免PersonalityPage跳转到profile
        const currentActiveUser = activeUser || userInfo
        if (currentActiveUser) {
          const userData = {
            nickname: currentActiveUser.name || currentActiveUser.nickname,
            gender: currentActiveUser.gender === 'male' || currentActiveUser.gender === '男' ? 'male' : 'female',
            year: currentActiveUser.year,
            month: currentActiveUser.month,
            day: currentActiveUser.day,
            hour: currentActiveUser.hour,
            minute: currentActiveUser.minute,
            area: {
              province: currentActiveUser.area_province || currentActiveUser.area?.province,
              city: currentActiveUser.area_city || currentActiveUser.area?.city,
              district: currentActiveUser.area_district || currentActiveUser.area?.district
            }
          }
          // 设置userData到localStorage，确保PersonalityPage能正常加载
          localStorage.setItem('userData', JSON.stringify(userData))
          
          // 如果有activeUser，也设置到localStorage
          if (activeUser) {
            localStorage.setItem('activeUser', JSON.stringify(activeUser))
          }
        }
        return <PersonalityPage />
      case 'wealth':
        // 确保设置用户数据到localStorage，避免WealthPage跳转到profile
        const currentActiveUserWealth = activeUser || userInfo
        if (currentActiveUserWealth) {
          const userData = {
            nickname: currentActiveUserWealth.name || currentActiveUserWealth.nickname,
            gender: currentActiveUserWealth.gender === 'male' || currentActiveUserWealth.gender === '男' ? 'male' : 'female',
            year: currentActiveUserWealth.year,
            month: currentActiveUserWealth.month,
            day: currentActiveUserWealth.day,
            hour: currentActiveUserWealth.hour,
            minute: currentActiveUserWealth.minute,
            area: {
              province: currentActiveUserWealth.area_province || currentActiveUserWealth.area?.province,
              city: currentActiveUserWealth.area_city || currentActiveUserWealth.area?.city,
              district: currentActiveUserWealth.area_district || currentActiveUserWealth.area?.district
            }
          }
          localStorage.setItem('userData', JSON.stringify(userData))
          
          if (activeUser) {
            localStorage.setItem('activeUser', JSON.stringify(activeUser))
          }
        }
        return <WealthPage />
      case 'marriage':
        // 确保设置用户数据到localStorage，避免MarriagePage跳转到profile
        const currentActiveUserMarriage = activeUser || userInfo
        if (currentActiveUserMarriage) {
          const userData = {
            nickname: currentActiveUserMarriage.name || currentActiveUserMarriage.nickname,
            gender: currentActiveUserMarriage.gender === 'male' || currentActiveUserMarriage.gender === '男' ? 'male' : 'female',
            year: currentActiveUserMarriage.year,
            month: currentActiveUserMarriage.month,
            day: currentActiveUserMarriage.day,
            hour: currentActiveUserMarriage.hour,
            minute: currentActiveUserMarriage.minute,
            area: {
              province: currentActiveUserMarriage.area_province || currentActiveUserMarriage.area?.province,
              city: currentActiveUserMarriage.area_city || currentActiveUserMarriage.area?.city,
              district: currentActiveUserMarriage.area_district || currentActiveUserMarriage.area?.district
            }
          }
          localStorage.setItem('userData', JSON.stringify(userData))
          
          if (activeUser) {
            localStorage.setItem('activeUser', JSON.stringify(activeUser))
          }
        }
        return <MarriagePage />
      case 'health':
        // 确保设置用户数据到localStorage，避免HealthPage跳转到profile
        const currentActiveUserHealth = activeUser || userInfo
        if (currentActiveUserHealth) {
          const userData = {
            nickname: currentActiveUserHealth.name || currentActiveUserHealth.nickname,
            gender: currentActiveUserHealth.gender === 'male' || currentActiveUserHealth.gender === '男' ? 'male' : 'female',
            year: currentActiveUserHealth.year,
            month: currentActiveUserHealth.month,
            day: currentActiveUserHealth.day,
            hour: currentActiveUserHealth.hour,
            minute: currentActiveUserHealth.minute,
            area: {
              province: currentActiveUserHealth.area_province || currentActiveUserHealth.area?.province,
              city: currentActiveUserHealth.area_city || currentActiveUserHealth.area?.city,
              district: currentActiveUserHealth.area_district || currentActiveUserHealth.area?.district
            }
          }
          localStorage.setItem('userData', JSON.stringify(userData))
          
          if (activeUser) {
            localStorage.setItem('activeUser', JSON.stringify(activeUser))
          }
        }
        return <HealthPage />
      case 'add-user':
        return <AddUserPage onSuccess={() => {
          // 验证成功后切换到profile视图
          setCurrentView('add-user-profile')
        }} />
      case 'add-user-profile':
        return <AddUserProfilePage 
          onSuccess={async (newUser) => {
            try {
              devLog.log('新用户创建成功，开始切换用', newUser.id)
              
              // 保存成功后切换到新用户并返回dashboard，同时生成token
              await setActiveUserWithToken(newUser, true)
              
              // 强制刷新用户列表，确保新用户显示
              devLog.log('🔄 刷新用户列表以显示新用户...')
              let refreshAttempts = 0
              const maxRefreshAttempts = 3
              
              while (refreshAttempts < maxRefreshAttempts) {
                await loadUserHierarchy()
                
                // 检查新用户是否已经在列表中
                const checkNewUser = childUsers.find(user => user.id === newUser.id) || 
                                   (mainUser && mainUser.id === newUser.id)
                
                if (checkNewUser) {
                  devLog.log('新用户已成功加载到用户列表中')
                  break
                } else {
                  refreshAttempts++
                  devLog.log(`⚠️ {refreshAttempts}次刷新后新用户尚未在列表中，${refreshAttempts < maxRefreshAttempts ? '继续重试' : '停止重试'}`)
                  
                  if (refreshAttempts < maxRefreshAttempts) {
                    // 等待500ms后重试
                    await new Promise(resolve => setTimeout(resolve, 500))
                  }
                }
              }
              
              // 立即返回dashboard主页，防止中间跳转到其他页面
              setCurrentView('dashboard')
              
              // 确保页面状态更?新
              await new Promise(resolve => setTimeout(resolve, 100))
              
              // 触发自定义事件，通知其他页面用户已切换
              window.dispatchEvent(new Event('userSwitched'))
              
              devLog.log('🎉 新用户创建和切换流程完成，已跳转到dashboard')
            } catch (error) {
              devLog.error('新用户创建成功但切换过程出错:', error)
              message.error('用户创建成功，但切换过程出现问题，请手动刷新页面')
              
              // 即使出错也要返回dashboard
              setCurrentView('dashboard')
            }
          }}
          onCancel={() => {
            // 取消时返回添加用户页
            setCurrentView('add-user')
          }}
        />
        
      case 'consultation':
        return (
          <div className="max-w-4xl mx-auto px-4 py-4">
            {/* 页面标题 */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageOutlined className="text-white text-xl" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">问道1v1</h1>
              <p className="text-gray-600">专业命理咨询服务</p>
            </div>

            {/* 客服二维码区*/}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                              <h2 className="text-xl font-semibold text-gray-900 text-center mb-6">联系客服</h2>
              <div className="flex justify-center items-center gap-12">
                {/* 第一个客服二维码 */}
                <div className="text-center">
                  <div className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                      <Image
                        src="/images/consultation-qr-1.jpg"
                        alt="丁火师姐微信二维码"
                        width={300}
                        height={300}
                        className="w-full h-full object-contain rounded-xl"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling!.classList.remove('hidden');
                        }}
                      />
                    <div className="hidden text-gray-500 text-center">
                      <div className="text-3xl mb-2">📱</div>
                      <div className="text-sm">客服1</div>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-700">丁火师姐</p>
                </div>

                {/* 第二个客服二维码 */}
                <div className="text-center">
                  <div className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                                          <Image
                        src="/images/consultation-qr-2.jpg"
                        alt="芷暄师妹微信二维码"
                        width={300}
                        height={300}
                        className="w-full h-full object-contain rounded-xl"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling!.classList.remove('hidden');
                        }}
                      />
                    <div className="hidden text-gray-500 text-center">
                      <div className="text-3xl mb-2">📱</div>
                      <div className="text-sm">客服2</div>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-700">芷暄师妹</p>
                </div>
              </div>
              <p className="text-center text-gray-500 text-sm mt-6">扫描二维码添加客服微信，获得专业咨询服务</p>
            </div>

            {/* 公司介绍区域 */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">公司介绍</h2>
              <div className="prose prose-gray max-w-none">
                <div className="space-y-6 text-gray-700 leading-relaxed">
                  <p className="text-base">
                    天乙神算（Dao fate）于2025年夏季正式上线，是一家以东方术数体系为根基、人工智能技术为引擎的创新型企业。公司秉承&ldquo;融合古今智慧，赋能精准决策&rdquo;的使命，致力于通过大语言模型（LLM）与玄学理法的深度融合，推动东方术数在全球范围的科学化传播与场景化落地。                  </p>
                  <p className="text-base">
                    公司以&ldquo;专业理法体系&rdquo;为核心竞争力，以十万级真实案例、20年行业经验为根基，将八字命理等传统术数模型转化为可计算的AI算法。通过自研的玄学大语言模型（Metaphysical LLM），实现命理推演的标准化、交互化与可视化，突破传统术数的学习壁垒与应用局限。                  </p>
                  <p className="text-base">
                    创始人寻一，早年任职上市公司负责资本运作，因特殊奇遇而进入玄学领域，又历经十年名师遍访、八年全职从业，深感术数高阶理论的认知壁垒。创立天乙神算的初心，是借力AI破解&lsquo;传统玄学曲高和寡&rsquo;之困，让造物之奇与术数之精，成为可被普罗大众理解的生活智慧。                 </p>
                </div>
              </div>
            </div>
          </div>
        )
      default:
        return (
          <div className="max-w-6xl mx-auto">
            {/* 欢迎区域 */}
            <div className="mb-6">
              <div className="text-center py-4 md:py-16 px-4 md:px-8">
                <div className="max-w-4xl mx-auto">
                  <div className="flex justify-center items-center space-x-3 mb-3">
                    <h2 className="text-lg md:text-2xl font-medium text-gray-700">
                      欢迎回来，{activeUser?.name || '用户'}道友
                    </h2>
                    {/* 角色标签 */}
                    {userRole && (
                      <Tag 
                        icon={
                          isAdmin ? <SecurityScanOutlined /> : 
                          isVip ? <CrownOutlined /> : 
                          <UserOutlined />
                        }
                        color={
                          isAdmin ? 'red' : 
                          isVip ? 'gold' : 
                          'blue'
                        }
                      >
                        {userRole.role_display_name}
                      </Tag>
                    )}
                  </div>
                  
                  {/* 权限提示 */}
                  {/* {!permissionsLoading && (
                    <div className="text-sm text-gray-500 mb-8">
                      {isAdmin && '您拥有系统管理员权限，可以访问所有功能'}
                      {isVip && !isAdmin && '您拥有VIP权限，可以使用高级功能'}
                      {!isAdmin && !isVip && `您当前有 ${accessibleModulesCount} 个可用功能，${reportModules.length} 个功能`}
                    </div>
                  )} */}

                  {/* 哲学文案 */}
                  <h1 className="text-2xl md:text-4xl font-semibold text-gray-900 leading-relaxed tracking-wider mt-6 md:mt-8">
                    人立于命 命行运中 命由心敕 运掌中天心御乾坤
                  </h1>
                </div>
              </div>
            </div>

            {/* 报告模块 - 3×2布局 */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-6">
              {reportModules.map((module) => {
                const hasGeneratePermission = module.requiresPermission ? canGenerate(module.requiresPermission as string) : true
                const hasViewPermission = module.requiresPermission ? canView(module.requiresPermission as string) : true
                const hasChatPermission = module.requiresPermission ? canChat(module.requiresPermission as string) : true
                const isPremiumModule = module.isPremium
                const isBasicModule = module.isBasic
                // 基础功能始终有权限，其他功能需要权限检查
                const hasAccess = isBasicModule || hasViewPermission || hasGeneratePermission || hasChatPermission
                
                return (
                  <Card
                    key={module.id}
                    className="transition-all duration-300 border-gray-200 bg-white relative hover:shadow-lg hover:scale-[1.02] cursor-pointer hover:border-gray-300"
                    bodyStyle={{ padding: '32px 16px', minHeight: '140px' }}
                    onClick={() => {
                      if (hasAccess) {
                        handleReportClick(module.id, module.title)
                      } else {
                        // 为无权限用户提供更友好的提示
                        if (isPremiumModule) {
                          message.info(`请开通VIP权限`)
                        } else {
                          message.info(`您当前没有${module.title}功能的使用权限`)
                        }
                      }
                    }}
                  >
                    {/* 状态标签*/}
                    <div className="absolute top-3 right-3 flex flex-col gap-1">
                      {/* 活跃会话指示标签*/}
                      {(() => {
                        const activeSession = globalSessionManager.getActiveSessionByModule(module.id)
                        if (activeSession) {
                          return (
                            <Tooltip title="正在进行对话中，点击返回">
                              <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600 border border-blue-300 animate-pulse">
                                <MessageOutlined style={{ fontSize: '10px', marginRight: '2px' }} />
                                对话中                              </div>
                            </Tooltip>
                          )
                        }
                        return null
                      })()}
                      
                      {module.status && (
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          module.status === '推荐' ? 'bg-blue-100 text-blue-600' :
                          module.status === '已完成' ? 'bg-green-100 text-green-600' :
                          module.status === '新功能' ? 'bg-orange-100 text-orange-600' : ''
                        }`}>
                          {module.status}
                        </div>
                      )}
                      
                      {/* VIP功能标签 - 显示在所有VIP功能上 */}
                      {isPremiumModule && (
                        <Tooltip title="VIP功能">
                          <Tag color="gold">
                            <CrownOutlined style={{ fontSize: '10px' }} />
                          </Tag>
                        </Tooltip>
                      )}
                    </div>

                    <div className="flex items-start space-x-5">
                      {/* SVG图标在左*/}
                      <div className="flex-shrink-0">
                        {renderModuleIcon(module)}
                      </div>
                      
                      {/* 标题和副标题在右*/}
                      <div className="flex-1 text-left flex flex-col justify-center">
                        <h3 className="font-medium text-xl mb-2 text-gray-900">
                          {module.title}
                        </h3>
                        <p className="text-base leading-relaxed italic text-gray-500">
                          {module.subtitle}
                        </p>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )
    }
  }

  if (!userInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      {/* 移动端顶部导航栏 */}
      <div className="md:hidden bg-white shadow-sm border-b border-gray-200 p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* 返回命书按钮 - 只在非dashboard主页时显示 */}
            {currentView !== 'dashboard' && (
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => setCurrentView('dashboard')}
                className="p-0 mr-2"
                title="返回「命书」"
              />
            )}
            <TianIcon width={22} height={22} />
            <div className="text-sm font-bold text-gray-900">
              <div>天乙神算</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-xs">{activeUser?.name ? activeUser.name.charAt(0) : ''}</span>
            </div>
            <span className="text-sm text-gray-700">{activeUser?.name || '用户'}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* 左侧导航栏*/}
        <div className="w-48 bg-white shadow-sm border-r border-gray-200 flex flex-col hidden md:flex h-full overflow-hidden">
        {/* Logo区域 */}
        <div className="p-4 border-b border-gray-100 text-center flex-shrink-0">
          <div className="flex flex-col items-center space-y-2">
            <TianIcon width={40} height={40} />
            <div className="text-center">
              <div className="text-lg font-bold text-gray-800">天乙</div>
              <div className="text-lg font-bold text-gray-800">神算</div>
            </div>
          </div>
        </div>

        {/* 用户信息 */}
        <div className="p-4 border-b border-gray-100 flex-shrink-0">
          {/* 当前激活用户*/}
          {activeUser && (
            <div className="flex items-center space-x-3 mb-4 p-3 bg-gray-50 rounded-lg">
              {/* 根据用户八字日干显示对应图标 */}
              <div className="flex-shrink-0">
                {baziData?.paipan?.dayPillar?.heavenly
                  ? getTianganIcon(baziData.paipan.dayPillar.heavenly, {
                      width: 32,
                      height: 32,
                      className: "text-green-600"
                    })
                  : <GenIcon width={32} height={32} className="text-green-600" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <div className="text-base font-semibold text-gray-900">{activeUser.name}</div>
                  {/* 角色标签 */}
                  {/* {userRole && (
                    <Tooltip title={userRole.role_display_name}>
                      <Tag 
                        icon={
                          isAdmin ? <SecurityScanOutlined /> : 
                          isVip ? <CrownOutlined /> : 
                          <UserOutlined />
                        }
                        color={
                          isAdmin ? 'red' : 
                          isVip ? 'gold' : 
                          'blue'
                        }
                      >
                        {userRole.role_display_name}
                      </Tag>
                    </Tooltip>
                  )} */}
                </div>
                <div className="text-xs text-gray-500">当前用户</div>
              </div>
            </div>
          )}
          
          {/* 其他用户列表 - 折叠面板 */}
          {getUserDisplayList().length > 0 && (
            <div className="mb-4">
              {/* 折叠面板头部 */}
              <div
                className="flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50"
                onClick={() => setUserListCollapsed(!userListCollapsed)}
              >
                <span className="text-sm font-medium text-gray-600">
                  其他用户 ({getUserDisplayList().length})
                </span>
                {userListCollapsed ? (
                  <RightOutlined className="text-gray-400 text-xs" />
                ) : (
                  <DownOutlined className="text-gray-400 text-xs" />
                )}
              </div>
                
              {/* 折叠面板内容 */}
              {!userListCollapsed && (
                <div className="space-y-1 mt-2 max-h-40 overflow-y-auto">
                  {getUserDisplayList().map((user: any, index: number) => {
                    const isMainUser = user.parent_id === null
                    const isActive = activeUser?.id === user.id

                    return (
                      <div
                        key={user.id}
                        className="flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50"
                        onClick={() => handleUserSwitch(user)}
                      >
                        {/* 统一图标处理 */}
                        <div className="flex-shrink-0">
                          {allUsersBaziData[user.id]?.paipan?.dayPillar?.heavenly
                            ? getTianganIcon(allUsersBaziData[user.id].paipan.dayPillar.heavenly, {
                               width: 28,
                               height: 28,
                               className: "text-green-600"
                             })
                            : <GenIcon width={28} height={28} className="text-green-600" />
                          }
                        </div>
                        <span className="flex-1 text-sm text-gray-600 truncate">
                          {user.name}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* 新增用户按钮 - 需要管理员权限或VIP权限 */}
          <div
            className="flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors text-gray-600 hover:text-gray-700 hover:bg-gray-50 border border-dashed border-gray-300 hover:border-gray-400"
            onClick={() => {
              if (isAdmin || isVip) {
                setCurrentView('add-user')
              } else {
                message.info('请开通VIP权限')
              }
            }}
          >
            <div className="flex-shrink-0">
              <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                <path d="M817.408 690.9952h115.0464c21.504 0 38.8096 17.408 38.8096 38.912s-17.3568 38.912-38.8096 38.912h-115.0464v116.736a38.8608 38.8608 0 1 1-77.6704 0v-116.736h-117.76a38.8608 38.8608 0 0 1-38.8096-38.912c0-21.504 17.408-38.912 38.8608-38.912h117.76v-116.736a38.8608 38.8608 0 1 1 77.6192 0v116.736zM494.08 563.8656c151.4496-1.5872 274.6368-128.3072 274.6368-282.4704C768.256 126.2592 643.1744 0 489.984 0 336.7424 0 212.0704 126.72 212.0704 282.4192a281.856 281.856 0 0 0 126.0032 235.8784C168.0896 582.6048 51.2 750.848 51.2 935.7312c0 20.8384 16.128 37.0688 36.608 37.0688 20.48 0 36.5568-16.2816 36.5568-37.0688 0-204.7488 163.328-371.4048 364.032-371.4048 1.0752 0 2.4576-0.1024 5.632-0.4608zM489.9328 74.24c112.7936 0 204.5952 93.184 204.5952 207.616 0 114.4832-91.8016 207.6672-204.5952 207.6672-112.896 0-204.6976-93.1328-204.6976-207.6672 0-114.4832 91.8016-207.5648 204.6976-207.616z" fill="#8B4513"/>
              </svg>
            </div>
            <span className="text-sm font-medium">
              新增用户
            </span>
          </div>
        </div>

        {/* 导航菜单 */}
        <div className="flex-1 p-4">
          <div className="space-y-2">
            <div
              className={`px-4 py-3 rounded-lg cursor-pointer transition-all duration-300 text-center relative ${
                currentView === 'dashboard'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
              onClick={() => setCurrentView('dashboard')}
            >
              {/* 选中状态下显示ons.png图片 */}
              {currentView === 'dashboard' && (
                <div className="absolute inset-0 bg-cover bg-center bg-no-repeat rounded-lg opacity-60"
                     style={{
                       backgroundImage: 'url(/images/ons.png)',
                        backgroundSize: '95%',
                        backgroundPosition: 'center',
                       filter: 'brightness(1.2) contrast(1.3) saturate(1.5) hue-rotate(-10deg)'
                     }}>
                </div>
              )}
              <div className="flex items-center justify-center space-x-2 relative z-10">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                  viewBox="0 0 200 200" xmlSpace="preserve" width="24" height="24">
                  <style type="text/css">
                    {`.st220{fill:none;stroke:#000000;stroke-width:4;stroke-linecap:round;stroke-miterlimit:10;}`}
                  </style>
                  <path className="st220" d="M164,13.7h-21.8v25.2h25.8V17.6C167.9,15.5,166.1,13.7,164,13.7z M32.1,17.6v164.7c0,2.2,1.8,4,4,4h98.3V13.7
                    H36C33.9,13.7,32.1,15.5,32.1,17.6z M160,159.8h-17.9v26.5H164c2.2,0,4-1.8,4-4v-22.5H160z M160,95.6h-17.9v57h25.8v-57h-4H160z
                    M160,47.9h-17.9v41.1h25.8V47.9h-4H160z M81,31c0,0-25.7,40.9-21.2,65.5s27.5,36.9,11.7,65.2"/>
                </svg>
                <span className="text-base font-medium tracking-wide">命书</span>
              </div>
            </div>
            
            {/* VIP功能：召灵*/}
            <div
              className={`px-4 py-3 rounded-lg cursor-pointer transition-all duration-300 text-center relative ${
                currentView === 'divination'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
              onClick={() => {
                if (isVip) {
                  message.info('功能开发中，敬请期待...')
                } else {
                  message.info('请开通VIP权限')
                }
              }}
            >
              {/* 选中状态下显示ons.png图片 */}
              {currentView === 'divination' && (
                <div className="absolute inset-0 bg-cover bg-center bg-no-repeat rounded-lg opacity-60"
                     style={{
                       backgroundImage: 'url(/images/ons.png)',
                       filter: 'brightness(1.2) contrast(1.3) saturate(1.5) hue-rotate(-10deg)'
                     }}>
                </div>
              )}
              <div className="flex items-center justify-center space-x-2 relative z-10">
                <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                  <path d="M874.038 149.962C777.334 53.256 648.76 0 512 0S246.666 53.256 149.962 149.962C53.256 246.666 0 375.24 0 512s53.256 265.334 149.962 362.038C246.666 970.744 375.24 1024 512 1024s265.334-53.256 362.038-149.962C970.744 777.334 1024 648.76 1024 512s-53.258-265.334-149.962-362.038zM192.39 831.61C107.02 746.238 60.002 632.734 60.002 512S107.02 277.76 192.39 192.39 391.266 60.002 512 60.002c116.346 0 210.998 94.652 210.998 210.998S628.346 481.998 512 481.998c-149.432 0-271 121.57-271 271 0 56.034 17.094 108.154 46.344 151.412-34.302-19.71-66.228-44.074-94.954-72.8z m639.22 0C746.238 916.98 632.732 963.996 512 963.996c-116.346 0-210.998-94.652-210.998-210.998S395.654 542 512 542c149.432 0 271-121.57 271-271 0-56.034-17.094-108.154-46.344-151.412 34.302 19.71 66.228 44.074 94.952 72.802 85.372 85.37 132.386 198.878 132.386 319.608 0.002 120.732-47.014 234.24-132.384 319.612z" fill="currentColor"/>
                  <path d="M512 162.196c-60.682 0-110.054 49.37-110.054 110.054s49.368 110.054 110.054 110.054c60.682 0 110.054-49.37 110.054-110.054S572.682 162.196 512 162.196z m0 160.104c-27.598 0-50.05-22.454-50.05-50.05S484.4 222.198 512 222.198c27.598 0 50.05 22.454 50.05 50.05S539.598 322.3 512 322.3zM512 642.946c-60.682 0-110.054 49.37-110.054 110.054s49.37 110.054 110.054 110.054 110.054-49.37 110.054-110.054-49.372-110.054-110.054-110.054z m0 160.104c-27.598 0-50.05-22.454-50.05-50.05 0-27.598 22.454-50.05 50.05-50.05s50.05 22.454 50.05 50.05c0 27.596-22.452 50.05-50.05 50.05z" fill="currentColor"/>
                </svg>
                <span className="text-base font-medium tracking-wide">卜卦</span>
              </div>
            </div>
            
            {/* VIP功能：疗愈*/}
            <div
              className={`px-4 py-3 rounded-lg cursor-pointer transition-all duration-300 text-center relative ${
                currentView === 'healing'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
              onClick={() => {
                if (isVip) {
                  message.info('功能开发中，敬请期待...')
                } else {
                  message.info('请开通VIP权限')
                }
              }}
            >
              {/* 选中状态下显示ons.png图片 */}
              {currentView === 'healing' && (
                <div className="absolute inset-0 bg-cover bg-center bg-no-repeat rounded-lg opacity-60"
                     style={{
                       backgroundImage: 'url(/images/ons.png)',
                       filter: 'brightness(1.2) contrast(1.3) saturate(1.5) hue-rotate(-10deg)'
                     }}>
                </div>
              )}
              <div className="flex items-center justify-center space-x-2 relative z-10">
                <svg viewBox="0 0 1088 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                  <path d="M681.152 224a160 160 0 1 1-320 0 160 160 0 0 1 320 0z" fill="currentColor"/>
                  <path d="M617.152 224a96 96 0 1 0-96 96v64a160 160 0 1 1 0-320 160 160 0 0 1 0 320V320a96 96 0 0 0 96-96zM724.736 613.504c0-54.912-33.664-101.76-83.072-114.56-41.216-10.56-85.44-18.944-120.576-18.944-34.816 0-78.72 8.32-119.68 18.752-49.92 12.8-83.904 60.288-83.904 115.776 0 22.144-10.112 42.88-27.072 56.64l-7.68 5.44-50.944 31.296a32 32 0 1 1-33.536-54.528l50.944-31.36 1.792-1.408a8.896 8.896 0 0 0 2.496-6.08c0-80.768 50.048-156.8 132.032-177.792 42.496-10.88 92.544-20.736 135.552-20.736 43.392 0 93.824 10.048 136.512 20.992l14.912 4.544c72.512 25.856 116.224 96.832 116.224 171.968 0 3.136 1.728 6.016 4.48 7.488l56.832 31.68 5.312 3.712a32 32 0 0 1-30.464 54.784l-5.952-2.56-56.896-31.68c-23.04-12.8-37.312-37.12-37.312-63.424z" fill="currentColor"/>
                  <path d="M516.544 738.624a32 32 0 0 1 43.2 46.848l-0.192 0.192-0.64 0.768-2.496 2.752-8.96 10.048c-7.552 8.512-17.92 20.16-29.44 32.832-22.592 25.088-49.92 54.912-66.56 71.552-24.96 24.96-59.2 37.056-90.944 43.008a380.736 380.736 0 0 1-71.68 5.76l-21.568-0.512C210.432 949.184 172.8 900.48 172.8 848.64c0-52.288 36.928-97.28 88.128-107.52l17.216-3.456a166.016 166.016 0 0 0 105.6-70.656l18.432-27.776 4.16-4.992a32 32 0 0 1 52.16 34.752l-3.072 5.76-18.496 27.776a230.016 230.016 0 0 1-135.104 95.36l-11.136 2.56-17.216 3.456a45.632 45.632 0 0 0-36.672 44.736c0 22.784 15.68 38.464 33.472 39.296l19.072 0.512c19.584 0.064 40.192-1.152 59.328-4.736 26.048-4.928 45.696-13.504 57.536-25.344a2291.2 2291.2 0 0 0 64.384-69.12l29.12-32.576 8.832-9.984 2.432-2.688 0.64-0.768 0.192-0.192 4.736-4.416z" fill="currentColor"/>
                  <path d="M506.112 792.448a32 32 0 0 0-36.672 52.032v0.064l0.256 0.128 0.64 0.576 2.368 1.984a877.056 877.056 0 0 0 37.568 30.464c19.392 14.912 44.928 33.344 67.584 44.992l9.536 4.48c25.856 11.328 60.416 16.64 93.12 19.264 33.536 2.688 68.608 2.816 97.664 2.048 56.64-1.408 98.624-48.64 98.624-103.04 0-50.432-35.584-93.824-84.992-103.68l-20.288-4.096-16-3.968a166.016 166.016 0 0 1-89.6-66.688l-18.496-27.776-4.096-4.992a32 32 0 0 0-52.224 34.752l3.072 5.76 18.56 27.776a230.016 230.016 0 0 0 135.04 95.36l11.136 2.56 20.352 4.032a41.792 41.792 0 0 1 33.536 40.96 37.952 37.952 0 0 1-36.224 39.04c-27.904 0.704-60.608 0.64-91.008-1.792-31.296-2.56-56.832-7.296-72.512-14.08l-13.888-7.232a496.32 496.32 0 0 1-49.856-34.432 947.904 947.904 0 0 1-35.136-28.416l-2.048-1.792-0.576-0.448-0.128-0.128-5.312-3.712z" fill="currentColor"/>
                </svg>
                <span className="text-base font-medium tracking-wide">疗愈</span>
              </div>
            </div>
            
            {/* VIP功能：宝阁*/}
            <div
              className={`px-4 py-3 rounded-lg cursor-pointer transition-all duration-300 text-center relative ${
                currentView === 'treasury'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
              onClick={() => {
                if (isVip) {
                  message.info('功能开发中，敬请期待...')
                } else {
                  message.info('请开通VIP权限')
                }
              }}
            >
              {/* 选中状态下显示ons.png图片 */}
              {currentView === 'treasury' && (
                <div className="absolute inset-0 bg-cover bg-center bg-no-repeat rounded-lg opacity-60"
                     style={{
                       backgroundImage: 'url(/images/ons.png)',
                       filter: 'brightness(1.2) contrast(1.3) saturate(1.5) hue-rotate(-10deg)'
                     }}>
                </div>
              )}
              <div className="flex items-center justify-center space-x-2 relative z-10">
                <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                  <path d="M927.289 577.885c-2.594-10.262-11.818-17.456-22.396-17.456-142.336 0-184.263-117.831-185.954-122.77a23.07 23.07 0 0 0-21.9-15.787v-92.379h22.757c3.744 0 7.42-0.913 10.735-2.65l92.402-48.501c9.405-4.939 14.231-15.652 11.683-25.97-2.549-10.318-11.795-17.569-22.418-17.569-153.559 0-281.59-129.765-283.284-131.499-0.099-0.113-0.135-0.259-0.237-0.372a874.27 874.27 0 0 1-3.462-2.774c-1.099-0.733-2.198-1.209-3.297-1.653-0.414-0.192-0.798-0.383-1.224-0.551-1.267-0.592-2.534-1.052-3.802-1.257-1.066-0.214-2.112-0.096-3.173-0.161-0.491-0.032-0.933-0.29-1.428-0.29h-0.034c-0.295 0-0.554 0.162-0.847 0.173-2.513 0.101-4.965 0.544-7.289 1.489-1.438 0.546-2.637 1.46-3.943 2.284-1.427 0.88-2.997 1.565-4.295 2.742-0.106 0.111-0.145 0.271-0.248 0.383-1.47 1.521-128.819 131.487-282.991 131.487-10.623 0-19.881 7.251-22.43 17.569-2.537 10.318 2.289 21.042 11.694 25.97l92.425 48.501a22.984 22.984 0 0 0 10.736 2.65h22.452v92.379a23.094 23.094 0 0 0-21.911 15.787c-0.406 1.229-42.581 122.77-185.943 122.77-10.578 0-19.802 7.195-22.396 17.456-2.582 10.239 2.131 20.952 11.446 25.982l90.068 48.513a23.164 23.164 0 0 0 10.95 2.752h25.407v249.533c0 12.765 10.341 23.095 23.095 23.095s23.095-10.33 23.095-23.095V875.96l46.19-12.693v18.328c0 12.765 10.341 23.095 23.095 23.095s23.095-10.33 23.095-23.095v-25.366l277.138 1.969v23.396c0 12.765 10.33 23.095 23.095 23.095s23.095-10.33 23.095-23.095v-16.749l46.19 11.542v28.279c0 12.765 10.33 23.095 23.095 23.095s23.095-10.33 23.095-23.095V655.131h25.395c3.812 0 7.578-0.947 10.961-2.752l90.079-48.513c9.314-5.029 14.028-15.742 11.434-25.981zM650.85 421.87h-46.19v-92.379h46.19v92.379z m-92.379-92.379v92.379h-92.379v-92.379h92.379z m-268.963-57.343c105.449-23.941 188.672-90.271 222.784-120.989 34.18 30.718 117.538 97.059 223.044 120.989l-21.223 11.153H310.765l-21.257-11.153z m84.204 57.343h46.19v92.379h-46.19v-92.379z m-92.38 498.578V655.131h46.19v160.24l-46.19 12.698z m92.38-18.035V655.131H650.85v156.876l-277.138-1.973z m369.517 18.759l-46.19-11.547V655.131h46.19v173.662z m65.767-219.852H215.555l-22.61-12.179c90.992-26.072 134.385-96.913 149.733-128.702h339.206c15.336 31.789 58.73 102.63 149.733 128.702l-22.621 12.179z" fill="currentColor"/>
                </svg>
                <span className="text-base font-medium tracking-wide">宝阁</span>
              </div>
            </div>
          </div>
        </div>

        {/* 底部问道1v1按钮 */}
        <div className="p-4 border-t border-gray-100 flex-shrink-0">
          <div className="relative">
            {/* 选中状态下显示ons.png图片 */}
            {currentView === 'consultation' && (
              <div className="absolute inset-0 bg-cover bg-center bg-no-repeat rounded-lg opacity-60 z-10 pointer-events-none"
                   style={{ 
                     backgroundImage: 'url(/images/ons.png)',
                     filter: 'brightness(1.2) contrast(1.3) saturate(1.5) hue-rotate(-10deg)'
                   }}>
              </div>
            )}
            <Button
              type="primary"
              block
              size="large"
              onClick={handleConsultation}
              className={`border-none shadow-lg hover:shadow-xl transition-all duration-300 relative z-20 ${
                currentView === 'consultation'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-black hover:bg-gray-800'
              }`}
            >
              <span className="font-medium tracking-wide text-white">问道1v1</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 主内容区*/}
      <div className="flex-1 p-0.5 md:p-1 overflow-y-auto h-full min-h-0">
        <Suspense fallback={
          <div className="flex items-center justify-center h-64">
            <Spin size="large" />
          </div>
        }>
          {renderMainContent()}
        </Suspense>
      </div>

      {/* 移动端底部问道1v1按钮 */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex-shrink-0">
        <div className="relative">
          {/* 选中状态下显示ons.png图片 */}
          {currentView === 'consultation' && (
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat rounded-lg opacity-60 z-10 pointer-events-none"
                 style={{ 
                   backgroundImage: 'url(/images/ons.png)',
                   filter: 'brightness(1.2) contrast(1.3) saturate(1.5) hue-rotate(-10deg)'
                 }}>
            </div>
          )}
          <Button
            type="primary"
            block
            size="large"
            onClick={handleConsultation}
            className={`border-none shadow-lg relative z-20 ${
              currentView === 'consultation' 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-black hover:bg-gray-800'
            }`}
          >
            <span className="font-medium tracking-wide text-white">问道1v1</span>
          </Button>
        </div>
      </div>
    </div>
    </div>
  )
} 
