'use client'

import Link from 'next/link'
import TianIcon from '@/components/icons/TianIcon'

export default function AboutPage() {
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
            
            {/* 中间导航菜单 */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/">
                <button className="text-gray-700 hover:text-black transition-colors duration-200 font-medium relative pb-1 hover:border-b-2 hover:border-black">
                  主页
                </button>
              </Link>
              <Link href="/products">
                <button className="text-gray-700 hover:text-black transition-colors duration-200 font-medium relative pb-1 hover:border-b-2 hover:border-black">
                  产品
                </button>
              </Link>
              <Link href="/about">
                <button className="text-black font-semibold relative pb-1 border-b-2 border-black">
                  关于我们
                </button>
              </Link>
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

      {/* 主要内容 */}
      <main className="pt-20 min-h-screen bg-gray-100">
        {/* 内容列表 */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-2">

              {/* 第一行：公司简介 */}
              <Link href="/about/company-intro">
                <div className="flex items-center space-x-8 bg-white rounded-lg m-2 hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                  <div className="flex-shrink-0">
                    <img
                      src="/images/about/company-intro.jpg"
                      alt="公司简介"
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-800 hover:text-black transition-colors duration-200 no-underline hover:underline">
                      公司简介：天乙神算正式上线发布！
                    </h2>
                  </div>
                </div>
              </Link>

              {/* 第二行：使用反馈 */}
              <Link href="/about/user-feedback">
                <div className="flex items-center space-x-8 bg-white rounded-lg m-2 hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                  <div className="flex-shrink-0">
                    <img
                      src="/images/about/user-feedback.jpg"
                      alt="使用反馈"
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-800 hover:text-black transition-colors duration-200 no-underline hover:underline">
                      使用反馈：感谢小伙伴们的支持和建议！
                    </h2>
                  </div>
                </div>
              </Link>

            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0">
              {/* 天乙神算品牌信息 */}
              <div className="text-center" style={{ marginRight: '120px' }}>
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <TianIcon width={24} height={24} className="text-black" />
                  <span className="text-lg font-bold text-black">天乙神算</span>
                </div>
                <p className="text-gray-600">
                  © 2025 天乙神算. 保留所有权利.
                </p>
              </div>

              {/* 微信客服入口 */}
              <div className="text-center relative" style={{ marginLeft: '160px' }}>
                {/* 跳动箭头 - 位于容器上方 */}
                <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
                  <div className="arrow-bounce">
                    <svg width="60" height="60" viewBox="0 0 24 24" className="text-black">
                      <path d="M12 16l-6-6h12l-6 6z" fill="currentColor"/>
                    </svg>
                  </div>
                </div>
                <div className="flex justify-center space-x-4">
                  <div className="text-center">
                    <img
                      src="/images/wechat-qr-1.jpg"
                      alt="客服微信1"
                      className="w-20 h-20 mx-auto mb-2"
                    />
                    <p className="text-xs text-gray-400">芷暄师妹</p>
                  </div>
                  <div className="text-center">
                    <img
                      src="/images/wechat-qr-2.jpg"
                      alt="客服微信2"
                      className="w-20 h-20 mx-auto mb-2"
                    />
                    <p className="text-xs text-gray-400">丁火师妹</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
