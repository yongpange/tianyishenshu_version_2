const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function testReportStatusCache() {
  console.log('🧪 测试报告状态缓存系统...\n')
  
  const baseUrl = 'http://localhost:3000'
  
  try {
    // 1. 获取测试用户
    console.log('1. 获取测试用户')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    const { data: users, error } = await supabase
      .from('user_profiles')
      .select('id, name, birth_date, birth_time, birth_location, gender')
      .limit(1)
    
    if (error || !users || users.length === 0) {
      console.log('   ❌ 没有找到测试用户')
      return
    }
    
    const testUser = users[0]
    console.log(`   ✅ 使用测试用户: ${testUser.id} (${testUser.name || '未命名'})`)
    
    // 构造用户信息
    const userInfo = {
      name: testUser.name || '测试用户',
      birthDate: testUser.birth_date || '2000-01-01',
      birthTime: testUser.birth_time || '00:00',
      birthLocation: testUser.birth_location || '北京市',
      gender: testUser.gender || 'male'
    }
    
    // 2. 测试查询不存在的报告状态
    console.log('\n2. 测试查询不存在的报告状态')
    const startTime1 = Date.now()
    
    try {
      const response = await fetch(`${baseUrl}/api/personality-report/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: testUser.id,
          isUserProfileId: true 
        })
      })
      
      const result = await response.json()
      const duration1 = Date.now() - startTime1
      
      console.log(`   状态: ${response.status}`)
      console.log(`   耗时: ${duration1}ms`)
      console.log(`   报告状态: ${result.status}`)
      console.log(`   进度: ${result.progress}%`)
    } catch (error) {
      console.log(`   错误: ${error.message}`)
    }
    
    // 3. 测试启动报告生成
    console.log('\n3. 测试启动报告生成')
    const startTime2 = Date.now()
    
    try {
      const response = await fetch(`${baseUrl}/api/personality-report/generate-async`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: testUser.id,
          userInfo: userInfo,
          isUserProfileId: true 
        })
      })
      
      const result = await response.json()
      const duration2 = Date.now() - startTime2
      
      console.log(`   状态: ${response.status}`)
      console.log(`   耗时: ${duration2}ms`)
      console.log(`   成功: ${result.success}`)
      console.log(`   任务ID: ${result.taskId || '无'}`)
      
      if (!result.success) {
        console.log(`   错误: ${result.error}`)
      }
      
      // 如果成功启动，记录任务ID用于后续测试
      const taskId = result.taskId
      
      // 4. 测试查询生成中的状态（应该从缓存获取）
      if (taskId && taskId !== 'existing') {
        console.log('\n4. 测试查询生成中的状态（缓存测试）')
        
        // 等待一小段时间让缓存生效
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const startTime3 = Date.now()
        
        try {
          const response = await fetch(`${baseUrl}/api/personality-report/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              userId: testUser.id,
              taskId: taskId,
              isUserProfileId: true 
            })
          })
          
          const result = await response.json()
          const duration3 = Date.now() - startTime3
          
          console.log(`   状态: ${response.status}`)
          console.log(`   耗时: ${duration3}ms`)
          console.log(`   报告状态: ${result.status}`)
          console.log(`   进度: ${result.progress}%`)
          console.log(`   任务ID: ${result.taskId || '无'}`)
          
          if (result.error) {
            console.log(`   错误: ${result.error}`)
          }
        } catch (error) {
          console.log(`   错误: ${error.message}`)
        }
        
        // 5. 测试重复提交（应该被拒绝）
        console.log('\n5. 测试重复提交（防重复机制）')
        const startTime4 = Date.now()
        
        try {
          const response = await fetch(`${baseUrl}/api/personality-report/generate-async`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              userId: testUser.id,
              userInfo: userInfo,
              isUserProfileId: true 
            })
          })
          
          const result = await response.json()
          const duration4 = Date.now() - startTime4
          
          console.log(`   状态: ${response.status}`)
          console.log(`   耗时: ${duration4}ms`)
          console.log(`   成功: ${result.success}`)
          
          if (!result.success) {
            console.log(`   错误: ${result.error}`)
          }
        } catch (error) {
          console.log(`   错误: ${error.message}`)
        }
        
        // 6. 持续监控生成状态
        console.log('\n6. 持续监控生成状态（每5秒查询一次，最多查询6次）')
        
        for (let i = 0; i < 6; i++) {
          await new Promise(resolve => setTimeout(resolve, 5000))
          
          const startTime = Date.now()
          
          try {
            const response = await fetch(`${baseUrl}/api/personality-report/status`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                userId: testUser.id,
                taskId: taskId,
                isUserProfileId: true 
              })
            })
            
            const result = await response.json()
            const duration = Date.now() - startTime
            
            console.log(`   第${i+1}次查询 - 耗时: ${duration}ms, 状态: ${result.status}, 进度: ${result.progress}%`)
            
            if (result.status === 'completed') {
              console.log(`   ✅ 报告生成完成！内容长度: ${result.content?.length || 0}`)
              break
            } else if (result.status === 'failed') {
              console.log(`   ❌ 报告生成失败: ${result.error}`)
              break
            }
          } catch (error) {
            console.log(`   第${i+1}次查询错误: ${error.message}`)
          }
        }
      }
      
    } catch (error) {
      console.log(`   错误: ${error.message}`)
    }
    
    // 7. 测试缓存性能对比
    console.log('\n7. 测试缓存性能对比（连续查询10次）')
    
    const times = []
    for (let i = 0; i < 10; i++) {
      const startTime = Date.now()
      
      try {
        const response = await fetch(`${baseUrl}/api/personality-report/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: testUser.id,
            isUserProfileId: true 
          })
        })
        
        const result = await response.json()
        const duration = Date.now() - startTime
        times.push(duration)
        
        console.log(`   第${i+1}次查询: ${duration}ms`)
      } catch (error) {
        console.log(`   第${i+1}次查询错误: ${error.message}`)
      }
      
      // 短暂延迟
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    if (times.length > 0) {
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length
      const minTime = Math.min(...times)
      const maxTime = Math.max(...times)
      
      console.log(`   平均响应时间: ${avgTime.toFixed(2)}ms`)
      console.log(`   最快响应时间: ${minTime}ms`)
      console.log(`   最慢响应时间: ${maxTime}ms`)
    }
    
    console.log('\n✅ 报告状态缓存系统测试完成')
    
  } catch (error) {
    console.error('\n❌ 测试过程出错:', error)
  }
}

// 运行测试
testReportStatusCache().catch(console.error)
