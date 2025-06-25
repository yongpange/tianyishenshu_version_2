'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Avatar, Button, message } from 'antd'
import { 
  UserOutlined,
  BarChartOutlined,
  WechatOutlined,
  UsergroupAddOutlined,
  SettingOutlined,
  MessageOutlined
} from '@ant-design/icons'

export default function DashboardPage() {
  const [userInfo, setUserInfo] = useState<any>(null)
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
  }, [router])

  const reportModules = [
    {
      id: 'astrology',
      title: '排盘分析',
      icon: '🎯',
      color: '#4F46E5',
      bgColor: 'from-blue-50 to-indigo-50'
    },
    {
      id: 'personality', 
      title: '性格报告',
      icon: '👤',
      color: '#059669',
      bgColor: 'from-green-50 to-emerald-50'
    },
    {
      id: 'wealth',
      title: '财富报告', 
      icon: '💰',
      color: '#D97706',
      bgColor: 'from-yellow-50 to-orange-50'
    },
    {
      id: 'career',
      title: '事业报告',
      icon: '💼',
      color: '#7C3AED',
      bgColor: 'from-purple-50 to-violet-50'
    },
    {
      id: 'marriage',
      title: '婚恋报告',
      icon: '❤️',
      color: '#DC2626',
      bgColor: 'from-red-50 to-pink-50'
    },
    {
      id: 'health',
      title: '健康报告',
      icon: '🏥',
      color: '#0891B2',
      bgColor: 'from-cyan-50 to-blue-50'
    },
    {
      id: 'fortune',
      title: '运势报告',
      icon: '⭐',
      color: '#CA8A04',
      bgColor: 'from-amber-50 to-yellow-50'
    },
    {
      id: 'social',
      title: '旺运商城',
      icon: '🛍️',
      color: '#9333EA',
      bgColor: 'from-violet-50 to-purple-50'
    }
  ]

  const handleReportClick = (reportId: string, reportTitle: string) => {
    // 根据不同的报告类型跳转到对应页面
    switch (reportId) {
      case 'personality':
        router.push('/personality')
        break
      default:
        message.info(`即将为您生成${reportTitle}...`)
        // 这里后续可以集成Coze API调用
    }
  }

  const handleConsultation = () => {
    message.info('1对1咨询功能开发中...')
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
    <div className="min-h-screen bg-gray-50">
      {/* 移动端顶部导航栏 */}
      <div className="md:hidden bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">天</span>
            </div>
            <span className="font-bold text-gray-900">天乙神数</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-xs">小</span>
            </div>
            <span className="text-sm text-gray-700">{userInfo.nickname || '用户'}</span>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* 左侧导航栏 */}
        <div className="w-48 bg-white shadow-sm border-r border-gray-200 flex flex-col hidden md:flex">
        {/* Logo区域 */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">天</span>
            </div>
            <span className="font-bold text-gray-900">天乙神数</span>
          </div>
        </div>

        {/* 用户信息 */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-xs">小</span>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">欢迎，</div>
              <div className="text-xs text-gray-500">{userInfo.nickname || '用户'}</div>
            </div>
          </div>
        </div>

        {/* 导航菜单 */}
        <div className="flex-1 p-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-3 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg">
              <BarChartOutlined />
              <span className="text-sm font-medium">天乙神数</span>
            </div>
            <div className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer">
              <BarChartOutlined />
              <span className="text-sm">排盘分析</span>
            </div>
            <div className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer">
              <WechatOutlined />
              <span className="text-sm">旺运商城</span>
            </div>
            <div className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer">
              <UsergroupAddOutlined />
              <span className="text-sm">我的</span>
            </div>
          </div>
        </div>

        {/* 底部1对1咨询按钮 */}
        <div className="p-4 border-t border-gray-100">
          <Button 
            type="primary" 
            block 
            size="large"
            onClick={handleConsultation}
            className="bg-blue-500 hover:bg-blue-600 border-none"
            icon={<MessageOutlined />}
          >
            1对1咨询
          </Button>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 p-4 md:p-8 pb-20 md:pb-8">
        <div className="max-w-6xl mx-auto">
          {/* 页面标题 */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">天乙神数 命理报告</h1>
            <p className="text-gray-600">
              在天乙神数报告后可以查看你命理报告的各个报告，如性格报告、财富报告等。此外，您还可以针对不同类型进行
              询问，查至你所朝日为止，如果AI问答无法完全解决你的问题，欢迎联系明师进行1对1深度咨询。
            </p>
          </div>

          {/* 报告选择标题 */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">你想查阅和了解的报告是什么？</h2>
          </div>

          {/* 8个报告模块 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
            {reportModules.map((module) => (
              <Card
                key={module.id}
                className="hover:shadow-lg transition-all duration-300 cursor-pointer border-gray-200"
                bodyStyle={{ padding: '24px 16px' }}
                onClick={() => handleReportClick(module.id, module.title)}
              >
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${module.bgColor} flex items-center justify-center`}>
                    <span className="text-2xl">{module.icon}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">{module.title}</h3>
                </div>
              </Card>
            ))}
          </div>

          {/* 免责声明 */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
            <p className="text-yellow-800 text-sm">
              <span className="font-medium">免责声明：</span>
              以上命理结果仅供娱乐，对于报告中产生的任何问题，只代表本人观点，不具法律效力等。
            </p>
          </div>
        </div>
      </div>

      {/* 移动端底部1对1咨询按钮 */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
        <Button 
          type="primary" 
          block 
          size="large"
          onClick={handleConsultation}
          className="bg-blue-500 hover:bg-blue-600 border-none"
          icon={<MessageOutlined />}
        >
          1对1咨询
        </Button>
      </div>
    </div>
    </div>
  )
} 