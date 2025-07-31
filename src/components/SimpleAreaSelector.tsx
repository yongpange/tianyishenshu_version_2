'use client'

import React, { useState, useEffect } from 'react'
import { Select, Row, Col } from 'antd'
import { devLog } from '@/utils/dev-logger'

const { Option } = Select

interface AreaSelectValue {
  province?: string
  city?: string
  district?: string
}

interface SimpleAreaSelectorProps {
  value?: AreaSelectValue
  onChange?: (value: AreaSelectValue) => void
  placeholder?: {
    province?: string
    city?: string
    district?: string
  }
  disabled?: boolean
  size?: 'small' | 'middle' | 'large'
}

export default function SimpleAreaSelector({
  value = {},
  onChange,
  placeholder = {
    province: '选择省份',
    city: '选择城市',
    district: '选择区县'
  },
  disabled = false,
  size = 'large'
}: SimpleAreaSelectorProps) {
  const [areaData, setAreaData] = useState<any>(null)
  const [cities, setCities] = useState<any[]>([])
  const [districts, setDistricts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // 加载省市区数据
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/pca-code.json')
        const data = await response.json()
        setAreaData(data)
        setLoading(false)
        devLog.log('✅ 省市区数据加载完成:', data.length + '个省份')
      } catch (error) {
        devLog.error('❌ 加载省市区数据失败:', error)
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // 当省份改变时更新城市列表
  useEffect(() => {
    if (value.province && areaData) {
      const province = areaData.find((p: any) => p.code === value.province)
      setCities(province?.children || [])
      if (!value.city) {
        setDistricts([])
      }
    } else {
      setCities([])
      setDistricts([])
    }
  }, [value.province, areaData])

  // 当城市改变时更新区县列表
  useEffect(() => {
    if (value.city && cities.length > 0) {
      const city = cities.find((c: any) => c.code === value.city)
      setDistricts(city?.children || [])
    } else {
      setDistricts([])
    }
  }, [value.city, cities])

  const handleProvinceChange = (provinceCode: string) => {
    const newValue = {
      province: provinceCode,
      city: undefined,
      district: undefined
    }
    onChange?.(newValue)
  }

  const handleCityChange = (cityCode: string) => {
    const newValue = {
      ...value,
      city: cityCode,
      district: undefined
    }
    onChange?.(newValue)
  }

  const handleDistrictChange = (districtCode: string) => {
    const newValue = {
      ...value,
      district: districtCode
    }
    onChange?.(newValue)
  }

  if (loading) {
    return (
      <Row gutter={8}>
        <Col span={8}>
          <Select placeholder="加载中..." size={size} disabled />
        </Col>
        <Col span={8}>
          <Select placeholder="加载中..." size={size} disabled />
        </Col>
        <Col span={8}>
          <Select placeholder="加载中..." size={size} disabled />
        </Col>
      </Row>
    )
  }

  return (
    <Row gutter={8}>
      <Col span={8}>
        <Select
          value={value.province}
          onChange={handleProvinceChange}
          placeholder={placeholder.province}
          disabled={disabled}
          size={size}
          style={{ width: '100%' }}
          showSearch
          filterOption={(input, option) =>
            (option?.children as unknown as string)
              ?.toLowerCase()
              .includes(input.toLowerCase())
          }
        >
          {areaData?.map((province: any) => (
            <Option key={province.code} value={province.code}>
              {province.name}
            </Option>
          ))}
        </Select>
      </Col>
      <Col span={8}>
        <Select
          value={value.city}
          onChange={handleCityChange}
          placeholder={placeholder.city}
          disabled={disabled || !value.province}
          size={size}
          style={{ width: '100%' }}
          showSearch
          filterOption={(input, option) =>
            (option?.children as unknown as string)
              ?.toLowerCase()
              .includes(input.toLowerCase())
          }
        >
          {cities.map((city: any) => (
            <Option key={city.code} value={city.code}>
              {city.name}
            </Option>
          ))}
        </Select>
      </Col>
      <Col span={8}>
        <Select
          value={value.district}
          onChange={handleDistrictChange}
          placeholder={placeholder.district}
          disabled={disabled || !value.city}
          size={size}
          style={{ width: '100%' }}
          showSearch
          filterOption={(input, option) =>
            (option?.children as unknown as string)
              ?.toLowerCase()
              .includes(input.toLowerCase())
          }
        >
          {districts.map((district: any) => (
            <Option key={district.code} value={district.code}>
              {district.name}
            </Option>
          ))}
        </Select>
      </Col>
    </Row>
  )
} 