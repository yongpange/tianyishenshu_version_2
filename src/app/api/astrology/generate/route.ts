import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// 地区编码转换函数（保留给需要显示用）
function convertAreaCodeToName(userData: any) {
  try {
    // 如果region是字符串格式的编码（如 "11 1101 110105"），尝试转换
    if (typeof userData.region === 'string' && userData.region.includes(' ')) {
      const codes = userData.region.split(' ').filter(Boolean)
      if (codes.length >= 2) {
        // 读取地区数据文件
        const pcaDataPath = path.join(process.cwd(), 'public', 'pca-code.json')
        if (fs.existsSync(pcaDataPath)) {
          const pcaData = JSON.parse(fs.readFileSync(pcaDataPath, 'utf8'))
          
          // 查找省份
          const province = pcaData.find((p: any) => p.code === codes[0])
          if (province) {
            // 查找城市
            const city = province.children?.find((c: any) => c.code === codes[1])
            if (city) {
              // 查找区县
              const district = city.children?.find((d: any) => d.code === codes[2])
              if (district) {
                return `${province.name} ${city.name} ${district.name}`
              }
              return `${province.name} ${city.name}`
            }
            return province.name
          }
        }
      }
    }
    
    // 如果转换失败，返回原值或默认值
    return userData.region || '北京市'
  } catch (error) {
    console.error('地区编码转换失败:', error)
    return userData.region || '北京市'
  }
}

export async function POST(request: Request) {
  try {
    const userData = await request.json()
    
      
    // 从用户数据中提取必要信息
    const { name, gender, birthDate, birthTime, region } = userData
    
    if (!name || !birthDate || !birthTime || !region) {
      return NextResponse.json({ error: '缺少必要的用户信息' }, { status: 400 })
    }
    
    // 解析出生日期和时间
    const date = new Date(birthDate)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    
    // 解析出生时间
    const timeParts = birthTime.split(':')
    const hour = parseInt(timeParts[0])
    const minute = parseInt(timeParts[1]) || 0
    
    // 性别转换：male -> 1, female -> 0
    const sex = gender === 'male' ? '1' : '0'
    
    // 转换地区编码为实际名称，并去掉空格
    const cityNameWithSpaces = convertAreaCodeToName(userData)
    const cityName = cityNameWithSpaces.replace(/\s+/g, '') // 去掉所有空格
    
    // 手动构建查询字符串，避免URL编码name和city参数
    const queryString = [
      `name=${name}`, // 不对name进行编码，保持汉字形式
      `sex=${sex}`,
      `year=${year}`,
      `month=${month}`,
      `day=${day}`,
      `hour=${hour}`,
      `minute=${minute}`,
      `city=${cityName}`, // 不对city进行编码
      `islunar=0`,
      `istaiyang=0`
    ].join('&')
    
    console.log('使用的城市名称:', cityName)
    console.log('查询参数:', queryString)
    
    // 阿里云API配置
    const apiAddress = process.env.ALIYUN_APIADDRESS || ''
    const appCode = process.env.ALIYUN_APPCODE || ''
    console.log('appCode是：',appCode)
    const apiUrl = `${apiAddress}?${queryString}`
    
    console.log('apiUrl是：',apiUrl)
    // 调用阿里云API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `APPCODE ${appCode}`,
        'Content-Type': 'application/json; charset=UTF-8'
      }
    })
    
    if (!response.ok) {
      console.error('API调用失败，状态码:', response.status)
      console.error('错误信息:', await response.text())
      // 如果API调用失败，返回模拟数据
      return NextResponse.json(getMockData(userData))
    }
    
    const apiResult = await response.json()
    console.log('API返回结果:', apiResult)
    
    // 转换API返回的数据格式为前端需要的格式
    const transformedData = transformApiData(apiResult, userData)
    
    return NextResponse.json(transformedData)
    
  } catch (error) {
    console.error('八字排盘API调用错误:', error)
    // 出错时返回模拟数据
    return NextResponse.json(getMockData({}))
  }
}

// 天干地支映射
const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

// 五行映射
const ELEMENT_MAP: { [key: string]: string } = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', 
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土',
  '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金',
  '戌': '土', '亥': '水'
}

