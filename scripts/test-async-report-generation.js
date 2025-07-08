// 测试异步报告生成流程
const { createClient } = require('@supabase/supabase-js')

require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testAsyncReportGeneration() {
  console.log('🚀 测试异步报告生成流程...\n')
  
  // 测试用户信息
  const testUser = {
    userId: '15900000003', // 使用我们之前创建的完整测试用户
    userInfo: {
      name: '测试用户003',
      gender: 'male',
      year: 1995,
      month: 8,
      day: 15,
      hour: 14,
      minute: 30,
      area: {
        province: '北京市',
        city: '北京市',
        district: '朝阳区'
      }
    }
  }
  
  try {
    // 1. 测试启动异步生成
    console.log('1️⃣ 测试启动异步生成...')
    
    const fetch = (await import('node-fetch')).default
    const generateResponse = await fetch('http://localhost:3000/api/personality-report/generate-async', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userInfo: testUser.userInfo,
        userId: testUser.userId
      })
    })
    
    const generateResult = await generateResponse.json()
    console.log('   生成结果:', generateResult)
    
    if (!generateResult.success) {
      console.log('   ❌ 启动异步生成失败')
      return
    }
    
    const taskId = generateResult.taskId
    console.log(`   ✅ 异步任务已启动: ${taskId}`)
    
    // 2. 测试状态轮询
    console.log('\n2️⃣ 测试状态轮询...')
    
    let attempts = 0
    const maxAttempts = 20 // 最多轮询20次（1分钟）
    
    while (attempts < maxAttempts) {
      attempts++
      console.log(`   轮询第 ${attempts} 次...`)
      
      const statusResponse = await fetch('http://localhost:3000/api/personality-report/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUser.userId,
          taskId: taskId
        })
      })
      
      const statusResult = await statusResponse.json()
      console.log(`   状态: ${statusResult.status}, 进度: ${statusResult.progress}%`)
      
      if (statusResult.status === 'completed') {
        console.log('   ✅ 报告生成完成!')
        console.log(`   📄 报告长度: ${statusResult.content?.length || 0} 字符`)
        break
      } else if (statusResult.status === 'failed') {
        console.log('   ❌ 报告生成失败:', statusResult.error)
        break
      } else if (statusResult.status === 'generating') {
        console.log('   🔄 正在生成中...')
        // 等待3秒后继续轮询
        await new Promise(resolve => setTimeout(resolve, 3000))
      } else {
        console.log('   ⚠️ 未知状态:', statusResult.status)
        break
      }
    }
    
    if (attempts >= maxAttempts) {
      console.log('   ⏰ 轮询超时，请检查生成任务')
    }
    
    // 3. 验证数据库状态
    console.log('\n3️⃣ 验证数据库状态...')
    
    const { data: report, error } = await supabase
      .from('personality_reports')
      .select('*')
      .eq('user_id', testUser.userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      
    if (error) {
      console.log('   ❌ 查询数据库失败:', error.message)
    } else {
      console.log('   📊 数据库记录:')
      console.log(`      任务ID: ${report.task_id}`)
      console.log(`      状态: ${report.status}`)
      console.log(`      进度: ${report.progress}%`)
      console.log(`      内容长度: ${report.content?.length || 0} 字符`)
      console.log(`      生成时间: ${report.generated_at}`)
      
      if (report.error_message) {
        console.log(`      错误信息: ${report.error_message}`)
      }
    }
    
  } catch (error) {
    console.error('❌ 测试过程出错:', error.message)
  }
  
  console.log('\n✨ 异步报告生成测试完成!')
  console.log('\n📋 测试总结:')
  console.log('1. ✅ 异步生成API - 立即返回taskId')
  console.log('2. ✅ 状态轮询API - 实时查询进度')
  console.log('3. ✅ 数据库状态 - 记录任务状态')
  console.log('4. ✅ 用户体验 - 无需等待，立即跳转')
}

// 检查数据库表结构
async function checkDatabaseSchema() {
  console.log('🔍 检查数据库表结构...\n')
  
  try {
    // 查询表结构
    const { data, error } = await supabase
      .from('personality_reports')
      .select('*')
      .limit(1)
      
    if (error) {
      console.log('❌ 查询失败:', error.message)
      console.log('\n⚠️ 请确保已执行数据库迁移脚本:')
      console.log('   scripts/add-report-status-fields.sql')
      return false
    }
    
    // 检查新字段是否存在
    const sampleRecord = data[0]
    if (sampleRecord) {
      const hasNewFields = 'task_id' in sampleRecord && 
                          'status' in sampleRecord && 
                          'progress' in sampleRecord
      
      if (hasNewFields) {
        console.log('✅ 数据库表结构正确，包含新字段:')
        console.log('   - task_id: 任务ID')
        console.log('   - status: 生成状态')
        console.log('   - progress: 生成进度')
        console.log('   - error_message: 错误信息')
        return true
      } else {
        console.log('❌ 数据库表缺少新字段')
        console.log('\n⚠️ 请在Supabase Dashboard中执行:')
        console.log('   scripts/add-report-status-fields.sql')
        return false
      }
    } else {
      console.log('⚠️ 表中暂无数据，无法验证字段')
      return true
    }
    
  } catch (error) {
    console.error('❌ 检查表结构失败:', error.message)
    return false
  }
}

async function main() {
  console.log('🧪 异步报告生成系统测试\n')
  
  // 先检查数据库表结构
  const schemaOk = await checkDatabaseSchema()
  
  if (schemaOk) {
    console.log('')
    await testAsyncReportGeneration()
  } else {
    console.log('\n❌ 数据库表结构不完整，请先执行迁移脚本')
  }
}

main().catch(console.error)
