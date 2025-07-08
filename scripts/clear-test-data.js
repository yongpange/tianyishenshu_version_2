// 清理所有测试数据的脚本
const { createClient } = require('@supabase/supabase-js')

require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function clearAllTestData() {
  console.log('🗑️ 开始清理所有测试数据...\n')
  
  // 确认操作
  console.log('⚠️ 警告：此操作将删除所有数据！')
  console.log('📋 将要清理的表：')
  console.log('   - users (用户表)')
  console.log('   - user_profiles (用户资料表)')
  console.log('   - personality_reports (性格报告表)')
  console.log('   - conversations (对话表)')
  console.log('   - invite_codes (邀请码表) - 保留不删除')

  // 删除顺序很重要，要先删除有外键依赖的表
  const tables = [
    { name: 'conversations', description: '对话记录' },
    { name: 'personality_reports', description: '性格报告' },
    { name: 'user_profiles', description: '用户资料' },
    { name: 'users', description: '用户信息' }
    // invite_codes 表保留不删除，通常包含系统配置数据
  ]
  
  let totalDeleted = 0
  
  for (const table of tables) {
    try {
      console.log(`🔄 清理 ${table.name} (${table.description})...`)
      
      // 先查询记录数
      const { count: beforeCount, error: countError } = await supabase
        .from(table.name)
        .select('*', { count: 'exact', head: true })
        
      if (countError) {
        console.log(`   ❌ 查询 ${table.name} 记录数失败:`, countError.message)
        continue
      }
      
      console.log(`   📊 ${table.name} 当前记录数: ${beforeCount}`)
      
      if (beforeCount === 0) {
        console.log(`   ✅ ${table.name} 已经是空的，跳过`)
        continue
      }
      
      // 删除所有记录
      const { error: deleteError } = await supabase
        .from(table.name)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // 删除所有记录的技巧
        
      if (deleteError) {
        console.log(`   ❌ 删除 ${table.name} 失败:`, deleteError.message)
        continue
      }
      
      // 验证删除结果
      const { count: afterCount } = await supabase
        .from(table.name)
        .select('*', { count: 'exact', head: true })
        
      console.log(`   ✅ ${table.name} 删除完成，剩余记录: ${afterCount}`)
      totalDeleted += beforeCount
      
    } catch (error) {
      console.log(`   ❌ 处理 ${table.name} 时出错:`, error.message)
    }
    
    console.log('')
  }
  
  console.log(`🎉 数据清理完成！`)
  console.log(`📊 总共删除了 ${totalDeleted} 条记录`)
  
  // 最终验证
  console.log('\n🔍 最终验证各表记录数:')
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table.name)
        .select('*', { count: 'exact', head: true })
        
      if (error) {
        console.log(`   ${table.name}: 查询失败`)
      } else {
        console.log(`   ${table.name}: ${count} 条记录`)
      }
    } catch (error) {
      console.log(`   ${table.name}: 验证失败`)
    }
  }
  
  console.log('\n✨ 数据库已清理完成，可以开始全新测试！')
}

// 安全检查函数
async function safetyCheck() {
  console.log('🔒 执行安全检查...')
  
  // 检查是否在生产环境
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  
  if (supabaseUrl && supabaseUrl.includes('supabase.co')) {
    console.log('⚠️ 检测到可能是生产环境的Supabase URL')
    console.log('🛑 为安全起见，请手动确认这是测试环境')
    return false
  }
  
  // 检查环境变量
  if (process.env.NODE_ENV === 'production') {
    console.log('🛑 检测到生产环境，停止执行')
    return false
  }
  
  console.log('✅ 安全检查通过')
  return true
}

async function main() {
  console.log('🧪 测试数据清理工具\n')
  
  // 执行安全检查
  const isSafe = await safetyCheck()
  if (!isSafe) {
    console.log('❌ 安全检查未通过，停止执行')
    return
  }
  
  console.log('')
  await clearAllTestData()
}

main().catch(console.error)
