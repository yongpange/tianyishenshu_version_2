'use client'

import { useState } from 'react'
import { Button, Input, Card, Typography, Space, Spin } from 'antd'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

export default function DebugCozePage() {
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState('')
  const [error, setError] = useState('')

  const testCozeAPI = async () => {
    setLoading(true)
    setResponse('')
    setError('')

    try {
      console.log('🔄 开始测试 Coze API...')
      
      const testData = {
        message: '你好，请简单介绍一下自己',
        userInfo: {
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
      }

      console.log('📦 发送数据:', testData)

      const res = await fetch('/api/coze/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      })

      console.log('📡 响应状态:', res.status)
      console.log('📡 响应头:', Object.fromEntries(res.headers.entries()))

      const data = await res.json()
      console.log('📋 响应数据:', data)

      if (res.ok && data.success) {
        setResponse(data.response)
        console.log('✅ API 调用成功')
      } else {
        setError(`API 错误: ${data.error || '未知错误'}`)
        console.error('❌ API 调用失败:', data)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      setError(`网络错误: ${errorMsg}`)
      console.error('❌ 网络错误:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>🔧 Coze API 调试工具</Title>
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="API 测试">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button 
              type="primary" 
              onClick={testCozeAPI}
              loading={loading}
              size="large"
            >
              {loading ? '测试中...' : '测试 Coze API'}
            </Button>
            
            <Text type="secondary">
              点击按钮测试 Coze API 连接和响应
            </Text>
          </Space>
        </Card>

        {loading && (
          <Card>
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spin size="large" />
              <div style={{ marginTop: '16px' }}>
                <Text>正在调用 Coze API...</Text>
              </div>
            </div>
          </Card>
        )}

        {response && (
          <Card title="✅ API 响应成功" style={{ borderColor: '#52c41a' }}>
            <Paragraph>
              <pre style={{ 
                background: '#f6ffed', 
                padding: '16px', 
                borderRadius: '6px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {response}
              </pre>
            </Paragraph>
          </Card>
        )}

        {error && (
          <Card title="❌ API 调用失败" style={{ borderColor: '#ff4d4f' }}>
            <Paragraph>
              <pre style={{ 
                background: '#fff2f0', 
                padding: '16px', 
                borderRadius: '6px',
                color: '#ff4d4f'
              }}>
                {error}
              </pre>
            </Paragraph>
          </Card>
        )}

        <Card title="📋 调试信息">
          <Space direction="vertical">
            <Text strong>环境变量检查:</Text>
            <ul>
              <li>COZE_CLIENT_ID: {process.env.NEXT_PUBLIC_COZE_CLIENT_ID ? '✅ 已配置' : '❌ 未配置'}</li>
              <li>BOT_ID: {process.env.NEXT_PUBLIC_BOT_ID ? '✅ 已配置' : '❌ 未配置'}</li>
            </ul>
            <Text type="secondary">
              请打开浏览器控制台查看详细的调试日志
            </Text>
          </Space>
        </Card>
      </Space>
    </div>
  )
}
