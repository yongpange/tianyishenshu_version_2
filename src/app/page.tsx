'use client'

import Link from 'next/link'
import Carousel from '@/components/Carousel'
import TianIcon from '@/components/icons/TianIcon'

export default function HomePage() {
  // 轮播图图片数据 - 展示yy1.jpg
  const carouselImages: string[] = [
    '/images/yy1.jpg'
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <TianIcon width={32} height={32} className="text-black" />
              <span className="text-xl font-bold text-black">天乙神算</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <button className="btn-secondary text-sm px-6 py-2">
                  登录
                </button>
              </Link>
              <Link href="/register">
                <button className="btn-primary text-sm px-6 py-2">
                  注册
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Carousel */}
      <section className="h-screen bg-gray-50 flex flex-col">
        {/* 文字内容区域 */}
        <div className="pt-32 pb-0 px-4 sm:px-6 lg:px-8 flex-shrink-0">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-black mb-6">
              开启与「命运」的深度对话
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-6 max-w-2xl mx-auto">
              召唤AI老法师 开启实时对话
            </p>
            <div className="flex justify-center mb-0">
              <Link href="/login">
                <button className="btn-primary text-lg px-8 py-4 hover:transform hover:scale-105 transition-all duration-300">
                  马上体验
                </button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* 图片区域 - 填充剩余空间 */}
        <div className="flex-1 bg-white px-4 sm:px-6 lg:px-0 pb-2">
          <div className="h-full flex items-start justify-center pt-0">
            <Carousel
              images={carouselImages}
              autoPlay={true}
              autoPlayInterval={5000}
              useFullHeight={true}
              className="shadow-2xl lg:rounded-none lg:shadow-none"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* 品牌信息 */}
            <div className="flex flex-col items-center md:items-start">
              <div className="flex items-center space-x-2 mb-4">
                                   <TianIcon width={32} height={32} className="brightness-0 invert" />
                <span className="text-xl font-bold">天乙神算</span>
              </div>
            </div>

            {/* 联系信息 */}
            <div className="text-center md:text-left">
              <h3 className="text-lg font-semibold mb-4">联系我们</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <p>邮箱：service@klxtech.com</p>
                <p>地址：上海市闵行区申滨路36号丽宝广场</p>
              </div>
            </div>

            {/* 客服微信 */}
            <div className="text-center md:text-right">
              <h3 className="text-lg font-semibold mb-4">客服入口</h3>
              <div className="flex justify-center md:justify-end space-x-4">
                <div className="text-center">
                  <img
                    src="/images/wechat-qr-1.jpg"
                    alt="客服微信1"
                    className="w-20 h-20 mx-auto mb-2 rounded-lg"
                  />
                  <p className="text-xs text-gray-400">客服1</p>
                </div>
                <div className="text-center">
                  <img
                    src="/images/wechat-qr-2.jpg"
                    alt="客服微信2"
                    className="w-20 h-20 mx-auto mb-2 rounded-lg"
                  />
                  <p className="text-xs text-gray-400">客服2</p>
                </div>
              </div>
            </div>
          </div>

          {/* 底部版权信息 */}
          <div className="border-t border-gray-700 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="text-sm text-gray-400 text-center md:text-left">
                <p>© 2025 昆仑墟（上海）网络科技有限公司 版权所有</p>
                <p>沪ICP备2025131650号-1</p>
              </div>
              <div className="flex space-x-4 text-sm">
                <Link href="/privacy-policy" className="text-gray-400 hover:text-white transition-colors">
                  隐私政策
                </Link>
                <Link href="/user-agreement" className="text-gray-400 hover:text-white transition-colors">
                  用户协议
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}