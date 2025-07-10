// Coze认证诊断脚本
const fs = require('fs')
const path = require('path')

// 加载环境变量
require('dotenv').config({ path: '.env.local' })

console.log('🔍 Coze API 认证诊断\n')

// 检查环境变量
console.log('📋 环境变量检查:')
const envVars = {
  'COZE_API_TOKEN': process.env.COZE_API_TOKEN,
  'BOT_ID': process.env.BOT_ID,
  'COZE_CLIENT_ID': process.env.COZE_CLIENT_ID,
  'COZE_PUBLIC_KEY_ID': process.env.COZE_PUBLIC_KEY_ID,
  'COZE_PRIVATE_KEY_FILE': process.env.COZE_PRIVATE_KEY_FILE,
  'COZE_API_BASE': process.env.COZE_API_BASE
}

Object.entries(envVars).forEach(([key, value]) => {
  if (value) {
    if (key.includes('TOKEN') || key.includes('KEY')) {
      console.log(`✅ ${key}: ${value.substring(0, 10)}...`)
    } else {
      console.log(`✅ ${key}: ${value}`)
    }
  } else {
    console.log(`❌ ${key}: 未设置`)
  }
})

// 检查私钥文件
console.log('\n🔑 私钥文件检查:')
const privateKeyFile = process.env.COZE_PRIVATE_KEY_FILE
if (privateKeyFile) {
  const keyPath = path.resolve(privateKeyFile)
  if (fs.existsSync(keyPath)) {
    const keyContent = fs.readFileSync(keyPath, 'utf8')
    if (keyContent.includes('-----BEGIN PRIVATE KEY-----')) {
      console.log(`✅ 私钥文件存在且格式正确: ${keyPath}`)
    } else {
      console.log(`❌ 私钥文件格式错误: ${keyPath}`)
    }
  } else {
    console.log(`❌ 私钥文件不存在: ${keyPath}`)
  }
} else {
  console.log('❌ 未配置私钥文件路径')
}

// 认证方式建议
console.log('\n💡 认证方式分析:')
const hasJWTConfig = process.env.COZE_CLIENT_ID && process.env.COZE_PUBLIC_KEY_ID && process.env.COZE_PRIVATE_KEY_FILE
const hasPATConfig = process.env.COZE_API_TOKEN

if (hasJWTConfig && hasPATConfig) {
  console.log('✅ 同时配置了JWT OAuth和PAT Token，系统将优先使用JWT OAuth')
} else if (hasJWTConfig) {
  console.log('✅ 仅配置了JWT OAuth认证')
} else if (hasPATConfig) {
  console.log('✅ 仅配置了PAT Token认证')
} else {
  console.log('❌ 未配置任何认证方式')
}

// 测试JWT生成
if (hasJWTConfig) {
  console.log('\n🧪 测试JWT生成:')
  try {
    const jwt = require('jsonwebtoken')
    const privateKey = fs.readFileSync(process.env.COZE_PRIVATE_KEY_FILE, 'utf8')
    const now = Math.floor(Date.now() / 1000)
    
    const payload = {
      iss: process.env.COZE_CLIENT_ID,
      aud: process.env.COZE_API_BASE,
      iat: now,
      exp: now + 3600,
      jti: `${process.env.COZE_CLIENT_ID}_${now}_test`
    }
    
    const token = jwt.sign(payload, privateKey, { 
      algorithm: 'RS256',
      header: {
        typ: 'JWT',
        alg: 'RS256',
        kid: process.env.COZE_PUBLIC_KEY_ID
      }
    })
    
    console.log('✅ JWT生成成功')
    console.log(`   Token: ${token.substring(0, 50)}...`)
  } catch (error) {
    console.log('❌ JWT生成失败:', error.message)
  }
}

// 建议
console.log('\n🎯 建议:')
if (!hasJWTConfig && !hasPATConfig) {
  console.log('1. 请配置至少一种认证方式')
  console.log('2. 推荐使用JWT OAuth认证（更安全）')
} else if (hasPATConfig && !hasJWTConfig) {
  console.log('1. 当前使用PAT Token认证')
  console.log('2. 建议升级到JWT OAuth认证')
} else {
  console.log('1. 认证配置完整')
  console.log('2. 如果仍有问题，请检查Coze开放平台的应用配置')
}

console.log('\n🔗 相关链接:')
console.log('- Coze开放平台: https://www.coze.cn/open')
console.log('- API文档: https://www.coze.cn/docs/developer_guides/coze_api_overview')
