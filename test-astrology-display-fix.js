#!/usr/bin/env node

/**
 * 测试阳历生辰显示修复
 * 
 * 验证八字页面是否正确显示用户profile中的原始年月日时分信息
 * 而不是API返回的信息
 * 
 * 使用方法:
 * node test-astrology-display-fix.js
 */

const fetch = require('node-fetch')

// 测试用户信息
const testUserId = 'test-user-profile-id'  // 需要替换为实际的user_profile_id

async function testDisplayFix() {
  try {
    console.log('🔮 测试阳历生辰显示修复...')
    
    // 1. 测试八字获取API是否返回用户原始信息
    console.log('\n📡 测试八字获取API...')
    const baziResponse = await fetch('http://localhost:3000/api/bazi/get', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: testUserId,
        isUserProfileId: true
      })
    })

    if (!baziResponse.ok) {
      console.log('❌ 八字获取API调用失败:', baziResponse.status)
      return
    }

    const baziResult = await baziResponse.json()
    
    if (baziResult.success) {
      console.log('✅ 八字获取API调用成功')
      
      // 检查是否返回了用户原始信息
      if (baziResult.originalUserInfo) {
        console.log('📋 用户原始信息:')
        console.log('  - 姓名:', baziResult.originalUserInfo.name)
        console.log('  - 出生年:', baziResult.originalUserInfo.year)
        console.log('  - 出生月:', baziResult.originalUserInfo.month)
        console.log('  - 出生日:', baziResult.originalUserInfo.day)
        console.log('  - 出生时:', baziResult.originalUserInfo.hour)
        console.log('  - 出生分:', baziResult.originalUserInfo.minute)
        console.log('  - 地区:', baziResult.originalUserInfo.area)
        
        // 模拟前端格式化逻辑
        const formatOriginalSolarDate = (userInfo) => {
          const year = userInfo.year
          const month = String(userInfo.month).padStart(2, '0')
          const day = String(userInfo.day).padStart(2, '0')
          const hour = String(userInfo.hour).padStart(2, '0')
          const minute = String(userInfo.minute).padStart(2, '0')
          
          const hourToShichen = (hour) => {
            const shichenMap = {
              23: '子时', 0: '子时', 1: '丑时', 2: '丑时',
              3: '寅时', 4: '寅时', 5: '卯时', 6: '卯时',
              7: '辰时', 8: '辰时', 9: '巳时', 10: '巳时',
              11: '午时', 12: '午时', 13: '未时', 14: '未时',
              15: '申时', 16: '申时', 17: '酉时', 18: '酉时',
              19: '戌时', 20: '戌时', 21: '亥时', 22: '亥时'
            }
            return shichenMap[hour] || '午时'
          }
          
          const shichen = hourToShichen(userInfo.hour)
          return `${year}年${month}月${day}日 ${hour}:${minute} ${shichen}`
        }
        
        const formattedOriginal = formatOriginalSolarDate(baziResult.originalUserInfo)
        console.log('\n🎯 格式化后的阳历生辰 (用户原始):', formattedOriginal)
        
        // 对比API返回的solarDate
        if (baziResult.report && baziResult.report.solarDate) {
          console.log('🔄 API返回的阳历生辰:', baziResult.report.solarDate)
          
          if (formattedOriginal !== baziResult.report.solarDate) {
            console.log('✅ 成功！用户原始信息与API返回信息不同，修复生效')
          } else {
            console.log('⚠️ 注意：用户原始信息与API返回信息相同，可能需要进一步验证')
          }
        }
        
      } else {
        console.log('❌ API未返回用户原始信息')
      }
      
    } else {
      console.log('❌ 八字获取失败:', baziResult.message)
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error)
  }
}

// 显示使用说明
function showUsage() {
  console.log(`
🔮 阳历生辰显示修复测试

使用前准备:
1. 确保开发服务器运行: npm run dev
2. 修改脚本中的 testUserId 为实际的 user_profile_id
3. 确保该用户已有八字报告

测试内容:
- 验证八字获取API是否返回用户原始信息
- 验证格式化逻辑是否正确
- 对比用户原始信息与API返回信息的差异

如果需要获取实际的user_profile_id，可以:
1. 查看数据库 user_profiles 表
2. 或通过管理员页面查看用户列表
`)
}

console.log(showUsage())
testDisplayFix() 