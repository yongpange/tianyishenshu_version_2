import { PcaCodeData, ProvinceData, CityData, DistrictData, AreaDataCache } from '@/types/area'

// 全局缓存
let areaDataCache: AreaDataCache | null = null
let dataLoadPromise: Promise<AreaDataCache> | null = null

/**
 * 加载省市区数据
 */
export async function loadAreaData(): Promise<AreaDataCache> {
  // 如果已有缓存，直接返回
  if (areaDataCache) {
    return areaDataCache
  }

  // 如果正在加载，返回加载Promise
  if (dataLoadPromise) {
    return dataLoadPromise
  }

  // 开始加载数据
  dataLoadPromise = (async () => {
    try {
      console.log('🌍 开始加载省市区数据...')
      const startTime = Date.now()
      
      const response = await fetch('/pca-code.json')
      if (!response.ok) {
        throw new Error(`Failed to load area data: ${response.status}`)
      }
      
      const rawData: PcaCodeData = await response.json()
      
      // 构建缓存结构
      const provinces: ProvinceData[] = rawData
      const cities = new Map<string, CityData[]>()
      const districts = new Map<string, DistrictData[]>()
      
      // 预处理数据，建立索引
      provinces.forEach(province => {
        if (province.children) {
          cities.set(province.code, province.children)
          
          province.children.forEach(city => {
            if (city.children) {
              districts.set(city.code, city.children)
            }
          })
        }
      })
      
      areaDataCache = {
        provinces,
        cities,
        districts
      }
      
      const loadTime = Date.now() - startTime
      console.log(`✅ 省市区数据加载完成，耗时: ${loadTime}ms`)
      console.log(`📊 数据统计: ${provinces.length}个省份, ${cities.size}个城市组, ${districts.size}个区县组`)
      
      return areaDataCache
    } catch (error) {
      console.error('❌ 加载省市区数据失败:', error)
      dataLoadPromise = null
      throw error
    }
  })()
  
  return dataLoadPromise
}

/**
 * 获取省份列表
 */
export async function getProvinces(): Promise<ProvinceData[]> {
  const cache = await loadAreaData()
  return cache.provinces
}

/**
 * 根据省份代码获取城市列表
 */
export async function getCities(provinceCode: string): Promise<CityData[]> {
  const cache = await loadAreaData()
  return cache.cities.get(provinceCode) || []
}

/**
 * 根据城市代码获取区县列表
 */
export async function getDistricts(cityCode: string): Promise<DistrictData[]> {
  const cache = await loadAreaData()
  return cache.districts.get(cityCode) || []
}

/**
 * 根据代码查找地区名称
 */
export async function getAreaNameByCode(code: string): Promise<string | null> {
  const cache = await loadAreaData()
  
  // 在省份中查找
  const province = cache.provinces.find(p => p.code === code)
  if (province) return province.name
  
  // 在城市中查找
  for (const cityList of Array.from(cache.cities.values())) {
    const city = cityList.find((c: CityData) => c.code === code)
    if (city) return city.name
  }
  
  // 在区县中查找
  for (const districtList of Array.from(cache.districts.values())) {
    const district = districtList.find((d: DistrictData) => d.code === code)
    if (district) return district.name
  }
  
  return null
}

/**
 * 根据代码获取完整的地区路径
 */
export async function getAreaPath(provinceCode?: string, cityCode?: string, districtCode?: string) {
  const result = {
    province: '',
    city: '',
    district: ''
  }
  
  if (provinceCode) {
    result.province = (await getAreaNameByCode(provinceCode)) || ''
  }
  
  if (cityCode) {
    result.city = (await getAreaNameByCode(cityCode)) || ''
  }
  
  if (districtCode) {
    result.district = (await getAreaNameByCode(districtCode)) || ''
  }
  
  return result
}

/**
 * 清除缓存（用于测试或强制重新加载）
 */
export function clearAreaDataCache() {
  areaDataCache = null
  dataLoadPromise = null
  console.log('🧹 省市区数据缓存已清除')
} 