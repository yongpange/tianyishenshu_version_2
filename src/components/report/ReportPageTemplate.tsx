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
import { ReportModuleConfig } from '@/config/reportModules'
import { useReportGeneration } from '@/hooks/useReportGeneration'
import { useConversationHistory, ChatMessage, ConversationHistory } from '@/hooks/useConversationHistory'
import { generateConversationTitle } from '@/utils/textrank'

const { TextArea } = Input
const { Title, Text, Paragraph } = Typography

// 内容类型枚举
type ContentType = 'chat' | 'report'

interface ReportPageTemplateProps {
  moduleConfig: ReportModuleConfig
}

export default function ReportPageTemplate({ moduleConfig }: ReportPageTemplateProps) {
  const [userInfo, setUserInfo] = useState<any>(null)
  const [currentContent, setCurrentContent] = useState<ContentType>('chat') // 默认显示聊天界面
  const [currentMessage, setCurrentMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [copied, setCopied] = useState(false)

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

  // 滚动检测常量
  const SCROLL_THRESHOLD = 100 // 距离底部100px内认为在底部
  const SCROLL_DEBOUNCE_TIME = 150 // 滚动防抖时间

  // 使用自定义Hooks
  const reportGeneration = useReportGeneration({ moduleConfig, userInfo })
  const conversationHistory = useConversationHistory({ moduleId: moduleConfig.moduleId })

  // 转换激活用户信息为标准格式
  const convertActiveUserToUserInfo = (activeUser: any) => {
    if (!activeUser) return null

    // 如果已经是标准格式，直接返回
    if (activeUser.area && typeof activeUser.area === 'object') {
      return activeUser
    }

    // 转换格式
    return {
      year: activeUser.year,
      month: activeUser.month,
      day: activeUser.day,
      hour: activeUser.hour,
      minute: activeUser.minute,
      gender: activeUser.gender,
      nickname: activeUser.name || activeUser.nickname,
      area: {
        province: activeUser.area_province || '',
        city: activeUser.area_city || '',
        district: activeUser.area_district || ''
      }
    }
  }

  // 初始化用户信息
  useEffect(() => {
    const initializeUserInfo = () => {
      try {
        // 优先从激活用户获取信息
        const activeUser = getActiveUser()
        if (activeUser) {
          console.log('📱 原始激活用户信息:', activeUser)
          const convertedUserInfo = convertActiveUserToUserInfo(activeUser)
          console.log('📱 转换后的用户信息:', convertedUserInfo)
          setUserInfo(convertedUserInfo)
          return
        }

        // 备用方案：从localStorage获取
        const storedUserInfo = localStorage.getItem('userInfo')
        if (storedUserInfo) {
          const parsedUserInfo = JSON.parse(storedUserInfo)
          console.log('📱 使用localStorage用户信息:', parsedUserInfo)
          setUserInfo(parsedUserInfo)
          return
        }

        // 最后方案：从URL参数获取
        const searchParams = new URLSearchParams(window.location.search)
        const userInfoParam = searchParams.get('userInfo')
        if (userInfoParam) {
          try {
            const decodedUserInfo = JSON.parse(decodeURIComponent(userInfoParam))
            console.log('📱 使用URL参数用户信息:', decodedUserInfo)
            setUserInfo(decodedUserInfo)
            return
          } catch (error) {
            console.warn('⚠️ URL参数解析失败:', error)
          }
        }

        console.warn('⚠️ 未找到用户信息，跳转到登录页')
        router.push('/login')
      } catch (error) {
        console.error('❌ 初始化用户信息失败:', error)
        router.push('/login')
      }
    }

    initializeUserInfo()
  }, [router])

  // 加载报告
  useEffect(() => {
    if (userInfo) {
      reportGeneration.loadReport()
    }
  }, [userInfo, reportGeneration.loadReport])

  // 复制报告内容
  const copyReport = useCallback(async () => {
    if (!reportGeneration.reportContent) return

    const { copyReport: copyReportHelper } = await import('@/utils/copy-helper')
    const success = await copyReportHelper(reportGeneration.reportContent, moduleConfig.title)
    
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [reportGeneration.reportContent, moduleConfig.title])

  // 智能滚动到底部
  const scrollToBottom = useCallback((force = false) => {
    if (!messagesEndRef.current || (!isAutoScrollEnabled && !force)) return

    try {
      messagesEndRef.current.scrollIntoView({
        behavior: force ? 'auto' : 'smooth',
        block: 'end'
      })
      setShowScrollToBottom(false)
    } catch (error) {
      console.warn('⚠️ 滚动到底部失败:', error)
    }
  }, [isAutoScrollEnabled])

  // 处理滚动事件
  const handleScroll = useCallback(() => {
    if (!chatContainerRef.current) return

    const container = chatContainerRef.current
    const { scrollTop, scrollHeight, clientHeight } = container
    const isNearBottom = scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD

    // 清除之前的定时器
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    // 防抖处理
    scrollTimeoutRef.current = setTimeout(() => {
      const scrollDirection = scrollTop > lastScrollTop ? 'down' : 'up'
      setLastScrollTop(scrollTop)

      if (scrollDirection === 'up' && !isNearBottom) {
        // 用户向上滚动且不在底部，禁用自动滚动
        setIsAutoScrollEnabled(false)
        setIsUserScrolling(true)
        setShowScrollToBottom(true)
      } else if (isNearBottom) {
        // 用户滚动到底部附近，启用自动滚动
        setIsAutoScrollEnabled(true)
        setIsUserScrolling(false)
        setShowScrollToBottom(false)
      }
    }, SCROLL_DEBOUNCE_TIME)
  }, [lastScrollTop])

  // 绑定滚动事件
  useEffect(() => {
    const container = chatContainerRef.current
    if (!container) return

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [handleScroll])

  // 当消息更新时自动滚动
  useEffect(() => {
    const currentConversation = conversationHistory.getCurrentConversation()
    if (currentConversation && currentConversation.messages.length > 0) {
      // 延迟滚动，确保DOM已更新
      setTimeout(() => scrollToBottom(), 100)
    }
  }, [conversationHistory.getCurrentConversation()?.messages, scrollToBottom])

  // Typing动画组件
  const TypingIndicator = () => (
    <div className="flex items-center space-x-1 text-gray-500">
      <span className="text-sm ml-2">AI深度分析中，预计2分钟，道友稍后...</span>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  )

  // 发送消息
  const sendMessage = async () => {
    console.log('🔄 开始发送消息...')
    console.log('📝 当前消息:', currentMessage)
    console.log('👤 用户信息:', userInfo)
    console.log('💬 活跃对话ID:', conversationHistory.activeConversationId)

    if (!currentMessage.trim()) {
      console.warn('⚠️ 消息内容为空')
      return
    }

    if (!conversationHistory.activeConversationId) {
      console.log('🆕 没有活跃对话，创建新对话')
      conversationHistory.createNewConversation()
      return
    }

    const messageContent = currentMessage.trim()
    setCurrentMessage('')
    setLoading(true)

    // 生成用户消息
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'user',
      content: messageContent,
      timestamp: new Date()
    }

    // 立即添加用户消息到对话
    conversationHistory.addMessageToConversation(conversationHistory.activeConversationId, userMessage)

    try {
      // 获取一致的用户ID
      const activeUser = getActiveUser()
      let consistentUserId: string

      if (activeUser && activeUser.id) {
        consistentUserId = activeUser.id
      } else {
        const phoneNumber = getUserPhoneNumber()
        consistentUserId = phoneNumber || `user_${Date.now()}`
      }

      console.log('🔑 使用用户ID:', consistentUserId)

      // 准备请求体
      const requestBody = {
        message: messageContent,
        userInfo: userInfo,
        conversationId: conversationHistory.getCurrentConversation()?.cozeConversationId,
        userId: consistentUserId
      }

      console.log('📦 请求体:', requestBody)

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
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      // 处理流式响应
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法获取响应流')
      }

      let botMessageContent = ''
      let finalConversationId = ''
      let finalChatId = ''

      // 创建机器人消息
      const botMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'bot',
        content: '',
        timestamp: new Date()
      }

      // 添加空的机器人消息到对话
      conversationHistory.addMessageToConversation(conversationHistory.activeConversationId, botMessage)
      
      // 设置AI分析状态
      setIsTyping(true)

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = new TextDecoder().decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))

                if (data.type === 'content') {
                  // 第一次收到内容时清除AI分析状态
                  if (botMessageContent === '') {
                    setIsTyping(false)
                  }
                  
                  botMessageContent += data.content
                  finalConversationId = data.conversationId || finalConversationId
                  finalChatId = data.chatId || finalChatId

                  // 实时更新机器人消息内容
                  conversationHistory.updateConversation(conversationHistory.activeConversationId!, {
                    messages: conversationHistory.getCurrentConversation()!.messages.map(msg =>
                      msg.id === botMessage.id ? { ...msg, content: botMessageContent } : msg
                    ),
                    cozeConversationId: finalConversationId
                  })

                } else if (data.type === 'done') {
                  console.log('✅ 流式响应完成')
                  finalConversationId = data.conversationId || finalConversationId
                  finalChatId = data.chatId || finalChatId

                  // 打印认证信息到前端控制台
                  if (data.authInfo) {
                    console.group('🔐 报告聊天完成 - 认证信息')
                    console.log('认证方式:', data.authInfo.method)
                    console.log('Token类型:', data.authInfo.tokenType)
                    console.log('Token前缀:', data.authInfo.tokenPrefix)
                    console.log('用户ID:', data.authInfo.userId)
                    console.log('响应长度:', botMessageContent?.length || 0, '字符')
                    console.groupEnd()
                  } else {
                    console.log('🔐 报告聊天完成 - 认证方式:', data.authMethod || '未知')
                  }

                  // 最终更新
                  const finalConversations = conversationHistory.conversations.map(conv => {
                    if (conv.id === conversationHistory.activeConversationId) {
                      return {
                        ...conv,
                        messages: conv.messages.map(msg =>
                          msg.id === botMessage.id ? { ...msg, content: botMessageContent } : msg
                        ),
                        cozeConversationId: finalConversationId
                      }
                    }
                    return conv
                  })

                  // 更新对话标题
                  const currentConv = finalConversations.find(conv => conv.id === conversationHistory.activeConversationId)
                  if (currentConv) {
                    conversationHistory.updateConversationTitle(conversationHistory.activeConversationId!, currentConv.messages)

                    // 保存到Supabase
                    try {
                      await conversationHistory.saveConversationToSupabase(currentConv)
                    } catch (error) {
                      console.warn('⚠️ 保存对话到Supabase失败，但不影响聊天功能:', error)
                    }
                  }

                  console.log('✅ 流式消息发送成功')
                  break

                } else if (data.type === 'error') {
                  throw new Error(data.error || 'AI服务响应失败')
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

    } catch (error) {
      console.error('❌ 调用 Coze API 失败:', error)

      // 恢复用户输入的消息
      setCurrentMessage(messageContent)

      // 从对话中移除用户消息和机器人消息（因为发送失败）
      const revertedConversations = conversationHistory.conversations.map(conv => {
        if (conv.id === conversationHistory.activeConversationId) {
          return {
            ...conv,
            messages: conv.messages.filter(msg => msg.id !== userMessage.id && msg.type !== 'bot')
          }
        }
        return conv
      })

      // 显示错误消息
      message.error(`发送失败：${error instanceof Error ? error.message : String(error)}`)

    } finally {
      setLoading(false)
      setIsTyping(false)
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
              <h2 className="text-lg font-medium text-gray-900">{moduleConfig.title}</h2>
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
                <span className="font-medium">{moduleConfig.reportButtonText}</span>
              </div>

              <div
                onClick={() => {
                  console.log('🔄 点击开启新对话按钮')
                  conversationHistory.createNewConversation()
                  setCurrentContent('chat') // 切换到聊天视图
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
                      onClick={conversationHistory.createNewConversation}
                      className="text-gray-500 hover:text-gray-700"
                      size="small"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar" style={{ overscrollBehavior: 'contain' }}>
                  {conversationHistory.conversations
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
                        conversationHistory.activeConversationId === conversation.id
                          ? 'bg-gray-100 border border-gray-200'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                      onClick={() => conversationHistory.setActiveConversationId(conversation.id)}
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
                                onClick: () => conversationHistory.pinConversation(conversation.id)
                              },
                              {
                                key: 'rename',
                                label: '重命名',
                                icon: <EditOutlined />,
                                onClick: () => {
                                  setRenamingConversationId(conversation.id)
                                  setNewTitle(conversation.title)
                                  setRenameModalVisible(true)
                                }
                              },
                              {
                                type: 'divider'
                              },
                              {
                                key: 'delete',
                                label: '删除',
                                icon: <DeleteOutlined />,
                                danger: true,
                                onClick: () => conversationHistory.deleteConversation(conversation.id)
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
                        {new Date(conversation.createdAt).toLocaleDateString()}
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
          /* 报告展示区域 */
          <div className="h-screen flex flex-col">
            {/* 报告标题栏 */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                    <FileTextOutlined className="text-white" />
                  </div>
                  <Title level={2} className="!mb-0 !text-gray-900">{moduleConfig.reportTitle}</Title>
                </div>
                {reportGeneration.reportContent && (
                  <Button
                    icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                    onClick={copyReport}
                    className={`${copied ? 'border-green-500 text-green-500' : 'border-gray-400 text-gray-600'} hover:bg-gray-50`}
                    size="small"
                  >
                    {copied ? '已复制' : '复制'}
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
                    经过天乙神算系统的综合分析，为您生成以下{moduleConfig.title}报告。
                  </Paragraph>
                </div>
              )}
            </div>

            {/* 报告内容区域 - 独立滚动 */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar" style={{ overscrollBehavior: 'contain' }}>
              {reportGeneration.reportLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  {reportGeneration.isGenerating ? (
                    // 生成进度显示
                    <div className="w-full max-w-md">
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Spin
                            indicator={<LoadingOutlined style={{ fontSize: 24, color: 'white' }} spin />}
                          />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">正在生成{moduleConfig.title}报告</h3>
                        <p className="text-gray-600">{reportGeneration.generationStatus}</p>
                        <p className="text-sm text-gray-500 mt-2">系统每分钟检查一次生成状态，请耐心等待</p>
                      </div>
                    </div>
                  ) : (
                    // 普通加载显示
                    <div className="text-center">
                      <Spin size="large" />
                      <p className="text-gray-600 mt-4">加载{moduleConfig.title}报告中...</p>
                    </div>
                  )}
                </div>
              ) : reportGeneration.reportError ? (
                // 区分是生成中状态还是失败状态
                reportGeneration.isGenerating ? (
                  // 生成中状态：显示loading界面
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-full max-w-md">
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Spin
                            indicator={<LoadingOutlined style={{ fontSize: 24, color: 'white' }} spin />}
                          />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">您的{moduleConfig.title}报告正在生成中，预计等候三分钟。</h3>
                        <p className="text-gray-600">{reportGeneration.generationStatus}</p>
                        <p className="text-sm text-gray-500 mt-2">系统每分钟检查一次生成状态，请耐心等待</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  // 失败状态：显示错误信息
                  <div className="text-center py-20">
                    <Alert
                      message={reportGeneration.reportError}
                      type="error"
                      showIcon
                      className="mb-4"
                    />
                    {/* <Button type="primary" onClick={reportGeneration.regenerateReport}>
                      重新生成报告
                    </Button> */}
                  </div>
                )
              ) : reportGeneration.reportContent ? (
                <div className="prose prose-gray max-w-none markdown-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                  >
                    {reportGeneration.reportContent}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileTextOutlined className="text-gray-400 text-2xl" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无{moduleConfig.title}报告</h3>
                  <p className="text-gray-600 mb-4">点击按钮生成您的专属{moduleConfig.title}分析报告</p>
                  <Button type="primary" onClick={reportGeneration.regenerateReport}>
                    生成报告
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* 聊天界面 */
          <div className="h-screen flex flex-col">
            {/* 聊天标题栏 */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                  <MessageOutlined className="text-white" />
                </div>
                <Title level={3} className="!mb-0 !text-gray-900">
                  {conversationHistory.getCurrentConversation()?.title || `${moduleConfig.title}咨询`}
                </Title>
              </div>
            </div>

            {/* 聊天消息区域 */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
              style={{ overscrollBehavior: 'contain' }}
            >
              {conversationHistory.getCurrentConversation()?.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-3 max-w-[80%] ${
                    message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === 'user'
                        ? 'bg-blue-500'
                        : 'bg-gray-600'
                    }`}>
                      {message.type === 'user' ? (
                        <UserOutlined className="text-white text-sm" />
                      ) : (
                        <RobotOutlined className="text-white text-sm" />
                      )}
                    </div>
                    <div className={`rounded-lg p-3 ${
                      message.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      {message.type === 'bot' ? (
                        <div className="prose prose-sm max-w-none prose-gray">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* AI分析中提示 */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-3 max-w-[80%]">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-600">
                      <RobotOutlined className="text-white text-sm" />
                    </div>
                    <div className="rounded-lg p-3 bg-gray-100 text-gray-900">
                      <TypingIndicator />
                    </div>
                  </div>
                </div>
              )}

              {/* 滚动锚点 */}
              <div ref={messagesEndRef} />
            </div>

            {/* 回到底部按钮 */}
            {showScrollToBottom && (
              <div className="absolute bottom-20 right-6">
                <Button
                  type="primary"
                  shape="circle"
                  icon={<DownOutlined />}
                  onClick={() => scrollToBottom(true)}
                  className="shadow-lg"
                />
              </div>
            )}

            {/* 输入区域 */}
            <div className="p-4 border-t border-gray-100 bg-white">
              <div className="flex space-x-3">
                <TextArea
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder={`请输入您想咨询的${moduleConfig.title}问题...`}
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  className="flex-1"
                  disabled={loading || isTyping}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      if (!loading && !isTyping) {
                        sendMessage()
                      }
                    }
                  }}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={sendMessage}
                  loading={loading}
                  disabled={!currentMessage.trim() || isTyping}
                  className="self-end"
                >
                  发送
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 移动端抽屉菜单 */}
      <Drawer
        title={moduleConfig.title}
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
              conversationHistory.createNewConversation()
              setCurrentContent('chat') // 切换到聊天视图
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
      </Drawer>

      {/* 重命名对话模态框 */}
      <Modal
        title="重命名对话"
        open={renameModalVisible}
        onOk={() => {
          if (renamingConversationId && newTitle.trim()) {
            conversationHistory.renameConversation(renamingConversationId, newTitle.trim())
            setRenameModalVisible(false)
            setRenamingConversationId(null)
            setNewTitle('')
          }
        }}
        onCancel={() => {
          setRenameModalVisible(false)
          setRenamingConversationId(null)
          setNewTitle('')
        }}
        okText="确定"
        cancelText="取消"
      >
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="请输入新的对话标题"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (renamingConversationId && newTitle.trim()) {
                conversationHistory.renameConversation(renamingConversationId, newTitle.trim())
                setRenameModalVisible(false)
                setRenamingConversationId(null)
                setNewTitle('')
              }
            }
          }}
        />
      </Modal>
    </div>
  )
}