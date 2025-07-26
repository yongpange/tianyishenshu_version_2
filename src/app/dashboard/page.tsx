'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Avatar, Button, message, Divider, Spin, Collapse, Tag, Tooltip } from 'antd'
import {
  UserOutlined,
  WechatOutlined,
  UsergroupAddOutlined,
  SettingOutlined,
  MessageOutlined,
  PlusOutlined,
  DownOutlined,
  RightOutlined,
  CrownOutlined,
  SecurityScanOutlined,
  LockOutlined
} from '@ant-design/icons'
import dynamic from 'next/dynamic'
import { PermissionGuard, usePermissionCheck } from '@/components/PermissionGuard'

// 动态导入页面组件
const AstrologyPage = dynamic(() => import('@/app/astrology/page'), {
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <Spin size="large" />
    </div>
  )
})

const PersonalityPage = dynamic(() => import('@/app/personality/page'), {
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <Spin size="large" />
    </div>
  )
})

const WealthPage = dynamic(() => import('@/app/wealth/page'), {
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <Spin size="large" />
    </div>
  )
})

const MarriagePage = dynamic(() => import('@/app/marriage/page'), {
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <Spin size="large" />
    </div>
  )
})

const HealthPage = dynamic(() => import('@/app/health/page'), {
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <Spin size="large" />
    </div>
  )
})

const AddUserPage = dynamic(() => import('@/components/AddUserPage'), {
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <Spin size="large" />
    </div>
  )
})

const AddUserProfilePage = dynamic(() => import('@/components/AddUserProfilePage'), {
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <Spin size="large" />
    </div>
  )
})

