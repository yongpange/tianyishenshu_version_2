import Link from 'next/link'
import TianIcon from '@/components/icons/TianIcon'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '案例分析 - 天乙神算官网',
  description: '天乙神算案例分析，包含刘强东、刘涛等知名人士的命理分析案例，展示AI命理分析的专业水准。',
  keywords: '天乙神算, 案例分析, 命稿案例, 刘强东, 刘涛, AI命理分析, 八字案例',
}

export default function CaseAnalysisPage() {
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
      <main className="pt-20 min-h-screen bg-gray-100">
        {/* 页面标题 */}
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-black mb-8 tracking-widest">
              案例分析
            </h1>
          </div>
        </section>

        {/* 案例列表 */}
        <section className="pb-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-2">

              {/* 第一行：刘强东案例 */}
              <Link href="/products/case-liuqiangdong">
                <div className="flex items-center space-x-8 bg-white rounded-lg m-2 hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                  <div className="flex-shrink-0">
                    <img
                      src="/images/products/case-liuqiangdong.jpg"
                      alt="刘强东案例"
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-800 hover:text-black transition-colors duration-200 no-underline hover:underline">
                      命稿案例—刘强东
                    </h2>
                  </div>
                </div>
              </Link>

              {/* 第二行：刘涛案例 */}
              <Link href="/products/case-liutao">
                <div className="flex items-center space-x-8 bg-white rounded-lg m-2 hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                  <div className="flex-shrink-0">
                    <img
                      src="/images/products/case-liutao.jpg"
                      alt="刘涛案例"
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-800 hover:text-black transition-colors duration-200 no-underline hover:underline">
                      命稿案例—刘涛
                    </h2>
                  </div>
                </div>
              </Link>

            </div>

            {/* 返回按钮 */}
            <div className="mt-12 text-center">
              <Link href="/products">
                <button className="btn-secondary px-8 py-3">
                  返回产品主页
                </button>
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
