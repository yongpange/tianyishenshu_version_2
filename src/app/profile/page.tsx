'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Steps,
  Progress,
  message,
  Skeleton,
  Modal,
  Row,
  Col
} from 'antd'
import { CheckCircleFilled, LoadingOutlined, CalendarOutlined } from '@ant-design/icons'

// 动态导入地区选择器，避免 SSR 问题
const AreaSelector = dynamic(
  () => import('@/components/SimpleAreaSelector'),
  { 
    ssr: false,
    loading: () => <Skeleton.Input active style={{ width: '100%', height: 40 }} />
  }
)

const { Option } = Select

// 统一验证模式（手机号都是可选的）
const profileSchema = z.object({
  nickname: z.string().min(1, '请输入昵称').max(20, '昵称不能超过20个字符'),
  gender: z.enum(['男', '女'], { errorMap: () => ({ message: '请选择性别' }) }),
  year: z.number().min(1900, '年份不能早于1900年').max(2024, '年份不能晚于2024年'),
  month: z.number().min(1, '月份必须在1-12之间').max(12, '月份必须在1-12之间'),
  day: z.number().min(1, '日期必须在1-31之间').max(31, '日期必须在1-31之间'),
  hour: z.number().min(0, '小时必须在0-23之间').max(23, '小时必须在0-23之间'),
  minute: z.number().min(0, '分钟必须在0-59之间').max(59, '分钟必须在0-59之间'),
  area: z.object({
    province: z.string().min(1, '请选择省份'),
    city: z.string().min(1, '请选择城市'),
    district: z.string().min(1, '请选择区县')
  })
})

type ProfileFormData = z.infer<typeof profileSchema>

// 生成步骤
enum GenerationStep {
  IDLE = 0,
  ANALYZING = 1,
  GENERATING = 2,
  SAVING = 3,
  COMPLETED = 4
}

