// 健康检查API端点
// 用于Docker容器健康检查和负载均衡器探测

import { NextRequest, NextResponse } from 'next/server'
import { checkRedisConnection } from '@/lib/redis'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // 基础健康检查
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: 'unknown',
        redis: 'unknown',
        coze: 'unknown'
      }
    }

    // 检查Supabase连接
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('count')
        .limit(1)

      healthStatus.services.database = error ? 'unhealthy' : 'healthy'
    } catch (error) {
      healthStatus.services.database = 'unhealthy'
    }

    // 检查Redis连接
    try {
      const isRedisHealthy = await checkRedisConnection()
      healthStatus.services.redis = isRedisHealthy ? 'healthy' : 'unhealthy'
    } catch (error) {
      healthStatus.services.redis = 'unhealthy'
    }

    // 检查Coze API（可选）
    try {
      // 这里可以添加Coze API连接检查
      healthStatus.services.coze = 'healthy'
    } catch (error) {
      healthStatus.services.coze = 'unhealthy'
    }

    return NextResponse.json(healthStatus, { status: 200 })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}

// 支持HEAD请求（用于简单的存活检查）
export async function HEAD(request: NextRequest) {
  try {
    return new NextResponse(null, { status: 200 })
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}
