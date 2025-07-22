import { UserInfo } from '@/lib/coze-client'
import { PersonalityReport, storageManager } from '@/lib/storage-adapter'
import { calculateUserDataHash, generateReportId, formatAreaDisplay } from '@/utils/client-utils'
import fs from 'fs'
import path from 'path'
import { supabaseAdmin } from '@/lib/supabase'

// 统一处理用户ID到user_profiles.id的转换
export async function getUserProfileId(userId: string, isUserProfileId: boolean = false): Promise<string | null> {
  try {
    if (isUserProfileId) {
      // 直接使用传入的userId作为user_profiles.id
      return userId
    }

    // 根据users.id或手机号查找user_profiles.id
    console.log('🔍 转换用户ID到user_profiles.id:', userId)
    
    // 先假设是users.id，然后尝试手机号
    let user: any = null
    
    // 检查是否是UUID格式（可能是users.id）
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', userId)
        .single()
      
      if (!userError && userData) {
        user = userData
      }
    }
    
    // 如果不是users.id，尝试作为手机号查找
    if (!user) {
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('phone_number', userId)
        .single()
      
      if (userError || !userData) {
        console.warn('⚠️ 未找到用户记录:', userId)
        return null
      }
      user = userData
    }

    // 查找user_profiles
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !userProfile) {
      console.warn('⚠️ 未找到用户资料:', user.id)
      return null
    }

    console.log('✅ 成功转换到user_profiles.id:', userProfile.id)
    return userProfile.id

  } catch (error) {
    console.error('❌ 转换用户ID失败:', error)
    return null
  }
}

// 干支数据类型
interface GanZhiData {
  year: number
  tianGan: string
  diZhi: string
  ganZhi: string
}

// 干支数据缓存
let ganZhiDataCache: GanZhiData[] | null = null

// 十神表数据类型
interface ShishenTable {
  [key: string]: { [key: string]: string }
}

// 十神表数据缓存
let shishenTableCache: ShishenTable | null = null

// 藏干表数据类型
interface CangGanTable {
  [dizhi: string]: {
    benqi?: string // 地支本气
    zhongqi?: string // 地支中气
    yuqi?: string // 地支余气
  }
}

// 藏干表数据缓存
let cangganTableCache: CangGanTable | null = null

// 读取干支历法CSV文件
function loadGanZhiData(): GanZhiData[] {
  if (ganZhiDataCache) {
    return ganZhiDataCache
  }
  
  try {
    const csvPath = path.join(process.cwd(), 'public', 'ganzhi-calendar.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    const lines = csvContent.trim().split('\n')
    
    // 跳过标题行，解析数据
    const data: GanZhiData[] = []
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line) {
        const [yearStr, tianGan, diZhi, ganZhi] = line.split(',')
        data.push({
          year: parseInt(yearStr),
          tianGan,
          diZhi,
          ganZhi
        })
      }
    }
    
    // 缓存数据
    ganZhiDataCache = data
    console.log(`✅ 成功加载干支历法数据，共 ${data.length} 条记录`)
    
    return data
  } catch (error) {
    console.error('读取干支历法数据失败:', error)
    return []
  }
}

// 根据年份获取干支
function getGanZhiByYear(year: number): string {
  try {
    const ganZhiData = loadGanZhiData()
    const found = ganZhiData.find(item => item.year === year)
    if (found) {
      return found.ganZhi
    } else {
      console.warn(`未找到 ${year} 年的干支数据，使用默认值`)
      return '甲子'
    }
  } catch (error) {
    console.error('获取干支失败:', error)
    return '甲子'
  }
}

// 读取十神表CSV文件
function loadShishenTable(): ShishenTable {
  if (shishenTableCache) {
    return shishenTableCache
  }
  
  try {
    const csvPath = path.join(process.cwd(), 'public', 'shishen-table.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    const lines = csvContent.trim().split('\n')
    
    // 解析表头（天干地支）
    const headers = lines[0].split(',').slice(1).map(h => h.trim()) // 去掉第一列"日主"并清理空格
    
    // 解析数据
    const table: ShishenTable = {}
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line) {
        const columns = line.split(',')
        const rizhu = columns[0] // 日主
        table[rizhu] = {}
        
        // 建立日主与其他干支的十神关系
        for (let j = 1; j < columns.length; j++) {
          const header = headers[j - 1]
          const shishen = columns[j]?.trim() // 清理空格和换行符
          if (header && shishen) {
            table[rizhu][header] = shishen
          }
        }
      }
    }
    
    // 缓存数据
    shishenTableCache = table
    // console.log(`✅ 成功加载十神表数据，共 ${Object.keys(table).length} 个日主`)
    
    // 调试：检查己的关系
    // if (table['己']) {
    //   console.log('🔍 己的关系表:', table['己'])
    //   console.log('🔍 己-丑关系:', table['己']['丑'])
    //   console.log('🔍 己-卯关系:', table['己']['卯'])
    // }
    
    return table
  } catch (error) {
    console.error('读取十神表数据失败:', error)
    return {}
  }
}

