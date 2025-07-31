'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Layout, 
  Card, 
  Button, 
  Table, 
  message,
  Tag,
  Space,
  Modal,
  Tooltip
} from 'antd'
import { 
  ArrowLeftOutlined,
  ReloadOutlined,
  DeleteOutlined,
  EyeOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import { devLog } from '@/utils/dev-logger'
const { Header, Content } = Layout

// 类型定义
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

export default function VerificationCodesPage() {
  const [verificationCodes, setVerificationCodes] = useState<VerificationCode[]>([])
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState({
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

    // 加载验证码列表
    loadVerificationCodes()

    // 设置定时刷新，每30秒检查一次验证码状态
    const interval = setInterval(() => {
      loadVerificationCodes()
    }, 30000)

    return () => clearInterval(interval)
  }, [router])

  const loadVerificationCodes = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/verification-codes')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setVerificationCodes(result.data)
          setSummary(result.summary)
        } else {
          message.error(result.message || '获取验证码失败')
        }
      } else {
        message.error('服务器错误')
      }
    } catch (error) {
      devLog.error('加载验证码失败:', error)
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const cleanExpiredCodes = async () => {
    Modal.confirm({
      title: '确认清理过期验证码？',
      content: '此操作将清理所有已过期的验证码，不可撤销。',
      okText: '确认清理',
      cancelText: '取消',
      onOk: async () => {
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
          devLog.error('清理过期验证码失败:', error)
          message.error('清理失败')
        } finally {
          setLoading(false)
        }
      }
    })
  }

  const columns = [
    {
      title: '手机号',
      dataIndex: 'phone_number',
      key: 'phone_number',
      render: (phone: string) => (
        <span className="font-mono">{phone}</span>
      )
    },
    {
      title: '验证码',
      dataIndex: 'latest_verification_code',
      key: 'verification_code',
      render: (code: string) => (
        <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm">
          {code}
        </code>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: VerificationCode) => {
        if (status === 'active') {
          return (
            <Tag color="green">
              <ClockCircleOutlined /> {record.expires_in_minutes}分钟后过期
            </Tag>
          )
        } else {
          return <Tag color="red">已过期</Tag>
        }
      }
    },
    {
      title: '过期时间',
      dataIndex: 'verification_code_expires_at',
      key: 'expires_at',
      render: (date: string) => (
        <span className="text-sm">
          {new Date(date).toLocaleString('zh-CN')}
        </span>
      )
    },
    {
      title: '最后登录',
      dataIndex: 'last_login',
      key: 'last_login',
      render: (date: string) => (
        <span className="text-sm text-gray-600">
          {date ? new Date(date).toLocaleString('zh-CN') : '未登录'}
        </span>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => (
        <span className="text-sm text-gray-500">
          {new Date(date).toLocaleString('zh-CN')}
        </span>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: VerificationCode) => (
        <Space>
          <Tooltip title="查看详情">
            <Button 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => {
                Modal.info({
                  title: '验证码详情',
                  content: (
                    <div className="space-y-2">
                      <p><strong>用户ID:</strong> {record.id}</p>
                      <p><strong>手机号:</strong> {record.phone_number}</p>
                      <p><strong>验证码:</strong> {record.latest_verification_code}</p>
                      <p><strong>过期时间:</strong> {new Date(record.verification_code_expires_at).toLocaleString('zh-CN')}</p>
                      <p><strong>剩余时间:</strong> {record.expires_in_minutes}分钟</p>
                      <p><strong>状态:</strong> {record.status === 'active' ? '有效' : '已过期'}</p>
                    </div>
                  )
                })
              }}
            >
              详情
            </Button>
          </Tooltip>
        </Space>
      )
    }
  ]

  return (
    <Layout className="min-h-screen">
      <Header className="bg-white shadow-sm border-b flex justify-between items-center px-6">
        <div className="flex items-center gap-4">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => router.push('/admin/dashboard')}
            type="text"
          >
            返回
          </Button>
          <h1 className="text-xl font-bold text-gray-800 m-0">验证码管理</h1>
        </div>
        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={loadVerificationCodes}
            loading={loading}
          >
            刷新
          </Button>
          <Button 
            icon={<DeleteOutlined />} 
            onClick={cleanExpiredCodes}
            loading={loading}
            danger
          >
            清理过期
          </Button>
        </Space>
      </Header>

      <Content className="p-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="text-center">
            <div className="text-3xl font-bold text-blue-600">{summary.total}</div>
            <div className="text-gray-600">总验证码数</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-green-600">{summary.active}</div>
            <div className="text-gray-600">有效验证码</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-red-600">{summary.expired}</div>
            <div className="text-gray-600">已过期验证码</div>
          </Card>
        </div>

        {/* 验证码列表 */}
        <Card title="验证码列表">
          <Table
            columns={columns}
            dataSource={verificationCodes}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `显示 ${range[0]}-${range[1]} 条，共 ${total} 条记录`
            }}
            scroll={{ x: 800 }}
          />
        </Card>
      </Content>
    </Layout>
  )
} 