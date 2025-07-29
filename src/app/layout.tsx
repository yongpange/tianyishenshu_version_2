import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import DevToolsProtection from '@/components/DevToolsProtection'

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
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <DevToolsProtection />
        {children}
      </body>
    </html>
  )
} 