export default function DashboardPage() {
  const [userInfo, setUserInfo] = useState<any>(null)
  const [mainUser, setMainUser] = useState<any>(null)
  const [childUsers, setChildUsers] = useState<any[]>([])
  const [activeUser, setActiveUser] = useState<any>(null)
  const [currentView, setCurrentView] = useState<string>('dashboard') // 'dashboard', 'astrology', 'personality', etc.
  const [userListCollapsed, setUserListCollapsed] = useState<boolean>(true) // 用户列表折叠状态
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

  useEffect(() => {
    // 检查登录状态并获取用户信息
    const loginData = localStorage.getItem('loginData')
    if (!loginData) {
      // 如果没有登录信息，跳转到登录页面
      router.push('/login')
      return
    }

    // 检查是否有待生成的报告
    const pendingReportsData = sessionStorage.getItem('pending_reports_data')
    if (pendingReportsData) {
      try {
        const { userInfo, userId, isUserProfileId } = JSON.parse(pendingReportsData)
        console.log('🚀 检测到待生成报告，启动异步生成...', { userId, isUserProfileId })
        
        // 启动其他报告的异步生成
        const reportPromises = [
          // 身体健康报告
          fetch('/api/health-report/generate-async', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userInfo, userId, isUserProfileId })
          }).then(response => response.json()).then(result => {
            if (result.success) {
              console.log('✅ 身体健康报告异步生成已启动:', result.taskId)
            } else {
              console.error('❌ 身体健康报告异步生成启动失败:', result.error)
            }
            return { type: 'health', success: result.success }
          }).catch(error => {
            console.error('❌ 身体健康报告异步生成失败:', error)
            return { type: 'health', success: false }
          }),

          // 事业财富报告
          fetch('/api/wealth-report/generate-async', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userInfo, userId, isUserProfileId })
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
          }),

          // 婚恋感情报告
          fetch('/api/marriage-report/generate-async', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userInfo, userId, isUserProfileId })
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
          })
        ]

        // 等待所有异步生成任务启动
        Promise.allSettled(reportPromises).then(results => {
          const successful = results.filter(result => 
            result.status === 'fulfilled' && result.value.success
          ).length
          
          console.log(`✅ 成功启动了 ${successful}/${results.length} 个后台报告生成任务`)
          
          if (successful > 0) {
            message.success(`已启动 ${successful} 个报告的后台生成，请稍后查看`)
          }
        })

        // 清理sessionStorage中的数据
        sessionStorage.removeItem('pending_reports_data')
        
      } catch (error) {
        console.error('❌ 启动后台报告生成失败:', error)
        sessionStorage.removeItem('pending_reports_data')
      }
    }

    try {
      const parsed = JSON.parse(loginData)
      console.log('🔍 Dashboard检查登录数据:', parsed)

      // 检查登录数据中是否包含完整的用户资料
      if (parsed.user?.profile_data) {
        console.log('✅ 发现登录时已有的用户资料:', parsed.user.profile_data)
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
          console.log('✅ 发现localStorage中的用户资料:', JSON.parse(userData))
          setUserInfo(JSON.parse(userData))
        } else {
          // 如果既没有登录时的资料，也没有手动填写的资料，跳转到profile页面
          console.log('❌ 未找到用户资料，跳转到profile页面')
          router.push('/profile')
          return
        }
      }
    } catch (error) {
      console.error('解析登录数据失败:', error)
      router.push('/login')
      return
    }
    
    // 加载用户层级结构
    loadUserHierarchy()
    
    // 监听页面焦点，当从其他页面返回时重新加载用户列表
    const handleFocus = () => {
      loadUserHierarchy()
    }
    
    window.addEventListener('focus', handleFocus)
    
    // 定期刷新用户列表（每30秒）
    const interval = setInterval(loadUserHierarchy, 30000)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      clearInterval(interval)
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
          
          // 找到所有子账号（parent_id 为主账号的 id）并按创建时间升序排列
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
        }
      }
    } catch (error) {
      console.error('加载用户层级结构失败:', error)
    }
  }

  // 辅助函数：设置activeUser并确保生成OAuth token
  const setActiveUserWithToken = async (user: any, showMessage: boolean = false) => {
    setActiveUser(user)
    localStorage.setItem('activeUser', JSON.stringify(user))
    
    if (showMessage) {
      message.success(`已切换到：${user.name}`)
    }
    
    // 为设置的用户确保生成OAuth token
    try {
      console.log('🔑 为用户检查并生成OAuth Token:', user.id)
      
      // 动态导入ensureUserCozeToken函数
      const { ensureUserCozeToken } = await import('@/lib/coze-auth')
      const tokenResult = await ensureUserCozeToken(user.id)
      
      if (tokenResult.success) {
        console.log('✅ 用户OAuth Token准备完成:', tokenResult.message)
      } else {
        console.warn('⚠️ 用户OAuth Token生成失败:', tokenResult.message)
        // 不阻止操作，只记录警告
      }
    } catch (tokenError) {
      console.error('❌ 生成用户OAuth Token失败:', tokenError)
      // 不阻止操作，只记录错误
    }
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
    
    // 主账户不是当前用户时，排在第一个
    if (mainUser && activeUser?.id !== mainUser.id) {
      displayList.push(mainUser)
    }
    
    // 添加不是当前用户的子账户，按创建时间升序排列
    const availableChildUsers = childUsers.filter(user => user.id !== activeUser?.id)
    displayList.push(...availableChildUsers)
    
    return displayList
  }

  // 显示所有报告模块，不进行权限过滤
  const reportModules = [
    {
      id: 'astrology',
      title: '八字排盘',
      icon: '☯️',
      subtitle: '解读您的生辰八字，揭示命运轨迹',
      status: '推荐',
      requiresPermission: null, // 基础功能，无需权限
      isBasic: true // 标记为基础功能
    },
    {
      id: 'personality',
      title: '性格内观',
      icon: '🧠',
      subtitle: '深入灵魂深处，发现真实的自己',
      status: '已完成',
      requiresPermission: null, // 基础功能，无需权限
      isBasic: true // 标记为基础功能
    },
    {
      id: 'wealth',
      title: '事业财富',
      icon: '💰',
      subtitle: '洞察事业走向，把握财富机遇',
      status: null,
      requiresPermission: 'wealth',
      isPremium: true,
    },
    {
      id: 'marriage',
      title: '婚恋感情',
      icon: '💕',
      subtitle: '探寻情感密码，指引爱情方向',
      status: null,
      requiresPermission: 'marriage',
      isPremium: true,
    },
    {
      id: 'health',
      title: '身体健康',
      icon: '🏥',
      subtitle: '感知身心状态，守护健康之源',
      status: null,
      requiresPermission: 'health',
      isPremium: true,
    },
    {
      id: 'fortune',
      title: '2025年运',
      icon: '🔮',
      subtitle: '预见蛇年运势，掌控人生航向',
      status: null,
      requiresPermission: 'consultation',
      isPremium: true,
    }
  ]
  
  // 计算有权限的模块数量
  const accessibleModulesCount = reportModules.filter(module => canAccessModule(module.requiresPermission)).length

  const handleReportClick = (reportId: string, reportTitle: string) => {
    // 根据不同的报告类型切换右侧内容
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
        message.info('功能开发中...')
        break
      default:
        message.info(`即将为您生成${reportTitle}...`)
    }
  }

  const handleConsultation = () => {
    setCurrentView('consultation')
  }

  // 渲染主内容区域
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
        return <WealthPage />
      case 'marriage':
        return <MarriagePage />
      case 'health':
        return <HealthPage />
      case 'add-user':
        return <AddUserPage onSuccess={() => {
          // 验证成功后切换到profile视图
          setCurrentView('add-user-profile')
        }} />
      case 'add-user-profile':
        return <AddUserProfilePage 
          onSuccess={async (newUser) => {
            // 保存成功后切换到新用户并返回dashboard，同时生成token
            await setActiveUserWithToken(newUser, true)
            
            // 刷新用户列表
            loadUserHierarchy()
            
            // 返回dashboard主页
            setCurrentView('dashboard')
            
            // 触发自定义事件，通知其他页面用户已切换
            window.dispatchEvent(new Event('userSwitched'))
          }}
          onCancel={() => {
            // 取消时返回添加用户页面
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

            {/* 客服二维码区域 */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                              <h2 className="text-xl font-semibold text-gray-900 text-center mb-6">联系客服</h2>
              <div className="flex justify-center items-center gap-12">
                {/* 第一个客服二维码 */}
                <div className="text-center">
                  <div className="w-32 h-32 bg-gray-100 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                    <img
                      src="/images/consultation-qr-1.jpg"
                      alt="客服微信二维码1"
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
                  <p className="text-sm font-medium text-gray-700">客服1</p>
                </div>

                {/* 第二个客服二维码 */}
                <div className="text-center">
                  <div className="w-32 h-32 bg-gray-100 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                    <img
                      src="/images/consultation-qr-2.jpg"
                      alt="客服微信二维码2"
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
                  <p className="text-sm font-medium text-gray-700">客服2</p>
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
                    天乙神算（Dao fate）于2025年夏季正式上线，是一家以东方术数体系为根基、人工智能技术为引擎的创新型企业。公司秉承&ldquo;融合古今智慧，赋能精准决策&rdquo;的使命，致力于通过大语言模型（LLM）与玄学理法的深度融合，推动东方术数在全球范围的科学化传播与场景化落地。
                  </p>
                  <p className="text-base">
                    公司以「专业理法体系」为核心竞争力，以十万级真实案例库 与10年行业经验为根基，将八字命理等传统术数模型转化为可计算的AI算法。通过自研的玄学大语言模型（Metaphysical LLM），实现命理推演的标准化、交互化与可视化，突破传统术数的学习壁垒与应用局限。
                  </p>
                  <p className="text-base">
                    创始人寻一，早年任职上市公司负责资本运作，因特殊奇遇而进入玄学领域，又历经十年名师遍访、八年全职从业，深感术数高阶理论的认知壁垒。创立天乙神算的初心，是借力AI破解&lsquo;传统玄学曲高和寡&rsquo;之困，让造物之奇与术数之精，成为可被普罗大众理解的生活智慧。
                  </p>
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
              <div className="text-center py-4 md:py-6 px-4 md:px-8">
                <div className="max-w-4xl mx-auto">
                  <div className="flex justify-center items-center space-x-3 mb-3">
                    <h2 className="text-lg md:text-2xl font-medium text-gray-700">
                      欢迎回来，{activeUser?.name || '用户'}
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
                      {!isAdmin && !isVip && `您当前有 ${accessibleModulesCount} 个可用功能，共 ${reportModules.length} 个功能`}
                    </div>
                  )} */}

                  {/* 哲学文案 */}
                  <h1 className="text-2xl md:text-4xl font-semibold text-gray-900 leading-relaxed tracking-wider">
                    人立于命 命行运中 命由心敕 运掌中天 心御乾坤
                  </h1>
                </div>
              </div>
            </div>

            {/* 报告模块 - 3×2布局 */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-6">
              {reportModules.map((module) => {
                const hasGeneratePermission = canGenerate(module.requiresPermission)
                const hasViewPermission = canView(module.requiresPermission)
                const hasChatPermission = canChat(module.requiresPermission)
                const isPremiumModule = module.isPremium
                const isBasicModule = module.isBasic
                // 基础功能始终有权限，其他功能需要权限检查
                const hasAccess = isBasicModule || hasViewPermission || hasGeneratePermission || hasChatPermission
                
                return (
                  <Card
                    key={module.id}
                    className={`transition-all duration-300 border-gray-200 bg-white relative ${
                      hasAccess 
                        ? 'hover:shadow-lg hover:scale-[1.02] cursor-pointer hover:border-gray-300'
                        : 'opacity-70 cursor-pointer hover:shadow-md border-gray-100'
                    }`}
                    bodyStyle={{ padding: '24px 16px' }}
                    onClick={() => {
                      if (hasAccess) {
                        handleReportClick(module.id, module.title)
                      } else {
                        // 为无权限用户提供更友好的提示
                        if (isPremiumModule) {
                          message.info(`${module.title}是VIP专享功能，升级VIP后即可使用`)
                        } else {
                          message.info(`您当前没有${module.title}功能的使用权限`)
                        }
                      }
                    }}
                  >
                    {/* 状态标签 */}
                    <div className="absolute top-3 right-3 flex flex-col gap-1">
                      {module.status && (
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          module.status === '推荐' ? 'bg-blue-100 text-blue-600' :
                          module.status === '已完成' ? 'bg-green-100 text-green-600' :
                          module.status === '新功能' ? 'bg-orange-100 text-orange-600' : ''
                        }`}>
                          {module.status}
                        </div>
                      )}
                      
                      {/* 权限标签 */}
                      {!hasAccess && (
                        <Tooltip title={isPremiumModule ? "VIP专享功能" : "您没有权限访问此功能"}>
                          <Tag color={isPremiumModule ? "gold" : "red"}>
                            {isPremiumModule ? (
                              <CrownOutlined style={{ fontSize: '10px' }} />
                            ) : (
                              <LockOutlined style={{ fontSize: '10px' }} />
                            )}
                          </Tag>
                        </Tooltip>
                      )}
                      
                      {isPremiumModule && hasAccess && (
                        <Tooltip title="VIP功能">
                          <Tag color="gold">
                            <CrownOutlined style={{ fontSize: '10px' }} />
                          </Tag>
                        </Tooltip>
                      )}
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-2 mb-3">
                        <span className={`text-xl ${hasAccess ? '' : 'grayscale'}`}>{module.icon}</span>
                        <h3 className={`font-medium text-lg ${hasAccess ? 'text-gray-900' : 'text-gray-600'}`}>
                          {module.title}
                        </h3>
                      </div>
                      <p className={`text-sm leading-relaxed italic ${hasAccess ? 'text-gray-500' : 'text-gray-500'}`}>
                        {module.subtitle}
                      </p>
                      
                      {/* 权限说明 - 只在无权限时显示 */}
                      {!hasAccess && (
                        <div className="mt-3 flex justify-center">
                          <Tag color={isPremiumModule ? "gold" : "default"}>
                            {isPremiumModule ? "需要权限": "需要权限"}
                          </Tag>
                        </div>
                      )}
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
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">乙</span>
            </div>
            <div className="text-sm font-bold text-gray-900">
              <div>天乙神算</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-xs">{activeUser?.name ? activeUser.name.charAt(0) : '用'}</span>
            </div>
            <span className="text-sm text-gray-700">{activeUser?.name || '用户'}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* 左侧导航栏 */}
        <div className="w-48 bg-white shadow-sm border-r border-gray-200 flex flex-col hidden md:flex h-full overflow-hidden">
        {/* Logo区域 */}
        <div className="p-4 border-b border-gray-100 text-center flex-shrink-0">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-2xl">乙</span>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-800">天乙</div>
              <div className="text-lg font-bold text-gray-800">神算</div>
            </div>
          </div>
        </div>

        {/* 用户信息 */}
        <div className="p-3 border-b border-gray-100 flex-shrink-0 max-h-64 overflow-y-auto">
          {/* 当前激活用户 */}
          {activeUser && (
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xs">{activeUser.name ? activeUser.name.charAt(0) : '用'}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <div className="text-sm font-medium text-gray-900">{activeUser.name}</div>
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
            <>
              <Divider className="my-2" />
              <div className="mb-3">
                {/* 折叠面板头部 */}
                <div
                  className="flex items-center justify-between text-xs p-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50"
                  onClick={() => setUserListCollapsed(!userListCollapsed)}
                >
                  <span className="text-gray-600">
                    其他用户 ({getUserDisplayList().length})
                  </span>
                  {userListCollapsed ? (
                    <RightOutlined className="text-gray-400" />
                  ) : (
                    <DownOutlined className="text-gray-400" />
                  )}
                </div>
                
                {/* 折叠面板内容 */}
                {!userListCollapsed && (
                  <div className="space-y-1 mt-2 ml-2 max-h-40 overflow-y-auto">
                    {getUserDisplayList().map((user: any, index: number) => {
                      const isMainUser = user.parent_id === null
                      const isActive = activeUser?.id === user.id
                      
                      return (
                        <div 
                          key={user.id} 
                          className="flex items-center text-xs p-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50"
                          onClick={() => handleUserSwitch(user)}
                        >
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                              isMainUser 
                                ? 'bg-green-100 text-green-600' 
                                : 'bg-orange-100 text-orange-600'
                            }`}>
                              {isMainUser ? '主' : '子'}
                            </span>
                            <span className="truncate text-gray-600">
                              {user.name}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}
          
          {/* 新增用户按钮 - 需要管理员权限或VIP权限 */}
          <PermissionGuard
            module="admin"
            action="users"
            fallback={
              <Tooltip title="VIP权限可添加新用户">
                <div className="flex items-center text-xs p-2 rounded-lg opacity-50 cursor-not-allowed text-gray-400 border border-dashed border-gray-200">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <span className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 bg-gray-100 text-gray-400">
                      <LockOutlined />
                    </span>
                    <span className="truncate">
                      新增用户（VIP权限）
                    </span>
                  </div>
                </div>
              </Tooltip>
            }
          >
            <div
              className="flex items-center text-xs p-2 rounded-lg cursor-pointer transition-colors text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-dashed border-blue-300 hover:border-blue-400"
              onClick={() => setCurrentView('add-user')}
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <span className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 bg-blue-100 text-blue-600">
                  <PlusOutlined />
                </span>
                <span className="truncate">
                  新增用户
                </span>
              </div>
            </div>
          </PermissionGuard>
        </div>

        {/* 导航菜单 */}
        <div className="flex-1 p-3 overflow-y-auto min-h-0">
          <div className="space-y-3">
            <div
              className={`px-4 py-4 rounded-lg text-center shadow-sm cursor-pointer transition-all duration-300 ${
                currentView === 'dashboard'
                  ? 'bg-white text-gray-900 border border-gray-300'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
              }`}
              onClick={() => setCurrentView('dashboard')}
            >
              <span className="text-lg font-medium tracking-wide">命书</span>
            </div>
            
            {/* VIP功能：召灵 */}
            <PermissionGuard
              requireVip
              fallback={
                <Tooltip title="VIP功能，敬请期待">
                  <div className="px-4 py-4 rounded-lg text-center opacity-50 cursor-not-allowed">
                    <span className="text-lg font-medium tracking-wide text-gray-400">召灵</span>
                    <div className="text-xs text-gray-400 mt-1">VIP功能</div>
                  </div>
                </Tooltip>
              }
            >
              <div
                className="px-4 py-4 rounded-lg cursor-pointer transition-all duration-300 text-center text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm"
                onClick={() => message.info('功能开发中，敬请期待...')}
              >
                <span className="text-lg font-medium tracking-wide">召灵</span>
                {/* <CrownOutlined className="ml-2 text-yellow-500" /> */}
              </div>
            </PermissionGuard>
            
            {/* VIP功能：疗愈 */}
            <PermissionGuard
              requireVip
              fallback={
                <Tooltip title="VIP功能，敬请期待">
                  <div className="px-4 py-4 rounded-lg text-center opacity-50 cursor-not-allowed">
                    <span className="text-lg font-medium tracking-wide text-gray-400">疗愈</span>
                    <div className="text-xs text-gray-400 mt-1">VIP功能</div>
                  </div>
                </Tooltip>
              }
            >
              <div
                className="px-4 py-4 rounded-lg cursor-pointer transition-all duration-300 text-center text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm"
                onClick={() => message.info('功能开发中，敬请期待...')}
              >
                <span className="text-lg font-medium tracking-wide">疗愈</span>
                {/* <CrownOutlined className="ml-2 text-yellow-500" /> */}
              </div>
            </PermissionGuard>
            
            {/* VIP功能：宝阁 */}
            <PermissionGuard
              requireVip
              fallback={
                <Tooltip title="VIP功能，敬请期待">
                  <div className="px-4 py-4 rounded-lg text-center opacity-50 cursor-not-allowed">
                    <span className="text-lg font-medium tracking-wide text-gray-400">宝阁</span>
                    <div className="text-xs text-gray-400 mt-1">VIP功能</div>
                  </div>
                </Tooltip>
              }
            >
              <div
                className="px-4 py-4 rounded-lg cursor-pointer transition-all duration-300 text-center text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm"
                onClick={() => message.info('功能开发中，敬请期待...')}
              >
                <span className="text-lg font-medium tracking-wide">宝阁</span>
                {/* <CrownOutlined className="ml-2 text-yellow-500" /> */}
              </div>
            </PermissionGuard>
          </div>
        </div>

        {/* 底部问道1v1按钮 */}
        <div className="p-3 border-t border-gray-100 flex-shrink-0">
          <Button
            type="primary"
            block
            size="large"
            onClick={handleConsultation}
            className={`border-none shadow-lg hover:shadow-xl transition-all duration-300 ${
              currentView === 'consultation' 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-black hover:bg-gray-800'
            }`}
          >
            <span className="font-medium tracking-wide text-white">问道1v1</span>
          </Button>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 p-3 md:p-6 overflow-y-auto h-full min-h-0">
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
        <Button
          type="primary"
          block
          size="large"
          onClick={handleConsultation}
          className={`border-none shadow-lg ${
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
  )
} 