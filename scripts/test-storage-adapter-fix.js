// 直接测试存储适配器修复
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 模拟 SupabaseAdapter 的修复后逻辑
async function testSavePersonalityReport(userId, report) {
  try {
    console.log('🔍 查找用户...')
    
    // 首先查找或创建用户
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('phone_number', userId)
      .single()

    let actualUserId = user?.id

    if (userError && userError.code === 'PGRST116') {
      console.log('👤 用户不存在，创建新用户...')
      // 用户不存在，创建新用户
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          phone_number: userId,
          permissions: ['basic']
        })
        .select('id')
        .single()

      if (createError) {
        console.error('创建用户失败:', createError)
        throw new Error('创建用户失败')
      }
      actualUserId = newUser.id
    } else if (userError) {
      console.error('查找用户失败:', userError)
      throw new Error('查找用户失败')
    }

    console.log('✅ 用户ID:', actualUserId)

    // 保存性格报告 - 先检查是否已存在
    console.log('🔍 检查现有报告...')
    const { data: existingReport } = await supabase
      .from('personality_reports')
      .select('id')
      .eq('user_id', actualUserId)
      .single()

    const reportData = {
      user_id: actualUserId,
      content: report.content,
      generated_at: report.generatedAt.toISOString(),
      user_data_hash: report.userDataHash,
      coze_conversation_id: report.cozeConversationId
    }

    let error
    if (existingReport) {
      // 更新现有报告
      console.log('🔄 更新现有报告...')
      const result = await supabase
        .from('personality_reports')
        .update(reportData)
        .eq('user_id', actualUserId)
      error = result.error
    } else {
      // 插入新报告
      console.log('➕ 插入新报告...')
      const result = await supabase
        .from('personality_reports')
        .insert(reportData)
      error = result.error
    }

    if (error) {
      console.error('Supabase保存报告失败:', error)
      throw new Error('保存报告失败')
    }
    
    console.log('✅ 报告保存成功!')
    return true
    
  } catch (error) {
    console.error('保存性格报告失败:', error)
    throw error
  }
}

async function runTest() {
  console.log('🧪 测试存储适配器修复...\n')
  
  const testPhone = '13800138000'
  
  try {
    // 创建测试报告数据
    const testReport = {
      id: `report_${Date.now()}_test`,
      userId: testPhone,
      content: '这是一个测试性格报告内容，用于验证保存功能是否正常工作。',
      generatedAt: new Date(),
      userDataHash: 'test_hash_' + Date.now(),
      cozeConversationId: 'test_conversation_' + Date.now()
    }
    
    console.log('📋 测试报告数据:', {
      id: testReport.id,
      userId: testReport.userId,
      contentLength: testReport.content.length,
      userDataHash: testReport.userDataHash
    })
    
    // 第一次保存
    console.log('\n1️⃣ 第一次保存...')
    await testSavePersonalityReport(testPhone, testReport)
    
    // 验证保存结果
    console.log('\n🔍 验证第一次保存结果...')
    const { data: savedReport1, error: verifyError1 } = await supabase
      .from('personality_reports')
      .select('*')
      .eq('user_id', (await supabase.from('users').select('id').eq('phone_number', testPhone).single()).data.id)
      .single()
    
    if (savedReport1) {
      console.log('✅ 第一次保存验证成功:', {
        id: savedReport1.id,
        contentLength: savedReport1.content.length,
        hash: savedReport1.user_data_hash
      })
    }
    
    // 第二次保存（应该更新）
    console.log('\n2️⃣ 第二次保存（更新）...')
    const updatedReport = {
      ...testReport,
      content: '这是更新后的性格报告内容，用于测试更新功能。',
      userDataHash: 'updated_hash_' + Date.now(),
      cozeConversationId: 'updated_conversation_' + Date.now()
    }
    
    await testSavePersonalityReport(testPhone, updatedReport)
    
    // 验证更新结果
    console.log('\n🔍 验证第二次保存结果...')
    const { data: savedReport2, error: verifyError2 } = await supabase
      .from('personality_reports')
      .select('*')
      .eq('user_id', (await supabase.from('users').select('id').eq('phone_number', testPhone).single()).data.id)
      .single()
    
    if (savedReport2) {
      console.log('✅ 第二次保存验证成功:', {
        id: savedReport2.id,
        contentLength: savedReport2.content.length,
        hash: savedReport2.user_data_hash,
        isUpdated: savedReport2.content !== savedReport1.content
      })
    }
    
    // 检查是否只有一条记录
    const { data: allReports } = await supabase
      .from('personality_reports')
      .select('id')
      .eq('user_id', (await supabase.from('users').select('id').eq('phone_number', testPhone).single()).data.id)
    
    console.log('\n📊 总记录数:', allReports?.length)
    
    if (allReports && allReports.length === 1) {
      console.log('✅ 确认只有一条记录，更新功能正常')
    } else {
      console.log('❌ 记录数异常，可能存在重复')
    }
    
    console.log('\n🎉 测试完成!')
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
  }
}

runTest()
