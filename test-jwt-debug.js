// 快速测试JWT认证配置
require('dotenv').config()

async function testJWTAuth() {
  try {
    console.log('🔍 开始JWT认证配置测试...')
    
    // 检查环境变量
    console.log('📋 环境变量完整检查:')
    console.log('   COZE_CLIENT_ID:', process.env.COZE_CLIENT_ID || 'undefined')
    console.log('   COZE_PUBLIC_KEY_ID:', process.env.COZE_PUBLIC_KEY_ID || 'undefined')
    console.log('   COZE_PRIVATE_KEY_FILE:', process.env.COZE_PRIVATE_KEY_FILE || 'undefined')
    console.log('   COZE_API_BASE:', process.env.COZE_API_BASE || 'undefined')
    
    // 检查私钥文件
    if (process.env.COZE_PRIVATE_KEY_FILE) {
      const fs = require('fs')
      const path = require('path')
      
      const keyPath = path.isAbsolute(process.env.COZE_PRIVATE_KEY_FILE) 
        ? process.env.COZE_PRIVATE_KEY_FILE 
        : path.join(process.cwd(), process.env.COZE_PRIVATE_KEY_FILE)
      
      console.log('\n🔑 私钥文件检查:')
      console.log('   配置的路径:', process.env.COZE_PRIVATE_KEY_FILE)
      console.log('   绝对路径:', keyPath)
      console.log('   文件存在:', fs.existsSync(keyPath))
      
      if (fs.existsSync(keyPath)) {
        const content = fs.readFileSync(keyPath, 'utf8')
        console.log('   文件大小:', content.length, '字符')
        console.log('   格式检查:', {
          hasBegin: content.includes('-----BEGIN'),
          hasEnd: content.includes('-----END'),
          hasPrivateKey: content.includes('PRIVATE KEY'),
          hasRSA: content.includes('RSA')
        })
      }
    }
    
    // 尝试调用createReportCozeClient
    console.log('\n🚀 测试createReportCozeClient...')
    const { createReportCozeClient } = require('./src/lib/coze-auth.ts')
    
    const result = await createReportCozeClient()
    console.log('✅ 认证成功!')
    console.log('   认证方式:', result.authMethod)
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    console.error('详细错误:', error)
  }
}

testJWTAuth() 