'use client'

// @ts-nocheck
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Layout, 
  Card, 
  Button, 
  message,
  Modal,
  Input,
  Space,
  Tag,
  Table
} from 'antd'
import { 
  LogoutOutlined,
  EyeOutlined,
  CopyOutlined
} from '@ant-design/icons'

const { Header, Content } = Layout

// 类型定义
interface InviteCode {
  id: string
  code: string
  status: 'active' | 'used' | 'expired'
  createdAt: string
  created_at?: string
  usedAt?: string
  remarks?: string
  user_phone?: string
  user_name?: string
  remaining_tokens?: number
  user_role?: string
  latest_verification_code?: string
  verification_code_expires_at?: string
}

interface VerificationCode {
  id: string
  phone_number: string
  latest_verification_code: string
  verification_code_expires_at: string
  status: 'active' | 'expired'
  expires_in_minutes: number
  created_at: string
  updated_at: string
  last_login?: string
}

export default function AdminDashboard() {
  const [codes, setCodes] = useState<InviteCode[]>([])
  const [verificationCodes, setVerificationCodes] = useState<VerificationCode[]>([])
  const [loading, setLoading] = useState(false)
  const [verificationSummary, setVerificationSummary] = useState({
    total: 0,
    active: 0,
    expired: 0
  })

  const router = useRouter()

  useEffect(() => {
    // 检查管理员登录状态
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin')
      return
    }

    // 加载兑换码列表和验证码列表
    loadCodes()
    loadVerificationCodes()

    // 设置定时刷新，每30秒检查一次状态
    const interval = setInterval(() => {
      loadCodes()
      loadVerificationCodes()
    }, 30000)

    return () => clearInterval(interval)
  }, [router])

  const loadCodes = async () => {
    try {
      // 优先从Supabase加载兑换码
      const response = await fetch('/api/invite-code/supabase')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // 按创建时间倒序排列（最新的在上面）
          const sortedCodes = result.data.sort((a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
          // 确保字段名映射正确
          const processedCodes = sortedCodes.map((code: any) => ({
            ...code,
            createdAt: code.created_at,
            usedAt: code.used_at
          }))
          setCodes(processedCodes)
          return
        }
      }
    } catch (error) {
      console.error('从Supabase加载兑换码失败:', error)
    }

    // 降级到localStorage
    const data = localStorage.getItem('invite_codes')
    const allCodes = data ? JSON.parse(data) : []
    setCodes(allCodes)
  }

  const loadVerificationCodes = async () => {
    try {
      const response = await fetch('/api/admin/verification-codes')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setVerificationCodes(result.data)
          setVerificationSummary(result.summary)
          return
        }
      }
    } catch (error) {
      console.error('加载验证码失败:', error)
    }
    
    // 如果获取失败，设置为空数据
    setVerificationCodes([])
    setVerificationSummary({ total: 0, active: 0, expired: 0 })
  }

  const cleanExpiredCodes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/verification-codes', {
        method: 'DELETE'
      })
      
      if (response.ok) {
        const result = await response.json()
        message.success(result.message)
        // 重新加载数据
        loadVerificationCodes()
      } else {
        message.error('清理失败')
      }
    } catch (error) {
      console.error('清理过期验证码失败:', error)
      message.error('清理失败')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_username')
    message.success('已退出登录')
    router.push('/admin')
  }

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const syncCodesToServer = async (codes: any[]) => {
    try {
      await fetch('/api/invite-code/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codes })
      })
    } catch (error) {
      console.error('同步兑换码到服务器失败:', error)
    }
  }

  const handleCreateCode = async () => {
    setLoading(true)
    try {
      // 优先使用Supabase创建兑换码
      const response = await fetch('/api/invite-code/supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: 1,
          remarks: remarks || `管理员生成 ${new Date().toLocaleString()}`
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          message.success('兑换码生成成功！')
          setModalVisible(false)
          setRemarks('')
          // 重新加载兑换码列表
          await loadCodes()
          return
        }
      }

      // 降级到localStorage方式
      const newCode = {
        id: Date.now().toString(),
        code: generateCode(),
        status: 'active',
        created_at: new Date().toISOString(),
        remarks: remarks || `管理员生成 ${new Date().toLocaleString()}`
      }

      const existingCodes = JSON.parse(localStorage.getItem('invite_codes') || '[]')
      existingCodes.unshift(newCode) // 添加到开头，保持最新的在上面
      localStorage.setItem('invite_codes', JSON.stringify(existingCodes))

      // 同步到服务器
      await syncCodesToServer(existingCodes)

      setCodes(existingCodes)
      setModalVisible(false)
      setRemarks('')
      message.success('兑换码生成成功！')
    } catch (error) {
      console.error('生成兑换码失败:', error)
      message.error('生成失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCode = async (id: string) => {
    const existingCodes = JSON.parse(localStorage.getItem('invite_codes') || '[]')
    const filteredCodes = existingCodes.filter((code: any) => code.id !== id)
    localStorage.setItem('invite_codes', JSON.stringify(filteredCodes))
    
    // 同步到服务器
    await syncCodesToServer(filteredCodes)
    
    setCodes(filteredCodes)
    message.success('删除成功')
  }

  const handleCopyCode = async (code: string) => {
    const { copyCode } = await import('@/utils/copy-helper')
    await copyCode(code, '兑换码')
  }

  const columns = [
    {
      title: '兑换码',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => (
        <Space>
          <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm">
            {code}
          </code>
          <Button 
            size="small" 
            icon={<CopyOutlined />} 
            onClick={() => handleCopyCode(code)}
          />
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const config = {
          active: { color: 'green', text: '未使用' },
          used: { color: 'blue', text: '已使用' },
          expired: { color: 'red', text: '已过期' }
        }
        return <Tag color={config[status]?.color}>
          {config[status]?.text}
        </Tag>
      }
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => date ? new Date(date).toLocaleString('zh-CN') : '-'
    },
    {
      title: '使用时间',
      dataIndex: 'used_at',
      key: 'used_at',
      render: (date) => date ? new Date(date).toLocaleString('zh-CN') : '-'
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      render: (remarks) => remarks || '-'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => message.info(`兑换码详情：${record.code}`)}
          >
            详情
          </Button>
          <Popconfirm
            title="确定删除这个兑换码吗？"
            onConfirm={() => handleDeleteCode(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              size="small" 
              danger 
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <Layout className="min-h-screen">
      <Header className="bg-white shadow-sm border-b flex justify-between items-center px-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800 m-0">天乙神算 - 管理后台</h1>
        </div>
        <Button 
          icon={<LogoutOutlined />} 
          onClick={handleLogout}
          type="text"
        >
          退出登录
        </Button>
      </Header>

      <Content className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
          <Card className="hover:shadow-lg transition-shadow">
            <div className="text-center">
              <div className="text-3xl text-blue-500 mb-4">👥</div>
              <h3 className="text-lg font-semibold mb-2">角色权限管理</h3>
              <p className="text-gray-600 mb-4">管理系统角色和权限设置</p>
              <Button 
                type="primary" 
                onClick={() => router.push('/admin/roles')}
                block
              >
                进入管理
              </Button>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <div className="text-center">
              <div className="text-3xl text-green-500 mb-4">🎫</div>
              <h3 className="text-lg font-semibold mb-2">兑换码管理</h3>
              <p className="text-gray-600 mb-4">生成和管理系统兑换码</p>
              <Button 
                type="primary" 
                onClick={() => router.push('/admin/invite-codes')}
                block
              >
                进入管理
              </Button>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <div className="text-center">
              <div className="text-3xl text-purple-500 mb-4">🔐</div>
              <h3 className="text-lg font-semibold mb-2">验证码管理</h3>
              <p className="text-gray-600 mb-4">查看和管理所有用户验证码</p>
              <Button 
                type="primary" 
                onClick={() => router.push('/admin/verification-codes')}
                block
              >
                进入管理
              </Button>
            </div>
          </Card>
        </div>

        <Card title="验证码管理">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{verificationSummary.total}</div>
              <div className="text-sm text-gray-600">总验证码</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{verificationSummary.active}</div>
              <div className="text-sm text-gray-600">有效验证码</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-500">{verificationSummary.expired}</div>
              <div className="text-sm text-gray-600">已过期</div>
            </div>
          </div>
          
          {/* 验证码列表 */}
          <div className="space-y-3 mb-6">
            <h4 className="font-semibold text-gray-700">最近的验证码</h4>
            {verificationCodes.slice(0, 5).map((code) => (
              <div key={code.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-mono text-sm">{code.phone_number}</div>
                  <div className="text-xs text-gray-500">
                    验证码: {code.latest_verification_code} | 
                    状态: <span className={code.status === 'active' ? 'text-green-600' : 'text-red-600'}>
                      {code.status === 'active' ? `${code.expires_in_minutes}分钟后过期` : '已过期'}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(code.verification_code_expires_at).toLocaleString('zh-CN')}
                </div>
              </div>
            ))}
            {verificationCodes.length === 0 && (
              <div className="text-center py-4 text-gray-500">暂无验证码记录</div>
            )}
          </div>
          
          <div className="flex gap-3 justify-center">
            <Button 
              type="primary" 
              size="large"
              icon={<EyeOutlined />}
              onClick={() => router.push('/admin/verification-codes')}
            >
              查看全部验证码
            </Button>
            <Button 
              type="default" 
              size="large"
              loading={loading}
              onClick={cleanExpiredCodes}
            >
              清理过期验证码
            </Button>
          </div>
        </Card>


      </Content>
    </Layout>
  )
} 