'use client'

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
  Form,
  Switch,
  Checkbox
} from 'antd'
import { 
  PlusOutlined, 
  LogoutOutlined, 
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons'
import { devLog } from '@/utils/dev-logger'
const { Header, Content } = Layout
const { TextArea } = Input

// 类型定义
interface Role {
  id: string
  role_name: string
  role_display_name: string
  permissions: Record<string, string[]>
  description: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface FormValues {
  role_name: string
  role_display_name: string
  permissions: Record<string, string[]>
  description?: string
  is_active: boolean
}

// 预定义的权限模块和操作（与前端dashboard保持一致）
const PERMISSION_MODULES: Record<string, { name: string; actions: string[] }> = {
  astrology: { name: '八字排盘', actions: ['view', 'generate'] },
  personality: { name: '性格内观', actions: ['view', 'generate', 'chat'] },
  wealth: { name: '事业财富', actions: ['view', 'generate', 'chat'] },
  marriage: { name: '婚恋感情', actions: ['view', 'generate', 'chat'] },
  health: { name: '身体健康', actions: ['view', 'generate', 'chat'] },
  consultation: { name: '咨询问道', actions: ['view', 'chat'] },
  admin: { name: '管理功能', actions: ['dashboard', 'users', 'roles', 'reports'] }
}

const ACTION_LABELS: Record<string, string> = {
  view: '查看',
  generate: '生成',
  manage: '管理',
  create: '创建',
  delete: '删除',
  chat: '聊天',
  dashboard: '仪表板',
  users: '用户管理',
  roles: '角色管理',
  reports: '报告管理',
  edit: '编辑',
  config: '配置',
  access: '访问'
}

export default function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [form] = Form.useForm<FormValues>()
  const router = useRouter()

  useEffect(() => {
    // 检查管理员登录状态
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin')
      return
    }

    loadRoles()
  }, [router])

  const loadRoles = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/roles')
      const result = await response.json()
      
      if (result.success) {
        setRoles(result.data)
      } else {
        message.error('加载角色列表失败：' + result.error)
      }
    } catch (error) {
      devLog.error('加载角色列表失败:', error)
      message.error('加载失败，请重试')
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

  const handleCreateRole = () => {
    setEditingRole(null)
    form.resetFields()
    // 设置默认权限结构
    const defaultPermissions: Record<string, string[]> = {}
    Object.keys(PERMISSION_MODULES).forEach(module => {
      defaultPermissions[module] = []
    })
    form.setFieldsValue({ permissions: defaultPermissions })
    setModalVisible(true)
  }

  const handleEditRole = (role: Role) => {
    setEditingRole(role)
    
    // 确保所有权限模块都有对应的字段，避免复选框组冲突
    const normalizedPermissions: Record<string, string[]> = {}
    Object.keys(PERMISSION_MODULES).forEach(moduleKey => {
      normalizedPermissions[moduleKey] = role.permissions?.[moduleKey] || []
    })
    
    form.setFieldsValue({
      role_name: role.role_name,
      role_display_name: role.role_display_name,
      description: role.description,
      is_active: role.is_active,
      permissions: normalizedPermissions
    })
    setModalVisible(true)
  }

  const handleSubmit = async (values: FormValues) => {
    setLoading(true)
    try {
      const url = '/api/admin/roles'
      const method = editingRole ? 'PUT' : 'POST'
      const body = editingRole ? 
        { ...values, id: editingRole.id } : 
        values

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const result = await response.json()
      
      if (result.success) {
        message.success(editingRole ? '更新成功' : '创建成功')
        setModalVisible(false)
        loadRoles()
      } else {
        message.error(result.error)
      }
    } catch (error) {
      devLog.error('提交失败:', error)
      message.error('操作失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRole = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/roles?id=${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      
      if (result.success) {
        message.success('删除成功')
        loadRoles()
      } else {
        message.error(result.error)
      }
    } catch (error) {
      devLog.error('删除失败:', error)
      message.error('删除失败，请重试')
    }
  }

  const renderPermissions = (permissions: Record<string, string[]>) => {
    if (!permissions || typeof permissions !== 'object') {
      return <Tag>无权限</Tag>
    }

    const tags: JSX.Element[] = []
    Object.entries(permissions).forEach(([module, actions]) => {
      if (Array.isArray(actions) && actions.length > 0) {
        const moduleName = PERMISSION_MODULES[module]?.name || module
        tags.push(
          <Tag key={module} color="blue">
            {moduleName}: {actions.map(action => ACTION_LABELS[action] || action).join(', ')}
          </Tag>
        )
      }
    })

    return tags.length > 0 ? tags : <Tag>无权限</Tag>
  }

  const columns = [
    {
      title: '角色名称',
      dataIndex: 'role_name',
      key: 'role_name',
      render: (text: string) => <code className="bg-gray-100 px-2 py-1 rounded">{text}</code>
    },
    {
      title: '显示名称',
      dataIndex: 'role_display_name',
      key: 'role_display_name'
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '权限',
      dataIndex: 'permissions',
      key: 'permissions',
      render: renderPermissions,
      width: 400
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => text || '-'
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Role) => (
        <Space>
          <Button 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => handleEditRole(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除这个角色吗？"
            description="删除后无法恢复，且正在使用此角色的用户将受到影响。"
            onConfirm={() => handleDeleteRole(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              size="small" 
              danger 
              icon={<DeleteOutlined />}
              disabled={['admin', 'basic_user'].includes(record.role_name)}
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
        <div className="flex items-center space-x-4">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => router.push('/admin/dashboard')}
            type="text"
          >
            返回
          </Button>
          <h1 className="text-xl font-bold text-gray-800 m-0">角色权限管理</h1>
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
        <Card 
          title="角色权限列表" 
          extra={
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleCreateRole}
            >
              创建角色
            </Button>
          }
        >
          <div className="mb-4">
            <p className="text-gray-600">
              总计：{roles.length} 个角色 |
              启用：{roles.filter(r => r.is_active).length} 个 |
              禁用：{roles.filter(r => !r.is_active).length} 个
            </p>
          </div>

          <Table
            columns={columns}
            dataSource={roles}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1200 }}
          />
        </Card>

        <Modal
          title={editingRole ? '编辑角色' : '创建角色'}
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false)
            form.resetFields()
          }}
          footer={null}
          width={800}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              name="role_name"
              label="角色名称"
              rules={[{ required: true, message: '请输入角色名称' }]}
            >
              <Input 
                placeholder="如：vip_user"
                disabled={!!editingRole}
              />
            </Form.Item>

            <Form.Item
              name="role_display_name"
              label="显示名称"
              rules={[{ required: true, message: '请输入显示名称' }]}
            >
              <Input placeholder="如：VIP用户" />
            </Form.Item>

            <Form.Item
              name="description"
              label="描述"
            >
              <TextArea 
                rows={3} 
                placeholder="角色描述..."
              />
            </Form.Item>

            <Form.Item
              name="is_active"
              label="状态"
              valuePropName="checked"
              initialValue={true}
            >
              <Switch checkedChildren="启用" unCheckedChildren="禁用" />
            </Form.Item>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">权限设置</label>
                <div className="space-x-2">
                  <Button 
                    size="small" 
                    onClick={() => {
                      const allPermissions: Record<string, string[]> = {}
                      Object.entries(PERMISSION_MODULES).forEach(([moduleKey, moduleInfo]) => {
                        allPermissions[moduleKey] = [...moduleInfo.actions]
                      })
                      form.setFieldValue('permissions', allPermissions)
                    }}
                  >
                    全部授权
                  </Button>
                  <Button 
                    size="small" 
                    onClick={() => {
                      const emptyPermissions: Record<string, string[]> = {}
                      Object.keys(PERMISSION_MODULES).forEach(moduleKey => {
                        emptyPermissions[moduleKey] = []
                      })
                      form.setFieldValue('permissions', emptyPermissions)
                    }}
                  >
                    清空权限
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                {Object.entries(PERMISSION_MODULES).map(([moduleKey, moduleInfo]) => (
                  <div key={moduleKey} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-medium text-gray-900 m-0">
                        {moduleInfo.name}
                      </h4>
                      <div className="space-x-2">
                        <Button 
                          size="small" 
                          type="text"
                          onClick={() => {
                            form.setFieldValue(['permissions', moduleKey], [...moduleInfo.actions])
                          }}
                        >
                          全选
                        </Button>
                        <Button 
                          size="small" 
                          type="text"
                          onClick={() => {
                            form.setFieldValue(['permissions', moduleKey], [])
                          }}
                        >
                          清空
                        </Button>
                      </div>
                    </div>
                    <Form.Item 
                      name={['permissions', moduleKey]}
                      style={{ marginBottom: 0 }}
                    >
                      <Checkbox.Group className="w-full">
                        <div className="grid grid-cols-3 gap-2">
                          {moduleInfo.actions.map(action => (
                            <Checkbox key={action} value={action} className="whitespace-nowrap">
                              {ACTION_LABELS[action] || action}
                            </Checkbox>
                          ))}
                        </div>
                      </Checkbox.Group>
                    </Form.Item>
                  </div>
                ))}
              </div>
            </div>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {editingRole ? '更新' : '创建'}
                </Button>
                <Button onClick={() => setModalVisible(false)}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  )
} 