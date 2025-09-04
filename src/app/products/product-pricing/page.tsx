import Link from 'next/link'
import TianIcon from '@/components/icons/TianIcon'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '产品定价 - 天乙神算官网',
  description: '天乙神算产品定价，年度会员268元，包含5项专项报告+50次深度对话，八字命理AI测算平台专业服务。',
  keywords: '天乙神算, 产品定价, 年度会员, 八字命理, AI测算, 深度对话, 命理报告',
}

export default function ProductPricingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* 主要内容 */}
      <main className="min-h-screen bg-white">
        {/* 产品定价内容 */}
        <article className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* 标题 */}
            <header className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-black mb-8 text-center tracking-widest">
                产品定价
              </h1>
            </header>

            {/* 正文内容 */}
            <div className="prose prose-xl max-w-none text-gray-700 leading-relaxed space-y-6">

              {/* 一、年度会员 */}
              <section>
                <h2 className="text-2xl font-bold text-black mb-4">一、年度会员，定价268元。</h2>
                
                <p className="mb-4">
                  八字命理分析是平台的核心产品，包括：
                </p>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-black mb-3">1.命理报告：</h3>
                  <p className="mb-4">
                    根据生辰推演八字及大运，深度分析命主的命局运势，详细论五个专项主题，包括性格特质、事业发展、商业财富、婚恋感情、身体健康，字数近1.5万字。
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-black mb-3">2.深度对话：</h3>
                  <p className="mb-4">
                    天乙ai不仅可以输出报告，与其深度对话才是ai时代的真正价值，可以结合命主及事件的背景信息，帮助命主进行深度分析，把握关键节点。每次对话，ai回复约1000字。
                  </p>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg mb-6">
                  <p className="text-lg font-semibold text-black">年度会员包含：5项专项报告+50次深度对话</p>
                </div>

                <p className="mb-4 text-lg font-medium text-blue-600">
                  早鸟折扣价，诚意满满！请联系下方微信客服~
                </p>

                <p className="mb-6 text-gray-600">
                  产品上线展望：11月份上线婚恋合盘、商业合盘、2026年度运势。
                </p>
              </section>

              {/* 二、深度对话充值 */}
              <section>
                <h2 className="text-2xl font-bold text-black mb-4">二、深度对话充值 50次/48元</h2>
                
                <p className="mb-6">
                  深度对话可以在各个主题下，进行对话使用，包括命理5大专题、合盘、年度运势、以及后续上线的起卦问测、起名等等。
                </p>
              </section>

              {/* 三、年度会员（命理师版） */}
              <section>
                <h2 className="text-2xl font-bold text-black mb-4">三、年度会员（命理师版）</h2>
                
                <div className="space-y-4">
                  <p className="mb-4">
                    <span className="font-semibold text-black">【普通版】</span>
                    面向没有八字基础的小伙伴们，专业词汇很少，直接进行分析；
                  </p>

                  <p className="mb-4">
                    <span className="font-semibold text-black">【命理师版】</span>
                    面向命理爱好者及命理师，会带着较多的理法分析，帮助大家提升八字水平，协助命理师进行咨询交付。
                  </p>
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

            {/* 跳动箭头 - 指向客服入口 */}
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="absolute right-4 sm:right-6 lg:right-8 top-8">
                <div className="flex justify-end">
                  <div className="arrow-bounce">
                    <svg width="60" height="60" viewBox="0 0 24 24" className="text-black">
                      <path d="M12 16l-6-6h12l-6 6z" fill="currentColor"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            {/* 左侧空白区域，用于平衡布局 */}
            <div className="hidden md:block md:w-1/3"></div>

            {/* 中间品牌信息 */}
            <div className="text-center md:w-1/3 mb-6 md:mb-0">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <TianIcon width={24} height={24} className="text-black" />
                <span className="text-lg font-bold text-black">天乙神算</span>
              </div>
              <p className="text-gray-600">
                © 2024 天乙神算. 保留所有权利.
              </p>
            </div>

            {/* 右侧客服入口 */}
            <div className="text-center md:text-right md:w-1/3">
              <h3 className="text-lg font-semibold mb-4">请联系下方微信客服~</h3>
              <div className="flex justify-center md:justify-end space-x-4">
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
      </footer>
    </div>
  )
}
