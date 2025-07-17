'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Card, message, Form } from 'antd'
import { LockOutlined, UserOutlined } from '@ant-design/icons'

// 管理员账号配置（本地存储模式）
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'tianyishenshu2024'  // 建议改为你自己的密码
}

export default function AdminLogin() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true)
    
    try {
      // 模拟登录验证
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (values.username === ADMIN_CREDENTIALS.username && 
          values.password === ADMIN_CREDENTIALS.password) {
        
        // 保存管理员登录状态
        localStorage.setItem('admin_token', 'admin_logged_in_' + Date.now())
        localStorage.setItem('admin_username', values.username)
        
        message.success('登录成功！')
        router.push('/admin/dashboard')
      } else {
        message.error('用户名或密码错误！')
      }
    } catch (error) {
      message.error('登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Card className="w-full max-w-md mx-4 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">天乙神算</h1>
          <p className="text-gray-600">管理员后台</p>
        </div>

        <Form
          name="admin_login"
          onFinish={handleLogin}
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名!' }]}
          >
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder="管理员用户名"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码!' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="管理员密码"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full h-12 text-lg"
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div className="mt-6 text-center text-sm text-gray-500">
          {/* <p>默认账号：admin</p>
          <p>默认密码：tianyishenshu2024</p> */}
        </div>
      </Card>
    </div>
  )
} 