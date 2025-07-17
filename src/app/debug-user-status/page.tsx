'use client'

import { useState, useEffect } from 'react'
import { Card, Button, message } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'

export default function DebugUserStatusPage() {
  const [userStatus, setUserStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkUserStatus = async () => {
    setLoading(true)
    try {
      // 获取localStorage中的登录数据
      const loginData = localStorage.getItem('loginData')
      if (!loginData) {
        setUserStatus({ error: '未找到登录数据' })
        return
      }

      const parsed = JSON.parse(loginData)
      const phoneNumber = parsed.phoneNumber

      if (!phoneNumber) {
        setUserStatus({ error: '登录数据中未找到手机号' })
        return
      }

      // 调用登录API来获取最新的用户状态
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneNumber,
          code: '000000', // 使用测试验证码
          debug: true // 标识这是调试请求
        })
      })

      const result = await response.json()
      
      setUserStatus({
        localStorage: parsed,
        apiResponse: result,
        timestamp: new Date().toLocaleString()
      })

    } catch (error) {
      console.error('检查用户状态失败:', error)
      setUserStatus({ error: '检查失败: ' + (error as Error).message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkUserStatus()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">用户状态调试</h1>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={checkUserStatus}
            loading={loading}
          >
            刷新状态
          </Button>
        </div>

        <Card title="当前用户状态" className="mb-6">
          {userStatus ? (
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(userStatus, null, 2)}
            </pre>
          ) : (
            <div>加载中...</div>
          )}
        </Card>

        <Card title="问题诊断">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">如果跳转到profile页面，可能的原因：</h3>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>用户在 user_profiles 表中没有 parent_id 为 null 的记录</li>
                <li>所有 user_profiles 记录的 parent_id 都不为空（都是子用户）</li>
                <li>用户确实需要填写主个人信息</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold">如果应该跳转到dashboard，检查：</h3>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>user_profiles 表中是否存在该用户的记录</li>
                <li>是否有 parent_id 为 null 的主记录</li>
                <li>登录API的判断逻辑是否正确</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
} 