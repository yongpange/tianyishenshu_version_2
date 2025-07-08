// 检查数据库表结构
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkSchema() {
  console.log('🔍 检查数据库表结构...')
  
  try {
    // 查询用户表的所有列
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ 查询失败:', error.message)
      return
    }
    
    console.log('✅ 用户表查询成功')
    
    if (data && data.length > 0) {
      console.log('📋 用户表字段:', Object.keys(data[0]))
    } else {
      console.log('📋 用户表为空，无法获取字段信息')
      
      // 尝试插入一个测试记录来查看表结构
      const { data: insertData, error: insertError } = await supabase
        .from('users')
        .insert({
          phone_number: '13800138000'
        })
        .select()
        .single()
      
      if (insertError) {
        console.error('❌ 插入测试记录失败:', insertError.message)
      } else {
        console.log('📋 用户表字段:', Object.keys(insertData))
        
        // 删除测试记录
        await supabase
          .from('users')
          .delete()
          .eq('id', insertData.id)
      }
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message)
  }
}

checkSchema()
