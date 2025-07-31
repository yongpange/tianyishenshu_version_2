#!/usr/bin/env node

/**
 * 测试修复后的阿里云八字API调用
 * 
 * 使用方法:
 * node test-astrology-api-fix.js
 */

const fetch = require('node-fetch')

// 测试数据
const testUserInfo = {
  name: '点不同',
  gender: 'female',  // female -> sex=0
  year: 1997,
  month: 8,
  day: 7,
  hour: 6,
  minute: 6,
  area: {
    province: '宁夏回族自治区',
    city: '固原市',
    district: '彭阳县'
  }
}

async function testAstrologyAPI() {
  try {
    console.log('🔮 测试修复后的八字API调用...')
    console.log('📋 测试用户信息:', testUserInfo)
    
    const response = await fetch('http://localhost:3000/api/astrology/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: testUserInfo.name,
        gender: testUserInfo.gender,
        birthDate: `${testUserInfo.year}-${testUserInfo.month.toString().padStart(2, '0')}-${testUserInfo.day.toString().padStart(2, '0')}`,
        birthTime: `${testUserInfo.hour.toString().padStart(2, '0')}:${testUserInfo.minute.toString().padStart(2, '0')}`,
        region: `${testUserInfo.area.province} ${testUserInfo.area.city} ${testUserInfo.area.district}`
      })
    })

    console.log('📡 响应状态:', response.status, response.statusText)

    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ API调用成功!')
      console.log('📊 返回的农历信息:')
      console.log('  - 农历生辰:', result.lunarDate)
      console.log('  - 古历生辰:', result.ancientDate) 
      console.log('  - 真太阳时:', result.trueSolarTime)
      console.log('  - 出生地区:', result.birthplace)
      
      if (result.lunarDate && result.lunarDate !== '二零二五年六月初八日') {
        console.log('🎉 成功！农历数据不再是固定的模拟数据')
      } else {
        console.log('⚠️ 注意：返回的仍是模拟数据，请检查阿里云API配置')
      }
    } else {
      console.log('❌ API调用失败:', result)
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error)
  }
}

// 显示环境检查
function checkEnvironment() {
  console.log('\n🔧 环境配置检查:')
  console.log('  - 服务器地址: http://localhost:3000')
  console.log('  - 请确保开发服务器正在运行 (npm run dev)')
  console.log('  - 请确保 .env.local 文件中配置了 ALIYUN_APPCODE')
  console.log('\n开始测试...\n')
}

checkEnvironment()
testAstrologyAPI() 