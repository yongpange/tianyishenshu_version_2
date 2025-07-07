'use client'

import { useState } from 'react'
import { Button, Card, Typography, Space } from 'antd'

const { Title, Text } = Typography

export default function DebugOAuthPage() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testStep = async (step: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-oauth-flow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ step })
      })

      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error('测试失败:', error)
      setResults({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testDirectOAuth = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-oauth-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error('直接OAuth测试失败:', error)
      setResults({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>OAuth 流程调试工具</Title>
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="测试步骤">
          <Space wrap>
            <Button onClick={() => testStep('jwt')} loading={loading}>
              测试 JWT Token 创建
            </Button>
            <Button onClick={() => testStep('oauth')} loading={loading}>
              测试 OAuth Access Token
            </Button>
            <Button onClick={testDirectOAuth} loading={loading} type="dashed">
              直接测试 OAuth (详细日志)
            </Button>
            <Button onClick={() => testStep('chat')} loading={loading}>
              测试聊天 API
            </Button>
            <Button onClick={() => testStep('personality')} loading={loading}>
              测试性格报告 API
            </Button>
            <Button type="primary" onClick={() => testStep('all')} loading={loading}>
              测试完整流程
            </Button>
          </Space>
        </Card>

        {results && (
          <Card title="测试结果">
            <pre style={{ 
              background: '#f5f5f5', 
              padding: '16px', 
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto',
              maxHeight: '600px'
            }}>
              {JSON.stringify(results, null, 2)}
            </pre>
          </Card>
        )}
      </Space>
    </div>
  )
}
