'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Form, 
  Input, 
  Select, 
  Button, 
  Card, 
  Steps, 
  Modal, 
  message,
  Row,
  Col
} from 'antd'
import { CheckCircleFilled } from '@ant-design/icons'
import SimpleAreaSelector from '@/components/SimpleAreaSelector'

const { Option } = Select

// 生成年份选项（1900-2024）
const generateYears = () => {
  const years = []
  for (let year = 1900; year <= 2024; year++) {
    years.push({ value: year, label: `${year}年` })
  }
  return years.reverse()
}

// 生成月份选项
const generateMonths = () => {
  const months = []
  for (let month = 1; month <= 12; month++) {
    months.push({ value: month, label: `${month}月` })
  }
  return months
}

// 生成日期选项
const generateDays = (year?: number, month?: number) => {
  if (!year || !month) return []
  
  const daysInMonth = new Date(year, month, 0).getDate()
  const days = []
  for (let day = 1; day <= daysInMonth; day++) {
    days.push({ value: day, label: `${day}日` })
  }
  return days
}

// 生成小时选项
const generateHours = () => {
  const hours = []
  for (let hour = 0; hour <= 23; hour++) {
    hours.push({ value: hour, label: `${hour.toString().padStart(2, '0')}时` })
  }
  return hours
}

// 生成分钟选项
const generateMinutes = () => {
  const minutes = []
  for (let minute = 0; minute <= 59; minute++) {
    minutes.push({ value: minute, label: `${minute.toString().padStart(2, '0')}分` })
  }
  return minutes
}

interface FormData {
  nickname: string
  gender: string
  year: number
  month: number
  day: number
  hour: number
  minute: number
  area: {
    province?: string
    city?: string
    district?: string
  }
}

// 移除旧的AreaData接口，使用新的AreaSelector组件

