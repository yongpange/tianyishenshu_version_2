'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Select, Row, Col, Spin } from 'antd'

const { Option } = Select

interface AreaSelectValue {
  province?: string
  city?: string
  district?: string
}

interface AreaSelectorProps {
  value?: AreaSelectValue
  onChange?: (value: AreaSelectValue) => void
  placeholder?: {
    province?: string
    city?: string
    district?: string
  }
  disabled?: boolean
  size?: 'small' | 'middle' | 'large'
  className?: string
  style?: React.CSSProperties
}

export const AreaSelector: React.FC<AreaSelectorProps> = ({
  value = {},
  onChange,
  placeholder = {
    province: '选择省份',
    city: '选择城市',
    district: '选择区县'
  },
  disabled = false,
  size = 'large',
  className,
  style
}) => {
  // 状态管理
  const [provinces, setProvinces] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])
  const [districts, setDistricts] = useState<any[]>([])
  const [loading, setLoading] = useState({
    provinces: false,
    cities: false,
    districts: false
  })

  // 加载省份数据
  useEffect(() => {
    const loadProvincesData = async () => {
      setLoading(prev => ({ ...prev, provinces: true }))
      try {
        const response = await fetch('/pca-code.json')
        const data = await response.json()
        setProvinces(data)
      } catch (error) {
        console.error('加载省份数据失败:', error)
      } finally {
        setLoading(prev => ({ ...prev, provinces: false }))
      }
    }

    loadProvincesData()
  }, [])

  // 省份选择处理
  const handleProvinceChange = useCallback((provinceCode: string) => {
    const province = provinces.find(p => p.code === provinceCode)
    setCities(province?.children || [])
    setDistricts([])
    
    const newValue: AreaSelectValue = {
      province: provinceCode,
      city: undefined,
      district: undefined
    }
    onChange?.(newValue)
  }, [provinces, onChange])

  // 城市选择处理
  const handleCityChange = useCallback((cityCode: string) => {
    const city = cities.find(c => c.code === cityCode)
    setDistricts(city?.children || [])
    
    const newValue: AreaSelectValue = {
      ...value,
      city: cityCode,
      district: undefined
    }
    onChange?.(newValue)
  }, [cities, value, onChange])

  // 区县选择处理
  const handleDistrictChange = useCallback((districtCode: string) => {
    const newValue: AreaSelectValue = {
      ...value,
      district: districtCode
    }
    onChange?.(newValue)
  }, [value, onChange])

  return (
    <div className={className} style={style}>
      <Row gutter={8}>
        <Col span={8}>
          <Select
            value={value.province}
            onChange={handleProvinceChange}
            placeholder={placeholder.province}
            disabled={disabled}
            size={size}
            style={{ width: '100%' }}
            loading={loading.provinces}
            showSearch
            filterOption={(input, option) =>
              (option?.children as unknown as string)
                ?.toLowerCase()
                .includes(input.toLowerCase())
            }
          >
            {provinces.map(province => (
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
            {cities.map(city => (
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
            {districts.map(district => (
              <Option key={district.code} value={district.code}>
                {district.name}
              </Option>
            ))}
          </Select>
        </Col>
      </Row>
    </div>
  )
}

export default AreaSelector 