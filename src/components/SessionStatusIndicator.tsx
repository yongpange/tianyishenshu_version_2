import React from 'react'
import { Badge, Tooltip } from 'antd'
import { LoadingOutlined, MessageOutlined } from '@ant-design/icons'
import { useGlobalSessionManager } from '@/hooks/useGlobalSessionManager'

interface SessionStatusIndicatorProps {
  currentModuleId: string
  className?: string
}

export const SessionStatusIndicator: React.FC<SessionStatusIndicatorProps> = ({ 
  currentModuleId, 
  className = '' 
}) => {
  const { getActiveSessionByModule, getActiveSessions } = useGlobalSessionManager()
  
  const currentModuleSession = getActiveSessionByModule(currentModuleId)
  const allActiveSessions = getActiveSessions()
  const hasActiveSession = currentModuleSession?.isActive || false
  const totalActiveSessions = allActiveSessions.length

  if (!hasActiveSession && totalActiveSessions === 0) {
    return null
  }

  // 当前模块有活跃会话
  if (hasActiveSession) {
    return (
      <Tooltip title={`AI正在回复中... (${currentModuleSession?.streamingContent.length || 0}字符)`}>
        <div className={`flex items-center space-x-2 text-blue-600 ${className}`}>
          <LoadingOutlined className="animate-spin" />
          <span className="text-sm font-medium">AI回复中</span>
          <Badge count={1} size="small" />
        </div>
      </Tooltip>
    )
  }

  // 其他模块有活跃会话
  if (totalActiveSessions > 0) {
    return (
      <Tooltip title={`其他页面有${totalActiveSessions}个活跃对话`}>
        <div className={`flex items-center space-x-2 text-orange-600 ${className}`}>
          <MessageOutlined />
          <span className="text-sm font-medium">后台对话</span>
          <Badge count={totalActiveSessions} size="small" />
        </div>
      </Tooltip>
    )
  }

  return null
}

// 简化版本，用于顶部状态栏
export const SimpleSessionStatus: React.FC<{ moduleId: string }> = ({ moduleId }) => {
  const { getActiveSessionByModule } = useGlobalSessionManager()
  const session = getActiveSessionByModule(moduleId)
  
  if (!session?.isActive) return null
  
  return (
    <div className="flex items-center space-x-1 text-blue-600">
      <LoadingOutlined className="animate-spin text-xs" />
      <span className="text-xs">回复中</span>
    </div>
  )
} 