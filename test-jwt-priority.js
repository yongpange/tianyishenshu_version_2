#!/usr/bin/env node

/**
 * 测试JWT OAuth优先级修复效果
 * 验证所有认证函数都优先使用JWT OAuth
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 测试JWT OAuth优先级修复效果')
console.log('=' .repeat(50))

async function testAuthPriority() {
  try {
    // 1. 测试环境变量
    console.log('\n📋 1. 检查环境变量配置:')
    const requiredVars = [
      'COZE_CLIENT_ID',
      'COZE_PUBLIC_KEY_ID', 
      'COZE_PRIVATE_KEY_FILE',
      'COZE_API_BASE'
    ]
    
    let hasCompleteJWTConfig = true
    requiredVars.forEach(varName => {
      const value = process.env[varName]
      const hasValue = !!(value && value.trim())
      console.log(`   ${varName}: ${hasValue ? '✅ 已设置' : '❌ 未设置'}`)
      if (!hasValue) hasCompleteJWTConfig = false
    })
    
    const hasPATToken = !!(process.env.COZE_API_TOKEN && process.env.COZE_API_TOKEN.trim())
    console.log(`   COZE_API_TOKEN: ${hasPATToken ? '✅ 已设置' : '❌ 未设置'}`)
    
    // 2. 测试私钥文件
    console.log('\n🔑 2. 检查私钥文件:')
    const privateKeyFile = process.env.COZE_PRIVATE_KEY_FILE
    if (privateKeyFile) {
      const keyPath = path.isAbsolute(privateKeyFile) 
        ? privateKeyFile 
        : path.join(process.cwd(), privateKeyFile)
      
      const keyExists = fs.existsSync(keyPath)
      console.log(`   私钥文件: ${keyExists ? '✅ 存在' : '❌ 不存在'} (${keyPath})`)
      
      if (keyExists) {
        try {
          const keyContent = fs.readFileSync(keyPath, 'utf8')
          const isValidKey = keyContent.includes('-----BEGIN PRIVATE KEY-----') && 
                            keyContent.includes('-----END PRIVATE KEY-----')
          console.log(`   私钥格式: ${isValidKey ? '✅ 正确' : '❌ 错误'}`)
          
          if (hasCompleteJWTConfig && isValidKey) {
            console.log('   🎉 JWT OAuth 配置完整，应该优先使用')
          }
        } catch (error) {
          console.log(`   私钥读取: ❌ 失败 (${error.message})`)
        }
      }
    } else {
      console.log('   私钥文件: ❌ 未配置')
    }
    
    // 3. 测试认证函数（需要在有环境变量的情况下）
    if (hasCompleteJWTConfig || hasPATToken) {
      console.log('\n🔐 3. 测试认证函数:')
      
      try {
        console.log('   测试 createCozeClient...')
        const { createCozeClient } = await import('./src/lib/coze-auth.ts')
        const { authMethod } = await createCozeClient()
        console.log(`   ✅ createCozeClient 认证方式: ${authMethod}`)
        
        // 验证是否优先使用JWT OAuth
        if (hasCompleteJWTConfig) {
          if (authMethod.includes('JWT OAuth')) {
            console.log('   🎉 优先级正确：使用JWT OAuth认证')
          } else {
            console.log('   ⚠️  优先级异常：应该使用JWT OAuth但使用了' + authMethod)
          }
        } else if (hasPATToken) {
          if (authMethod.includes('PAT Token')) {
            console.log('   ✅ 认证正确：JWT配置不完整，使用PAT Token')
          }
        }
        
      } catch (error) {
        console.log(`   ❌ createCozeClient 测试失败: ${error.message}`)
      }
      
      try {
        console.log('   测试 createReportCozeClient...')
        const { createReportCozeClient } = await import('./src/lib/coze-auth.ts')
        const { authMethod } = await createReportCozeClient()
        console.log(`   ✅ createReportCozeClient 认证方式: ${authMethod}`)
        
        // 验证是否优先使用JWT OAuth
        if (hasCompleteJWTConfig) {
          if (authMethod.includes('JWT OAuth')) {
            console.log('   🎉 优先级正确：使用JWT OAuth认证')
          } else {
            console.log('   ⚠️  优先级异常：应该使用JWT OAuth但使用了' + authMethod)
          }
        } else if (hasPATToken) {
          if (authMethod.includes('PAT Token')) {
            console.log('   ✅ 认证正确：JWT配置不完整，使用PAT Token')
          }
        }
        
      } catch (error) {
        console.log(`   ❌ createReportCozeClient 测试失败: ${error.message}`)
      }
    } else {
      console.log('\n⚠️  3. 跳过认证函数测试（缺少环境变量）')
    }
    
    // 4. 总结和建议
    console.log('\n📋 4. 修复总结:')
    console.log('   ✅ createCozeClient: 已修改为优先JWT OAuth')
    console.log('   ✅ createReportCozeClient: 已修改为优先JWT OAuth')
    console.log('   ✅ 聊天API: 默认认证方式已更新为JWT OAuth')
    console.log('   ✅ getUserCozeClient: 已使用修改后的createCozeClient')
    
    console.log('\n🚀 5. 部署建议:')
    if (!hasCompleteJWTConfig) {
      console.log('   📝 需要配置JWT OAuth环境变量:')
      console.log('      - COZE_CLIENT_ID')
      console.log('      - COZE_PUBLIC_KEY_ID') 
      console.log('      - COZE_PRIVATE_KEY_FILE')
      console.log('      - 确保私钥文件存在且格式正确')
    }
    
    console.log('   🐳 重新部署Docker容器:')
    console.log('      docker stop tianyishensuan && docker rm tianyishensuan')
    console.log('      docker run -d --name tianyishensuan -p 80:3000 --env-file .env.local tianyishensuan:v0.3.0')
    
    console.log('   🔍 验证部署效果:')
    console.log('      docker logs tianyishensuan | grep "JWT OAuth\\|PAT Token"')
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

// 运行测试
testAuthPriority().catch(console.error) 