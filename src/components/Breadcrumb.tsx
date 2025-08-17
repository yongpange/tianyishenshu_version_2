'use client'

import { useRouter } from 'next/navigation'
import { RightOutlined } from '@ant-design/icons'
import { handleBackToDashboard } from '@/utils/navigation-helper'

interface BreadcrumbItem {
  label: string
  path?: string
  clickable?: boolean
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
  /** 可选的流式输出检查函数，用于在点击"命书"时检查是否有正在进行的聊天 */
  streamingCheckFn?: () => boolean
  /** 可选的模块ID，用于检查特定模块的流式输出状态 */
  moduleId?: string
}

export default function Breadcrumb({
  items,
  className = '',
  streamingCheckFn,
  moduleId
}: BreadcrumbProps) {
  const router = useRouter()

  const handleClick = (item: BreadcrumbItem, e: React.MouseEvent) => {
    if (item.clickable && item.path) {
      e.preventDefault()
      e.stopPropagation()

      // 如果是点击"命书"链接且路径是dashboard，使用确认逻辑
      if (item.label === '命书' && item.path === '/dashboard') {
        handleBackToDashboard({
          moduleId,
          additionalChecks: streamingCheckFn,
          navigationType: 'redirect'
        })
      } else {
        // 其他链接直接跳转
        window.location.href = item.path
      }
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
