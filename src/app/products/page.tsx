'use client'

import Link from 'next/link'
import TianIcon from '@/components/icons/TianIcon'

export default function ProductsPage() {
  // 产品模块数据
  const productModules = [
    {
      id: 1,
      title: '产品定价',
      image: '/images/products/product-pricing.jpg',
      alt: '产品定价',
      href: '/products/product-pricing'
    },
    {
      id: 2,
      title: '八字命理',
      image: '/images/products/bazi-destiny.jpg',
      alt: '八字命理',
      href: '/products/bazi-destiny'
    },
    {
      id: 3,
      title: '案例分析',
      image: '/images/products/case-analysis.jpg',
      alt: '案例分析',
      href: '/products/case-analysis'
    },
    {
      id: 4,
      title: '婚恋合盘',
      image: '/images/products/marriage-compatibility.jpg',
      alt: '婚恋合盘',
      href: '/products/marriage-compatibility'
    },
    {
      id: 5,
      title: '2026运势分析',
      image: '/images/products/2026-fortune.jpg',
      alt: '2026运势分析',
      href: '/products/2026-fortune'
    }
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
      <main className="pt-20 min-h-screen bg-gray-50">
        {/* 产品模块展示 */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* 页面标题 */}
            <div className="text-center mb-16">
              <h1 className="text-3xl md:text-4xl font-bold text-black mb-4">
                产品服务
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                专业的命理服务，为您提供全方位的人生指导
              </p>
            </div>

            {/* 产品模块网格 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {productModules.map((module, index) => {
                const ModuleContent = (
                  <div
                    key={module.id}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group"
                  >
                    {/* 图片容器 */}
                    <div className="relative overflow-hidden">
                      <img
                        src={module.image}
                        alt={module.alt}
                        className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/placeholder-product.jpg';
                        }}
                      />
                      {/* 悬停遮罩 */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"></div>
                    </div>

                    {/* 标题区域 */}
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900 text-center group-hover:text-black transition-colors duration-300">
                        {module.title}
                      </h3>
                    </div>
                  </div>
                );

                // 如果有链接，包装在Link组件中
                return module.href ? (
                  <Link key={module.id} href={module.href}>
                    {ModuleContent}
                  </Link>
                ) : (
                  ModuleContent
                );
              })}
            </div>

          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 py-12">
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
