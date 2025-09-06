import Link from 'next/link'
import TianIcon from '@/components/icons/TianIcon'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '八字命理产品介绍 - 天乙神算官网',
  description: '天乙神算八字命理产品介绍，包含命书、专项报告、主题细论、深度对话等核心功能，AI命理分析专业服务。',
  keywords: '天乙神算, 八字命理, 命书, 专项报告, 深度对话, AI命理, 性格内观, 事业发展',
}

export default function BaziDestinyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* 主要内容 */}
      <main className="min-h-screen bg-white">
        {/* 八字命理内容 */}
        <article className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* 标题 */}
            <header className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-black mb-8 text-center tracking-widest">
                八字命理—【命书】介绍
              </h1>
            </header>

            {/* 正文内容 */}
            <div className="prose prose-xl max-w-none text-gray-700 leading-relaxed space-y-8">

              {/* 命书部分 */}
              <section>
                {/* 命书图片 */}
                <div className="mb-6">
                  <img
                    src="/images/products/bazi-mingsu.jpg"
                    alt="命书功能介绍"
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                </div>
                
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-black mb-4">【命书】</h2>
                  <p>
                    命书是年度 vip 会员的核心频道，以八字命理为核心理法进行分析论述，包括性格内观事业发展、商业财富、婚恋感情、身体健康这五个专项主题。
                  </p>
                </div>
              </section>

              {/* 专项报告部分 */}
              <section>
                {/* 专项报告图片 */}
                <div className="mb-6">
                  <img
                    src="/images/products/bazi-reports.jpg"
                    alt="专项报告功能介绍"
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                </div>
                
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-black mb-4">【专项报告】</h2>
                  <p>
                    五大主题分别生成对应的深度报告，总计近1.5万字。
                  </p>
                </div>
              </section>

              {/* 主题细论部分 */}
              <section>
                {/* 主题细论图片 */}
                <div className="mb-6">
                  <img
                    src="/images/products/bazi-themes.jpg"
                    alt="主题细论功能介绍"
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                </div>
                
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-black mb-4">【主题细论】</h2>
                  <p>
                    每个主题都会按照以上细分主题展开论述，同时又千人千面，每个细分主题也会有所不同。可以参考【案例分享】。
                  </p>
                </div>
              </section>

              {/* 深度对话部分 */}
              <section>
                {/* 深度对话图片 */}
                <div className="mb-6">
                  <img
                    src="/images/products/bazi-dialogue.jpg"
                    alt="深度对话功能介绍"
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                </div>
                
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-black mb-4">【深度对话】</h2>
                  <p>
                    天乙ai不仅可以输出报告，与其深度对话才是ai时代的真正价值，可以结合命主及事件的背景信息，帮助命主进行深度分析，把握关键节点。每次对话，ai回复约1000字。
                  </p>
                </div>
              </section>

              {/* 会员包含内容 */}
              <section>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-lg font-semibold text-black text-center">
                    年度vip会员包含：5项专项报告+50次深度对话
                  </p>
                </div>
              </section>

              {/* 案例解析 */}
              <section>
                <h2 className="text-2xl font-bold text-black mb-4">【案例解析】</h2>
                <div className="space-y-4">
                  <Link href="/products/case-liuqiangdong">
                    <div className="flex items-center space-x-4 bg-white p-4 rounded-lg hover:shadow-md transition-shadow duration-200 cursor-pointer border border-gray-200">
                      <div className="flex-shrink-0">
                        <img
                          src="/images/products/case-liuqiangdong.jpg"
                          alt="刘强东案例"
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800 hover:text-black transition-colors duration-200 no-underline hover:underline">
                          命稿案例—刘强东
                        </h3>
                      </div>
                    </div>
                  </Link>

                  <Link href="/products/case-liutao">
                    <div className="flex items-center space-x-4 bg-white p-4 rounded-lg hover:shadow-md transition-shadow duration-200 cursor-pointer border border-gray-200">
                      <div className="flex-shrink-0">
                        <img
                          src="/images/products/case-liutao.jpg"
                          alt="刘涛案例"
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800 hover:text-black transition-colors duration-200 no-underline hover:underline">
                          命稿案例—刘涛
                        </h3>
                      </div>
                    </div>
                  </Link>
                </div>
              </section>

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
        </article>
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
