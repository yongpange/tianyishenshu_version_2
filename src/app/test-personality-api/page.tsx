'use client'

import { useState } from 'react'
import { Button, Card, Typography, Space, Input, Select } from 'antd'

const { Title, Text } = Typography
const { Option } = Select

export default function TestPersonalityAPIPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testAPI = async () => {
    setLoading(true)
    try {
      console.log('🧪 测试性格报告API...')
      
      const testData = {
        userInfo: {
          name: '测试用户',
          gender: '男',
          year: 1990,
          month: 5,
          day: 15,
          hour: 14,
          minute: 30,
          area: {
            province: '北京市',
            city: '北京市',
            district: '朝阳区'
          }
        },
        userId: 'test_user_' + Date.now(),
        botId: process.env.NEXT_PUBLIC_PERSONALITY_BOT_ID || '7519894586509590568'
      }

      console.log('📤 发送数据:', testData)

      const response = await fetch('/api/personality-report/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      })

      console.log('📥 响应状态:', response.status, response.statusText)

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('📊 响应数据:', data)
      setResult(data)

    } catch (error) {
      console.error('❌ 测试失败:', error)
      setResult({ 
        error: error instanceof Error ? error.message : '未知错误',
        success: false 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>性格报告 API 测试</Title>
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="API 测试">
          <Space>
            <Button type="primary" onClick={testAPI} loading={loading}>
              测试性格报告 API
            </Button>
            <Text type="secondary">
              BOT_ID: {process.env.NEXT_PUBLIC_PERSONALITY_BOT_ID || '7519894586509590568'}
            </Text>
          </Space>
        </Card>

        {result && (
          <Card title="测试结果">
            <pre style={{ 
              background: '#f5f5f5', 
              padding: '16px', 
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto',
              maxHeight: '600px'
            }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </Card>
        )}
      </Space>
    </div>
  )
}
