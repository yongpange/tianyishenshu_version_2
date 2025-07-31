import { useState, useCallback, useRef, useEffect } from 'react'
import { devLog } from '@/utils/dev-logger'
// 流式会话状态接口
interface StreamingSession {
  id: string
  moduleId: string
  conversationId: string
  dbConversationId?: string
  botMessageId: string
  reader?: ReadableStreamDefaultReader<Uint8Array>
  controller?: AbortController
  streamingContent: string
  finalConversationId?: string
  finalChatId?: string
  isActive: boolean
  startTime: number
}

// 存储键名
const SESSIONS_STORAGE_KEY = 'global_streaming_sessions'

// 全局会话管理器
class GlobalSessionManager {
  private sessions = new Map<string, StreamingSession>()
  private listeners = new Set<() => void>()

  constructor() {
    // 不再从localStorage恢复会话状态，避免SSR问题
  }

  // 添加监听器
  addListener(listener: () => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  // 通知所有监听器
  private notify() {
    this.listeners.forEach(listener => listener())
  }

  // 保存到localStorage（仅在客户端）
  private saveToStorage() {
    if (typeof window === 'undefined') return // 服务端跳过
    
    try {
      const sessionsData = Array.from(this.sessions.entries()).map(([id, session]) => ({
        id,
        moduleId: session.moduleId,
        conversationId: session.conversationId,
        dbConversationId: session.dbConversationId,
        botMessageId: session.botMessageId,
        streamingContent: session.streamingContent,
        finalConversationId: session.finalConversationId,
        finalChatId: session.finalChatId,
        isActive: session.isActive,
        startTime: session.startTime
        // 注意：不保存reader和controller，这些需要重新创建
      }))
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessionsData))
      devLog.log('💾 会话状态已保存到localStorage')
    } catch (error) {
      devLog.warn('⚠️ 保存会话状态到localStorage失败:', error)
    }
  }

  // 从localStorage加载（仅在客户端）
  public loadFromStorage() {
    if (typeof window === 'undefined') return // 服务端跳过
    
    try {
      const stored = localStorage.getItem(SESSIONS_STORAGE_KEY)
      if (stored) {
        const sessionsData = JSON.parse(stored)
        sessionsData.forEach((data: any) => {
          const session: StreamingSession = {
            id: data.id,
            moduleId: data.moduleId,
            conversationId: data.conversationId,
            dbConversationId: data.dbConversationId,
            botMessageId: data.botMessageId,
            streamingContent: data.streamingContent || '',
            finalConversationId: data.finalConversationId,
            finalChatId: data.finalChatId,
            isActive: data.isActive,
            startTime: data.startTime
          }
          this.sessions.set(data.id, session)
        })
        devLog.log('📖 从localStorage恢复了', sessionsData.length, '个会话')
      }
    } catch (error) {
      devLog.warn('⚠️ 从localStorage恢复会话状态失败:', error)
    }
  }

  // 创建新会话
  createSession(sessionId: string, moduleId: string, conversationId: string, botMessageId: string): StreamingSession {
    const session: StreamingSession = {
      id: sessionId,
      moduleId,
      conversationId,
      botMessageId,
      streamingContent: '',
      isActive: true,
      startTime: Date.now()
    }
    
    this.sessions.set(sessionId, session)
    this.saveToStorage()
    this.notify()
    devLog.log('🔄 创建新的流式会话:', sessionId)
    return session
  }

  // 更新会话
  updateSession(sessionId: string, updates: Partial<StreamingSession>) {
    const session = this.sessions.get(sessionId)
    if (session) {
      Object.assign(session, updates)
      this.saveToStorage()
      this.notify()
    }
  }

  // 获取会话
  getSession(sessionId: string): StreamingSession | undefined {
    return this.sessions.get(sessionId)
  }

  // 获取模块的活跃会话
  getActiveSessionByModule(moduleId: string): StreamingSession | undefined {
    return Array.from(this.sessions.values()).find(
      session => session.moduleId === moduleId && session.isActive
    )
  }

  // 结束会话
  endSession(sessionId: string) {
    const session = this.sessions.get(sessionId)
    if (session) {
      // 安全清理reader
      if (session.reader) {
        try {
          // 直接尝试释放，依赖try-catch处理各种状态
          session.reader.releaseLock()
          devLog.log('🧹 endSession: 流读取器已释放')
        } catch (error) {
          // 捕获并记录错误，但不让错误中断清理过程
          const errorMessage = error instanceof Error ? error.message : String(error)
          
          // 对于常见的错误类型，给出更友好的提示
          if (errorMessage.includes('Releasing Default reader') || 
              errorMessage.includes('Default reader') ||
              errorMessage.includes('already been released') ||
              errorMessage.includes('InvalidStateError')) {
            devLog.log('🔍 流读取器已处于释放状态或为默认状态，跳过释放')
          } else {
            devLog.warn('⚠️ endSession: 释放流读取器时出错（已忽略）:', errorMessage)
          }
        }
        session.reader = undefined
      }
      
      // 清理控制器
      if (session.controller) {
        try {
          // 检查控制器状态
          if (!session.controller.signal.aborted) {
            session.controller.abort()
            devLog.log('🧹 endSession: 控制器已中止')
          } else {
            devLog.log('🧹 endSession: 控制器已处于中止状态，跳过中止')
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          devLog.warn('⚠️ endSession: 中止控制器时出错（已忽略）:', errorMessage)
        }
        session.controller = undefined
      }
      
      session.isActive = false
      this.saveToStorage()
      this.notify()
      devLog.log('🔚 结束流式会话:', sessionId)
      
      // 延迟删除，给UI一些时间显示完成状态
      setTimeout(() => {
        this.sessions.delete(sessionId)
        this.saveToStorage()
        this.notify()
      }, 1000)
    }
  }

  // 暂停会话（页面切换时）
  pauseSession(sessionId: string) {
    const session = this.sessions.get(sessionId)
    if (session) {
      // 不中断reader，只标记为非活跃
      session.isActive = false
      this.saveToStorage()
      this.notify()
      devLog.log('⏸️ 暂停流式会话:', sessionId)
    }
  }

  // 恢复会话（回到页面时）
  resumeSession(sessionId: string) {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.isActive = true
      this.saveToStorage()
      this.notify()
      devLog.log('▶️ 恢复流式会话:', sessionId)
    }
  }

  // 清理所有会话
  clearAllSessions() {
    this.sessions.forEach((session, sessionId) => {
      this.endSession(sessionId)
    })
    // 清理localStorage（仅在客户端）
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSIONS_STORAGE_KEY)
    }
  }

  // 获取所有活跃会话
  getActiveSessions(): StreamingSession[] {
    return Array.from(this.sessions.values()).filter(session => session.isActive)
  }
}

