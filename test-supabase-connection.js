// 测试 Supabase 连接和兑换码功能
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 测试 Supabase 连接...')
console.log('URL:', supabaseUrl)
console.log('Service Key:', supabaseServiceKey ? `${supabaseServiceKey.substring(0, 10)}...` : 'undefined')

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 环境变量未正确配置')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testConnection() {
  try {
    // 测试连接
    console.log('\n1. 测试数据库连接...')
    const { data: tables, error: tablesError } = await supabase
      .from('invite_codes')
      .select('count')
      .limit(1)
    
    if (tablesError) {
      console.error('❌ 数据库连接失败:', tablesError)
      return
    }
    console.log('✅ 数据库连接成功')

    // 查看现有兑换码
    console.log('\n2. 查看现有兑换码...')
    const { data: existingCodes, error: selectError } = await supabase
      .from('invite_codes')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (selectError) {
      console.error('❌ 查询兑换码失败:', selectError)
      return
    }
    
    console.log(`✅ 找到 ${existingCodes.length} 个兑换码:`)
    existingCodes.forEach((code, index) => {
      console.log(`  ${index + 1}. ${code.code} - ${code.status} - ${code.created_at}`)
    })

    // 测试生成新兑换码
    console.log('\n3. 测试生成新兑换码...')
    const testCode = 'TEST' + Math.random().toString(36).substring(2, 14).toUpperCase()
    
    const { data: newCode, error: insertError } = await supabase
      .from('invite_codes')
      .insert([{
        code: testCode,
        status: 'active',
        remarks: '测试生成 ' + new Date().toLocaleString()
      }])
      .select()
    
    if (insertError) {
      console.error('❌ 生成兑换码失败:', insertError)
      return
    }
    
    console.log('✅ 成功生成测试兑换码:', newCode[0])

    // 再次查看兑换码列表
    console.log('\n4. 验证新兑换码是否出现在列表中...')
    const { data: updatedCodes, error: verifyError } = await supabase
      .from('invite_codes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (verifyError) {
      console.error('❌ 验证查询失败:', verifyError)
      return
    }
    
    console.log('✅ 最新的 5 个兑换码:')
    updatedCodes.forEach((code, index) => {
      console.log(`  ${index + 1}. ${code.code} - ${code.status} - ${code.created_at}`)
    })

    // 清理测试数据
    console.log('\n5. 清理测试数据...')
    const { error: deleteError } = await supabase
      .from('invite_codes')
      .delete()
      .eq('code', testCode)
    
    if (deleteError) {
      console.error('❌ 清理测试数据失败:', deleteError)
    } else {
      console.log('✅ 测试数据清理完成')
    }

  } catch (error) {
    console.error('❌ 测试过程出错:', error)
  }
}

testConnection()
