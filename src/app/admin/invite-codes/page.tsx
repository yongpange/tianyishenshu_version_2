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
  SettingOutlined,
  SearchOutlined 
} from '@ant-design/icons'
import { devLog } from '@/utils/dev-logger'
import { getAreaNameByCode, getAreaPath } from '@/utils/area-data'
import SimpleAreaSelector from '@/components/SimpleAreaSelector'

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
  remaining_tokens?: number // user_profiles.chat_remaining_count (已激活用户)
  chat_total_count?: number // invite_codes.chat_total_count (未激活用户)
  user_role?: string
  latest_verification_code?: string
  verification_code_expires_at?: string
  user_profiles_id?: string // 添加精确的用户资料ID
}

// 用户资料详情类型
interface UserProfileDetail {
  id: string
  name: string
  gender: 'male' | 'female'
  year: number
  month: number
  day: number
  hour: number
  minute: number
  area_province: string
  area_city: string
  area_district: string
  users?: {
    phone_number: string
  }
}

// 地区编码与名称
interface AreaInfo {
  provinceCode: string
  cityCode: string
  districtCode: string
  provinceName: string
  cityName: string
  districtName: string
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
  const [regenerateLoading, setRegenerateLoading] = useState<string>('')
  const [searchText, setSearchText] = useState<string>('')
  // 添加分页相关状态
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  })
  // 添加搜索防抖状态
  const [searchLoading, setSearchLoading] = useState(false)
  // 用户信息编辑相关状态
  const [userEditModalVisible, setUserEditModalVisible] = useState(false)
  const [editingUserProfile, setEditingUserProfile] = useState<UserProfileDetail | null>(null)
  const [userProfileLoading, setUserProfileLoading] = useState(false)
  const [currentEditRecord, setCurrentEditRecord] = useState<InviteCode | null>(null)
  // 地区相关状态
  const [areaInfo, setAreaInfo] = useState<AreaInfo | null>(null)
  const [areaSelectValue, setAreaSelectValue] = useState<{province?: string, city?: string, district?: string}>({})
  const router = useRouter()

  useEffect(() => {
    // 检查管理员登录状态
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin')
      return
    }

    // 加载兑换码列表
    loadCodes(1, pagination.pageSize, '')
    // 加载角色选项
    loadRoleOptions()

    // 注释掉定时刷新功能
    // const interval = setInterval(() => {
    //   loadCodes(pagination.page, pagination.pageSize, searchText)
    // }, 30000)

    // return () => clearInterval(interval)
  }, [router])

  // 搜索防抖效果
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchText !== undefined) {
        loadCodes(1, pagination.pageSize, searchText) // 搜索时重置到第一页
      }
    }, 500) // 500ms防抖

    return () => clearTimeout(debounceTimer)
  }, [searchText])

  const loadCodes = async (page: number = 1, pageSize: number = 10, search: string = '') => {
    try {
      setLoading(true)
      if (search !== searchText && search !== '') {
        setSearchLoading(true)
      }

      // 构建查询参数
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      })
      
      if (search && search.trim()) {
        params.append('search', search.trim())
      }

      // 优先从Supabase加载兑换码，带分页参数
      const response = await fetch(`/api/invite-code/supabase?${params.toString()}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          devLog.log('📊 从Supabase获取分页数据:', {
            dataCount: result.data?.length || 0,
            pagination: result.pagination,
            hasSearch: !!search
          })
          
          // 确保字段名映射正确
          const processedCodes = result.data?.map((code: any) => ({
            ...code,
            createdAt: code.created_at,
            usedAt: code.used_at
          })) || []
          
          setCodes(processedCodes)
          setPagination(result.pagination || {
            page: 1,
            pageSize: 10,
            total: 0,
            totalPages: 0
          })
          return
        }
      }
      
      // 如果Supabase失败，显示错误信息
      console.error('获取兑换码数据失败')
      setCodes([])
      setPagination({
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0
      })
    } catch (error) {
      devLog.error('从Supabase加载兑换码失败:', error)
      setCodes([])
      setPagination({
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0
      })
    } finally {
      setLoading(false)
      setSearchLoading(false)
    }
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
      devLog.error('加载角色选项失败:', error)
    }
  }

  // 分页变化处理
  const handleTableChange = (paginationConfig: any) => {
    const newPage = paginationConfig.current || 1
    const newPageSize = paginationConfig.pageSize || 10
    
    loadCodes(newPage, newPageSize, searchText)
  }

  // 搜索文本变化处理
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value)
  }

  // 清空搜索
  const handleSearchClear = () => {
    setSearchText('')
  }

  // 回车触发搜索
  const handleSearchEnter = () => {
    // 立即触发搜索，跳过防抖延迟
    loadCodes(1, pagination.pageSize, searchText)
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
      devLog.error('同步兑换码到服务器失败:', error)
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
          // 重新加载当前页数据
          await loadCodes(pagination.page, pagination.pageSize, searchText)
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
      devLog.error('生成兑换码失败:', error)
      message.error('生成失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCode = async (id: string, record?: InviteCode) => {
    try {
      // 确认删除对话框
      const isUsedCode = record && record.status === 'used' && record.user_name
      const confirmMessage = isUsedCode 
        ? `确定要删除兑换码及关联的用户数据吗？\n用户: ${record.user_name}\n手机: ${record.user_phone || '未知'}\n\n⚠️ 此操作将删除用户的所有数据（对话、报告等），且不可恢复！`
        : '确定要删除这个兑换码吗？'

      const confirmed = window.confirm(confirmMessage)
      if (!confirmed) {
        return
      }

      console.log('🗑️ 开始删除兑换码:', id, '记录信息:', record)

      // 使用事务化级联删除API
      const response = await fetch(`/api/invite-code/cascade-delete?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ 删除结果:', result)
        
        if (result.success) {
          // 重新加载当前页数据
          await loadCodes(pagination.page, pagination.pageSize, searchText)
          
          // 显示详细的删除结果
          if (result.deleted_items) {
            const items = result.deleted_items
            const deletedCount = Object.values(items).reduce((count: number, value) => {
              if (typeof value === 'number') return count + value
              if (typeof value === 'boolean' && value) return count + 1
              return count
            }, 0)
            
            message.success({
              content: `${result.message || '删除成功'}\n共删除 ${deletedCount} 项相关数据`,
              duration: 5
            })
          } else {
            message.success(result.message || '删除成功')
          }
          return
        } else {
          // 检查是否是主用户有子用户的情况
          if (result.has_child_users || result.hasChildUsers) {
            message.error({
              content: result.message,
              duration: 8
            })
            return
          }
          throw new Error(result.message || '删除失败')
        }
      } else {
        const errorResult = await response.json()
        if (errorResult.has_child_users || errorResult.hasChildUsers) {
          message.error({
            content: errorResult.message,
            duration: 8
          })
          return
        }
        throw new Error(errorResult.message || `HTTP ${response.status}: 删除失败`)
      }
    } catch (error) {
      devLog.error('❌ 删除兑换码失败:', error)
      const errorMessage = error instanceof Error ? error.message : '删除失败，请重试'
      message.error({
        content: `删除失败: ${errorMessage}`,
        duration: 8
      })
    }
  }

  const handleCopyCode = async (code: string) => {
    const { copyCode } = await import('@/utils/copy-helper')
    await copyCode(code, '兑换码')
  }

  const handleEditCode = (record: InviteCode) => {
    setEditingCode(record)
    setEditRemarks(record.remarks || '')
    // 根据激活状态设置对话次数的编辑值
    if (record.user_phone) {
      // 已激活用户：编辑 user_profiles.chat_remaining_count
      setEditRemainingTokens(record.remaining_tokens || 0)
    } else {
      // 未激活用户：编辑 invite_codes.chat_total_count
      setEditRemainingTokens(record.chat_total_count || 2) // 默认值为2
    }
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
          remainingTokens: editingCode.user_phone ? editRemainingTokens : undefined, // 已激活用户的剩余对话次数
          chatTotalCount: !editingCode.user_phone ? editRemainingTokens : undefined, // 未激活用户的预设对话次数
          userRole: editUserRole,
          hasUserData: !!editingCode.user_phone // 是否有用户数据（已激活）
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // 重新加载当前页数据
          await loadCodes(pagination.page, pagination.pageSize, searchText)
          setEditModalVisible(false)
          setEditingCode(null)
          setEditRemarks('')
          setEditRemainingTokens(0)
          setEditUserRole('')
          
          // 显示相应的成功消息
          if (result.needRefresh) {
            message.success(result.message || '兑换码修改成功，已刷新数据')
          } else {
            message.success(editingCode.user_phone ? '已激活用户信息修改成功' : '未激活用户预设角色修改成功')
          }
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
      devLog.error('修改兑换码失败:', error)
      message.error('修改失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerateReport = async (reportType: string) => {
    Modal.confirm({
      title: '确认重新生成报告',
      content: `确定要重新生成所有用户的${getReportDisplayName(reportType)}报告吗？此操作将删除现有报告并生成新的报告，不可撤销。`,
      okText: '确定重新生成',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        setRegenerateLoading(reportType)
        try {
          const response = await fetch(`/api/admin/regenerate-reports`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              reportType,
              adminToken: localStorage.getItem('admin_token')
            })
          })

          const result = await response.json()
          
          if (result.success) {
            message.success(`${getReportDisplayName(reportType)}报告重新生成已启动，共${result.count || 0}个用户`)
          } else {
            message.error(result.error || '重新生成失败')
          }
        } catch (error) {
          devLog.error('重新生成报告失败:', error)
          message.error('重新生成失败，请重试')
        } finally {
          setRegenerateLoading('')
        }
      }
    })
  }

  // 获取用户详细资料并转换地区编码
  const fetchUserProfile = async (userProfileId: string): Promise<UserProfileDetail | null> => {
    try {
      setUserProfileLoading(true)
      const response = await fetch(`/api/user-profiles/detail?id=${userProfileId}`)
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          const profile = result.data
          
          // 转换地区编码为名称（如果需要的话）
          await convertAreaCodesToNames(profile)
          
          return profile
        }
      }
      
      const errorResult = await response.json()
      message.error(errorResult.message || '获取用户资料失败')
      return null
    } catch (error) {
      devLog.error('获取用户资料失败:', error)
      message.error('获取用户资料失败')
      return null
    } finally {
      setUserProfileLoading(false)
    }
  }

  // 转换地区编码为名称
  const convertAreaCodesToNames = async (profile: UserProfileDetail) => {
    try {
      // 检查是否已经是名称格式（包含中文字符）
      const isProvinceCode = /^\d+$/.test(profile.area_province)
      const isCityCode = /^\d+$/.test(profile.area_city)
      const isDistrictCode = /^\d+$/.test(profile.area_district)
      
      let provinceCode = profile.area_province
      let cityCode = profile.area_city  
      let districtCode = profile.area_district
      
      let provinceName = profile.area_province
      let cityName = profile.area_city
      let districtName = profile.area_district
      
      // 如果是编码格式，转换为名称
      if (isProvinceCode) {
        const name = await getAreaNameByCode(profile.area_province)
        if (name) {
          provinceName = name
        }
      } else {
        // 如果是名称格式，可能需要反向查找编码（这里先保持原样）
        provinceCode = profile.area_province
      }
      
      if (isCityCode) {
        const name = await getAreaNameByCode(profile.area_city)
        if (name) {
          cityName = name
        }
      } else {
        cityCode = profile.area_city
      }
      
      if (isDistrictCode) {
        const name = await getAreaNameByCode(profile.area_district)
        if (name) {
          districtName = name
        }
      } else {
        districtCode = profile.area_district
      }
      
      // 设置地区信息
      setAreaInfo({
        provinceCode,
        cityCode, 
        districtCode,
        provinceName,
        cityName,
        districtName
      })
      
      // 设置地区选择器的值（使用编码）
      setAreaSelectValue({
        province: isProvinceCode ? provinceCode : undefined,
        city: isCityCode ? cityCode : undefined,
        district: isDistrictCode ? districtCode : undefined
      })
      
      devLog.log('🌍 地区信息转换完成:', {
        原始数据: { province: profile.area_province, city: profile.area_city, district: profile.area_district },
        转换结果: { provinceName, cityName, districtName }
      })
      
    } catch (error) {
      devLog.error('转换地区编码失败:', error)
    }
  }

  // 更新用户资料
  const updateUserProfile = async (profileData: UserProfileDetail): Promise<boolean> => {
    try {
      setUserProfileLoading(true)
      
      // 如果使用了地区选择器，更新地区信息
      if (areaSelectValue.province) {
        profileData.area_province = areaSelectValue.province
      }
      if (areaSelectValue.city) {
        profileData.area_city = areaSelectValue.city
      }
      if (areaSelectValue.district) {
        profileData.area_district = areaSelectValue.district
      }
      
      const response = await fetch(`/api/user-profiles/detail`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          message.success('用户资料更新成功')
          return true
        }
      }
      
      const errorResult = await response.json()
      message.error(errorResult.message || '更新用户资料失败')
      return false
    } catch (error) {
      devLog.error('更新用户资料失败:', error)
      message.error('更新用户资料失败')
      return false
    } finally {
      setUserProfileLoading(false)
    }
  }

  // 处理八字排盘报告重新生成（修改版本）
  const handleRegenerateAstrologyWithEdit = async (record: InviteCode) => {
    if (!record.user_profiles_id || !record.user_name) {
      message.error('该兑换码没有绑定用户信息或缺少用户资料ID')
      return
    }

    // 获取用户详细信息
    const userProfile = await fetchUserProfile(record.user_profiles_id)
    if (!userProfile) {
      return
    }

    // 设置编辑状态并打开弹窗
    setCurrentEditRecord(record)
    setEditingUserProfile(userProfile)
    setUserEditModalVisible(true)
  }

  // 确认更新用户信息并重新生成八字报告
  const handleConfirmUpdateAndRegenerate = async () => {
    if (!editingUserProfile || !currentEditRecord) {
      return
    }

    // 1. 先更新用户信息
    const updateSuccess = await updateUserProfile(editingUserProfile)
    if (!updateSuccess) {
      return
    }

    // 2. 重新生成八字报告
    setUserEditModalVisible(false)
    
    const loadingKey = `astrology_${currentEditRecord.id}`
    setRegenerateLoading(loadingKey)
    
    try {
      const response = await fetch(`/api/admin/regenerate-reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reportType: 'astrology',
          userProfileId: currentEditRecord.user_profiles_id,
          singleUser: true,
          adminToken: localStorage.getItem('admin_token')
        })
      })

      const result = await response.json()
      
      if (result.success) {
        message.success(`为用户 ${currentEditRecord.user_name} 重新生成八字排盘报告已启动`)
      } else {
        message.error(result.error || '重新生成失败')
      }
    } catch (error) {
      devLog.error('重新生成报告失败:', error)
      message.error('重新生成失败，请重试')
    } finally {
      setRegenerateLoading('')
      // 清理状态
      setEditingUserProfile(null)
      setCurrentEditRecord(null)
      setAreaInfo(null)
      setAreaSelectValue({})
    }
  }

  const handleRegenerateReportForUser = async (record: InviteCode, reportType: string) => {
    if (!record.user_profiles_id || !record.user_name) {
      message.error('该兑换码没有绑定用户信息或缺少用户资料ID')
      return
    }

    Modal.confirm({
      title: '确认重新生成报告',
      content: `确定要为用户 ${record.user_name} (${record.user_phone || '未知手机号'}) 重新生成${getReportDisplayName(reportType)}报告吗？此操作将删除现有报告并生成新的报告，不可撤销。`,
      okText: '确定重新生成',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        const loadingKey = `${reportType}_${record.id}`
        setRegenerateLoading(loadingKey)
        try {
          const response = await fetch(`/api/admin/regenerate-reports`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              reportType,
              userProfileId: record.user_profiles_id, // 使用精确的用户资料ID
              singleUser: true,
              adminToken: localStorage.getItem('admin_token')
            })
          })

          const result = await response.json()
          
          if (result.success) {
            message.success(`为用户 ${record.user_name} 重新生成${getReportDisplayName(reportType)}报告已启动`)
          } else {
            message.error(result.error || '重新生成失败')
          }
        } catch (error) {
          devLog.error('重新生成报告失败:', error)
          message.error('重新生成失败，请重试')
        } finally {
          setRegenerateLoading('')
        }
      }
    })
  }

  const getReportDisplayName = (reportType: string) => {
    const names: Record<string, string> = {
      astrology: '八字排盘',
      personality: '性格内观',
      wealth: '事业财富',
      marriage: '婚恋感情',
      health: '身体健康'
    }
    return names[reportType] || reportType
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
      render: (tokens: number, record: InviteCode) => {
        // 已激活用户：显示 user_profiles.chat_remaining_count
        if (record.user_phone && record.remaining_tokens !== null && record.remaining_tokens !== undefined) {
          return (
            <span className="text-blue-600 font-medium">
              {record.remaining_tokens} <small className="text-gray-500">(已激活)</small>
            </span>
          )
        }
        // 未激活用户：显示 invite_codes.chat_total_count
        if (!record.user_phone && record.chat_total_count !== null && record.chat_total_count !== undefined) {
          return (
            <span className="text-orange-600 font-medium">
              {record.chat_total_count} <small className="text-gray-500">(预设)</small>
            </span>
          )
        }
        return '-'
      }
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
      title: '最新验证码',
      dataIndex: 'latest_verification_code',
      key: 'latest_verification_code',
      render: (code: string) => {
        if (!code) return '-'
        return (
          <Space>
            <code className="bg-yellow-100 px-2 py-1 rounded font-mono text-sm text-yellow-800">
              {code}
            </code>
            <Button 
              size="small" 
              icon={<CopyOutlined />} 
              onClick={() => handleCopyCode(code)}
            />
          </Space>
        )
      }
    },
    {
      title: '验证码过期时间',
      dataIndex: 'verification_code_expires_at',
      key: 'verification_code_expires_at',
      render: (date: string) => {
        if (!date) return '-'
        
        const expireTime = new Date(date)
        const now = new Date()
        const isExpired = now > expireTime
        
        return (
          <div>
            <div className={isExpired ? 'text-red-500' : 'text-green-600'}>
              {expireTime.toLocaleString('zh-CN')}
            </div>
            <Tag color={isExpired ? 'red' : 'green'}>
              {isExpired ? '已过期' : '有效'}
            </Tag>
          </div>
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
      width: 400,
      render: (_: any, record: InviteCode) => (
        <Space wrap>
          <Button 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => handleEditCode(record)}
          >
            修改
          </Button>
          <Popconfirm
            title={
              <div>
                <div>确定删除这个兑换码吗？</div>
                {record.status === 'used' && record.user_name && (
                  <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>
                    ⚠️ 此操作将同时删除用户 &quot;{record.user_name}&quot; 的所有数据（个人资料、报告、对话记录等），且不可恢复！
                  </div>
                )}
              </div>
            }
            onConfirm={() => handleDeleteCode(record.id, record)}
            okText="确定"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button 
              size="small" 
              danger 
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
          
          {/* 报告重新生成按钮 - 只有已使用的兑换码且有用户资料ID才显示 */}
          {record.status === 'used' && record.user_profiles_id && (
            <>
              <Button
                size="small"
                type="primary"
                loading={regenerateLoading === `astrology_${record.id}`}
                disabled={regenerateLoading !== ''}
                onClick={() => handleRegenerateAstrologyWithEdit(record)}
                title="重新生成八字排盘（可编辑出生信息）"
              >
                ☯️
              </Button>
              
              <Button
                size="small"
                type="primary"
                loading={regenerateLoading === `personality_${record.id}`}
                disabled={regenerateLoading !== ''}
                onClick={() => handleRegenerateReportForUser(record, 'personality')}
                title="重新生成性格内观"
              >
                🧠
              </Button>
              
              <Button
                size="small"
                type="primary"
                loading={regenerateLoading === `wealth_${record.id}`}
                disabled={regenerateLoading !== ''}
                onClick={() => handleRegenerateReportForUser(record, 'wealth')}
                title="重新生成事业财富"
              >
                💰
              </Button>
              
              <Button
                size="small"
                type="primary"
                loading={regenerateLoading === `marriage_${record.id}`}
                disabled={regenerateLoading !== ''}
                onClick={() => handleRegenerateReportForUser(record, 'marriage')}
                title="重新生成婚恋感情"
              >
                💕
              </Button>
              
              <Button
                size="small"
                type="primary"
                loading={regenerateLoading === `health_${record.id}`}
                disabled={regenerateLoading !== ''}
                onClick={() => handleRegenerateReportForUser(record, 'health')}
                title="重新生成身体健康"
              >
                🏥
              </Button>
            </>
          )}
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
              <div className="text-2xl font-bold text-blue-600">
                {pagination.total}
              </div>
              <div className="text-sm text-gray-600">
                {searchText ? `搜索结果 (共${pagination.total}条)` : '总兑换码'}
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {codes.filter(c => c.status === 'active').length}
              </div>
              <div className="text-sm text-gray-600">未使用 (当前页)</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-500">
                {codes.filter(c => c.status === 'used').length}
              </div>
              <div className="text-sm text-gray-600">已使用 (当前页)</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-500">
                {codes.filter(c => c.status === 'expired').length}
              </div>
              <div className="text-sm text-gray-600">已过期 (当前页)</div>
            </div>
          </div>
          
          {/* 用户信息统计 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-lg font-semibold text-purple-600">
                {codes.filter(c => c.user_phone).length}
              </div>
              <div className="text-sm text-gray-600">已绑定用户 (当前页)</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-lg font-semibold text-orange-600">
                {codes.filter(c => c.user_role === 'vip_user').length}
              </div>
              <div className="text-sm text-gray-600">VIP用户 (当前页)</div>
            </div>
            <div className="text-center p-3 bg-cyan-50 rounded-lg">
              <div className="text-lg font-semibold text-cyan-600">
                {codes.reduce((sum, c) => {
                  // 已激活用户使用 remaining_tokens，未激活用户使用 chat_total_count
                  if (c.user_phone) {
                    return sum + (c.remaining_tokens || 0)
                  } else {
                    return sum + (c.chat_total_count || 0)
                  }
                }, 0)}
              </div>
              <div className="text-sm text-gray-600">剩余对话次数 (当前页)</div>
            </div>
          </div>
          
          {/* 验证码统计 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-lg font-semibold text-yellow-600">
                {codes.filter(c => c.latest_verification_code).length}
              </div>
              <div className="text-sm text-gray-600">有验证码的用户 (当前页)</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-lg font-semibold text-red-600">
                {codes.filter(c => {
                  if (!c.verification_code_expires_at) return false
                  return new Date() > new Date(c.verification_code_expires_at)
                }).length}
              </div>
              <div className="text-sm text-gray-600">验证码已过期 (当前页)</div>
            </div>
          </div>
        </Card>

        {/* 兑换码管理表格 */}
        <Card 
          title="兑换码列表" 
          extra={
            <Space>
              <Input
                placeholder="搜索手机号或用户名称"
                prefix={searchLoading ? <div className="animate-spin text-blue-500">🔄</div> : <SearchOutlined />}
                value={searchText}
                onChange={handleSearchChange}
                onClear={handleSearchClear}
                onPressEnter={handleSearchEnter}
                style={{ width: 250 }}
                allowClear
              />
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setModalVisible(true)}
              >
                生成兑换码
              </Button>
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={codes}
            rowKey="id"
            loading={loading}
            onChange={handleTableChange}
            pagination={{
              current: pagination.page,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `第 ${range[0]}-${range[1]} 条 / 共 ${total} 条${searchText ? ` (搜索: "${searchText}")` : ''}`,
              pageSizeOptions: ['10', '20', '50', '100'],
              size: 'default',
              showLessItems: true
            }}
            scroll={{ x: 2200 }}
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
                 {/* 用户激活状态说明 */}
                 <div className="mb-4 p-3 rounded-md bg-gray-50">
                   <p className="text-sm text-gray-600">
                     {editingCode.user_phone ? (
                       <>
                         <span className="text-green-600 font-medium">✓ 已激活用户</span> - 可修改用户的所有信息
                       </>
                     ) : (
                       <>
                         <span className="text-orange-600 font-medium">⚠ 未激活用户</span> - 只能预设用户角色权限
                       </>
                     )}
                   </p>
                 </div>
                 
                 {/* 对话次数编辑 - 所有状态都可编辑 */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     {editingCode.user_phone ? '剩余对话次数' : '预设对话次数'}
                   </label>
                   <InputNumber
                     value={editRemainingTokens}
                     onChange={(value) => setEditRemainingTokens(value || 0)}
                     min={0}
                     max={999}
                     className="w-full"
                     placeholder={editingCode.user_phone ? "输入剩余对话次数" : "输入预设对话次数"}
                   />
                   <p className="text-xs text-gray-500 mt-1">
                     {editingCode.user_phone ? 
                       '修改已激活用户的当前剩余对话次数' : 
                       '设置兑换码激活后用户的初始对话次数'
                     }
                   </p>
                 </div>
                 
                 {/* 已激活用户信息 */}
                 {editingCode.user_phone && (
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       使用用户
                     </label>
                     <p className="text-gray-600">
                       {editingCode.user_name} ({editingCode.user_phone})
                     </p>
                   </div>
                 )}
                 
                 {/* 用户角色 - 所有状态都可修改 */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     用户角色 {editingCode.user_phone ? '(已激活用户角色)' : '(预设角色权限)'}
                   </label>
                   <Select
                     value={editUserRole}
                     onChange={(value) => {
                       setEditUserRole(value)
                       // 角色联动：VIP用户默认50次对话，基础用户默认2次
                       if (value === 'vip_user') {
                         setEditRemainingTokens(50)
                       } else if (value === 'basic_user') {
                         setEditRemainingTokens(2)
                       }
                     }}
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
                   <p className="text-xs text-gray-500 mt-1">
                     {editingCode.user_phone ? 
                       '修改后将更新用户资料中的角色信息' : 
                       '设置兑换码激活后的默认角色权限'
                     }
                   </p>
                   {!editingCode.user_phone && (
                     <p className="text-xs text-blue-500 mt-1">
                       💡 提示：VIP用户默认50次对话，基础用户默认2次对话
                     </p>
                   )}
                 </div>
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

        {/* 用户信息编辑Modal */}
        <Modal
          title={`编辑用户出生信息 - ${currentEditRecord?.user_name || ''}`}
          open={userEditModalVisible}
          onOk={handleConfirmUpdateAndRegenerate}
          onCancel={() => {
            setUserEditModalVisible(false)
            setEditingUserProfile(null)
            setCurrentEditRecord(null)
            setAreaInfo(null)
            setAreaSelectValue({})
          }}
          confirmLoading={userProfileLoading || regenerateLoading !== ''}
          okText="更新并重新生成八字报告"
          cancelText="取消"
          width={600}
          maskClosable={false}
        >
          {editingUserProfile && (
            <div className="space-y-4">
              <div className="mb-4 p-3 rounded-md bg-blue-50">
                <p className="text-sm text-blue-600">
                  📝 <strong>编辑说明：</strong>修改用户的出生信息和地址信息后，系统将自动重新生成八字排盘报告。
                </p>
              </div>
              
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    姓名
                  </label>
                  <Input
                    value={editingUserProfile.name}
                    onChange={(e) => setEditingUserProfile(prev => prev ? {...prev, name: e.target.value} : null)}
                    placeholder="请输入姓名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    性别
                  </label>
                  <Select
                    value={editingUserProfile.gender}
                    onChange={(value) => setEditingUserProfile(prev => prev ? {...prev, gender: value} : null)}
                    className="w-full"
                    placeholder="选择性别"
                  >
                    <Select.Option value="male">男</Select.Option>
                    <Select.Option value="female">女</Select.Option>
                  </Select>
                </div>
              </div>
              
              {/* 出生时间 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  出生时间
                </label>
                <div className="grid grid-cols-5 gap-2">
                  <InputNumber
                    value={editingUserProfile.year}
                    onChange={(value) => setEditingUserProfile(prev => prev ? {...prev, year: value || new Date().getFullYear()} : null)}
                    placeholder="年"
                    min={1900}
                    max={2030}
                    className="w-full"
                  />
                  <InputNumber
                    value={editingUserProfile.month}
                    onChange={(value) => setEditingUserProfile(prev => prev ? {...prev, month: value || 1} : null)}
                    placeholder="月"
                    min={1}
                    max={12}
                    className="w-full"
                  />
                  <InputNumber
                    value={editingUserProfile.day}
                    onChange={(value) => setEditingUserProfile(prev => prev ? {...prev, day: value || 1} : null)}
                    placeholder="日"
                    min={1}
                    max={31}
                    className="w-full"
                  />
                  <InputNumber
                    value={editingUserProfile.hour}
                    onChange={(value) => setEditingUserProfile(prev => prev ? {...prev, hour: value || 0} : null)}
                    placeholder="时"
                    min={0}
                    max={23}
                    className="w-full"
                  />
                  <InputNumber
                    value={editingUserProfile.minute}
                    onChange={(value) => setEditingUserProfile(prev => prev ? {...prev, minute: value || 0} : null)}
                    placeholder="分"
                    min={0}
                    max={59}
                    className="w-full"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  格式：年-月-日 时:分（例：1990-05-15 14:30）
                </p>
              </div>
              
              {/* 地址信息 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  出生地点
                </label>
                
                {/* 当前地区信息显示 */}
                {areaInfo && (
                  <div className="mb-3 p-2 bg-blue-50 rounded-md">
                    <p className="text-sm text-blue-700">
                      <strong>当前地区：</strong>
                      {areaInfo.provinceName} {areaInfo.cityName} {areaInfo.districtName}
                    </p>
                    <p className="text-xs text-blue-500 mt-1">
                      📝 使用下方地区选择器可修改地区信息
                    </p>
                  </div>
                )}
                
                {/* 地区选择器 */}
                <SimpleAreaSelector
                  value={areaSelectValue}
                  onChange={(value) => {
                    setAreaSelectValue(value)
                    devLog.log('🌍 地区选择更新:', value)
                  }}
                  placeholder={{
                    province: '选择省份',
                    city: '选择城市', 
                    district: '选择区/县'
                  }}
                  size="middle"
                />
                
                <p className="text-xs text-gray-500 mt-2">
                  请选择具体的出生地点，影响八字排盘的精准度。如不修改则保持原地区信息。
                </p>
              </div>
              
              {/* 当前信息展示 */}
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600 mb-2">信息预览：</p>
                <p className="text-sm">
                  <strong>姓名：</strong>{editingUserProfile.name}  
                  <strong>性别：</strong>{editingUserProfile.gender === 'male' ? '男' : '女'}  
                  <strong>手机：</strong>{editingUserProfile.users?.phone_number || '未知'}
                </p>
                <p className="text-sm">
                  <strong>出生：</strong>
                  {editingUserProfile.year}-{String(editingUserProfile.month).padStart(2, '0')}-{String(editingUserProfile.day).padStart(2, '0')} 
                  {String(editingUserProfile.hour).padStart(2, '0')}:{String(editingUserProfile.minute).padStart(2, '0')}
                </p>
                <p className="text-sm">
                  <strong>地点：</strong>
                  {areaInfo ? 
                    `${areaInfo.provinceName} ${areaInfo.cityName} ${areaInfo.districtName}` : 
                    `${editingUserProfile.area_province} ${editingUserProfile.area_city} ${editingUserProfile.area_district}`
                  }
                  {areaSelectValue.province && (
                    <span className="text-orange-600 ml-2">(将更新为新选择的地区)</span>
                  )}
                </p>
              </div>
            </div>
          )}
        </Modal>
      </Content>
    </Layout>
  )
} 