// 全局单例
const globalSessionManager = new GlobalSessionManager()

// Hook
export const useGlobalSessionManager = () => {
  const [, forceUpdate] = useState({})
  
  useEffect(() => {
    // 在客户端初始化时加载localStorage数据
    globalSessionManager.loadFromStorage()
    
    const unsubscribe = globalSessionManager.addListener(() => {
      forceUpdate({})
    })
    return unsubscribe
  }, [])

  const createSession = useCallback((sessionId: string, moduleId: string, conversationId: string, botMessageId: string) => {
    return globalSessionManager.createSession(sessionId, moduleId, conversationId, botMessageId)
  }, [])

  const updateSession = useCallback((sessionId: string, updates: Partial<StreamingSession>) => {
    globalSessionManager.updateSession(sessionId, updates)
  }, [])

  const getSession = useCallback((sessionId: string) => {
    return globalSessionManager.getSession(sessionId)
  }, [])

  const getActiveSessionByModule = useCallback((moduleId: string) => {
    return globalSessionManager.getActiveSessionByModule(moduleId)
  }, [])

  const endSession = useCallback((sessionId: string) => {
    globalSessionManager.endSession(sessionId)
  }, [])

  const pauseSession = useCallback((sessionId: string) => {
    globalSessionManager.pauseSession(sessionId)
  }, [])

  const resumeSession = useCallback((sessionId: string) => {
    globalSessionManager.resumeSession(sessionId)
  }, [])

  const clearAllSessions = useCallback(() => {
    globalSessionManager.clearAllSessions()
  }, [])

  const getActiveSessions = useCallback(() => {
    return globalSessionManager.getActiveSessions()
  }, [])

  const loadFromStorage = useCallback(() => {
    globalSessionManager.loadFromStorage()
  }, [])

  return {
    createSession,
    updateSession,
    getSession,
    getActiveSessionByModule,
    endSession,
    pauseSession,
    resumeSession,
    clearAllSessions,
    getActiveSessions,
    loadFromStorage
  }
}

export type { StreamingSession } 