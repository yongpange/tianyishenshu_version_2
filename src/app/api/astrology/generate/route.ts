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

// 提取城市名称函数：有县输入县，没有县输入市
function extractCityName(fullLocationName: string): string {
  try {
    // 去掉空格后进行解析
    const cleanName = fullLocationName.replace(/\s+/g, '')
    console.log(`🔍 正在解析地区名称: ${cleanName}`)
    
    // 优先级1：内蒙古自治区的盟优先级最高，无论后面跟什么
    if (cleanName.includes('内蒙古自治区') && cleanName.includes('盟')) {
      const innerMongoliaLeagueMatch = cleanName.match(/([^省区]*盟)/)
      if (innerMongoliaLeagueMatch) {
        console.log(`🏕️ 内蒙古自治区检测到盟级单位（最高优先级）: ${innerMongoliaLeagueMatch[1]}`)
        return innerMongoliaLeagueMatch[1]
      }
    }
    
    // 优先级2：如果是xxxx州xxxx市或xxxx州xxxx县格式，取最后的市或县
    const stateMatch = cleanName.match(/自治州([^自治州]*[市县])/)
    if (stateMatch) {
      console.log(`🏛️ 检测到州级单位下的市/县: ${stateMatch[1]}`)
      return stateMatch[1]
    }
    
    // 优先级3：如果包含"县"，取县
    const countyMatch = cleanName.match(/([^省市盟]*县)/)
    if (countyMatch) {
      console.log(`🏘️ 检测到县级单位: ${countyMatch[1]}`)
      return countyMatch[1]
    }
    
    // 优先级4：如果包含"盟"，取盟（处理其他地区的盟）
    const leagueMatch = cleanName.match(/([^省区]*盟)/)
    if (leagueMatch) {
      console.log(`🏕️ 检测到盟级单位: ${leagueMatch[1]}`)
      return leagueMatch[1]
    }
    
    // 优先级5：如果包含"市辖区"，取市辖区前面的市
    if (cleanName.includes('市辖区')) {
      const cityBeforeDistrictMatch = cleanName.match(/([^省区]*市)市辖区/)
      if (cityBeforeDistrictMatch) {
        console.log(`🏛️ 检测到市辖区，取前面的市: ${cityBeforeDistrictMatch[1]}`)
        return cityBeforeDistrictMatch[1]
      }
    }
    
    // 优先级6：如果包含多个"市"，取最后一个市
    // 这样可以处理"黑龙江省佳木斯市同江市"这种情况，取"同江市"而不是"佳木斯市"
    const cityMatches = cleanName.match(/([^省区盟市辖]*市)(?!辖区)/g)
    if (cityMatches && cityMatches.length > 0) {
      // 过滤掉可能的错误匹配，确保是真正的市名
      const validCities = cityMatches.filter(city => city.length > 1 && !city.includes('辖'))
      if (validCities.length > 0) {
        const lastCity = validCities[validCities.length - 1]
        console.log(`🏙️ 检测到${validCities.length}个市级单位: [${validCities.join(', ')}]，取最后一个: ${lastCity}`)
        return lastCity
      }
    }
    
    // 如果都没有匹配到，返回处理后的原名称
    console.log(`⚠️ 未能提取到标准的市/县/盟名称，使用原名称: ${cleanName}`)
    return cleanName
    
  } catch (error) {
    console.error('城市名称提取失败:', error)
    return fullLocationName.replace(/\s+/g, '')
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
    
    // 转换地区编码为实际名称，并提取所需的城市信息
    const cityNameWithSpaces = convertAreaCodeToName(userData)
    const cityName = extractCityName(cityNameWithSpaces) // 用于API调用的简化城市名
    
    // 手动构建查询字符串，对中文参数进行URL编码
    const queryString = [
      `name=${encodeURIComponent(name)}`, // 对name进行URL编码
      `sex=${sex}`,
      `year=${year}`,
      `month=${month}`,
      `day=${day}`,
      `hour=${hour}`,
      `minute=${minute}`,
      `city=${encodeURIComponent(cityName)}`, // 对city进行URL编码
      `islunar=0`,
      `istaiyang=1`  // 修复：使用真太阳时
    ].join('&')
    
    console.log('🔗 编码前参数:', { name, cityName: cityName, fullLocationName: cityNameWithSpaces })
    console.log('🔗 编码后查询字符串:', queryString)
    console.log('📍 地区信息: API调用用:', cityName, '| 前端显示用:', cityNameWithSpaces)
    
    console.log('使用的城市名称:', cityName)
    console.log('查询参数:', queryString)
    
    // 阿里云API配置
    const apiAddress = process.env.ALIYUN_APIADDRESS || ''
    const appCode = process.env.ALIYUN_APPCODE || ''
    console.log('appCode是：',appCode)
    const apiUrl = `${apiAddress}?${queryString}`
    
    console.log('apiUrl是：',apiUrl)
    // 调用阿里云API
    console.log('🚀 开始调用阿里云API:', {
      method: 'GET',
      url: apiUrl,
      headers: {
        'Authorization': `APPCODE ${appCode.substring(0, 8)}...`,
        'Content-Type': 'application/json; charset=UTF-8'
      }
    })
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `APPCODE ${appCode}`,
        'Content-Type': 'application/json; charset=UTF-8'
      }
    })
    
    console.log('📡 阿里云API响应状态:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ 阿里云API调用失败:', {
        status: response.status,
        statusText: response.statusText, 
        errorMessage: errorText,
        requestUrl: apiUrl
      })
      console.warn('⚠️ 因为API调用失败，将使用模拟数据，这会导致所有用户显示相同的农历、古历、真太阳时')
      // 如果API调用失败，返回模拟数据
      return NextResponse.json(getMockData(userData))
    }
    
    const apiResult = await response.json()
    console.log('🔍 阿里云API完整返回结果:', JSON.stringify(apiResult, null, 2))
    
    // 详细检查API返回的关键字段
    console.log('📊 API关键字段检查:', {
      status: apiResult?.status,
      hasResult: !!apiResult?.result,
      result: apiResult?.result ? {
        // 农历相关字段
        lunaryear: apiResult.result.lunaryear,
        lunarmonth: apiResult.result.lunarmonth, 
        lunarday: apiResult.result.lunarday,
        // 真太阳时相关字段
        year: apiResult.result.year,
        month: apiResult.result.month,
        day: apiResult.result.day,
        hour: apiResult.result.hour,
        minute: apiResult.result.minute,
        // 八字相关字段
        bazi: apiResult.result.bazi,
        // 其他字段
        city: apiResult.result.city
      } : null
    })
    
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
    console.error('❌ API数据验证失败，将使用模拟数据:', {
      hasApiData: !!apiData,
      status: apiData?.status,
      hasResult: !!apiData?.result,
      apiDataStructure: apiData
    })
    console.warn('⚠️ 因为API数据无效，将使用模拟数据，这会导致所有用户显示相同的农历、古历、真太阳时')
    return getMockData(userData)
  }
  
  console.log('✅ 阿里云API调用成功，开始转换数据')
  console.log('🎯 使用真实API数据生成农历、古历、真太阳时，每个用户都会有不同的结果')
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
      // 处理API返回的数据，按新规则调整年龄和年份
      let sui, year
      
      if (result.dayun.sui?.[i]) {
        // API返回了年龄数据，需要按新规则调整
        const apiSui = result.dayun.sui[i]
        if (i === 0) {
          // 第一个大运：保持起始年龄1岁不变，但结束年龄+1
          if (apiSui.includes('-')) {
            sui = apiSui.replace(/1-(\d+)岁/, (match: string, endAge: string) => `1-${parseInt(endAge) + 1}岁`)
          } else {
            sui = '1-9岁' // 默认情况
          }
        } else {
          // 其余大运：年龄+1
          if (apiSui.includes('岁')) {
            const ageNum = parseInt(apiSui.replace('岁', ''))
            sui = `${ageNum + 1}岁`
          } else {
            sui = `${i * 10}岁`
          }
        }
      } else {
        // API没有返回年龄数据，使用默认计算
        sui = i === 0 ? '1-9岁' : `${i * 10}岁`
      }
      
      if (result.dayun.year?.[i]) {
        // API返回了年份数据，需要按新规则调整
        const apiYear = parseInt(result.dayun.year[i])
        if (i === 0) {
          // 第一个大运年份保持不变
          year = apiYear
        } else {
          // 其余大运年份+1
          year = apiYear + 1
        }
      } else {
        // API没有返回年份数据，使用默认计算
        year = i === 0 ? '2000' : (2000 + i * 10)
      }
      
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
    // 始终使用完整的地区名称（不是提取后的城市名称）
    const fullLocationName = convertAreaCodeToName(userData)
    console.log('fullLocationName', fullLocationName)
    if (!fullLocationName) return city || '北京市'
    
    // 如果包含市辖区，需要规范化格式
    if (fullLocationName.includes('市辖区')) {
      // 先去掉所有多余的空格，重新标准化格式
      let cleanName = fullLocationName.replace(/\s+/g, '')
      console.log('cleanName after removing spaces:', cleanName)
      
      // 使用正则表达式来处理各种情况：
      // 天津市市辖区和平区 -> 天津市 市辖区 和平区
      // 天津市辖区和平区 -> 天津市 市辖区 和平区
      let result
      
      // 如果是"X市市辖区Y"格式
      if (/(.+市)市辖区(.+)/.test(cleanName)) {
        result = cleanName.replace(/(.+市)市辖区(.+)/, '$1 市辖区 $2')
      }
      // 如果是"X市辖区Y"格式（只有一个市字）
      else if (/(.+)市辖区(.+)/.test(cleanName)) {
        result = cleanName.replace(/(.+)市辖区(.+)/, '$1市 市辖区 $2')
      }
      // 兜底情况
      else {
        result = cleanName
      }
      
      console.log('formatted result:', result)
      return result
    }
    
    // 其他情况保持原样
    return fullLocationName
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

  // 生成各种日期格式并详细记录数据来源
  const solarDate = `${result.year}年${String(result.month).padStart(2, '0')}月${String(result.day).padStart(2, '0')}日 ${String(result.hour).padStart(2, '0')}:${String(result.minute).padStart(2, '0')} ${result.lunarhour || '午时'}`
  const lunarDate = `${formatLunarYear(result.lunaryear)}年${result.lunarmonth}${result.lunarday}日`
  const ancientDate = `${yearGanZhi}年${monthGanZhi}月${dayGanZhi}日${hourGanZhi}时`
  const trueSolarTime = `${result.year}年${String(result.month).padStart(2, '0')}月${String(result.day).padStart(2, '0')}日 ${String(result.hour).padStart(2, '0')}:${String(result.minute).padStart(2, '0')}`

  console.log('🗓️ 各种日期格式生成详情:')
  console.log('📅 阳历生辰 (solarDate):', {
    生成结果: solarDate,
    数据来源: `年:${result.year}, 月:${result.month}, 日:${result.day}, 时:${result.hour}, 分:${result.minute}, 时辰:${result.lunarhour || '午时'}`
  })
  console.log('🌙 农历生辰 (lunarDate):', {
    生成结果: lunarDate,
    数据来源: `农历年:${result.lunaryear}, 农历月:${result.lunarmonth}, 农历日:${result.lunarday}`,
    原始数据: { lunaryear: result.lunaryear, lunarmonth: result.lunarmonth, lunarday: result.lunarday }
  })
  console.log('📊 古历生辰 (ancientDate):', {
    生成结果: ancientDate,
    数据来源: `八字干支 - 年柱:${yearGanZhi}, 月柱:${monthGanZhi}, 日柱:${dayGanZhi}, 时柱:${hourGanZhi}`,
    原始八字数据: bazi
  })
  console.log('☀️ 真太阳时 (trueSolarTime):', {
    生成结果: trueSolarTime,
    数据来源: `年:${result.year}, 月:${result.month}, 日:${result.day}, 时:${result.hour}, 分:${result.minute}`,
    说明: '与阳历生辰使用相同的API时间字段，但格式略有不同'
  })

  return {
    solarDate,
    lunarDate,
    ancientDate,
    trueSolarTime,
    birthplace: formatBirthplace(''), // 传空字符串，函数内部会使用完整地区名称
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
  const mockSui = ["1-9岁", "10岁", "20岁", "30岁", "40岁", "50岁", "60岁", "70岁", "80岁", "90岁"]
  const mockYear = ["2000", 2010, 2020, 2030, 2040, 2050, 2060, 2070, 2080, 2090]
  
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
  console.log('⚠️ 使用模拟数据 - 各种日期格式详情:')
  console.log('📅 阳历生辰 (solarDate):', {
    生成结果: userData.birthDate ? formatDate(userData.birthDate, userData.birthTime || '10:13') : '2025年07月02日 10:13',
    数据来源: '来自传入的userData参数 或 固定的模拟值'
  })
  console.log('🌙 农历生辰 (lunarDate):', {
    生成结果: '二零二五年六月初八日',
    数据来源: '硬编码的固定模拟值 - 这就是为什么所有用户显示相同农历的原因'
  })
  console.log('📊 古历生辰 (ancientDate):', {
    生成结果: '二零二五年六月初八日',
    数据来源: '硬编码的固定模拟值 - 这就是为什么所有用户显示相同古历的原因'
  })
  console.log('☀️ 真太阳时 (trueSolarTime):', {
    生成结果: '2025年07月02日 09:35',
    数据来源: '硬编码的固定模拟值 - 这就是为什么所有用户显示相同真太阳时的原因'
  })
  console.log('❗ 模拟数据原因: 阿里云API调用失败或未正确配置ALIYUN_APPCODE')
  
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