// 读取藏干表CSV文件
function loadCangGanTable(): CangGanTable {
  if (cangganTableCache) {
    return cangganTableCache
  }
  
  try {
    const csvPath = path.join(process.cwd(), 'public', 'canggan-table.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    const lines = csvContent.trim().split('\n')
    
    if (lines.length < 4) {
      console.error('藏干表数据格式错误，行数不足')
      return {}
    }
    
    // 解析表头（地支）
    const dizhiHeaders = lines[0].split(',').slice(1).map(h => h.trim())
    const benqiData = lines[1].split(',').slice(1).map(h => h.trim())
    const zhongqiData = lines[2].split(',').slice(1).map(h => h.trim())
    const yuqiData = lines[3].split(',').slice(1).map(h => h.trim())
    
    const table: CangGanTable = {}
    
    // 建立每个地支的藏干关系
    dizhiHeaders.forEach((dizhi, index) => {
      if (dizhi) {
        table[dizhi] = {
          benqi: benqiData[index] || undefined,
          zhongqi: zhongqiData[index] || undefined,
          yuqi: yuqiData[index] || undefined
        }
      }
    })
    
    // 缓存数据
    cangganTableCache = table
    // console.log(`✅ 成功加载藏干表数据，共 ${Object.keys(table).length} 个地支`)
    
    return table
  } catch (error) {
    console.error('读取藏干表数据失败:', error)
    return {}
  }
}

// 根据地支获取藏干信息
function getCangGanByDiZhi(dizhi: string) {
  const cangganTable = loadCangGanTable()
  return cangganTable[dizhi] || { benqi: undefined, zhongqi: undefined, yuqi: undefined }
}

// 根据日主和天干计算十神
function getShishenByTianGan(rizhu: string, tiangan: string): string {
  try {
    const shishenTable = loadShishenTable()
    // console.log(`🔍 计算天干十神 - 日主:${rizhu}, 天干:${tiangan}`)
    
    if (shishenTable[rizhu]) {
      const shishen = shishenTable[rizhu][tiangan]
      if (shishen) {
        return shishen
      } else {
        console.warn(`❌ 未找到日主${rizhu}与天干${tiangan}的十神关系`)
        return ''
      }
    } else {
      console.warn(`❌ 十神表中不存在日主${rizhu}`)
      return ''
    }
  } catch (error) {
    console.error('❌ 计算天干十神失败:', error)
    return ''
  }
}

// 根据日主和地支计算十神
function getShishenByDiZhi(rizhu: string, dizhi: string): string {
  try {
    const shishenTable = loadShishenTable()
    // console.log(`🔍 计算十神 - 日主:${rizhu}, 地支:${dizhi}`)
    // console.log(`🔍 十神表中日主${rizhu}存在:`, !!shishenTable[rizhu])
    
    if (shishenTable[rizhu]) {
      // console.log(`🔍 日主${rizhu}的所有关系:`, Object.keys(shishenTable[rizhu]))
      // console.log(`🔍 地支${dizhi}对应的十神:`, shishenTable[rizhu][dizhi])
      
      if (shishenTable[rizhu][dizhi]) {
        return shishenTable[rizhu][dizhi]
      } else {
        console.warn(`❌ 未找到日主${rizhu}与地支${dizhi}的十神关系`)
        return ''
      }
    } else {
      console.warn(`❌ 十神表中不存在日主${rizhu}`)
      return ''
    }
  } catch (error) {
    console.error('❌ 计算地支十神失败:', error)
    return ''
  }
}

// 生成步骤枚举
export enum GenerationStep {
  ANALYZING = 'analyzing',
  GENERATING = 'generating', 
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// 步骤消息映射
export const stepMessages = {
  analyzing: "正在分析出生信息...",
  generating: "正在生成性格报告...",
  completed: "报告生成完成",
  failed: "生成失败，请重试"
}



// 检查是否需要重新生成报告
export async function checkIfRegenerationNeeded(userInfo: UserInfo, userId: string): Promise<boolean> {
  try {
    const existingReport = await storageManager.getPersonalityReport(userId)
    
    if (!existingReport) {
      return true // 没有报告，需要生成
    }
    
    const currentHash = calculateUserDataHash(userInfo)
    
    if (existingReport.userDataHash !== currentHash) {
      return true // 用户信息已变更，需要重新生成
    }
    
    return false // 不需要重新生成
  } catch (error) {
    console.error('检查重新生成需求失败:', error)
    return true // 出错时默认重新生成
  }
}



// 创建性格报告对象
export function createPersonalityReport(
  userId: string,
  content: string,
  userInfo: UserInfo,
  conversationId?: string
): PersonalityReport {
  return {
    id: generateReportId(),
    userId,
    content,
    generatedAt: new Date(),
    userDataHash: calculateUserDataHash(userInfo),
    cozeConversationId: conversationId
  }
}

// 获取性格报告
export async function getPersonalityReport(userId: string): Promise<PersonalityReport | null> {
  try {
    return await storageManager.getPersonalityReport(userId)
  } catch (error) {
    console.error('获取性格报告失败:', error)
    return null
  }
}

// 保存性格报告
export async function savePersonalityReport(report: PersonalityReport, userProfileId: string): Promise<void> {
  try {
    await storageManager.savePersonalityReport(userProfileId, report)
  } catch (error) {
    console.error('保存性格报告失败:', error)
    throw error
  }
}

// 保存性格报告（包含八字上下文）
export async function savePersonalityReportWithAstrology(report: PersonalityReport, userProfileId: string, astrologyContext: string): Promise<void> {
  try {
    await storageManager.savePersonalityReportWithAstrology(userProfileId, report, astrologyContext)
  } catch (error) {
    console.error('保存性格报告（含八字上下文）失败:', error)
    throw error
  }
}

// 清除性格报告
export async function clearPersonalityReport(userId: string): Promise<void> {
  try {
    await storageManager.clearPersonalityReport(userId)
  } catch (error) {
    console.error('清除性格报告失败:', error)
    throw error
  }
}



// 获取八字排盘数据 - 直接从数据库读取
export async function getAstrologyContext(userInfo: UserInfo, userId?: string, isUserProfileId: boolean = true): Promise<string> {
  try {
    // 如果没有提供userId，返回基础信息
    if (!userId) {
      console.log('⚠️ 未提供用户ID，返回基础八字信息')
      return formatBasicAstrologyInfo(userInfo)
    }

    console.log('🔮 从数据库获取八字排盘数据:', userId)
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/bazi/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        isUserProfileId: isUserProfileId
      })
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success && result.astrologyContext) {
        console.log('✅ 从数据库获取八字排盘数据成功，长度:', result.astrologyContext.length)
        return result.astrologyContext
      }
      
      if (result.error === 'REPORT_NOT_FOUND') {
        console.log('📋 用户暂无八字排盘数据，可能需要重新生成')
        return formatBasicAstrologyInfo(userInfo) + '\n\n【提示：用户暂无详细八字排盘数据，建议基于基础出生信息进行分析】'
      }
    }
    
    console.log('⚠️ 获取八字排盘数据失败，返回基础信息')
    return formatBasicAstrologyInfo(userInfo)

  } catch (error) {
    console.error('❌ 获取八字排盘数据失败:', error)
    return formatBasicAstrologyInfo(userInfo)
  }
}

