// 测试八字排盘上下文功能
import { getAstrologyContext } from './src/utils/personality-report'

async function testAstrologyContext() {
  console.log('🧪 测试八字排盘上下文功能...')
  
  // 模拟用户信息
  const userInfo = {
    year: 1990,
    month: 5,
    day: 15,
    hour: 10,
    minute: 30,
    gender: 'male',
    area: {
      province: '北京市',
      city: '北京市',
      district: '朝阳区'
    }
  }

  try {
    const context = await getAstrologyContext(userInfo)
    console.log('✅ 八字排盘上下文获取成功:')
    console.log('---')
    console.log(context)
    console.log('---')
    console.log('📊 上下文长度:', context.length, '字符')
    
  } catch (error) {
    console.error('❌ 测试失败:', error instanceof Error ? error.message : error)
  }
}

// 运行测试
testAstrologyContext() 