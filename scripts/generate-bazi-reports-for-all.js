#!/usr/bin/env node

/**
 * 批量为所有用户生成八字报告
 * 
 * 使用方法:
 * node scripts/generate-bazi-reports-for-all.js
 * 
 * 或者为特定用户生成:
 * node scripts/generate-bazi-reports-for-all.js --userProfileId=uuid-here
 * node scripts/generate-bazi-reports-for-all.js --userPhone=13812345678
 */

const fetch = require('node-fetch')

// 配置
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'dev_admin_token_2024'

// 解析命令行参数
const args = process.argv.slice(2)
const userProfileId = args.find(arg => arg.startsWith('--userProfileId='))?.split('=')[1]
const userPhone = args.find(arg => arg.startsWith('--userPhone='))?.split('=')[1]

async function generateBaziReports() {
  try {
    console.log('🔮 开始批量生成八字报告...')
    
    const requestBody = {
      reportType: 'astrology',  // 八字报告类型
      adminToken: ADMIN_TOKEN
    }

    // 根据参数决定生成模式
    if (userProfileId) {
      console.log(`📋 为特定用户资料生成: ${userProfileId}`)
      requestBody.singleUser = true
      requestBody.userProfileId = userProfileId
    } else if (userPhone) {
      console.log(`📋 为特定手机号用户生成: ${userPhone}`)
      requestBody.singleUser = true
      requestBody.userPhone = userPhone
    } else {
      console.log('📋 为所有主用户生成八字报告')
      requestBody.singleUser = false
    }

    const response = await fetch(`${BASE_URL}/api/admin/regenerate-reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    const result = await response.json()
    
    if (result.success) {
      console.log(`✅ 成功启动八字报告生成`)
      console.log(`📊 处理用户数量: ${result.count || '未知'}`)
      if (result.message) {
        console.log(`💬 消息: ${result.message}`)
      }
    } else {
      console.error(`❌ 生成失败: ${result.error || '未知错误'}`)
      process.exit(1)
    }

  } catch (error) {
    console.error('❌ 执行过程中出现异常:', error)
    process.exit(1)
  }
}

// 显示使用说明
function showUsage() {
  console.log(`
🔮 八字报告批量生成工具

使用方法:
  node scripts/generate-bazi-reports-for-all.js                                    # 为所有主用户生成
  node scripts/generate-bazi-reports-for-all.js --userProfileId=uuid-here         # 为特定用户资料生成
  node scripts/generate-bazi-reports-for-all.js --userPhone=13812345678           # 为特定手机号用户生成

环境变量:
  NEXT_PUBLIC_BASE_URL: ${BASE_URL}
  ADMIN_TOKEN: ${ADMIN_TOKEN ? '已设置' : '未设置'}

注意事项:
  - 使用 userProfileId 参数可以精确控制为哪个用户生成报告
  - 使用 userPhone 参数会为该手机号下的所有用户资料生成报告
  - 不带参数则为所有主用户（parent_id为null）生成报告
`)
}

// 检查help参数
if (args.includes('--help') || args.includes('-h')) {
  showUsage()
  process.exit(0)
}

// 执行生成
generateBaziReports() 