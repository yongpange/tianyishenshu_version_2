import Link from 'next/link'
import TianIcon from '@/components/icons/TianIcon'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '用户反馈 - 天乙神算官网',
  description: '感谢小伙伴们的支持和建议！天乙神算用户真实反馈，产品体验分享。',
  keywords: '天乙神算, 用户反馈, 产品体验, 用户评价, 命理测算, AI命理师',
}

export default function UserFeedbackPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* 主要内容 */}
      <main className="min-h-screen bg-white">
        {/* 用户反馈内容 */}
        <article className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* 标题 */}
            <header className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-black mb-8 text-center tracking-widest">
                产品体验：感谢你们的支持和建议
              </h1>
            </header>

            {/* 正文内容 */}
            <div className="prose prose-xl max-w-none text-gray-700 leading-relaxed space-y-6">

              <p>
                大家好，我是天乙神算创始人寻一，网站版本上线已有半个月，很多小伙伴们加入到了体验中，并给出了很多的好评和鼓励，我们由衷的感到欣慰，这既是对我们学术体系的认可，也是对我们团队价值观的认同。天乙对大家来说是一个命理测算平台，但他对我们来说是修行之路，以术入道，以道统术，希望有一天能够登临玄境，哈哈哈说远了~
              </p>

              <p>
                天乙ai目前能达到中级命理师的水平，当用神喜忌取用正确时，ai认知的深度广度推理能力，都远超常人，这是目前ai最有优势的地方，且他处于不断的成长中，预计3个月-6个月，会达到高级命理师水平，目前高阶理法体系已构建，更多的是训练和调试，希望能早一些和大家见面。
              </p>

              <p>
                人算终究无法算尽，且八字命理仅代表个人运势，最终呈现是和多重维度共振的结果，如家庭运势、公司运势、恋人运势、地缘运势、甚至国运。目前ai还是以"人"的理法体系为主，也许有一天他会创造自己的体系吧，目前我们的目标是把ai带到人类大师境界。
              </p>

              <p>
                最近十天的试运行效果不错，以下是用户的一些评价（b站等公共平台），同时也感谢大家对我们的包容，无论是平台，还是命理体系，都在逐步优化，如果你使用中遇到了问题，甚至觉得不满意，也请及时和客服小姐姐沟通，我们都会尽力处理好。将命理产品做好，是我们不变的初心。
              </p>

            </div>

            {/* 用户反馈图片1 */}
            <div className="my-12">
              <img
                src="/images/about/user-feedback-1.jpg"
                alt="用户反馈截图1"
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>

            {/* 用户反馈图片2 */}
            <div className="my-12">
              <img
                src="/images/about/user-feedback-2.jpg"
                alt="用户反馈截图2"
                className="w-full h-auto rounded-lg shadow-lg"
              />
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