const stepMessages = {
  [GenerationStep.IDLE]: '',
  [GenerationStep.ANALYZING]: '正在分析出生信息...',
  [GenerationStep.GENERATING]: '正在生成性格报告...',
  [GenerationStep.SAVING]: '正在保存报告...',
  [GenerationStep.COMPLETED]: '报告生成完成，即将跳转...'
}

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [generationStep, setGenerationStep] = useState(GenerationStep.IDLE)
  const [progress, setProgress] = useState(0)
  const [showProgress, setShowProgress] = useState(false)
  const [showLunarModal, setShowLunarModal] = useState(false)
  const [isAddingNewUser, setIsAddingNewUser] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [lunarDate, setLunarDate] = useState({
    year: undefined as number | undefined,
    month: undefined as number | undefined,
    day: undefined as number | undefined,
    isLeap: false
  })

  // React Hook Form 配置
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
    defaultValues: {
      nickname: '',
      gender: '男' as '男' | '女',
      year: 2000,
      month: 1,
      day: 1,
      hour: 0,
      minute: 0,
      area: {
        province: '',
        city: '',
        district: ''
      }
    }
  })

  // 监听表单变化
  const watchedValues = watch()

  // 页面加载时检查登录状态并预填用户信息
  useEffect(() => {
    let isInitialized = false
    
    const initializeProfile = () => {
      if (isInitialized) return
      isInitialized = true
      
      try {
        console.log('🎯 Profile页面初始化开始')
        
        // 检查是否是新增用户模式
        const isNewUserMode = sessionStorage.getItem('is_adding_new_user') === 'true'
        const verifiedCode = sessionStorage.getItem('verified_invite_code')
        
        if (isNewUserMode) {
          if (!verifiedCode) {
            message.error('请先验证兑换码')
            router.push('/add-user/verify-code')
            return
          }
          setIsAddingNewUser(true)
          setInviteCode(verifiedCode)
          
          // 新增用户模式，重置表单为空白状态
          setValue('nickname', '')
          setValue('gender', '男' as '男' | '女')
          setValue('area', { province: '', city: '', district: '' })
          
          message.info('新增用户模式：请填写用户信息')
          return
        }
        
        // 原有的登录用户逻辑
        const loginData = localStorage.getItem('loginData')
        if (!loginData) {
          message.error('请先登录')
          router.push('/login')
          return
        }

        // 检查登录数据中是否包含用户资料
        const parsed = JSON.parse(loginData)
        console.log('🔍 登录数据解析结果:', {
          hasUser: !!parsed.user,
          hasProfileData: !!parsed.user?.profile_data,
          redirectTo: parsed.user?.redirect_to,
          user: parsed.user
        })
        
        const userProfileData = parsed.user?.profile_data

        if (userProfileData) {
          console.log('📋 发现已有用户资料，直接预填:', userProfileData)

          // 直接使用登录时获取的用户资料预填表单
          setValue('nickname', userProfileData.name || '')
          setValue('gender', userProfileData.gender === 'male' ? '男' : userProfileData.gender === 'female' ? '女' : '男')
          setValue('year', userProfileData.year || 2000)
          setValue('month', userProfileData.month || 1)
          setValue('day', userProfileData.day || 1)
          setValue('hour', userProfileData.hour || 0)
          setValue('minute', userProfileData.minute || 0)

          if (userProfileData.area) {
            setValue('area', {
              province: userProfileData.area.province || '',
              city: userProfileData.area.city || '',
              district: userProfileData.area.district || ''
            })
          }

          message.info('已加载您的资料信息')
        } else {
          // 如果登录数据中没有资料，检查是否有localStorage数据
          const savedData = localStorage.getItem('userData')
          if (savedData) {
            try {
              const userData = JSON.parse(savedData)
              console.log('📋 发现localStorage中的数据，询问是否使用:', userData)

                             // 直接使用localStorage中的数据，安全地设置表单值
               if (userData.nickname && typeof userData.nickname === 'string') {
                 setValue('nickname', userData.nickname)
               }
               if (userData.gender && (userData.gender === '男' || userData.gender === '女')) {
                 setValue('gender', userData.gender)
               }
               if (userData.year && typeof userData.year === 'number') {
                 setValue('year', userData.year)
               }
               if (userData.month && typeof userData.month === 'number') {
                 setValue('month', userData.month)
               }
               if (userData.day && typeof userData.day === 'number') {
                 setValue('day', userData.day)
               }
               if (userData.hour && typeof userData.hour === 'number') {
                 setValue('hour', userData.hour)
               }
               if (userData.minute && typeof userData.minute === 'number') {
                 setValue('minute', userData.minute)
               }
               if (userData.area && typeof userData.area === 'object') {
                 setValue('area', userData.area as { province: string; city: string; district: string })
               }
              message.info('已恢复您的填写记录')
            } catch (error) {
              console.error('加载保存的数据失败:', error)
              localStorage.removeItem('userData')
            }
          } else {
            console.log('📋 没有发现已有数据，使用默认值')
            console.log('💡 提示：如果您已有个人信息但被重定向到此页面，请检查数据库中的 user_profiles 表')
          }
        }
      } catch (error) {
        console.error('检查登录状态失败:', error)
      }
    }
    
    // 延迟执行避免重复初始化
    const timer = setTimeout(initializeProfile, 100)
    return () => clearTimeout(timer)
  }, [])

  // 获取当前登录用户信息
  const getCurrentUser = (): { phoneNumber: string; userId?: string } | null => {
    try {
      const loginData = localStorage.getItem('loginData')
      if (loginData) {
        const parsed = JSON.parse(loginData)
        return {
          phoneNumber: parsed.phoneNumber || null,
          userId: parsed.user?.id || null
        }
      }
      return null
    } catch {
      return null
    }
  }

  // 处理地区变化
  const handleAreaChange = (value: any) => {
    setValue('area', value, { shouldValidate: true })
  }

  // 农历转阳历
  const convertLunarToSolar = () => {
    if (!lunarDate.year || !lunarDate.month || !lunarDate.day) {
      message.error('请完整填写农历日期')
      return
    }

    try {
      // 使用农历转换库
      const { Lunar, Solar } = require('lunar-javascript')
      const lunar = Lunar.fromYmd(lunarDate.year, lunarDate.month, lunarDate.day)
      const solar = lunar.getSolar()

      // 更新表单值
      setValue('year', solar.getYear(), { shouldValidate: true })
      setValue('month', solar.getMonth(), { shouldValidate: true })
      setValue('day', solar.getDay(), { shouldValidate: true })

      message.success(`农历${lunarDate.year}年${lunarDate.month}月${lunarDate.day}日 转换为 阳历${solar.getYear()}年${solar.getMonth()}月${solar.getDay()}日`)
      setShowLunarModal(false)

      // 重置农历日期
      setLunarDate({
        year: undefined,
        month: undefined,
        day: undefined,
        isLeap: false
      })
    } catch (error) {
      console.error('农历转换失败:', error)
      message.error('农历转换失败，请检查日期是否正确')
    }
  }

  // 更新进度状态的辅助函数
  const updateProgressStep = (step: GenerationStep, progress: number) => {
    setGenerationStep(step)
    setProgress(progress)
  }

  // 表单提交
  const onSubmit = async (data: ProfileFormData) => {
    try {
      setLoading(true)
      setShowProgress(true)

      // 第一阶段：验证和准备数据 (0-20%)
      updateProgressStep(GenerationStep.ANALYZING, 10)

      const currentUser = getCurrentUser()
      if (!currentUser) {
        message.error('未找到登录信息，请重新登录')
        router.push('/login')
        return
      }

      // 新增用户模式：不需要注册新账户，直接保存到当前用户下
      if (isAddingNewUser) {
        if (!inviteCode) {
          message.error('缺少兑换码信息，请重新验证')
          router.push('/add-user/verify-code')
          return
        }
        console.log('🔧 新增用户：将用户资料保存到当前登录用户下')
      }

      console.log('📝 提交表单数据:', data)

      // 保存到 localStorage (仅普通用户模式)
      if (!isAddingNewUser) {
        localStorage.setItem('userData', JSON.stringify(data))
      }
      updateProgressStep(GenerationStep.ANALYZING, 20)

      // 转换为 UserInfo 格式
      const userInfo = {
        name: data.nickname,
        gender: data.gender === '男' ? 'male' : data.gender === '女' ? 'female' : data.gender,
        year: data.year,
        month: data.month,
        day: data.day,
        hour: data.hour,
        minute: data.minute,
        area: data.area
      }

      // 第二阶段：保存用户资料 (20-60%)
      updateProgressStep(GenerationStep.SAVING, 30)

      console.log('💾 保存用户资料...')
      const saveResponse = await fetch('/api/user-profile/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: currentUser.phoneNumber,
          userInfo,
          isAddingNewUser: isAddingNewUser,
          targetUserId: isAddingNewUser ? currentUser.userId : undefined,
          inviteCode: isAddingNewUser ? inviteCode : undefined
        })
      })

      const saveResult = await saveResponse.json()
      if (!saveResponse.ok) {
        throw new Error(saveResult.message || '保存用户资料失败')
      }

      console.log('✅ 用户资料保存成功:', saveResult.profile)
      updateProgressStep(GenerationStep.SAVING, 60)

      // 第三阶段：启动异步报告生成 (60-90%)
      updateProgressStep(GenerationStep.GENERATING, 70)

      console.log('🚀 启动异步报告生成...')
      
      // 根据用户模式决定使用哪个用户标识符
      let reportUserId: string
      if (isAddingNewUser) {
        // 新增用户模式：使用新创建的user_profiles.id
        reportUserId = saveResult.profile.id
        console.log('📋 新增用户模式：使用user_profiles.id作为报告用户标识:', reportUserId)
      } else {
        // 普通模式：使用手机号
        reportUserId = currentUser.phoneNumber
        console.log('📋 普通模式：使用手机号作为报告用户标识:', reportUserId)
      }

      const response = await fetch('/api/personality-report/generate-async', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userInfo,
          userId: reportUserId,
          isUserProfileId: isAddingNewUser // 标识使用的是user_profiles.id而不是手机号
        })
      })

      const result = await response.json()
      console.log('📋 异步生成结果:', result)

      if (result.success) {
        updateProgressStep(GenerationStep.GENERATING, 90)

        // 第四阶段：准备跳转 (90-100%)
        updateProgressStep(GenerationStep.COMPLETED, 100)

        // 显示完成状态
        await new Promise(resolve => setTimeout(resolve, 800))

        if (isAddingNewUser) {
          // 新增用户模式：跳转到dashboard页面
          message.success('子用户创建成功，性格报告正在后台生成...')
          // 清理标记
          sessionStorage.removeItem('verified_invite_code')
          sessionStorage.removeItem('is_adding_new_user')
          router.push('/dashboard')
        } else {
          // 普通用户，跳转到dashboard页面
          message.success('信息保存成功，性格报告正在后台生成...')
          router.push('/dashboard')
        }
      } else {
        throw new Error(result.error || '启动报告生成失败')
      }



    } catch (error) {
      console.error('提交失败:', error)
      message.error(error instanceof Error ? error.message : '保存失败，请重试')
      setShowProgress(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <Card
        className="w-full max-w-4xl shadow-lg"
      >
        {/* 头部 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-sm font-bold">天</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 m-0">天乙神算</h1>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            {isAddingNewUser ? '新增用户信息' : '完善您的个人信息'}
          </h2>
          <p className="text-gray-500">
            {isAddingNewUser ? '请填写新用户的详细信息' : '提高详细信息，获取精准生辰分析'}
          </p>
          
          {isAddingNewUser && (
            <div className="mt-2 text-sm text-blue-600">
              兑换码: {inviteCode}
            </div>
          )}

          {/* 步骤指示器 */}
          <div className="mt-6">
            <Steps
              current={1}
              size="small"
              items={[
                { title: '身份验证', icon: <CheckCircleFilled className="text-green-500" /> },
                { title: '完善信息', icon: loading ? <LoadingOutlined /> : undefined },
                { title: '查看报告' }
              ]}
            />
          </div>
        </div>

        {/* 表单 */}
        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 昵称 */}
            <Form.Item 
              label="昵称" 
              validateStatus={errors.nickname ? 'error' : ''}
              help={errors.nickname?.message}
              required
            >
              <Controller
                name="nickname"
                control={control}
                render={({ field }) => (
                  <Input 
                    {...field}
                    placeholder="请输入您的昵称"
                    size="large"
                  />
                )}
              />
            </Form.Item>

            {/* 性别 */}
            <Form.Item 
              label="性别" 
              validateStatus={errors.gender ? 'error' : ''}
              help={errors.gender?.message}
              required
            >
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <Select 
                    {...field}
                    placeholder="请选择性别"
                    size="large"
                  >
                    <Option value="男">男</Option>
                    <Option value="女">女</Option>
                  </Select>
                )}
              />
            </Form.Item>
          </div>



          {/* 出生日期时间 */}
          <Form.Item label="出生日期时间" required>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">请选择阳历出生日期时间</span>
              <Button
                type="link"
                icon={<CalendarOutlined />}
                onClick={() => setShowLunarModal(true)}
                className="text-blue-600 hover:text-blue-700"
              >
                农历转换成阳历
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Controller
                name="year"
                control={control}
                render={({ field }) => (
                  <Select 
                    {...field}
                    placeholder="年份"
                    size="large"
                    showSearch
                    status={errors.year ? 'error' : ''}
                  >
                    {Array.from({ length: 125 }, (_, i) => 2024 - i).map(year => (
                      <Option key={year} value={year}>{year}年</Option>
                    ))}
                  </Select>
                )}
              />
              
              <Controller
                name="month"
                control={control}
                render={({ field }) => (
                  <Select 
                    {...field}
                    placeholder="月份"
                    size="large"
                    status={errors.month ? 'error' : ''}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <Option key={month} value={month}>{month}月</Option>
                    ))}
                  </Select>
                )}
              />

              <Controller
                name="day"
                control={control}
                render={({ field }) => (
                  <Select 
                    {...field}
                    placeholder="日期"
                    size="large"
                    status={errors.day ? 'error' : ''}
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <Option key={day} value={day}>{day}日</Option>
                    ))}
                  </Select>
                )}
              />

              <Controller
                name="hour"
                control={control}
                render={({ field }) => (
                  <Select 
                    {...field}
                    placeholder="小时"
                    size="large"
                    status={errors.hour ? 'error' : ''}
                  >
                    {Array.from({ length: 24 }, (_, i) => i).map(hour => (
                      <Option key={hour} value={hour}>{hour}时</Option>
                    ))}
                  </Select>
                )}
              />

              <Controller
                name="minute"
                control={control}
                render={({ field }) => (
                  <Select 
                    {...field}
                    placeholder="分钟"
                    size="large"
                    status={errors.minute ? 'error' : ''}
                  >
                    {Array.from({ length: 60 }, (_, i) => i).map(minute => (
                      <Option key={minute} value={minute}>{minute.toString().padStart(2, '0')}分</Option>
                    ))}
                  </Select>
                )}
              />
            </div>
            {(errors.year || errors.month || errors.day || errors.hour || errors.minute) && (
              <div className="text-red-500 text-sm mt-1">请完整填写出生日期时间</div>
            )}
          </Form.Item>

          {/* 出生地区 */}
          <Form.Item 
            label="出生地区" 
            validateStatus={errors.area ? 'error' : ''}
            help={errors.area?.province?.message || errors.area?.city?.message || errors.area?.district?.message}
            required
          >
            <AreaSelector
              value={watchedValues.area}
              onChange={handleAreaChange}
              placeholder="请选择出生地区"
            />
          </Form.Item>

          {/* 提交按钮 */}
          <div className="flex gap-4 mt-8">
            <Button
              size="large"
              className="flex-1"
              onClick={() => router.back()}
            >
              返回
            </Button>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              loading={loading}
              disabled={!isValid}
              className="flex-1 bg-black hover:bg-gray-800 border-black"
            >
              保存并继续
            </Button>
          </div>
        </Form>

        {/* 进度弹窗 */}
        {showProgress && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-80">
              <div className="text-center">
                <div className="mb-4">
                  <LoadingOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                </div>
                <h3 className="text-lg font-semibold mb-2">正在生成性格报告</h3>
                <p className="text-gray-600 mb-4">{stepMessages[generationStep]}</p>

                {/* 预计等候时间提示 */}
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 font-medium text-sm">
                    性格报告正在生成，预计等候3分钟
                  </p>
                </div>

                <Progress percent={progress} strokeColor="#1890ff" />
              </div>
            </Card>
          </div>
        )}

        {/* 农历转换模态框 */}
        <Modal
          title="农历转阳历"
          open={showLunarModal}
          onOk={convertLunarToSolar}
          onCancel={() => setShowLunarModal(false)}
          okText="转换"
          cancelText="取消"
          width={500}
        >
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              请输入农历日期，系统将自动转换为对应的阳历日期
            </div>

            <Row gutter={16}>
              <Col span={8}>
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700">农历年份</label>
                </div>
                <Select
                  placeholder="选择年份"
                  value={lunarDate.year}
                  onChange={(value) => setLunarDate(prev => ({ ...prev, year: value }))}
                  style={{ width: '100%' }}
                  showSearch
                >
                  {Array.from({ length: 125 }, (_, i) => 2024 - i).map(year => (
                    <Select.Option key={year} value={year}>{year}年</Select.Option>
                  ))}
                </Select>
              </Col>

              <Col span={8}>
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700">农历月份</label>
                </div>
                <Select
                  placeholder="选择月份"
                  value={lunarDate.month}
                  onChange={(value) => setLunarDate(prev => ({ ...prev, month: value }))}
                  style={{ width: '100%' }}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <Select.Option key={month} value={month}>{month}月</Select.Option>
                  ))}
                </Select>
              </Col>

              <Col span={8}>
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700">农历日期</label>
                </div>
                <Select
                  placeholder="选择日期"
                  value={lunarDate.day}
                  onChange={(value) => setLunarDate(prev => ({ ...prev, day: value }))}
                  style={{ width: '100%' }}
                >
                  {Array.from({ length: 30 }, (_, i) => i + 1).map(day => (
                    <Select.Option key={day} value={day}>{day}日</Select.Option>
                  ))}
                </Select>
              </Col>
            </Row>

            <div className="text-xs text-gray-500 mt-4">
              <p>• 农历转阳历功能基于中国传统历法计算</p>
              <p>• 转换结果将自动填入上方的出生日期字段</p>
              <p>• 如遇闰月等特殊情况，请咨询专业人士</p>
            </div>
          </div>
        </Modal>
      </Card>
    </div>
  )
}
