'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button,
  Input,
  Card,
  Typography,
  Drawer,
  Spin,
  Alert,
  Dropdown,
  Modal,
  message
} from 'antd'
import {
  ArrowLeftOutlined,
  SendOutlined,
  PlusOutlined,
  UserOutlined,
  RobotOutlined,
  MenuOutlined,
  LoadingOutlined,
  FileTextOutlined,
  MessageOutlined,
  HomeOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  PushpinOutlined,
  PushpinFilled
} from '@ant-design/icons'
import {
  getUserPhoneNumber,
  formatUserInfoDisplay
} from '@/utils/personality-report'
import { getUserConversations, saveConversation } from '@/lib/user-manager'
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

  // 对话管理相关状态
  const [renameModalVisible, setRenameModalVisible] = useState(false)
  const [renamingConversationId, setRenamingConversationId] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // 加载性格报告
  const loadPersonalityReport = async () => {
    try {
      setReportLoading(true)
      setReportError(null)

      const userId = getUserPhoneNumber()
      if (!userId) {
        setReportError('未找到用户信息，请重新登录')
        return
      }

      console.log('📖 开始获取性格报告:', { userId })

      // 使用 API 路由获取报告
      const response = await fetch('/api/personality-report/get', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      })

      const result = await response.json()

      if (result.success && result.report) {
        console.log('✅ 成功获取报告:', {
          contentLength: result.report.content?.length || 0,
          generatedAt: result.report.generatedAt
        })
        setReportContent(result.report.content)
      } else {
        console.log('❌ 获取报告失败:', result.error)
        setReportError(result.error || '性格报告未生成，请返回信息填写页重新生成')
      }
    } catch (error) {
      console.error('加载性格报告失败:', error)
      setReportError('加载报告失败，请稍后重试')
    } finally {
      setReportLoading(false)
    }
  }

  // 重新生成报告
  const regenerateReport = () => {
    router.push('/profile')
  }

  // 加载对话历史
  const loadConversations = async () => {
    try {
      const userId = getUserPhoneNumber()
      if (!userId) return

      // 从Supabase加载对话历史
      const supabaseConversations = await getUserConversations(userId)

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
    // 获取用户信息
    const userData = localStorage.getItem('userData')
    if (userData) {
      setUserInfo(JSON.parse(userData))
    } else {
      router.push('/profile')
      return
    }

    // 加载性格报告
    loadPersonalityReport()

    // 加载对话历史
    loadConversations()
  }, [router])

  // 滚动到消息底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversations, activeConversationId])

  // 创建新对话
  const createNewConversation = () => {
    const newConversation: ConversationHistory = {
      id: Date.now().toString(),
      title: '新对话',
      messages: [],
      createdAt: new Date()
    }

    const updatedConversations = [newConversation, ...conversations]
    setConversations(updatedConversations)
    setActiveConversationId(newConversation.id)
    // 保存时确保日期正确序列化
    localStorage.setItem('personality_conversations', JSON.stringify(updatedConversations))
  }

  // 更新对话标题（使用TextRank算法）
  const updateConversationTitle = (conversationId: string, messages: ChatMessage[]) => {
    if (messages.length >= 2) { // 至少有一轮对话才更新标题
      const title = generateConversationTitle(messages)

      const updatedConversations = conversations.map(conv => {
        if (conv.id === conversationId) {
          return { ...conv, title }
        }
        return conv
      })

      setConversations(updatedConversations)
      localStorage.setItem('personality_conversations', JSON.stringify(updatedConversations))

      // 同时更新到Supabase
      const updatedConv = updatedConversations.find(conv => conv.id === conversationId)
      if (updatedConv) {
        const userId = getUserPhoneNumber()
        if (userId) {
          saveConversation(userId, updatedConv).catch(error => {
            console.error('更新对话标题到Supabase失败:', error)
          })
        }
      }
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
    const updatedConv = updatedConversations.find(conv => conv.id === conversationId)
    if (updatedConv) {
      try {
        const userId = getUserPhoneNumber()
        if (userId) {
          await saveConversation(userId, updatedConv)
        }
      } catch (error) {
        console.error('更新置顶状态到Supabase失败:', error)
      }
    }

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
        return { ...conv, title: newTitle.trim() }
      }
      return conv
    })

    setConversations(updatedConversations)
    localStorage.setItem('personality_conversations', JSON.stringify(updatedConversations))

    // 更新到Supabase
    const updatedConv = updatedConversations.find(conv => conv.id === renamingConversationId)
    if (updatedConv) {
      try {
        const userId = getUserPhoneNumber()
        if (userId) {
          await saveConversation(userId, updatedConv)
        }
      } catch (error) {
        console.error('更新对话标题到Supabase失败:', error)
      }
    }

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
            // 这里需要实现deleteConversation函数，暂时跳过
            console.log('需要从Supabase删除对话:', conversationId)
          }
        } catch (error) {
          console.error('从Supabase删除对话失败:', error)
        }

        message.success('删除成功')
      }
    })
  }

  // 发送消息
  const sendMessage = async () => {
    if (!currentMessage.trim() || !activeConversationId) return

    setLoading(true)
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: currentMessage.trim(),
      timestamp: new Date()
    }

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

    setConversations(updatedConversations)
    setCurrentMessage('')

    // 调用 Coze 智能体 API
    try {
      const response = await fetch('/api/coze/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          userInfo: userInfo,
          conversationId: getCurrentConversation()?.cozeConversationId, // 保持对话连续性
        }),
      })

      const data = await response.json()

      if (data.success) {
        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: data.response,
          timestamp: new Date()
        }

        const finalConversations = updatedConversations.map(conv => {
          if (conv.id === activeConversationId) {
            return {
              ...conv,
              messages: [...conv.messages, botMessage],
              cozeConversationId: data.conversationId, // 保存 Coze 对话ID
            }
          }
          return conv
        })

        setConversations(finalConversations)

        // 更新对话标题
        const currentConv = finalConversations.find(conv => conv.id === activeConversationId)
        if (currentConv) {
          updateConversationTitle(activeConversationId, currentConv.messages)

          // 保存到Supabase
          try {
            const userId = getUserPhoneNumber()
            if (userId) {
              await saveConversation(userId, currentConv)
            }
          } catch (error) {
            console.error('保存对话到Supabase失败:', error)
          }
        }
        localStorage.setItem('personality_conversations', JSON.stringify(finalConversations))
      } else {
        throw new Error(data.error || 'AI服务响应失败')
      }
    } catch (error) {
      console.error('调用 Coze API 失败:', error)
      
      // 降级到本地模拟回复
      const fallbackMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: '抱歉，AI服务暂时不可用，请稍后重试。如果问题持续，请联系客服。',
        timestamp: new Date()
      }

      const finalConversations = updatedConversations.map(conv => {
        if (conv.id === activeConversationId) {
          return {
            ...conv,
            messages: [...conv.messages, fallbackMessage]
          }
        }
        return conv
      })

      setConversations(finalConversations)

      // 更新对话标题（错误情况下也要更新）
      const currentConv = finalConversations.find(conv => conv.id === activeConversationId)
      if (currentConv) {
        updateConversationTitle(activeConversationId, currentConv.messages)

        // 保存到Supabase
        try {
          const userId = getUserPhoneNumber()
          if (userId) {
            await saveConversation(userId, currentConv)
          }
        } catch (error) {
          console.error('保存对话到Supabase失败:', error)
        }
      }
      localStorage.setItem('personality_conversations', JSON.stringify(finalConversations))
    } finally {
      setLoading(false)
    }
  }

  // 获取当前对话
  const getCurrentConversation = () => {
    return conversations.find(conv => conv.id === activeConversationId)
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

  // 渲染左侧导航菜单项
  const renderNavItem = (
    key: string,
    icon: React.ReactNode,
    label: string,
    onClick: () => void,
    isActive: boolean = false
  ) => (
    <div
      key={key}
      onClick={onClick}
      className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
        isActive
          ? 'bg-blue-50 border border-blue-200 text-blue-600'
          : 'hover:bg-gray-50 text-gray-700'
      }`}
    >
      <div className={`text-lg ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
        {icon}
      </div>
      <span className="font-medium">{label}</span>
    </div>
  )

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex overflow-hidden">
      {/* 移动端顶部导航 */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white shadow-lg border-b border-gray-200 p-4 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">天</span>
            </div>
            <span className="font-bold text-gray-900">天乙神数</span>
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
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push('/dashboard')}
              size="small"
              type="text"
            >
              返回
            </Button>
          </div>
        </div>
      </div>

      {/* 左侧导航栏 */}
      <div className="bg-white shadow-lg border-r border-gray-200 w-80 hidden md:flex flex-col h-screen overflow-hidden">
        {/* 顶部品牌区域 */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">天</span>
            </div>
            <div>
              <div className="font-bold text-gray-900 text-lg">天乙神数</div>
              <div className="text-xs text-gray-500">AI命理分析平台</div>
            </div>
          </div>

          {/* 用户欢迎区域 */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <UserOutlined className="text-white" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">欢迎，{userInfo.nickname || '用户'}</div>
                <div className="text-xs text-gray-500">专属命理分析师</div>
              </div>
            </div>
          </div>
        </div>

        {/* 功能菜单区域 */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-3">
            {renderNavItem(
              'report',
              <FileTextOutlined />,
              '性格报告',
              () => setCurrentContent('report'),
              currentContent === 'report'
            )}
            {renderNavItem(
              'chat',
              <MessageOutlined />,
              '开启新对话',
              () => {
                setCurrentContent('chat')
                if (conversations.length === 0) {
                  createNewConversation()
                }
              },
              currentContent === 'chat'
            )}
          </div>

          {/* 对话历史区域 */}
          {currentContent === 'chat' && conversations.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <Text strong className="text-gray-700">对话历史</Text>
                <Button
                  type="text"
                  icon={<PlusOutlined />}
                  size="small"
                  onClick={createNewConversation}
                  className="text-blue-500 hover:text-blue-600"
                />
              </div>

              <div className="space-y-2">
                {conversations
                  .sort((a, b) => {
                    // 置顶的对话排在前面
                    if (a.isPinned && !b.isPinned) return -1
                    if (!a.isPinned && b.isPinned) return 1
                    // 其他按创建时间排序
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                  })
                  .map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`group relative p-3 rounded-lg transition-all duration-200 ${
                      activeConversationId === conversation.id
                        ? 'bg-blue-50 border border-blue-200 shadow-sm'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div
                      className="cursor-pointer"
                      onClick={() => setActiveConversationId(conversation.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          {conversation.isPinned && (
                            <PushpinFilled className="text-blue-500 text-xs flex-shrink-0" />
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
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 底部返回按钮 */}
        <div className="p-6 border-t border-gray-100">
          <Button
            icon={<HomeOutlined />}
            onClick={() => router.push('/dashboard')}
            className="w-full h-10 bg-gray-50 hover:bg-gray-100 border-gray-200"
            size="large"
          >
            返回仪表板
          </Button>
        </div>
      </div>

      {/* 右侧内容区域 */}
      <div className="flex-1 pt-16 md:pt-0 h-screen overflow-hidden">
        {currentContent === 'report' ? (
          /* 性格报告展示区域 */
          <div className="h-full p-6 overflow-y-auto">
            <Card className="shadow-lg border-0">
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <FileTextOutlined className="text-white" />
                  </div>
                  <Title level={2} className="!mb-0 !text-gray-800">性格分析报告</Title>
                </div>
                {userInfo && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                    <Paragraph className="text-gray-700 mb-0">
                      您好，<span className="font-semibold text-blue-600">{userInfo.nickname || '用户'}</span>！
                      根据您提供的出生信息（{formatUserInfoDisplay(userInfo)}），
                      经过天乙神数系统的综合分析，为您生成以下性格特征报告。
                    </Paragraph>
                  </div>
                )}
              </div>

              <div className="h-full overflow-y-auto">
                {reportLoading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Spin
                      indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
                      className="mb-4"
                    />
                    <p className="text-gray-600">正在加载性格报告...</p>
                  </div>
                ) : reportError ? (
                  <div className="text-center py-20">
                    <Alert
                      message="报告加载失败"
                      description={reportError}
                      type="warning"
                      showIcon
                      className="mb-6"
                    />
                    <div className="space-x-3">
                      <Button
                        type="primary"
                        onClick={regenerateReport}
                        size="large"
                        className="bg-gradient-to-r from-blue-500 to-purple-600 border-0"
                      >
                        重新生成报告
                      </Button>
                      <Button onClick={loadPersonalityReport} size="large">
                        重新加载
                      </Button>
                    </div>
                  </div>
                ) : reportContent ? (
                  <div className="space-y-6">
                    <div className="prose prose-lg max-w-none">
                      {reportContent.split('\n').map((paragraph, index) => (
                        paragraph.trim() && (
                          <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 mb-4">
                            <Paragraph className="text-gray-700 mb-0 leading-relaxed">
                              {paragraph.trim()}
                            </Paragraph>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <Alert
                      message="暂无报告"
                      description="性格报告尚未生成，请返回信息填写页生成报告"
                      type="info"
                      showIcon
                      className="mb-6"
                    />
                    <Button
                      type="primary"
                      onClick={regenerateReport}
                      size="large"
                      className="bg-gradient-to-r from-blue-500 to-purple-600 border-0"
                    >
                      去生成报告
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        ) : (
          /* 聊天界面区域 */
          <div className="h-full p-6 overflow-hidden">
            <Card className="h-full shadow-lg border-0 flex flex-col overflow-hidden">
              {/* 聊天标题区域 */}
              <div className="mb-4 pb-4 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <MessageOutlined className="text-white" />
                  </div>
                  <Title level={2} className="!mb-0 !text-gray-800">AI智能对话</Title>
                </div>
                <Text className="text-gray-500 text-sm">与AI助手深入探讨您的性格特征</Text>
              </div>

              {/* 对话消息区域 */}
              <div className="flex-1 overflow-y-auto mb-4 p-4 bg-gradient-to-b from-gray-50 to-white rounded-lg">
                {!activeConversationId ? (
                  <div className="text-center text-gray-500 py-12">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <RobotOutlined className="text-2xl text-white" />
                    </div>
                    <p className="text-lg mb-4">开始您的AI对话之旅</p>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={createNewConversation}
                      size="large"
                      className="bg-gradient-to-r from-blue-500 to-purple-600 border-0"
                    >
                      创建新对话
                    </Button>
                  </div>
                ) : getCurrentConversation()?.messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-12">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <RobotOutlined className="text-2xl text-white" />
                    </div>
                    <p className="text-lg mb-4">开始与AI助手对话，了解更多关于您的性格特征</p>
                    <div className="bg-blue-50 rounded-lg p-4 text-sm text-gray-600 max-w-md mx-auto">
                      <p className="font-medium mb-2">您可以问一些问题，比如：</p>
                      <div className="space-y-1">
                        <p>"我的性格优势是什么？"</p>
                        <p>"我在人际关系中的表现如何？"</p>
                        <p>"如何发挥我的潜力？"</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getCurrentConversation()?.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-start space-x-3 max-w-[80%] ${
                          message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                        }`}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            message.type === 'user'
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                              : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                          }`}>
                            {message.type === 'user' ? <UserOutlined /> : <RobotOutlined />}
                          </div>
                          <div className={`p-4 rounded-2xl shadow-sm ${
                            message.type === 'user'
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                              : 'bg-white border border-gray-200'
                          }`}>
                            <p className="text-sm leading-relaxed">{message.content}</p>
                            <p className={`text-xs mt-2 ${
                              message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {formatTime(message.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {loading && (
                      <div className="flex justify-start">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 flex items-center justify-center">
                            <RobotOutlined className="text-white" />
                          </div>
                          <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* 输入区域 */}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex space-x-3">
                  <TextArea
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                    placeholder="输入你想要了解的性格问题..."
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    disabled={!activeConversationId}
                    className="flex-1"
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={sendMessage}
                    loading={loading}
                    disabled={!currentMessage.trim() || !activeConversationId}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 border-0 h-auto px-6"
                    size="large"
                  >
                    发送
                  </Button>
                </div>
                {!activeConversationId && (
                  <p className="text-sm text-gray-500 mt-2">
                    请先创建一个新对话开始聊天
                  </p>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* 移动端功能抽屉 */}
      <Drawer
        title={
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">天</span>
            </div>
            <span>天乙神数</span>
          </div>
        }
        placement="left"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={320}
        className="md:hidden"
      >
        {/* 用户欢迎区域 */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <UserOutlined className="text-white" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">欢迎，{userInfo.nickname || '用户'}</div>
              <div className="text-xs text-gray-500">专属命理分析师</div>
            </div>
          </div>
        </div>

        {/* 功能菜单 */}
        <div className="space-y-3 mb-6">
          {renderNavItem(
            'report',
            <FileTextOutlined />,
            '性格报告',
            () => {
              setCurrentContent('report')
              setDrawerVisible(false)
            },
            currentContent === 'report'
          )}
          {renderNavItem(
            'chat',
            <MessageOutlined />,
            '开启新对话',
            () => {
              setCurrentContent('chat')
              if (conversations.length === 0) {
                createNewConversation()
              }
              setDrawerVisible(false)
            },
            currentContent === 'chat'
          )}
        </div>

        {/* 对话历史 */}
        {currentContent === 'chat' && conversations.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <Text strong className="text-gray-700">对话历史</Text>
              <Button
                type="text"
                icon={<PlusOutlined />}
                size="small"
                onClick={() => {
                  createNewConversation()
                  setDrawerVisible(false)
                }}
                className="text-blue-500 hover:text-blue-600"
              />
            </div>

            <div className="space-y-2">
              {conversations
                .sort((a, b) => {
                  // 置顶的对话排在前面
                  if (a.isPinned && !b.isPinned) return -1
                  if (!a.isPinned && b.isPinned) return 1
                  // 其他按创建时间排序
                  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                })
                .map((conversation) => (
                <div
                  key={conversation.id}
                  className={`group relative p-3 rounded-lg transition-all duration-200 ${
                    activeConversationId === conversation.id
                      ? 'bg-blue-50 border border-blue-200 shadow-sm'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div
                    className="cursor-pointer"
                    onClick={() => {
                      setActiveConversationId(conversation.id)
                      setDrawerVisible(false)
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        {conversation.isPinned && (
                          <PushpinFilled className="text-blue-500 text-xs flex-shrink-0" />
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