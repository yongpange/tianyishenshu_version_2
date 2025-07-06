'use client'

import { useState } from 'react'
import { Button, Card, Typography, Input, message, Spin } from 'antd'

const { Title, Text } = Typography

export default function TestOAuthPage() {
  const [chatLoading, setChatLoading] = useState(false)
  const [reportLoading, setReportLoading] = useState(false)
  const [chatResult, setChatResult] = useState<any>(null)
  const [reportResult, setReportResult] = useState<any>(null)

  const testChatAPI = async () => {
    setChatLoading(true)
    try {
      const response = await fetch('/api/coze/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: '你好，请简单介绍一下自己',
          userInfo: {
            phone: '13800138000'
          },
          botId: '7519894586509590568',
          userId: '13800138000'
        })
      })

      const data = await response.json()
      setChatResult(data)
      
      if (data.success) {
        message.success('聊天API测试成功')
      } else {
        message.error('聊天API测试失败')
      }
    } catch (error) {
      console.error('聊天API测试错误:', error)
      message.error('聊天API测试失败')
      setChatResult({ error: error.message })
    } finally {
      setChatLoading(false)
    }
  }

  const testReportAPI = async () => {
    setReportLoading(true)
    try {
      const response = await fetch('/api/personality-report/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userInfo: {
            year: 1990,
            month: 5,
            day: 15,
            hour: 14,
            minute: 30,
            gender: '男',
            area: {
              province: '北京市',
              city: '北京市',
              district: '朝阳区'
            }
          },
          userId: '13800138000',
          botId: '7519894586509590568'
        })
      })

      const data = await response.json()
      setReportResult(data)
      
      if (data.success) {
        message.success('性格报告API测试成功')
      } else {
        message.error('性格报告API测试失败')
      }
    } catch (error) {
      console.error('性格报告API测试错误:', error)
      message.error('性格报告API测试失败')
      setReportResult({ error: error.message })
    } finally {
      setReportLoading(false)
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>OAuth 2.0 API 测试页面</Title>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
        {/* 聊天API测试 */}
        <Card title="聊天API测试" style={{ height: 'fit-content' }}>
          <Button 
            type="primary" 
            onClick={testChatAPI} 
            loading={chatLoading}
            style={{ marginBottom: '16px' }}
          >
            测试聊天API
          </Button>
          
          {chatResult && (
            <div style={{ marginTop: '16px' }}>
              <Text strong>测试结果:</Text>
              <pre style={{ 
                background: '#f5f5f5', 
                padding: '12px', 
                borderRadius: '4px',
                fontSize: '12px',
                overflow: 'auto',
                maxHeight: '300px'
              }}>
                {JSON.stringify(chatResult, null, 2)}
              </pre>
            </div>
          )}
        </Card>

        {/* 性格报告API测试 */}
        <Card title="性格报告API测试" style={{ height: 'fit-content' }}>
          <Button 
            type="primary" 
            onClick={testReportAPI} 
            loading={reportLoading}
            style={{ marginBottom: '16px' }}
          >
            测试性格报告API
          </Button>
          
          {reportResult && (
            <div style={{ marginTop: '16px' }}>
              <Text strong>测试结果:</Text>
              <pre style={{ 
                background: '#f5f5f5', 
                padding: '12px', 
                borderRadius: '4px',
                fontSize: '12px',
                overflow: 'auto',
                maxHeight: '300px'
              }}>
                {JSON.stringify(reportResult, null, 2)}
              </pre>
            </div>
          )}
        </Card>
      </div>

      <Card title="测试说明" style={{ marginTop: '24px' }}>
        <ul>
          <li><strong>OAuth 2.0 认证:</strong> 使用JWT认证替代静态API Token</li>
          <li><strong>动态BOT_ID:</strong> BOT_ID作为参数传递，支持多智能体</li>
          <li><strong>测试BOT_ID:</strong> 7519894586509590568 (已验证可用)</li>
          <li><strong>成功指标:</strong> success: true, authMethod: "OAuth 2.0 JWT"</li>
        </ul>
      </Card>
    </div>
  )
}
