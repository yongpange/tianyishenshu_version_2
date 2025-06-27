import { NextResponse } from 'next/server'
import { testSupabaseConnection } from '@/lib/supabase-test'

export async function GET() {
  try {
    console.log('🚀 开始 Supabase 连接测试...')
    
    const isConnected = await testSupabaseConnection()
    
    return NextResponse.json({
      success: isConnected,
      message: isConnected ? 'Supabase 连接正常' : 'Supabase 连接失败',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('测试 API 错误:', error)
    return NextResponse.json(
      {
        success: false,
        message: '测试过程中发生错误',
        error: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}
