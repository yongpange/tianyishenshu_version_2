import Link from 'next/link'
import TianIcon from '@/components/icons/TianIcon'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '婚恋合盘产品介绍 - 天乙神算官网',
  description: '天乙神算婚恋合盘产品介绍，包含夫妻宫分析、夫妻星定位、五行生克互补等十大分析主题，AI命理合婚专业服务。',
  keywords: '天乙神算, 婚恋合盘, 合婚分析, 夫妻宫, 夫妻星, 五行生克, AI命理, 婚姻匹配',
}

export default function MarriageCompatibilityPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* 主要内容 */}
      <main className="min-h-screen bg-white">
        {/* 婚恋合盘内容 */}
        <article className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* 标题 */}
            <header className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-black mb-8 text-center tracking-widest">
                婚恋合盘—产品介绍
              </h1>
            </header>

            {/* 正文内容 */}
            <div className="prose prose-xl max-w-none text-gray-700 leading-relaxed space-y-6">

              {/* 开头介绍 */}
              <section className="mb-8">
                <p className="mb-4">
                  婚恋合盘主题将于11月份正式上线。该主题在我们的日常咨询中出现频率很高，其理论体系已构建完善。目前，我们正在进行AI模型的训练和调试，以及网站功能的建设。婚恋合盘报告的长度约为3000至5000字，用户还可以与AI进行进一步的深度对话。以下是主题分析的前瞻内容：
                </p>
              </section>

              {/* 1.夫妻宫分析 */}
              <section>
                <h2 className="text-xl font-bold text-black mb-3">1.夫妻宫（日支）分析</h2>
                <p className="mb-6">
                  夫妻宫反映个人性格、修养及婚姻质量，是合婚的核心指标。需观察其五行属性、与其他干支的刑冲合害关系，若夫妻宫被破坏（如遇刑冲、穿害）或出现多现、暗合等情况，易导致婚变或晚婚。
                </p>
              </section>

              {/* 2.夫妻星定位 */}
              <section>
                <h2 className="text-xl font-bold text-black mb-3">2.夫妻星定位</h2>
                <p className="mb-6">
                  男命以财星（正财/偏财）代表配偶，女命以官杀（正官/七杀）代表配偶。需分析夫妻星的旺衰、得位与否： 夫妻星得局则配偶能力强；若受刑冲克害，可能婚姻不顺。夫妻星多现可能暗示多次婚姻，正星受制则婚姻易出问题。
                </p>
              </section>

              {/* 3.五行生克与互补 */}
              <section>
                <h2 className="text-xl font-bold text-black mb-3">3.五行生克与互补</h2>
                <div className="mb-6 space-y-3">
                  <p>
                    （1）分析双方命局五行是否相生互补（如一方火旺缺水，另一方水旺可调和），五行平衡的伴侣婚后争吵频率显著降低。
                  </p>
                  <p>
                    （2）阴阳平衡也需考量，纯阳或纯阴命格可能影响婚姻稳定。
                  </p>
                </div>
              </section>

              {/* 4.十神互动关系 */}
              <section>
                <h2 className="text-xl font-bold text-black mb-3">4.十神互动关系</h2>
                <div className="mb-6 space-y-3">
                  <p>
                    （1）通过十神（如食神、伤官、比劫等）分析双方性格与需求： 食神旺者重生活情趣，需情绪价值；偏财旺者关注物质保障。
                  </p>
                  <p>
                    （2）比劫争夫妻星或配偶宫被破坏时，易出现第三者。
                  </p>
                </div>
              </section>

              {/* 5.神煞影响 */}
              <section>
                <h2 className="text-xl font-bold text-black mb-3">5.神煞影响</h2>
                <p className="mb-6">
                  特殊神煞如桃花（主异性缘）、羊刃（主冲突）、魁罡（主刚强）等对婚恋有吉凶作用。例如"红艳""流霞"等煞星可能不利婚姻。
                </p>
              </section>

              {/* 6.四柱配合度 */}
              <section>
                <h2 className="text-xl font-bold text-black mb-3">6.四柱配合度</h2>
                <div className="mb-6 space-y-3">
                  <p>
                    （1）年柱/月柱：年柱相合、月柱相生为佳，若相冲则需谨慎。
                  </p>
                  <p>
                    （2）日柱：日干相合（如甲己合、乙庚合）主缘分深厚，日支相冲则矛盾多。
                  </p>
                  <p>
                    （3）时柱：涉及子女运势匹配，五行相生则子女缘佳。
                  </p>
                </div>
              </section>

              {/* 7.大运与流年同步性 */}
              <section>
                <h2 className="text-xl font-bold text-black mb-3">7.大运与流年同步性</h2>
                <p className="mb-6">
                  分析双方大运走势是否同步，若关键流年（如伤官见官、七杀临旺）重叠，需警惕婚姻危机。
                </p>
              </section>

              {/* 8.特殊格局与冲突 */}
              <section>
                <h2 className="text-xl font-bold text-black mb-3">8.特殊格局与冲突</h2>
                <div className="mb-6 space-y-3">
                  <p>
                    （1）星宫相战：夫妻星与夫妻宫相冲（如星在年柱、宫在日柱相克）。
                  </p>
                  <p>
                    （2）配偶宫被坏：如遇六合、暗合可能引发婚变。
                  </p>
                  <p>
                    （3）比劫争夫/妻：比劫旺者易有竞争或第三者介入。
                  </p>
                </div>
              </section>

              {/* 9.家庭与背景因素 */}
              <section>
                <h2 className="text-xl font-bold text-black mb-3">9.家庭与背景因素</h2>
                <p className="mb-6">
                  包括婆媳关系、家族背景、经济状况及生育能力等。
                </p>
              </section>

              {/* 10.事业财富节奏 */}
              <section>
                <h2 className="text-xl font-bold text-black mb-3">10.事业财富节奏</h2>
                <p className="mb-6">
                  未来伴侣的事业财富发展，是否符合你的预期
                </p>
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
            © 2025 天乙神算. 保留所有权利.
          </p>
        </div>
      </footer>
    </div>
  )
}
