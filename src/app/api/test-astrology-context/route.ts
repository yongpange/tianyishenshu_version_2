import { NextResponse } from 'next/server'
import { getAstrologyContext } from '@/utils/personality-report'

export async function GET() {
  try {
    console.log('🧪 测试八字排盘上下文功能...')
    
    // 使用新的测试用户信息
    const userInfo = {
      year: 2000,
      month: 2,
      day: 1,
      hour: 12,
      minute: 0,
      gender: 'male',
      area: {
        province: '北京市',
        city: '市辖区',
        district: '丰台区'
      }
    }

    const context = await getAstrologyContext(userInfo)
    
    console.log('✅ 八字排盘上下文获取成功:')
    console.log('---')
    console.log(context)
    console.log('---')
    console.log('📊 上下文长度:', context.length, '字符')
    
    return NextResponse.json({
      success: true,
      userInfo: userInfo,
      context: context,
      length: context.length,
      message: '八字排盘上下文获取成功'
    }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    })
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      message: '测试失败'
    }, { status: 500 })
  }
} 