export default function ProfilePage() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [lunarModalVisible, setLunarModalVisible] = useState(false)
  const [lunarForm] = Form.useForm()
  const [isFormValid, setIsFormValid] = useState(false)
  const router = useRouter()

  // 监听表单变化，检查是否所有字段都已填写
  const handleFormChange = () => {
    const values = form.getFieldsValue()
    const areaValues = values.area || {}
    const isAreaComplete = areaValues.province && areaValues.city && areaValues.district
    const isValid = values.nickname && values.gender && values.year && values.month && 
                   values.day !== undefined && values.hour !== undefined && values.minute !== undefined && 
                   isAreaComplete
    setIsFormValid(isValid)
  }

  // 地区选择变化
  const handleAreaChange = (areaValue: any) => {
    form.setFieldsValue({ area: areaValue })
    handleFormChange()
  }

  // 简单的农历转换功能（暂时用模拟转换）
  const handleLunarConvert = () => {
    lunarForm.validateFields().then(values => {
      // 简单的模拟转换逻辑
      const solarYear = values.lunarYear
      const solarMonth = values.lunarMonth
      const solarDay = values.lunarDay + 10 // 简单的偏移处理
      
      form.setFieldsValue({
        year: solarYear,
        month: solarMonth,
        day: solarDay > 28 ? solarDay - 28 : solarDay
      })
      
      message.success(`农历已转换为阳历`)
      setLunarModalVisible(false)
      lunarForm.resetFields()
      handleFormChange()
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Logo和标题 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-sm font-bold">●</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">天乙神数</h1>
          </div>
          <h2 className="text-xl text-gray-700 mb-2">完善您的个人信息</h2>
          <p className="text-gray-500">填写详细信息，获得精准命理分析</p>
        </div>

        {/* 步骤指示器 */}
        <div className="mb-8">
          <Steps
            current={1}
            items={[
              {
                title: '身份验证',
                status: 'finish',
                icon: <CheckCircleFilled className="text-green-500" />
              },
              {
                title: '完善信息',
                status: 'process'
              },
              {
                title: '进入应用',
                status: 'wait'
              }
            ]}
          />
        </div>

        {/* 表单卡片 */}
        <Card className="shadow-lg">
          <Form
            form={form}
            layout="vertical"
            onValuesChange={handleFormChange}
          >
            <Row gutter={16}>
              {/* 昵称 */}
              <Col xs={24} sm={12}>
                <Form.Item
                  label="昵称"
                  name="nickname"
                  rules={[{ required: true, message: '请输入您的昵称' }]}
                >
                  <Input 
                    placeholder="请输入您的昵称" 
                    size="large"
                  />
                </Form.Item>
              </Col>

              {/* 性别 */}
              <Col xs={24} sm={12}>
                <Form.Item
                  label="性别"
                  name="gender"
                  rules={[{ required: true, message: '请选择性别' }]}
                >
                  <Select placeholder="男" size="large">
                    <Option value="male">男</Option>
                    <Option value="female">女</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            {/* 出生日期和时间 */}
            <Form.Item label="出生日期时间">
              <div className="mb-2">
                <Button 
                  type="link" 
                  onClick={() => setLunarModalVisible(true)}
                  className="p-0 text-blue-500"
                >
                  农历转换成太阳历
                </Button>
              </div>
              <Row gutter={8}>
                <Col span={5}>
                  <Form.Item 
                    name="year" 
                    rules={[{ required: true, message: '请选择年份' }]}
                    noStyle
                  >
                    <Select placeholder="1990年" size="large" showSearch>
                      {generateYears().map(year => (
                        <Option key={year.value} value={year.value}>
                          {year.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={4}>
                  <Form.Item 
                    name="month" 
                    rules={[{ required: true, message: '请选择月份' }]}
                    noStyle
                  >
                    <Select placeholder="1月" size="large">
                      {generateMonths().map(month => (
                        <Option key={month.value} value={month.value}>
                          {month.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={4}>
                  <Form.Item 
                    name="day" 
                    rules={[{ required: true, message: '请选择日期' }]}
                    noStyle
                  >
                    <Select placeholder="1日" size="large">
                      {generateDays(
                        form.getFieldValue('year'), 
                        form.getFieldValue('month')
                      ).map(day => (
                        <Option key={day.value} value={day.value}>
                          {day.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={5}>
                  <Form.Item 
                    name="hour" 
                    rules={[{ required: true, message: '请选择时辰' }]}
                    noStyle
                  >
                    <Select placeholder="12时" size="large">
                      {generateHours().map(hour => (
                        <Option key={hour.value} value={hour.value}>
                          {hour.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item 
                    name="minute" 
                    rules={[{ required: true, message: '请选择分钟' }]}
                    noStyle
                  >
                    <Select placeholder="00分" size="large">
                      {generateMinutes().map(minute => (
                        <Option key={minute.value} value={minute.value}>
                          {minute.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Form.Item>

            {/* 出生地区 */}
            <Form.Item 
              label="出生地区"
              name="area"
              rules={[{ required: true, message: '请选择完整的出生地区' }]}
            >
              <SimpleAreaSelector 
                value={form.getFieldValue('area')}
                onChange={handleAreaChange}
                placeholder={{
                  province: "选择省份",
                  city: "选择城市", 
                  district: "选择区县"
                }}
                size="large"
              />
            </Form.Item>

            {/* 按钮区域 */}
            <div className="flex justify-between mt-8">
              <Button 
                size="large" 
                onClick={() => router.back()}
                className="px-8"
              >
                返回
              </Button>
              <Button 
                type="primary" 
                size="large" 
                loading={loading}
                disabled={!isFormValid}
                className="px-8"
                style={{
                  backgroundColor: isFormValid ? '#000' : '#d9d9d9',
                  borderColor: isFormValid ? '#000' : '#d9d9d9'
                }}
                onClick={() => {
                  const values = form.getFieldsValue()
                  console.log('保存的用户信息:', values)
                  
                  // 将数据保存到localStorage
                  const userData = {
                    ...values,
                    timestamp: Date.now()
                  }
                  localStorage.setItem('userData', JSON.stringify(userData))
                  
                  message.success('信息保存成功！')
                  router.push('/dashboard')
                }}
              >
                保存并继续
              </Button>
            </div>
          </Form>
        </Card>

        {/* 农历转换弹窗 */}
        <Modal
          title="农历转换成太阳历"
          open={lunarModalVisible}
          onOk={handleLunarConvert}
          onCancel={() => {
            setLunarModalVisible(false)
            lunarForm.resetFields()
          }}
          okText="转换"
          cancelText="取消"
        >
          <Form form={lunarForm} layout="vertical">
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label="农历年份"
                  name="lunarYear"
                  rules={[{ required: true, message: '请输入农历年份' }]}
                >
                  <Select placeholder="农历年份" showSearch>
                    {generateYears().map(year => (
                      <Option key={year.value} value={year.value}>
                        {year.value}年
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="农历月份"
                  name="lunarMonth"
                  rules={[{ required: true, message: '请输入农历月份' }]}
                >
                  <Select placeholder="农历月份">
                    {generateMonths().map(month => (
                      <Option key={month.value} value={month.value}>
                        {month.value}月
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="农历日期"
                  name="lunarDay"
                  rules={[{ required: true, message: '请输入农历日期' }]}
                >
                  <Select placeholder="农历日期">
                    {Array.from({length: 30}, (_, i) => i + 1).map(day => (
                      <Option key={day} value={day}>
                        {day}日
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <div className="text-gray-500 text-sm mt-2">
              请输入农历日期，系统将自动转换为对应的阳历日期
            </div>
          </Form>
        </Modal>
      </div>
    </div>
  )
} 