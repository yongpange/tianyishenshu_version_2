// 省市区数据类型定义
export interface AreaCode {
  code: string
  name: string
}

export interface DistrictData extends AreaCode {
  // 区县没有下级
}

export interface CityData extends AreaCode {
  children?: DistrictData[]
}

export interface ProvinceData extends AreaCode {
  children?: CityData[]
}

// pca-code.json的数据结构
export type PcaCodeData = ProvinceData[]

// 省市区选择器的值类型
export interface AreaSelectValue {
  province?: string
  city?: string
  district?: string
}

// 省市区选择器的选项类型
export interface AreaOption {
  label: string
  value: string
  children?: AreaOption[]
}

// 组件Props类型
export interface AreaSelectorProps {
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

// 地区数据缓存类型
export interface AreaDataCache {
  provinces: ProvinceData[]
  cities: Map<string, CityData[]>
  districts: Map<string, DistrictData[]>
} 