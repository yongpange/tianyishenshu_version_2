'use client'

import Link from 'next/link'
import TianIcon from '@/components/icons/TianIcon'

export default function ProductsPage() {
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
              <button className="text-black font-semibold relative pb-1 border-b-2 border-black">
                产品
              </button>
              <Link href="/about">
                <button className="text-gray-700 hover:text-black transition-colors duration-200 font-medium relative pb-1 hover:border-b-2 hover:border-black">
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
      <main className="pt-20 min-h-screen bg-white">
        {/* 产品页面内容待设计 */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-black mb-8">
              产品页面
            </h1>
            <p className="text-gray-600">
              内容正在准备中...
            </p>
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
