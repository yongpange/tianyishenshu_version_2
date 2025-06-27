// 测试农历转换功能
const { Lunar, Solar } = require('lunar-javascript')

console.log('🌙 测试农历转阳历功能...\n')

// 测试用例
const testCases = [
  { year: 1990, month: 4, day: 15, desc: '1990年农历四月十五' },
  { year: 2000, month: 1, day: 1, desc: '2000年农历正月初一' },
  { year: 2024, month: 8, day: 15, desc: '2024年农历八月十五（中秋节）' },
  { year: 1995, month: 12, day: 30, desc: '1995年农历腊月三十' }
]

testCases.forEach((testCase, index) => {
  try {
    console.log(`📅 测试 ${index + 1}: ${testCase.desc}`)
    
    // 创建农历日期
    const lunar = Lunar.fromYmd(testCase.year, testCase.month, testCase.day)
    
    // 转换为阳历
    const solar = lunar.getSolar()
    
    console.log(`   农历: ${testCase.year}年${testCase.month}月${testCase.day}日`)
    console.log(`   阳历: ${solar.getYear()}年${solar.getMonth()}月${solar.getDay()}日`)
    console.log(`   星期: ${solar.getWeekInChinese()}`)
    console.log(`   干支: ${lunar.getYearInGanZhi()}年 ${lunar.getMonthInGanZhi()}月 ${lunar.getDayInGanZhi()}日`)
    console.log('   ✅ 转换成功\n')
    
  } catch (error) {
    console.log(`   ❌ 转换失败: ${error.message}\n`)
  }
})

console.log('🎉 农历转换测试完成！')
console.log('\n📋 功能说明:')
console.log('- 支持1900-2100年的农历转阳历')
console.log('- 自动处理闰月和大小月')
console.log('- 提供干支纪年等传统信息')
console.log('- 适用于生辰八字计算')
