'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">F</span>
              </div>
              <span className="text-xl font-bold text-gray-900">天乙神数</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-gray-700 hover:text-gray-900 transition-colors">首页</a>
              <a href="#" className="text-gray-700 hover:text-gray-900 transition-colors">命盘</a>
              <a href="#" className="text-gray-700 hover:text-gray-900 transition-colors">产品</a>
              <a href="#" className="text-gray-700 hover:text-gray-900 transition-colors">学习</a>
              <a href="#" className="text-gray-700 hover:text-gray-900 transition-colors">商店</a>
            </nav>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">咨询</span>
              <span className="text-gray-700">关于我们</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 animate-fade-in">
            解读命运实为一场人生策展
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-4 max-w-4xl mx-auto">
            基于东方古老智慧和现代人工智能技术，助您为人生策展，
          </p>
          <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-4xl mx-auto">
            成为自己最好的命理师。
          </p>
          <div>
            <Link href="/login">
              <button className="btn-primary text-lg px-8 py-4 hover:transform hover:scale-105 transition-all duration-300">
                马上体验
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Product Preview Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center">
            <div className="relative">
              {/* Desktop Preview */}
              <div className="relative bg-gray-900 rounded-lg p-4 shadow-2xl">
                <div className="bg-white rounded-lg overflow-hidden" style={{ width: '800px', height: '500px' }}>
                  <div className="bg-gray-100 h-8 flex items-center px-4">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="mx-auto bg-gray-800 text-white px-4 py-1 rounded text-xs">
                      app.tianyishenshu.com
                    </div>
                  </div>
                  <div className="p-8 bg-gradient-to-br from-blue-50 to-purple-50 h-full">
                    <div className="flex h-full">
                      <div className="w-1/3 bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center mb-6">
                          <div className="w-8 h-8 bg-black rounded-full mr-3"></div>
                          <span className="font-semibold">小助手发现・运势</span>
                        </div>
                        <div className="space-y-4">
                          <div className="text-sm text-gray-600">目录目录</div>
                          <div className="bg-gray-100 rounded-lg p-4">
                            <div className="text-sm font-medium">2024乙巳年生运势</div>
                          </div>
                          <div className="text-sm text-gray-600">天运流年</div>
                          <div className="text-sm text-gray-600">白醋</div>
                          <div className="text-sm text-gray-600">风险</div>
                        </div>
                      </div>
                      <div className="flex-1 bg-white rounded-lg shadow-sm ml-4 p-6">
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold mb-2">时空催眠 | 时间导景</h3>
                          <p className="text-sm text-gray-600">一年好运为始，当下您干什么最好？</p>
                        </div>
                        <div className="space-y-4 text-sm text-gray-600">
                          <p>免费提供美妙美满，充满自信心睡前催眠字眼等等，非常有助于调节情绪。</p>
                          <p>可以帮助你放松身心，提高睡眠质量，以及改善整体的精神状态。</p>
                          <p>另外，还能够增强你的自信心，让你更加积极地面对生活中的挑战。</p>
                        </div>
                        <div className="mt-6 space-y-4">
                          <div className="flex justify-between text-sm">
                            <span>睡眠大师运势</span>
                            <span>十大吉运建议</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <div className="text-xs text-gray-500 mb-2">2024</div>
                              <div className="h-16 bg-gradient-to-r from-blue-200 to-purple-200 rounded"></div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <div className="text-xs text-gray-500 mb-2">生肖运势</div>
                              <div className="h-16 bg-gradient-to-r from-green-200 to-blue-200 rounded"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Mobile Preview */}
              <div className="absolute -right-20 top-20 bg-black rounded-3xl p-2 shadow-2xl" style={{ width: '200px', height: '400px' }}>
                <div className="bg-white rounded-2xl overflow-hidden h-full">
                  <div className="bg-gray-100 h-8 flex items-center justify-center">
                    <div className="bg-black w-16 h-1 rounded-full"></div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 h-full">
                    <div className="text-center mb-4">
                      <div className="text-sm font-semibold">日运日运</div>
                      <div className="text-xs text-gray-600 mt-1">高</div>
                      <div className="text-xs text-gray-600">今日建议</div>
                    </div>
                    <div className="flex justify-center mb-4">
                      <div className="flex space-x-2">
                        <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center">
                          <span className="text-xs">乙</span>
                        </div>
                        <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center">
                          <span className="text-xs">丑</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-center mb-4">
                      <div className="text-sm font-semibold text-green-600">春心似桃月</div>
                      <div className="text-sm text-gray-600">慧渊清晚话</div>
                    </div>
                    <div className="bg-green-100 rounded-lg p-3 mb-4">
                      <div className="w-full h-20 bg-gradient-to-br from-green-200 to-blue-200 rounded-lg"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-center">
                        <div className="text-gray-600">宜</div>
                        <div className="text-gray-800">珍惜朋友的相识</div>
                        <div className="text-gray-800">努力追求安全</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-600">忌</div>
                        <div className="text-gray-800">情绪化</div>
                        <div className="text-gray-800">动怒注意</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">对话召唤</h2>
          <p className="text-lg text-gray-600 mb-16">24/7随时随地的应答，持续追问，细致解答，不同功能，各司其职</p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* 小道童 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow hover:transform hover:scale-105 duration-300">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-white text-2xl">🧙‍♂️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">小道童</h3>
              <p className="text-gray-600 mb-2">命理学习・命理知识・跟着白我</p>
              <p className="text-sm text-gray-500 mb-4">你的命理学习小助手</p>
              <p className="text-sm text-gray-500 mb-4">深入解析你的谜题信息思维</p>
              <p className="text-sm text-gray-500">充满东方智慧的将辅引导</p>
            </div>

            {/* 一事一卦 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow hover:transform hover:scale-105 duration-300">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-white text-2xl">🔮</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">一事一卦</h3>
              <p className="text-gray-600 mb-2">一事一卦・揭晓命不卦・当下决定未来结果</p>
              <p className="text-sm text-gray-500 mb-4">基于周易六十四卦技术工具</p>
              <p className="text-sm text-gray-500 mb-4">一事一卦・必有回应</p>
              <p className="text-sm text-gray-500">东方智慧针对具体问题的占卜解答</p>
            </div>

            {/* 大司命 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow hover:transform hover:scale-105 duration-300">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-white text-2xl">👑</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">大司命</h3>
              <p className="text-gray-600 mb-2">命盘分析・改命助心</p>
              <p className="text-sm text-gray-500 mb-4">命理基础知识及常见问题解答</p>
              <p className="text-sm text-gray-500 mb-4">根据八字命盘深度定制，专属于你</p>
              <p className="text-sm text-gray-500">回答一切你想问的问题</p>
            </div>
          </div>
        </div>
      </section>

      {/* Reports Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">解读报告</h2>
          <p className="text-lg text-gray-600 mb-12">根据命盘，阴阳为纲，要重清晰，层层递进，经络万象，天人合一</p>
          
          <Link href="/login">
            <button className="btn-primary text-lg px-8 py-4 hover:transform hover:scale-105 transition-all duration-300 mb-16">
              马上体验
            </button>
          </Link>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* 命之书 */}
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-8 shadow-lg hover:transform hover:scale-105 transition-all duration-300">
              <div className="w-32 h-32 bg-gradient-to-br from-green-200 to-blue-200 rounded-full mx-auto mb-6 flex items-center justify-center relative">
                <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-400 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">五行</span>
                  </div>
                </div>
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs bg-green-100 px-2 py-1 rounded">甲</div>
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs bg-blue-100 px-2 py-1 rounded">水</div>
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs bg-red-100 px-2 py-1 rounded">火</div>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs bg-yellow-100 px-2 py-1 rounded">土</div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">命之书</h3>
              <p className="text-sm text-gray-600 mb-2">全体首创可对话的东方命理报告</p>
              <p className="text-sm text-gray-600 mb-2">10欧卜片・万字内容・助你为人生字活</p>
              <p className="text-sm text-gray-600 mb-2">高度解析・精确・健康・亭相周易运象</p>
              <p className="text-sm text-gray-600">内容详尽・数据赋月详细揭答</p>
            </div>

            {/* 运之书 */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 shadow-lg hover:transform hover:scale-105 transition-all duration-300">
              <div className="w-32 h-32 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full mx-auto mb-6 flex items-center justify-center relative">
                <div className="w-20 h-12 bg-white rounded-full flex items-center justify-center">
                  <div className="text-xs font-bold">三金二五</div>
                </div>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 text-xs">命运之书</div>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-xs">智慧增援决策</div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">运之书</h3>
              <p className="text-sm text-gray-600 mb-2">以命准维内・基础解缘走个人情况・</p>
              <p className="text-sm text-gray-600 mb-2">定位时空・标观营后学午年迟涉场・也有分类显示・</p>
              <p className="text-sm text-gray-600 mb-2">四象评价・数据赋月详细制图</p>
              <p className="text-sm text-gray-600">内容详尽・数据赋月详细制图</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-black text-sm font-bold">F</span>
              </div>
              <span className="text-xl font-bold">天乙神数</span>
            </div>
            <div className="text-sm text-gray-400">
                              © 2024 天乙神数. 解读命运，策展人生。
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
} 