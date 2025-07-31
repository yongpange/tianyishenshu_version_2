import { useState, useEffect, useCallback } from 'react'
import { message } from 'antd'
import { getUserPhoneNumber } from '@/utils/client-utils'
import { getUserConversations, saveConversation, deleteConversationFromSupabase } from '@/lib/user-manager'
import { generateConversationTitle } from '@/utils/textrank'
import { devLog } from '@/utils/dev-logger'

// 聊天消息接口
export interface ChatMessage {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
}

// 对话历史接口
export interface ConversationHistory {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: Date
  cozeConversationId?: string // Coze对话ID，用于保持对话连续性
  isPinned?: boolean // 是否置顶
  isManualTitle?: boolean // 是否为用户手动设置的标题
}

interface UseConversationHistoryProps {
  moduleId: string
}

export const useConversationHistory = ({ moduleId }: UseConversationHistoryProps) => {
  const [conversations, setConversations] = useState<ConversationHistory[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)

  // 获取存储键名
  const getStorageKey = useCallback(() => {
    return `${moduleId}_conversations`
  }, [moduleId])

  // 加载对话历史
  const loadConversations = useCallback(async () => {
    try {
      devLog.log(`🔄 加载${moduleId}模块的对话历史...`)
      
      // 先从localStorage加载
      const storageKey = getStorageKey()
      const localData = localStorage.getItem(storageKey)
      let localConversations: ConversationHistory[] = []
      
      if (localData) {
        try {
          localConversations = JSON.parse(localData).map((conv: any) => ({
            ...conv,
            createdAt: new Date(conv.createdAt),
            messages: conv.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          }))
          devLog.log(`📱 从localStorage加载了${localConversations.length}个对话`)
        } catch (error) {
          devLog.warn('⚠️ localStorage数据解析失败:', error)
          localConversations = []
        }
      }

      // 尝试从Supabase加载
      try {
        const userId = getUserPhoneNumber()
        if (userId) {
          const supabaseConversations = await getUserConversations(userId, moduleId)
          devLog.log(`☁️ 从Supabase加载了${supabaseConversations.length}个对话`)
          
          // 合并数据（以Supabase为准，但保留localStorage中的新数据）
          const mergedConversations = mergeConversations(localConversations, supabaseConversations)
          setConversations(mergedConversations)
          
          // 更新localStorage
          localStorage.setItem(storageKey, JSON.stringify(mergedConversations))
        } else {
          // 没有用户ID，只使用localStorage数据
          setConversations(localConversations)
        }
      } catch (error) {
        devLog.warn('⚠️ 从Supabase加载对话失败，使用localStorage数据:', error)
        setConversations(localConversations)
      }

    } catch (error) {
      devLog.error('❌ 加载对话历史失败:', error)
      setConversations([])
    }
  }, [moduleId, getStorageKey])

  // 合并对话数据
  const mergeConversations = (local: ConversationHistory[], remote: ConversationHistory[]): ConversationHistory[] => {
    const merged = [...remote]
    
    // 添加localStorage中有但Supabase中没有的对话
    local.forEach(localConv => {
      const existsInRemote = remote.some(remoteConv => remoteConv.id === localConv.id)
      if (!existsInRemote) {
        merged.push(localConv)
      }
    })
    
    return merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  // 重置聊天界面 - 不创建新对话，只刷新到初始状态
  const createNewConversation = useCallback(() => {
    devLog.log('🔄 重置聊天界面到初始状态...')
    
    // 重置为初始状态：清除活跃对话ID，显示欢迎界面
    setActiveConversationId(null)
    
    devLog.log('✅ 聊天界面已重置为初始状态')
    
    return null
  }, [])

  // 更新对话
  const updateConversation = useCallback((conversationId: string, updates: Partial<ConversationHistory>) => {
    setConversations(prev => {
      const updated = prev.map(conv => 
        conv.id === conversationId ? { ...conv, ...updates } : conv
      )
      
      // 保存到localStorage
      const storageKey = getStorageKey()
      localStorage.setItem(storageKey, JSON.stringify(updated))
      
      return updated
    })
  }, [getStorageKey])

  // 添加消息到对话
  const addMessageToConversation = useCallback((conversationId: string, message: ChatMessage) => {
    setConversations(prev => {
      const updated = prev.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            messages: [...conv.messages, message]
          }
        }
        return conv
      })
      
      // 保存到localStorage
      const storageKey = getStorageKey()
      localStorage.setItem(storageKey, JSON.stringify(updated))
      
      return updated
    })
  }, [getStorageKey])

  // 删除对话
  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      devLog.log('🗑️ 删除对话:', conversationId)
      
      // 从状态中移除
      setConversations(prev => {
        const filtered = prev.filter(conv => conv.id !== conversationId)
        
        // 更新localStorage
        const storageKey = getStorageKey()
        localStorage.setItem(storageKey, JSON.stringify(filtered))
        
        return filtered
      })
      
      // 如果删除的是当前活跃对话，清除活跃状态
      if (activeConversationId === conversationId) {
        setActiveConversationId(null)
      }
      
      // 尝试从Supabase删除
      try {
        const userId = getUserPhoneNumber()
        if (userId) {
          await deleteConversationFromSupabase(userId, conversationId)
          devLog.log('✅ 已从Supabase删除对话')
        }
      } catch (error) {
        devLog.warn('⚠️ 从Supabase删除对话失败，但本地已删除:', error)
      }
      
      message.success('对话已删除')
      
    } catch (error) {
      devLog.error('❌ 删除对话失败:', error)
      message.error('删除对话失败')
    }
  }, [activeConversationId, getStorageKey])

  // 置顶/取消置顶对话
  const pinConversation = useCallback((conversationId: string) => {
    setConversations(prev => {
      const updated = prev.map(conv => {
        if (conv.id === conversationId) {
          return { ...conv, isPinned: !conv.isPinned }
        }
        return conv
      })
      
      // 保存到localStorage
      const storageKey = getStorageKey()
      localStorage.setItem(storageKey, JSON.stringify(updated))
      
      return updated
    })
  }, [getStorageKey])

  // 重命名对话
  const renameConversation = useCallback((conversationId: string, newTitle: string) => {
    setConversations(prev => {
      const updated = prev.map(conv => {
        if (conv.id === conversationId) {
          return { 
            ...conv, 
            title: newTitle,
            isManualTitle: true // 标记为手动设置的标题
          }
        }
        return conv
      })
      
      // 保存到localStorage
      const storageKey = getStorageKey()
      localStorage.setItem(storageKey, JSON.stringify(updated))
      
      return updated
    })
  }, [getStorageKey])

  // 自动更新对话标题
  const updateConversationTitle = useCallback((conversationId: string, messages: ChatMessage[]) => {
    const conversation = conversations.find(conv => conv.id === conversationId)
    
    // 如果是手动设置的标题，不自动更新
    if (conversation?.isManualTitle) {
      return
    }
    
    // 如果消息数量足够，生成新标题
    if (messages.length >= 2) {
      try {
        const newTitle = generateConversationTitle(messages)
        if (newTitle && newTitle !== conversation?.title) {
          updateConversation(conversationId, { title: newTitle })
        }
      } catch (error) {
        devLog.warn('⚠️ 生成对话标题失败:', error)
      }
    }
  }, [conversations, updateConversation])

  // 保存对话到Supabase
  const saveConversationToSupabase = useCallback(async (conversation: ConversationHistory) => {
    try {
      const userId = getUserPhoneNumber()
      if (userId) {
        await saveConversation(userId, conversation)
        devLog.log('✅ 对话已保存到Supabase')
      }
    } catch (error) {
      devLog.warn('⚠️ 保存对话到Supabase失败，但不影响聊天功能:', error)
    }
  }, [])

  // 获取当前对话
  const getCurrentConversation = useCallback(() => {
    return conversations.find(conv => conv.id === activeConversationId)
  }, [conversations, activeConversationId])

  // 初始化时加载对话历史
  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  return {
    conversations,
    activeConversationId,
    setActiveConversationId,
    createNewConversation,
    updateConversation,
    addMessageToConversation,
    deleteConversation,
    pinConversation,
    renameConversation,
    updateConversationTitle,
    saveConversationToSupabase,
    getCurrentConversation,
    loadConversations
  }
}
