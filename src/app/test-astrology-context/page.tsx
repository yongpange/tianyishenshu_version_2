'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Spin, message } from 'antd'

export default function TestAstrologyContextPage() {
  const [loading, setLoading] = useState(false)
  const [contextData, setContextData] = useState<any>(null)

  const fetchContext = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-astrology-context')
      const data = await response.json()
      
      if (data.success) {
        setContextData(data)
        message.success('八字排盘上下文获取成功')
      } else {
        message.error(data.error || '获取失败')
      }
    } catch (error) {
      console.error('测试失败:', error)
      message.error('网络错误')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContext()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">八字排盘上下文测试</h1>
          <p className="text-gray-600">查看AI接收到的八字排盘提示词内容</p>
        </div>

        <div className="mb-4">
          <Button onClick={fetchContext} loading={loading} type="primary">
            重新获取上下文
          </Button>
        </div>

        {loading && (
          <div className="text-center py-8">
            <Spin size="large" />
            <p className="mt-4 text-gray-600">正在获取八字排盘数据...</p>
          </div>
        )}

        {contextData && (
          <div className="space-y-6">
            {/* 用户信息 */}
            <Card title="测试用户信息">
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                {JSON.stringify(contextData.userInfo, null, 2)}
              </pre>
            </Card>

            {/* 上下文统计 */}
            <Card title="上下文统计">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{contextData.length}</div>
                  <div className="text-gray-600">字符数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{contextData.context.split('\n').length}</div>
                  <div className="text-gray-600">行数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{contextData.context.split('**').length - 1}</div>
                  <div className="text-gray-600">段落数</div>
                </div>
              </div>
            </Card>

            {/* 八字排盘上下文内容 */}
            <Card title="八字排盘上下文内容（AI接收到的提示词）">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {contextData.context.split('\n').map((line: string, index: number) => {
                    if (line.startsWith('**') && line.endsWith('**')) {
                      // 标题行
                      return (
                        <div key={index} className="font-bold text-blue-700 text-base mb-2 mt-4">
                          {line.replace(/\*\*/g, '')}
                        </div>
                      )
                    } else if (line.startsWith('- ')) {
                      // 列表项
                      return (
                        <div key={index} className="text-gray-700 mb-1 pl-4">
                          <span className="text-blue-600 mr-2">•</span>
                          {line.substring(2)}
                        </div>
                      )
                    } else if (line.trim() === '') {
                      // 空行
                      return <div key={index} className="mb-2"></div>
                    } else {
                      // 普通文本
                      return (
                        <div key={index} className="text-gray-700 mb-1">
                          {line}
                        </div>
                      )
                    }
                  })}
                </div>
              </div>
            </Card>

            {/* 原始文本 */}
            <Card title="原始文本（复制用）">
              <textarea
                className="w-full h-64 p-4 border rounded text-sm font-mono"
                value={contextData.context}
                readOnly
                onClick={(e) => e.currentTarget.select()}
              />
              <p className="text-xs text-gray-500 mt-2">
                点击文本框可全选内容进行复制
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
} 