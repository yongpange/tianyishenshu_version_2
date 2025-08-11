'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import Image from 'next/image'
import Breadcrumb, { BREADCRUMB_CONFIGS } from '@/components/Breadcrumb'

export default function ConsultationPage() {
  const router = useRouter()
  const [userInfo, setUserInfo] = useState<any>(null)

  useEffect(() => {
    // 从localStorage获取用户信息
    const userData = localStorage.getItem('userData')
    if (userData) {
      setUserInfo(JSON.parse(userData))
    }
  }, [])

  const handleBack = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 移动端顶部导航栏 */}
      <div className="md:hidden bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
              className="p-0"
            />
            <div className="text-sm font-bold text-gray-900">
              <div>天乙</div>
              <div>神算</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-xs">{userInfo?.nickname ? userInfo.nickname.charAt(0) : '用'}</span>
            </div>
            <span className="text-sm text-gray-700">{userInfo?.nickname || '用户'}</span>
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
              </div>
            </div>
          </div>

          {/* 用户信息 */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xs">{userInfo?.nickname ? userInfo.nickname.charAt(0) : '用'}</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">{userInfo?.nickname || '用户'}</div>
                <div className="text-xs text-gray-500">您的专属命理师</div>
              </div>
            </div>
          </div>

          {/* 导航菜单 */}
          <div className="flex-1 p-4">
            <div className="space-y-6">
              <div 
                className="px-4 py-4 text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm rounded-lg cursor-pointer transition-all duration-300 text-center"
                onClick={() => router.push('/dashboard')}
              >
                <span className="text-lg font-medium tracking-wide">命书</span>
              </div>
              <div 
                className="px-4 py-4 text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm rounded-lg cursor-pointer transition-all duration-300 text-center"
                onClick={() => router.push('/astrology')}
              >
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

          {/* 底部问道1v1按钮 - 当前页面高亮 */}
          <div className="p-4 border-t border-gray-100">
            <Button
              type="primary"
              block
              size="large"
              className="bg-black hover:bg-gray-800 border-none shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <span className="font-medium tracking-wide text-white">问道1v1</span>
            </Button>
          </div>
        </div>

        {/* 主内容区域 */}
        <div className="flex-1 p-4 md:p-8">
          {/* PC端面包屑导航 */}
          <div className="hidden md:block mb-6">
            <Breadcrumb items={BREADCRUMB_CONFIGS.consultation} />
          </div>

          <div className="flex items-center justify-center">
            <div className="max-w-2xl w-full">
              {/* 白色卡片容器 */}
              <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
              {/* 标题 */}
              <div className="text-center mb-12">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-wider">
                  问道小栈
                </h1>
              </div>

              {/* 二维码区域 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                {/* 正哲师姐 */}
                <div className="text-center">
                  <div className="mb-6">
                    <div className="w-60 h-60 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                      <Image
                        src="/qr-codes/zhengzhe.png"
                        alt="丁火师姐微信二维码"
                        width={240}
                        height={240}
                        className="rounded-lg"
                      />
                    </div>
                  </div>
                  <h3 className="text-xl font-medium text-gray-800">
                    丁火师姐
                  </h3>
                </div>

                {/* 丁火师妹 */}
                <div className="text-center">
                  <div className="mb-6">
                    <div className="w-60 h-60 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                      <Image
                        src="/qr-codes/dinghuo.png"
                        alt="芷暄师妹微信二维码"
                        width={240}
                        height={240}
                        className="rounded-lg"
                      />
                    </div>
                  </div>
                  <h3 className="text-xl font-medium text-gray-800">
                    芷暄师妹
                  </h3>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 移动端底部返回按钮 */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
        <Button
          block
          size="large"
          onClick={handleBack}
          className="border-gray-300 text-gray-700 hover:border-gray-400 hover:text-gray-800"
        >
          返回
        </Button>
      </div>
    </div>
  )
}
