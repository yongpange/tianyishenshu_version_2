// 城市名称提取函数测试脚本

// 复制 extractCityName 函数
function extractCityName(fullLocationName) {
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

// 测试数据 - 涵盖各种不同类型的地区名称
const testCases = [
  // 基本的省市县结构
  '北京市市辖区东城区',
  '上海市市辖区黄浦区',
  '广东省广州市天河区',
  '江苏省南京市玄武区',
  '浙江省杭州市西湖区',
  
  // 县级单位
  '河北省石家庄市正定县',
  '山东省济南市章丘区',
  '安徽省合肥市肥东县',
  '湖北省武汉市黄陂区',
  
  // 内蒙古自治区的盟
  '内蒙古自治区锡林郭勒盟锡林浩特市',
  '内蒙古自治区阿拉善盟阿拉善左旗',
  '内蒙古自治区兴安盟乌兰浩特市',
  
  // 州级单位
  '新疆维吾尔自治区伊犁哈萨克自治州伊宁市',
  '云南省大理白族自治州大理市',
  '四川省甘孜藏族自治州康定市',
  
  // 复杂的多级市名
  '黑龙江省佳木斯市同江市',
  '辽宁省大连市瓦房店市',
  '山东省潍坊市寿光市',
  
  // 包含空格的地区名称
  '广东省 深圳市 南山区',
  '四川省 成都市 锦江区',
  
  // 特殊情况
  '重庆市市辖区渝中区',
  '天津市市辖区和平区',
  '西藏自治区拉萨市城关区',
  '新疆维吾尔自治区乌鲁木齐市天山区',
  
  // 边缘情况
  '香港特别行政区',
  '澳门特别行政区',
  '台湾省台北市',
]

// 执行测试
console.log('='.repeat(60))
console.log('         城市名称提取函数测试')
console.log('='.repeat(60))

testCases.forEach((testCase, index) => {
  console.log(`\n测试 ${index + 1}: ${testCase}`)
  console.log('-'.repeat(50))
  
  const result = extractCityName(testCase)
  
  console.log(`✅ 提取结果: ${result}`)
  console.log('-'.repeat(50))
})

console.log('\n' + '='.repeat(60))
console.log('测试完成')
console.log('='.repeat(60))

// 额外的交互式测试
console.log('\n如果你想测试自定义地区名称，请修改下面的 customTest 变量：')
const customTest = '请在这里输入你想测试的地区名称'

if (customTest !== '请在这里输入你想测试的地区名称') {
  console.log(`\n🧪 自定义测试: ${customTest}`)
  console.log('-'.repeat(50))
  const customResult = extractCityName(customTest)
  console.log(`✅ 自定义测试结果: ${customResult}`)
}
