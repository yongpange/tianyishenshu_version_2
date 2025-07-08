// 测试性格报告保存修复
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testReportSaveFix() {
  console.log('🧪 测试性格报告保存修复...\n')
  
  const testPhone = '13800138000'
  
  try {
    // 1. 确保测试用户存在
    console.log('1️⃣ 检查测试用户...')
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, phone_number')
      .eq('phone_number', testPhone)
      .single()
    
    if (userError) {
      console.error('❌ 用户不存在:', userError.message)
      return
    }
    
    console.log('✅ 测试用户存在:', user.id)
    
    // 2. 检查是否已有性格报告
    console.log('\n2️⃣ 检查现有性格报告...')
    const { data: existingReport, error: reportError } = await supabase
      .from('personality_reports')
      .select('id, content, user_data_hash')
      .eq('user_id', user.id)
      .single()
    
    if (existingReport) {
      console.log('📋 发现现有报告:', {
        id: existingReport.id,
        contentLength: existingReport.content.length,
        hash: existingReport.user_data_hash
      })
    } else {
      console.log('📋 没有现有报告')
    }
    
    // 3. 测试通过API保存新报告
    console.log('\n3️⃣ 测试通过API保存报告...')
    
    const testUserInfo = {
      year: 1990,
      month: 5,
      day: 15,
      hour: 14,
      minute: 30,
      gender: '男',
      area: {
        province: '北京市',
        city: '北京市',
        district: '朝阳区'
      }
    }
    
    const response = await fetch('http://localhost:3000/api/personality-report/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userInfo: testUserInfo,
        userId: testPhone
      })
    })
    
    const result = await response.json()
    
    if (response.ok && result.success) {
      console.log('✅ 报告保存成功!')
      console.log('📊 报告信息:', {
        reportId: result.reportId,
        contentLength: result.content?.length || 0,
        authMethod: result.authMethod
      })
      
      // 4. 验证数据库中的报告
      console.log('\n4️⃣ 验证数据库中的报告...')
      const { data: savedReport, error: verifyError } = await supabase
        .from('personality_reports')
        .select('id, content, user_data_hash, updated_at')
        .eq('user_id', user.id)
        .single()
      
      if (savedReport) {
        console.log('✅ 数据库验证成功:', {
          id: savedReport.id,
          contentLength: savedReport.content.length,
          hash: savedReport.user_data_hash,
          updatedAt: savedReport.updated_at
        })
      } else {
        console.log('❌ 数据库验证失败:', verifyError?.message)
      }
      
      // 5. 测试再次保存（应该更新现有记录）
      console.log('\n5️⃣ 测试再次保存（更新现有记录）...')
      
      const response2 = await fetch('http://localhost:3000/api/personality-report/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInfo: {
            ...testUserInfo,
            year: 1991 // 稍微改变一下数据
          },
          userId: testPhone
        })
      })
      
      const result2 = await response2.json()
      
      if (response2.ok && result2.success) {
        console.log('✅ 第二次保存成功（应该是更新操作）')
        
        // 验证是否是更新而不是新增
        const { data: allReports } = await supabase
          .from('personality_reports')
          .select('id')
          .eq('user_id', user.id)
        
        if (allReports && allReports.length === 1) {
          console.log('✅ 确认是更新操作，只有一条记录')
        } else {
          console.log('❌ 可能创建了重复记录，记录数:', allReports?.length)
        }
      } else {
        console.log('❌ 第二次保存失败:', result2.error)
      }
      
    } else {
      console.log('❌ 报告保存失败:', result.error)
      console.log('📋 详细信息:', result.details)
    }
    
    console.log('\n🎉 测试完成!')
    
  } catch (error) {
    console.error('❌ 测试过程出错:', error.message)
  }
}

testReportSaveFix()
