// 应用数据库迁移
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  console.log('🔧 应用数据库迁移...')
  
  try {
    // 执行 SQL 迁移
    const migrationSQL = `
      -- 添加 is_profile_completed 字段
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_profile_completed BOOLEAN DEFAULT FALSE;
      
      -- 添加 last_login 字段
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;
    `
    
    // 注意：Supabase JS 客户端不支持直接执行 DDL 语句
    // 我们需要使用 RPC 或者在 Supabase Dashboard 中手动执行
    
    console.log('📋 需要在 Supabase Dashboard 中执行以下 SQL:')
    console.log('=' .repeat(50))
    console.log(migrationSQL)
    console.log('=' .repeat(50))
    
    console.log('\n📝 步骤:')
    console.log('1. 打开 Supabase Dashboard')
    console.log('2. 进入 SQL Editor')
    console.log('3. 执行上述 SQL 语句')
    console.log('4. 重新运行测试脚本')
    
  } catch (error) {
    console.error('❌ 迁移失败:', error.message)
  }
}

applyMigration()
