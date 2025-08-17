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
  Col,
  Checkbox
} from 'antd'
import { CheckCircleFilled, LoadingOutlined, CalendarOutlined } from '@ant-design/icons'
import { devLog } from '@/utils/dev-logger'

// 动态导入地区选择器，避免 SSR 问题
const AreaSelector = dynamic(
  () => import('@/components/SimpleAreaSelector'),
  { 
    ssr: false,
    loading: () => <Skeleton.Input active style={{ width: '100%', height: 40 }} />
  }
)

const { Option } = Select

// 统一验证模式
const profileSchema = z.object({
  nickname: z.string().min(1, '请输入昵称').max(20, '昵称不能超过20个字符'),
  gender: z.enum(['男', '女'], { errorMap: () => ({ message: '请选择性别' }) }),
  year: z.number().min(1900, '年份不能早于1900年').max(2025, '年份不能晚于2025年'),
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

interface AddUserProfilePageProps {
  onSuccess?: (newUser: any) => void
  onCancel?: () => void
}

export default function AddUserProfilePage({ onSuccess, onCancel }: AddUserProfilePageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [generationStep, setGenerationStep] = useState(GenerationStep.IDLE)
  const [progress, setProgress] = useState(0)
  const [showProgress, setShowProgress] = useState(false)
  const [showLunarModal, setShowLunarModal] = useState(false)
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
        province: '',  // 设置默认省份（北京市的编码）
        city: '',     // 设置默认城市（北京市的编码）
        district: ''   // 设置默认区县（东城区的编码）
      }
    }
  })

  // 监听表单变化
  const watchedValues = watch()

  // 页面加载时获取兑换码
  useEffect(() => {
    const verifiedCode = sessionStorage.getItem('verified_invite_code')
    if (!verifiedCode) {
      // message.error('请先验证兑换码')
      onCancel?.()
      return
    }
    setInviteCode(verifiedCode)
  }, [onCancel])

  // 实时验证农历日期和闰月选择
  useEffect(() => {
    // 当年份或月份改变时，检查闰月选择是否还有效
    if (lunarDate.year && lunarDate.month) {
      const leapMonth = getLeapMonthInfo(lunarDate.year)

      // 如果当前选择了闰月，但该月份不是闰月，自动取消闰月选择
      if (lunarDate.isLeap && leapMonth !== lunarDate.month) {
        setLunarDate(prev => ({ ...prev, isLeap: false }))
      }
    }

    // 完整日期验证
    if (lunarDate.year && lunarDate.month && lunarDate.day) {
      const validation = validateLunarDate(lunarDate.year, lunarDate.month, lunarDate.day, lunarDate.isLeap)
      if (!validation.valid && lunarDate.isLeap) {
        // 如果闰月无效，自动取消闰月选择
        setLunarDate(prev => ({ ...prev, isLeap: false }))
      }
    }
  }, [lunarDate.year, lunarDate.month, lunarDate.day, lunarDate.isLeap])

  // 获取当前用户
  const getCurrentUser = (): { phoneNumber: string; userId?: string } | null => {
    try {
      const loginData = localStorage.getItem('loginData')
      if (!loginData) return null
      
      const parsed = JSON.parse(loginData)
      return {
        phoneNumber: parsed.phoneNumber,
        userId: parsed.user?.id
      }
    } catch (error) {
      devLog.error('获取当前用户失败:', error)
      return null
    }
  }

  // 处理地区变化
  const handleAreaChange = (value: any) => {
    setValue('area', value, { shouldValidate: true })
  }

  // 检查某年的闰月情况
  const getLeapMonthInfo = (year: number) => {
    try {
      const { LunarYear } = require('lunar-javascript')
      // 使用 LunarYear 类来检查闰月
      const lunarYear = LunarYear.fromYear(year)
      const leapMonth = lunarYear.getLeapMonth()
      return leapMonth > 0 ? leapMonth : null
    } catch (error) {
      return null
    }
  }

  // 检查当前选择是否应该显示闰月选项
  const shouldShowLeapOption = () => {
    if (!lunarDate.year || !lunarDate.month) return false
    const leapMonth = getLeapMonthInfo(lunarDate.year)
    return leapMonth === lunarDate.month
  }

  // 获取闰月提示信息
  const getLeapMonthHint = () => {
    if (!lunarDate.year) return ''
    const leapMonth = getLeapMonthInfo(lunarDate.year)
    if (leapMonth) {
      return `${lunarDate.year}年闰${leapMonth}月`
    }
    return `${lunarDate.year}年无闰月`
  }

  // 验证农历日期有效性
  const validateLunarDate = (year: number | undefined, month: number | undefined, day: number | undefined, isLeap: boolean) => {
    if (!year || !month || !day) return { valid: false, error: '请完整填写农历日期' }

    // 闰月验证
    if (isLeap) {
      const leapMonth = getLeapMonthInfo(year)
      if (leapMonth !== month) {
        return { valid: false, error: `${year}年没有闰${month}月，该年${leapMonth ? `闰${leapMonth}月` : '无闰月'}` }
      }
    }

    try {
      const { Lunar } = require('lunar-javascript')
      // 使用正确的闰月表示方法：闰月用负数表示
      const monthValue = isLeap ? -month : month
      const lunar = Lunar.fromYmd(year, monthValue, day)
      return { valid: true, lunar }
    } catch (error) {
      return { valid: false, error: '农历日期无效' }
    }
  }

  // 农历转阳历
  const convertLunarToSolar = () => {
    // 验证农历日期
    const validation = validateLunarDate(lunarDate.year, lunarDate.month, lunarDate.day, lunarDate.isLeap)
    if (!validation.valid) {
      message.error(validation.error)
      return
    }

    try {
      // 使用农历转换库，支持闰月
      const { Lunar } = require('lunar-javascript')
      // 使用正确的闰月表示方法：闰月用负数表示
      const monthValue = lunarDate.isLeap ? -lunarDate.month : lunarDate.month
      const lunar = Lunar.fromYmd(lunarDate.year, monthValue, lunarDate.day)
      const solar = lunar.getSolar()

      // 更新表单值
      setValue('year', solar.getYear(), { shouldValidate: true })
      setValue('month', solar.getMonth(), { shouldValidate: true })
      setValue('day', solar.getDay(), { shouldValidate: true })

      const leapText = lunarDate.isLeap ? '闰' : ''
      message.success(`农历${lunarDate.year}年${leapText}${lunarDate.month}月${lunarDate.day}日 转换为 阳历${solar.getYear()}年${solar.getMonth()}月${solar.getDay()}日`)
      setShowLunarModal(false)

      // 重置农历日期
      setLunarDate({
        year: undefined,
        month: undefined,
        day: undefined,
        isLeap: false
      })
    } catch (error) {
      devLog.error('农历转换失败:', error)
      message.error('农历转换失败，请检查日期是否正确')
    }
  }

  // 更新进度
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
        return
      }

      if (!inviteCode) {
        message.error('缺少兑换码信息，请重新验证')
        return
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

      devLog.log('💾 保存用户资料...')
      const saveResponse = await fetch('/api/user-profile/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: currentUser.phoneNumber,
          userInfo,
          isAddingNewUser: true,
          targetUserId: currentUser.userId,
          inviteCode: inviteCode
        })
      })

      const saveResult = await saveResponse.json()
      if (!saveResponse.ok) {
        throw new Error(saveResult.message || '保存用户资料失败')
      }

      devLog.log('✅ 用户资料保存成功:', saveResult.profile)
      const newUser = saveResult.profile
      updateProgressStep(GenerationStep.SAVING, 60)

      // 第三阶段：启动异步报告生成 (60-90%)
      updateProgressStep(GenerationStep.GENERATING, 70)

      devLog.log('🚀 启动异步报告生成...')
      
      // 新增用户模式：使用新创建的user_profiles.id
      const reportUserId = newUser.id
      
      const response = await fetch('/api/personality-report/generate-async', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userInfo,
          userId: reportUserId,
          isUserProfileId: true // 标识使用的是user_profiles.id而不是手机号
        })
      })

      const result = await response.json()
      devLog.log('📋 异步生成结果:', result)

      if (result.success) {
        updateProgressStep(GenerationStep.GENERATING, 90)

        // 第四阶段：验证用户数据已完全保存 (90-95%)
        devLog.log('🔍 验证新用户数据是否已完全保存到数据库...')
        let verificationAttempts = 0
        const maxVerificationAttempts = 5
        let userVerified = false

        while (verificationAttempts < maxVerificationAttempts && !userVerified) {
          try {
            verificationAttempts++
            devLog.log(`📋 第${verificationAttempts}次验证新用户数据...`)
            
            // 调用用户列表API验证新用户是否已存在
            const verifyResponse = await fetch('/api/user-profiles/list', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phoneNumber: currentUser.phoneNumber })
            })

            if (verifyResponse.ok) {
              const verifyResult = await verifyResponse.json()
              if (verifyResult.success) {
                const profiles = verifyResult.data
                // 检查新用户是否在列表中
                const newUserExists = profiles.find((profile: any) => profile.id === newUser.id)
                
                if (newUserExists) {
                  devLog.log('✅ 新用户数据验证成功，已存在于数据库中')
                  userVerified = true
                  break
                } else {
                  devLog.log(`⚠️ 第${verificationAttempts}次验证失败，新用户数据尚未在数据库中发现`)
                }
              }
            }

            // 如果还没验证成功，等待1秒后重试
            if (!userVerified && verificationAttempts < maxVerificationAttempts) {
              await new Promise(resolve => setTimeout(resolve, 1000))
            }
          } catch (verifyError) {
            devLog.warn(`❌ 第${verificationAttempts}次验证过程出错:`, verifyError)
          }
        }

        if (!userVerified) {
          devLog.warn('⚠️ 无法验证新用户数据是否完全保存，但仍继续操作')
        }

        // 第五阶段：准备完成 (95-100%)
        updateProgressStep(GenerationStep.COMPLETED, 100)

        // 显示完成状态
        await new Promise(resolve => setTimeout(resolve, 800))

        message.success('子用户创建成功！')
        
        // 先调用成功回调，传递新用户数据（让dashboard处理跳转）
        if (onSuccess) {
          onSuccess(newUser)
        }
        
        // 延迟清理标记，确保跳转完成后再清理
        setTimeout(() => {
          sessionStorage.removeItem('verified_invite_code')
          sessionStorage.removeItem('is_adding_new_user')
          sessionStorage.removeItem('pending_reports_data')
          devLog.log('🧹 延迟清理新增用户相关标记完成')
        }, 1000)
      } else {
        throw new Error(result.error || '启动报告生成失败')
      }

    } catch (error) {
      devLog.error('提交失败:', error)
      message.error(error instanceof Error ? error.message : '保存失败，请重试')
      setShowProgress(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white flex overflow-hidden h-full">
      <div className="flex-1 flex items-center justify-center px-4 py-8 bg-gray-50">
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
            新增用户信息
          </h2>
          <p className="text-gray-500">
            请填写新用户的详细信息
          </p>
          
          <div className="mt-2 text-sm text-blue-600">
            兑换码: {inviteCode}
          </div>

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
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  <span className="text-red-500 mr-1">*</span>
                  <span className="font-bold text-black">阳历</span>出生日期时间
                </label>
                <Button
                  type="link"
                  icon={<CalendarOutlined />}
                  onClick={() => setShowLunarModal(true)}
                  className="text-blue-600 hover:text-blue-700"
                  style={{ padding: 0, height: 'auto' }}
                >
                  农历日期输入
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
                      {Array.from({ length: 126 }, (_, i) => 2025 - i).map(year => (
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
            </div>

            {/* 出生地区 */}
            <Form.Item 
              label="出生地区" 
              validateStatus={errors.area ? 'error' : ''}
              help={(() => {
                // 根据当前选择状态提供动态错误提示
                if (errors.area) {
                  if (!watchedValues.area?.province) {
                    return '请选择省份';
                  } else if (!watchedValues.area?.city) {
                    return '请选择城市';
                  } else if (!watchedValues.area?.district) {
                    return '请选择区县';
                  }
                  return errors.area?.province?.message || errors.area?.city?.message || errors.area?.district?.message;
                }
                return '';
              })()}
              required
            >
              <AreaSelector
                value={watchedValues.area}
                onChange={handleAreaChange}
                placeholder={{
                  province: '请选择省份',
                  city: '请选择城市',
                  district: '请选择区县'
                }}
              />
            </Form.Item>

            {/* 提交按钮 */}
            <div className="flex gap-4 mt-8">
              <Button
                size="large"
                className="flex-1"
                onClick={() => onCancel?.()}
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
                  <h3 className="text-lg font-semibold mb-2">AI深度分析中，道友稍后~</h3>
                  <p className="text-gray-600 mb-4">{stepMessages[generationStep]}</p>

                  {/* 预计等候时间提示 */}
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-800 font-medium text-sm">
                      {progress < 90 ? '正在生成性格报告，预计等候1-2分钟' : '性格报告已完成，其他报告将在后台生成'}
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

              {/* 闰月年份提示 */}
              {lunarDate.year && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm">
                    <span className="font-medium text-blue-800">闰月提示：</span>
                    <span className="text-blue-700 ml-1">{getLeapMonthHint()}</span>
                  </div>
                  {getLeapMonthInfo(lunarDate.year) && (
                    <div className="text-xs text-blue-600 mt-1">
                      只有闰月当月才可以选择"闰月"选项
                    </div>
                  )}
                </div>
              )}

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
                    {Array.from({ length: 126 }, (_, i) => 2025 - i).map(year => (
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
                  <div className="mt-2">
                    <Checkbox
                      checked={lunarDate.isLeap}
                      onChange={(e) => setLunarDate(prev => ({ ...prev, isLeap: e.target.checked }))}
                      disabled={!shouldShowLeapOption()}
                    >
                      闰月
                    </Checkbox>
                    {lunarDate.year && (
                      <div className="text-xs text-gray-500 mt-1">
                        {getLeapMonthHint()}
                      </div>
                    )}
                    {!shouldShowLeapOption() && lunarDate.year && lunarDate.month && (
                      <div className="text-xs text-orange-600 mt-1">
                        该月份无闰月
                      </div>
                    )}
                  </div>
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
                <p>• 如遇闰月等特殊情况，请咨询客服处理</p>
              </div>
            </div>
          </Modal>
        </Card>
      </div>
    </div>
  )
} 