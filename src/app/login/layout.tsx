import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '登陆天乙神算 - 天乙神算官网',
  description: '天乙神算官方登录网址，请认准链接。',
  keywords: '天乙神算登录, 天乙神算官网, 登陆天乙神算, 命理测算登录, AI解读登录',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
