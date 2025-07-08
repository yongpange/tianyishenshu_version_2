// 使用动态导入来支持fetch
async function fetchData(url, options) {
  const fetch = (await import('node-fetch')).default
  return fetch(url, options)
}

// 测试手机号检查逻辑
async function testPhoneCheckLogic() {
  console.log('🧪 测试新的手机号检查逻辑...\n')
  
  const testCases = [
    {
      name: '已注册手机号',
      phone: '13800138000',
      expectedExists: true
    },
    {
      name: '未注册手机号',
      phone: '13900139000',
      expectedExists: false
    },
    {
      name: '无效手机号格式',
      phone: '123456789',
      expectedError: true
    }
  ]
  
  for (const testCase of testCases) {
    console.log(`📱 测试: ${testCase.name} (${testCase.phone})`)
    
    try {
      const response = await fetchData('http://localhost:3000/api/auth/check-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testCase.phone })
      })
      
      const result = await response.json()
      
      if (testCase.expectedError) {
        if (!response.ok) {
          console.log(`✅ 正确返回错误: ${result.message}`)
        } else {
          console.log(`❌ 应该返回错误但成功了: ${JSON.stringify(result)}`)
        }
      } else {
        if (response.ok) {
          if (result.exists === testCase.expectedExists) {
            console.log(`✅ 正确识别手机号状态: exists=${result.exists}`)
            if (result.user) {
              console.log(`   用户信息: ID=${result.user.id}, 资料完整=${result.user.is_profile_completed}`)
            }
          } else {
            console.log(`❌ 手机号状态不符合预期: 期望=${testCase.expectedExists}, 实际=${result.exists}`)
          }
        } else {
          console.log(`❌ API调用失败: ${result.message}`)
        }
      }
      
    } catch (error) {
      console.log(`❌ 请求失败: ${error.message}`)
    }
    
    console.log('')
  }
}

// 测试注册流程中的手机号检查
async function testRegisterFlow() {
  console.log('🔄 测试注册流程中的手机号检查...\n')
  
  const existingPhone = '13800138000'
  const newPhone = '13900139000'
  
  console.log(`📱 测试已注册手机号: ${existingPhone}`)
  try {
    const response = await fetchData('http://localhost:3000/api/auth/check-phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: existingPhone })
    })
    
    const result = await response.json()
    
    if (response.ok && result.exists) {
      console.log('✅ 正确识别已注册手机号，应该提示跳转到登录页')
    } else {
      console.log('❌ 未能正确识别已注册手机号')
    }
  } catch (error) {
    console.log(`❌ 请求失败: ${error.message}`)
  }
  
  console.log('')
  
  console.log(`📱 测试未注册手机号: ${newPhone}`)
  try {
    const response = await fetchData('http://localhost:3000/api/auth/check-phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: newPhone })
    })
    
    const result = await response.json()
    
    if (response.ok && !result.exists) {
      console.log('✅ 正确识别未注册手机号，应该允许发送验证码')
    } else {
      console.log('❌ 未能正确识别未注册手机号')
    }
  } catch (error) {
    console.log(`❌ 请求失败: ${error.message}`)
  }
}

async function main() {
  console.log('🚀 开始测试手机号检查逻辑...\n')
  
  await testPhoneCheckLogic()
  await testRegisterFlow()
  
  console.log('✨ 测试完成!')
}

main().catch(console.error)
