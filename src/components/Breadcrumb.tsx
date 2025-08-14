'use client'

import { useRouter } from 'next/navigation'
import { RightOutlined } from '@ant-design/icons'

interface BreadcrumbItem {
  label: string
  path?: string
  clickable?: boolean
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  const router = useRouter()

  const handleClick = (item: BreadcrumbItem, e: React.MouseEvent) => {
    if (item.clickable && item.path) {
      e.preventDefault()
      e.stopPropagation()
      window.location.href = item.path
    }
  }

  return (
    <nav className={`flex items-center space-x-2 text-sm text-gray-600 ${className}`}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          {item.clickable ? (
            <button
              onClick={(e) => handleClick(item, e)}
              className="hover:text-gray-900 hover:underline transition-colors duration-200 cursor-pointer"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
          
          {index < items.length - 1 && (
            <RightOutlined className="text-gray-400 text-xs" />
          )}
        </div>
      ))}
    </nav>
  )
}

// 预定义的面包屑配置
export const BREADCRUMB_CONFIGS = {
  astrology: [
    { label: '命书', path: '/dashboard', clickable: true },
    { label: '八字排盘', clickable: false }
  ],
  personality: [
    { label: '命书', path: '/dashboard', clickable: true },
    { label: '性格内观', clickable: false }
  ],
  wealth: [
    { label: '命书', path: '/dashboard', clickable: true },
    { label: '事业财富', clickable: false }
  ],
  marriage: [
    { label: '命书', path: '/dashboard', clickable: true },
    { label: '婚恋感情', clickable: false }
  ],
  health: [
    { label: '命书', path: '/dashboard', clickable: true },
    { label: '身体健康', clickable: false }
  ]
}
