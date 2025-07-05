// 测试八字排盘API
const testData = {
  name: "张三",
  gender: "male",
  birthDate: "2000-02-01",
  birthTime: "12:00",
  region: "11 1101 110105"  // 模拟地区编码
}

async function testAstrologyAPI() {
  try {
    console.log('🧪 开始测试八字排盘API...')
    console.log('📤 发送测试数据:', testData)
    
    const response = await fetch('http://localhost:3000/api/astrology/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    })
    
    console.log('📥 API响应状态:', response.status)
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ API调用成功!')
      console.log('📋 返回数据:', JSON.stringify(result, null, 2))
    } else {
      const error = await response.json()
      console.log('❌ API调用失败:', error)
    }
    
  } catch (error) {
    console.error('🔥 测试过程中发生错误:', error)
  }
}

// 运行测试
testAstrologyAPI() 