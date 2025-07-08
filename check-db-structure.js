// 检查数据库表结构
const { createClient } = require('@supabase/supabase-js')

// Supabase配置
const supabaseUrl = 'https://btelqkjrapktqrdwhuag.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0ZWxxa2pyYXBrdHFyZHdodWFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDczODA0MCwiZXhwIjoyMDY2MzE0MDQwfQ.XhahvoDm9nHgYXj55gwbnkvZMtHab2s-OPTIp9la3xk'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTableStructure() {
  console.log('🔍 检查personality_reports表结构...')
  
  try {
    // 尝试查询表结构
    const { data, error } = await supabase
      .from('personality_reports')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ 查询表失败:', error)
      return false
    }
    
    console.log('✅ 表可访问，检查字段...')
    
    // 尝试插入包含新字段的测试记录
    const testRecord = {
      user_id: '00000000-0000-0000-0000-000000000000', // 使用有效的UUID格式
      content: 'test content',
      user_data_hash: 'test_hash',
      task_id: 'test_task_' + Date.now(),
      status: 'generating',
      progress: 0,
      error_message: null
    }
    
    console.log('🧪 测试插入记录:', testRecord)
    
    const { data: insertData, error: insertError } = await supabase
      .from('personality_reports')
      .insert(testRecord)
      .select()
    
    if (insertError) {
      console.error('❌ 插入测试记录失败:', insertError)
      
      if (insertError.message.includes('column') && insertError.message.includes('does not exist')) {
        console.log('\n📋 需要执行数据库迁移:')
        console.log('1. 登录 Supabase Dashboard')
        console.log('2. 进入 SQL Editor')
        console.log('3. 执行 scripts/add-report-status-fields.sql 中的SQL')
        return false
      }
      
      if (insertError.message.includes('violates foreign key constraint')) {
        console.log('⚠️ 外键约束错误（正常，因为用户不存在）')
        console.log('✅ 表结构包含所有必需字段')
        return true
      }
      
      return false
    }
    
    console.log('✅ 测试记录插入成功')
    
    // 清理测试记录
    await supabase
      .from('personality_reports')
      .delete()
      .eq('task_id', testRecord.task_id)
    
    console.log('🧹 测试记录已清理')
    return true
    
  } catch (error) {
    console.error('❌ 检查表结构时出错:', error)
    return false
  }
}

async function checkUsersTable() {
  console.log('\n🔍 检查users表结构...')
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ 查询users表失败:', error)
      return false
    }
    
    console.log('✅ users表可访问')
    return true
    
  } catch (error) {
    console.error('❌ 检查users表时出错:', error)
    return false
  }
}

async function runChecks() {
  console.log('🚀 开始数据库结构检查...\n')
  
  const usersOk = await checkUsersTable()
  const reportsOk = await checkTableStructure()
  
  console.log('\n📊 检查结果:')
  console.log(`Users表: ${usersOk ? '✅ 正常' : '❌ 异常'}`)
  console.log(`Personality Reports表: ${reportsOk ? '✅ 正常' : '❌ 需要迁移'}`)
  
  if (usersOk && reportsOk) {
    console.log('\n🎉 数据库结构检查通过！')
  } else {
    console.log('\n⚠️ 数据库结构需要修复')
  }
}

// 运行检查
runChecks().catch(console.error)
