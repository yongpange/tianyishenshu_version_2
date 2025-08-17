'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { devLog } from '@/utils/dev-logger'
import { useRouter } from 'next/navigation'
import Breadcrumb, { BREADCRUMB_CONFIGS } from '@/components/Breadcrumb'
import { handleBackToDashboard as handleBackToDashboardUtil } from '@/utils/navigation-helper'
import {
  Button,
  Input,
  Typography,
  Drawer,
  Spin,
  Alert,
  Dropdown,
  Modal,
  message
} from 'antd'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  SendOutlined,
  PlusOutlined,
  UserOutlined,
  RobotOutlined,
  MenuOutlined,
  LoadingOutlined,
  FileTextOutlined,
  MessageOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  PushpinOutlined,
  PushpinFilled,
  CopyOutlined,
  CheckOutlined,
  DownOutlined,
  ArrowUpOutlined
} from '@ant-design/icons'
import {
  getUserPhoneNumber,
  formatUserInfoDisplay,
  formatAreaDisplay,
  getActiveUser
} from '@/utils/client-utils'
import { ReportModuleConfig } from '@/config/reportModules'
// 移除全局会话管理器，改用本地状态管理
import { SessionStatusIndicator } from '@/components/SessionStatusIndicator'
import FudeIcon from '@/components/icons/FudeIcon'
import MingjuIcon from '@/components/icons/MingjuIcon'
import CailuIcon from '@/components/icons/CailuIcon' 
import YuanxiIcon from '@/components/icons/YuanxiIcon'
import ShouluIcon from '@/components/icons/ShouluIcon'
import YundaoIcon from '@/components/icons/YundaoIcon'

const { TextArea } = Input
const { Title, Text, Paragraph } = Typography

interface ChatMessage {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
  displayContent?: string // 用于显示的过滤内容
}

interface ConversationHistory {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: Date
  cozeConversationId?: string
  isPinned?: boolean
  isManualTitle?: boolean
  moduleType?: string
  dbConversationId?: string
  messagesLoaded?: boolean
  messagesLoadError?: boolean
}

type ContentType = 'chat' | 'report'

interface PageTemplateProps {
  moduleConfig: ReportModuleConfig
}

