// 测试报告生成的JWT认证
require('dotenv').config()

async function testReportAuth() {
  try {
    console.log('🔍 测试报告生成JWT认证...')
    
    // 检查环境变量
    console.log('📋 环境变量检查:')
    console.log('  COZE_CLIENT_ID:', process.env.COZE_CLIENT_ID ? '✅ 已设置' : '❌ 未设置')
    console.log('  COZE_PUBLIC_KEY_ID:', process.env.COZE_PUBLIC_KEY_ID ? '✅ 已设置' : '❌ 未设置')
    console.log('  COZE_PRIVATE_KEY_FILE:', process.env.COZE_PRIVATE_KEY_FILE ? '✅ 已设置' : '❌ 未设置')
    console.log('  COZE_API_BASE:', process.env.COZE_API_BASE ? '✅ 已设置' : '❌ 未设置')
    console.log('  COZE_API_TOKEN:', process.env.COZE_API_TOKEN ? '✅ 已设置' : '❌ 未设置 (预期，优先JWT)')
    
    // 测试createReportCozeClient函数
    const { createReportCozeClient } = await import('./src/lib/coze-auth.ts')
    
    console.log('\n🚀 测试createReportCozeClient...')
    const { client, authMethod } = await createReportCozeClient()
    
    console.log(`✅ 认证成功! 方式: ${authMethod}`)
    console.log('📡 客户端创建成功，可以进行报告生成')
    
    return true
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    
    // 提供详细的错误诊断
    if (error.message.includes('JWT OAuth配置缺失')) {
      console.log('\n🔧 修复建议:')
      console.log('   请确保以下环境变量已正确配置:')
      console.log('   - COZE_CLIENT_ID')
      console.log('   - COZE_PUBLIC_KEY_ID') 
      console.log('   - COZE_PRIVATE_KEY_FILE')
      console.log('   - COZE_API_BASE')
    }
    
    return false
  }
}

// 执行测试
if (require.main === module) {
  testReportAuth().then(success => {
    console.log('\n📊 测试结果:', success ? '✅ 通过' : '❌ 失败')
    process.exit(success ? 0 : 1)
  })
}

module.exports = { testReportAuth } 