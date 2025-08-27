import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
// import DevToolsProtection from '@/components/DevToolsProtection'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '天乙神算 - 解读命运实为一场人生策展',
  description: '基于东方古老智慧和现代人工智能技术，助您为人生策展，成为自己最好的命理师。',
  keywords: '命理, 占卜, 人工智能, 东方智慧, 人生策展',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://www.tyfate.com/",
        "name": "天乙神算",
        "alternateName": "TYFATE",
        "url": "https://www.tyfate.com/",
        "slogan": "融合古今智慧，赋能精准决策",
        "foundingDate": "2025",
        "description": "天乙神算——八字命理AI测算平台，于2025年春季正式发布上线，是一家以东方术数体系为根基、人工智能技术为引擎的创新型企业。公司致力于通过大语言模型（LLM）与玄学理法的深度融合，推动东方术数在全球范围的科学化传播与场景化落地。",
        "founder": {
          "@type": "Person",
          "name": "寻一",
          "description": "天乙神算创始人。早年任职上市公司负责资本运作，因特殊机缘进入玄学领域，历经十年名师遍访、八年全职从业。创立初心：借力AI破解\"传统玄学曲高和寡\"之困，让造物之奇与术数之精成为普罗大众可理解的生活智慧。"
        },
        "knowsAbout": [
          "八字命理",
          "东方术数",
          "大语言模型",
          "AI测算",
          "命理咨询"
        ],
        "brand": {
          "@type": "Brand",
          "name": "天乙神算"
        }
      },
      {
        "@type": "WebSite",
        "@id": "https://www.tyfate.com/",
        "url": "https://www.tyfate.com/",
        "name": "天乙神算 · 八字命理AI测算平台",
        "description": "结合东方术数与AI的命理测算与咨询平台，提供万字命稿与专业咨询服务。",
        "inLanguage": "zh-CN",
        "publisher": { "@id": "https://www.tyfate.com/" }
      },
      {
        "@type": "WebPage",
        "@id": "https://www.tyfate.com/",
        "url": "https://www.tyfate.com/",
        "name": "天乙神算_天乙神算官网_AI解读万字命稿",
        "isPartOf": { "@id": "https://www.tyfate.com/#website" },
        "about": { "@id": "https://www.tyfate.com/#org" },
        "description": "天乙神算以东方术数体系为根基、AI技术为引擎，提供万字命稿与命理咨询，推动术数的标准化、交互化与可视化。"
      },
      {
        "@type": "Service",
        "@id": "https://www.tyfate.com/",
        "serviceType": "命理测算与咨询",
        "provider": { "@id": "https://www.tyfate.com/" },
        "areaServed": "Worldwide",
        "availableChannel": {
          "@type": "ServiceChannel",
          "serviceUrl": "https://www.tyfate.com/",
          "name": "在线服务"
        },
        "offers": [
          {
            "@type": "Offer",
            "name": "万字命稿（对话生成）",
            "category": "测算报告",
            "url": "https://www.tyfate.com/",
            "availability": "https://schema.org/InStock"
          },
          {
            "@type": "Offer",
            "name": "命理咨询服务",
            "category": "专业咨询",
            "url": "https://www.tyfate.com/",
            "availability": "https://schema.org/InStock"
          }
        ],
        "description": "为用户提供结合东方术数与人工智能的万字命稿，以及相应的命理咨询服务。"
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://www.tyfate.com/",
        "name": "Metaphysical LLM",
        "applicationCategory": "AIApplication",
        "operatingSystem": "Web",
        "creator": { "@id": "https://www.tyfate.com/" },
        "description": "自研命理大语言模型，将八字命理等传统术数模型转化为可计算的AI算法，实现推演的标准化、交互化与可视化，突破传统学习壁垒与应用局限。"
      },
      {
        "@type": "CreativeWork",
        "@id": "https://www.tyfate.com/aboutus.html",
        "name": "公司历程与愿景",
        "url": "https://www.tyfate.com/aboutus.html",
        "about": { "@id": "https://www.tyfate.com/aboutus.html" },
        "text": "天乙神算上线以来，凭借专业性与实用性在公开平台收获大量好评与反馈，并将建议融入产品迭代。公司秉承开放共享理念，以东方数术智慧工具赋能用户自我认知与未来洞察，并为易学爱好者与从业者打造AI赋能工具，助其专业水平跃升，推动国学文化发展与传承。"
      },
      {
        "@type": "Organization",
        "@id": "https://www.tyfate.com/",
        "name": "天乙神算团队",
        "description": "以\"专业理法体系\"为核心竞争力，基于十万级真实案例与20年行业经验，将传统术数模型转化为AI算法，支撑产品与咨询服务质量。",
        "parentOrganization": { "@id": "https://www.tyfate.com/" }
      }
    ]
  }

  return (
    <html lang="zh-CN">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData)
          }}
        />
      </head>
      <body className={inter.className}>
        {/* <DevToolsProtection /> */}
        {children}
      </body>
    </html>
  )
}