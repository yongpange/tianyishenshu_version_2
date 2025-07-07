'use client'

import { useState } from 'react'
import { Button, Input, Card, Typography, message } from 'antd'

const { TextArea } = Input
const { Title, Text } = Typography

export default function TestChatPage() {
  const [testMessage, setTestMessage] = useState('你好，我想了解我的性格特征')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [userInfo, setUserInfo] = useState<any>(null)

  // 获取用户信息
  const loadUserInfo = () => {
    const userData = localStorage.getItem('userData')
    if (userData) {
      const user = JSON.parse(userData)
      setUserInfo(user)
      console.log('✅ 用户信息已加载:', user)
    } else {
      console.warn('⚠️ 未找到用户信息')
      // 创建模拟用户信息
      const mockUser = {
        nickname: '测试用户',
        gender: 'male',
        year: 1990,
        month: 1,
        day: 1,
        hour: 12,
        minute: 0,
        area: {
          province: '北京市',
          city: '北京市',
          county: '朝阳区'
        }
      }
      localStorage.setItem('userData', JSON.stringify(mockUser))
      setUserInfo(mockUser)
      console.log('✅ 已创建模拟用户信息:', mockUser)
    }
  }

  const testCozeAPI = async () => {
    if (!testMessage.trim()) {
      message.error('请输入测试消息')
      return
    }

    if (!userInfo) {
      loadUserInfo()
      return
    }

    setLoading(true)
    setResponse('')

    try {
      console.log('🔄 发送测试消息:', testMessage)
      console.log('👤 使用用户信息:', userInfo)

      const res = await fetch('/api/coze/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: testMessage,
          userInfo: userInfo,
          conversationId: null
        }),
      })

      const data = await res.json()
      console.log('🔑 API响应:', data)

      if (data.success) {
        setResponse(data.response)
        message.success('测试成功！')
      } else {
        setResponse(`错误: ${data.error}`)
        message.error('测试失败')
      }
    } catch (error) {
      console.error('测试失败:', error)
      setResponse(`网络错误: ${error}`)
      message.error('网络请求失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Title level={2}>Coze API 聊天功能测试</Title>
        
        <Card className="mb-6">
          <div className="space-y-4">
            <div>
              <Text strong>用户信息状态:</Text>
              <div className="mt-2 p-3 bg-gray-50 rounded">
                {userInfo ? (
                  <div className="text-sm">
                    <p>✅ 用户信息已加载</p>
                    <p>昵称: {userInfo.nickname}</p>
                    <p>出生: {userInfo.year}年{userInfo.month}月{userInfo.day}日 {userInfo.hour}:{userInfo.minute}</p>
                  </div>
                ) : (
                  <p className="text-red-500">❌ 用户信息未加载</p>
                )}
              </div>
            </div>

            <div>
              <Text strong>测试消息:</Text>
              <TextArea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="输入要测试的消息，例如：你好，我想了解我的性格特征"
                rows={3}
                className="mt-2"
              />
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={loadUserInfo}
                size="large"
              >
                加载用户信息
              </Button>
              <Button
                type="primary"
                onClick={testCozeAPI}
                loading={loading}
                size="large"
                className="bg-black hover:bg-gray-800"
                disabled={!userInfo}
              >
                {loading ? '测试中...' : '测试 Coze API'}
              </Button>
            </div>
          </div>
        </Card>

        {response && (
          <Card title="API 响应结果">
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm">
                {response}
              </pre>
            </div>
          </Card>
        )}

        <Card title="测试说明" className="mt-6">
          <div className="space-y-2 text-sm text-gray-600">
            <p>• 这个页面用于测试 Coze API 的聊天功能</p>
            <p>• 会使用模拟的用户信息进行测试</p>
            <p>• 检查控制台日志查看详细的API调用信息</p>
            <p>• 如果测试成功，说明API配置正确</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
