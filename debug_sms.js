// 在浏览器控制台中运行此代码来测试短信发送
console.log('🔍 开始测试短信发送API...')

// 测试短信发送
async function testSmsSend() {
  const phoneNumber = prompt('请输入要测试的手机号（11位数字）:')
  
  if (!phoneNumber || phoneNumber.length !== 11) {
    console.error('❌ 手机号格式不正确')
    return
  }
  
  console.log('📱 测试手机号:', phoneNumber)
  
  try {
    // 1. 先检查手机号是否已注册
    console.log('🔍 检查手机号是否已注册...')
    const checkResponse = await fetch('/api/auth/check-phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phoneNumber })
    })
    
    const checkResult = await checkResponse.json()
    console.log('📋 手机号检查结果:', checkResult)
    
    if (checkResult.exists) {
      console.log('⚠️ 手机号已注册，这是注册页面测试，但仍继续发送验证码测试')
    }
    
    // 2. 发送验证码
    console.log('📨 发送验证码...')
    const smsResponse = await fetch('/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phoneNumber, type: 'register' })
    })
    
    console.log('📊 SMS API响应状态:', smsResponse.status)
    
    const smsResult = await smsResponse.json()
    console.log('📨 SMS API响应结果:', smsResult)
    
    if (smsResponse.ok) {
      console.log('✅ 验证码发送成功!')
      alert('验证码发送成功！请查看手机短信。')
    } else {
      console.error('❌ 验证码发送失败:', smsResult.message)
      alert('验证码发送失败: ' + smsResult.message)
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error)
    alert('测试失败: ' + error.message)
  }
}

// 执行测试
testSmsSend()

console.log('🔍 SMS测试工具已启动！')
