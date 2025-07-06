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
      icon: '☯',
      color: '#374151',
      bgColor: 'from-gray-50 to-gray-100'
    },
    {
      id: 'personality',
      title: '性格内观',
      icon: '◐',
      color: '#1F2937',
      bgColor: 'from-gray-100 to-gray-150'
    },
    {
      id: 'wealth',
      title: '事业财富',
      icon: '◉',
      color: '#111827',
      bgColor: 'from-gray-50 to-gray-100'
    },
    {
      id: 'marriage',
      title: '婚恋感情',
      icon: '◎',
      color: '#374151',
      bgColor: 'from-gray-100 to-gray-150'
    },
    {
      id: 'health',
      title: '身体健康',
      icon: '○',
      color: '#1F2937',
      bgColor: 'from-gray-50 to-gray-100'
    },
    {
      id: 'fortune',
      title: '2025年运',
      icon: '●',
      color: '#111827',
      bgColor: 'from-gray-100 to-gray-150'
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
          <div className="space-y-3">
            <div className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900 rounded-xl border border-gray-300">
              <span className="text-lg">◉</span>
              <span className="text-sm font-medium tracking-wide">命书</span>
            </div>
            <div className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900 rounded-xl cursor-pointer transition-all duration-300">
              <span className="text-lg">◐</span>
              <span className="text-sm font-medium tracking-wide">召灵</span>
            </div>
            <div className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900 rounded-xl cursor-pointer transition-all duration-300">
              <span className="text-lg">○</span>
              <span className="text-sm font-medium tracking-wide">疗愈</span>
            </div>
            <div className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900 rounded-xl cursor-pointer transition-all duration-300">
              <span className="text-lg">◎</span>
              <span className="text-sm font-medium tracking-wide">宝阁</span>
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
            className="bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black border-none shadow-lg hover:shadow-xl transition-all duration-300"
            icon={<span className="text-base">●</span>}
          >
            <span className="font-medium tracking-wide text-white">问道1v1</span>
          </Button>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 p-4 md:p-8 pb-20 md:pb-8">
        <div className="max-w-6xl mx-auto">
          {/* 哲学文案区域 */}
          <div className="mb-12">
            <div className="relative">
              {/* 背景纹理 */}
              <div className="absolute inset-0 opacity-3">
                <div className="w-full h-full" style={{
                  backgroundImage: `radial-gradient(circle at 25% 25%, #374151 2px, transparent 2px),
                                   radial-gradient(circle at 75% 75%, #1F2937 1px, transparent 1px)`,
                  backgroundSize: '60px 60px, 40px 40px'
                }}></div>
              </div>

              {/* 主要内容 */}
              <div className="relative text-center py-12 px-8">
                <div className="max-w-4xl mx-auto">
                  {/* 装饰线 */}
                  <div className="flex items-center justify-center mb-8">
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent w-24"></div>
                    <div className="mx-4 w-2 h-2 bg-gray-600 rounded-full"></div>
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent w-24"></div>
                  </div>

                  {/* 哲学文案 */}
                  <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 leading-relaxed tracking-wider">
                    人立于命 命行运中 命由心敕 运掌中天 心御乾坤
                  </h1>

                  {/* 装饰线 */}
                  <div className="flex items-center justify-center mt-8">
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent w-24"></div>
                    <div className="mx-4 w-2 h-2 bg-gray-600 rounded-full"></div>
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent w-24"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 6个报告模块 - 3×2布局 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
            {reportModules.map((module) => (
              <Card
                key={module.id}
                className="hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer border-gray-200 hover:border-gray-300"
                bodyStyle={{ padding: '32px 20px' }}
                onClick={() => handleReportClick(module.id, module.title)}
              >
                <div className="text-center">
                  <div className={`w-20 h-20 mx-auto mb-5 rounded-3xl bg-gradient-to-br ${module.bgColor} flex items-center justify-center shadow-lg`}>
                    <span className="text-3xl">{module.icon}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-base mb-1">{module.title}</h3>
                  <div className="w-8 h-1 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full mx-auto opacity-60"></div>
                </div>
              </Card>
            ))}
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
          className="bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black border-none shadow-lg"
          icon={<span className="text-base">●</span>}
        >
          <span className="font-medium tracking-wide text-white">问道1v1</span>
        </Button>
      </div>
    </div>
    </div>
  )
} 