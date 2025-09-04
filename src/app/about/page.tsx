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
                    <h2 className="text-xl font-semibold text-gray-800 hover:text-black transition-colors duration-200 underline hover:no-underline">
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
                    <h2 className="text-xl font-semibold text-gray-800 hover:text-black transition-colors duration-200 underline hover:no-underline">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <TianIcon width={24} height={24} className="text-black" />
            <span className="text-lg font-bold text-black">天乙神算</span>
          </div>
          <p className="text-gray-600">
            © 2024 天乙神算. 保留所有权利.
          </p>
        </div>
      </footer>
    </div>
  )
}
