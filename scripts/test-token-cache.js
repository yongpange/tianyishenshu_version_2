const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function testTokenCache() {
  console.log('🧪 测试Token缓存系统...\n')
  
  const baseUrl = 'http://localhost:3000'
  
  try {
    // 1. 测试获取不存在用户的Token
    console.log('1. 测试获取不存在用户的Token')
    try {
      const response = await fetch(`${baseUrl}/api/user-profiles/coze-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userProfileId: 'non-existent-user' })
      })
      
      const result = await response.json()
      console.log(`   状态: ${response.status}`)
      console.log(`   响应: ${JSON.stringify(result, null, 2)}`)
    } catch (error) {
      console.log(`   错误: ${error.message}`)
    }
    
    // 2. 获取真实用户进行测试
    console.log('\n2. 获取测试用户')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    const { data: users, error } = await supabase
      .from('user_profiles')
      .select('id, name')
      .limit(1)
    
    if (error || !users || users.length === 0) {
      console.log('   ❌ 没有找到测试用户')
      return
    }
    
    const testUser = users[0]
    console.log(`   ✅ 使用测试用户: ${testUser.id} (${testUser.name || '未命名'})`)
    
    // 3. 测试首次获取Token（应该从数据库获取或生成新的）
    console.log('\n3. 测试首次获取Token')
    const startTime1 = Date.now()
    
    try {
      const response = await fetch(`${baseUrl}/api/user-profiles/coze-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userProfileId: testUser.id })
      })
      
      const result = await response.json()
      const duration1 = Date.now() - startTime1
      
      console.log(`   状态: ${response.status}`)
      console.log(`   耗时: ${duration1}ms`)
      console.log(`   缓存: ${result.cached ? '是' : '否'}`)
      console.log(`   来源: ${result.source || '未知'}`)
      
      if (result.success) {
        console.log(`   Token: ${result.token ? result.token.substring(0, 20) + '...' : '无'}`)
      }
    } catch (error) {
      console.log(`   错误: ${error.message}`)
    }
    
    // 4. 测试第二次获取Token（应该从缓存获取）
    console.log('\n4. 测试第二次获取Token（缓存测试）')
    const startTime2 = Date.now()
    
    try {
      const response = await fetch(`${baseUrl}/api/user-profiles/coze-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userProfileId: testUser.id })
      })
      
      const result = await response.json()
      const duration2 = Date.now() - startTime2
      
      console.log(`   状态: ${response.status}`)
      console.log(`   耗时: ${duration2}ms`)
      console.log(`   缓存: ${result.cached ? '是' : '否'}`)
      console.log(`   来源: ${result.source || '未知'}`)
      
      if (result.success) {
        console.log(`   Token: ${result.token ? result.token.substring(0, 20) + '...' : '无'}`)
      }
    } catch (error) {
      console.log(`   错误: ${error.message}`)
    }
    
    // 5. 测试强制刷新Token
    console.log('\n5. 测试强制刷新Token')
    const startTime3 = Date.now()
    
    try {
      const response = await fetch(`${baseUrl}/api/user-profiles/coze-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userProfileId: testUser.id,
          forceRefresh: true 
        })
      })
      
      const result = await response.json()
      const duration3 = Date.now() - startTime3
      
      console.log(`   状态: ${response.status}`)
      console.log(`   耗时: ${duration3}ms`)
      console.log(`   缓存: ${result.cached ? '是' : '否'}`)
      console.log(`   来源: ${result.source || '未知'}`)
      
      if (result.success) {
        console.log(`   Token: ${result.token ? result.token.substring(0, 20) + '...' : '无'}`)
      }
    } catch (error) {
      console.log(`   错误: ${error.message}`)
    }
    
    // 6. 测试清除Token
    console.log('\n6. 测试清除Token')
    
    try {
      const response = await fetch(`${baseUrl}/api/user-profiles/coze-token`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userProfileId: testUser.id })
      })
      
      const result = await response.json()
      
      console.log(`   状态: ${response.status}`)
      console.log(`   响应: ${JSON.stringify(result, null, 2)}`)
    } catch (error) {
      console.log(`   错误: ${error.message}`)
    }
    
    // 7. 测试清除后再次获取Token
    console.log('\n7. 测试清除后再次获取Token')
    const startTime4 = Date.now()
    
    try {
      const response = await fetch(`${baseUrl}/api/user-profiles/coze-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userProfileId: testUser.id })
      })
      
      const result = await response.json()
      const duration4 = Date.now() - startTime4
      
      console.log(`   状态: ${response.status}`)
      console.log(`   耗时: ${duration4}ms`)
      console.log(`   缓存: ${result.cached ? '是' : '否'}`)
      console.log(`   来源: ${result.source || '未知'}`)
      
      if (result.success) {
        console.log(`   Token: ${result.token ? result.token.substring(0, 20) + '...' : '无'}`)
      }
    } catch (error) {
      console.log(`   错误: ${error.message}`)
    }
    
    console.log('\n✅ Token缓存系统测试完成')
    
  } catch (error) {
    console.error('\n❌ 测试过程出错:', error)
  }
}

// 运行测试
testTokenCache().catch(console.error)
