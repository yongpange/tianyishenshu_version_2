// 测试性格报告生成完整流程
const { createClient } = require('@supabase/supabase-js')

// Supabase配置
const supabaseUrl = 'https://btelqkjrapktqrdwhuag.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0ZWxxa2pyYXBrdHFyZHdodWFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDczODA0MCwiZXhwIjoyMDY2MzE0MDQwfQ.XhahvoDm9nHgYXj55gwbnkvZMtHab2s-OPTIp9la3xk'

const supabase = createClient(supabaseUrl, supabaseKey)

// 测试数据
const testUserInfo = {
  name: '测试用户',
  gender: 'male',
  year: 1990,
  month: 5,
  day: 15,
  hour: 14,
  minute: 30,
  area: {
    province: '北京市',
    city: '北京市',
    district: '朝阳区'
  }
}

const testUserId = 'test_' + Date.now()

async function checkTableStructure() {
  console.log('🔍 检查数据库表结构...')
  
  try {
    // 检查personality_reports表结构
    const { data, error } = await supabase
      .from('personality_reports')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ 查询表结构失败:', error)
      return false
    }
    
    console.log('✅ personality_reports表可访问')
    
    // 尝试插入测试记录来验证字段
    const testRecord = {
      user_id: testUserId,
      content: 'test content',
      user_data_hash: 'test_hash',
      task_id: 'test_task_' + Date.now(),
      status: 'generating',
      progress: 0,
      error_message: null
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('personality_reports')
      .insert(testRecord)
      .select()
    
    if (insertError) {
      console.error('❌ 插入测试记录失败:', insertError)
      console.log('可能缺少新字段，需要执行数据库迁移')
      return false
    }
    
    console.log('✅ 表结构包含所有必需字段')
    
    // 清理测试记录
    await supabase
      .from('personality_reports')
      .delete()
      .eq('user_id', testUserId)
    
    return true
    
  } catch (error) {
    console.error('❌ 检查表结构时出错:', error)
    return false
  }
}

async function testAPIChain() {
  console.log('🧪 测试API调用链路...')

  try {
    // 1. 测试用户资料保存API
    console.log('📝 测试用户资料保存...')
    const profileResponse = await fetch('http://localhost:3000/api/user-profile/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: testUserId,
        userInfo: testUserInfo
      })
    })

    const profileResult = await profileResponse.json()
    console.log('📋 用户资料保存结果:', profileResult)

    if (!profileResult.success) {
      console.error('❌ 用户资料保存失败:', profileResult.error)
      return false
    }
    
    // 2. 测试异步报告生成API
    console.log('🚀 测试异步报告生成...')
    const asyncResponse = await fetch('http://localhost:3000/api/personality-report/generate-async', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userInfo: testUserInfo,
        userId: testUserId
      })
    })
    
    const asyncResult = await asyncResponse.json()
    console.log('📋 异步生成结果:', asyncResult)
    
    if (!asyncResult.success) {
      console.error('❌ 异步报告生成失败')
      return false
    }
    
    const taskId = asyncResult.taskId
    
    // 3. 轮询状态检查
    console.log('🔄 开始轮询状态...')
    let attempts = 0
    const maxAttempts = 20
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 3000)) // 等待3秒
      
      const statusResponse = await fetch('http://localhost:3000/api/personality-report/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
          taskId: taskId
        })
      })
      
      const statusResult = await statusResponse.json()
      console.log(`📊 轮询状态 (${attempts + 1}/${maxAttempts}):`, statusResult)
      
      if (statusResult.status === 'completed') {
        console.log('✅ 报告生成完成!')
        console.log('📄 报告内容长度:', statusResult.content?.length || 0)
        return true
      } else if (statusResult.status === 'failed') {
        console.error('❌ 报告生成失败:', statusResult.error)
        return false
      }
      
      attempts++
    }
    
    console.warn('⚠️ 轮询超时，报告可能仍在生成中')
    return false
    
  } catch (error) {
    console.error('❌ API测试失败:', error)
    return false
  }
}

async function validateDataStructures() {
  console.log('🔍 验证数据结构...')
  
  // 检查UserInfo结构
  const requiredFields = ['name', 'gender', 'year', 'month', 'day', 'hour', 'minute', 'area']
  const areaFields = ['province', 'city', 'district']
  
  for (const field of requiredFields) {
    if (!(field in testUserInfo)) {
      console.error(`❌ UserInfo缺少字段: ${field}`)
      return false
    }
  }
  
  for (const field of areaFields) {
    if (!(field in testUserInfo.area)) {
      console.error(`❌ UserInfo.area缺少字段: ${field}`)
      return false
    }
  }
  
  console.log('✅ UserInfo数据结构验证通过')
  return true
}

async function runTests() {
  console.log('🚀 开始性格报告流程测试...\n')
  
  // 1. 验证数据结构
  const structureValid = await validateDataStructures()
  if (!structureValid) {
    console.log('\n❌ 数据结构验证失败，停止测试')
    return
  }
  
  // 2. 检查数据库表结构
  const tableValid = await checkTableStructure()
  if (!tableValid) {
    console.log('\n❌ 数据库表结构检查失败，请执行以下SQL:')
    console.log('scripts/add-report-status-fields.sql')
    return
  }
  
  // 3. 测试API调用链路
  const apiValid = await testAPIChain()
  if (!apiValid) {
    console.log('\n❌ API调用链路测试失败')
    return
  }
  
  console.log('\n✅ 所有测试通过！性格报告生成流程正常工作')
}

// 运行测试
runTests().catch(console.error)
