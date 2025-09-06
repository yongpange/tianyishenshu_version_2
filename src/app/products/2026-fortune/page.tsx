import Link from 'next/link'
import TianIcon from '@/components/icons/TianIcon'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '2026运势分析产品介绍 - 天乙神算官网',
  description: '天乙神算2026丙午流年运势分析产品介绍，包含事业、财富、感情、健康四大核心主题，AI命理运势分析专业服务。',
  keywords: '天乙神算, 2026运势分析, 丙午流年, 事业运势, 财富运势, 感情运势, 健康运势, AI命理',
}

export default function Fortune2026Page() {
  return (
    <div className="min-h-screen bg-white">
      {/* 主要内容 */}
      <main className="min-h-screen bg-white">
        {/* 2026运势分析内容 */}
        <article className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* 标题 */}
            <header className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-black mb-8 text-center tracking-widest">
                2026运势分析—产品介绍
              </h1>
            </header>

            {/* 正文内容 */}
            <div className="prose prose-xl max-w-none text-gray-700 leading-relaxed space-y-6">

              {/* 开头介绍 */}
              <section className="mb-8">
                <p className="mb-4">
                  2026丙午流年运势分析主题，将于11月份正式上线。该主题在我们每年年底的重头戏，也是每年最繁忙的时候，其应用于ai的理论体系已构建完善，目前，我们正在进行AI模型的训练和调试，以及网站功能的建设。2026运势分析报告的长度约5000字-6000字，会详细分析到每个季度、每个月份。用户还可以与AI进行进一步的深度对话。以下是主题分析的前瞻框架：
                </p>
              </section>

              {/* 一、核心分析主题 */}
              <section>
                <h2 className="text-2xl font-bold text-black mb-4">一、核心分析主题</h2>
                
                {/* 1.事业运势 */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-black mb-3">1.事业运势</h3>
                  <div className="space-y-3">
                    <p>
                      <strong>分析要素：</strong> 流年干支对官星（正官/七杀）、印星（学业/贵人）、食伤（创造力）的引动作用，判断升迁、创业、职场变动机遇。
                    </p>
                    <p>
                      大运与流年协同效应（如大运走财运，流年见财星则进财）。
                    </p>
                    <p>
                      <strong>关键指标：</strong> 十神中"官杀"主事业压力与机遇，"印星"主资源支持，"食伤"主技能发挥。
                    </p>
                    <p>
                      冲合关系（如原局有"寅申冲"，流年逢申则事业波动）。
                    </p>
                  </div>
                </div>

                {/* 2.财富运势 */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-black mb-3">2.财富运势</h3>
                  <div className="space-y-3">
                    <p>
                      <strong>分析要素：</strong> 流年财星（正财/偏财）与食伤星的旺衰，评估收入稳定性、投资回报或意外支出。
                    </p>
                    <p>
                      财库状态（如原局有财库，流年逢冲可能破财或爆发）。
                    </p>
                    <p>
                      <strong>风险提示：</strong> 日主克流年太岁（如乙巳年木火旺，日主为金则易财务压力）需加强风险管理。
                    </p>
                  </div>
                </div>

                {/* 3.感情与人际关系 */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-black mb-3">3.感情与人际关系</h3>
                  <div className="space-y-3">
                    <p>
                      <strong>分析要素：</strong> 夫妻宫（日支）受流年冲合，判断婚姻稳定性、恋爱机会或矛盾。
                    </p>
                    <p>
                      桃花星（子午卯酉）及合化关系（如流年合入日柱易有姻缘）。
                    </p>
                    <p>
                      <strong>人际扩展：</strong> 贵人神煞（天乙贵人）和比劫星影响合作与竞争关系。
                    </p>
                  </div>
                </div>

                {/* 4.健康运势 */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-black mb-3">4.健康运势</h3>
                  <div className="space-y-3">
                    <p>
                      <strong>分析要素：</strong> 五行失衡引发的脏腑问题（如木火过旺易心脑血管病、肝胆不适）。
                    </p>
                    <p>
                      流年与命局刑冲（如"寅巳申"三刑主意外伤病）。
                    </p>
                    <p>
                      <strong>调候建议：</strong> 气候五行与命局需求（如2025乙巳年火旺，命局忌火者需防炎症）。
                    </p>
                  </div>
                </div>
              </section>

              {/* 二、关键分析框架 */}
              <section>
                <h2 className="text-2xl font-bold text-black mb-4">二、关键分析框架</h2>

                {/* 1.流年与命局互动 */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-black mb-3">1.流年与命局互动</h3>
                  <div className="space-y-3">
                    <p>
                      <strong>生克关系：</strong>流年干支与八字四柱（年、月、日、时）的相生相克，决定吉凶基调。
                    </p>
                    <p>
                      例：流年天干生扶日主为吉，克制日主为凶，需看是否有通关五行。
                    </p>
                    <p>
                      <strong>五行旺衰：</strong>流年强化特定五行（如2025乙巳年木火旺），补益或破坏命局平衡。
                    </p>
                  </div>
                </div>

                {/* 2.大运与流年协同 */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-black mb-3">2.大运与流年协同</h3>
                  <div className="space-y-3">
                    <p>
                      <strong>大运为背景：</strong>十年大运定义阶段主题（如财运期、事业期），流年为具体应期。
                    </p>
                    <p>
                      <strong>引动机制：</strong>流年触发大运中潜伏的吉凶（如大运有"财库"，流年冲库则得财）。
                    </p>
                  </div>
                </div>

                {/* 3.神煞与格局 */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-black mb-3">3.神煞与格局</h3>
                  <div className="space-y-3">
                    <p>
                      <strong>神煞放大效应：</strong> 文昌利学业事业，灾煞主意外，桃花主感情机遇。
                    </p>
                    <p>
                      <strong>格局制约：</strong> 正官格遇伤官流年易事业挫折，从财格逢财星流年发财。
                    </p>
                  </div>
                </div>

                {/* 4.时空能量互动 */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-black mb-3">4.时空能量互动</h3>
                  <div className="space-y-3">
                    <p>
                      <strong>地支重点关注：</strong>流年地支与命局地支的刑冲破害（如2025年需排查寅、申、巳、亥）。
                    </p>
                    <p>
                      <strong>气候调候：</strong>流年五行属性与季节叠加（如火旺流年夏季更需防燥热之疾）。
                    </p>
                  </div>
                </div>
              </section>

              {/* 三、动态分析原则 */}
              <section>
                <h2 className="text-2xl font-bold text-black mb-4">三、动态分析原则</h2>

                {/* 1.三重维度整合 */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-black mb-3">1.三重维度整合</h3>
                  <div className="space-y-3">
                    <p>
                      <strong>限运（年运宫位）：</strong>划分12个月吉凶，提供事件时间线索。
                    </p>
                    <p>
                      <strong>大运（十年周期）：</strong>奠定长期趋势，影响流年发挥空间。
                    </p>
                    <p>
                      <strong>流年（具体触发）：</strong>直接引动吉凶事件，为应期核心。
                    </p>
                  </div>
                </div>

                {/* 2.喜用神为核心标尺 */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-black mb-3">2.喜用神为核心标尺</h3>
                  <div className="space-y-3">
                    <p>
                      流年干支若为八字喜用神，则运势提升；若为忌神则需规避风险。
                    </p>
                    <p>
                      例：日主弱需印比帮扶，流年逢印星（水木）则利学业健康。
                    </p>
                  </div>
                </div>

                {/* 3.合冲关系的吉凶辩证 */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-black mb-3">3.合冲关系的吉凶辩证</h3>
                  <div className="space-y-3">
                    <p>
                      合化吉神（如流年合入财星）主机遇，合化忌神（如合为七杀）主压力。
                    </p>
                    <p>
                      相冲需分喜忌：冲忌神为吉，冲喜神为凶（如冲夫妻宫忌神反利感情）。
                    </p>
                  </div>
                </div>
              </section>

              {/* 四、2025年（乙巳年）特殊关注点 */}
              <section>
                <h2 className="text-2xl font-bold text-black mb-4">四、2025年（乙巳年）特殊关注点</h2>

                <div className="space-y-4">
                  <p>
                    <strong>五行特质：</strong>天干乙木生地支巳火，木火能量主导，利文化、能源、科技行业。
                  </p>
                  <p>
                    <strong>地支冲突：</strong> 巳亥冲（驿马动，主变动搬迁），寅巳申三刑（防纠纷伤病）。
                  </p>
                  <p>
                    <strong>调候建议：</strong> 命局水弱者需补水（防上火），金弱者避火克（防肺疾）。
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
