#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function setupSupabase() {
  console.log('🚀 Supabase 快速设置向导')
  console.log('=====================================')
  
  try {
    // 获取Supabase配置
    console.log('\n📋 请提供您的Supabase项目信息:')
    console.log('(可以在 Supabase Dashboard > Settings > API 中找到)')
    
    const projectUrl = await question('\n🔗 Project URL: ')
    const anonKey = await question('🔑 Anon Public Key: ')
    const serviceKey = await question('🔐 Service Role Key: ')
    
    if (!projectUrl || !anonKey || !serviceKey) {
      console.log('❌ 请提供完整的配置信息')
      process.exit(1)
    }
    
    // 读取现有的.env.local文件
    const envPath = path.join(process.cwd(), '.env.local')
    let envContent = ''
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8')
    }
    
    // 更新或添加Supabase配置
    const supabaseConfig = `
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=${projectUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}
SUPABASE_SERVICE_ROLE_KEY=${serviceKey}`
    
    // 检查是否已存在Supabase配置
    if (envContent.includes('NEXT_PUBLIC_SUPABASE_URL')) {
      // 替换现有配置
      envContent = envContent.replace(
        /# Supabase配置[\s\S]*?(?=\n#|\n[A-Z]|$)/,
        supabaseConfig
      )
    } else {
      // 添加新配置
      envContent += supabaseConfig
    }
    
    // 写入文件
    fs.writeFileSync(envPath, envContent)
    
    console.log('\n✅ Supabase配置已更新到 .env.local')
    
    // 询问是否要创建数据库表
    const createTables = await question('\n🗄️  是否要创建数据库表? (y/n): ')
    
    if (createTables.toLowerCase() === 'y') {
      console.log('\n📋 请在Supabase Dashboard中执行以下SQL:')
      console.log('=====================================')
      
      const sqlPath = path.join(process.cwd(), 'supabase', 'migrations', '001_initial_schema.sql')
      if (fs.existsSync(sqlPath)) {
        const sqlContent = fs.readFileSync(sqlPath, 'utf8')
        console.log(sqlContent)
        console.log('=====================================')
        console.log('\n📍 步骤:')
        console.log('1. 打开 Supabase Dashboard')
        console.log('2. 进入 SQL Editor')
        console.log('3. 复制上面的SQL代码并执行')
      } else {
        console.log('❌ 找不到SQL迁移文件')
      }
    }
    
    // 询问是否要启用Supabase
    const enableSupabase = await question('\n🔄 是否要立即启用Supabase存储? (y/n): ')
    
    if (enableSupabase.toLowerCase() === 'y') {
      // 更新storage-adapter.ts中的默认配置
      const adapterPath = path.join(process.cwd(), 'src', 'lib', 'storage-adapter.ts')
      if (fs.existsSync(adapterPath)) {
        let adapterContent = fs.readFileSync(adapterPath, 'utf8')
        adapterContent = adapterContent.replace(
          'export const storageManager = new StorageManager(false)',
          'export const storageManager = new StorageManager(true)'
        )
        fs.writeFileSync(adapterPath, adapterContent)
        console.log('✅ 已启用Supabase存储')
      }
    }
    
    console.log('\n🎉 Supabase设置完成!')
    console.log('\n📝 下一步:')
    console.log('1. 重启开发服务器: npm run dev')
    console.log('2. 测试数据库连接')
    console.log('3. 如需要，可以运行数据迁移工具')
    
  } catch (error) {
    console.error('❌ 设置过程出错:', error.message)
  } finally {
    rl.close()
  }
}

// 检查是否在项目根目录
if (!fs.existsSync(path.join(process.cwd(), 'package.json'))) {
  console.log('❌ 请在项目根目录运行此脚本')
  process.exit(1)
}

setupSupabase()
