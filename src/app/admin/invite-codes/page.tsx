'use client'

// @ts-nocheck
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Layout, 
  Card, 
  Button, 
  Table, 
  message, 
  Modal, 
  Input, 
  Space,
  Tag,
  Popconfirm,
  Breadcrumb,
  Select,
  InputNumber 
} from 'antd'
import { 
  PlusOutlined, 
  LogoutOutlined, 
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  HomeOutlined,
  SettingOutlined 
} from '@ant-design/icons'

const { Header, Content } = Layout
const { TextArea } = Input

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
}

// 角色选项类型
interface RoleOption {
  role_name: string
  role_display_name: string
  is_active: boolean
}

export default function InviteCodesManagement() {
  const [codes, setCodes] = useState<InviteCode[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [remarks, setRemarks] = useState('')
  const [editingCode, setEditingCode] = useState<InviteCode | null>(null)
  const [editRemarks, setEditRemarks] = useState('')
  const [editRemainingTokens, setEditRemainingTokens] = useState<number>(0)
  const [editUserRole, setEditUserRole] = useState<string>('')
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([])
  const router = useRouter()

  useEffect(() => {
    // 检查管理员登录状态
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin')
      return
    }

    // 加载兑换码列表
    loadCodes()
    // 加载角色选项
    loadRoleOptions()

    // 设置定时刷新，每30秒检查一次兑换码状态
    const interval = setInterval(() => {
      loadCodes()
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
          console.log('📊 从Supabase获取到的原始数据:', result.data?.length || 0, '条')
          
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
          
          console.log('✅ 处理后的兑换码数据:', processedCodes?.length || 0, '条')
          console.log('📋 数据示例:', processedCodes.slice(0, 2))
          
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

  const loadRoleOptions = async () => {
    try {
      const response = await fetch('/api/admin/roles?simple=true')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setRoleOptions(result.data)
        }
      }
    } catch (error) {
      console.error('加载角色选项失败:', error)
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
        createdAt: new Date().toISOString(),
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
    try {
      // 优先使用Supabase API删除兑换码
      const response = await fetch(`/api/invite-code/supabase?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // 重新加载兑换码列表以获取最新数据
          await loadCodes()
          message.success('删除成功')
          return
        }
      }

      // 降级到localStorage方式
      const existingCodes = JSON.parse(localStorage.getItem('invite_codes') || '[]')
      const filteredCodes = existingCodes.filter((code: any) => code.id !== id)
      localStorage.setItem('invite_codes', JSON.stringify(filteredCodes))
      
      // 同步到服务器
      await syncCodesToServer(filteredCodes)
      
      setCodes(filteredCodes)
      message.success('删除成功')
    } catch (error) {
      console.error('删除兑换码失败:', error)
      message.error('删除失败，请重试')
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      message.success('兑换码已复制到剪贴板')
    }).catch(() => {
      message.error('复制失败')
    })
  }

  const handleEditCode = (record: InviteCode) => {
    setEditingCode(record)
    setEditRemarks(record.remarks || '')
    setEditRemainingTokens(record.remaining_tokens || 0)
    setEditUserRole(record.user_role || '')
    setEditModalVisible(true)
  }

  const handleUpdateCode = async () => {
    if (!editingCode) return
    
    setLoading(true)
    try {
      // 优先使用Supabase API更新兑换码
      const response = await fetch('/api/invite-code/supabase', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCode.id,
          remarks: editRemarks,
          remainingTokens: editRemainingTokens,
          userRole: editUserRole,
          hasUserData: !!editingCode.user_phone // 是否有用户数据
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // 重新加载兑换码列表以获取最新数据
          await loadCodes()
          setEditModalVisible(false)
          setEditingCode(null)
          setEditRemarks('')
          setEditRemainingTokens(0)
          setEditUserRole('')
          message.success('兑换码修改成功')
          return
        }
      }

      // 降级到localStorage方式
      const existingCodes = JSON.parse(localStorage.getItem('invite_codes') || '[]')
      const updatedCodes = existingCodes.map((code: any) => 
        code.id === editingCode.id 
          ? { ...code, remarks: editRemarks }
          : code
      )
      localStorage.setItem('invite_codes', JSON.stringify(updatedCodes))
      
      // 同步到服务器
      await syncCodesToServer(updatedCodes)
      
      // 更新状态
      setCodes(prev => prev.map(code => 
        code.id === editingCode.id 
          ? { ...code, remarks: editRemarks }
          : code
      ))
      
      setEditModalVisible(false)
      setEditingCode(null)
      setEditRemarks('')
      message.success('兑换码修改成功')
    } catch (error) {
      console.error('修改兑换码失败:', error)
      message.error('修改失败，请重试')
    } finally {
      setLoading(false)
    }
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
      render: (status: string) => {
        const config: Record<string, { color: string; text: string }> = {
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
      title: '用户手机号',
      dataIndex: 'user_phone',
      key: 'user_phone',
      render: (phone: string) => phone || '-'
    },
    {
      title: '用户名称',
      dataIndex: 'user_name',
      key: 'user_name',
      render: (name: string) => name || '-'
    },
    {
      title: '剩余对话次数',
      dataIndex: 'remaining_tokens',
      key: 'remaining_tokens',
      render: (tokens: number) => tokens !== null && tokens !== undefined ? tokens : '-'
    },
    {
      title: '用户角色',
      dataIndex: 'user_role',
      key: 'user_role',
      render: (role: string) => {
        if (!role) return '-'
        
        // 从动态角色选项中查找显示名称
        const roleOption = roleOptions.find(option => option.role_name === role)
        const displayName = roleOption?.role_display_name || role
        
        // 根据角色名称设置颜色
        const getColorByRole = (roleName: string) => {
          switch (roleName) {
            case 'admin': return 'red'
            case 'vip_user': return 'gold'
            case 'basic_user': return 'blue'
            case 'guest': return 'default'
            default: return 'purple'
          }
        }

        return (
          <Tag color={getColorByRole(role)}>
            {displayName}
          </Tag>
        )
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString('zh-CN')
    },
    {
      title: '使用时间',
      dataIndex: 'usedAt',
      key: 'usedAt',
      render: (date: string) => date ? new Date(date).toLocaleString('zh-CN') : '-'
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      render: (remarks: string) => remarks || '-'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: InviteCode) => (
        <Space>
          <Button 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => handleEditCode(record)}
          >
            修改
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
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-gray-800 m-0 mr-4">天乙神算 - 兑换码管理</h1>
          <Breadcrumb>
            <Breadcrumb.Item>
              <HomeOutlined />
              <span 
                className="cursor-pointer hover:text-blue-600"
                onClick={() => router.push('/admin/dashboard')}
              >
                管理后台
              </span>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <SettingOutlined />
              兑换码管理
            </Breadcrumb.Item>
          </Breadcrumb>
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
        {/* 统计信息 */}
        <Card className="mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{codes.length}</div>
              <div className="text-sm text-gray-600">总兑换码</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {codes.filter(c => c.status === 'active').length}
              </div>
              <div className="text-sm text-gray-600">未使用</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-500">
                {codes.filter(c => c.status === 'used').length}
              </div>
              <div className="text-sm text-gray-600">已使用</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-500">
                {codes.filter(c => c.status === 'expired').length}
              </div>
              <div className="text-sm text-gray-600">已过期</div>
            </div>
          </div>
          
          {/* 用户信息统计 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-lg font-semibold text-purple-600">
                {codes.filter(c => c.user_phone).length}
              </div>
              <div className="text-sm text-gray-600">已绑定用户</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-lg font-semibold text-orange-600">
                {codes.filter(c => c.user_role === 'vip_user').length}
              </div>
              <div className="text-sm text-gray-600">VIP用户</div>
            </div>
            <div className="text-center p-3 bg-cyan-50 rounded-lg">
                             <div className="text-lg font-semibold text-cyan-600">
                 {codes.reduce((sum, c) => sum + (c.remaining_tokens || 0), 0)}
               </div>
               <div className="text-sm text-gray-600">总剩余对话次数</div>
            </div>
          </div>
        </Card>

        {/* 兑换码管理表格 */}
        <Card 
          title="兑换码列表" 
          extra={
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setModalVisible(true)}
            >
              生成兑换码
            </Button>
          }
        >
          <Table
            columns={columns}
            dataSource={codes}
            rowKey="id"
            pagination={{
              pageSize: 10,
              total: codes.length,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `第 ${range[0]}-${range[1]} 条 / 共 ${total} 条`,
              pageSizeOptions: ['10', '20', '50', '100'],
              size: 'default'
            }}
            scroll={{ x: 1400 }}
          />
        </Card>

        {/* 生成兑换码Modal */}
        <Modal
          title="生成新兑换码"
          open={modalVisible}
          onOk={handleCreateCode}
          onCancel={() => {
            setModalVisible(false)
            setRemarks('')
          }}
          confirmLoading={loading}
          okText="生成"
          cancelText="取消"
        >
          <div className="space-y-4">
            <p className="text-gray-600">将生成一个16位的随机兑换码</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                备注（可选）
              </label>
              <TextArea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="为这个兑换码添加备注..."
                rows={3}
              />
            </div>
          </div>
        </Modal>

        {/* 修改兑换码Modal */}
        <Modal
          title="修改兑换码"
          open={editModalVisible}
          onOk={handleUpdateCode}
          onCancel={() => {
            setEditModalVisible(false)
            setEditingCode(null)
            setEditRemarks('')
            setEditRemainingTokens(0)
            setEditUserRole('')
          }}
          confirmLoading={loading}
          okText="保存"
          cancelText="取消"
        >
          <div className="space-y-4">
            {editingCode && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    兑换码
                  </label>
                  <code className="block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md font-mono text-sm">
                    {editingCode.code}
                  </code>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    状态
                  </label>
                  <Tag color={
                    editingCode.status === 'active' ? 'green' : 
                    editingCode.status === 'used' ? 'blue' : 'red'
                  }>
                    {editingCode.status === 'active' ? '未使用' : 
                     editingCode.status === 'used' ? '已使用' : '已过期'}
                  </Tag>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    创建时间
                  </label>
                  <p className="text-gray-600">{new Date(editingCode.created_at || editingCode.createdAt).toLocaleString('zh-CN')}</p>
                </div>
                                 {editingCode.user_phone && (
                   <>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">
                         使用用户
                       </label>
                       <p className="text-gray-600">
                         {editingCode.user_name} ({editingCode.user_phone})
                       </p>
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">
                         剩余对话次数
                       </label>
                       <InputNumber
                         value={editRemainingTokens}
                         onChange={(value) => setEditRemainingTokens(value || 0)}
                         min={0}
                         max={999}
                         className="w-full"
                         placeholder="输入剩余对话次数"
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">
                         用户角色
                       </label>
                       <Select
                         value={editUserRole}
                         onChange={setEditUserRole}
                         className="w-full"
                         placeholder="选择用户角色"
                         loading={roleOptions.length === 0}
                       >
                         {roleOptions.map(role => (
                           <Select.Option key={role.role_name} value={role.role_name}>
                             {role.role_display_name}
                           </Select.Option>
                         ))}
                       </Select>
                     </div>
                   </>
                 )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    备注
                  </label>
                  <TextArea
                    value={editRemarks}
                    onChange={(e) => setEditRemarks(e.target.value)}
                    placeholder="修改兑换码备注..."
                    rows={3}
                  />
                </div>
              </>
            )}
          </div>
        </Modal>
      </Content>
    </Layout>
  )
} 