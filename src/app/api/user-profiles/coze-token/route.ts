import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createJWTToken } from '@/lib/coze-auth'

// 获取或刷新用户的Coze Access Token
export async function POST(request: NextRequest) {
  try {
    const { userProfileId, forceRefresh = false } = await request.json()
    
    if (!userProfileId) {
      return NextResponse.json({
        success: false,
        error: 'MISSING_USER_PROFILE_ID',
        message: '缺少用户资料ID'
      }, { status: 400 })
    }

    console.log('🔑 管理Coze Token:', { userProfileId, forceRefresh })

    const supabase = supabaseAdmin

    // 1. 获取用户当前的token信息
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('coze_access_token, coze_token_expires_at, coze_token_created_at')
      .eq('id', userProfileId)
      .single()

    if (profileError) {
      console.error('❌ 获取用户资料失败:', profileError)
      return NextResponse.json({
        success: false,
        error: 'USER_PROFILE_NOT_FOUND',
        message: '用户资料不存在'
      }, { status: 404 })
    }

    const now = new Date()
    const tokenExpiresAt = userProfile.coze_token_expires_at ? new Date(userProfile.coze_token_expires_at) : null
    const isTokenValid = tokenExpiresAt && tokenExpiresAt > now && userProfile.coze_access_token
    
    console.log('🔍 Token状态检查:', {
      hasToken: !!userProfile.coze_access_token,
      expiresAt: tokenExpiresAt?.toISOString(),
      isValid: isTokenValid,
      forceRefresh
    })

    // 2. 如果token有效且不强制刷新，直接返回
    if (isTokenValid && !forceRefresh) {
      console.log('✅ 使用现有有效Token')
      return NextResponse.json({
        success: true,
        token: userProfile.coze_access_token,
        expiresAt: userProfile.coze_token_expires_at,
        createdAt: userProfile.coze_token_created_at,
        cached: true
      })
    }

    // 3. 需要获取新token
    console.log('🔄 需要获取新的Access Token')

    try {
      // 使用JWT认证获取新的Access Token
      const config = {
        clientId: process.env.COZE_CLIENT_ID!,
        publicKeyId: process.env.COZE_PUBLIC_KEY_ID!,
        privateKeyFile: process.env.COZE_PRIVATE_KEY_FILE!,
        apiBase: process.env.COZE_API_BASE || 'api.coze.cn'
      }

      // 验证配置
      if (!config.clientId || !config.publicKeyId || !config.privateKeyFile) {
        throw new Error('Coze OAuth配置缺失')
      }

      // 创建JWT Token
      const jwtToken = await createJWTToken(config)
      console.log('✅ JWT Token创建成功')

      // 请求Access Token
      const tokenResponse = await fetch(`https://${config.apiBase}/api/permission/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          duration_seconds: 86400, // 24小时
        }),
      })

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text()
        throw new Error(`OAuth请求失败: ${tokenResponse.status} ${errorText}`)
      }

      const tokenData = await tokenResponse.json()

      if (!tokenData.access_token) {
        throw new Error('OAuth响应中缺少access_token')
      }

      console.log('✅ 新Access Token获取成功')

      // 4. 保存新token到数据库
      const newExpiresAt = new Date(now.getTime() + (tokenData.expires_in * 1000) - 60000) // 提前1分钟过期
      
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          coze_access_token: tokenData.access_token,
          coze_token_expires_at: newExpiresAt.toISOString(),
          coze_token_created_at: now.toISOString()
        })
        .eq('id', userProfileId)

      if (updateError) {
        console.error('❌ 保存Token失败:', updateError)
        // 即使保存失败，也返回token，避免阻塞用户
      } else {
        console.log('✅ Token已保存到数据库')
      }

      return NextResponse.json({
        success: true,
        token: tokenData.access_token,
        expiresAt: newExpiresAt.toISOString(),
        createdAt: now.toISOString(),
        cached: false
      })

    } catch (tokenError) {
      console.error('❌ 获取新Token失败:', tokenError)
      
      // 如果获取新token失败，但有旧token，仍然返回旧token（可能已过期但可以尝试）
      if (userProfile.coze_access_token) {
        console.log('⚠️ 返回可能过期的Token作为备用')
        return NextResponse.json({
          success: true,
          token: userProfile.coze_access_token,
          expiresAt: userProfile.coze_token_expires_at,
          createdAt: userProfile.coze_token_created_at,
          cached: true,
          warning: '获取新token失败，使用缓存token'
        })
      }

      return NextResponse.json({
        success: false,
        error: 'TOKEN_GENERATION_FAILED',
        message: tokenError instanceof Error ? tokenError.message : '获取Access Token失败'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Coze Token管理失败:', error)
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : '内部服务错误'
    }, { status: 500 })
  }
}

// 清除用户的Token（用于强制刷新）
export async function DELETE(request: NextRequest) {
  try {
    const { userProfileId } = await request.json()
    
    if (!userProfileId) {
      return NextResponse.json({
        success: false,
        error: 'MISSING_USER_PROFILE_ID',
        message: '缺少用户资料ID'
      }, { status: 400 })
    }

    console.log('🗑️ 清除用户Token:', userProfileId)

    const supabase = supabaseAdmin

    const { error } = await supabase
      .from('user_profiles')
      .update({
        coze_access_token: null,
        coze_token_expires_at: null,
        coze_token_created_at: null
      })
      .eq('id', userProfileId)

    if (error) {
      console.error('❌ 清除Token失败:', error)
      return NextResponse.json({
        success: false,
        error: 'CLEAR_TOKEN_FAILED',
        message: '清除Token失败'
      }, { status: 500 })
    }

    console.log('✅ Token已清除')
    return NextResponse.json({
      success: true,
      message: 'Token已清除'
    })

  } catch (error) {
    console.error('❌ 清除Token失败:', error)
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : '内部服务错误'
    }, { status: 500 })
  }
} 