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
  DownOutlined
} from '@ant-design/icons'
import {
  getUserPhoneNumber,
  formatUserInfoDisplay,
  formatAreaDisplay,
  getActiveUser
} from '@/utils/client-utils'
import { getUserConversations, saveConversation, deleteConversationFromSupabase } from '@/lib/user-manager'
import { generateConversationTitle } from '@/utils/textrank'

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
      await navigator.clipboard.writeText(reportContent)
      setCopied(true)
      message.success('报告已复制到剪贴板')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      message.error('复制失败，请手动选择文本复制')
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
      // 优先使用当前激活用户的手机号
      const activeUser = getActiveUser()
      let userId: string | null = null
      
      if (activeUser) {
        // 如果有激活用户，使用激活用户的手机号
        userId = activeUser.phone_number
        console.log('📋 使用激活用户的手机号加载对话历史:', userId)
      } else {
        // 备用方案：使用主用户的手机号
        userId = getUserPhoneNumber()
        console.log('📋 使用主用户的手机号加载对话历史:', userId)
      }
      
      if (!userId) return

      // 尝试从Supabase加载对话历史
      let supabaseConversations: any[] = []
      try {
        supabaseConversations = await getUserConversations(userId)
      } catch (error) {
        console.warn('⚠️ 从Supabase加载对话历史失败，使用本地存储:', error)
      }

      if (supabaseConversations.length > 0) {
        const formattedConversations = supabaseConversations.map((conv: any) => ({
          ...conv,
          createdAt: new Date(conv.created_at),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }))
        setConversations(formattedConversations)
        setActiveConversationId(formattedConversations[0].id)
      } else {
        // 如果Supabase没有数据，尝试从localStorage加载
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
          if (fixedConversations.length > 0) {
            setActiveConversationId(fixedConversations[0].id)
          }
        }
      }
    } catch (error) {
      console.error('加载对话历史失败:', error)
      // 降级到localStorage
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
        if (fixedConversations.length > 0) {
          setActiveConversationId(fixedConversations[0].id)
        }
      }
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

  // 创建新对话
  const createNewConversation = async () => {
    console.log('🆕 创建新对话...')

    if (!userInfo) {
      console.warn('⚠️ 用户信息缺失，无法创建对话')
      alert('请先完善个人信息后再开始对话')
      return
    }

    const newConversation: ConversationHistory = {
      id: Date.now().toString(),
      title: '新对话',
      messages: [],
      createdAt: new Date()
    }

    // 创建欢迎消息，说明AI已了解用户基本情况
    const welcomeMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'bot',
      content: `您好 ${userInfo.nickname}！我已了解您的基本信息：\n\n📅 出生时间：${userInfo.year}年${userInfo.month}月${userInfo.day}日 ${userInfo.hour}:${String(userInfo.minute).padStart(2, '0')}\n📍 出生地点：${formatAreaDisplay(userInfo.area)}\n👤 性别：${userInfo.gender === 'male' ? '男' : '女'}\n\n我将基于这些信息为您提供专业的命理分析和人生指导。请问您想了解什么方面的内容呢？`,
      timestamp: new Date()
    }

    // 将欢迎消息添加到新对话中
    newConversation.messages = [welcomeMessage]

    const updatedConversations = [newConversation, ...conversations]
    setConversations(updatedConversations)
    setActiveConversationId(newConversation.id)

    console.log('✅ 新对话已创建:', newConversation)
    console.log('📋 更新后的对话列表:', updatedConversations)
    console.log('🎯 活跃对话ID设置为:', newConversation.id)

    // 确保切换到聊天界面
    setCurrentContent('chat')

    // 保存到本地存储
    localStorage.setItem('personality_conversations', JSON.stringify(updatedConversations))

    // 保存到Supabase（重新启用）
    try {
      const userId = getUserPhoneNumber()
      if (userId) {
        await saveConversation(userId, newConversation)
        console.log('✅ 新对话已保存到Supabase')
      }
    } catch (error) {
      console.warn('⚠️ 保存新对话到Supabase失败，但不影响聊天功能:', error)
    }
  }

  // 更新对话标题（使用TextRank算法）
  const updateConversationTitle = (conversationId: string, messages: ChatMessage[], currentConversations: ConversationHistory[]) => {
    if (messages.length >= 2) { // 至少有一轮对话才更新标题
      // 检查是否为用户手动设置的标题，如果是则不自动更新
      const currentConv = currentConversations.find(conv => conv.id === conversationId)
      if (currentConv?.isManualTitle) {
        console.log('🏷️ 跳过自动更新标题，因为用户已手动设置:', currentConv.title)
        return
      }

      const title = generateConversationTitle(messages)

      const updatedConversations = currentConversations.map(conv => {
        if (conv.id === conversationId) {
          return { ...conv, title }
        }
        return conv
      })

      setConversations(updatedConversations)
      localStorage.setItem('personality_conversations', JSON.stringify(updatedConversations))

      // 暂时注释掉Supabase保存，避免重复创建对话
      // 同时更新到Supabase
      // const updatedConv = updatedConversations.find(conv => conv.id === conversationId)
      // if (updatedConv) {
      //   const userId = getUserPhoneNumber()
      //   if (userId) {
      //     saveConversation(userId, updatedConv).catch(error => {
      //       console.warn('⚠️ 更新对话标题到Supabase失败，但不影响聊天功能:', error)
      //     })
      //   }
      // }
    }
  }

  // 置顶对话
  const pinConversation = async (conversationId: string) => {
    const updatedConversations = conversations.map(conv => {
      if (conv.id === conversationId) {
        return { ...conv, isPinned: !conv.isPinned }
      }
      return conv
    })

    setConversations(updatedConversations)
    localStorage.setItem('personality_conversations', JSON.stringify(updatedConversations))

    // 更新到Supabase
    // 暂时注释掉，避免重复创建对话问题
    // const updatedConv = updatedConversations.find(conv => conv.id === conversationId)
    // if (updatedConv) {
    //   try {
    //     const userId = getUserPhoneNumber()
    //     if (userId) {
    //       await saveConversation(userId, updatedConv)
    //     }
    //   } catch (error) {
    //     console.error('更新置顶状态到Supabase失败:', error)
    //   }
    // }

    const updatedConv = updatedConversations.find(conv => conv.id === conversationId)
    message.success(updatedConv?.isPinned ? '已置顶' : '已取消置顶')
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

    const updatedConversations = conversations.map(conv => {
      if (conv.id === renamingConversationId) {
        return { 
          ...conv, 
          title: newTitle.trim(),
          isManualTitle: true // 标记为用户手动设置的标题
        }
      }
      return conv
    })

    setConversations(updatedConversations)
    localStorage.setItem('personality_conversations', JSON.stringify(updatedConversations))

    // 更新到Supabase
    // 暂时注释掉，避免重复创建对话问题
    // const updatedConv = updatedConversations.find(conv => conv.id === renamingConversationId)
    // if (updatedConv) {
    //   try {
    //     const userId = getUserPhoneNumber()
    //     if (userId) {
    //       await saveConversation(userId, updatedConv)
    //     }
    //   } catch (error) {
    //     console.error('更新对话标题到Supabase失败:', error)
    //   }
    // }

    setRenameModalVisible(false)
    setRenamingConversationId(null)
    setNewTitle('')
    message.success('重命名成功')
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

        // 从Supabase删除
        try {
          const userId = getUserPhoneNumber()
          if (userId) {
            await deleteConversationFromSupabase(userId, conversationId)
            console.log('✅ 已从Supabase删除对话:', conversationId)
          }
        } catch (error) {
          console.warn('⚠️ 从Supabase删除对话失败，但不影响功能:', error)
        }

        message.success('删除成功')
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

    if (!activeConversationId) {
      console.warn('⚠️ 没有活跃的对话，尝试创建新对话')
      createNewConversation()
      return
    }

    if (!userInfo) {
      console.warn('⚠️ 用户信息缺失')
      alert('用户信息缺失，请先完善个人信息')
      return
    }

    setLoading(true)

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: currentMessage.trim(),
      timestamp: new Date()
    }

    // 保存当前消息内容，用于错误恢复
    const messageContent = currentMessage.trim()

    // 更新对话
    const updatedConversations = conversations.map(conv => {
      if (conv.id === activeConversationId) {
        return {
          ...conv,
          messages: [...conv.messages, userMessage]
        }
      }
      return conv
    })
    console.log('🔄 更新后的对话列表:', updatedConversations)
    // 保存到本地存储
    setConversations(updatedConversations)
    setCurrentMessage('') // 清空输入框

    // 调用 Coze 智能体 API
    try {
      console.log('🚀 调用 Coze API...')

      // 直接从updatedConversations中获取当前对话，而不是使用可能过时的conversations状态
      const currentConv = updatedConversations.find(conv => conv.id === activeConversationId)
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

      // 只在第一次发送消息时传递用户信息，后续依赖Coze的对话记忆
      const requestBody = {
        message: userMessage.content,
        userInfo: isFirstMessage ? userInfo : undefined, // 只在首次传递用户信息
        conversationId: currentConv?.cozeConversationId, // 保持对话连续性
        userId: consistentUserId, // 传递一致的用户ID
      }

      console.log('📦 请求体:', requestBody)
      console.log('🔄 是否首次消息:', isFirstMessage)

      // 使用流式请求
      const response = await fetch('/api/coze/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log('📡 API响应状态:', response.status)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // 检查是否是流式响应
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('text/event-stream')) {
        console.log('🌊 开始处理流式响应...')

        // 创建一个临时的bot消息用于实时更新
        const botMessageId = (Date.now() + 1).toString()
        let streamingContent = ''
        let finalConversationId = ''
        let finalChatId = ''

        // 先添加一个空的bot消息
        const initialBotMessage: ChatMessage = {
          id: botMessageId,
          type: 'bot',
          content: '',
          timestamp: new Date()
        }

        const initialConversations = updatedConversations.map(conv => {
          if (conv.id === activeConversationId) {
            return {
              ...conv,
              messages: [...conv.messages, initialBotMessage],
            }
          }
          return conv
        })
        setConversations(initialConversations)

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

                      // 实时更新消息内容
                      setConversations(prevConversations =>
                        prevConversations.map(conv => {
                          if (conv.id === activeConversationId) {
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

                      // 最终更新
                      setConversations(prevConversations => {
                        const finalConversations = prevConversations.map(conv => {
                          if (conv.id === activeConversationId) {
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

                        // 更新对话标题和保存
                        const currentConv = finalConversations.find(conv => conv.id === activeConversationId)
                        if (currentConv) {
                          updateConversationTitle(activeConversationId, currentConv.messages, finalConversations)

                          // 保存到Supabase
                          const userId = getUserPhoneNumber()
                          if (userId) {
                            saveConversation(userId, currentConv)
                              .then(() => console.log('✅ 对话已保存到Supabase'))
                              .catch(error => console.warn('⚠️ 保存对话到Supabase失败:', error))
                          }
                        }
                        localStorage.setItem('personality_conversations', JSON.stringify(finalConversations))

                        return finalConversations
                      })
                      break
                    } else if (data.type === 'error') {
                      console.error('❌ 流式响应错误:', data.error)
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
          const botMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: 'bot',
            content: data.response,
            timestamp: new Date()
          }

          console.log('🤖 AI回复消息:', botMessage)

          const finalConversations = updatedConversations.map(conv => {
            if (conv.id === activeConversationId) {
              return {
                ...conv,
                messages: [...conv.messages, botMessage],
                cozeConversationId: conv.cozeConversationId || data.conversationId,
              }
            }
            return conv
          })
          console.log('🔄 更新后的对话列表:', finalConversations)
          setConversations(finalConversations)

          // 更新对话标题
          const currentConv = finalConversations.find(conv => conv.id === activeConversationId)
          if (currentConv) {
            updateConversationTitle(activeConversationId, currentConv.messages, finalConversations)

            // 保存到Supabase
            try {
              const userId = getUserPhoneNumber()
              if (userId) {
                await saveConversation(userId, currentConv)
                console.log('✅ 对话已保存到Supabase')
              }
            } catch (error) {
              console.warn('⚠️ 保存对话到Supabase失败，但不影响聊天功能:', error)
            }
          }
          localStorage.setItem('personality_conversations', JSON.stringify(finalConversations))
          console.log('✅ 传统消息发送成功')
        } else {
          throw new Error(data.error || 'AI服务响应失败')
        }
      }
    } catch (error) {
      console.error('❌ 调用 Coze API 失败:', error)

      // 恢复用户输入的消息
      setCurrentMessage(messageContent)

      // 从对话中移除用户消息（因为发送失败）
      // 注意：这里应该使用 updatedConversations 而不是原始的 conversations
      const revertedConversations = updatedConversations.map(conv => {
        if (conv.id === activeConversationId) {
          return {
            ...conv,
            messages: conv.messages.filter(msg => msg.id !== userMessage.id)
          }
        }
        return conv
      })

      setConversations(revertedConversations)

      // 显示错误消息
      message.error(`发送失败：${error instanceof Error ? error.message : String(error)}`)

      // 保存恢复后的对话状态
      localStorage.setItem('personality_conversations', JSON.stringify(revertedConversations))
    } finally {
      setLoading(false)
    }
  }

  // 获取当前对话
  const getCurrentConversation = () => {
    return conversations.find(conv => conv.id === activeConversationId)
  }

  // 调试信息（开发环境）
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
    <div className="bg-white flex overflow-hidden h-screen">
      {/* 移动端顶部导航 */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white shadow-lg border-b border-gray-200 p-4 z-20">
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
      <div className={`bg-white border-r border-gray-200 transition-all duration-300 h-screen overflow-hidden ${
        chatHistoryVisible ? 'w-80' : 'w-0'
      }`}>
        {chatHistoryVisible && (
          <div className="flex flex-col h-screen">
            {/* 标题区域 */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
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
            <div className="p-4 space-y-3">
              <div
                onClick={() => setCurrentContent('report')}
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
                }}
                className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  currentContent === 'chat'
                    ? 'bg-gray-100 text-gray-900'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <MessageOutlined className="text-lg" />
                <span className="font-medium">开启新对话</span>
              </div>
            </div>

            {/* 对话历史区域 */}
            {currentContent === 'chat' && (
              <div className="flex-1 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">对话历史</span>
                    <Button
                      type="text"
                      icon={<PlusOutlined />}
                      onClick={createNewConversation}
                      className="text-gray-500 hover:text-gray-700"
                      size="small"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ overscrollBehavior: 'contain' }}>
                  {conversations
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
                        activeConversationId === conversation.id
                          ? 'bg-gray-100 border border-gray-200'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                      onClick={() => setActiveConversationId(conversation.id)}
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
                  ))}
                </div>
              </div>
            )}
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
      <div className="flex-1 pt-16 md:pt-0 h-screen overflow-hidden bg-white">
        {currentContent === 'report' ? (
          /* 性格报告展示区域 */
          <div className="h-screen flex flex-col">
            {/* 报告标题栏 */}
            <div className="p-6 border-b border-gray-100">
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
            <div className="flex-1 overflow-y-auto p-6" style={{ overscrollBehavior: 'contain' }}>
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
                  <p className="text-gray-600 mb-4">点击按钮生成您的专属性格分析报告</p>
                  <Button type="primary" onClick={regenerateReport}>
                    生成报告
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* 聊天对话区域 */
          <div className="h-screen flex flex-col">
            {/* 聊天标题栏 */}
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
            </div>

            {/* 聊天消息区域 - 独立滚动 */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-6 relative"
              style={{ overscrollBehavior: 'contain' }}
              onScroll={handleScroll}
            >
              {getCurrentConversation()?.messages.map((message, index) => (
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
                    <div className={`text-xs mt-2 ${message.type === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
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

            {/* 输入框区域 */}
            <div className="p-6 border-t border-gray-100">
              <div className="flex space-x-3">
                <TextArea
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder="请输入您的问题..."
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  className="flex-1"
                  disabled={loading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={sendMessage}
                  loading={loading}
                  disabled={!currentMessage.trim()}
                  className="self-end"
                >
                  发送
                </Button>
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
              setDrawerVisible(false)
            }}
            className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
              currentContent === 'chat'
                ? 'bg-gray-100 text-gray-900'
                : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <MessageOutlined className="text-lg" />
            <span className="font-medium">开启新对话</span>
          </div>
        </div>

        {/* 对话历史 */}
        {currentContent === 'chat' && conversations.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-700">对话历史</span>
              <Button
                type="text"
                icon={<PlusOutlined />}
                size="small"
                onClick={() => {
                  createNewConversation()
                  setDrawerVisible(false)
                }}
                className="text-gray-500 hover:text-gray-700"
              />
            </div>

            <div className="space-y-2">
              {conversations
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
                    activeConversationId === conversation.id
                      ? 'bg-gray-100 border border-gray-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                  onClick={() => {
                    setActiveConversationId(conversation.id)
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
              ))}
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