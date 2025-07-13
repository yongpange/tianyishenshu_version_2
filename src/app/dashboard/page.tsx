'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Avatar, Button, message, Divider, Spin, Collapse } from 'antd'
import {
  UserOutlined,
  WechatOutlined,
  UsergroupAddOutlined,
  SettingOutlined,
  MessageOutlined,
  PlusOutlined,
  DownOutlined,
  RightOutlined
} from '@ant-design/icons'
import dynamic from 'next/dynamic'

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

  useEffect(() => {
    // 从localStorage获取用户信息
    const userData = localStorage.getItem('userData')
    if (userData) {
      setUserInfo(JSON.parse(userData))
    } else {
      // 如果没有用户信息，跳转到信息填写页面
      router.push('/profile')
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
                setActiveUser(parsedActiveUser)
              } else if (mainProfile) {
                // 如果保存的用户不在列表中，使用主账户
                setActiveUser(mainProfile)
                localStorage.setItem('activeUser', JSON.stringify(mainProfile))
              }
            } catch (error) {
              // 如果解析失败，使用主账户
              if (mainProfile) {
                setActiveUser(mainProfile)
                localStorage.setItem('activeUser', JSON.stringify(mainProfile))
              }
            }
          } else if (mainProfile) {
            // 如果没有保存的用户，使用主账户
            setActiveUser(mainProfile)
            localStorage.setItem('activeUser', JSON.stringify(mainProfile))
          }
        }
      }
    } catch (error) {
      console.error('加载用户层级结构失败:', error)
    }
  }

  // 处理用户切换
  const handleUserSwitch = (user: any) => {
    setActiveUser(user)
    localStorage.setItem('activeUser', JSON.stringify(user))
    message.success(`已切换到：${user.name}`)
    
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

  const reportModules = [
    {
      id: 'astrology',
      title: '八字排盘',
      icon: '☯️',
      subtitle: '解读您的生辰八字，揭示命运轨迹',
      status: '推荐'
    },
    {
      id: 'personality',
      title: '性格内观',
      icon: '🧠',
      subtitle: '深入灵魂深处，发现真实的自己',
      status: '已完成'
    },
    {
      id: 'wealth',
      title: '事业财富',
      icon: '💰',
      subtitle: '洞察事业走向，把握财富机遇',
      status: null
    },
    {
      id: 'marriage',
      title: '婚恋感情',
      icon: '💕',
      subtitle: '探寻情感密码，指引爱情方向',
      status: null
    },
    {
      id: 'health',
      title: '身体健康',
      icon: '🏥',
      subtitle: '感知身心状态，守护健康之源',
      status: '新功能'
    },
    {
      id: 'fortune',
      title: '2025年运',
      icon: '🔮',
      subtitle: '预见蛇年运势，掌控人生航向',
      status: null
    }
  ]

  const handleReportClick = (reportId: string, reportTitle: string) => {
    // 根据不同的报告类型切换右侧内容
    switch (reportId) {
      case 'astrology':
        setCurrentView('astrology')
        break
      case 'personality':
        setCurrentView('personality')
        break
      case 'fortune':
        message.info('功能开发中...')
        break
      default:
        message.info(`即将为您生成${reportTitle}...`)
        // 这里后续可以集成Coze API调用
    }
  }

  const handleConsultation = () => {
    setCurrentView('consultation')
  }

  const handleHealing = () => {
    setCurrentView('healing')
  }

  const handleTreasure = () => {
    setCurrentView('treasure')
  }

  // 渲染主内容区域
  const renderMainContent = () => {
    switch (currentView) {
      case 'astrology':
        return <AstrologyPage />
      case 'personality':
        return <PersonalityPage />
      case 'add-user':
        return <AddUserPage onSuccess={() => {
          // 验证成功后切换到profile视图
          setCurrentView('add-user-profile')
        }} />
      case 'add-user-profile':
        return <AddUserProfilePage 
          onSuccess={(newUser) => {
            // 保存成功后切换到新用户并返回dashboard
            setActiveUser(newUser)
            localStorage.setItem('activeUser', JSON.stringify(newUser))
            message.success(`已切换到新用户：${newUser.name}`)
            
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
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageOutlined className="text-white text-2xl" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">问道1v1</h2>
              <p className="text-gray-600 mb-8">一对一专业咨询服务</p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
                <p className="text-yellow-800">功能开发中，敬请期待...</p>
              </div>
            </div>
          </div>
        )
      case 'healing':
        return (
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl">🌿</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">疗愈</h2>
              <p className="text-gray-600 mb-8">心灵疗愈与能量平衡</p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
                <p className="text-yellow-800">功能开发中，敬请期待...</p>
              </div>
            </div>
          </div>
        )
      case 'treasure':
        return (
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl">💎</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">宝阁</h2>
              <p className="text-gray-600 mb-8">精品收藏与能量物品</p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
                <p className="text-yellow-800">功能开发中，敬请期待...</p>
              </div>
            </div>
          </div>
        )
      default:
        return (
          <div className="max-w-6xl mx-auto">
            {/* 欢迎区域 */}
            <div className="mb-8">
              <div className="text-center py-8 px-8">
                <div className="max-w-4xl mx-auto">
                  <h2 className="text-xl md:text-2xl font-medium text-gray-700 mb-8">
                    欢迎回来，{activeUser?.name || '用户'}
                  </h2>

                  {/* 哲学文案 */}
                  <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 leading-relaxed tracking-wider">
                    人立于命 命行运中 命由心敕 运掌中天 心御乾坤
                  </h1>
                </div>
              </div>
            </div>

            {/* 6个报告模块 - 3×2布局 */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-12">
              {reportModules.map((module) => (
                <Card
                  key={module.id}
                  className="hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer border-gray-200 hover:border-gray-300 bg-white relative"
                  bodyStyle={{ padding: '32px 20px' }}
                  onClick={() => handleReportClick(module.id, module.title)}
                >
                  {/* 状态标签 */}
                  {module.status && (
                    <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${
                      module.status === '推荐' ? 'bg-blue-100 text-blue-600' :
                      module.status === '已完成' ? 'bg-green-100 text-green-600' :
                      module.status === '新功能' ? 'bg-orange-100 text-orange-600' : ''
                    }`}>
                      {module.status}
                    </div>
                  )}

                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-3">
                      <span className="text-xl">{module.icon}</span>
                      <h3 className="font-medium text-gray-900 text-lg">{module.title}</h3>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed italic">
                      {module.subtitle}
                    </p>
                  </div>
                </Card>
              ))}
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
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* 移动端顶部导航栏 */}
      <div className="md:hidden bg-white shadow-sm border-b border-gray-200 p-4">
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

      <div className="flex flex-1">
        {/* 左侧导航栏 */}
        <div className="w-48 bg-white shadow-sm border-r border-gray-200 flex flex-col hidden md:flex min-h-full">
        {/* Logo区域 */}
        <div className="p-6 border-b border-gray-100 text-center">
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
        <div className="p-4 border-b border-gray-100">
          {/* 当前激活用户 */}
          {activeUser && (
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xs">{activeUser.name ? activeUser.name.charAt(0) : '用'}</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">{activeUser.name}</div>
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
                  <div className="space-y-1 mt-2 ml-2">
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
          
          {/* 新增用户按钮 */}
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
        </div>

        {/* 导航菜单 */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-6">
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
            <div
              className={`px-4 py-4 rounded-lg cursor-pointer transition-all duration-300 text-center ${
                currentView === 'astrology' 
                  ? 'bg-white text-gray-900 border border-gray-300 shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
              }`}
              onClick={() => setCurrentView('astrology')}
            >
              <span className="text-lg font-medium tracking-wide">召灵</span>
            </div>
            <div
              className={`px-4 py-4 rounded-lg cursor-pointer transition-all duration-300 text-center ${
                currentView === 'personality' 
                  ? 'bg-white text-gray-900 border border-gray-300 shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
              }`}
              onClick={() => setCurrentView('personality')}
            >
              <span className="text-lg font-medium tracking-wide">内观</span>
            </div>
            <div
              className={`px-4 py-4 rounded-lg cursor-pointer transition-all duration-300 text-center ${
                currentView === 'add-user' 
                  ? 'bg-white text-gray-900 border border-gray-300 shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
              }`}
              onClick={() => setCurrentView('add-user')}
            >
              <span className="text-lg font-medium tracking-wide">增用</span>
            </div>
            <div
              className={`px-4 py-4 rounded-lg cursor-pointer transition-all duration-300 text-center ${
                currentView === 'healing' 
                  ? 'bg-white text-gray-900 border border-gray-300 shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
              }`}
              onClick={handleHealing}
            >
              <span className="text-lg font-medium tracking-wide">疗愈</span>
            </div>
            <div
              className={`px-4 py-4 rounded-lg cursor-pointer transition-all duration-300 text-center ${
                currentView === 'treasure' 
                  ? 'bg-white text-gray-900 border border-gray-300 shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
              }`}
              onClick={handleTreasure}
            >
              <span className="text-lg font-medium tracking-wide">宝阁</span>
            </div>
          </div>
        </div>

        {/* 底部问道1v1按钮 */}
        <div className="p-4 border-t border-gray-100">
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
      <div className="flex-1 p-4 md:p-8 pb-20 md:pb-8 min-h-full overflow-y-auto">
        <Suspense fallback={
          <div className="flex items-center justify-center h-96">
            <Spin size="large" />
          </div>
        }>
          {renderMainContent()}
        </Suspense>
      </div>

      {/* 移动端底部问道1v1按钮 */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
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