// 获取八字数据（直接从数据库读取）
export async function getBaziData(userId: string, isUserProfileId: boolean = true): Promise<any> {
  try {
    console.log('🔮 从数据库获取八字数据:', { userId, isUserProfileId })
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const getResponse = await fetch(`${baseUrl}/api/bazi/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        isUserProfileId: isUserProfileId
      })
    })

    if (getResponse.ok) {
      const getResult = await getResponse.json()
      if (getResult.success && getResult.report) {
        console.log('✅ 从数据库获取八字数据成功')
        return getResult.report
      }
    }

    console.log('⚠️ 数据库中无八字数据')
    throw new Error('数据库中无八字数据')

  } catch (error) {
    console.error('❌ 获取八字数据失败:', error)
    throw error
  }
}

// 格式化完整的八字排盘提示词
export function formatAstrologyPrompt(astrologyData: any, userInfo: UserInfo): string {
  const context = []
  
  // 调试信息
  // console.log('🔍 formatAstrologyPrompt - astrologyData keys:', Object.keys(astrologyData))
  // console.log('🔍 astrologyData.paipan 存在:', !!astrologyData.paipan)
  // console.log('🔍 astrologyData.bazi 存在:', !!astrologyData.bazi)
  // console.log('🔍 astrologyData.bazi 内容:', astrologyData.bazi)
  // if (astrologyData.bazi) {
  //   console.log('🔍 astrologyData.bazi[2] 存在:', !!astrologyData.bazi[2])
  //   console.log('🔍 astrologyData.bazi[2] 内容:', astrologyData.bazi[2])
  // }
  
  // 八字排盘
  context.push(`**八字排盘：**`)
  
  // 公历部分
  if (astrologyData.paipan) {
    const { yearPillar, monthPillar, dayPillar, hourPillar } = astrologyData.paipan
    context.push(`## 公历`)
    context.push(`- 年：${yearPillar.heavenly}${yearPillar.earthly}`)
    context.push(`- 月：${monthPillar.heavenly}${monthPillar.earthly}`)
    context.push(`- 日：${dayPillar.heavenly}${dayPillar.earthly}`)
    context.push(`- 时：${hourPillar.heavenly}${hourPillar.earthly}`)
    context.push('')
  }

  // 天干部分（十神分析）
  if (astrologyData.qiankunzao && astrologyData.qiankunzao[0] && astrologyData.paipan) {
    const { yearPillar, monthPillar, dayPillar, hourPillar } = astrologyData.paipan
    const shishen = astrologyData.qiankunzao[0]
    context.push(`## 天干`)
    context.push(`- 年：${yearPillar.heavenly} ${shishen[0] || ''}`)
    context.push(`- 月：${monthPillar.heavenly} ${shishen[1] || ''}`)
    context.push(`- 日：${dayPillar.heavenly} ${shishen[2] || '日元'}`)
    context.push(`- 时：${hourPillar.heavenly} ${shishen[3] || ''}`)
    context.push('')
  }

  // 尝试获取日主信息（用于后续十神计算）
  let rizhu = ''
  
  // 方法1：从bazi数组获取
  if (astrologyData.bazi && astrologyData.bazi[2]) {
    rizhu = astrologyData.bazi[2].charAt(0)
    // console.log('🔍 从bazi获取日主:', rizhu)
  }
  // 方法2：从paipan的dayPillar获取
  else if (astrologyData.paipan?.dayPillar && astrologyData.paipan.dayPillar.heavenly) {
    rizhu = astrologyData.paipan.dayPillar.heavenly
    // console.log('🔍 从dayPillar获取日主:', rizhu)
  }

  // 地支部分（添加十神信息）
  if (astrologyData.paipan) {
    const { yearPillar, monthPillar, dayPillar, hourPillar } = astrologyData.paipan
    context.push(`## 地支`)
    
    if (rizhu) {
      // 计算每个地支的十神
      const yearShishen = getShishenByDiZhi(rizhu, yearPillar.earthly)
      const monthShishen = getShishenByDiZhi(rizhu, monthPillar.earthly)
      const dayShishen = getShishenByDiZhi(rizhu, dayPillar.earthly)
      const hourShishen = getShishenByDiZhi(rizhu, hourPillar.earthly)
      
      // console.log('🔍 地支十神结果:', { yearShishen, monthShishen, dayShishen, hourShishen })
      
      context.push(`- 年：${yearPillar.earthly}${yearShishen ? ' ' + yearShishen : ''}`)
      context.push(`- 月：${monthPillar.earthly}${monthShishen ? ' ' + monthShishen : ''}`)
      context.push(`- 日：${dayPillar.earthly}${dayShishen ? ' ' + dayShishen : ''}`)
      context.push(`- 时：${hourPillar.earthly}${hourShishen ? ' ' + hourShishen : ''}`)
    } else {
      // 如果无法获取日主，只显示地支
      // console.log('🔍 无法获取日主信息，只显示地支')
      context.push(`- 年：${yearPillar.earthly}`)
      context.push(`- 月：${monthPillar.earthly}`)
      context.push(`- 日：${dayPillar.earthly}`)
      context.push(`- 时：${hourPillar.earthly}`)
    }
    context.push('')
  } else {
    // console.log('🔍 没有paipan数据，无法显示地支')
  }

  // 藏干部分（使用canggan-table.csv数据）
  if (astrologyData.paipan) {
    const { yearPillar, monthPillar, dayPillar, hourPillar } = astrologyData.paipan
    const pillars = [
      { name: '年', dizhi: yearPillar.earthly },
      { name: '月', dizhi: monthPillar.earthly },
      { name: '日', dizhi: dayPillar.earthly },
      { name: '时', dizhi: hourPillar.earthly }
    ]
    
    context.push(`##藏干`)
    
    // 按年月日时四柱显示藏干
    pillars.forEach(pillar => {
      const cangganInfo = getCangGanByDiZhi(pillar.dizhi)
      let cangganParts = []
      
      // 地支本气
      if (cangganInfo.benqi) {
        const benqiShishen = rizhu ? getShishenByTianGan(rizhu, cangganInfo.benqi) : ''
        const benqiText = benqiShishen ? `${cangganInfo.benqi}${benqiShishen}` : cangganInfo.benqi
        cangganParts.push(`地支本气：${benqiText}`)
      }
      
      // 地支中气
      if (cangganInfo.zhongqi) {
        const zhongqiShishen = rizhu ? getShishenByTianGan(rizhu, cangganInfo.zhongqi) : ''
        const zhongqiText = zhongqiShishen ? `${cangganInfo.zhongqi}${zhongqiShishen}` : cangganInfo.zhongqi
        cangganParts.push(`地支中气：${zhongqiText}`)
      }
      
      // 地支余气
      if (cangganInfo.yuqi) {
        const yuqiShishen = rizhu ? getShishenByTianGan(rizhu, cangganInfo.yuqi) : ''
        const yuqiText = yuqiShishen ? `${cangganInfo.yuqi}${yuqiShishen}` : cangganInfo.yuqi
        cangganParts.push(`地支余气：${yuqiText}`)
      }
      
      // 只有当有内容时才添加到context
      if (cangganParts.length > 0) {
        context.push(`- ${pillar.name}：${cangganParts.join(' ')}`)
      }
    })
    context.push('')
  }

  // 神煞部分
  if (astrologyData.shensha) {
    context.push(`##神煞`)
    const { year, month, day, hour } = astrologyData.shensha
    if (year && year !== '空亡') context.push(`- 年：${year.replace(/\s+/g, ' ')}`)
    if (month && month !== '空亡') context.push(`- 月：${month.replace(/\s+/g, ' ')}`)
    if (day && day !== '空亡') context.push(`- 日：${day.replace(/\s+/g, ' ')}`)
    if (hour && hour !== '空亡') context.push(`- 时：${hour.replace(/\s+/g, ' ')}`)
    context.push('')
  }

  // 大运信息
  if (astrologyData.dayun && astrologyData.dayun.length > 0) {
    context.push(`**大运信息：**`)
    astrologyData.dayun.forEach((dayun: any, index: number) => {
      // 计算大运年份范围
      const startYear = 2000 + index * 10 - (index === 0 ? 0 : 1)
      const endYear = startYear + (index === 0 ? 8 : 9)
      const ageRange = index === 0 ? `1-8岁` : `${index * 10 - 1}-${index * 10 + 8}岁`
      
      // 计算大运地支十神
      let dayunDizhiShishen = ''
      if (rizhu && dayun.pillar && dayun.pillar.length >= 2) {
        const dayunDizhi = dayun.pillar.charAt(1) // 获取大运地支
        dayunDizhiShishen = getShishenByDiZhi(rizhu, dayunDizhi)
      }
      
      const tianganShishen = dayun.shishen || ''
      const dizhiShishenText = dayunDizhiShishen ? ` 地支十神：${dayunDizhiShishen}` : ''
      
      context.push(`- ${dayun.pillar}大运（${startYear}-${endYear}年，${ageRange}） 天干十神：${tianganShishen}${dizhiShishenText}`)
    })
    context.push('')
  }

  // 流年信息（显示大运开始年份）
  context.push(`**流年信息：**`)
  
  // 大运开始年份和对应年龄
  const dayunStartInfo = [
    { year: 2000, age: 1 },
    { year: 2009, age: 9 },
    { year: 2019, age: 19 },
    { year: 2029, age: 29 },
    { year: 2039, age: 39 },
    { year: 2049, age: 49 },
    { year: 2059, age: 59 },
    { year: 2069, age: 69 },
    { year: 2079, age: 79 },
    { year: 2089, age: 89 }
  ]
  
  dayunStartInfo.forEach(({ year, age }) => {
    // 从CSV文件中获取准确的干支数据
    const ganzhi = getGanZhiByYear(year)
    context.push(`- ${year}年 ${age}岁  ${ganzhi}`)
  })

  return context.join('\n')
}

// 格式化基础八字信息（当API失败时使用）
function formatBasicAstrologyInfo(userInfo: UserInfo): string {
  const location = formatAreaDisplay(userInfo.area)
  const birthInfo = `${userInfo.year}年${userInfo.month}月${userInfo.day}日${userInfo.hour}时${userInfo.minute}分`
  
  return `**出生信息：**
- 出生时间：${birthInfo}
- 出生地点：${location}
- 性别：${userInfo.gender === 'male' || userInfo.gender === '男' ? '男' : '女'}

【注：详细的八字排盘信息获取失败，请基于基础出生信息进行分析】`
}
