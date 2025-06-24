const fs = require('fs')
const path = require('path')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim())
    })
  })
}

async function setupEnvironment() {
  console.log('🚀 天乙神数 - 腾讯云短信服务配置助手\n')
  
  console.log('请按照以下步骤配置腾讯云短信服务：\n')
  
  try {
    const secretId = await askQuestion('1. 请输入腾讯云 SecretId: ')
    const secretKey = await askQuestion('2. 请输入腾讯云 SecretKey: ')
    const appId = await askQuestion('3. 请输入短信应用ID (SdkAppId): ')
    const signName = await askQuestion('4. 请输入短信签名 (默认: 天乙神数): ') || '天乙神数'
    const templateId = await askQuestion('5. 请输入短信模板ID: ')
    
    const envContent = `# 腾讯云短信服务配置
# 由配置助手自动生成 - ${new Date().toLocaleString()}

# 腾讯云 API 密钥
TENCENT_SECRET_ID=${secretId}
TENCENT_SECRET_KEY=${secretKey}

# 短信应用ID
TENCENT_SMS_APP_ID=${appId}

# 短信签名
TENCENT_SMS_SIGN_NAME=${signName}

# 短信模板ID
TENCENT_SMS_TEMPLATE_ID=${templateId}

# JWT 密钥（可选）
JWT_SECRET=tianyishenshu_jwt_secret_${Date.now()}
`

    const envPath = path.join(process.cwd(), '.env.local')
    fs.writeFileSync(envPath, envContent)
    
    console.log('\n✅ 配置完成！')
    console.log(`📝 环境变量已保存到: ${envPath}`)
    console.log('\n🔄 请重启开发服务器以应用新配置:')
    console.log('   npm run dev')
    console.log('\n📋 配置信息:')
    console.log(`   SecretId: ${secretId.substring(0, 10)}...`)
    console.log(`   应用ID: ${appId}`)
    console.log(`   签名: ${signName}`)
    console.log(`   模板ID: ${templateId}`)
    
  } catch (error) {
    console.error('\n❌ 配置失败:', error.message)
  } finally {
    rl.close()
  }
}

// 检查是否已有配置文件
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  console.log('⚠️  检测到已存在 .env.local 文件')
  rl.question('是否要覆盖现有配置？(y/N): ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      setupEnvironment()
    } else {
      console.log('❌ 配置已取消')
      rl.close()
    }
  })
} else {
  setupEnvironment()
} 