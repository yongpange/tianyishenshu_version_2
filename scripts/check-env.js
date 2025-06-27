const fs = require('fs')
const path = require('path')

console.log('🔍 检查环境配置...\n')

// 检查 .env.local 文件
const envPath = path.join(process.cwd(), '.env.local')
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local 文件不存在')
  process.exit(1)
}

console.log('✅ .env.local 文件存在')

// 读取环境变量
require('dotenv').config({ path: envPath })

// 检查必需的环境变量
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'COZE_BASE_URL',
  'COZE_API_TOKEN',
  'BOT_ID'
]

let allPresent = true

console.log('\n📋 环境变量检查:')
requiredEnvVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    console.log(`✅ ${varName}: 已设置`)
  } else {
    console.log(`❌ ${varName}: 未设置`)
    allPresent = false
  }
})

if (!allPresent) {
  console.error('\n❌ 部分环境变量未设置，请检查 .env.local 文件')
  process.exit(1)
}

console.log('\n✅ 所有必需的环境变量都已设置')

// 检查 Supabase URL 格式
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
  console.warn('⚠️  Supabase URL 应该以 https:// 开头')
}

console.log('\n🎉 环境检查完成！')
