'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Button, 
  Input, 
  Card, 
  Typography, 
  Space,
  message,
  Divider,
  Drawer
} from 'antd'
import { 
  ArrowLeftOutlined,
  ArrowRightOutlined,
  SendOutlined,
  PlusOutlined,
  UserOutlined,
  RobotOutlined,
  MenuOutlined
} from '@ant-design/icons'

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
}

export default function PersonalityReportPage() {
  const [userInfo, setUserInfo] = useState<any>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [conversations, setConversations] = useState<ConversationHistory[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [currentMessage, setCurrentMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // 性格报告内容
  const personalityReport = {
    title: '性格分析报告',
    summary: `您好，${userInfo?.nickname || '用户'}！根据您提供的出生信息（${userInfo?.year}年${userInfo?.month}月${userInfo?.day}日 ${userInfo?.hour}时${userInfo?.minute}分，${userInfo?.area?.province}${userInfo?.area?.city}${userInfo?.area?.district}），经过天乙神数系统的综合分析，为您生成以下性格特征报告。`,
    sections: [
      {
        title: '基本性格特征',
        content: '您的性格温和而坚定，具有很强的责任感和使命感。在处理事情时，您倾向于深思熟虑，不轻易做决定，但一旦决定就会坚持到底。您天生具有敏锐的洞察力，能够快速理解他人的情感和需求，这使您在人际交往中颇受欢迎。'
      },
      {
        title: '情感表达方式',
        content: '您在情感表达上相对内敛，不喜欢过于张扬，但内心深处有着丰富的情感世界。您重视与他人的深层次交流，善于倾听，也愿意为重要的人付出。在爱情中，您是忠诚而专一的伴侣，但可能需要时间来完全敞开心扉。'
      },
      {
        title: '处事风格',
        content: '您做事认真负责，注重细节，有很强的完美主义倾向。您喜欢按计划行事，不喜欢突发状况，但当面临挑战时，您的适应能力超乎想象。您擅长分析问题的本质，能够找到创新的解决方案。'
      },
      {
        title: '人际关系',
        content: '您在社交场合中表现得体，但更倾向于与少数知心朋友保持深度联系，而非广泛的社交网络。您是一个值得信赖的朋友，朋友们经常向您寻求建议和支持。您的真诚和善良让您在团队中起到润滑剂的作用。'
      },
      {
        title: '优势与潜力',
        content: '您的主要优势在于强大的执行力和持续的学习能力。您能够在压力下保持冷静，具有出色的判断力。您的创造力和想象力丰富，适合从事需要创新思维的工作。建议您多相信自己的直觉，它往往能为您指引正确的方向。'
      }
    ]
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

    // 加载对话历史
    const savedConversations = localStorage.getItem('personality_conversations')
    if (savedConversations) {
      const conversations = JSON.parse(savedConversations)
      // 修复日期对象
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
      title: '性格分析对话',
      messages: [],
      createdAt: new Date()
    }
    
    const updatedConversations = [newConversation, ...conversations]
    setConversations(updatedConversations)
    setActiveConversationId(newConversation.id)
    // 保存时确保日期正确序列化
    localStorage.setItem('personality_conversations', JSON.stringify(updatedConversations))
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
      localStorage.setItem('personality_conversations', JSON.stringify(finalConversations))
    } finally {
      setLoading(false)
    }
  }

  // 获取当前对话
  const getCurrentConversation = () => {
    return conversations.find(conv => conv.id === activeConversationId)
  }

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 移动端顶部导航 */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-200 p-4 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">天</span>
            </div>
            <span className="font-bold text-gray-900">性格报告</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              icon={<MenuOutlined />}
              onClick={() => setDrawerVisible(true)}
              size="small"
            >
              对话
            </Button>
            <Button 
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push('/dashboard')}
              size="small"
            >
              返回
            </Button>
          </div>
        </div>
      </div>

      {/* 左侧工具栏 */}
      <div className={`bg-white shadow-sm border-r border-gray-200 transition-all duration-300 hidden md:flex flex-col ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        {/* 顶部区域 */}
        <div className="p-4 border-b border-gray-100">
          {!sidebarCollapsed && (
            <>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">天</span>
                </div>
                <span className="font-bold text-gray-900">天乙神数</span>
              </div>
              
              <div className="mb-4">
                <Title level={4} className="!mb-2">性格报告</Title>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-xs">欢</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">欢迎，</div>
                  <div className="text-xs text-gray-500">{userInfo.nickname || '用户'}</div>
                </div>
              </div>
            </>
          )}
          
          {sidebarCollapsed && (
            <div className="flex flex-col items-center space-y-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">天</span>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xs">欢</span>
              </div>
            </div>
          )}
        </div>

        {/* 对话记录区域 */}
        <div className="flex-1 p-4">
          {!sidebarCollapsed && (
            <>
              <div className="flex items-center justify-between mb-4">
                <Text strong>对话记录</Text>
                <Button 
                  type="text" 
                  icon={<PlusOutlined />} 
                  size="small"
                  onClick={createNewConversation}
                />
              </div>

              <div className="space-y-2">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      activeConversationId === conversation.id 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setActiveConversationId(conversation.id)}
                  >
                    <div className="font-medium text-sm">{conversation.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDate(conversation.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 返回按钮 */}
        <div className="p-4 border-t border-gray-100">
          <Button 
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push('/dashboard')}
            className={sidebarCollapsed ? 'w-full' : ''}
          >
            {!sidebarCollapsed && '返回'}
          </Button>
        </div>
      </div>

      {/* 隐藏/显示侧边栏按钮 */}
      <div className="relative hidden md:block">
        <Button
          type="text"
          icon={sidebarCollapsed ? <ArrowRightOutlined /> : <ArrowLeftOutlined />}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute top-4 -right-4 z-10 bg-white shadow-md border rounded-full w-8 h-8 flex items-center justify-center"
          size="small"
        />
      </div>

      {/* 右侧内容区域 */}
      <div className="flex-1 flex flex-col xl:flex-row pt-16 md:pt-0">
        {/* 性格报告区域 */}
        <div className="flex-1 xl:flex-none xl:w-1/2 p-4 md:p-6 bg-red-50">
          <Card className="h-full">
            <div className="mb-4">
              <Title level={3}>{personalityReport.title}</Title>
              <Paragraph className="text-gray-600 mb-6">
                {personalityReport.summary}
              </Paragraph>
            </div>

            <div className="space-y-6">
              {personalityReport.sections.map((section, index) => (
                <div key={index}>
                  <Title level={5} className="!mb-3">{section.title}</Title>
                  <Paragraph className="text-gray-700">
                    {section.content}
                  </Paragraph>
                  {index < personalityReport.sections.length - 1 && <Divider />}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* 对话区域 */}
        <div className="flex-1 xl:w-1/2 p-4 md:p-6 flex flex-col">
          <Card className="flex-1 flex flex-col">
            {/* 对话消息 */}
            <div className="flex-1 overflow-y-auto mb-4 p-4 bg-gray-50 rounded-lg min-h-[300px]">
              {!activeConversationId ? (
                <div className="text-center text-gray-500 py-8">
                  <RobotOutlined className="text-4xl mb-4" />
                  <p>请先创建一个对话开始聊天</p>
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={createNewConversation}
                    className="mt-4"
                  >
                    创建新对话
                  </Button>
                </div>
              ) : getCurrentConversation()?.messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <RobotOutlined className="text-4xl mb-4" />
                  <p>开始与AI助手对话，了解更多关于您的性格特征</p>
                  <div className="mt-4 text-sm text-gray-400">
                    <p>您可以问一些问题，比如：</p>
                    <p>"我的性格优势是什么？"</p>
                    <p>"我在人际关系中的表现如何？"</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {getCurrentConversation()?.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start space-x-2 max-w-[80%] ${
                        message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                      }`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          message.type === 'user' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-300 text-gray-600'
                        }`}>
                          {message.type === 'user' ? <UserOutlined /> : <RobotOutlined />}
                        </div>
                        <div className={`p-3 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white border border-gray-200'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
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
                      <div className="flex items-start space-x-2">
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                          <RobotOutlined />
                        </div>
                        <div className="bg-white border border-gray-200 p-3 rounded-lg">
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
            <div className="border-t border-gray-200 pt-4">
              <div className="flex space-x-2">
                <TextArea
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="输入你想要了解的性格问题..."
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  disabled={!activeConversationId}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={sendMessage}
                  loading={loading}
                  disabled={!currentMessage.trim() || !activeConversationId}
                  className="bg-green-500 hover:bg-green-600 border-green-500"
                />
              </div>
              {!activeConversationId && (
                <p className="text-sm text-gray-500 mt-2">
                  请先创建一个新对话开始聊天
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* 移动端对话历史抽屉 */}
      <Drawer
        title="对话记录"
        placement="left"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={280}
        className="md:hidden"
      >
        <div className="mb-4">
          <Button 
            type="primary"
            icon={<PlusOutlined />} 
            block
            onClick={() => {
              createNewConversation()
              setDrawerVisible(false)
            }}
          >
            新建对话
          </Button>
        </div>

        <div className="space-y-2">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                activeConversationId === conversation.id 
                  ? 'bg-blue-50 border border-blue-200' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => {
                setActiveConversationId(conversation.id)
                setDrawerVisible(false)
              }}
            >
                             <div className="font-medium text-sm">{conversation.title}</div>
               <div className="text-xs text-gray-500 mt-1">
                 {formatDate(conversation.createdAt)}
               </div>
            </div>
          ))}
        </div>
      </Drawer>
    </div>
  )
} 