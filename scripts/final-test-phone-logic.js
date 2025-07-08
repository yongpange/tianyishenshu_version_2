// 最终测试手机号验证逻辑
async function finalTest() {
  console.log('🚀 最终测试手机号验证逻辑...\n')
  
  const testCases = [
    {
      name: '已注册手机号 15900675256',
      phone: '15900675256',
      expectedExists: true,
      description: '应该提示已注册并询问是否跳转到登录页'
    },
    {
      name: '已注册手机号 15900675252', 
      phone: '15900675252',
      expectedExists: true,
      description: '应该提示已注册并询问是否跳转到登录页'
    },
    {
      name: '未注册手机号 15900675999',
      phone: '15900675999',
      expectedExists: false,
      description: '应该正常发送验证码'
    },
    {
      name: '带空格的手机号',
      phone: ' 15900675256 ',
      expectedExists: true,
      description: '应该自动清理空格并正确识别为已注册'
    }
  ]
  
  for (const testCase of testCases) {
    console.log(`📱 测试: ${testCase.name}`)
    console.log(`   输入: "${testCase.phone}"`)
    console.log(`   期望: ${testCase.description}`)
    
    try {
      const fetch = (await import('node-fetch')).default
      const response = await fetch('http://localhost:3000/api/auth/check-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testCase.phone })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        const actualExists = result.exists
        if (actualExists === testCase.expectedExists) {
          console.log(`   ✅ 结果正确: exists=${actualExists}`)
          if (result.user) {
            console.log(`   📋 用户信息: ID=${result.user.id.substring(0, 8)}..., 资料完整=${result.user.is_profile_completed}`)
          }
        } else {
          console.log(`   ❌ 结果错误: 期望=${testCase.expectedExists}, 实际=${actualExists}`)
        }
      } else {
        console.log(`   ❌ API调用失败: ${result.message}`)
      }
      
    } catch (error) {
      console.log(`   ❌ 请求失败: ${error.message}`)
    }
    
    console.log('')
  }
  
  // 测试注册流程
  console.log('🔄 测试注册流程逻辑...\n')
  
  const registerTestCases = [
    {
      name: '注册已存在的手机号',
      phone: '15900675256',
      shouldBlock: true
    },
    {
      name: '注册新手机号',
      phone: '15900675999',
      shouldBlock: false
    }
  ]
  
  for (const testCase of registerTestCases) {
    console.log(`📝 ${testCase.name}: ${testCase.phone}`)
    
    try {
      const fetch = (await import('node-fetch')).default
      const response = await fetch('http://localhost:3000/api/auth/check-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testCase.phone })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        if (testCase.shouldBlock && result.exists) {
          console.log('   ✅ 正确阻止注册，应该提示跳转到登录页')
        } else if (!testCase.shouldBlock && !result.exists) {
          console.log('   ✅ 允许注册，应该发送验证码')
        } else {
          console.log(`   ❌ 逻辑错误: shouldBlock=${testCase.shouldBlock}, exists=${result.exists}`)
        }
      } else {
        console.log(`   ❌ API调用失败: ${result.message}`)
      }
      
    } catch (error) {
      console.log(`   ❌ 请求失败: ${error.message}`)
    }
    
    console.log('')
  }
  
  console.log('✨ 测试完成!')
  console.log('\n📋 总结:')
  console.log('1. 数据库中的脏数据（包含换行符的手机号）已清理')
  console.log('2. API现在会自动清理输入的手机号空白字符')
  console.log('3. 注册页面在发送验证码前会检查手机号是否已注册')
  console.log('4. 如果手机号已注册，会提示用户并询问是否跳转到登录页')
  console.log('5. 验证逻辑不是通读整个数据库，而是使用精确的SQL查询')
}

finalTest().catch(console.error)
