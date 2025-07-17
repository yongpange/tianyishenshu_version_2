// 为现有的 bazi_reports 记录生成并更新格式化的八字上下文
const { createClient } = require('@supabase/supabase-js')

// Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://btelqkjrapktqrdwhuag.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0ZWxxa2pyYXBrdHFyZHdodWFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDczODA0MCwiZXhwIjoyMDY2MzE0MDQwfQ.XhahvoDm9nHgYXj55gwbnkvZMtHab2s-OPTIp9la3xk'

const supabase = createClient(supabaseUrl, supabaseKey)

// 格式化八字数据（简化版本，从 personality-report.ts 复制）
function formatAstrologyPrompt(astrologyData, userInfo) {
  const context = []
  
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

  // 天干部分
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

  // 地支部分
  if (astrologyData.paipan) {
    const { yearPillar, monthPillar, dayPillar, hourPillar } = astrologyData.paipan
    context.push(`## 地支`)
    context.push(`- 年：${yearPillar.earthly}`)
    context.push(`- 月：${monthPillar.earthly}`)
    context.push(`- 日：${dayPillar.earthly}`)
    context.push(`- 时：${hourPillar.earthly}`)
    context.push('')
  }

  // 纳音五行
  if (astrologyData.paipan) {
    const { yearStar, monthStar, dayStar, hourStar } = astrologyData.paipan
    context.push(`## 纳音五行`)
    context.push(`- 年：${yearStar}`)
    context.push(`- 月：${monthStar}`)
    context.push(`- 日：${dayStar}`)
    context.push(`- 时：${hourStar}`)
    context.push('')
  }

  // 大运信息
  if (astrologyData.dayun && astrologyData.dayun.length > 0) {
    context.push(`## 大运`)
    astrologyData.dayun.slice(0, 5).forEach((dayun, index) => {
      context.push(`- ${dayun.age}岁起：${dayun.ganZhi} (${dayun.startYear}-${dayun.endYear})`)
    })
    context.push('')
  }

  return context.join('\n')
}

async function updateExistingBaziContext() {
  try {
    console.log('🔍 开始查找需要更新的 bazi_reports 记录...')

    // 获取所有没有 astrology_context 的记录
    const { data: baziReports, error: fetchError } = await supabase
      .from('bazi_reports')
      .select('id, user_id, raw_payload')
      .is('astrology_context', null)

    if (fetchError) {
      console.error('❌ 获取 bazi_reports 失败:', fetchError)
      return
    }

    if (!baziReports || baziReports.length === 0) {
      console.log('✅ 所有记录都已有格式化上下文，无需更新')
      return
    }

    console.log(`📋 找到 ${baziReports.length} 条需要更新的记录`)

    let successCount = 0
    let errorCount = 0

    for (const report of baziReports) {
      try {
        console.log(`🔮 处理记录: ${report.id}`)

        // 获取对应的用户信息
        const { data: userProfile, error: userError } = await supabase
          .from('user_profiles')
          .select('name, gender, year, month, day, hour, minute, area_province, area_city, area_district')
          .eq('id', report.user_id)
          .single()

        if (userError || !userProfile) {
          console.warn(`⚠️ 无法获取用户信息: ${report.user_id}`)
          errorCount++
          continue
        }

        // 构建用户信息对象
        const userInfo = {
          name: userProfile.name,
          gender: userProfile.gender,
          year: userProfile.year,
          month: userProfile.month,
          day: userProfile.day,
          hour: userProfile.hour,
          minute: userProfile.minute,
          area: {
            province: userProfile.area_province,
            city: userProfile.area_city,
            district: userProfile.area_district
          }
        }

        // 格式化八字上下文
        const astrologyContext = formatAstrologyPrompt(report.raw_payload, userInfo)

        // 更新记录
        const { error: updateError } = await supabase
          .from('bazi_reports')
          .update({ astrology_context: astrologyContext })
          .eq('id', report.id)

        if (updateError) {
          console.error(`❌ 更新记录 ${report.id} 失败:`, updateError)
          errorCount++
        } else {
          console.log(`✅ 成功更新记录: ${report.id}`)
          successCount++
        }

      } catch (error) {
        console.error(`❌ 处理记录 ${report.id} 时出错:`, error)
        errorCount++
      }
    }

    console.log('\n📊 更新统计:')
    console.log(`✅ 成功更新: ${successCount} 条`)
    console.log(`❌ 更新失败: ${errorCount} 条`)
    console.log(`📋 总计: ${baziReports.length} 条`)

  } catch (error) {
    console.error('💥 脚本执行失败:', error)
  }
}

// 执行更新
updateExistingBaziContext().then(() => {
  console.log('🎉 脚本执行完成')
  process.exit(0)
}).catch(error => {
  console.error('💥 脚本执行出错:', error)
  process.exit(1)
}) 