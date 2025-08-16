'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Button, message, Spin } from 'antd'
import { ArrowLeftOutlined, MessageOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { getActiveUser } from '@/utils/client-utils'
import { devLog } from '@/utils/dev-logger'

// 类型定义
interface AstrologyData {
  solarDate: string
  lunarDate: string
  ancientDate: string
  trueSolarTime: string
  birthplace: string
  paipan: {
    solarYear: number
    solarMonth: number
    solarDay: number
    solarHour: number
    yearPillar: { heavenly: string, earthly: string, element: string, elementType: string, hiddenStems: string[], heavenlyColor: string, earthlyColor: string }
    monthPillar: { heavenly: string, earthly: string, element: string, elementType: string, hiddenStems: string[], heavenlyColor: string, earthlyColor: string }
    dayPillar: { heavenly: string, earthly: string, element: string, elementType: string, hiddenStems: string[], heavenlyColor: string, earthlyColor: string }
    hourPillar: { heavenly: string, earthly: string, element: string, elementType: string, hiddenStems: string[], heavenlyColor: string, earthlyColor: string }
    yearElement: string
    monthElement: string
    dayElement: string
    hourElement: string
    yearStar: string
    monthStar: string
    dayStar: string
    hourStar: string
  }
  yearElement: string
  monthElement: string
  dayElement: string
  hourElement: string
  yearStar: string
  monthStar: string
  dayStar: string
  hourStar: string
  shensha: {
    year: string
    month: string
    day: string
    hour: string
  }
  qiankunzao: [string[], string[], string[][]]
  dayun: Array<{
    age: string
    year: string | number
    pillar: string
    color: string
    element: string
    elementType: string
    shishen?: string
    nayin?: string
  }>
}

export default function AstrologyPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AstrologyData | null>(null)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [originalUserInfo, setOriginalUserInfo] = useState<any>(null) // 用户原始信息
  const router = useRouter()

  // 格式化用户原始数据为阳历生辰显示
  const formatOriginalSolarDate = (userInfo: any) => {
    if (!userInfo) return ''
    
    const year = userInfo.year
    const month = String(userInfo.month).padStart(2, '0')
    const day = String(userInfo.day).padStart(2, '0')
    const hour = String(userInfo.hour).padStart(2, '0')
    const minute = String(userInfo.minute).padStart(2, '0')
    
    // 时辰映射
    const hourToShichen = (hour: number): string => {
      const shichenMap = {
        23: '子时', 0: '子时', 1: '丑时', 2: '丑时',
        3: '寅时', 4: '寅时', 5: '卯时', 6: '卯时',
        7: '辰时', 8: '辰时', 9: '巳时', 10: '巳时',
        11: '午时', 12: '午时', 13: '未时', 14: '未时',
        15: '申时', 16: '申时', 17: '酉时', 18: '酉时',
        19: '戌时', 20: '戌时', 21: '亥时', 22: '亥时'
      }
      return shichenMap[hour as keyof typeof shichenMap] || '午时'
    }
    
    const shichen = hourToShichen(userInfo.hour)
    return `${year}年${month}月${day}日 ${hour}:${minute} ${shichen}`
  }

  // 天干颜色映射
  const HEAVENLY_STEM_COLORS: { [key: string]: string } = {
    '甲': 'text-green-600', '乙': 'text-green-600', 
    '丙': 'text-red-600', '丁': 'text-red-600', 
    '戊': 'text-amber-700', '己': 'text-amber-700',
    '庚': 'text-gray-400', '辛': 'text-gray-400', 
    '壬': 'text-black', '癸': 'text-black'
  }

  // 地支颜色映射
  const EARTHLY_BRANCH_COLORS: { [key: string]: string } = {
    '子': 'text-black', '丑': 'text-amber-700', '寅': 'text-green-600',
    '卯': 'text-green-600', '辰': 'text-amber-700', '巳': 'text-red-600',
    '午': 'text-red-600', '未': 'text-amber-700', '申': 'text-gray-400',
    '酉': 'text-gray-400', '戌': 'text-amber-700', '亥': 'text-black'
  }

  // 藏干表数据（对应canggan-table.csv）
  const CANGGAN_TABLE: { [key: string]: { benqi?: string, zhongqi?: string, yuqi?: string } } = {
    '寅': { benqi: '甲', zhongqi: '丙', yuqi: '戊' },
    '卯': { benqi: '乙' },
    '辰': { benqi: '戊', zhongqi: '乙', yuqi: '癸' },
    '巳': { benqi: '丙', zhongqi: '庚', yuqi: '戊' },
    '午': { benqi: '丁', zhongqi: '己' },
    '未': { benqi: '己', zhongqi: '丁', yuqi: '乙' },
    '申': { benqi: '庚', zhongqi: '壬', yuqi: '戊' },
    '酉': { benqi: '辛' },
    '戌': { benqi: '戊', zhongqi: '辛', yuqi: '丁' },
    '亥': { benqi: '壬', zhongqi: '甲' },
    '子': { benqi: '癸' },
    '丑': { benqi: '己', zhongqi: '癸', yuqi: '辛' }
  }

  // 十神表数据（简化版，用于前端计算）
  const SHISHEN_TABLE: { [key: string]: { [key: string]: string } } = {
    '甲': { '甲': '比肩', '乙': '劫财', '丙': '食神', '丁': '伤官', '戊': '偏财', '己': '正财', '庚': '七杀', '辛': '正官', '壬': '偏印', '癸': '正印', '寅': '比肩', '卯': '劫财', '辰': '偏财', '巳': '食神', '午': '伤官', '未': '正财', '申': '七杀', '酉': '正官', '戌': '偏财', '亥': '偏印', '子': '正印', '丑': '正财' },
    '乙': { '甲': '劫财', '乙': '比肩', '丙': '伤官', '丁': '食神', '戊': '正财', '己': '偏财', '庚': '正官', '辛': '七杀', '壬': '正印', '癸': '偏印', '寅': '劫财', '卯': '比肩', '辰': '正财', '巳': '伤官', '午': '食神', '未': '偏财', '申': '正官', '酉': '七杀', '戌': '正财', '亥': '正印', '子': '偏印', '丑': '偏财' },
    '丙': { '甲': '偏印', '乙': '正印', '丙': '比肩', '丁': '劫财', '戊': '食神', '己': '伤官', '庚': '偏财', '辛': '正财', '壬': '七杀', '癸': '正官', '寅': '偏印', '卯': '正印', '辰': '食神', '巳': '比肩', '午': '劫财', '未': '伤官', '申': '偏财', '酉': '正财', '戌': '食神', '亥': '七杀', '子': '正官', '丑': '伤官' },
    '丁': { '甲': '正印', '乙': '偏印', '丙': '劫财', '丁': '比肩', '戊': '伤官', '己': '食神', '庚': '正财', '辛': '偏财', '壬': '正官', '癸': '七杀', '寅': '正印', '卯': '偏印', '辰': '伤官', '巳': '劫财', '午': '比肩', '未': '食神', '申': '正财', '酉': '偏财', '戌': '伤官', '亥': '正官', '子': '七杀', '丑': '食神' },
    '戊': { '甲': '七杀', '乙': '正官', '丙': '偏印', '丁': '正印', '戊': '比肩', '己': '劫财', '庚': '食神', '辛': '伤官', '壬': '偏财', '癸': '正财', '寅': '七杀', '卯': '正官', '辰': '比肩', '巳': '偏印', '午': '正印', '未': '劫财', '申': '食神', '酉': '伤官', '戌': '比肩', '亥': '偏财', '子': '正财', '丑': '劫财' },
    '己': { '甲': '正官', '乙': '七杀', '丙': '正印', '丁': '偏印', '戊': '劫财', '己': '比肩', '庚': '伤官', '辛': '食神', '壬': '正财', '癸': '偏财', '寅': '正官', '卯': '七杀', '辰': '劫财', '巳': '正印', '午': '偏印', '未': '比肩', '申': '伤官', '酉': '食神', '戌': '劫财', '亥': '正财', '子': '偏财', '丑': '比肩' },
    '庚': { '甲': '偏财', '乙': '正财', '丙': '七杀', '丁': '正官', '戊': '偏印', '己': '正印', '庚': '比肩', '辛': '劫财', '壬': '食神', '癸': '伤官', '寅': '偏财', '卯': '正财', '辰': '偏印', '巳': '七杀', '午': '正官', '未': '正印', '申': '比肩', '酉': '劫财', '戌': '偏印', '亥': '食神', '子': '伤官', '丑': '正印' },
    '辛': { '甲': '正财', '乙': '偏财', '丙': '正官', '丁': '七杀', '戊': '正印', '己': '偏印', '庚': '劫财', '辛': '比肩', '壬': '伤官', '癸': '食神', '寅': '正财', '卯': '偏财', '辰': '正印', '巳': '正官', '午': '七杀', '未': '偏印', '申': '劫财', '酉': '比肩', '戌': '正印', '亥': '伤官', '子': '食神', '丑': '偏印' },
    '壬': { '甲': '食神', '乙': '伤官', '丙': '偏财', '丁': '正财', '戊': '七杀', '己': '正官', '庚': '偏印', '辛': '正印', '壬': '比肩', '癸': '劫财', '寅': '食神', '卯': '伤官', '辰': '七杀', '巳': '偏财', '午': '正财', '未': '正官', '申': '偏印', '酉': '正印', '戌': '七杀', '亥': '比肩', '子': '劫财', '丑': '正官' },
    '癸': { '甲': '伤官', '乙': '食神', '丙': '正财', '丁': '偏财', '戊': '正官', '己': '七杀', '庚': '正印', '辛': '偏印', '壬': '劫财', '癸': '比肩', '寅': '伤官', '卯': '食神', '辰': '正官', '巳': '正财', '午': '偏财', '未': '七杀', '申': '正印', '酉': '偏印', '戌': '正官', '亥': '劫财', '子': '比肩', '丑': '七杀' }
  }



  // 获取天干地支颜色
  const getGanZhiColors = (ganZhi: string) => {
    if (!ganZhi || ganZhi.length < 2) return { heavenlyColor: 'text-gray-600', earthlyColor: 'text-gray-600' }
    const heavenly = ganZhi[0]
    const earthly = ganZhi[1]
    return {
      heavenlyColor: HEAVENLY_STEM_COLORS[heavenly] || 'text-gray-600',
      earthlyColor: EARTHLY_BRANCH_COLORS[earthly] || 'text-gray-600'
    }
  }

  // 获取日主
  const getRizhu = () => {
    if (!data?.paipan?.dayPillar?.heavenly) return ''
    return data.paipan.dayPillar.heavenly
  }

  // 计算天干十神
  const getShishenByTianGan = (rizhu: string, tiangan: string): string => {
    if (!rizhu || !tiangan || !SHISHEN_TABLE[rizhu]) return ''
    return SHISHEN_TABLE[rizhu][tiangan] || ''
  }

  // 计算地支十神
  const getShishenByDiZhi = (rizhu: string, dizhi: string): string => {
    if (!rizhu || !dizhi || !SHISHEN_TABLE[rizhu]) return ''
    return SHISHEN_TABLE[rizhu][dizhi] || ''
  }

  // 获取地支藏干信息
  const getCangGanInfo = (dizhi: string) => {
    return CANGGAN_TABLE[dizhi] || { benqi: undefined, zhongqi: undefined, yuqi: undefined }
  }

  // 格式化藏干显示（新版本，基于canggan-table.csv）
  const formatNewCangGan = (dizhi: string) => {
    const rizhu = getRizhu()
    const cangganInfo = getCangGanInfo(dizhi)
    const parts = []

    // 地支本气
    if (cangganInfo.benqi) {
      const shishen = rizhu ? getShishenByTianGan(rizhu, cangganInfo.benqi) : ''
      const heavenlyColor = HEAVENLY_STEM_COLORS[cangganInfo.benqi] || 'text-gray-600'
      parts.push(
        <div key="benqi" className={heavenlyColor}>
          {cangganInfo.benqi}  {shishen}
        </div>
      )
    }

    // 地支中气
    if (cangganInfo.zhongqi) {
      const shishen = rizhu ? getShishenByTianGan(rizhu, cangganInfo.zhongqi) : ''
      const heavenlyColor = HEAVENLY_STEM_COLORS[cangganInfo.zhongqi] || 'text-gray-600'
      parts.push(
        <div key="zhongqi" className={heavenlyColor}>
          {cangganInfo.zhongqi}  {shishen}
        </div>
      )
    }

    // 地支余气
    if (cangganInfo.yuqi) {
      const shishen = rizhu ? getShishenByTianGan(rizhu, cangganInfo.yuqi) : ''
      const heavenlyColor = HEAVENLY_STEM_COLORS[cangganInfo.yuqi] || 'text-gray-600'
      parts.push(
        <div key="yuqi" className={heavenlyColor}>
          {cangganInfo.yuqi}  {shishen}
        </div>
      )
    }

    return <div className="text-sm text-gray-600 leading-tight">{parts}</div>
  }





  // 处理神煞内容纵向排列
  const formatShensha = (shenshaText: string) => {
    if (!shenshaText) return null
    
    // 按空格分割神煞内容
    const shenshaList = shenshaText.split(' ').filter(item => item.trim())
    
    if (shenshaList.length === 0) return null
    
    return (
      <div className="text-xs text-gray-600 leading-tight">
        {shenshaList.map((item, index) => (
          <div key={index} className="mb-1 last:mb-0">
            {item}
          </div>
        ))}
      </div>
    )
  }

  useEffect(() => {
    // 设置用户信息
    const activeUser = getActiveUser()
    if (activeUser) {
      setUserInfo({
        nickname: activeUser.name,
        gender: activeUser.gender === 'male' ? '男' : '女'
      })
    } else {
      // 备用方案：从localStorage获取用户信息
      const userData = localStorage.getItem('userData')
      if (userData) {
        setUserInfo(JSON.parse(userData))
      }
    }

    fetchAstrologyData()
  }, [])

  // 监听用户切换，重新加载数据
  useEffect(() => {
    const handleStorageChange = () => {
      // 当localStorage中的activeUser发生变化时，重新加载数据
      const activeUser = getActiveUser()
      if (activeUser) {
        devLog.log('用户切换，重新加载八字数据:', activeUser.name)
        setLoading(true)
        setUserInfo({
          nickname: activeUser.name,
          gender: activeUser.gender === 'male' ? '男' : '女'
        })
        fetchAstrologyData()
      }
    }

    // 监听localStorage变化
    window.addEventListener('storage', handleStorageChange)
    
    // 监听自定义事件（用于同一标签页内的切换）
    window.addEventListener('userSwitched', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('userSwitched', handleStorageChange)
    }
  }, [])

  const fetchAstrologyData = async () => {
    try {
      // 确定用户ID
      const activeUser = getActiveUser()
      let userId: string | null = null
      let isUserProfileId = false

      if (activeUser && activeUser.id) {
        // 使用激活用户的ID
        userId = activeUser.id
        isUserProfileId = true
        devLog.log('📊 使用激活用户ID:', userId)
      } else {
        // 备用方案：使用手机号
        const loginData = localStorage.getItem('loginData')
        if (loginData) {
          const parsed = JSON.parse(loginData)
          userId = parsed.phoneNumber
          devLog.log('📊 使用手机号:', userId)
        }
      }

      if (!userId) {
        message.error('请先登录')
        setTimeout(() => {
          router.push('/login')
        }, 1000)
        return
      }

      devLog.log('🔮 从数据库获取八字报告:', { userId, isUserProfileId })

      // 从数据库获取八字报告
      const response = await fetch('/api/bazi/get', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          isUserProfileId: isUserProfileId
        })
      })

      const result = await response.json()

      if (result.success) {
        devLog.log('✅ 成功获取八字报告')
        setData(result.report)
        
        // 使用API返回的用户原始信息
        if (result.originalUserInfo) {
          setOriginalUserInfo(result.originalUserInfo)
          devLog.log('📝 从API获取用户原始信息:', result.originalUserInfo)
        } else {
          // 备用方案：从activeUser获取
          const activeUser = getActiveUser()
          if (activeUser) {
            setOriginalUserInfo({
              name: activeUser.name,
              year: activeUser.year,
              month: activeUser.month,
              day: activeUser.day,
              hour: activeUser.hour,
              minute: activeUser.minute,
              area: {
                province: activeUser.area_province,
                city: activeUser.area_city,
                district: activeUser.area_district
              }
            })
            devLog.log('📝 从activeUser获取用户原始信息:', activeUser)
          }
        }
      } else {
        devLog.warn('⚠️ 未找到八字报告，需要生成新报告')
        
        // 如果没有找到报告，尝试生成新的
        const activeUser = getActiveUser()
        if (activeUser) {
          const userInfo = {
            name: activeUser.name,
            gender: activeUser.gender,
            year: activeUser.year,
            month: activeUser.month,
            day: activeUser.day,
            hour: activeUser.hour,
            minute: activeUser.minute,
            area: {
              province: activeUser.area_province,
              city: activeUser.area_city,
              district: activeUser.area_district
            }
          }

          devLog.log('🔮 生成新的八字报告...')
          const generateResponse = await fetch('/api/bazi/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userInfo,
              userId: userId,
              isUserProfileId: isUserProfileId
            })
          })

          const generateResult = await generateResponse.json()
          
          if (generateResult.success) {
            devLog.log('✅ 八字报告生成成功')
            setData(generateResult.report.raw_payload)
            
            // 保存用户原始信息
            setOriginalUserInfo(userInfo)
            devLog.log('📝 保存用户原始信息:', userInfo)
          } else {
            throw new Error(generateResult.message || '生成八字报告失败')
          }
        } else {
          message.error('无法获取用户信息，请完善个人资料')
          setTimeout(() => {
            router.push('/profile')
          }, 1000)
          return
        }
      }
    } catch (error) {
      console.error('获取八字数据失败:', error)
      message.error('获取八字数据失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleConsultation = () => {
    router.push('/dashboard')
  }

  const handleHealing = () => {
    message.info('功能开发中，敬请期待')
  }

  const handleTreasure = () => {
    message.info('功能开发中，敬请期待')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Spin size="large" />
          <p className="text-gray-600 mt-4">正在生成您的命理报告...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">数据加载失败</p>
          <Button onClick={() => router.push('/dashboard')} className="mt-4">
            返回首页
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 h-full">
      {/* 主内容区域 */}
      <div className="p-4 md:p-8 pb-20 md:pb-8 h-full overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            {/* 页面标题 */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2 pl-6">八字排盘分析</h1>
            </div>

            {/* 生辰信息卡片 */}
            <Card className="mb-6">
              <div className="space-y-4">
                {/* 移动端：6行布局 */}
                <div className="md:hidden space-y-2">
                  <div className="text-sm">
                    <span className="text-gray-700">命主信息：</span>
                    <span className="font-medium">
                      {(() => {
                        const activeUser = getActiveUser()
                        if (activeUser) {
                          const genderText = activeUser.gender === 'male' ? '男' : '女'
                          return `${activeUser.name || '用户'} ${genderText}`
                        }

                        const userData = localStorage.getItem('userData')
                        if (userData) {
                          const userInfo = JSON.parse(userData)
                          const genderText = userInfo.gender === 'male' ? '男' : '女'
                          return `${userInfo.nickname || '用户'} ${genderText}`
                        }

                        return '用户'
                      })()}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-700">阳历生辰：</span>
                    <span className="font-medium">
                      {originalUserInfo ? formatOriginalSolarDate(originalUserInfo) : data.solarDate}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-700">农历生辰：</span>
                    <span className="font-medium">{data.lunarDate}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-700">古历生辰：</span>
                    <span className="font-medium">{data.ancientDate}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-700">真太阳时：</span>
                    <span className="font-medium">{data.trueSolarTime}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-700">出生地区：</span>
                    <span className="font-medium">{data.birthplace}</span>
                  </div>
                </div>

                {/* 平板/桌面端：3行2列布局 */}
                <div className="hidden md:block space-y-4">
                  {/* 第1行：命主信息 + 阳历生辰 */}
                  <div className="flex text-sm">
                    <div className="flex-1">
                      <span className="text-gray-700">命主信息：</span>
                      <span className="font-medium">
                        {(() => {
                          const activeUser = getActiveUser()
                          if (activeUser) {
                            const genderText = activeUser.gender === 'male' ? '男' : '女'
                            return `${activeUser.name || '用户'} ${genderText}`
                          }

                          const userData = localStorage.getItem('userData')
                          if (userData) {
                            const userInfo = JSON.parse(userData)
                            const genderText = userInfo.gender === 'male' ? '男' : '女'
                            return `${userInfo.nickname || '用户'} ${genderText}`
                          }

                          return '用户'
                        })()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <span className="text-gray-700">阳历生辰：</span>
                      <span className="font-medium">
                        {originalUserInfo ? formatOriginalSolarDate(originalUserInfo) : data.solarDate}
                      </span>
                    </div>
                  </div>

                  {/* 第2行：农历生辰 + 古历生辰 */}
                  <div className="flex text-sm">
                    <div className="flex-1">
                      <span className="text-gray-700">农历生辰：</span>
                      <span className="font-medium">{data.lunarDate}</span>
                    </div>
                    <div className="flex-1">
                      <span className="text-gray-700">古历生辰：</span>
                      <span className="font-medium">{data.ancientDate}</span>
                    </div>
                  </div>

                  {/* 第3行：真太阳时 + 出生地区 */}
                  <div className="flex text-sm">
                    <div className="flex-1">
                      <span className="text-gray-700">真太阳时：</span>
                      <span className="font-medium">{data.trueSolarTime}</span>
                    </div>
                    <div className="flex-1">
                      <span className="text-gray-700">出生地区：</span>
                      <span className="font-medium">{data.birthplace}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* 八字排盘表格 */}
            <Card title="八字排盘" className="mb-6">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse table-fixed">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-3 text-center text-gray-700 w-20"></th>
                      <th className="border border-gray-300 p-3 text-center text-gray-700 w-24">年</th>
                      <th className="border border-gray-300 p-3 text-center text-gray-700 w-24">月</th>
                      <th className="border border-gray-300 p-3 text-center text-gray-700 w-24">日</th>
                      <th className="border border-gray-300 p-3 text-center text-gray-700 w-24">时</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 p-3 text-center font-medium bg-gray-50 text-gray-700 w-20">公历</td>
                      <td className="border border-gray-300 p-3 text-center font-medium w-24">{data.paipan.solarYear}</td>
                      <td className="border border-gray-300 p-3 text-center font-medium w-24">{data.paipan.solarMonth}</td>
                      <td className="border border-gray-300 p-3 text-center font-medium w-24">{data.paipan.solarDay}</td>
                      <td className="border border-gray-300 p-3 text-center font-medium w-24">{data.paipan.solarHour}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3 text-center font-medium bg-gray-50 text-gray-700 w-20">天干</td>
                      <td className="border border-gray-300 p-3 text-center w-24">
                        <div className={`${data.paipan.yearPillar.heavenlyColor} text-2xl font-bold mb-2`}>
                          {data.paipan.yearPillar.heavenly}
                        </div>
                        <div className="text-xs text-gray-600">
                          {data.qiankunzao?.[0]?.[0] || ''}
                        </div>
                      </td>
                      <td className="border border-gray-300 p-3 text-center w-24">
                        <div className={`${data.paipan.monthPillar.heavenlyColor} text-2xl font-bold mb-2`}>
                          {data.paipan.monthPillar.heavenly}
                        </div>
                        <div className="text-xs text-gray-600">
                          {data.qiankunzao?.[0]?.[1] || ''}
                        </div>
                      </td>
                      <td className="border border-gray-300 p-3 text-center w-24">
                        <div className={`${data.paipan.dayPillar.heavenlyColor} text-2xl font-bold mb-2`}>
                          {data.paipan.dayPillar.heavenly}
                        </div>
                        <div className="text-xs text-gray-600">
                          {data.qiankunzao?.[0]?.[2] || ''}
                        </div>
                      </td>
                      <td className="border border-gray-300 p-3 text-center w-24">
                        <div className={`${data.paipan.hourPillar.heavenlyColor} text-2xl font-bold mb-2`}>
                          {data.paipan.hourPillar.heavenly}
                        </div>
                        <div className="text-xs text-gray-600">
                          {data.qiankunzao?.[0]?.[3] || ''}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3 text-center font-medium bg-gray-50 text-gray-700 w-20">地支</td>
                      <td className="border border-gray-300 p-3 text-center w-24">
                        <div className={`${data.paipan.yearPillar.earthlyColor} text-2xl font-bold mb-2`}>
                          {data.paipan.yearPillar.earthly}
                        </div>
                        {(() => {
                          const rizhu = getRizhu()
                          const shishen = rizhu ? getShishenByDiZhi(rizhu, data.paipan.yearPillar.earthly) : ''
                          return shishen ? <div className="text-xs text-gray-600">{shishen}</div> : null
                        })()}
                      </td>
                      <td className="border border-gray-300 p-3 text-center w-24">
                        <div className={`${data.paipan.monthPillar.earthlyColor} text-2xl font-bold mb-2`}>
                          {data.paipan.monthPillar.earthly}
                        </div>
                        {(() => {
                          const rizhu = getRizhu()
                          const shishen = rizhu ? getShishenByDiZhi(rizhu, data.paipan.monthPillar.earthly) : ''
                          return shishen ? <div className="text-xs text-gray-600">{shishen}</div> : null
                        })()}
                      </td>
                      <td className="border border-gray-300 p-3 text-center w-24">
                        <div className={`${data.paipan.dayPillar.earthlyColor} text-2xl font-bold mb-2`}>
                          {data.paipan.dayPillar.earthly}
                        </div>
                        {(() => {
                          const rizhu = getRizhu()
                          const shishen = rizhu ? getShishenByDiZhi(rizhu, data.paipan.dayPillar.earthly) : ''
                          return shishen ? <div className="text-xs text-gray-600">{shishen}</div> : null
                        })()}
                      </td>
                      <td className="border border-gray-300 p-3 text-center w-24">
                        <div className={`${data.paipan.hourPillar.earthlyColor} text-2xl font-bold mb-2`}>
                          {data.paipan.hourPillar.earthly}
                        </div>
                        {(() => {
                          const rizhu = getRizhu()
                          const shishen = rizhu ? getShishenByDiZhi(rizhu, data.paipan.hourPillar.earthly) : ''
                          return shishen ? <div className="text-xs text-gray-600">{shishen}</div> : null
                        })()}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3 text-center font-medium bg-gray-50 text-gray-700 w-20">藏干</td>
                      <td className="border border-gray-300 p-3 text-center w-24">
                        {formatNewCangGan(data.paipan.yearPillar.earthly)}
                      </td>
                      <td className="border border-gray-300 p-3 text-center w-24">
                        {formatNewCangGan(data.paipan.monthPillar.earthly)}
                      </td>
                      <td className="border border-gray-300 p-3 text-center w-24">
                        {formatNewCangGan(data.paipan.dayPillar.earthly)}
                      </td>
                      <td className="border border-gray-300 p-3 text-center w-24">
                        {formatNewCangGan(data.paipan.hourPillar.earthly)}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3 text-center font-medium bg-gray-50 text-gray-700 w-20">纳音</td>
                      <td className="border border-gray-300 p-3 text-center w-24">
                        <div className="text-sm text-gray-600">{data.yearStar}</div>
                      </td>
                      <td className="border border-gray-300 p-3 text-center w-24">
                        <div className="text-sm text-gray-600">{data.monthStar}</div>
                      </td>
                      <td className="border border-gray-300 p-3 text-center w-24">
                        <div className="text-sm text-gray-600">{data.dayStar}</div>
                      </td>
                      <td className="border border-gray-300 p-3 text-center w-24">
                        <div className="text-sm text-gray-600">{data.hourStar}</div>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3 text-center font-medium bg-gray-50 text-gray-700 w-20">神煞</td>
                      <td className="border border-gray-300 p-3 text-center w-24">
                        {formatShensha(data.shensha?.year)}
                      </td>
                      <td className="border border-gray-300 p-3 text-center w-24">
                        {formatShensha(data.shensha?.month)}
                      </td>
                      <td className="border border-gray-300 p-3 text-center w-24">
                        {formatShensha(data.shensha?.day)}
                      </td>
                      <td className="border border-gray-300 p-3 text-center w-24">
                        {formatShensha(data.shensha?.hour)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            {/* 大运表格 */}
            <Card title="大运" className="mb-6">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse table-fixed">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-3 text-center text-gray-700 w-20">大运</th>
                      {data.dayun.slice(0, 5).map((item, index) => {
                        // 处理大运年龄和年份显示：第一个1-x变成1-(x-1)，其余-1
                        let displayAge = String(item.age || '')
                        let displayYear = String(item.year || '')
                        
                        if (index === 0) {
                          // 第一个大运：保持起始年龄1岁不变，但结束年龄-1
                          if (displayAge.includes('-') && displayAge.includes('岁')) {
                            displayAge = displayAge.replace(/1-(\d+)岁/, (match: string, endAge: string) => `1-${parseInt(endAge) - 1}岁`)
                          }
                        } else {
                          // 其余大运：年龄-1，年份-1
                          if (displayAge.includes('岁')) {
                            const ageNum = parseInt(displayAge.replace('岁', ''))
                            if (!isNaN(ageNum)) {
                              displayAge = `${ageNum - 1}岁`
                            }
                          }
                          const yearNum = parseInt(displayYear)
                          if (!isNaN(yearNum)) {
                            displayYear = String(yearNum - 1)
                          }
                        }
                        
                        return (
                          <th key={index} className="border border-gray-300 p-3 text-center text-gray-700 w-24">
                            {displayAge}<br/>{displayYear}
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 p-3 text-center font-medium bg-gray-50 w-20">天干十神</td>
                      {data.dayun.slice(0, 5).map((item, index) => (
                        <td key={index} className="border border-gray-300 p-3 text-center w-24">
                          <div className="text-sm text-gray-600">{item.shishen || ''}</div>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3 text-center font-medium bg-gray-50 w-20">干支</td>
                      {data.dayun.slice(0, 5).map((item, index) => {
                        const colors = getGanZhiColors(item.pillar)
                        return (
                          <td key={index} className="border border-gray-300 p-3 text-center w-24">
                            <div className="font-medium leading-tight">
                              <div className={colors.heavenlyColor}>{item.pillar[0]}</div>
                              <div className={colors.earthlyColor}>{item.pillar[1]}</div>
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3 text-center font-medium bg-gray-50 w-20">大运</td>
                      {data.dayun.slice(5, 10).map((item, index) => {
                        // 处理大运年龄和年份显示：这些是第6-10个大运，都需要-1
                        const realIndex = index + 5 // 实际索引
                        let displayAge = String(item.age || '')
                        let displayYear = String(item.year || '')
                        
                        // 第6-10个大运：年龄-1，年份-1
                        if (displayAge.includes('岁')) {
                          const ageNum = parseInt(displayAge.replace('岁', ''))
                          if (!isNaN(ageNum)) {
                            displayAge = `${ageNum - 1}岁`
                          }
                        }
                        const yearNum = parseInt(displayYear)
                        if (!isNaN(yearNum)) {
                          displayYear = String(yearNum - 1)
                        }
                        
                        return (
                          <td key={index} className="border border-gray-300 p-3 text-center text-gray-700 w-24">
                            {displayAge}<br/>{displayYear}
                          </td>
                        )
                      })}
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3 text-center font-medium bg-gray-50 w-20">天干十神</td>
                      {data.dayun.slice(5, 10).map((item, index) => (
                        <td key={index} className="border border-gray-300 p-3 text-center w-24">
                          <div className="text-sm text-gray-600">{item.shishen || ''}</div>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3 text-center font-medium bg-gray-50 w-20">干支</td>
                      {data.dayun.slice(5, 10).map((item, index) => {
                        const colors = getGanZhiColors(item.pillar)
                        return (
                          <td key={index} className="border border-gray-300 p-3 text-center w-24">
                            <div className="font-medium leading-tight">
                              <div className={colors.heavenlyColor}>{item.pillar[0]}</div>
                              <div className={colors.earthlyColor}>{item.pillar[1]}</div>
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
    </div>
  )
} 