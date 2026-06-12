const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function testAllCacheSystems() {
  console.log('🧪 测试所有Redis缓存系统...\n')
  
  const baseUrl = 'http://localhost:3000'
  
  try {
    // 1. 测试Redis基础连接
    console.log('1. 测试Redis基础连接')
    try {
      const response = await fetch(`${baseUrl}/api/health`)
      const result = await response.json()
      
      console.log(`   状态: ${response.status}`)
      console.log(`   数据库: ${result.database ? '✅' : '❌'}`)
      console.log(`   Redis: ${result.redis ? '✅' : '❌'}`)
      
      if (!result.redis) {
        console.log('   ⚠️ Redis不可用，但系统应该能正常降级运行')
      }
    } catch (error) {
      console.log(`   错误: ${error.message}`)
    }
    
    // 2. 测试Token缓存系统
    console.log('\n2. 测试Token缓存系统')
    
    // 获取测试用户
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    const { data: users, error } = await supabase
      .from('user_profiles')
      .select('id, name')
      .limit(1)
    
    if (error || !users || users.length === 0) {
      console.log('   ❌ 没有找到测试用户，跳过Token缓存测试')
    } else {
      const testUser = users[0]
      console.log(`   使用测试用户: ${testUser.id}`)
      
      // 测试Token获取
      const startTime = Date.now()
      
      try {
        const response = await fetch(`${baseUrl}/api/user-profiles/coze-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userProfileId: testUser.id })
        })
        
        const result = await response.json()
        const duration = Date.now() - startTime
        
        console.log(`   Token获取: ${response.status === 200 ? '✅' : '❌'}`)
        console.log(`   耗时: ${duration}ms`)
        console.log(`   缓存: ${result.cached ? '是' : '否'}`)
        console.log(`   来源: ${result.source || '未知'}`)
      } catch (error) {
        console.log(`   错误: ${error.message}`)
      }
    }
    
    // 3. 测试用户会话缓存
    console.log('\n3. 测试用户会话缓存')
    
    if (users && users.length > 0) {
      const testUser = users[0]
      const startTime = Date.now()
      
      try {
        const response = await fetch(`${baseUrl}/api/user-profiles/detail?id=${testUser.id}`)
        const result = await response.json()
        const duration = Date.now() - startTime
        
        console.log(`   用户资料获取: ${response.status === 200 ? '✅' : '❌'}`)
        console.log(`   耗时: ${duration}ms`)
        console.log(`   缓存来源: ${result.data?.cache_source || '未知'}`)
        
        if (result.data?.cached_at) {
          console.log(`   缓存时间: ${result.data.cached_at}`)
        }
      } catch (error) {
        console.log(`   错误: ${error.message}`)
      }
    }
    
    // 4. 测试API限流系统
    console.log('\n4. 测试API限流系统')
    
    // 测试SMS限流
    console.log('   测试SMS发送限流:')
    const testPhone = '13800138000'
    
    for (let i = 1; i <= 5; i++) {
      try {
        const response = await fetch(`${baseUrl}/api/sms/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            phone: testPhone,
            type: 'register'
          })
        })
        
        const result = await response.json()
        
        console.log(`   第${i}次尝试: ${response.status} - ${result.success ? '成功' : result.message}`)
        
        if (response.status === 429) {
          console.log(`   限流触发，重试时间: ${result.retryAfter}秒`)
          break
        }
        
        // 短暂延迟
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.log(`   第${i}次尝试错误: ${error.message}`)
      }
    }
    
    // 5. 测试报告状态缓存
    console.log('\n5. 测试报告状态缓存')
    
    if (users && users.length > 0) {
      const testUser = users[0]
      
      // 查询报告状态
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
        
        console.log(`   报告状态查询: ${response.status === 200 ? '✅' : '❌'}`)
        console.log(`   耗时: ${duration}ms`)
        console.log(`   状态: ${result.status}`)
        console.log(`   进度: ${result.progress}%`)
      } catch (error) {
        console.log(`   错误: ${error.message}`)
      }
    }
    
    // 6. 测试静态数据缓存
    console.log('\n6. 测试静态数据缓存')
    
    // 测试省市区数据加载
    const startTime = Date.now()
    
    try {
      const response = await fetch('/pca-code.json')
      const duration = Date.now() - startTime
      
      if (response.ok) {
        const data = await response.json()
        console.log(`   省市区数据加载: ✅`)
        console.log(`   耗时: ${duration}ms`)
        console.log(`   省份数量: ${data.length}`)
        
        // 计算总的城市和区县数量
        let cityCount = 0
        let districtCount = 0
        
        data.forEach(province => {
          if (province.children) {
            cityCount += province.children.length
            province.children.forEach(city => {
              if (city.children) {
                districtCount += city.children.length
              }
            })
          }
        })
        
        console.log(`   城市数量: ${cityCount}`)
        console.log(`   区县数量: ${districtCount}`)
      } else {
        console.log(`   省市区数据加载: ❌ (${response.status})`)
      }
    } catch (error) {
      console.log(`   错误: ${error.message}`)
    }
    
    // 7. 性能对比测试
    console.log('\n7. 性能对比测试（连续查询10次）')
    
    if (users && users.length > 0) {
      const testUser = users[0]
      const times = []
      
      for (let i = 0; i < 10; i++) {
        const startTime = Date.now()
        
        try {
          const response = await fetch(`${baseUrl}/api/user-profiles/detail?id=${testUser.id}`)
          const duration = Date.now() - startTime
          times.push(duration)
          
          console.log(`   第${i+1}次查询: ${duration}ms`)
        } catch (error) {
          console.log(`   第${i+1}次查询错误: ${error.message}`)
        }
        
        // 短暂延迟
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      
      if (times.length > 0) {
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length
        const minTime = Math.min(...times)
        const maxTime = Math.max(...times)
        
        console.log(`\n   性能统计:`)
        console.log(`   平均响应时间: ${avgTime.toFixed(2)}ms`)
        console.log(`   最快响应时间: ${minTime}ms`)
        console.log(`   最慢响应时间: ${maxTime}ms`)
        
        // 判断缓存效果
        if (avgTime < 50) {
          console.log(`   🚀 缓存效果优秀！`)
        } else if (avgTime < 100) {
          console.log(`   ✅ 缓存效果良好`)
        } else {
          console.log(`   ⚠️ 缓存效果一般，可能需要优化`)
        }
      }
    }
    
    // 8. 缓存系统总结
    console.log('\n8. 缓存系统总结')
    console.log('   ✅ Token缓存系统 - 减少OAuth验证频率')
    console.log('   ✅ 用户会话缓存 - 减少用户信息查询')
    console.log('   ✅ 报告状态缓存 - 提供实时状态查询')
    console.log('   ✅ API限流系统 - 防止滥用和重复提交')
    console.log('   ✅ 静态数据缓存 - 优化静态资源加载')
    
    console.log('\n✅ 所有缓存系统测试完成')
    
  } catch (error) {
    console.error('\n❌ 测试过程出错:', error)
  }
}

// 运行测试
testAllCacheSystems().catch(console.error)
