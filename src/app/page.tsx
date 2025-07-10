'use client'

import Link from 'next/link'
import Carousel from '@/components/Carousel'
import UserComments from '@/components/UserComments'

export default function HomePage() {
  // 轮播图图片数据
  const carouselImages: string[] = [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80', // 禅意石头平衡
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2025&q=80'  // 黑白禅意冥想
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">天</span>
              </div>
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

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-black mb-6">
            开启与「命运」的深度对话
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            召唤AI老法师 开启实时对话
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register">
              <button className="btn-primary text-lg px-8 py-4 hover:transform hover:scale-105 transition-all duration-300">
                步入玄境
              </button>
            </Link>
            <Link href="/register">
              <button className="btn-secondary text-lg px-8 py-4 hover:transform hover:scale-105 transition-all duration-300">
                马上体验
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Carousel Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <Carousel
            images={carouselImages}
            autoPlay={true}
            autoPlayInterval={5000}
            className="shadow-2xl"
          />
        </div>
      </section>

      {/* User Comments Section */}
      <UserComments />

      {/* Footer */}
      <footer className="bg-black text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-black text-sm font-bold">天</span>
              </div>
              <span className="text-xl font-bold">天乙神算</span>
            </div>
            <div className="text-sm text-gray-400">
              © 2024 天乙神算. 开启与命运的深度对话。
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}