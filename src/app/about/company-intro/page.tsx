import Link from 'next/link'
import TianIcon from '@/components/icons/TianIcon'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '关于天乙神算 - 天乙神算官网',
  description: '天乙神算，八字命理AI测算平台，于2025年春季正式发布上线，是一家以东方术数体系为根基、人工智能技术为引擎的创新型企业。',
  keywords: '天乙神算, 关于天乙神算, 公司介绍, 八字命理AI, 东方术数, 人工智能技术, 创新型企业',
}

export default function CompanyIntroPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* 主要内容 */}
      <main className="min-h-screen bg-white">
        {/* 公司介绍内容 */}
        <article className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* 标题 */}
            <header className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-black mb-8 text-center tracking-widest">
                公司介绍
              </h1>
            </header>

            {/* 海报展示 */}
            <div className="mb-12">
              <img
                src="/images/about/company-poster.webp"
                alt="天乙神算公司海报"
                className="w-full h-auto rounded-lg shadow-lg"
                width="2016"
                height="864"
              />
            </div>

            {/* 正文内容 */}
            <div className="prose prose-xl max-w-none text-gray-700 leading-relaxed space-y-6">

              <p>
                天乙神算——八字命理AI测算平台，于2025年春季正式发布上线，是一家以东方术数体系为根基、人工智能技术为引擎的创新型企业。公司秉承"融合古今智慧，赋能精准决策"的使命，致力于通过大语言模型（LLM）与玄学理法的深度融合，推动东方术数在全球范围的科学化传播与场景化落地。
              </p>

              <p>
                团队以"专业理法体系"为核心竞争力，以十万级真实案例、20年行业经验为根基，将八字命理等传统术数模型转化为可计算的AI算法。通过自研的命理大语言模型（Metaphysical LLM），实现命理推演的标准化、交互化与可视化，突破传统术数的学习壁垒与应用局限。
              </p>

              <p>
                创始人寻一，早年任职上市公司负责资本运作，因特殊奇遇而进入玄学领域，又历经十年名师遍访、八年全职从业，深感术数高阶理论的认知壁垒。创立天乙神算的初心，是借力AI破解'传统玄学曲高和寡'之困，让造物之奇与术数之精，成为可被普罗大众理解的生活智慧。
              </p>

              <p>
                天乙神算上线以来，凭借其专业性与实用性，在公开平台上赢得了大量用户的好评与积极反馈，众多宝贵建议已被采纳并融入产品迭代。公司始终秉承开放共享的发展理念，致力于通过东方数术的智慧工具，赋能用户深度在自我认知，洞悉未来。同时，平台也为易学爱好者及从业者，打造了AI赋能的高效工具，助力其专业水平实现跃升，共同推动国学文化的发展与传承。
              </p>

            </div>

            {/* 返回按钮 */}
            <div className="mt-12 text-center">
              <Link href="/about">
                <button className="btn-secondary px-8 py-3">
                  返回关于我们
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
