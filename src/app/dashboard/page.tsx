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
    // 根据不同的报告类型跳转到对应页面
    switch (reportId) {
      case 'personality':
        router.push('/personality')
        break
      case 'astrology':
        message.info(`即将为您生成${reportTitle}...`)
        // 这里后续可以集成八字排盘功能
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
    <div className="min-h-screen bg-gray-100">
      {/* 移动端顶部导航栏 */}
      <div className="md:hidden bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">乙</span>
            </div>
            <div className="text-sm font-bold text-gray-900">
              <div>天乙</div>
              <div>神算</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-xs">{userInfo.nickname ? userInfo.nickname.charAt(0) : '用'}</span>
            </div>
            <span className="text-sm text-gray-700">{userInfo.nickname || '用户'}</span>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* 左侧导航栏 */}
        <div className="w-48 bg-white shadow-sm border-r border-gray-200 flex flex-col hidden md:flex">
        {/* Logo区域 */}
        <div className="p-6 border-b border-gray-100 text-center">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-2xl">乙</span>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-800">天乙</div>
              <div className="text-lg font-bold text-gray-800">神算</div>
              <div className="text-xs text-gray-500 mt-2 italic">洞察命运 · 智慧人生</div>
            </div>
          </div>
        </div>

        {/* 用户信息 */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-xs">{userInfo.nickname ? userInfo.nickname.charAt(0) : '用'}</span>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">{userInfo.nickname || '用户'}</div>
              <div className="text-xs text-gray-500">您的专属命理师</div>
            </div>
          </div>
        </div>

        {/* 导航菜单 */}
        <div className="flex-1 p-4">
          <div className="space-y-6">
            <div className="px-4 py-4 bg-white text-gray-900 border border-gray-300 rounded-lg text-center shadow-sm">
              <span className="text-lg font-medium tracking-wide">命书</span>
            </div>
            <div className="px-4 py-4 text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm rounded-lg cursor-pointer transition-all duration-300 text-center">
              <span className="text-lg font-medium tracking-wide">召灵</span>
            </div>
            <div className="px-4 py-4 text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm rounded-lg cursor-pointer transition-all duration-300 text-center">
              <span className="text-lg font-medium tracking-wide">疗愈</span>
            </div>
            <div className="px-4 py-4 text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm rounded-lg cursor-pointer transition-all duration-300 text-center">
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
            className="bg-black hover:bg-gray-800 border-none shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <span className="font-medium tracking-wide text-white">问道1v1</span>
          </Button>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 p-4 md:p-8 pb-20 md:pb-8">
        <div className="max-w-6xl mx-auto">
          {/* 欢迎区域 */}
          <div className="mb-8">
            <div className="text-center py-8 px-8">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-xl md:text-2xl font-medium text-gray-700 mb-2">
                  欢迎回来，{userInfo.nickname || '用户'}
                </h2>
                <p className="text-sm md:text-base text-gray-500 mb-8">
                  您的专属命理空间已为您准备就绪
                </p>

                {/* 装饰线 */}
                <div className="flex items-center justify-center mb-8">
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent w-24"></div>
                  <div className="mx-4 w-2 h-2 bg-gray-600 rounded-full"></div>
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent w-24"></div>
                </div>

                {/* 哲学文案 */}
                <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 leading-relaxed tracking-wider mb-8">
                  人立于命 命行运中 命由心敕 运掌中天 心御乾坤
                </h1>

                {/* 装饰线 */}
                <div className="flex items-center justify-center">
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent w-24"></div>
                  <div className="mx-4 w-2 h-2 bg-gray-600 rounded-full"></div>
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent w-24"></div>
                </div>
              </div>
            </div>
          </div>

          {/* 功能引导 */}
          <div className="mb-8 text-center">
            <p className="text-lg text-gray-600 font-medium">
              选择您想要探索的领域，开启专属的命理之旅
            </p>
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

          {/* 底部激励文案 */}
          <div className="text-center py-8 border-t border-gray-100">
            <div className="max-w-2xl mx-auto">
              <p className="text-lg text-gray-600 leading-relaxed mb-2">
                每一次探索，都是与命运的深度对话
              </p>
              <p className="text-base text-gray-500">
                您的人生答案，就在这里等待发现
              </p>
            </div>
          </div>


        </div>
      </div>

      {/* 移动端底部问道1v1按钮 */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
        <Button
          type="primary"
          block
          size="large"
          onClick={handleConsultation}
          className="bg-black hover:bg-gray-800 border-none shadow-lg"
        >
          <span className="font-medium tracking-wide text-white">问道1v1</span>
        </Button>
      </div>
    </div>
    </div>
  )
} 