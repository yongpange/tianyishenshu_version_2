const fs = require('fs')
const path = require('path')
const jwt = require('jsonwebtoken')
require('dotenv').config({ path: '.env.local' })

function debugJWTCreation() {
  console.log('🔍 调试 JWT Token 创建过程...\n')

  // 1. 检查环境变量
  console.log('📋 环境变量检查:')
  console.log('   COZE_CLIENT_ID:', process.env.COZE_CLIENT_ID ? '✅ 已设置' : '❌ 未设置')
  console.log('   COZE_PUBLIC_KEY_ID:', process.env.COZE_PUBLIC_KEY_ID ? '✅ 已设置' : '❌ 未设置')
  console.log('   COZE_PRIVATE_KEY_FILE:', process.env.COZE_PRIVATE_KEY_FILE ? '✅ 已设置' : '❌ 未设置')
  console.log('   COZE_API_BASE:', process.env.COZE_API_BASE || 'api.coze.cn')

  if (!process.env.COZE_CLIENT_ID || !process.env.COZE_PUBLIC_KEY_ID || !process.env.COZE_PRIVATE_KEY_FILE) {
    console.error('❌ 环境变量配置不完整')
    return
  }

  // 2. 检查私钥文件路径
  console.log('\n📁 私钥文件检查:')
  const privateKeyFile = process.env.COZE_PRIVATE_KEY_FILE
  console.log('   配置的文件名:', privateKeyFile)
  
  // 检查不同的可能路径
  const possiblePaths = [
    path.resolve(process.cwd(), privateKeyFile),
    path.resolve(__dirname, '..', privateKeyFile),
    path.resolve(privateKeyFile)
  ]

  console.log('   当前工作目录:', process.cwd())
  console.log('   脚本目录:', __dirname)

  let privateKeyPath = null
  let privateKeyContent = null

  for (const testPath of possiblePaths) {
    console.log(`   测试路径: ${testPath}`)
    if (fs.existsSync(testPath)) {
      console.log('   ✅ 文件存在')
      privateKeyPath = testPath
      try {
        privateKeyContent = fs.readFileSync(testPath, 'utf8')
        console.log('   ✅ 文件读取成功')
        console.log('   文件大小:', privateKeyContent.length, '字符')
        console.log('   文件开头:', privateKeyContent.substring(0, 50) + '...')
        break
      } catch (error) {
        console.log('   ❌ 文件读取失败:', error.message)
      }
    } else {
      console.log('   ❌ 文件不存在')
    }
  }

  if (!privateKeyPath || !privateKeyContent) {
    console.error('❌ 无法找到或读取私钥文件')
    return
  }

  // 3. 测试 JWT 创建
  console.log('\n🔐 JWT Token 创建测试:')
  try {
    const now = Math.floor(Date.now() / 1000)
    const payload = {
      iss: process.env.COZE_CLIENT_ID,
      aud: 'api.coze.cn',
      iat: now,
      exp: now + 3600,
      jti: `${process.env.COZE_CLIENT_ID}_${now}_test123`
    }

    console.log('   Payload:', JSON.stringify(payload, null, 2))

    const token = jwt.sign(payload, privateKeyContent, {
      algorithm: 'RS256',
      keyid: process.env.COZE_PUBLIC_KEY_ID,
    })

    console.log('   ✅ JWT Token 创建成功')
    console.log('   Token 长度:', token.length)
    console.log('   Token 前缀:', token.substring(0, 50) + '...')

    // 验证 token
    const decoded = jwt.decode(token, { complete: true })
    console.log('   Header:', JSON.stringify(decoded.header, null, 2))
    console.log('   Payload:', JSON.stringify(decoded.payload, null, 2))

  } catch (error) {
    console.error('   ❌ JWT Token 创建失败:', error.message)
    console.error('   错误详情:', error)
  }
}

debugJWTCreation()
