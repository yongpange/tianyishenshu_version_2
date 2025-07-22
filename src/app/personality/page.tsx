'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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
import { getUserConversations, saveConversation, deleteConversationFromSupabase } from '@/lib/user-manager'

const { TextArea } = Input
const { Title, Text, Paragraph } = Typography

interface ChatMessage {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
}

interface ConversationHistory {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: Date
  cozeConversationId?: string // Coze对话ID，用于保持对话连续性
  isPinned?: boolean // 是否置顶
  isManualTitle?: boolean // 是否为用户手动设置的标题
  moduleType?: string // 模块类型
  dbConversationId?: string // 数据库中的对话ID
}

// 内容类型枚举
type ContentType = 'chat' | 'report'

export default function PersonalityReportPage() {
  const [userInfo, setUserInfo] = useState<any>(null)
  const [currentContent, setCurrentContent] = useState<ContentType>('chat') // 默认显示聊天界面
  const [conversations, setConversations] = useState<ConversationHistory[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [currentMessage, setCurrentMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false) // AI正在回复的状态
  // const [canAbort, setCanAbort] = useState(false) // 是否可以中断请求
  // const [abortController, setAbortController] = useState<AbortController | null>(null)
  
  // 流式响应相关状态（用于暂停时保存内容）
  const [currentStreamingContent, setCurrentStreamingContent] = useState<string>('')
  const [currentBotMessageId, setCurrentBotMessageId] = useState<string | null>(null)
  const [currentDbConversationId, setCurrentDbConversationId] = useState<string | null>(null)

  const [drawerVisible, setDrawerVisible] = useState(false)
  const [reportContent, setReportContent] = useState<string | null>(null)
  const [reportLoading, setReportLoading] = useState(true)
  const [reportError, setReportError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // 新增：异步生成相关状态
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationStatus, setGenerationStatus] = useState('')
  const [taskId, setTaskId] = useState<string | null>(null)

  // 新增状态：中间聊天记录区域的显示/隐藏
  const [chatHistoryVisible, setChatHistoryVisible] = useState(true)
  
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

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // 滚动检测常量
  const BOTTOM_THRESHOLD = 100 // 距离底部100px内算"接近底部"
  const SCROLL_DEBOUNCE = 150  // 防抖延迟150ms
  const USER_SCROLL_THRESHOLD = 5 // 超过5px算用户主动滚动

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

    // 检测用户是否主动滚动
    if (detectUserScroll(currentScrollTop)) {
      setIsUserScrolling(true)

      // 清除之前的定时器
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      // 延迟重置用户滚动状态
      scrollTimeoutRef.current = setTimeout(() => {
        setIsUserScrolling(false)
      }, SCROLL_DEBOUNCE)
    }

    // 检测是否接近底部
    const nearBottom = isNearBottom(element)

    // 更新自动滚动状态
    if (nearBottom) {
      setIsAutoScrollEnabled(true)
      setShowScrollToBottom(false)
    } else {
      setIsAutoScrollEnabled(false)
      setShowScrollToBottom(true)
    }

    // 更新最后滚动位置
    setLastScrollTop(currentScrollTop)

    console.log('📊 滚动状态:', {
      currentScrollTop,
      nearBottom,
      isUserScrolling: isUserScrolling,
      autoScrollEnabled: nearBottom
    })
  }, [detectUserScroll, isNearBottom, isUserScrolling, SCROLL_DEBOUNCE])

  // 智能自动滚动
  const smartAutoScroll = useCallback(() => {
    // 只在满足条件时自动滚动
    if (isAutoScrollEnabled && !isUserScrolling) {
      console.log('🤖 执行智能自动滚动')
      requestAnimationFrame(() => {
        scrollToBottom(true)
      })
    } else {
      console.log('⏸️ 跳过自动滚动:', {
        autoScrollEnabled: isAutoScrollEnabled,
        userScrolling: isUserScrolling
      })
    }
  }, [isAutoScrollEnabled, isUserScrolling, scrollToBottom])

  // 监听对话消息变化，执行智能滚动
  useEffect(() => {
    const currentConv = conversations.find(conv => conv.id === activeConversationId)
    if (currentConv && currentConv.messages.length > 0) {
      // 延迟执行，确保DOM已更新
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
    console.log('🔽 用户点击回到底部')
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
      // 判断userId是否为user_profiles.id（UUID格式）
      const isUserProfileId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)
      
      console.log('📊 轮询状态请求:', { userId, taskId, isUserProfileId })
      
      const response = await fetch('/api/personality-report/status', {
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
      console.log('📊 轮询状态结果:', result)

      if (result.success) {
        setGenerationProgress(result.progress)

        switch (result.status) {
          case 'generating':
            setGenerationStatus('正在生成性格报告...')
            setIsGenerating(true)
            console.log('🔄 报告生成中...', { progress: result.progress })
            break

          case 'completed':
            setGenerationStatus('报告生成完成！')
            setIsGenerating(false)
            setReportContent(result.content)
            setReportLoading(false)

            // 停止轮询
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current)
              pollingIntervalRef.current = null
            }

            console.log('✅ 报告生成完成!', { 
              contentLength: result.content?.length || 0,
              userId: userId,
              taskId: taskId,
              isUserProfileId: isUserProfileId
            })
            message.success('性格报告生成完成！')
            break

          case 'failed':
            setGenerationStatus('报告生成失败')
            setIsGenerating(false)
            setReportError(result.error || '生成失败，请重试')
            setReportLoading(false)

            // 停止轮询
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current)
              pollingIntervalRef.current = null
            }

            console.error('❌ 报告生成失败:', { 
              error: result.error,
              userId: userId,
              taskId: taskId,
              isUserProfileId: isUserProfileId
            })
            break

          default:
            console.log('📊 未知状态:', result.status)
            break
        }
      } else {
        console.error('❌ 轮询状态失败:', result.error)
        setReportError(result.error || '查询状态失败')
        
        // 停止轮询
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
      }
    } catch (error) {
      console.error('❌ 轮询请求失败:', error)
      setReportError('网络错误，请刷新页面重试')
      
      // 停止轮询
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }

  // 开始轮询
  const startPolling = (userId: string, taskId: string) => {
    console.log('🔄 开始轮询报告状态:', { userId, taskId })

    // 立即执行一次
    pollReportStatus(userId, taskId)

    // 每3秒轮询一次
    pollingIntervalRef.current = setInterval(() => {
      console.log('⏰ 轮询定时器执行:', { userId, taskId })
      pollReportStatus(userId, taskId)
    }, 3000)
    
    console.log('✅ 轮询定时器已启动')
  }

  // 停止轮询
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }

  // 加载性格报告
  const loadPersonalityReport = async () => {
    try {
      setReportLoading(true)
      setReportError(null)

      // 优先从当前激活用户获取信息
      const activeUser = getActiveUser()
      let reportUserId: string
      let isUserProfileId = false

      console.log('🔍 开始确定用户身份:', { activeUser })

      if (activeUser && activeUser.id) {
        // 激活子用户模式：使用激活用户的user_profiles.id
        reportUserId = activeUser.id
        isUserProfileId = true
        console.log('📋 激活子用户模式：使用激活用户的user_profiles.id:', reportUserId)
      } else {
        // 备用方案：从URL参数中获取userId
        const searchParams = new URLSearchParams(window.location.search)
        const urlUserId = searchParams.get('userId')
        
        console.log('🔍 URL参数检查:', { urlUserId })
        
        if (urlUserId) {
          // 子用户模式：使用URL中的user_profiles.id
          reportUserId = urlUserId
          isUserProfileId = true
          console.log('📋 子用户模式：使用URL中的user_profiles.id:', reportUserId)
        } else {
          // 主用户模式：使用手机号
          const phoneNumber = getUserPhoneNumber()
          console.log('📱 获取到的手机号:', phoneNumber)
          
          if (!phoneNumber) {
            setReportError('未找到用户信息，请重新登录')
            return
          }
          reportUserId = phoneNumber
          console.log('📋 主用户模式：使用手机号:', reportUserId)
        }
      }

      console.log('📖 开始获取性格报告:', { reportUserId, isUserProfileId })

      // 使用 API 路由获取报告
      const response = await fetch('/api/personality-report/get', {
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
      console.log('📋 API响应结果:', { 
        success: result.success, 
        error: result.error, 
        hasReport: !!result.report,
        reportContentLength: result.report?.content?.length || 0
      })

      if (result.success && result.report) {
        console.log('✅ 成功获取报告:', {
          contentLength: result.report.content?.length || 0,
          generatedAt: result.report.generatedAt,
          reportUserId: reportUserId,
          isUserProfileId: isUserProfileId
        })
        setReportContent(result.report.content)
      } else {
        console.log('❌ 获取报告失败:', { 
          error: result.error, 
          reportUserId: reportUserId,
          isUserProfileId: isUserProfileId 
        })
        setReportError(result.error || '性格报告未生成，请返回信息填写页重新生成')
      }
    } catch (error) {
      console.error('❌ 加载性格报告失败:', error)
      setReportError('加载报告失败，请稍后重试')
    } finally {
      setReportLoading(false)
    }
  }

  // 复制报告内容
  const copyReport = async () => {
    if (!reportContent) return

    try {
      // 优先尝试现代 clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(reportContent)
        setCopied(true)
        message.success('报告已复制到剪贴板')
        setTimeout(() => setCopied(false), 2000)
        return
      }

      // 备用方案：使用 textArea 元素
      const textArea = document.createElement('textarea')
      textArea.value = reportContent
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      
      if (successful) {
        setCopied(true)
        message.success('报告已复制到剪贴板')
        setTimeout(() => setCopied(false), 2000)
      } else {
        throw new Error('execCommand copy failed')
      }
    } catch (error) {
      console.error('❌ 复制失败:', error)
      
      // 最后的备用方案：显示选择提示
      Modal.info({
        title: '复制报告内容',
        content: (
          <div>
            <p>自动复制失败，请手动复制以下内容：</p>
            <TextArea
              value={reportContent}
              readOnly
              autoSize={{ minRows: 10, maxRows: 20 }}
              style={{ marginTop: 8 }}
              onFocus={(e) => e.target.select()}
            />
          </div>
        ),
        width: 600,
        okText: '关闭'
      })
    }
  }

  // 重新生成报告
  const regenerateReport = async () => {
    try {
      console.log('🔄 开始重新生成报告...')
      
      // 获取用户信息
      if (!userInfo) {
        console.error('❌ 用户信息缺失')
        message.error('用户信息缺失，请刷新页面重试')
        return
      }

      // 确定用户ID和模式
      const activeUser = getActiveUser()
      let reportUserId: string
      let isUserProfileId = false

      if (activeUser && activeUser.id) {
        // 激活子用户模式：使用激活用户的user_profiles.id
        reportUserId = activeUser.id
        isUserProfileId = true
        console.log('📋 重新生成-子用户模式：使用激活用户的user_profiles.id:', reportUserId)
      } else {
        // 主用户模式：使用手机号
        const phoneNumber = getUserPhoneNumber()
        if (!phoneNumber) {
          console.error('❌ 无法获取用户手机号')
          message.error('未找到用户信息，请重新登录')
          return
        }
        reportUserId = phoneNumber
        console.log('📋 重新生成-主用户模式：使用手机号:', reportUserId)
      }

      // 设置生成状态
      setIsGenerating(true)
      setGenerationStatus('正在重新生成性格报告...')
      setReportLoading(true)
      setReportError(null)
      setCurrentContent('report') // 切换到报告页面
      setGenerationProgress(0)

      console.log('🚀 调用异步生成API:', { reportUserId, isUserProfileId })

      // 调用异步生成API
      const response = await fetch('/api/personality-report/generate-async', {
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
      console.log('📋 异步生成API响应:', result)

      if (result.success) {
        if (result.taskId === 'existing') {
          // 如果已有相同报告，直接加载
          console.log('📋 发现相同报告，直接加载')
          setIsGenerating(false)
          loadPersonalityReport()
        } else {
          // 启动轮询
          console.log('🔄 启动轮询监控报告生成:', result.taskId)
          setTaskId(result.taskId)
          startPolling(reportUserId, result.taskId)
        }
        
        message.success('已启动报告重新生成')
      } else {
        throw new Error(result.error || '启动报告生成失败')
      }

    } catch (error) {
      console.error('❌ 重新生成报告失败:', error)
      message.error(error instanceof Error ? error.message : '重新生成失败，请稍后重试')
      setIsGenerating(false)
      setReportLoading(false)
      setReportError('重新生成失败，请稍后重试')
    }
  }

  // 加载对话历史
  const loadConversations = async () => {
    try {
      setConversationsLoading(true) // 开始加载
      
      // 获取当前激活用户的资料ID
      const activeUser = getActiveUser()
      let userProfileId: string | null = null
      
      if (activeUser && activeUser.id) {
        userProfileId = activeUser.id
        console.log('📋 使用激活用户的user_profiles.id加载对话历史:', userProfileId)
      } else {
        console.warn('⚠️ 无法获取用户资料ID，跳过对话历史加载')
        setConversationsLoading(false)
        return
      }

      // 从数据库加载对话列表
      const conversationsResponse = await fetch('/api/conversations/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userProfileId: userProfileId,
          moduleType: 'personality'
        })
      })

      const conversationsResult = await conversationsResponse.json()

      if (!conversationsResult.success) {
        throw new Error(conversationsResult.message || '获取对话列表失败')
      }

      const dbConversations = conversationsResult.conversations || []
      console.log('📋 从数据库获取到对话:', dbConversations.length, '个')

      // 转换为前端格式并加载每个对话的完整消息
      const formattedConversations = await Promise.all(
        dbConversations.map(async (dbConv: any) => {
          // 获取该对话的所有消息
          const messagesResponse = await fetch('/api/messages/list', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              conversationId: dbConv.id
            })
          })

          const messagesResult = await messagesResponse.json()
          
          let chatMessages: ChatMessage[] = []
          if (messagesResult.success && messagesResult.messages) {
            chatMessages = messagesResult.messages.map((dbMsg: any) => ({
              id: dbMsg.metadata?.frontend_id || dbMsg.id,
              type: dbMsg.role === 'user' ? 'user' : 'bot',
              content: dbMsg.content,
              timestamp: new Date(dbMsg.created_at)
            }))
          }

          return {
            id: `frontend_${dbConv.id}`, // 前端临时ID
            dbConversationId: dbConv.id, // 数据库ID
            title: dbConv.title,
            messages: chatMessages,
            createdAt: new Date(dbConv.created_at),
            cozeConversationId: dbConv.coze_conversation_id,
            isPinned: dbConv.is_pinned,
            isManualTitle: dbConv.is_manual_title,
            moduleType: dbConv.module_type
          }
        })
      )

      setConversations(formattedConversations)
      
      // 注释掉自动激活第一个对话，让用户看到欢迎界面
      // if (formattedConversations.length > 0) {
      //   setActiveConversationId(formattedConversations[0].id)
      // }

      console.log('✅ 对话历史加载成功:', formattedConversations.length, '个对话')

    } catch (error) {
      console.error('❌ 从数据库加载对话历史失败:', error)
      
      // 降级到localStorage
      try {
        const savedConversations = localStorage.getItem('personality_conversations')
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
          // 注释掉自动激活第一个对话，让用户看到欢迎界面
          // if (fixedConversations.length > 0) {
          //   setActiveConversationId(fixedConversations[0].id)
          // }
          console.log('📋 从本地存储加载对话历史:', fixedConversations.length, '个对话')
        }
      } catch (localError) {
        console.error('❌ 从本地存储加载对话历史也失败:', localError)
      }
    } finally {
      setConversationsLoading(false) // 加载完成
    }
  }

  useEffect(() => {
    // 获取URL参数
    const urlParams = new URLSearchParams(window.location.search)
    const urlTaskId = urlParams.get('taskId')
    const isGeneratingParam = urlParams.get('generating') === 'true'
    const urlUserId = urlParams.get('userId')

    console.log('🔍 URL参数:', { urlTaskId, isGeneratingParam, urlUserId })

    // 获取用户信息
    const userData = localStorage.getItem('userData')
    console.log('📋 从localStorage获取的userData:', userData)

    if (userData) {
      try {
        const parsedUserData = JSON.parse(userData)
        console.log('👤 解析后的用户信息:', parsedUserData)
        setUserInfo(parsedUserData)
      } catch (error) {
        console.error('❌ 解析用户信息失败:', error)
        router.push('/profile')
        return
      }
    } else {
      console.warn('⚠️ 未找到用户信息，跳转到个人信息页')
      router.push('/profile')
      return
    }

    // 确定用户ID用于轮询
    let pollingUserId: string
    const activeUser = getActiveUser()
    
    console.log('🔍 确定轮询用户ID:', { activeUser, urlUserId })

    if (activeUser && activeUser.id) {
      // 激活子用户模式
      pollingUserId = activeUser.id
      console.log('📋 使用激活用户ID进行轮询:', pollingUserId)
    } else if (urlUserId) {
      // URL参数中的用户ID
      pollingUserId = urlUserId
      console.log('📋 使用URL用户ID进行轮询:', pollingUserId)
    } else {
      // 使用手机号
      const phoneNumber = getUserPhoneNumber()
      if (!phoneNumber) {
        console.error('❌ 无法获取用户手机号')
        router.push('/login')
        return
      }
      pollingUserId = phoneNumber
      console.log('📋 使用手机号进行轮询:', pollingUserId)
    }

    // 如果是生成模式，启动轮询
    if (isGeneratingParam && urlTaskId) {
      console.log('🚀 检测到生成模式，启动轮询:', { pollingUserId, urlTaskId })
      setTaskId(urlTaskId)
      setIsGenerating(true)
      setGenerationStatus('正在生成性格报告...')
      setReportLoading(true)
      startPolling(pollingUserId, urlTaskId)
    } else {
      console.log('📖 正常模式，加载现有报告')
      // 正常模式，加载现有报告
      loadPersonalityReport()
    }

    // 加载对话历史
    loadConversations()

    // 清理函数：组件卸载时停止轮询
    return () => {
      stopPolling()
    }
  }, [router])

  // 监听用户切换，重新加载数据
  useEffect(() => {
    const handleUserSwitched = () => {
      console.log('👤 检测到用户切换，重新加载性格报告数据')
      // 重置状态
      setReportLoading(true)
      setReportError(null)
      setIsGenerating(false)
      setConversationsLoading(true) // 重置对话历史加载状态
      
      // 停止当前轮询
      stopPolling()
      
      // 获取新的用户信息
      const activeUser = getActiveUser()
      if (activeUser) {
        console.log('👤 切换到用户:', activeUser.name)
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
        
        // 重新加载报告
        loadPersonalityReport()
        
        // 重新加载对话历史
        loadConversations()
      }
    }

    // 监听自定义事件
    window.addEventListener('userSwitched', handleUserSwitched)

    return () => {
      window.removeEventListener('userSwitched', handleUserSwitched)
    }
  }, [])

  // 注意：scrollToBottom 函数已在智能滚动部分定义，这里移除重复定义

  // 导航处理函数
  const handleHealing = () => {
    message.info('功能开发中，敬请期待')
  }

  const handleTreasure = () => {
    message.info('功能开发中，敬请期待')
  }

  // 重置聊天界面 - 不创建新对话，只刷新到初始状态
  const createNewConversation = async () => {
    console.log('🔄 重置聊天界面到初始状态...')

    if (!userInfo) {
      console.warn('⚠️ 用户信息缺失，无法开启对话')
      alert('请先完善个人信息后再开始对话')
      return
    }

    // 重置为初始状态：清除活跃对话ID，显示欢迎界面
    setActiveConversationId(null)
    setCurrentContent('chat') // 确保切换到聊天界面

    console.log('✅ 聊天界面已重置为初始状态')
  }

  // 更新对话标题（使用用户第一个提问内容）
  const updateConversationTitle = async (conversationId: string, messages: ChatMessage[], currentConversations: ConversationHistory[]) => {
    if (messages.length >= 1) { // 有用户消息就更新标题
      // 检查是否为用户手动设置的标题，如果是则不自动更新
      const currentConv = currentConversations.find(conv => conv.id === conversationId)
      if (currentConv?.isManualTitle) {
        console.log('🏷️ 跳过自动更新标题，因为用户已手动设置:', currentConv.title)
        return
      }

      // 检查是否已经是用户第一个问题了，避免重复更新
      if (currentConv?.title && currentConv.title !== '新对话') {
        console.log('🏷️ 标题已设置，跳过更新:', currentConv.title)
        return
      }

      // 找到第一个用户消息作为标题
      const firstUserMessage = messages.find(msg => msg.type === 'user')
      if (!firstUserMessage) {
        console.log('🏷️ 未找到用户消息，跳过标题更新')
        return
      }

      // 限制标题长度，如果太长则截取并添加省略号
      let title = firstUserMessage.content.trim()
      if (title.length > 20) {
        title = title.substring(0, 20) + '...'
      }

      // 1. 立即更新页面显示
      const updatedConversations = currentConversations.map(conv => {
        if (conv.id === conversationId) {
          return { ...conv, title }
        }
        return conv
      })

      setConversations(updatedConversations)
      localStorage.setItem('personality_conversations', JSON.stringify(updatedConversations))

      console.log('🏷️ 对话标题已立即更新页面显示:', title)

      // 2. 异步更新数据库（不阻塞页面）
      if (currentConv?.dbConversationId) {
        console.log('💾 开始异步更新数据库中的对话标题')
        
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

            if (updateResult.success) {
              console.log('✅ 对话标题已成功写入数据库:', title)
            } else {
              console.warn('⚠️ 对话标题数据库更新失败:', updateResult.message)
            }

          } catch (error) {
            console.error('❌ 异步更新对话标题失败:', error)
          }
        }

        // 启动异步更新（不等待完成）
        updateDatabase()
      } else {
        console.log('💾 对话还没有数据库ID，跳过数据库更新')
      }
    }
  }

  // 置顶对话
  const pinConversation = async (conversationId: string) => {
    try {
      // 获取对话信息
      const conversation = conversations.find(conv => conv.id === conversationId)
      if (!conversation?.dbConversationId) {
        console.error('❌ 无法找到对话的数据库ID')
        message.error('操作失败：对话信息错误')
        return
      }

      const newPinnedStatus = !conversation.isPinned

      // 调用更新API
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

      console.log('✅ 置顶状态已更新到数据库')

      // 更新前端状态
      const updatedConversations = conversations.map(conv => {
        if (conv.id === conversationId) {
          return { ...conv, isPinned: newPinnedStatus }
        }
        return conv
      })

      setConversations(updatedConversations)
      localStorage.setItem('personality_conversations', JSON.stringify(updatedConversations))

      message.success(newPinnedStatus ? '已置顶' : '已取消置顶')

    } catch (error) {
      console.error('❌ 更新置顶状态失败:', error)
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
      // 获取对话信息
      const conversation = conversations.find(conv => conv.id === renamingConversationId)
      if (!conversation?.dbConversationId) {
        console.error('❌ 无法找到对话的数据库ID')
        message.error('重命名失败：对话信息错误')
        return
      }

      // 调用更新API
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

      console.log('✅ 对话标题已更新到数据库')

      // 更新前端状态
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
      localStorage.setItem('personality_conversations', JSON.stringify(updatedConversations))

      setRenameModalVisible(false)
      setRenamingConversationId(null)
      setNewTitle('')
      message.success('重命名成功')

    } catch (error) {
      console.error('❌ 重命名对话失败:', error)
      message.error(`重命名失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 删除对话 - 页面优先响应
  const deleteConversation = async (conversationId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个对话吗？删除后无法恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        return new Promise<void>((resolve) => {
          // 获取要删除的对话信息
          const conversationToDelete = conversations.find(conv => conv.id === conversationId)
          if (!conversationToDelete) {
            console.error('❌ 无法找到要删除的对话')
            message.error('删除失败：对话不存在')
            resolve()
            return
          }

          console.log('🗑️ 开始删除对话:', conversationToDelete.title)

          // 1. 先在页面上删除对话
          const updatedConversations = conversations.filter(conv => conv.id !== conversationId)
          setConversations(updatedConversations)
          localStorage.setItem('personality_conversations', JSON.stringify(updatedConversations))

          // 如果删除的是当前活跃对话，切换到第一个对话或清空
          if (activeConversationId === conversationId) {
            if (updatedConversations.length > 0) {
              setActiveConversationId(updatedConversations[0].id)
            } else {
              setActiveConversationId(null)
            }
          }

          console.log('✅ 页面对话已删除，开始同步到数据库')

          // 2. 异步从数据库删除（如果有数据库ID的话）
          const performDatabaseDelete = async () => {
            if (conversationToDelete.dbConversationId) {
              try {
                // 获取用户资料ID
                const activeUser = getActiveUser()
                if (!activeUser?.id) {
                  console.warn('⚠️ 无法获取用户资料ID，跳过数据库删除')
                  return
                }

                // 调用删除API
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

                if (deleteResult.success) {
                  console.log('✅ 对话已从数据库删除')
                } else {
                  console.warn('⚠️ 数据库删除失败，但页面已更新:', deleteResult.message)
                }

              } catch (error) {
                console.error('❌ 数据库删除失败:', error)
                console.warn('⚠️ 对话将仅在本地删除，数据库中可能仍存在')
              }
            } else {
              console.log('📋 对话仅存在于本地，无需数据库操作')
            }
          }

          // 稍微延迟一下确保页面更新完成，然后关闭对话框并显示成功消息
          setTimeout(async () => {
            // 执行数据库删除（不等待结果）
            performDatabaseDelete()
            
            // 关闭对话框
            resolve()
            
            // 在对话框关闭后显示成功消息
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
    console.log('🔄 开始发送消息...')
    console.log('📝 当前消息:', currentMessage)
    console.log('👤 用户信息:', userInfo)
    console.log('💬 活跃对话ID:', activeConversationId)
    console.log('📋 对话列表:', conversations)

    if (!currentMessage.trim()) {
      console.warn('⚠️ 消息内容为空')
      return
    }

    if (!userInfo) {
      console.warn('⚠️ 用户信息缺失')
      alert('用户信息缺失，请先完善个人信息')
      return
    }

    // 确定用户资料ID
    const activeUser = getActiveUser()
    if (!activeUser?.id) {
      console.error('❌ 无法获取用户资料ID')
      alert('无法获取用户信息，请重新登录')
      return
    }

    // 检查用户聊天剩余次数
    console.log('🔍 检查用户聊天剩余次数...')
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
        console.error('❌ 获取用户聊天次数失败:', fetchError)
        message.error('无法获取用户信息，请重试')
        return
      }

      if (!userProfile) {
        console.error('❌ 用户资料不存在')
        message.error('用户资料不存在，请重新登录')
        return
      }

      console.log('💬 用户聊天剩余次数:', userProfile.chat_remaining_count)

      if (userProfile.chat_remaining_count <= 0) {
        console.warn('⚠️ 用户聊天次数已用完')
        message.warning({
          content: '您的聊天次数已用完，请联系客服充值后继续使用',
          duration: 6
        })
        return
      }

      console.log('✅ 聊天次数检查通过，剩余次数:', userProfile.chat_remaining_count)
    } catch (error) {
      console.error('❌ 检查聊天次数失败:', error)
      message.error('检查聊天权限失败，请重试')
      return
    }

    // 设置loading状态
    setLoading(true)
    // setCanAbort(false)

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: currentMessage.trim(),
      timestamp: new Date()
    }

    // 保存当前消息内容，用于错误恢复
    const messageContent = currentMessage.trim()
    setCurrentMessage('') // 清空输入框

    let currentActiveConversationId = activeConversationId
    let workingConversations = [...conversations]

    // 检查是否需要创建新对话（在发送消息时）
    if (!activeConversationId) {
      console.log('🆕 用户发送消息时自动创建新对话')
      
      // 创建新对话对象
      const tempId = Date.now().toString()
      const newConversation: ConversationHistory = {
        id: tempId,
        title: '新对话',
        messages: [],
        createdAt: new Date(),
        moduleType: 'personality'
      }

      // 更新工作变量
      workingConversations = [newConversation, ...conversations]
      currentActiveConversationId = newConversation.id
      
      // 立即更新状态，让界面显示新对话
      setConversations(workingConversations)
      setActiveConversationId(currentActiveConversationId)
      localStorage.setItem('personality_conversations', JSON.stringify(workingConversations))

      console.log('✅ 自动创建对话成功，ID:', newConversation.id)
    }

    // 1. 立即显示用户消息并更新标题（如果是第一条消息）
    console.log('📺 1. 立即显示用户消息')
    
    // 检查是否为新创建的对话的第一条消息
    const isFirstMessageInNewConversation = workingConversations.find(conv => conv.id === currentActiveConversationId)?.messages.length === 0
    
    // 如果是第一条消息，准备新标题
    let newTitle = ''
    if (isFirstMessageInNewConversation) {
      newTitle = userMessage.content.trim()
      if (newTitle.length > 20) {
        newTitle = newTitle.substring(0, 20) + '...'
      }
      console.log('🏷️ 新对话第一条消息，设置标题为:', newTitle)
    }
    
    const updatedConversations = workingConversations.map(conv => {
      if (conv.id === currentActiveConversationId) {
        return {
          ...conv,
          title: isFirstMessageInNewConversation ? newTitle : conv.title, // 立即更新标题
          messages: [...conv.messages, userMessage]
        }
      }
      return conv
    })
    setConversations(updatedConversations)
    localStorage.setItem('personality_conversations', JSON.stringify(updatedConversations))

    // 2. 立即显示AI loading状态
    console.log('🤖 2. 立即显示AI回复loading')
    const typingMessageId = (Date.now() + 1).toString()
    const typingMessage: ChatMessage = {
      id: typingMessageId,
      type: 'bot',
      content: '正在思考中...',
      timestamp: new Date()
    }

    const conversationsWithTyping = updatedConversations.map(conv => {
      if (conv.id === currentActiveConversationId) {
        return {
          ...conv,
          messages: [...conv.messages, typingMessage]
        }
      }
      return conv
    })
    setConversations(conversationsWithTyping)
    setIsTyping(true)

    // 3. 后台处理数据库操作（不阻塞UI）
    let dbConversationId: string | undefined
    
    const handleDatabaseOperations = async () => {
      try {
        // 检查是否需要创建数据库对话
        const currentConversation = updatedConversations.find(conv => conv.id === currentActiveConversationId)
        
        if (!currentConversation?.dbConversationId) {
          console.log('💾 3a. 后台创建数据库对话')
          // 使用已在页面上设置的标题，保持一致性
          const conversationTitle = currentConversation?.title || '新对话'
          console.log('💾 使用标题:', conversationTitle)

          const createResponse = await fetch('/api/conversations/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userProfileId: activeUser.id,
              title: conversationTitle,
              moduleType: 'personality'
            })
          })

          const createResult = await createResponse.json()

          if (!createResult.success) {
            throw new Error(createResult.message || '创建对话失败')
          }

          const dbConversation = createResult.conversation
          console.log('✅ 后台数据库对话创建成功:', dbConversation.id)

          // 更新前端对话对象的数据库ID
          setConversations(prevConversations => 
            prevConversations.map(conv => 
              conv.id === currentActiveConversationId 
                ? { ...conv, dbConversationId: dbConversation.id, createdAt: new Date(dbConversation.created_at) }
                : conv
            )
          )

          dbConversationId = dbConversation.id
        } else {
          dbConversationId = currentConversation.dbConversationId
        }

        // 保存用户消息到数据库
        console.log('💾 3b. 后台保存用户消息')
        const userMessageResponse = await fetch('/api/messages/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationId: dbConversationId,
            role: 'user',
            content: userMessage.content,
            metadata: {
              frontend_id: userMessage.id
            }
          })
        })

        const userMessageResult = await userMessageResponse.json()

        if (!userMessageResult.success) {
          throw new Error('保存用户消息失败')
        }

        console.log('✅ 后台用户消息保存成功')
        return dbConversationId

      } catch (error) {
        console.error('❌ 后台数据库操作失败:', error)
        // 数据库操作失败不影响聊天继续，只是记录错误
        return undefined
      }
    }

    // 启动后台数据库操作（不等待完成）
    const dbOperationPromise = handleDatabaseOperations()

    // 5. 发起AI请求
    try {
      console.log('🚀 5. 调用 Coze API...')

      // 直接从updatedConversations中获取当前对话，而不是使用可能过时的conversations状态
      const currentConv = updatedConversations.find(conv => conv.id === currentActiveConversationId)
      const isFirstMessage = !currentConv?.cozeConversationId

      // 确保用户信息存在
      if (!userInfo) {
        console.error('❌ 用户信息缺失，无法发送消息')
        message.error('用户信息缺失，请刷新页面重试')
        setLoading(false)
        return
      }

      // 生成一致的用户ID（基于手机号）
      const userId = getUserPhoneNumber()
      const consistentUserId = userId ? `user_${userId}` : `user_${Date.now()}`

      // 获取用户的占星上下文信息（替代外部API调用）
      let astrologyContext = null
      if (isFirstMessage) {
        astrologyContext = await getUserAstrologyContext()
        console.log('🔮 获取到占星上下文:', astrologyContext ? '有数据' : '无数据')
      }

      // 只在第一次发送消息时传递用户信息和占星上下文，后续依赖Coze的对话记忆
      const requestBody = {
        message: userMessage.content,
        userInfo: isFirstMessage ? userInfo : undefined, // 只在首次传递用户信息
        astrologyContext: isFirstMessage ? astrologyContext : undefined, // 传递占星上下文而不是调用外部API
        conversationId: currentConv?.cozeConversationId, // 保持对话连续性
        userId: consistentUserId, // 传递一致的用户ID
      }

      console.log('📦 请求体:', requestBody)
      console.log('🔄 是否首次消息:', isFirstMessage)

      // 创建AbortController支持中断
      // const controller = new AbortController()
      // setAbortController(controller)
      // setCanAbort(true)

      // 使用流式请求
      const response = await fetch('/api/coze/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        // signal: controller.signal // 注释掉signal参数
      })

      console.log('📡 API响应状态:', response.status)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // 检查是否是流式响应
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('text/event-stream')) {
        console.log('🌊 开始处理流式响应...')

        // 使用现有的typing消息作为bot回复消息
        const botMessageId = typingMessageId
        let streamingContent = ''
        let finalConversationId = ''
        let finalChatId = ''

        // 设置流式响应状态变量（用于暂停时保存）
        setCurrentBotMessageId(botMessageId)
        setCurrentStreamingContent('') // 确保清空之前的内容
        
        // 等待数据库操作完成，获取数据库对话ID
        try {
          const dbConversationId = await dbOperationPromise
          setCurrentDbConversationId(dbConversationId || null)
          console.log('📋 已设置数据库对话ID用于暂停保存:', dbConversationId)
        } catch (error) {
          console.warn('⚠️ 获取数据库对话ID失败，暂停保存可能受影响:', error)
        }

        // 移除typing状态，准备接收实际内容
        setIsTyping(false)

        // 处理流式数据
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (reader) {
          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              const chunk = decoder.decode(value)
              const lines = chunk.split('\n')

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6))
                    console.log('📦 收到流式数据:', data)

                    if (data.type === 'content') {
                      streamingContent += data.content
                      finalConversationId = data.conversationId || finalConversationId
                      finalChatId = data.chatId || finalChatId

                      // 同步更新流式内容状态，用于暂停时保存
                      setCurrentStreamingContent(streamingContent)

                      // 实时更新消息内容，使用现有的typing消息
                      setConversations(prevConversations =>
                        prevConversations.map(conv => {
                          if (conv.id === currentActiveConversationId) {
                            return {
                              ...conv,
                              messages: conv.messages.map(msg =>
                                msg.id === botMessageId
                                  ? { ...msg, content: streamingContent }
                                  : msg
                              ),
                              cozeConversationId: conv.cozeConversationId || finalConversationId,
                            }
                          }
                          return conv
                        })
                      )
                    } else if (data.type === 'done') {
                      console.log('✅ 流式响应完成')
                      finalConversationId = data.conversationId || finalConversationId
                      finalChatId = data.chatId || finalChatId

                      // 立即更新前端状态和清除UI加载状态
                      setConversations(prevConversations => {
                        const finalConversations = prevConversations.map(conv => {
                          if (conv.id === currentActiveConversationId) {
                            return {
                              ...conv,
                              messages: conv.messages.map(msg =>
                                msg.id === botMessageId
                                  ? { ...msg, content: data.fullResponse || streamingContent }
                                  : msg
                              ),
                              cozeConversationId: conv.cozeConversationId || finalConversationId,
                            }
                          }
                          return conv
                        })

                        // 标题已在用户发送消息时设置，此处无需更新
                        
                        // 保存到本地存储作为备份
                        localStorage.setItem('personality_conversations', JSON.stringify(finalConversations))

                        return finalConversations
                      })

                      // 立即清除加载状态，恢复输入框可用性
                      setIsTyping(false)
                      // setCanAbort(false)
                      // setAbortController(null)

                      // 后台异步执行数据库保存操作（不阻塞UI）
                      const saveToDatabase = async () => {
                        console.log('💾 后台异步保存AI回复到数据库')
                        
                        // 保存AI回复消息
                        try {
                          const botMessageResponse = await fetch('/api/messages/create', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              conversationId: dbConversationId as string,
                              role: 'assistant',
                              content: data.fullResponse || streamingContent,
                              metadata: {
                                frontend_id: botMessageId,
                                coze_conversation_id: finalConversationId,
                                coze_chat_id: finalChatId
                              }
                            })
                          })

                          const botMessageResult = await botMessageResponse.json()

                          if (botMessageResult.success) {
                            console.log('✅ AI回复已异步保存到数据库')
                          } else {
                            console.warn('⚠️ AI回复异步保存失败:', botMessageResult.message)
                          }
                        } catch (saveError) {
                          console.warn('⚠️ 异步保存AI回复失败:', saveError)
                        }

                        // 更新Coze对话ID
                        if (finalConversationId && dbConversationId) {
                          try {
                            await fetch('/api/conversations/update', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                conversationId: dbConversationId as string,
                                cozeConversationId: finalConversationId
                              })
                            })
                            console.log('✅ Coze对话ID已异步更新到数据库')
                          } catch (updateError) {
                            console.warn('⚠️ 异步更新Coze对话ID失败:', updateError)
                          }
                        }

                        // 更新用户聊天次数
                        try {
                          await updateUserChatCredits()
                          console.log('✅ 用户聊天次数已异步更新')
                        } catch (error) {
                          console.warn('⚠️ 异步更新聊天次数失败:', error)
                        }
                      }

                      // 启动后台异步保存（不等待完成）
                      saveToDatabase().catch(error => {
                        console.error('❌ 后台数据库操作失败:', error)
                      })

                      break
                    } else if (data.type === 'error') {
                      console.error('❌ 流式响应错误:', data.error)
                      
                      // 清除状态
                      setIsTyping(false)
                      // setCanAbort(false)
                      // setAbortController(null)
                      
                      throw new Error(data.error || 'AI回复失败，请重试')
                    }
                  } catch (parseError) {
                    console.warn('⚠️ 解析流式数据失败:', parseError)
                  }
                }
              }
            }
          } finally {
            reader.releaseLock()
          }
        }
        console.log('✅ 流式消息发送成功')
      } else {
        // 降级到传统JSON响应
        const data = await response.json()
        console.log('🔑 聊天页面AI返回的data: ', data)

        if (data.success) {
          console.log('🤖 AI回复内容:', data.response)

          // 立即更新前端状态和清除UI加载状态
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

            // 标题已在用户发送消息时设置，此处无需更新

            // 保存到本地存储
            localStorage.setItem('personality_conversations', JSON.stringify(finalConversations))

            return finalConversations
          })

          // 立即清除加载状态，恢复输入框可用性
          setIsTyping(false)
          // setCanAbort(false)
          // setAbortController(null)

          // 后台异步执行数据库保存操作（不阻塞UI）
          const saveToDatabase = async () => {
            console.log('💾 后台异步保存AI回复到数据库')
            
            // 保存AI回复消息
            try {
              const botMessageResponse = await fetch('/api/messages/create', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  conversationId: dbConversationId as string,
                  role: 'assistant',
                  content: data.response,
                  metadata: {
                    frontend_id: typingMessageId,
                    coze_conversation_id: data.conversationId
                  }
                })
              })

              const botMessageResult = await botMessageResponse.json()

              if (botMessageResult.success) {
                console.log('✅ AI回复已异步保存到数据库')
              } else {
                console.warn('⚠️ AI回复异步保存失败:', botMessageResult.message)
              }
            } catch (saveError) {
              console.warn('⚠️ 异步保存AI回复失败:', saveError)
            }

            // 更新用户聊天次数
            try {
              await updateUserChatCredits()
              console.log('✅ 用户聊天次数已异步更新')
            } catch (error) {
              console.warn('⚠️ 异步更新聊天次数失败:', error)
            }
          }

          // 启动后台异步保存（不等待完成）
          saveToDatabase().catch(error => {
            console.error('❌ 后台数据库操作失败:', error)
          })

        } else {
          throw new Error(data.error || 'AI回复失败，请重试')
        }
      }
    } catch (error: any) {
      console.error('❌ 消息发送失败:', error)
      
      // 清除状态
      setIsTyping(false)
      // setCanAbort(false)
      // setAbortController(null)
      
      // 移除占位消息，恢复页面状态
      setConversations(updatedConversations)
      
      if (error.name === 'AbortError') {
        console.log('🛑 用户中断了对话')
        message.info('对话已中断')
      } else {
        message.error(error.message || 'AI回复失败，请重试')
      }
    } finally {
      setLoading(false)
    }
  }

  // 更新用户聊天次数
  const updateUserChatCredits = async () => {
    try {
      const activeUser = getActiveUser()
      if (!activeUser?.id) {
        console.warn('⚠️ 无法获取用户资料ID，跳过聊天次数更新')
        return
      }

      // 调用API更新聊天次数
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
        console.log('✅ 聊天次数更新成功:', result.credits)
        
        // 触发用户信息更新事件
        window.dispatchEvent(new CustomEvent('chatCreditsUpdated', {
          detail: result.credits
        }))
      } else {
        console.warn('⚠️ 聊天次数更新失败:', result.message)
      }
    } catch (error) {
      console.error('❌ 更新聊天次数失败:', error)
    }
  }

  // 中断当前请求（已注释）
  /*
  const abortCurrentRequest = async () => {
    if (abortController && canAbort) {
      console.log('⏹️ 用户主动中断请求')
      
      // 1. 中断网络请求
      abortController.abort()
      setCanAbort(false)
      setAbortController(null)
      setIsTyping(false)
      setLoading(false)

      // 2. 保存已输出的内容到数据库（如果有内容的话）
      if (currentStreamingContent && currentBotMessageId && currentDbConversationId) {
        console.log('💾 保存被中断的AI回复到数据库')
        
        try {
          const saveResponse = await fetch('/api/messages/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
                      body: JSON.stringify({
            conversationId: currentDbConversationId,
            role: 'assistant',
            content: currentStreamingContent + '\n\n*[回复被用户中断]*',
            metadata: {
              frontend_id: currentBotMessageId,
              interrupted: true,
              interrupted_at: new Date().toISOString()
            }
          })
          })

          const saveResult = await saveResponse.json()

          if (saveResult.success) {
            console.log('✅ 被中断的回复已保存到数据库')
          } else {
            console.error('❌ 保存被中断的回复失败:', saveResult.message)
          }

        } catch (error) {
          console.error('❌ 保存被中断的回复异常:', error)
        }

        // 3. 更新前端消息内容，标记为被中断
        setConversations(prevConversations => 
          prevConversations.map(conv => {
            if (conv.id === activeConversationId) {
              return {
                ...conv,
                messages: conv.messages.map(msg => 
                  msg.id === currentBotMessageId 
                    ? { 
                        ...msg, 
                        content: currentStreamingContent + '\n\n*[回复被用户中断]*',
                        timestamp: new Date()
                      }
                    : msg
                )
              }
            }
            return conv
          })
        )

        // 4. 保存到localStorage
        setTimeout(() => {
          const updatedConversations = JSON.parse(localStorage.getItem('personality_conversations') || '[]')
          const conversationIndex = updatedConversations.findIndex((conv: any) => conv.id === activeConversationId)
          if (conversationIndex >= 0) {
            const messageIndex = updatedConversations[conversationIndex].messages.findIndex((msg: any) => msg.id === currentBotMessageId)
            if (messageIndex >= 0) {
              updatedConversations[conversationIndex].messages[messageIndex].content = currentStreamingContent + '\n\n*[回复被用户中断]*'
              localStorage.setItem('personality_conversations', JSON.stringify(updatedConversations))
            }
          }
        }, 100)
      }

      // 5. 清理状态
      setCurrentStreamingContent('')
      setCurrentBotMessageId(null)
      setCurrentDbConversationId(null)

      console.log('✅ 请求已中断，状态已清理')
    }
  }
  */

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

      console.log('🔮 获取用户占星上下文:', { userId, isUserProfileId })

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
        console.log('✅ 成功获取占星上下文')
        return result.astrologyContext
      } else {
        console.warn('⚠️ 未找到占星上下文:', result.message)
        return null
      }
    } catch (error) {
      console.error('❌ 获取占星上下文失败:', error)
      return null
    }
  }

  // 获取当前对话
  const getCurrentConversation = () => {
    return conversations.find(conv => conv.id === activeConversationId)
  }

  // 调试信息（开发环境）
  // Typing动画组件
  const TypingIndicator = () => (
    <div className="flex items-center space-x-1 text-gray-500">
      <span className="text-sm ml-2">AI深度分析中，预计2分钟，道友稍后~</span>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>

    </div>
  )

  const debugInfo = {
    isAutoScrollEnabled,
    isUserScrolling,
    showScrollToBottom,
    lastScrollTop,
    messagesCount: getCurrentConversation()?.messages.length || 0
  }

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
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white shadow-lg border-b border-gray-200 px-3 py-2 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">乙</span>
            </div>
            <span className="font-bold text-gray-900">天乙神算</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              icon={<MenuOutlined />}
              onClick={() => setDrawerVisible(true)}
              size="small"
              type="text"
            >
              菜单
            </Button>
          </div>
        </div>
      </div>

      {/* 中间聊天记录区域 */}
      <div className={`bg-white border-r border-gray-200 transition-all duration-300 h-full overflow-hidden ${
        chatHistoryVisible ? 'w-80' : 'w-0'
      }`}>
        {chatHistoryVisible && (
          <div className="flex flex-col h-full">
            {/* 标题区域 */}
            <div className="p-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">性格内观</h2>
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
                <span className="font-medium">性格内观报告</span>
              </div>

              <div
                onClick={() => {
                  console.log('🔄 点击开启新对话按钮')
                  createNewConversation()
                  setCurrentContent('chat') // 切换到聊天视图
                }}
                className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  currentContent === 'chat'
                    ? 'bg-gray-100 text-gray-900'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <MessageOutlined className="text-lg" />
                <span className="font-medium">性格内观对话</span>
              </div>
            </div>

            {/* 对话历史区域 - 始终显示 */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-3 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">对话历史</span>
                  <Button
                    type="text"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      console.log('🔄 点击新对话按钮')
                      createNewConversation()
                    }}
                    className="text-gray-500 hover:text-gray-700"
                    size="small"
                  >
                    新对话
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar min-h-0" style={{ overscrollBehavior: 'contain' }}>
                {conversationsLoading ? (
                  // 加载中状态
                  <div className="flex flex-col items-center justify-center py-8">
                    <Spin size="default" />
                    <p className="text-gray-500 text-sm mt-3">加载对话历史中...</p>
                  </div>
                ) : conversations.length === 0 ? (
                  // 无对话状态
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
                      // 置顶的对话排在前面
                      if (a.isPinned && !b.isPinned) return -1
                      if (!a.isPinned && b.isPinned) return 1
                      // 其他按创建时间排序（最新在上）
                      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    })
                    .map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`group relative p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                      activeConversationId === conversation.id && currentContent === 'chat'
                        ? 'bg-gray-100 border border-gray-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                    onClick={() => {
                      setActiveConversationId(conversation.id)
                      setCurrentContent('chat') // 切换到聊天视图
                    }}
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
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 展开按钮（当中间区域隐藏时显示） */}
      {!chatHistoryVisible && (
        <div className="w-8 bg-white border-r border-gray-200 flex items-center justify-center h-full">
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
      <div className="flex-1 pt-8 md:pt-0 h-full overflow-hidden bg-white">
        {currentContent === 'report' ? (
          /* 性格报告展示区域 */
          <div className="h-full flex flex-col">
            {/* 报告标题栏 */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                    <FileTextOutlined className="text-white" />
                  </div>
                  <Title level={2} className="!mb-0 !text-gray-900">性格分析报告</Title>
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
                    您好，<span className="font-semibold text-gray-900">{(() => {
                      const activeUser = getActiveUser()
                      return activeUser?.name || userInfo?.nickname || '用户'
                    })()}</span>！
                    根据您提供的出生信息（{(() => {
                      const activeUser = getActiveUser()
                      if (activeUser) {
                        const genderText = activeUser.gender === 'male' ? '男' : '女'
                        const areaText = activeUser.area_province && activeUser.area_city && activeUser.area_district 
                          ? `${activeUser.area_province} ${activeUser.area_city} ${activeUser.area_district}`
                          : '未知地区'
                        return `${activeUser.year}年${activeUser.month}月${activeUser.day}日 ${activeUser.hour}:${String(activeUser.minute).padStart(2, '0')}, ${genderText}, ${areaText}`
                      }
                      return formatUserInfoDisplay(userInfo)
                    })()}），
                    经过天乙神算系统的综合分析，为您生成以下性格特征报告。
                  </Paragraph>
                </div>
              )}
            </div>

            {/* 报告内容区域 - 独立滚动 */}
            <div className="flex-1 overflow-y-auto p-4" style={{ overscrollBehavior: 'contain' }}>
              {reportLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  {isGenerating ? (
                    // 生成进度显示
                    <div className="w-full max-w-md">
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Spin
                            indicator={<LoadingOutlined style={{ fontSize: 24, color: 'white' }} spin />}
                          />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">正在生成性格报告</h3>
                        <p className="text-gray-600">{generationStatus}</p>
                      </div>

                      {/* 进度条 */}
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

                      {/* 提示信息 */}
                      <div className="text-center text-sm text-gray-500">
                        <p>AI正在深度分析您的出生信息</p>
                        <p>预计需要1-3分钟，请耐心等待...</p>
                      </div>
                    </div>
                  ) : (
                    // 普通加载显示
                    <div className="text-center">
                      <Spin size="large" />
                      <p className="text-gray-600 mt-4">正在加载性格报告...</p>
                    </div>
                  )}
                </div>
              ) : reportError ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-red-600 text-2xl">⚠️</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">报告加载中</h3>
                  {/* <p className="text-gray-600 mb-4">{reportError}</p> */}
                  {/* <div className="space-x-3">
                    <Button type="primary" onClick={regenerateReport}>
                      重新生成
                    </Button>
                    <Button onClick={loadPersonalityReport}>
                      重试加载
                    </Button>
                  </div> */}
                </div>
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
                    {reportContent}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileTextOutlined className="text-gray-400 text-2xl" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无性格报告</h3>
                  <p className="text-gray-600 mb-4">请联系管理员生成您的专属性格分析报告</p>
                  {/* <Button type="primary" onClick={regenerateReport}>
                    生成报告
                  </Button> */}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* 聊天对话区域 */
          <div className="h-full flex flex-col">
            {/* 聊天标题栏
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                  <MessageOutlined className="text-white" />
                </div>
                <Title level={2} className="!mb-0 !text-gray-900">AI智能对话</Title>
              </div>
              {userInfo && (
                <div className="bg-gray-50 rounded-lg p-4 mt-4">
                  <Paragraph className="text-gray-700 mb-0">
                    您好，<span className="font-semibold text-gray-900">{(() => {
                      const activeUser = getActiveUser()
                      return activeUser?.name || userInfo?.nickname || '用户'
                    })()}</span>！
                    我已了解您的基本信息，您可以向我咨询任何关于命理、性格、人生规划等方面的问题。
                  </Paragraph>
                </div>
              )}
            </div> */}

            {/* 聊天消息区域 - 独立滚动 */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 relative custom-scrollbar"
              style={{ 
                overscrollBehavior: 'contain'
              }}
              onScroll={handleScroll}
            >
              {!activeConversationId || !getCurrentConversation()?.messages.length ? (
                // 默认欢迎界面
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
                    <span className="text-white text-2xl">🤖</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    您好 {(() => {
                      const activeUser = getActiveUser()
                      return activeUser?.name || userInfo?.nickname || userInfo?.name || '用户'
                    })()}，很高兴见到您！
                  </h2>
                  <p className="text-gray-600 mb-8 max-w-md">
                    我已了解您的基本信息，可以为您提供专业的命理分析和人生指导，请把您的问题交给我吧~
                  </p>
                  <div className="bg-gray-100 rounded-lg p-4 max-w-md">
                    <p className="text-sm text-gray-600">
                      💡 输入您的问题并发送，我会为您创建一个新的对话并开始回答
                    </p>
                  </div>
                </div>
              ) : (
                getCurrentConversation()?.messages.map((message, index) => (
                <div key={message.id} className={`mb-6 ${message.type === 'user' ? 'flex justify-end' : 'flex justify-start'}`}>
                  <div className={`max-w-[80%] ${message.type === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'} rounded-lg p-4`}>
                    <div className={`flex items-center space-x-2 mb-2 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {message.type === 'user' ? (
                        <UserOutlined className="text-blue-200" />
                      ) : (
                        <RobotOutlined className="text-gray-600" />
                      )}
                      <span className={`text-sm ${message.type === 'user' ? 'text-blue-200' : 'text-gray-600'}`}>
                        {message.type === 'user' ? '您' : 'AI助手'}
                      </span>
                    </div>
                    {message.type === 'bot' && message.content === '正在思考中...' ? (
                      <TypingIndicator />
                    ) : (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          em: ({ children }) => <em className="italic">{children}</em>,
                          ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                          li: ({ children }) => <li className="mb-1">{children}</li>,
                          code: ({ children }) => (
                            <code className={`px-2 py-1 rounded text-sm font-mono ${
                              message.type === 'user' 
                                ? 'bg-blue-700 text-blue-100' 
                                : 'bg-gray-200 text-gray-800'
                            }`}>
                              {children}
                            </code>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className={`border-l-4 pl-4 italic mb-2 ${
                              message.type === 'user' 
                                ? 'border-blue-300 text-blue-100' 
                                : 'border-gray-300 text-gray-600'
                            }`}>
                              {children}
                            </blockquote>
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    )}
                    <div className={`text-xs mt-2 ${message.type === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
                ))
              )}
              <div ref={messagesEndRef} />

              {/* 回到底部按钮 */}
              {showScrollToBottom && (
                <div className="fixed bottom-32 right-8 z-10">
                  <Button
                    type="primary"
                    shape="circle"
                    size="large"
                    icon={<DownOutlined />}
                    onClick={handleScrollToBottomClick}
                    className="shadow-lg hover:shadow-xl transition-all duration-200"
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      width: '48px',
                      height: '48px'
                    }}
                    title="回到底部"
                  />
                </div>
              )}
            </div>

            {/* 输入框区域 - 简洁样式 */}
            <div className="px-4 py-2 bg-white">
              <div className="max-w-4xl mx-auto">
                <div className="relative">
                  <TextArea
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    placeholder="请输入您的问题..."
                    autoSize={{ minRows: 2, maxRows: 8 }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-12 resize-none focus:border-blue-400 focus:outline-none"
                    disabled={loading || isTyping}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        if (currentMessage.trim() && !loading && !isTyping) {
                          sendMessage()
                        }
                      }
                    }}
                  />
                  {/* 按钮在TextArea内部右下角 */}
                  <div className="absolute bottom-2 right-2">
                    <Button
                      type={currentMessage.trim() ? "primary" : "default"}
                      shape="circle"
                      icon={<ArrowUpOutlined />}
                      onClick={sendMessage}
                      loading={loading}
                      disabled={!currentMessage.trim() || loading || isTyping}
                      className={`w-8 h-8 flex items-center justify-center transition-all duration-200 shadow-sm ${
                        currentMessage.trim() && !loading && !isTyping
                          ? 'bg-blue-500 hover:bg-blue-600 border-blue-500 text-white' 
                          : 'bg-gray-200 border-gray-200 text-gray-400'
                      }`}
                      title={currentMessage.trim() ? "发送消息" : "请输入消息"}
                    />
                  </div>
                </div>
                {/* 输入提示 */}
                <div className="text-xs text-gray-400 mt-2 text-center">
                  Enter 发送，Shift + Enter 换行
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
            <span className="font-medium">性格内观报告</span>
          </div>

          <div
            onClick={() => {
              console.log('🔄 移动端点击开启新对话按钮')
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
            <span className="font-medium">性格内观对话</span>
          </div>
        </div>

        {/* 对话历史 - 始终显示 */}
        {(conversationsLoading || conversations.length > 0) && (
          <div className="flex flex-col max-h-96 overflow-hidden">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <span className="text-sm font-medium text-gray-700">对话历史</span>
              <Button
                type="text"
                icon={<PlusOutlined />}
                size="small"
                onClick={() => {
                  console.log('🔄 点击新对话按钮')
                  createNewConversation()
                  setDrawerVisible(false)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                新对话
              </Button>
            </div>

            <div className="space-y-2 overflow-y-auto custom-scrollbar" style={{ overscrollBehavior: 'contain' }}>
              {conversationsLoading ? (
                // 加载中状态
                <div className="flex flex-col items-center justify-center py-6">
                  <Spin size="default" />
                  <p className="text-gray-500 text-sm mt-3">加载对话历史中...</p>
                </div>
              ) : conversations.length === 0 ? (
                // 无对话状态
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
                    // 置顶的对话排在前面
                    if (a.isPinned && !b.isPinned) return -1
                    if (!a.isPinned && b.isPinned) return 1
                    // 其他按创建时间排序（最新在上）
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                  })
                  .map((conversation) => (
                <div
                  key={conversation.id}
                  className={`group relative p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                    activeConversationId === conversation.id && currentContent === 'chat'
                      ? 'bg-gray-100 border border-gray-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                  onClick={() => {
                    setActiveConversationId(conversation.id)
                    setCurrentContent('chat') // 切换到聊天视图
                    setDrawerVisible(false)
                  }}
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
  )
}