// 阴阳属性映射
const YIN_YANG_MAP: { [key: string]: string } = {
  '甲': '阳木', '乙': '阴木', '丙': '阳火', '丁': '阴火', '戊': '阳土',
  '己': '阴土', '庚': '阳金', '辛': '阴金', '壬': '阳水', '癸': '阴水'
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

// 地支藏干映射
const HIDDEN_STEMS_MAP: { [key: string]: string[] } = {
  '子': ['癸'],
  '丑': ['己', '癸', '辛'],
  '寅': ['甲', '丙', '戊'],
  '卯': ['乙'],
  '辰': ['戊', '乙', '癸'],
  '巳': ['丙', '戊', '庚'],
  '午': ['丁', '己'],
  '未': ['己', '丁', '乙'],
  '申': ['庚', '壬', '戊'],
  '酉': ['辛'],
  '戌': ['戊', '辛', '丁'],
  '亥': ['壬', '甲']
}

// 解析干支字符串
function parseGanZhi(ganZhi: string) {
  if (!ganZhi || ganZhi.length < 2) {
    return { 
      heavenly: '甲', 
      earthly: '子', 
      element: '木', 
      elementType: '阳木', 
      hiddenStems: ['癸'],
      heavenlyColor: 'text-green-600',
      earthlyColor: 'text-black'
    }
  }
  
  const heavenly = ganZhi[0]
  const earthly = ganZhi[1]
  const element = ELEMENT_MAP[heavenly] || '木'
  const elementType = YIN_YANG_MAP[heavenly] || '阳木'
  const hiddenStems = HIDDEN_STEMS_MAP[earthly] || ['癸']
  const heavenlyColor = HEAVENLY_STEM_COLORS[heavenly] || 'text-gray-600'
  const earthlyColor = EARTHLY_BRANCH_COLORS[earthly] || 'text-gray-600'
  
  return {
    heavenly,
    earthly,
    element,
    elementType,
    hiddenStems,
    heavenlyColor,
    earthlyColor
  }
}

// 转换API数据格式
function transformApiData(apiData: any, userData: any) {
  // 检查API是否成功返回数据
  if (!apiData || apiData.status !== 0 || !apiData.result) {
    console.log('API数据无效，使用模拟数据')
    console.log('apiData状态:', apiData?.status)
    console.log('apiData结构:', apiData)
    return getMockData(userData)
  }
  
  console.log('API调用成功，开始转换数据')
  const result = apiData.result
  
  // 解析八字
  const bazi = result.bazi || ['己卯', '丁丑', '己丑', '庚午']
  const [yearGanZhi, monthGanZhi, dayGanZhi, hourGanZhi] = bazi
  
  const yearPillar = parseGanZhi(yearGanZhi)
  const monthPillar = parseGanZhi(monthGanZhi)
  const dayPillar = parseGanZhi(dayGanZhi)
  const hourPillar = parseGanZhi(hourGanZhi)
  
  // 获取纳音
  const nayin = result.nayin || ['城头土', '涧下水', '霹雳火', '路旁土']
  
  // 构建大运数据
  const dayunData = []
  if (result.dayun && result.dayun.ganzhi && Array.isArray(result.dayun.ganzhi)) {
    console.log('使用API大运数据:')
    console.log('sui数据:', result.dayun.sui)
    console.log('year数据:', result.dayun.year)
    console.log('ganzhi数据:', result.dayun.ganzhi)
    
    for (let i = 0; i < Math.min(result.dayun.ganzhi.length, 10); i++) {
      // 严格使用API返回的sui和year数据，不进行计算
      const sui = result.dayun.sui?.[i] || (i === 0 ? '1-8岁' : `${i * 10 - 1}岁`)
      const year = result.dayun.year?.[i] || (i === 0 ? '2000' : (2000 + i * 10 - 1))
      const ganZhi = result.dayun.ganzhi[i]
      const pillarInfo = parseGanZhi(ganZhi)
      
      console.log(`大运${i}: sui=${sui}, year=${year}, ganZhi=${ganZhi}`)
      
      dayunData.push({
        age: sui,
        year: year,
        pillar: ganZhi,
        color: 'text-gray-600', // 颜色现在由前端根据天干地支自动计算
        element: pillarInfo.element,
        elementType: pillarInfo.elementType,
        shishen: result.dayun.shishen?.[i] || '',
        nayin: result.dayun.nayin?.[i] || ''
      })
    }
  } else {
    console.log('API大运数据无效，检查以下数据:')
    console.log('result.dayun:', result.dayun)
    console.log('result.dayun?.ganzhi:', result.dayun?.ganzhi)
  }
  
  // 如果大运数据为空，使用模拟数据
  if (dayunData.length === 0) {
    console.log('大运数据为空，使用模拟数据')
    dayunData.push(...getMockDayun())
  } else {
    console.log('成功构建大运数据，共', dayunData.length, '条')
  }
  
  // 数字转中文
  const numberToChinese = (num: number): string => {
    const chinese = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九']
    return num.toString().split('').map(digit => chinese[parseInt(digit)]).join('')
  }

  // 格式化农历年份
  const formatLunarYear = (year: number): string => {
    return numberToChinese(year)
  }

  // 格式化出生地区，添加空格分隔
  const formatBirthplace = (city: string): string => {
    if (!city) return convertAreaCodeToName(userData)
    
    // 如果是北京市市辖区朝阳区这种格式，添加空格
    if (city.includes('市辖区')) {
      return city.replace(/市辖区/, '市 市辖区 ').replace(/区$/, '区')
    }
    
    // 其他情况保持原样
    return city
  }

  // 获取神煞数据
  const getShenSha = (shensha: any, index: number): string => {
    if (!shensha || !Array.isArray(shensha) || !shensha[index]) {
      return '空亡'
    }
    
    const shenshaArray = shensha[index]
    if (Array.isArray(shenshaArray)) {
      return shenshaArray.join(' ')
    }
    
    return String(shenshaArray)
  }

  return {
    solarDate: `${result.year}年${String(result.month).padStart(2, '0')}月${String(result.day).padStart(2, '0')}日 ${String(result.hour).padStart(2, '0')}:${String(result.minute).padStart(2, '0')} ${result.lunarhour || '午时'}`,
    lunarDate: `${formatLunarYear(result.lunaryear)}年${result.lunarmonth}${result.lunarday}日`,
    ancientDate: `${yearGanZhi}年${monthGanZhi}月${dayGanZhi}日${hourGanZhi}时`,
    trueSolarTime: `${result.year}年${String(result.month).padStart(2, '0')}月${String(result.day).padStart(2, '0')}日 ${String(result.hour).padStart(2, '0')}:${String(result.minute).padStart(2, '0')}`,
    birthplace: formatBirthplace(result.city || convertAreaCodeToName(userData)),
    bazi: bazi, // 添加八字数据
    paipan: {
      solarYear: parseInt(result.year),
      solarMonth: parseInt(result.month),
      solarDay: parseInt(result.day),
      solarHour: parseInt(result.hour),
      yearPillar,
      monthPillar,
      dayPillar,
      hourPillar,
      yearElement: yearPillar.element,
      monthElement: monthPillar.element,
      dayElement: dayPillar.element,
      hourElement: hourPillar.element,
      yearStar: nayin[0] || '城头土',
      monthStar: nayin[1] || '涧下水',
      dayStar: nayin[2] || '霹雳火',
      hourStar: nayin[3] || '路旁土'
    },
    yearElement: yearPillar.element,
    monthElement: monthPillar.element,
    dayElement: dayPillar.element,
    hourElement: hourPillar.element,
    yearStar: nayin[0] || '城头土',
    monthStar: nayin[1] || '涧下水',
    dayStar: nayin[2] || '霹雳火',
    hourStar: nayin[3] || '路旁土',
    shensha: {
      year: getShenSha(result.shensha, 0),
      month: getShenSha(result.shensha, 1),
      day: getShenSha(result.shensha, 2),
      hour: getShenSha(result.shensha, 3)
    },
    qiankunzao: result.qiankunzao || [
      ['比肩', '偏印', '日元', '伤官'],
      ['己卯', '丁丑', '己丑', '庚午', '(午未空)'],
      [
        ['乙七杀', '癸偏财', '癸偏财', '己比肩'],
        ['', '辛食神', '辛食神', '丁偏印'],
        ['', '己比肩', '己比肩', '']
      ]
    ],
    dayun: dayunData
  }
}

// 格式化日期
function formatDate(dateStr: string, timeStr: string) {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}年${month}月${day}日 ${timeStr}`
}

// 获取模拟大运数据
function getMockDayun() {
  const mockShishen = ["偏印", "正印", "七杀", "正官", "偏财", "正财", "食神", "伤官", "比肩", "劫财"]
  const mockNayin = ["漳下水", "漳下水", "山头火", "山头火", "剑锋金", "剑锋金", "路旁土", "路旁土", "大林木", "大林木"]
  const mockSui = ["1-8岁", "9岁", "19岁", "29岁", "39岁", "49岁", "59岁", "69岁", "79岁", "89岁"]
  const mockYear = ["2000", 2009, 2019, 2029, 2039, 2049, 2059, 2069, 2079, 2089]
  
  return [
    { age: mockSui[0], year: mockYear[0], pillar: '丁丑', color: 'text-gray-600', element: '火', elementType: '阳火', shishen: mockShishen[0], nayin: mockNayin[0] },
    { age: mockSui[1], year: mockYear[1], pillar: '丙子', color: 'text-gray-600', element: '火', elementType: '阳火', shishen: mockShishen[1], nayin: mockNayin[1] },
    { age: mockSui[2], year: mockYear[2], pillar: '乙亥', color: 'text-gray-600', element: '木', elementType: '阴木', shishen: mockShishen[2], nayin: mockNayin[2] },
    { age: mockSui[3], year: mockYear[3], pillar: '甲戌', color: 'text-gray-600', element: '木', elementType: '阳木', shishen: mockShishen[3], nayin: mockNayin[3] },
    { age: mockSui[4], year: mockYear[4], pillar: '癸酉', color: 'text-gray-600', element: '水', elementType: '阴水', shishen: mockShishen[4], nayin: mockNayin[4] },
    { age: mockSui[5], year: mockYear[5], pillar: '壬申', color: 'text-gray-600', element: '水', elementType: '阳水', shishen: mockShishen[5], nayin: mockNayin[5] },
    { age: mockSui[6], year: mockYear[6], pillar: '辛未', color: 'text-gray-600', element: '金', elementType: '阴金', shishen: mockShishen[6], nayin: mockNayin[6] },
    { age: mockSui[7], year: mockYear[7], pillar: '庚午', color: 'text-gray-600', element: '金', elementType: '阳金', shishen: mockShishen[7], nayin: mockNayin[7] },
    { age: mockSui[8], year: mockYear[8], pillar: '己巳', color: 'text-gray-600', element: '土', elementType: '阴土', shishen: mockShishen[8], nayin: mockNayin[8] },
    { age: mockSui[9], year: mockYear[9], pillar: '戊辰', color: 'text-gray-600', element: '土', elementType: '阳土', shishen: mockShishen[9], nayin: mockNayin[9] }
  ]
}

// 获取模拟数据
function getMockData(userData: any) {
  return {
    solarDate: userData.birthDate ? formatDate(userData.birthDate, userData.birthTime || '10:13') : '2025年07月02日 10:13',
    lunarDate: '二零二五年六月初八日',
    ancientDate: '二零二五年六月初八日',
    trueSolarTime: '2025年07月02日 09:35',
    birthplace: convertAreaCodeToName(userData),
    bazi: ['丙寅', '丁酉', '壬子', '壬寅'], // 添加模拟八字数据
    paipan: {
      solarYear: userData.birthDate ? new Date(userData.birthDate).getFullYear() : 1986,
      solarMonth: userData.birthDate ? new Date(userData.birthDate).getMonth() + 1 : 9,
      solarDay: userData.birthDate ? new Date(userData.birthDate).getDate() : 25,
      solarHour: userData.birthTime ? parseInt(userData.birthTime.split(':')[0]) : 3,
      yearPillar: { heavenly: '丙', earthly: '寅', element: '炉中火', elementType: '偏财' },
      monthPillar: { heavenly: '丁', earthly: '酉', element: '山下火', elementType: '正财' },
      dayPillar: { heavenly: '壬', earthly: '子', element: '桑柘木', elementType: '日主' },
      hourPillar: { heavenly: '壬', earthly: '寅', element: '金箔金', elementType: '比肩' },
      yearElement: '甲食神',
      monthElement: '辛正印',
      dayElement: '王比肩',
      hourElement: '甲食神',
      yearStar: '炉中火',
      monthStar: '山下火',
      dayStar: '桑柘木',
      hourStar: '金箔金'
    },
    yearElement: '炉中火',
    monthElement: '山下火',
    dayElement: '桑柘木',
    hourElement: '金箔金',
    yearStar: '空亡天乙贵人将星',
    monthStar: '空亡天乙贵人太极贵人',
    dayStar: '空亡天乙贵人红艳煞',
    hourStar: '空亡天乙贵人太极贵人',
    shensha: {
      year: '空亡天乙贵人将星',
      month: '空亡天乙贵人太极贵人',
      day: '空亡天乙贵人红艳煞',
      hour: '空亡天乙贵人太极贵人'
    },
    qiankunzao: [
      ['比肩', '偏印', '日元', '伤官'],
      ['己卯', '丁丑', '己丑', '庚午', '(午未空)'],
      [
        ['乙七杀', '癸偏财', '癸偏财', '己比肩'],
        ['', '辛食神', '辛食神', '丁偏印'],
        ['', '己比肩', '己比肩', '']
      ]
    ],
    dayun: getMockDayun()
  }
} 