export default function PageTemplate({ moduleConfig }: PageTemplateProps) {
  const [userInfo, setUserInfo] = useState<any>(null)
  const [currentContent, setCurrentContent] = useState<ContentType>('chat')
  const [conversations, setConversations] = useState<ConversationHistory[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [currentMessage, setCurrentMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  
  // 移除全局会话管理器，改用本地状态
  
  // 简化状态管理，不再需要复杂的会话ID生成
  
  // 流式响应相关状态
  const [currentStreamingContent, setCurrentStreamingContent] = useState<string>('')
  const [currentBotMessageId, setCurrentBotMessageId] = useState<string | null>(null)
  const [currentDbConversationId, setCurrentDbConversationId] = useState<string | null>(null)

  const [drawerVisible, setDrawerVisible] = useState(false)

  const [reportContent, setReportContent] = useState<string | null>(null)
  const [reportLoading, setReportLoading] = useState(true)
  const [reportError, setReportError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // 异步生成相关状态
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationStatus, setGenerationStatus] = useState('')
  
  // Chat功能可用性状态
  const [chatAvailable, setChatAvailable] = useState(false)
  const [chatDisabledReason, setChatDisabledReason] = useState('')
  const [taskId, setTaskId] = useState<string | null>(null)

  // 中间聊天记录区域的显示/隐藏
  const [chatHistoryVisible, setChatHistoryVisible] = useState(true)

  // 触摸手势状态
  const [touchStart, setTouchStart] = useState<{x: number, y: number} | null>(null)

  // 本地流式响应状态管理
  const [currentReader, setCurrentReader] = useState<ReadableStreamDefaultReader<Uint8Array> | null>(null)
  
  // 跟踪正在进行流式输出的对话ID
  const [streamingConversationId, setStreamingConversationId] = useState<string | null>(null)
  
  // 防止重复保存的标记
  const [savedMessageIds, setSavedMessageIds] = useState<Set<string>>(new Set())

  // 组件卸载时安全清理reader
  useEffect(() => {
    return () => {
      if (currentReader) {
        try {
          currentReader.releaseLock()
          devLog.log('🧹 组件卸载时安全释放reader')
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          // 对于常见的错误类型，静默处理
          if (errorMessage.includes('Releasing Default reader') || 
              errorMessage.includes('Default reader') ||
              errorMessage.includes('already been released') ||
              errorMessage.includes('InvalidStateError')) {
            devLog.log('🧹 组件卸载时reader已释放，跳过')
          } else {
            devLog.log('🧹 组件卸载时释放reader出错（已忽略）:', errorMessage)
          }
        }
      }
    }
  }, [currentReader])

  // 简化的初始化逻辑
  useEffect(() => {
    devLog.log(`🔄 ${moduleConfig.title}页面初始化完成`)
  }, [moduleConfig.moduleId])
  
  // 对话历史加载状态
  const [conversationsLoading, setConversationsLoading] = useState(true)

  // 智能滚动状态
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true)
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const [lastScrollTop, setLastScrollTop] = useState(0)

  // 对话管理相关状态
  const [renameModalVisible, setRenameModalVisible] = useState(false)
  const [renamingConversationId, setRenamingConversationId] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  
  // 对话显示数量控制
  const [visibleConversationsCount, setVisibleConversationsCount] = useState(5)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const conversationListRef = useRef<HTMLDivElement>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // 滚动检测常量
  const BOTTOM_THRESHOLD = 100
  const SCROLL_DEBOUNCE = 150
  const USER_SCROLL_THRESHOLD = 5

  // 检测是否接近底部
  const isNearBottom = useCallback((element: HTMLElement | null): boolean => {
    if (!element) return false
    const { scrollTop, scrollHeight, clientHeight } = element
    return scrollHeight - scrollTop <= clientHeight + BOTTOM_THRESHOLD
  }, [BOTTOM_THRESHOLD])

  // 检测用户是否主动滚动
  const detectUserScroll = useCallback((currentScrollTop: number): boolean => {
    const scrollDiff = Math.abs(currentScrollTop - lastScrollTop)
    return scrollDiff > USER_SCROLL_THRESHOLD
  }, [lastScrollTop, USER_SCROLL_THRESHOLD])

  // 滚动到底部
  const scrollToBottom = useCallback((smooth: boolean = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end'
      })
    }
  }, [])

  // 处理滚动事件
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget
    const currentScrollTop = element.scrollTop

    if (detectUserScroll(currentScrollTop)) {
      setIsUserScrolling(true)

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      scrollTimeoutRef.current = setTimeout(() => {
        setIsUserScrolling(false)
      }, SCROLL_DEBOUNCE)
    }

    const nearBottom = isNearBottom(element)

    if (nearBottom) {
      setIsAutoScrollEnabled(true)
      setShowScrollToBottom(false)
    } else {
      setIsAutoScrollEnabled(false)
      setShowScrollToBottom(true)
    }

    setLastScrollTop(currentScrollTop)
  }, [detectUserScroll, isNearBottom, SCROLL_DEBOUNCE])

  // 智能自动滚动
  const smartAutoScroll = useCallback(() => {
    if (isAutoScrollEnabled && !isUserScrolling) {
      requestAnimationFrame(() => {
        scrollToBottom(true)
      })
    }
  }, [isAutoScrollEnabled, isUserScrolling, scrollToBottom])

  // 监听对话消息变化，执行智能滚动
  useEffect(() => {
    const currentConv = conversations.find(conv => conv.id === activeConversationId)
    if (currentConv && currentConv.messages.length > 0) {
      setTimeout(() => {
        smartAutoScroll()
      }, 50)
    }
  }, [conversations, activeConversationId, smartAutoScroll])

  // 处理"回到底部"按钮点击
  const handleScrollToBottomClick = useCallback(() => {
    setIsAutoScrollEnabled(true)
    setShowScrollToBottom(false)
    setIsUserScrolling(false)
    scrollToBottom(true)
  }, [scrollToBottom])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  // 轮询报告生成状态
  const pollReportStatus = async (userId: string, taskId: string) => {
    try {
      const isUserProfileId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)
      
      const response = await fetch(`${moduleConfig.apiEndpoint}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId, 
          taskId,
          isUserProfileId: isUserProfileId
        })
      })

      const result = await response.json()

      if (result.success) {
        setGenerationProgress(result.progress)

        switch (result.status) {
          case 'generating':
            setGenerationStatus(`天乙深度分析中，道友稍后~`)
            setIsGenerating(true)
            break

          case 'completed':
            setGenerationStatus('报告生成完成！')
            setIsGenerating(false)
            
            // 如果返回了内容，直接设置；否则重新加载
            if (result.content) {
              devLog.log('🎯 PageTemplate轮询中直接获取报告内容')
              setReportContent(result.content)
              setReportLoading(false)
              setReportError(null) // 清除错误状态
              setChatAvailable(true) // 报告完成后启用聊天功能
              setChatDisabledReason('')
              setGenerationProgress(0)
              setTaskId(null)
            } else {
              // 重新加载报告以获取最新内容
              setTimeout(async () => {
                devLog.log('🔄 PageTemplate轮询完成，重新加载报告')
                await loadReport()
                // 重置生成状态
                setIsGenerating(false)
                setReportError(null) // 清除错误状态
                setGenerationProgress(0)
                setGenerationStatus('')
                setTaskId(null)
                setChatAvailable(true) // 报告完成后启用聊天功能
                setChatDisabledReason('')
              }, 1000)
            }

            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current)
              pollingIntervalRef.current = null
            }

            message.success(`${moduleConfig.title}1报告生成完成！`)
            break

          case 'failed':
            setGenerationStatus('报告生成失败')
            setIsGenerating(false)
            setReportError('报告生成失败，请联系管理员重新生成~')
            setReportLoading(false)
            setGenerationProgress(0)
            setTaskId(null)

            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current)
              pollingIntervalRef.current = null
            }
            
            message.error('报告生成失败，请联系管理员重新生成')
            break
        }
      } else {
        setReportError(result.error || '查询状态失败')
        
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
      }
    } catch (error) {
      devLog.error('❌ 轮询请求失败:', error)
      setReportError('网络错误，请刷新页面重试')
      
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }

  // 开始轮询
  const startPolling = (userId: string, taskId: string) => {
    pollReportStatus(userId, taskId)
    devLog.log('⏰ 开始每30秒轮询报告生成状态')

    pollingIntervalRef.current = setInterval(() => {
      devLog.log('🔄 执行定时查询报告状态...')
      pollReportStatus(userId, taskId)
    }, 30000) // 改为每30秒查询一次
  }

  // 停止轮询
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }

  // 加载报告
  const loadReport = async () => {
    try {
      setReportLoading(true)
      setReportError(null)

      const activeUser = getActiveUser()
      let reportUserId: string
      let isUserProfileId = false

      if (activeUser && activeUser.id) {
        reportUserId = activeUser.id
        isUserProfileId = true
      } else {
        const searchParams = new URLSearchParams(window.location.search)
        const urlUserId = searchParams.get('userId')
        
        if (urlUserId) {
          reportUserId = urlUserId
          isUserProfileId = true
        } else {
          const phoneNumber = getUserPhoneNumber()
          if (!phoneNumber) {
            setReportError('未找到用户信息，请重新登录')
            return
          }
          reportUserId = phoneNumber
        }
      }

      const response = await fetch(`${moduleConfig.apiEndpoint}/get`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: reportUserId,
          isUserProfileId: isUserProfileId
        })
      })

      const result = await response.json()
      
      devLog.log('📋 PageTemplate API响应结果 (详细):', { 
        success: result.success, 
        error: result.error, 
        status: result.status,
        taskId: result.taskId,
        hasReport: !!result.report,
        reportContentLength: result.report?.content?.length || 0,
        reportUserId: reportUserId,
        isUserProfileId: isUserProfileId,
        apiEndpoint: moduleConfig.apiEndpoint,
        fullResult: result
      })

      // 优先检查status状态，而不是先检查content
      if (result.status === 'completed' && result.success && result.report && result.report.content) {
        setReportContent(result.report.content)
        // ✅ 报告存在且有内容，启用chat功能
        setChatAvailable(true)
        setChatDisabledReason('')
        setReportLoading(false)
        setIsGenerating(false)
        devLog.log('✅ 报告加载成功，chat功能已启用')
      } else if (result.status === 'generating') {
        // 报告正在生成中，启动轮询
        devLog.log('🔄 检测到generating状态，启动轮询机制:', { reportUserId })
        setReportError(`您的${moduleConfig.title}报告正在生成中，预计等待三分钟。`)
        setChatDisabledReason('报告正在生成中，请等待生成完成后使用聊天功能')
        setChatAvailable(false)
        
        // 启动轮询机制监控生成状态
        setIsGenerating(true)
        setGenerationStatus(`天乙深度分析中，道友稍后~`)
        setReportLoading(true)
        startPolling(reportUserId, result.taskId || 'auto-generated')
      } else if (result.status === 'failed') {
        // 数据库中有数据但status为failed
        devLog.log('❌ 报告生成失败:', { reportUserId })
        setReportError('报告生成失败，请联系管理员重新生成~')
        setChatDisabledReason('报告生成失败，请重新生成后使用聊天功能')
        setChatAvailable(false)
        setReportLoading(false)
        setIsGenerating(false)
      } else {
        // ❌ 报告不可用，禁用chat功能
        devLog.log('❌ 报告不可用，chat功能已禁用:', result.status || '无报告')
        setChatAvailable(false)
        setReportError('报告生成失败，请联系管理员重新生成~')
        setChatDisabledReason('报告不存在，请先生成报告后使用聊天功能')
        setReportLoading(false)
        setIsGenerating(false)
      }
    } catch (error) {
      devLog.error('❌ 加载报告失败:', error)
      setReportError('加载报告失败，请稍后重试')
    } finally {
      setReportLoading(false)
    }
  }

  // 复制报告内容
  const copyReport = async () => {
    if (!reportContent) return

    const { copyReport: copyReportHelper } = await import('@/utils/copy-helper')
    const success = await copyReportHelper(reportContent, moduleConfig.reportTitle || '报告')
    
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // 重新生成报告
  const regenerateReport = async () => {
    try {
      if (!userInfo) {
        message.error('用户信息缺失，请刷新页面重试')
        return
      }

      const activeUser = getActiveUser()
      let reportUserId: string
      let isUserProfileId = false

      if (activeUser && activeUser.id) {
        reportUserId = activeUser.id
        isUserProfileId = true
      } else {
        const phoneNumber = getUserPhoneNumber()
        if (!phoneNumber) {
          message.error('未找到用户信息，请重新登录')
          return
        }
        reportUserId = phoneNumber
      }

      setIsGenerating(true)
      setGenerationStatus(`正在重新生成${moduleConfig.title}报告...`)
      setReportLoading(true)
      setReportError(null)
      setCurrentContent('report')
      setGenerationProgress(0)

      const response = await fetch(`${moduleConfig.apiEndpoint}/generate-async`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userInfo,
          userId: reportUserId,
          isUserProfileId: isUserProfileId
        })
      })

      const result = await response.json()

      if (result.success) {
        if (result.taskId === 'existing') {
          setIsGenerating(false)
          loadReport()
        } else {
          setTaskId(result.taskId)
          startPolling(reportUserId, result.taskId)
        }
        
        message.success('已启动报告重新生成')
      } else {
        throw new Error(result.error || '启动报告生成失败')
      }

    } catch (error) {
      devLog.error('❌ 重新生成报告失败:', error)
      message.error(error instanceof Error ? error.message : '重新生成失败，请稍后重试')
      setIsGenerating(false)
      setReportLoading(false)
      setReportError('重新生成失败，请稍后重试')
    }
  }

  // 加载单个对话的消息
  const loadConversationMessages = async (conversationId: string, dbConversationId: string) => {
    try {
      const messagesResponse = await fetch('/api/messages/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: dbConversationId
        })
      })

      const messagesResult = await messagesResponse.json()
      
      let chatMessages: ChatMessage[] = []
      if (messagesResult.success && messagesResult.messages) {
        chatMessages = messagesResult.messages.map((dbMsg: any) => ({
          id: dbMsg.metadata?.frontend_id || dbMsg.id,
          type: dbMsg.role === 'user' ? 'user' : 'bot',
          content: dbMsg.content,
          timestamp: new Date(dbMsg.created_at),
          // 为bot消息添加显示内容过滤
          displayContent: dbMsg.role === 'assistant' || dbMsg.role === 'bot' 
            ? extractDisplayContent(dbMsg.content) 
            : undefined
        }))
      }

      // 更新特定对话的消息
      setConversations(prevConversations =>
        prevConversations.map(conv => 
          conv.id === conversationId 
            ? { ...conv, messages: chatMessages, messagesLoaded: true }
            : conv
        )
      )

      devLog.log(`✅ 加载对话 ${conversationId} 的消息成功:`, chatMessages.length, '条')
      return chatMessages

    } catch (error) {
      devLog.error(`❌ 加载对话 ${conversationId} 的消息失败:`, error)
      
      // 标记加载失败
      setConversations(prevConversations =>
        prevConversations.map(conv => 
          conv.id === conversationId 
            ? { ...conv, messagesLoaded: true, messagesLoadError: true }
            : conv
        )
      )
      
      return []
    }
  }



  // 手动加载更多对话
  const loadMoreConversations = () => {
    setVisibleConversationsCount(prev => prev + 5)
  }

  // 处理对话选择，包括按需加载消息
  const handleConversationSelect = useCallback(async (conversation: ConversationHistory, closeMobile = false) => {
    // 直接切换到选中的对话（允许自由切换查看历史对话）
    setActiveConversationId(conversation.id)
    setCurrentContent('chat')
    
    if (closeMobile) {
      setDrawerVisible(false)
    }
    
    devLog.log('🔄 切换到对话:', conversation.title, {
      isCurrentlyGenerating: currentReader || isTyping,
      note: '流式输出状态保持独立，不受对话切换影响'
    })
    
    // 如果该对话的消息尚未加载，立即加载（但不要影响正在进行流式输出的对话）
    if (!conversation.messagesLoaded && !conversation.messagesLoadError && conversation.dbConversationId) {
      // 🚨 关键修复：如果这个对话正在进行流式输出，不要重新加载消息
      if (streamingConversationId === conversation.id) {
        devLog.log('🚨 跳过重新加载消息：对话正在进行流式输出', conversation.title)
        return
      }
      
      devLog.log('🎯 选择对话，立即加载消息:', conversation.title)
      try {
        await loadConversationMessages(conversation.id, conversation.dbConversationId)
      } catch (error) {
        devLog.warn('⚠️ 选择对话时加载消息失败:', error)
      }
    }
  }, [loadConversationMessages, currentReader, isTyping])

  // 优化的对话历史加载
  const loadConversations = async () => {
    try {
      setConversationsLoading(true)
      
      const activeUser = getActiveUser()
      let userProfileId: string | null = null
      
      if (activeUser && activeUser.id) {
        userProfileId = activeUser.id
      } else {
        devLog.warn('⚠️ 无法获取用户资料ID，跳过对话历史加载')
        setConversationsLoading(false)
        return
      }

      devLog.log('🚀 快速加载对话列表...')

      const conversationsResponse = await fetch('/api/conversations/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userProfileId: userProfileId,
          moduleType: moduleConfig.moduleId
        })
      })

      const conversationsResult = await conversationsResponse.json()

      if (!conversationsResult.success) {
        throw new Error(conversationsResult.message || '获取对话列表失败')
      }

      const dbConversations = conversationsResult.conversations || []
      
      // 📋 第一步：立即加载所有对话的基础信息（不含消息）
      const formattedConversations = dbConversations.map((dbConv: any) => ({
        id: `frontend_${dbConv.id}`,
        dbConversationId: dbConv.id,
        title: dbConv.title,
        messages: [], // 先设为空数组
        createdAt: new Date(dbConv.created_at),
        cozeConversationId: dbConv.coze_conversation_id,
        isPinned: dbConv.is_pinned,
        isManualTitle: dbConv.is_manual_title,
        moduleType: dbConv.module_type,
        messagesLoaded: false, // 标记消息是否已加载
        messagesLoadError: false
      }))

      // 立即设置对话列表，让用户能马上看到
      setConversations(formattedConversations)
      setConversationsLoading(false)
      devLog.log('✅ 对话列表加载完成:', formattedConversations.length, '个对话')

      // 📱 第二步：异步加载最新5个对话的消息（包括置顶）
      const sortedConversations = [...formattedConversations].sort((a, b) => {
        // 置顶的对话优先
        if (a.isPinned && !b.isPinned) return -1
        if (!a.isPinned && b.isPinned) return 1
        // 然后按时间排序
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })

      const priorityConversations = sortedConversations.slice(0, 5)
      
      devLog.log('⚡ 开始异步加载优先对话的消息...')
      
      // 并发加载前5个对话的消息
      const loadPriorityMessages = priorityConversations.map(async (conv) => {
        try {
          await loadConversationMessages(conv.id, conv.dbConversationId)
        } catch (error) {
          devLog.warn(`⚠️ 加载优先对话 ${conv.id} 失败:`, error)
        }
      })

      // 不等待这些加载完成，让它们在后台运行
      Promise.all(loadPriorityMessages).then(() => {
        devLog.log('✅ 优先对话消息加载完成')
      }).catch(error => {
        devLog.warn('⚠️ 部分优先对话消息加载失败:', error)
      })

    } catch (error) {
      devLog.error('❌ 从数据库加载对话历史失败:', error)
      
      try {
        const savedConversations = localStorage.getItem(`${moduleConfig.moduleId}_conversations`)
        if (savedConversations) {
          const conversations = JSON.parse(savedConversations)
          const fixedConversations = conversations.map((conv: any) => ({
            ...conv,
            createdAt: new Date(conv.createdAt),
            messages: conv.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          }))
          setConversations(fixedConversations)
        }
      } catch (localError) {
        devLog.error('❌ 从本地存储加载对话历史也失败:', localError)
      }
    } finally {
      setConversationsLoading(false)
    }
  }

  // 初始化用户信息和数据
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const urlTaskId = urlParams.get('taskId')
    const isGeneratingParam = urlParams.get('generating') === 'true'
    const urlUserId = urlParams.get('userId')

    const userData = localStorage.getItem('userData')

    if (userData) {
      try {
        const parsedUserData = JSON.parse(userData)
        setUserInfo(parsedUserData)
      } catch (error) {
        devLog.error('❌ 解析用户信息失败:', error)
        router.push('/profile')
        return
      }
    } else {
      devLog.warn('⚠️ 未找到用户信息，跳转到个人信息页')
      router.push('/profile')
      return
    }

    let pollingUserId: string
    const activeUser = getActiveUser()
    
    if (activeUser && activeUser.id) {
      pollingUserId = activeUser.id
    } else if (urlUserId) {
      pollingUserId = urlUserId
    } else {
      const phoneNumber = getUserPhoneNumber()
      if (!phoneNumber) {
        devLog.error('❌ 无法获取用户手机号')
        router.push('/login')
        return
      }
      pollingUserId = phoneNumber
    }

    if (isGeneratingParam && urlTaskId) {
      setTaskId(urlTaskId)
      setIsGenerating(true)
      setGenerationStatus(`天乙深度分析中，道友稍后~`)
      setReportLoading(true)
      startPolling(pollingUserId, urlTaskId)
    } else {
      loadReport()
    }

    loadConversations()
    // 重置显示数量
    setVisibleConversationsCount(5)

    return () => {
      stopPolling()
    }
  }, [router])

  // 监听用户切换，重新加载数据
  useEffect(() => {
    const handleUserSwitched = () => {
      setReportLoading(true)
      setReportError(null)
      setIsGenerating(false)
      setConversationsLoading(true)
      
      stopPolling()
      
      const activeUser = getActiveUser()
      if (activeUser) {
        setUserInfo({
          nickname: activeUser.name,
          gender: activeUser.gender,
          year: activeUser.year,
          month: activeUser.month,
          day: activeUser.day,
          hour: activeUser.hour,
          minute: activeUser.minute,
          area: {
            province: activeUser.area_province,
            city: activeUser.area_city,
            district: activeUser.area_district
          }
        })
        
        loadReport()
        loadConversations()
        // 重置显示数量
        setVisibleConversationsCount(5)
      }
    }

    window.addEventListener('userSwitched', handleUserSwitched)

    return () => {
      window.removeEventListener('userSwitched', handleUserSwitched)
    }
  }, [])

  // +新对话按钮：如果有正在生成的对话则警告，没有则创建新对话
  const handleNewConversationButton = async () => {
    if (!userInfo) {
      alert('请先完善个人信息后再开始对话')
      return
    }

    // +新对话按钮在有流式输出时显示警告
    if (currentReader || isTyping) {
      message.warning('当前有对话正在进行中，请等待完成后再新建对话')
      return
    }

    // 没有正在生成的对话，创建新对话
    setActiveConversationId(null)
    setCurrentContent('chat')
    // 重置显示数量，确保新对话可见
    setVisibleConversationsCount(5)
    devLog.log('🆕 创建新对话')
  }

  // 智能对话处理：有正在生成的对话则跳转，没有则创建新对话
  const createNewConversation = async () => {
    if (!userInfo) {
      alert('请先完善个人信息后再开始对话')
      return
    }

    // 如果有正在生成的对话，切换到正在进行流式输出的对话
    if (currentReader || isTyping) {
      if (streamingConversationId) {
        setActiveConversationId(streamingConversationId)
        devLog.log('🔄 切换到正在进行流式输出的对话:', streamingConversationId)
      }
      setCurrentContent('chat')
      return
    }

    // 没有正在生成的对话，创建新对话
    setActiveConversationId(null)
    setCurrentContent('chat')
    // 重置显示数量，确保新对话可见
    setVisibleConversationsCount(5)
    devLog.log('🆕 创建新对话')
  }

  // 更新对话标题
  const updateConversationTitle = async (conversationId: string, messages: ChatMessage[], currentConversations: ConversationHistory[]) => {
    if (messages.length >= 1) {
      const currentConv = currentConversations.find(conv => conv.id === conversationId)
      if (currentConv?.isManualTitle) {
        return
      }

      if (currentConv?.title && currentConv.title !== '新对话') {
        return
      }

      const firstUserMessage = messages.find(msg => msg.type === 'user')
      if (!firstUserMessage) {
        return
      }

      let title = firstUserMessage.content.trim()
      if (title.length > 20) {
        title = title.substring(0, 20) + '...'
      }

      const updatedConversations = currentConversations.map(conv => {
        if (conv.id === conversationId) {
          return { ...conv, title }
        }
        return conv
      })

      setConversations(updatedConversations)
      localStorage.setItem(`${moduleConfig.moduleId}_conversations`, JSON.stringify(updatedConversations))

      if (currentConv?.dbConversationId) {
        const updateDatabase = async () => {
          try {
            const updateResponse = await fetch('/api/conversations/update', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                conversationId: currentConv.dbConversationId,
                title: title,
                isManualTitle: false
              })
            })

            const updateResult = await updateResponse.json()

            if (!updateResult.success) {
              devLog.warn('⚠️ 对话标题数据库更新失败:', updateResult.message)
            }

          } catch (error) {
            devLog.error('❌ 异步更新对话标题失败:', error)
          }
        }

        updateDatabase()
      }
    }
  }

  // 置顶对话
  const pinConversation = async (conversationId: string) => {
    try {
      const conversation = conversations.find(conv => conv.id === conversationId)
      if (!conversation?.dbConversationId) {
        message.error('操作失败：对话信息错误')
        return
      }

      const newPinnedStatus = !conversation.isPinned

      const updateResponse = await fetch('/api/conversations/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: conversation.dbConversationId,
          isPinned: newPinnedStatus
        })
      })

      const updateResult = await updateResponse.json()

      if (!updateResult.success) {
        throw new Error(updateResult.message || '更新置顶状态失败')
      }

      const updatedConversations = conversations.map(conv => {
        if (conv.id === conversationId) {
          return { ...conv, isPinned: newPinnedStatus }
        }
        return conv
      })

      setConversations(updatedConversations)
      localStorage.setItem(`${moduleConfig.moduleId}_conversations`, JSON.stringify(updatedConversations))

      message.success(newPinnedStatus ? '已置顶' : '已取消置顶')

    } catch (error) {
      devLog.error('❌ 更新置顶状态失败:', error)
      message.error(`操作失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 开始重命名对话
  const startRenameConversation = (conversationId: string, currentTitle: string) => {
    setRenamingConversationId(conversationId)
    setNewTitle(currentTitle)
    setRenameModalVisible(true)
  }

  // 确认重命名对话
  const confirmRenameConversation = async () => {
    if (!renamingConversationId || !newTitle.trim()) {
      return
    }

    try {
      const conversation = conversations.find(conv => conv.id === renamingConversationId)
      if (!conversation?.dbConversationId) {
        message.error('重命名失败：对话信息错误')
        return
      }

      const updateResponse = await fetch('/api/conversations/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: conversation.dbConversationId,
          title: newTitle.trim(),
          isManualTitle: true
        })
      })

      const updateResult = await updateResponse.json()

      if (!updateResult.success) {
        throw new Error(updateResult.message || '重命名失败')
      }

      const updatedConversations = conversations.map(conv => {
        if (conv.id === renamingConversationId) {
          return { 
            ...conv, 
            title: newTitle.trim(),
            isManualTitle: true
          }
        }
        return conv
      })

      setConversations(updatedConversations)
      localStorage.setItem(`${moduleConfig.moduleId}_conversations`, JSON.stringify(updatedConversations))

      setRenameModalVisible(false)
      setRenamingConversationId(null)
      setNewTitle('')
      message.success('重命名成功')

    } catch (error) {
      devLog.error('❌ 重命名对话失败:', error)
      message.error(`重命名失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 删除对话
  const deleteConversation = async (conversationId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个对话吗？删除后无法恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        return new Promise<void>((resolve) => {
          const conversationToDelete = conversations.find(conv => conv.id === conversationId)
          if (!conversationToDelete) {
            message.error('删除失败：对话不存在')
            resolve()
            return
          }

          const updatedConversations = conversations.filter(conv => conv.id !== conversationId)
          setConversations(updatedConversations)
          localStorage.setItem(`${moduleConfig.moduleId}_conversations`, JSON.stringify(updatedConversations))

          if (activeConversationId === conversationId) {
            if (updatedConversations.length > 0) {
              setActiveConversationId(updatedConversations[0].id)
            } else {
              setActiveConversationId(null)
            }
          }

          const performDatabaseDelete = async () => {
            if (conversationToDelete.dbConversationId) {
              try {
                const activeUser = getActiveUser()
                if (!activeUser?.id) {
                  return
                }

                const deleteResponse = await fetch('/api/conversations/delete', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    conversationId: conversationToDelete.dbConversationId,
                    userProfileId: activeUser.id
                  })
                })

                const deleteResult = await deleteResponse.json()

                if (!deleteResult.success) {
                  devLog.warn('⚠️ 数据库删除失败，但页面已更新:', deleteResult.message)
                }

              } catch (error) {
                devLog.error('❌ 数据库删除失败:', error)
              }
            }
          }

          setTimeout(async () => {
            performDatabaseDelete()
            resolve()
            
            setTimeout(() => {
              message.success('删除成功')
            }, 100)
          }, 100)
        })
      }
    })
  }

  // 发送消息
  const sendMessage = async () => {
    if (!currentMessage.trim()) {
      return
    }
    
    // 🚫 检查chat功能是否可用
    if (!chatAvailable) {
      message.warning({
        content: chatDisabledReason || '聊天功能暂不可用，请稍后重试',
        duration: 4
      })
      return
    }

    const activeUser = getActiveUser()
    
    // 🔒 检查是否有活跃的流式响应
    if (currentReader || isTyping) {
      message.warning('当前有会话正在进行中，请等待完成后再试')
      return
    }

    if (!userInfo) {
      alert('用户信息缺失，请先完善个人信息')
      return
    }
    if (!activeUser?.id) {
      alert('无法获取用户信息，请重新登录')
      return
    }

    // 检查用户聊天剩余次数
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data: userProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('chat_remaining_count')
        .eq('id', activeUser.id)
        .single()

      if (fetchError) {
        message.error('无法获取用户信息，请重试')
        return
      }

      if (!userProfile) {
        message.error('用户资料不存在，请重新登录')
        return
      }

      if (userProfile.chat_remaining_count <= 0) {
        message.warning({
          content: '您的聊天次数已用完，请联系客服充值后继续使用',
          duration: 6
        })
        return
      }
    } catch (error) {
      devLog.error('❌ 检查聊天次数失败:', error)
      message.error('检查聊天权限失败，请重试')
      return
    }

    setLoading(true)

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: currentMessage.trim(),
      timestamp: new Date()
    }

    const messageContent = currentMessage.trim()
    setCurrentMessage('')

    let currentActiveConversationId = activeConversationId
    let workingConversations = [...conversations]

    // 检查是否需要创建新对话
    if (!activeConversationId) {
      const tempId = Date.now().toString()
      const newConversation: ConversationHistory = {
        id: tempId,
        title: '新对话',
        messages: [],
        createdAt: new Date(),
        moduleType: moduleConfig.moduleId
      }

      workingConversations = [newConversation, ...conversations]
      currentActiveConversationId = newConversation.id
      
      // 重置显示数量，确保新对话可见
      setVisibleConversationsCount(5)
    }

    // 立即显示用户消息并更新标题
    const isFirstMessageInNewConversation = workingConversations.find(conv => conv.id === currentActiveConversationId)?.messages.length === 0
    
    let newTitle = ''
    if (isFirstMessageInNewConversation) {
      newTitle = userMessage.content.trim()
      if (newTitle.length > 20) {
        newTitle = newTitle.substring(0, 20) + '...'
      }
    }
    
    // 立即创建空的AI消息，等待第一个内容块
    const typingMessageId = (Date.now() + 1).toString()
    const typingMessage: ChatMessage = {
      id: typingMessageId,
      type: 'bot',
      content: '',
      timestamp: new Date()
    }

    // 一次性更新：添加用户消息和空的AI消息
    const finalConversations = workingConversations.map(conv => {
      if (conv.id === currentActiveConversationId) {
        return {
          ...conv,
          title: isFirstMessageInNewConversation ? newTitle : conv.title,
          messages: [...conv.messages, userMessage, typingMessage]
        }
      }
      return conv
    })
    
    devLog.log('📝 发送消息后更新对话状态:', {
      currentActiveConversationId,
      userMessage,
      finalConversationsLength: finalConversations.length,
      currentConvMessages: finalConversations.find(c => c.id === currentActiveConversationId)?.messages.length
    })
    
    devLog.log('🔥 准备原子性状态更新:', {
      currentActiveConversationId,
      finalConversationsLength: finalConversations.length,
      userMessage: userMessage.content.substring(0, 50)
    })
    
    // 🔥 原子性状态更新：一次性设置所有相关状态
    setConversations(finalConversations)
    setActiveConversationId(currentActiveConversationId)
    setIsTyping(true)
    setStreamingConversationId(currentActiveConversationId) // 跟踪正在进行流式输出的对话
    
    // 🌐 设置全局流式输出标识，供dashboard页面检测
    try {
      localStorage.setItem(`${moduleConfig.moduleId}_streaming`, 'true')
      localStorage.setItem('last_streaming_time', Date.now().toString())
    } catch (error) {
      console.warn('设置流式输出标识时出错:', error)
    }
    
    devLog.log('✅ 设置streamingConversationId:', {
      currentActiveConversationId,
      streamingConversationId: currentActiveConversationId
    })
    localStorage.setItem(`${moduleConfig.moduleId}_conversations`, JSON.stringify(finalConversations))

    // 后台处理数据库操作
    let dbConversationId: string | undefined
    let lockedUserProfileId: string = activeUser.id  // 🔒 锁定用户资料ID，确保整个对话过程中保持一致
    
    devLog.log('🔒 锁定关键参数:')
    devLog.log('   lockedUserProfileId:', lockedUserProfileId)
    devLog.log('   activeConversationId:', currentActiveConversationId)
    
    const handleDatabaseOperations = async (): Promise<string | undefined> => {
      try {
        
        const currentConversation = finalConversations.find(conv => conv.id === currentActiveConversationId)
        
        let currentDbConversationId: string
        
        if (!currentConversation?.dbConversationId) {
          const conversationTitle = currentConversation?.title || '新对话'

          devLog.log('🔍 创建对话参数检查:')
          devLog.log('   userProfileId (user_profiles.id):', lockedUserProfileId)
          devLog.log('   title:', conversationTitle)
          devLog.log('   moduleType:', moduleConfig.moduleId)
          
          const createResponse = await fetch('/api/conversations/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userProfileId: lockedUserProfileId,
              title: conversationTitle,
              moduleType: moduleConfig.moduleId
            })
          })

          const createResult = await createResponse.json()

          if (!createResult.success) {
            throw new Error(createResult.message || '创建对话失败')
          }

          const dbConversation = createResult.conversation
          currentDbConversationId = dbConversation.id

          devLog.log('✅ 数据库对话创建成功:', currentDbConversationId)

          setConversations(prevConversations => 
            prevConversations.map(conv => 
              conv.id === currentActiveConversationId 
                ? { ...conv, dbConversationId: currentDbConversationId, createdAt: new Date(dbConversation.created_at) }
                : conv
            )
          )
        } else {
          currentDbConversationId = currentConversation.dbConversationId
          devLog.log('✅ 使用已存在的数据库对话ID:', currentDbConversationId)
        }

        // 保存用户消息到数据库
        devLog.log('🔍 用户消息保存参数检查:')
        devLog.log('   conversationId (conversations.id):', currentDbConversationId)
        devLog.log('   lockedUserProfileId (user_profiles.id):', lockedUserProfileId)
        devLog.log('   userMessage.content length:', userMessage.content.length)
        
        const userMessageResponse = await fetch('/api/messages/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationId: currentDbConversationId,
            role: 'user',
            content: userMessage.content,
            metadata: {
              frontend_id: userMessage.id,
              user_profile_id: lockedUserProfileId  // 使用锁定的用户资料ID
            }
          })
        })

        const userMessageResult = await userMessageResponse.json()

        if (!userMessageResult.success) {
          devLog.error('❌ 用户消息保存失败详细信息:', userMessageResult)
          throw new Error(`保存用户消息失败: ${userMessageResult.message || '未知错误'}`)
        }

        devLog.log('✅ 用户消息保存成功，消息ID:', userMessageResult.message?.id)
        devLog.log('✅ 返回数据库对话ID:', currentDbConversationId)
        devLog.log('✅ 锁定的用户资料ID已在外部变量中保存:', lockedUserProfileId)

        return currentDbConversationId

      } catch (error) {
        devLog.error('❌ 用户消息保存过程失败:', error)
        devLog.error('❌ 错误详情:', error instanceof Error ? error.message : String(error))
        
        // 获取当前可能已创建的对话ID
        const currentConversation = finalConversations.find(conv => conv.id === currentActiveConversationId)
        const fallbackDbConversationId = currentConversation?.dbConversationId
        
        devLog.error('❌ 当前fallbackDbConversationId状态:', fallbackDbConversationId)
        
        // 即使用户消息保存失败，也要返回对话ID（如果已创建）用于后续尝试
        if (fallbackDbConversationId) {
          devLog.log('⚠️ 虽然保存失败，但返回已创建的对话ID用于重试:', fallbackDbConversationId)
          return fallbackDbConversationId
        }
        
        return undefined
      }
    }

    const dbOperationPromise = handleDatabaseOperations()

    // 发起AI请求
    try {
      const currentConv = finalConversations.find(conv => conv.id === currentActiveConversationId)
      const isFirstMessage = !currentConv?.cozeConversationId

      // 🔧 修复：直接使用锁定的user_profiles.id，而不是格式化的手机号
      const consistentUserId = lockedUserProfileId  // 使用正确的user_profiles.id

      devLog.log('🔍 Coze API请求参数检查:')
      devLog.log('   consistentUserId (user_profiles.id):', consistentUserId)
      devLog.log('   lockedUserProfileId:', lockedUserProfileId)
      devLog.log('   currentConv?.cozeConversationId:', currentConv?.cozeConversationId)

      // 🎯 构建聊天提示词模板
      devLog.log(`🎯 构建${isFirstMessage ? '第一次' : '后续'}聊天的提示词模板...`)
      const chatPrompt = await buildChatPrompt(userMessage.content, isFirstMessage)
      devLog.log('📝 构建的提示词:', chatPrompt)

      // 🔄 强制等待数据库操作完成，获取数据库对话ID
      devLog.log('⏳ 等待数据库操作完成...')
      let dbConversationId: string | undefined
      try {
        dbConversationId = await dbOperationPromise
        devLog.log('✅ 数据库操作完成，获取到对话ID:', dbConversationId)
        
        if (!dbConversationId) {
          throw new Error('数据库对话ID为空')
        }
      } catch (error) {
        devLog.error('❌ 数据库操作失败，无法继续AI请求:', error)
        setIsTyping(false)
        
        // 先保存streamingConversationId，然后再清除
        const currentStreamingConversationId = streamingConversationId
        setStreamingConversationId(null)
        
        // 移除临时typing消息
        setConversations(prevConversations => 
          prevConversations.map(conv => 
            conv.id === currentStreamingConversationId 
              ? { ...conv, messages: conv.messages.filter(msg => msg.id !== typingMessageId) }
              : conv
          )
        )
        // 添加错误消息
        const errorMessage: ChatMessage = {
          id: `error_${Date.now()}`,
          type: 'bot',
          content: '抱歉，系统出现错误，请稍后重试。',
          timestamp: new Date()
        }
        setConversations(prevConversations => 
          prevConversations.map(conv => 
            conv.id === streamingConversationId 
              ? { ...conv, messages: [...conv.messages, errorMessage] }
              : conv
          )
        )
        return
      }

      devLog.log('🚀 开始AI请求，使用数据库对话ID:', dbConversationId)

      const requestBody = {
        message: chatPrompt, // 使用构建的提示词模板
        userInfo: isFirstMessage ? userInfo : undefined,
        conversationId: currentConv?.cozeConversationId, // Coze的对话ID，用于保持对话连续性
        dbConversationId: dbConversationId, // 数据库的对话ID，用于保存消息
        userId: consistentUserId,  // 现在传递正确的user_profiles.id
        userProfileId: lockedUserProfileId,  // 明确传递userProfileId参数
      }

      devLog.log('📦 最终请求体:', {
        ...requestBody,
        message: `${requestBody.message.substring(0, 100)}...`
      })

      const response = await fetch('/api/coze/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // 检查是否是流式响应
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('text/event-stream')) {
        const botMessageId = typingMessageId
        let streamingContent = ''
        let finalConversationId = ''
        let finalChatId = ''

        setCurrentBotMessageId(botMessageId)
        setCurrentStreamingContent('')
        
        // 获取数据库对话ID
        let dbConversationId: string | undefined
        try {
          dbConversationId = await dbOperationPromise
          setCurrentDbConversationId(dbConversationId || null)
        } catch (error) {
          devLog.warn('⚠️ 获取数据库对话ID失败，暂停保存可能受影响:', error)
        }

        setIsTyping(false)

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        // 🔄 将reader存储到本地状态中
        setCurrentReader(reader || null)

        if (reader) {
          let hasReachedContentStart = false // 标记是否已经到达真正的内容开始
          
          try {
            while (true) {
              let readResult
              try {
                readResult = await reader.read()
              } catch (readError: any) {
                const errorMessage = readError instanceof Error ? readError.message : String(readError)
                
                // 对于常见的流读取器错误，静默处理
                if (errorMessage.includes('Releasing Default reader') || 
                    errorMessage.includes('Default reader') ||
                    errorMessage.includes('already been released') ||
                    errorMessage.includes('released') ||
                    errorMessage.includes('InvalidStateError')) {
                  devLog.log('🔚 检测到流读取器已释放或无效，停止读取')
                  break
                }
                
                devLog.error('❌ 读取流时出错:', readError)
                throw readError
              }
              
              const { done, value } = readResult
              if (done) break

              const chunk = decoder.decode(value)
              const lines = chunk.split('\n')

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6))

                    if (data.type === 'start') {
                      // 🚀 收到开始信号，准备接收内容
                      devLog.log('🚀 收到开始信号，准备接收AI回复')
                      setIsTyping(false) // 移除"正在思考中..."
                      // 不再显示"正在生成回复..."，等待第一个content块立即更新
                                                        } else if (data.type === 'content') {
                                      streamingContent += data.content
                                      finalConversationId = data.conversationId || finalConversationId
                                      finalChatId = data.chatId || finalChatId

                                                            // 检查是否已经到达真正的内容开始标记
                      const contentStartMarker = "fabuwc directly streaming reply."
                      if (!hasReachedContentStart && streamingContent.includes(contentStartMarker)) {
                        hasReachedContentStart = true
                        setIsTyping(false) // 这时才移除loading状态
                        devLog.log('🤖 到达内容开始标记，开始显示AI回复')
                      }

                      // 移除强制显示逻辑，严格等待标记出现

                      devLog.log('📥 收到AI内容块:', {
                        contentLength: data.content.length,
                        totalLength: streamingContent.length,
                        hasReachedContentStart,
                        botMessageId,
                        streamingConversationId,
                        // 新增：关键内容调试
                        receivedContent: data.content,
                        currentStreamingContent: streamingContent,
                        streamingContentPreview: streamingContent.substring(0, 50)
                      })

                      // 更新本地流式内容状态 - 保存原始内容但显示过滤内容
                      setCurrentStreamingContent(streamingContent)

                      devLog.log('🚀 准备更新对话状态:', {
                        streamingConversationId,
                        currentActiveConversationId,
                        botMessageId,
                        streamingContentLength: streamingContent.length,
                        streamingContentPreview: streamingContent.substring(0, 100)
                      })

                      setConversations(prevConversations => {
                        devLog.log('🎯 进入setConversations更新:', {
                          prevConversationsCount: prevConversations.length,
                          streamingConversationId,
                          currentActiveConversationId,
                          botMessageId
                        })
                        
                        const updated = prevConversations.map(conv => {
                          if (conv.id === currentActiveConversationId) {
                            // 🚀 流式内容显示策略：始终过滤掉标记内容
                            const extractedStreamingContent = extractDisplayContent(streamingContent)
                            
                            // 如果提取失败或为空，且已经到达内容开始，则手动过滤标记
                            let finalDisplayContent = ''
                            if (extractedStreamingContent && extractedStreamingContent.trim() !== '') {
                              finalDisplayContent = extractedStreamingContent
                            } else if (hasReachedContentStart && streamingContent) {
                              // 手动过滤标记内容
                              const startMarker = "fabuwc directly streaming reply."
                              const startIndex = streamingContent.indexOf(startMarker)
                              if (startIndex !== -1) {
                                finalDisplayContent = streamingContent.substring(startIndex + startMarker.length).trim()
                              } else {
                                finalDisplayContent = '' // 如果没有找到标记，不显示任何内容
                              }
                            } else {
                              finalDisplayContent = '' // 在到达标记前不显示任何内容
                            }
                            
                            // 检查消息是否存在
                            const targetMessage = conv.messages.find(m => m.id === botMessageId)
                            
                            devLog.log('🔄 流式内容更新检查:', {
                              conversationId: conv.id,
                              streamingConversationId,
                              currentActiveConversationId,
                              botMessageId,
                              streamingContentLength: streamingContent.length,
                              targetMessageExists: !!targetMessage,
                              targetMessageId: targetMessage?.id,
                              messagesCount: conv.messages.length,
                              allMessageIds: conv.messages.map(m => m.id),
                              streamingContentPreview: streamingContent.substring(0, 100)
                            })
                            
                            // 简化的流式内容更新日志
                            devLog.log('📝 流式内容更新:', {
                              conversationId: conv.id,
                              botMessageId,
                              streamingContentLength: streamingContent.length,
                              finalDisplayContentLength: finalDisplayContent.length,
                              hasReachedContentStart,
                              streamingContentPreview: streamingContent.substring(0, 100),
                              finalDisplayContentPreview: finalDisplayContent.substring(0, 100),
                              // 检查消息是否存在
                              messageExists: conv.messages.some(m => m.id === botMessageId),
                              totalMessages: conv.messages.length,
                              // 状态检查
                              currentActiveConversationId: conv.id,
                              streamingConversationId
                            })
                            
                            return {
                              ...conv,
                              messages: conv.messages.map(msg => {
                                if (msg.id === botMessageId) {
                                  const updatedMessage = { 
                                    ...msg, 
                                    content: streamingContent, // 保存原始完整内容
                                    displayContent: finalDisplayContent // 只显示过滤后的内容，不fallback到原始内容
                                  }
                                  
                                  devLog.log('🔄 更新消息内容:', {
                                    messageId: msg.id,
                                    botMessageId,
                                    originalContent: msg.content,
                                    newContent: streamingContent,
                                    originalDisplayContent: msg.displayContent,
                                    newDisplayContent: updatedMessage.displayContent,
                                    streamingContentLength: streamingContent.length
                                  })
                                  
                                  return updatedMessage
                                }
                                return msg
                              }),
                              cozeConversationId: conv.cozeConversationId || finalConversationId,
                            }
                          }
                          return conv
                        })
                        
                        devLog.log('🔄 更新对话状态 - AI内容:', {
                          conversationsCount: updated.length,
                          currentConv: updated.find(c => c.id === streamingConversationId),
                          botMessage: updated.find(c => c.id === streamingConversationId)?.messages.find(m => m.id === botMessageId)
                        })
                        
                        return updated
                      })
                    } else if (data.type === 'done') {
                      finalConversationId = data.conversationId || finalConversationId
                      finalChatId = data.chatId || finalChatId

                      setConversations(prevConversations => {
                        const finalConversations = prevConversations.map(conv => {
                          if (conv.id === currentActiveConversationId) {
                            const fullContent = data.fullResponse || streamingContent
                            const extractedDisplayContent = extractDisplayContent(fullContent)
                            
                            devLog.log('✅ 流式输出完成 - 内容更新:', {
                              conversationId: conv.id,
                              botMessageId,
                              fullContentLength: fullContent.length,
                              extractedDisplayContentLength: extractedDisplayContent.length,
                              messagesCount: conv.messages.length,
                              targetMessageExists: conv.messages.some(m => m.id === botMessageId),
                              fullContentPreview: fullContent.substring(0, 200)
                            })
                            
                            return {
                              ...conv,
                              messages: conv.messages.map(msg =>
                                msg.id === botMessageId
                                  ? { 
                                      ...msg, 
                                      content: fullContent, // 保存原始完整内容
                                      displayContent: extractedDisplayContent && extractedDisplayContent.trim() !== '' 
                                        ? extractedDisplayContent 
                                        : '' // 如果提取失败，显示空字符串而不是原始内容
                                    }
                                  : msg
                              ),
                              cozeConversationId: conv.cozeConversationId || finalConversationId,
                            }
                          }
                          return conv
                        })

                        localStorage.setItem(`${moduleConfig.moduleId}_conversations`, JSON.stringify(finalConversations))

                        // 📝 后端已经异步保存，前端仅做状态标记
                        devLog.log('✅ 流式输出完成，后端已异步保存assistant消息')
                        
                        // 标记消息为已保存（仅用于前端状态管理）
                        setSavedMessageIds(prev => new Set(prev).add(botMessageId))

                        return finalConversations
                      })

                      setIsTyping(false)
                      setStreamingConversationId(null) // 清除流式输出对话跟踪
                      
                      // 🌐 清除全局流式输出标识
                      try {
                        localStorage.removeItem(`${moduleConfig.moduleId}_streaming`)
                        localStorage.setItem('last_streaming_time', Date.now().toString())
                      } catch (error) {
                        console.warn('清除流式输出标识时出错:', error)
                      }

                      // 打印认证信息到前端控制台
                      if (data.authInfo) {
                        devLog.info('🔐 聊天完成 - 认证信息')
                        devLog.log('认证方式:', data.authInfo.method)
                        devLog.log('Token类型:', data.authInfo.tokenType)
                        devLog.log('Token前缀:', data.authInfo.tokenPrefix)
                        devLog.log('用户ID:', data.authInfo.userId)
                        devLog.log('响应长度:', data.fullResponse?.length || 0, '字符')
                      } else {
                        devLog.log('🔐 聊天完成 - 认证方式:', data.authMethod || '未知')
                      }

                      // 清理本地reader状态
                      setCurrentReader(null)

                      break
                    } else if (data.type === 'error') {
                      devLog.error('❌ 流式响应错误:', data.error)
                      devLog.warn('🚨 流式错误清除streamingConversationId:', {
                        error: data.error,
                        streamingConversationId,
                        botMessageId
                      })
                      
                      setIsTyping(false)
                      setStreamingConversationId(null) // 清除流式输出对话跟踪
                      
                      // 清理本地reader状态
                      setCurrentReader(null)
                      
                      throw new Error(data.error || 'AI回复失败，请重试')
                    }
                  } catch (parseError) {
                    devLog.warn('⚠️ 解析流式数据失败:', parseError)
                  }
                }
              }
            }
          } finally {
            try {
              reader.releaseLock()
              devLog.log('🧹 流读取器已释放')
            } catch (error) {
              // 捕获并记录错误，但不让错误中断清理过程
              const errorMessage = error instanceof Error ? error.message : String(error)
              
              // 对于常见的错误类型，给出更友好的提示
              if (errorMessage.includes('Re2222222leasing Default reader') || 
                  errorMessage.includes('Default reader') ||
                  errorMessage.includes('already been released') ||
                  errorMessage.includes('InvalidStateError')) {
                devLog.log('🔍 流读取器已处于释放状态或为默认状态，跳过释放')
              } else {
                devLog.warn('⚠️ 释放流读取器时出错（已忽略）:', errorMessage)
              }
            }
            
            // 清理本地reader状态
            setCurrentReader(null)
          }
        }
      } else {
        // 降级到传统JSON响应
        const data = await response.json()

        if (data.success) {
                  setConversations(prevConversations => {
          const finalConversations = prevConversations.map(conv => {
            if (conv.id === currentActiveConversationId) {
              return {
                ...conv,
                messages: conv.messages.map(msg =>
                  msg.id === typingMessageId
                    ? { ...msg, content: data.response }
                    : msg
                ),
                cozeConversationId: conv.cozeConversationId || data.conversationId,
              }
            }
            return conv
          })

          localStorage.setItem(`${moduleConfig.moduleId}_conversations`, JSON.stringify(finalConversations))

          // 📝 非流式响应：后端也会处理保存，前端仅做状态标记
          devLog.log('✅ 非流式响应完成，后端已处理保存')
          
          // 标记消息为已保存（仅用于前端状态管理）
          setSavedMessageIds(prev => new Set(prev).add(typingMessageId))

          return finalConversations
        })

        setIsTyping(false)
        setStreamingConversationId(null) // 清除流式输出对话跟踪

        // 打印认证信息到前端控制台（非流式响应）
        if (data.authInfo) {
          devLog.info('🔐 聊天完成 - 认证信息（非流式）')
          devLog.log('认证方式:', data.authInfo.method)
          devLog.log('Token类型:', data.authInfo.tokenType)
          devLog.log('Token前缀:', data.authInfo.tokenPrefix)
          devLog.log('用户ID:', data.authInfo.userId)
          devLog.log('响应长度:', data.response?.length || 0, '字符')
          // devLog.groupEnd()
        } else {
          devLog.log('🔐 聊天完成 - 认证方式（非流式）:', data.authMethod || '未知')
        }

        } else {
          throw new Error(data.error || 'AI回复失败，请重试')
        }
      }
    } catch (error: any) {
      devLog.error('❌ 消息发送失败:', error)
      devLog.warn('🚨 Catch错误清除streamingConversationId:', {
        errorName: error.name,
        errorMessage: error.message,
        streamingConversationId,
        botMessageId: typingMessageId
      })
      
      setIsTyping(false)
      setStreamingConversationId(null) // 清除流式输出对话跟踪
      
      // 🌐 清除全局流式输出标识（错误情况下）
      try {
        localStorage.removeItem(`${moduleConfig.moduleId}_streaming`)
        localStorage.setItem('last_streaming_time', Date.now().toString())
      } catch (error) {
        console.warn('清除流式输出标识时出错:', error)
      }
      
      setConversations(finalConversations)
      
      // 清理本地reader状态
      setCurrentReader(null)
      
      if (error.name === 'AbortError') {
        message.info('对话已中断')
      } else {
        const errorMessage = error.message || String(error)
        
        // 对于流读取器相关的错误，静默处理或显示友好提示
        if (errorMessage.includes('Releasing Default reader') || 
            errorMessage.includes('Default reader') ||
            errorMessage.includes('already been released') ||
            errorMessage.includes('InvalidStateError')) {
          devLog.log('🔚 流读取器错误已静默处理，不显示弹窗')
          // 不显示任何弹窗，静默处理
        } else {
          message.error(errorMessage || 'AI回复失败，请重试')
        }
      }
    } finally {
      setLoading(false)
      setIsTyping(false)
      setStreamingConversationId(null) // 清除流式输出对话跟踪
      
      // 🌐 清除全局流式输出标识（finally块确保清理）
      try {
        localStorage.removeItem(`${moduleConfig.moduleId}_streaming`)
        localStorage.setItem('last_streaming_time', Date.now().toString())
      } catch (error) {
        console.warn('清除流式输出标识时出错:', error)
      }
    }
  }

  // 统一的消息保存函数
  const saveAssistantMessage = async (
    messageId: string,
    content: string,
    dbConversationId: string,
    lockedUserProfileId: string,
    finalConversationId?: string,
    finalChatId?: string
  ) => {
    // 防止重复保存
    if (savedMessageIds.has(messageId)) {
      devLog.log(`⚠️ 消息 ${messageId} 已保存，跳过重复保存`)
      return
    }

    try {
      devLog.log('🔍 Assistant消息保存前状态检查:')
      devLog.log('   dbConversationId:', dbConversationId)
      devLog.log('   lockedUserProfileId:', lockedUserProfileId)
      devLog.log('   messageId:', messageId)
      devLog.log('   content length:', content.length)

      // 先检查消息是否已经存在（防止重复保存）
      const checkResponse = await fetch(`/api/messages/list?conversationId=${dbConversationId}&role=assistant&limit=1`)
      const checkResult = await checkResponse.json()
      
      const messageExists = checkResult.success && 
        checkResult.messages?.some((msg: any) => 
          msg.content === content && msg.role === 'assistant'
        )

      if (messageExists) {
        devLog.log('⚠️ Assistant消息已存在，跳过前端保存')
        setSavedMessageIds(prev => new Set(prev).add(messageId))
        return
      }

      // 保存assistant消息到数据库
      const botMessageResponse = await fetch('/api/messages/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: dbConversationId,
          role: 'assistant',
          content: content,
          metadata: {
            frontend_id: messageId,
            coze_conversation_id: finalConversationId,
            coze_chat_id: finalChatId,
            user_profile_id: lockedUserProfileId,
            saved_by: 'frontend_fallback'
          }
        })
      })

      devLog.log('📡 消息保存API响应状态:', botMessageResponse.status)
      const botMessageResult = await botMessageResponse.json()
      devLog.log('📦 消息保存API响应内容:', botMessageResult)

      if (!botMessageResult.success) {
        // 如果是重复创建错误，也标记为成功
        if (botMessageResult.message?.includes('重复') || botMessageResult.message?.includes('存在')) {
          devLog.log('⚠️ 消息可能已被后端保存，标记为成功')
          setSavedMessageIds(prev => new Set(prev).add(messageId))
        } else {
          devLog.error('❌ AI回复保存失败:', botMessageResult.message)
          devLog.error('❌ 详细错误信息:', JSON.stringify(botMessageResult, null, 2))
        }
      } else {
        devLog.log('✅ AI回复保存成功，消息ID:', botMessageResult.message?.id)
        
        // 标记为已保存
        setSavedMessageIds(prev => new Set(prev).add(messageId))
      }

      // 更新Coze对话ID
      if (finalConversationId && dbConversationId) {
        try {
          const updateResponse = await fetch('/api/conversations/update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              conversationId: dbConversationId,
              cozeConversationId: finalConversationId
            })
          })

          const updateResult = await updateResponse.json()
          if (updateResult.success) {
            devLog.log('✅ Coze对话ID更新成功')
          } else {
            devLog.warn('⚠️ Coze对话ID更新失败:', updateResult.message)
          }
        } catch (updateError) {
          devLog.warn('⚠️ 更新Coze对话ID失败:', updateError)
        }
      }

      // 更新用户聊天次数
      try {
        await updateUserChatCredits()
        devLog.log('✅ 用户聊天次数更新成功')
      } catch (error) {
        devLog.warn('⚠️ 更新聊天次数失败:', error)
      }

    } catch (saveError) {
      devLog.error('❌ 保存AI回复失败:', saveError)
    }
  }

  // 更新用户聊天次数
  const updateUserChatCredits = async () => {
    try {
      const activeUser = getActiveUser()
      if (!activeUser?.id) {
        return
      }

      const response = await fetch('/api/user-profiles/update-chat-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userProfileId: activeUser.id
        })
      })

      const result = await response.json()

      if (result.success) {
        window.dispatchEvent(new CustomEvent('chatCreditsUpdated', {
          detail: result.credits
        }))
      }
    } catch (error) {
      devLog.error('❌ 更新聊天次数失败:', error)
    }
  }

  // 获取用户的占星上下文信息
  const getUserAstrologyContext = async () => {
    try {
      const activeUser = getActiveUser()
      let userId: string
      let isUserProfileId = false

      if (activeUser && activeUser.id) {
        userId = activeUser.id
        isUserProfileId = true
      } else {
        const phoneNumber = getUserPhoneNumber()
        if (!phoneNumber) {
          return null
        }
        userId = phoneNumber
      }

      const response = await fetch('/api/bazi/get', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId,
          isUserProfileId 
        })
      })

      const result = await response.json()

      if (result.success && result.astrologyContext) {
        return result.astrologyContext
      } else {
        return null
      }
    } catch (error) {
      devLog.error('❌ 获取占星上下文失败:', error)
      return null
    }
  }

  // 获取当前模块的报告内容
  const getCurrentModuleReport = async () => {
    try {
      const activeUser = getActiveUser()
      if (!activeUser?.id) {
        return null
      }

      const response = await fetch(`${moduleConfig.apiEndpoint}/get`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userProfileId: activeUser.id
        })
      })

      const result = await response.json()

      if (result.success && result.report) {
        return result.report
      } else {
        return null
      }
    } catch (error) {
      devLog.error(`❌ 获取${moduleConfig.title}报告失败:`, error)
      return null
    }
  }

  // 构建聊天提示词模板
  const buildChatPrompt = async (userMessage: string, isFirstMessage: boolean) => {
    if (isFirstMessage) {
      // 第一次聊天的完整提示词模板
      let promptContent = '# 请直接调用工作流分析，以下为输入信息：\n\n'
      
      // 获取八字信息
      const astrologyContext = await getUserAstrologyContext()
      if (astrologyContext) {
        promptContent += '## 八字信息（bazi表中获取）\n'
        promptContent += `${astrologyContext}\n\n`
      }
      
      // 获取对应报告
      const moduleReport = await getCurrentModuleReport()
      if (moduleReport) {
        promptContent += `## ${moduleConfig.title}报告（报告表中获取）\n`
        promptContent += `${moduleReport}\n\n`
      }
      
      // 分析要求
      promptContent += '## 分析要求（针对"本次提出的问题"，你的分析不能和"历史分析纪录"有冲突。）\n\n'
      
      // 用户问题
      promptContent += '## 提问的问题\n'
      promptContent += `${userMessage}\n`
      
      return promptContent
    } else {
      // 后续聊天的简化提示词模板
      let promptContent = '## 分析要求（针对"本次提出的问题"，你的分析不能和"历史分析纪录"有冲突。）\n\n'
      
      // 用户问题
      promptContent += '## 提问的问题\n'
      promptContent += `${userMessage}\n`
      
      return promptContent
    }
  }

  // 获取当前对话
  const getCurrentConversation = () => {
    const current = conversations.find(conv => conv.id === activeConversationId)
    // devLog.log('🔍 getCurrentConversation调试:', {
    //   activeConversationId,
    //   conversationsCount: conversations.length,
    //   currentFound: !!current,
    //   currentTitle: current?.title,
    //   currentMessages: current?.messages?.length || 0,
    //   conversationIds: conversations.map(c => c.id),
    //   conversationTitles: conversations.map(c => c.title),
    //   lastMessage: current?.messages?.[current.messages.length - 1]?.content?.substring(0, 50)
    // })
    return current
  }

  // 解析最后一个AI消息中的问题
  const parseQuestionsFromLastMessage = () => {
    const currentConv = getCurrentConversation()
    if (!currentConv?.messages?.length) return []
    
    // 找到最后一个AI消息
    const lastBotMessage = [...currentConv.messages].reverse().find(msg => msg.type === 'bot')
    if (!lastBotMessage?.content) return []
    
    const content = lastBotMessage.content
    
    // 方法1: 查找"from_module":null,"from_unit":null}后面的内容
    let questionsText = ''
    const pattern1 = /"from_module":null,"from_unit":null\}(.+?)$/
    const match1 = content.match(pattern1)
    
    if (match1 && match1[1]) {
      questionsText = match1[1].trim()
    } else {
      // 方法2: 查找消息末尾的问题（通常在最后几行）
      const lines = content.split('\n')
      const lastFewLines = lines.slice(-10).join('\n') // 取最后10行
      
      // 寻找包含问号的行
      const questionLines = lines.filter(line => 
        line.includes('？') && 
        line.trim().length > 3 && 
        !line.includes('"') && // 排除JSON格式
        !line.includes('：') && // 排除标题行
        !line.includes('###') // 排除markdown标题
      )
      
      if (questionLines.length > 0) {
        questionsText = questionLines.join('')
      }
    }
    
    if (questionsText) {
      // 按问号分割问题
      const questions = questionsText
        .split(/？|？/)
        .map(q => q.trim())
        .filter(q => q.length > 3 && q.length < 50) // 过滤太短或太长的问题
        .map(q => q + '？')
        .slice(0, 5) // 最多显示5个问题
      
      devLog.log('🔍 解析到的问题:', questions)
      return questions
    }
    
    return []
  }

  // 获取建议问题列表
  const getSuggestedQuestions = () => {
    return parseQuestionsFromLastMessage()
  }

  // 点击问题按钮的处理函数
  const handleQuestionClick = (question: string) => {
    setCurrentMessage(question)
  }

  // 处理返回命书的逻辑
  const handleBackToDashboard = () => {
    // 使用新的工具函数处理返回逻辑
    handleBackToDashboardUtil({
      moduleId: moduleConfig.moduleId,
      additionalChecks: () => {
        // 检查组件内部的流式输出状态
        return !!(currentReader || isTyping || streamingConversationId)
      },
      navigationType: 'redirect'
    })
  }

  // Typing动画组件
  const TypingIndicator = () => (
    <div className="flex items-center space-x-1 text-gray-500">
      <span className="text-sm ml-2">AI深度分析中，预计2分钟，道友稍后</span>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  )

  // 安全的日期格式化函数
  const formatDate = (date: any) => {
    try {
      if (date instanceof Date) {
        return date.toLocaleDateString()
      } else if (typeof date === 'string') {
        return new Date(date).toLocaleDateString()
      } else {
        return '未知日期'
      }
    } catch (error) {
      return '未知日期'
    }
  }

  const formatTime = (date: any) => {
    try {
      if (date instanceof Date) {
        return date.toLocaleTimeString()
      } else if (typeof date === 'string') {
        return new Date(date).toLocaleTimeString()
      } else {
        return '未知时间'
      }
    } catch (error) {
      return '未知时间'
    }
  }

  // 添加内容过滤函数
  // 报告内容格式处理函数
  const formatReportContent = (content: string): string => {
    if (!content) return content
    
    let processedContent = content
    
    // 修正二：修复列表项格式，将换行的数字列表项合并
    // processedContent = processedContent.replace(/(\d+\.)\s*\n+\s*([^\n]+)/g, '$1 $2')
    processedContent = processedContent.replace(/(\d+\.)\s*\n+\s*(\*\*[^*]+\*\*)/g, '$1 $2')
    
    // 修正二b：标准化数字列表项后的空格（多个空格变为一个空格）
    processedContent = processedContent.replace(/(\d+\.)\s{2,}(\*\*[^*]+\*\*)/g, '$1$2')
    
    // 修正三：在破折号列表前添加换行（排除连续破折号和数字范围等情况）
    processedContent = processedContent.replace(/([^\s\n\d])\s*(?<!-|、)-(?!-|\d)\s+([^-、\n])/g, '$1\n- $2')
    
    // 清理多余的空行
    processedContent = processedContent.replace(/\n\s*\n\s*\n/g, '\n\n')
    
    return processedContent.trim()
  }

  const extractDisplayContent = (content: string): string => {
    // 查找 "fabuwc directly streaming reply." 的起始位置
    const startMarker = "fabuwc directly streaming reply."
    const endMarkers = [
      '{"msg_type":"stream_plugin_finish"',
      '{"msg_type":"generate_answer_finish"'
    ]
    
    const startIndex = content.indexOf(startMarker)
    if (startIndex === -1) {
      // 如果没有找到起始标记，返回空字符串，只显示标记后的内容
      return ''
    }
    
    // 从起始标记之后开始提取
    const contentStart = startIndex + startMarker.length
    
    // 查找最早出现的结束标记
    let endIndex = -1
    for (const endMarker of endMarkers) {
      const currentEndIndex = content.indexOf(endMarker, contentStart)
      if (currentEndIndex !== -1) {
        if (endIndex === -1 || currentEndIndex < endIndex) {
          endIndex = currentEndIndex
        }
      }
    }
    
    let extractedContent = ''
    if (endIndex === -1) {
      // 如果没有找到结束标记，返回从起始标记后的所有内容
      extractedContent = content.substring(contentStart).trim()
    } else {
      // 提取中间的内容
      extractedContent = content.substring(contentStart, endIndex).trim()
    }
    // 改进的去重处理：检测并移除重复的内容块
    const lines = extractedContent.split('\n')
    
    // 第一步：基于段落的去重
    const paragraphs: string[] = []
    const seenParagraphs = new Set<string>()
    let currentParagraph: string[] = []
    
    for (const line of lines) {
      if (line.trim() === '') {
        // 空行表示段落结束
        if (currentParagraph.length > 0) {
          const paragraphText = currentParagraph.join('\n').trim()
          if (paragraphText && !seenParagraphs.has(paragraphText)) {
            seenParagraphs.add(paragraphText)
            paragraphs.push(paragraphText)
          }
          currentParagraph = []
        }
      } else {
        currentParagraph.push(line)
      }
    }
    
    // 处理最后一个段落
    if (currentParagraph.length > 0) {
      const paragraphText = currentParagraph.join('\n').trim()
      if (paragraphText && !seenParagraphs.has(paragraphText)) {
        seenParagraphs.add(paragraphText)
        paragraphs.push(paragraphText)
      }
    }
    
    // 第二步：去除连续的重复段落
    const deduplicatedParagraphs: string[] = []
    let lastParagraph = ''
    
    for (const paragraph of paragraphs) {
      if (paragraph !== lastParagraph) {
        deduplicatedParagraphs.push(paragraph)
        lastParagraph = paragraph
      }
    }
    
    // 第三步：高级去重 - 检测跨段落的重复句子和短语
    const finalParagraphs: string[] = []
    const seenSentences = new Set<string>()
    
    for (const paragraph of deduplicatedParagraphs) {
      // 特殊处理和格式修正
      let processedParagraph = paragraph
      
      // 修正一：移除 。---。 模式
      processedParagraph = processedParagraph.replace(/。\s*---\s*。/g, '')
      
      // 修正二：确保列表项格式正确，避免 "1.\n**xxx**" 的错误换行
      processedParagraph = processedParagraph.replace(/(\d+\.)\s*\n+\s*(\*\*[^*]+\*\*)/g, '$1 $2')
      
      // 修正三：在破折号前添加换行 "xxx- yyy" -> "xxx\n- yyy"（排除中文顿号）
      processedParagraph = processedParagraph.replace(/([^\s\n])(?<!、)-\s+([^-、])/g, '$1\n- $2')
      
      // 按标点符号分割句子
      const sentences = processedParagraph.split(/[。；！？]/).map(s => s.trim()).filter(s => s.length > 0)
      const keptSentences: string[] = []
      
      for (const sentence of sentences) {
        // 只检查较长的句子（避免过度去重）
        if (sentence.length > 10) {
          if (!seenSentences.has(sentence)) {
            seenSentences.add(sentence)
            keptSentences.push(sentence)
          }
        } else {
          // 短句子直接保留
          keptSentences.push(sentence)
        }
      }
      
      if (keptSentences.length > 0) {
        // 重新组合句子，恢复标点，但保持原有的换行格式
        let rebuiltParagraph = keptSentences.join('。')
        if (rebuiltParagraph && !rebuiltParagraph.endsWith('。')) {
          rebuiltParagraph += '。'
        }
        
        // 再次应用格式修正，确保在重组后仍然正确
        rebuiltParagraph = rebuiltParagraph.replace(/(\d+\.)\s*\n+\s*(\*\*[^*]+\*\*)/g, '$1 $2')
        rebuiltParagraph = rebuiltParagraph.replace(/([^\s\n])(?<!、)-\s+([^-、])/g, '$1\n- $2')
        
        if (rebuiltParagraph.trim()) {
          finalParagraphs.push(rebuiltParagraph)
        }
      }
    }
    
    // 最终格式清理处理
    let finalResult = finalParagraphs.join('\n\n')
    
    // 修正一：移除所有 ---。 或 。--- 或单独的 --- 行
    finalResult = finalResult.replace(/。?\s*---\s*。?/g, '')
    finalResult = finalResult.replace(/^\s*---\s*$/gm, '')
    
    // 修正二：修复列表项格式，将换行的数字列表项合并
    finalResult = finalResult.replace(/(\d+\.)\s*\n+\s*([^\n]+)/g, '$1 $2')
    
    // 修正三：在破折号列表前添加换行（排除中文顿号）
    finalResult = finalResult.replace(/([^\s\n])(?<!、)\s*-\s+([^-、\n])/g, '$1\n- $2')
    
    // 清理多余的空行
    finalResult = finalResult.replace(/\n\s*\n\s*\n/g, '\n\n')
    
    return finalResult.trim()
  }

  // 动态选择图标的函数
  const getDynamicIcon = (title: string, props = { width: 40, height: 40, className: "text-red-600" }) => {
    switch (title) {
      case '八字排盘':
        return <MingjuIcon {...props} />
      case '性格内观': 
        return <FudeIcon {...props} />
      case '事业财富':
        return <CailuIcon {...props} />
      case '婚恋感情':
        return <YuanxiIcon {...props} />
      case '身体健康':
        return <ShouluIcon {...props} />
      case '2026年运':
        return <YundaoIcon {...props} />
      default:
        return <FudeIcon {...props} />
    }
  }

  if (!userInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* 全局会话状态指示器 */}
      <SessionStatusIndicator currentModuleId={moduleConfig.moduleId} />
      
      <div className="bg-white flex overflow-hidden h-full">
        {/* 自定义滚动条样式 */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f3f4f6;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ffffff;
          border-radius: 4px;
          border: 1px solid #e5e7eb;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #f9fafb;
        }
      `}</style>
      
      {/* 移动端顶部导航 */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white shadow-lg border-b border-gray-200 px-3 py-2 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* 返回命书按钮 */}
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleBackToDashboard()
              }}
              className="p-0 mr-2"
              title="返回「命书」"
            />
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">乙</span>
            </div>
            <span className="font-bold text-gray-900">天乙神算</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              icon={<MenuOutlined />}
              onClick={() => setChatHistoryVisible(true)}
              size="small"
              type="text"
            >
              对话
            </Button>
          </div>
        </div>
      </div>

      {/* 中间聊天记录区域 */}
      <div className={`bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden
        ${chatHistoryVisible
          ? 'w-[85%] md:w-80 h-full fixed md:relative left-0 top-0 md:top-auto z-[9999] md:z-auto'
          : 'w-0 md:w-0 h-full hidden md:block'
        }`}>
        {chatHistoryVisible && (
          <div
            className="flex flex-col h-full"
            onTouchStart={(e) => {
              const touch = e.touches[0]
              setTouchStart({ x: touch.clientX, y: touch.clientY })
            }}
            onTouchMove={(e) => {
              if (!touchStart) return
              const touch = e.touches[0]
              const deltaX = touch.clientX - touchStart.x
              const deltaY = touch.clientY - touchStart.y

              // 检测向左滑动（deltaX < -50 且水平滑动距离大于垂直滑动距离）
              if (deltaX < -50 && Math.abs(deltaX) > Math.abs(deltaY)) {
                setChatHistoryVisible(false)
                setTouchStart(null)
              }
            }}
            onTouchEnd={() => {
              setTouchStart(null)
            }}
          >
            {/* 标题区域 */}
            <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                {/* <CailuIcon width={40} height={40} className="text-red-600" /> */}
                {getDynamicIcon(moduleConfig.title)}
                <h2 className="text-lg font-medium text-gray-900">{moduleConfig.title}</h2>
              </div>
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => setChatHistoryVisible(false)}
                className="text-gray-500 hover:text-gray-700"
                size="small"
              />
            </div>

            {/* 功能按钮区域 */}
            <div className="p-3 space-y-2">
              <div
                onClick={() => {
                  setCurrentContent('report')
                }}
                className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  currentContent === 'report'
                    ? 'bg-gray-100 text-gray-900'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <FileTextOutlined className="text-lg" />
                <span className="font-medium">{moduleConfig.reportButtonText}</span>
              </div>

              <div
                onClick={() => {
                  createNewConversation()
                  setCurrentContent('chat')
                }}
                className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  currentContent === 'chat'
                    ? 'bg-gray-100 text-gray-900'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <MessageOutlined className="text-lg" />
                <span className="font-medium">{moduleConfig.title}对话</span>
              </div>
            </div>

            {/* 对话历史区域 */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-3 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">对话历史</span>
                  <Button
                    type="text"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      handleNewConversationButton()
                    }}
                    className="text-gray-500 hover:text-gray-700"
                    size="small"
                  >
                    新对话
                  </Button>
                </div>
              </div>

              <div 
                ref={conversationListRef}
                className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar min-h-0" 
                style={{ overscrollBehavior: 'contain' }}
              >
                {conversationsLoading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Spin size="default" />
                    <p className="text-gray-500 text-sm mt-3">加载对话历史中...</p>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <MessageOutlined className="text-gray-400 text-lg" />
                    </div>
                    <p className="text-gray-500 text-sm">暂无对话历史</p>
                    <p className="text-gray-400 text-xs mt-1">开始新对话试试吧</p>
                  </div>
                ) : (
                  conversations
                    .sort((a, b) => {
                      if (a.isPinned && !b.isPinned) return -1
                      if (!a.isPinned && b.isPinned) return 1
                      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    })
                    .slice(0, visibleConversationsCount)
                    .map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`group relative p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                      activeConversationId === conversation.id && currentContent === 'chat'
                        ? 'bg-gray-100 border border-gray-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                    onClick={() => handleConversationSelect(conversation)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        {conversation.isPinned && (
                          <PushpinFilled className="text-gray-600 text-xs flex-shrink-0" />
                        )}
                        <div className="font-medium text-sm text-gray-900 truncate">
                          {conversation.title}
                        </div>
                      </div>
                      <Dropdown
                        menu={{
                          items: [
                            {
                              key: 'pin',
                              label: conversation.isPinned ? '取消置顶' : '置顶',
                              icon: conversation.isPinned ? <PushpinOutlined /> : <PushpinFilled />,
                              onClick: () => pinConversation(conversation.id)
                            },
                            {
                              key: 'rename',
                              label: '重命名',
                              icon: <EditOutlined />,
                              onClick: () => startRenameConversation(conversation.id, conversation.title)
                            },
                            {
                              type: 'divider'
                            },
                            {
                              key: 'delete',
                              label: '删除',
                              icon: <DeleteOutlined />,
                              danger: true,
                              onClick: () => deleteConversation(conversation.id)
                            }
                          ]
                        }}
                        trigger={['click']}
                        placement="bottomRight"
                      >
                        <Button
                          type="text"
                          size="small"
                          icon={<MoreOutlined />}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Dropdown>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDate(conversation.createdAt)}
                    </div>
                  </div>
                  ))
                )}
                

                
                {/* 加载更多对话按钮 */}
                {!conversationsLoading && conversations.length > 0 && (
                  (() => {
                    const remainingCount = conversations.length - visibleConversationsCount
                    return remainingCount > 0 ? (
                      <div className="text-center py-3">
                        <Button
                          type="default"
                          size="small"
                          onClick={loadMoreConversations}
                          className="text-gray-600 border-gray-300 hover:text-gray-800 hover:border-gray-400"
                        >
                          加载更多对话 ({remainingCount})
                        </Button>
                      </div>
                    ) : null
                  })()
                )}
              </div>
            </div>

            {/* PC端返回命书按钮 - 在中间聊天记录区域底部 */}
            <div className="hidden md:block p-3 border-t border-gray-100 flex-shrink-0">
              <Button
                block
                size="large"
                icon={<ArrowLeftOutlined />}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleBackToDashboard()
                }}
                className="border-gray-300 text-gray-700 hover:border-gray-400 hover:text-gray-800 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <span className="font-medium tracking-wide">返回「命书」</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 移动端遮罩层 - 只覆盖右侧15%区域 */}
      {chatHistoryVisible && (
        <div
          className="md:hidden fixed top-0 right-0 bottom-0 w-[15%] bg-black bg-opacity-30 z-[9998]"
          onClick={() => setChatHistoryVisible(false)}
        />
      )}

      {/* 展开按钮 - 只在PC端显示 */}
      {!chatHistoryVisible && (
        <div className="hidden md:flex w-8 bg-white border-r border-gray-200 items-center justify-center h-full">
          <Button
            type="text"
            icon={<ArrowRightOutlined />}
            onClick={() => setChatHistoryVisible(true)}
            className="text-gray-500 hover:text-gray-700"
            size="small"
          />
        </div>
      )}

      {/* 右侧内容区域 */}
      <div className="flex-1 pt-8 md:pt-0 h-full overflow-hidden bg-white md:relative">
        {/* PC端面包屑导航 */}
        <div className="hidden md:block p-4 pb-0">
          <Breadcrumb
            items={BREADCRUMB_CONFIGS[moduleConfig.moduleId as keyof typeof BREADCRUMB_CONFIGS] || []}
            moduleId={moduleConfig.moduleId}
            streamingCheckFn={() => !!(currentReader || isTyping || streamingConversationId)}
          />
        </div>

        {currentContent === 'report' ? (
          /* 报告展示区域 */
          <div className="h-full flex flex-col">
            {/* 报告标题栏 */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                    <FileTextOutlined className="text-white" />
                  </div>
                  <Title level={2} className="!mb-0 !text-gray-900">{moduleConfig.reportTitle}</Title>
                </div>
                {reportContent && (
                  <Button
                    icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                    onClick={copyReport}
                    className={`${copied ? 'border-green-500 text-green-500' : 'border-gray-400 text-gray-600'} hover:bg-gray-50`}
                    size="small"
                  >
                    {copied ? '已复制' : '复制报告'}
                  </Button>
                )}
              </div>
              {userInfo && (
                <div className="bg-gray-50 rounded-lg p-4 mt-4">
                  <Paragraph className="text-gray-700 mb-0">
                    <span className="font-semibold text-gray-900">{(() => {
                      const activeUser = getActiveUser()
                      return activeUser?.name || userInfo?.nickname || '用户'
                    })()}</span>
                    道友，你好~您的生辰信息（{(() => {
                      const activeUser = getActiveUser()
                      if (activeUser) {
                        const genderText = activeUser.gender === 'male' ? '男' : '女'
                        const areaText = activeUser.area_province && activeUser.area_city && activeUser.area_district 
                          ? `${activeUser.area_province} ${activeUser.area_city} ${activeUser.area_district}`
                          : '未知地区'
                        return `${activeUser.year}年${activeUser.month}月${activeUser.day}日 ${activeUser.hour}:${String(activeUser.minute).padStart(2, '0')}, ${genderText}`
                      }
                      return formatUserInfoDisplay(userInfo)
                    })()}），
                      {/* 经过天乙的深度分析，为您生成以下{moduleConfig.title}报告。 */}
                      经过天乙的深度分析，为您生成以下报告。
                  </Paragraph>
                </div>
              )}
            </div>

            {/* 报告内容区域 */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar" style={{ overscrollBehavior: 'contain' }}>
              {reportLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  {isGenerating ? (
                    <div className="w-full max-w-md">
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                          <img src="/images/yy2.png" alt="天乙神算" className="w-full h-full object-cover rounded-full" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Spin
                              indicator={<LoadingOutlined style={{ fontSize: 24, color: 'white' }} spin />}
                            />
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">正在生成{moduleConfig.title}报告</h3>
                        <p className="text-gray-600">{generationStatus}</p>
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>生成进度</span>
                          <span>{generationProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${generationProgress}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="text-center text-sm text-gray-500">
                        <p>AI正在深度分析您的出生信息</p>
                        <p>系统每分钟检查一次生成状态，请耐心等待...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Spin size="large" />
                      <p className="text-gray-600 mt-4">正在加载{moduleConfig.title}报告...</p>
                    </div>
                  )}
                </div>
                             ) : reportError ? (
                 // 区分是生成中状态还是失败状态
                 isGenerating ? (
                   // 生成中状态：显示loading界面
                   <div className="flex flex-col items-center justify-center py-20">
                     <div className="w-full max-w-md">
                       <div className="text-center mb-6">
                         <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                           <img src="/images/yy2.png" alt="天乙神算" className="w-full h-full object-cover rounded-full" />
                           <div className="absolute inset-0 flex items-center justify-center">
                             <Spin
                               indicator={<LoadingOutlined style={{ fontSize: 24, color: 'white' }} spin />}
                             />
                           </div>
                         </div>
                         <h3 className="text-lg font-semibold text-gray-900 mb-2"></h3>
                         <p className="text-gray-600">{generationStatus}</p>
                         <p className="text-sm text-gray-500 mt-2">您的{moduleConfig.title}报告正在生成中，预计等候三分钟。</p>
                       </div>
                     </div>
                   </div>
                 ) : (
                   // 失败状态：显示错误信息
                   <div className="text-center py-20">
                     <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                       <span className="text-red-600 text-2xl">❌</span>
                     </div>
                     <h3 className="text-lg font-semibold text-gray-900 mb-2">报告生成失败</h3>
                     <p className="text-gray-600 mb-4">{reportError}</p>
                     {/* <Button type="primary" onClick={regenerateReport}>
                       重新生成报告
                     </Button> */}
                   </div>
                 )
              ) : reportContent ? (
                <div className="prose prose-gray max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => <h1 className="text-2xl font-bold text-gray-900 mb-4">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-xl font-semibold text-gray-900 mb-3 mt-6">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-lg font-medium text-gray-900 mb-2 mt-4">{children}</h3>,
                      p: ({ children }) => <p className="text-gray-700 mb-4 leading-relaxed">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                      em: ({ children }) => <em className="italic text-gray-800">{children}</em>,
                      ul: ({ children }) => <ul className="list-disc list-inside mb-4 text-gray-700">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside mb-4 text-gray-700">{children}</ol>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 pl-4 italic text-gray-600 mb-4">
                          {children}
                        </blockquote>
                      ),
                      code: ({ children }) => (
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">
                          {children}
                        </code>
                      ),
                      pre: ({ children }) => (
                        <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
                          {children}
                        </pre>
                      ),
                    }}
                  >
                          {formatReportContent(reportContent)}
                          {/* {reportContent} */}
                  </ReactMarkdown>
                </div>
              ) : isGenerating ? (
                // 生成中状态：显示loading界面
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-full max-w-md">
                    <div className="text-center mb-6">
                                               <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                           <img src="/images/yy2.png" alt="天乙神算" className="w-full h-full object-cover rounded-full" />
                           <div className="absolute inset-0 flex items-center justify-center">
                             <Spin
                               indicator={<LoadingOutlined style={{ fontSize: 24, color: 'white' }} spin />}
                             />
                           </div>
                         </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2"></h3>
                      <p className="text-gray-600">{generationStatus}</p>
                      <p className="text-sm text-gray-500 mt-2">您的{moduleConfig.title}报告正在生成中，预计等候三分钟。</p>
                    </div>
                  </div>
                </div>
              ) : reportError ? (
                // 失败状态：显示错误信息
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-red-600 text-2xl">❌</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">报告生成失败</h3>
                  <p className="text-gray-600 mb-4">{reportError}</p>
                  <Button type="primary" onClick={regenerateReport}>
                    重新生成报告
                  </Button>
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileTextOutlined className="text-gray-400 text-2xl" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无{moduleConfig.title}报告</h3>
                  <p className="text-gray-600 mb-4">请联系管理员生成您的专属{moduleConfig.title}分析报告</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* 聊天对话区域 */
          <div className="h-full flex flex-col">
            {/* 聊天消息区域 */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 relative custom-scrollbar"
              style={{ 
                overscrollBehavior: 'contain'
              }}
              onScroll={handleScroll}
            >
              {!activeConversationId || !getCurrentConversation()?.messages.length ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <img 
                    src="/images/yy2.png" 
                    alt={chatAvailable ? '聊天可用' : '聊天不可用'} 
                    className="w-32 h-32 mb-6"
                  />
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    福生无量天尊， {(() => {
                      const activeUser = getActiveUser()
                      return activeUser?.name || userInfo?.nickname || userInfo?.name || '用户'
                    })()}{chatAvailable ? '道友，你好~' : '道友，你好~'}
                  </h2>
                  {chatAvailable ? (
                    <>
                      <p className="text-gray-600 mb-8 max-w-md">
                        我已了解您的八字信息，您可以咨询与&quot;{moduleConfig.title}&quot;相关的问题。
                      </p>
                      {/* <div className="bg-gray-100 rounded-lg p-4 max-w-md">
                        <p className="text-sm text-gray-600">
                          💡 输入您的问题并发送，我会为您创建一个新的对话并开始回答
                        </p>
                      </div> */}
                    </>
                  ) : (
                    <>
                      <p className="text-gray-600 mb-8 max-w-md">
                        {chatDisabledReason || '聊天功能暂不可用，请稍后重试'}
                      </p>
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 max-w-md">
                        <p className="text-sm text-orange-700">
                          📋 请先查看【生成报告】页面，完成{moduleConfig.title}报告的生成后即可开始聊天
                        </p>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                (getCurrentConversation()?.messages || []).map((message, index) => {
                  devLog.log('🎨 渲染消息:', {
                    messageId: message.id,
                    type: message.type,
                    contentLength: message.content.length,
                    content: message.content.substring(0, 50) + (message.content.length > 50 ? '...' : ''),
                    displayContentLength: message.displayContent?.length || 0,
                    isTyping,
                    streamingConversationId,
                    currentConversationId: getCurrentConversation()?.id,
                    isStreamingMatch: streamingConversationId === getCurrentConversation()?.id,
                    isEmpty: message.content === ''
                  })
                  return (
                <div key={message.id} className={`mb-6 ${message.type === 'user' ? 'flex justify-end' : 'flex justify-start'}`}>
                  <div className={`max-w-[80%] ${message.type === 'user' ? 'flex flex-col items-end' : 'flex flex-col items-start'}`}>
                    {/* 用户消息头部信息（头像和时间） */}
                    {message.type === 'user' && (
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xs text-gray-500">
                          {formatTime(message.timestamp)}
                        </span>
                        <UserOutlined className="text-gray-400" />
                        <span className="text-sm text-gray-600">您</span>
                      </div>
                    )}

                    {/* AI消息头部信息（头像和时间） */}
                    {message.type === 'bot' && (
                      <div className="flex items-center space-x-2 mb-2">
                        <img src="/images/yy3.png" alt="AI助手" className="w-8 h-8" />
                        <span className="text-xs text-gray-500">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                    )}
                    {message.type === 'bot' ? (
                      // 🤖 Bot消息渲染逻辑
                      (() => {
                        // 修复：使用streamingConversationId来判断是否正在流式输出，不依赖isTyping
                        const isCurrentlyStreaming = streamingConversationId === getCurrentConversation()?.id
                        const hasRawContent = message.content && message.content.trim() !== ''
                        const hasDisplayContent = message.displayContent && message.displayContent.trim() !== ''
                        
                        // 内容显示逻辑：始终过滤掉标记内容
                        let contentToDisplay = ''
                        
                        // 优先使用displayContent（如果存在且有效）
                        if (hasDisplayContent && message.displayContent) {
                          contentToDisplay = message.displayContent
                        } 
                        // 否则使用原始内容，但必须经过过滤
                        else if (hasRawContent && message.content) {
                          const extracted = extractDisplayContent(message.content)
                          if (extracted && extracted.trim() !== '') {
                            contentToDisplay = extracted
                          } else {
                            // 如果extractDisplayContent失败，手动过滤标记
                            const startMarker = "fabuwc directly streaming reply."
                            const startIndex = message.content.indexOf(startMarker)
                            if (startIndex !== -1) {
                              contentToDisplay = message.content.substring(startIndex + startMarker.length).trim()
                            } else {
                              contentToDisplay = '' // 如果没有找到标记，不显示任何内容
                            }
                          }
                        }
                        // 最后的安全fallback：如果还是没有内容但有原始数据，也要经过筛选
                        else if (message.content) {
                          const extracted = extractDisplayContent(message.content)
                          if (extracted && extracted.trim() !== '') {
                            contentToDisplay = extracted
                          } else {
                            // 手动过滤标记
                            const startMarker = "fabuwc directly streaming reply."
                            const startIndex = message.content.indexOf(startMarker)
                            if (startIndex !== -1) {
                              contentToDisplay = message.content.substring(startIndex + startMarker.length).trim()
                            } else {
                              contentToDisplay = '' // 如果没有找到标记，不显示任何内容
                            }
                          }
                        }
                        
                        const hasValidContent = contentToDisplay && contentToDisplay.trim() !== ''
                        
                        devLog.log('🎨 Bot消息内容分析:', {
                          messageId: message.id,
                          hasRawContent,
                          hasDisplayContent,
                          hasValidContent,
                          isCurrentlyStreaming,
                          contentLength: message.content?.length || 0,
                          displayContentLength: message.displayContent?.length || 0,
                          extractedContentLength: contentToDisplay.length,
                          // 关键状态信息
                          isTyping,
                          streamingConversationId,
                          currentConversationId: getCurrentConversation()?.id,
                          isStreamingMatch: streamingConversationId === getCurrentConversation()?.id,
                          currentBotMessageId,
                          isCurrentBotMessage: message.id === currentBotMessageId,
                          // 内容预览
                          contentPreview: message.content?.substring(0, 100) || '',
                          displayContentPreview: message.displayContent?.substring(0, 100) || '',
                          extractedContentPreview: contentToDisplay.substring(0, 100),
                          // 新增：显示决策
                          willShowTyping: !hasValidContent && isCurrentlyStreaming,
                          willShowWaiting: !hasValidContent && !isCurrentlyStreaming,
                          willShowContent: hasValidContent
                        })
                        
                        // 如果消息完全没有有效内容
                        if (!hasValidContent) {
                          if (isCurrentlyStreaming) {
                            // 正在流式输出但还没有内容，显示typing指示器
                            return <TypingIndicator />
                          } else {
                            // 不在流式输出中且没有内容，显示等待提示
                            return <TypingIndicator />
                          }
                        }
                        
                        // 有内容时，显示内容
                        return (
                          <div className="bg-gray-100 text-gray-900 rounded-lg p-4">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                                em: ({ children }) => <em className="italic">{children}</em>,
                                ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                                li: ({ children }) => <li className="mb-1">{children}</li>,
                                code: ({ children }) => (
                                  <code className="px-2 py-1 rounded text-sm font-mono bg-gray-200 text-gray-800">
                                    {children}
                                  </code>
                                ),
                                blockquote: ({ children }) => (
                                  <blockquote className="border-l-4 pl-4 italic mb-2 border-gray-300 text-gray-600">
                                    {children}
                                  </blockquote>
                                ),
                              }}
                            >
                              {contentToDisplay}
                            </ReactMarkdown>
                          </div>
                        )
                      })()
                    ) : (
                      // 👤 User消息渲染逻辑
                      <div className="bg-gray-100 text-gray-900 rounded-lg p-4">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                            em: ({ children }) => <em className="italic">{children}</em>,
                            ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                            li: ({ children }) => <li className="mb-1">{children}</li>,
                            code: ({ children }) => (
                              <code className="px-2 py-1 rounded text-sm font-mono bg-gray-200 text-gray-800">
                                {children}
                              </code>
                            ),
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-4 pl-4 italic mb-2 border-gray-300 text-gray-600">
                                {children}
                              </blockquote>
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />

              {/* 回到底部按钮 */}
              {showScrollToBottom && (
                <div className="fixed bottom-60 right-8 z-10">
                  <Button
                    type="primary"
                    shape="circle"
                    size="large"
                    icon={<DownOutlined />}
                    onClick={handleScrollToBottomClick}
                    className="shadow-sm hover:shadow-md transition-all duration-300 ease-out"
                    style={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      color: '#1d1d1f',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="回到底部"
                  />
                </div>
              )}
            </div>

            {/* 输入框区域 */}
            <div className="px-4 py-4 pb-6 bg-white">
              <div className="max-w-4xl mx-auto">
                {/* 问题按钮区域 */}
                {(() => {
                  const suggestedQuestions = getSuggestedQuestions()
                  return suggestedQuestions.length > 0 && chatAvailable && (
                    <div className="mb-3">
                      <div className="text-xs text-gray-500 mb-2 px-1">天乙为您推荐：</div>
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {suggestedQuestions.map((question, index) => (
                          <button
                            key={index}
                            onClick={() => handleQuestionClick(question)}
                            disabled={loading || isTyping}
                            className={`
                              question-button flex-shrink-0 px-3 py-2 text-sm rounded-full border
                              ${loading || isTyping 
                                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' 
                                : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 cursor-pointer'
                              }
                            `}
                            title={question}
                          >
                            {question.length > 15 ? question.substring(0, 15) + '...' : question}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })()}
                <div className="relative">
                  <TextArea
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    placeholder={chatAvailable ? "请输入您的问题..." : "聊天功能暂不可用"}
                    autoSize={{ minRows: 2, maxRows: 8 }}
                    className={`w-full border rounded-lg px-3 py-2 pr-12 resize-none focus:outline-none ${
                      chatAvailable 
                        ? 'border-gray-200 focus:border-blue-400' 
                        : 'border-gray-300 bg-gray-50 cursor-not-allowed'
                    }`}
                    disabled={!chatAvailable || loading || isTyping}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        if (currentMessage.trim() && !loading && !isTyping && chatAvailable) {
                          sendMessage()
                        }
                      }
                    }}
                  />
                  <div className="absolute bottom-2 right-2">
                    <Button
                      type={currentMessage.trim() && chatAvailable ? "primary" : "default"}
                      shape="circle"
                      icon={<ArrowUpOutlined />}
                      onClick={() => {
                        devLog.log('🚀 点击发送按钮:', {
                          chatAvailable,
                          currentMessage: currentMessage.trim(),
                          loading,
                          isTyping,
                          activeConversationId,
                          conversationsCount: conversations.length
                        })
                        sendMessage()
                      }}
                      loading={loading}
                      disabled={!chatAvailable || !currentMessage.trim() || loading || isTyping}
                      className={`w-8 h-8 flex items-center justify-center transition-all duration-200 shadow-sm ${
                        currentMessage.trim() && !loading && !isTyping && chatAvailable
                          ? 'bg-blue-500 hover:bg-blue-600 border-blue-500 text-white' 
                          : 'bg-gray-200 border-gray-200 text-gray-400'
                      }`}
                      title={
                        !chatAvailable 
                          ? chatDisabledReason || "聊天功能暂不可用"
                          : currentMessage.trim() 
                            ? "发送消息" 
                            : "请输入消息"
                      }
                    />
                  </div>
                </div>
                
                {/* Chat禁用提示 */}
                {!chatAvailable && chatDisabledReason && (
                  <div className="flex items-center justify-center mt-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                    <span className="text-orange-600 text-sm">
                      ⚠️ {chatDisabledReason}
                    </span>
                  </div>
                )}
                
                <div className="text-xs text-gray-400 mt-2 text-center">
                  {chatAvailable ? "Enter 发送，Shift + Enter 换行" : "聊天功能需要先生成报告"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 移动端功能抽屉 */}
      <Drawer
        title={
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">乙</span>
            </div>
            <span>天乙神算</span>
          </div>
        }
        placement="left"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={320}
        className="md:hidden"
      >
        {/* 用户欢迎区域 */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
              <UserOutlined className="text-white" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">欢迎，{userInfo?.nickname || '用户'}</div>
              <div className="text-xs text-gray-500">您的专属命理师</div>
            </div>
          </div>
        </div>

        {/* 功能菜单 */}
        <div className="space-y-3 mb-6">
          <div
            onClick={() => {
              setCurrentContent('report')
              setDrawerVisible(false)
            }}
            className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
              currentContent === 'report'
                ? 'bg-gray-100 text-gray-900'
                : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <FileTextOutlined className="text-lg" />
            <span className="font-medium">{moduleConfig.reportButtonText}</span>
          </div>

          <div
            onClick={() => {
              createNewConversation()
              setCurrentContent('chat')
              setDrawerVisible(false)
            }}
            className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
              currentContent === 'chat'
                ? 'bg-gray-100 text-gray-900'
                : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <MessageOutlined className="text-lg" />
            <span className="font-medium">{moduleConfig.title}对话</span>
          </div>
        </div>

        {/* 对话历史 */}
        {(conversationsLoading || conversations.length > 0) && (
          <div className="flex flex-col max-h-96 overflow-hidden">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <span className="text-sm font-medium text-gray-700">对话历史</span>
              <Button
                type="text"
                icon={<PlusOutlined />}
                size="small"
                onClick={async () => {
                  await handleNewConversationButton()
                  setDrawerVisible(false)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                新对话
              </Button>
            </div>

            <div 
              className="space-y-2 overflow-y-auto custom-scrollbar" 
              style={{ overscrollBehavior: 'contain' }}
            >
              {conversationsLoading ? (
                <div className="flex flex-col items-center justify-center py-6">
                  <Spin size="default" />
                  <p className="text-gray-500 text-sm mt-3">加载对话历史中...</p>
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <MessageOutlined className="text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">暂无对话历史</p>
                  <p className="text-gray-400 text-xs mt-1">开始新对话试试吧</p>
                </div>
              ) : (
                                  conversations
                    .sort((a, b) => {
                      if (a.isPinned && !b.isPinned) return -1
                      if (!a.isPinned && b.isPinned) return 1
                      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    })
                    .slice(0, visibleConversationsCount)
                    .map((conversation) => (
                <div
                  key={conversation.id}
                  className={`group relative p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                    activeConversationId === conversation.id && currentContent === 'chat'
                      ? 'bg-gray-100 border border-gray-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                  onClick={() => handleConversationSelect(conversation, true)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      {conversation.isPinned && (
                        <PushpinFilled className="text-gray-600 text-xs flex-shrink-0" />
                      )}
                      <div className="font-medium text-sm text-gray-900 truncate">
                        {conversation.title}
                      </div>
                    </div>
                    <Dropdown
                      menu={{
                        items: [
                          {
                            key: 'pin',
                            label: conversation.isPinned ? '取消置顶' : '置顶',
                            icon: conversation.isPinned ? <PushpinOutlined /> : <PushpinFilled />,
                            onClick: () => pinConversation(conversation.id)
                          },
                          {
                            key: 'rename',
                            label: '重命名',
                            icon: <EditOutlined />,
                            onClick: () => startRenameConversation(conversation.id, conversation.title)
                          },
                          {
                            type: 'divider'
                          },
                          {
                            key: 'delete',
                            label: '删除',
                            icon: <DeleteOutlined />,
                            danger: true,
                            onClick: () => deleteConversation(conversation.id)
                          }
                        ]
                      }}
                      trigger={['click']}
                      placement="bottomRight"
                    >
                      <Button
                        type="text"
                        size="small"
                        icon={<MoreOutlined />}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Dropdown>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDate(conversation.createdAt)}
                  </div>
                </div>
              ))
            )}
            

            
            {/* 移动端加载更多对话按钮 */}
            {!conversationsLoading && conversations.length > 0 && (
              (() => {
                const remainingCount = conversations.length - visibleConversationsCount
                return remainingCount > 0 ? (
                  <div className="text-center py-3">
                    <Button
                      type="default"
                      size="small"
                      onClick={loadMoreConversations}
                      className="text-gray-600 border-gray-300 hover:text-gray-800 hover:border-gray-400"
                    >
                      加载更多对话 ({remainingCount})
                    </Button>
                  </div>
                ) : null
              })()
            )}
          </div>
        </div>
        )}
      </Drawer>

      {/* 重命名对话Modal */}
      <Modal
        title="重命名对话"
        open={renameModalVisible}
        onOk={confirmRenameConversation}
        onCancel={() => {
          setRenameModalVisible(false)
          setRenamingConversationId(null)
          setNewTitle('')
        }}
        okText="确认"
        cancelText="取消"
      >
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="请输入新的对话标题"
          maxLength={50}
          onPressEnter={confirmRenameConversation}
        />
      </Modal>
    </div>
    </>
  )
} 