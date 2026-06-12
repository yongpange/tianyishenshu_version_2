import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createJWTToken } from '@/lib/coze-auth'
import { tokenCache } from '@/lib/token-cache'
import { CozeAPI } from '@coze/api'

// 验证Token是否有效的函数
async function validateCozeToken(token: string): Promise<boolean> {
  try {
    console.log('🔍 验证Token有效性...')
    
    // 基础格式检查
    if (!token || token.length < 20) {
      console.log('❌ Token格式无效')
      return false
    }
    
    // 使用实际的API调用进行验证
    // 根据Coze官方文档，我们可以调用一个轻量级的API来验证token
    // 比如获取工作空间信息或机器人列表等
    const response = await fetch(`https://${process.env.COZE_API_BASE || 'api.coze.cn'}/v1/workspaces`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('📋 Token验证响应状态:', response.status)
    
    // 分析响应状态
    if (response.status === 401 || response.status === 403) {
      console.log('❌ Token认证失败:', response.status)
      return false
    } else if (response.status === 200) {
      console.log('✅ Token验证成功')
      return true
    } else if (response.status === 404) {
      // 如果工作空间API不可用，尝试其他验证方式
      console.log('⚠️ 工作空间API不可用，尝试其他验证方式')
      
      // 尝试使用机器人列表API验证
      const botResponse = await fetch(`https://${process.env.COZE_API_BASE || 'api.coze.cn'}/v1/bots`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('📋 机器人API验证响应状态:', botResponse.status)
      
      if (botResponse.status === 401 || botResponse.status === 403) {
        console.log('❌ Token认证失败:', botResponse.status)
        return false
      } else if (botResponse.status === 200) {
        console.log('✅ Token验证成功（通过机器人API）')
        return true
      } else {
        // 如果所有API都不可用，使用格式检查作为fallback
        console.log('⚠️ API验证不可用，使用格式检查')
        return true
      }
    } else if (response.status >= 500) {
      // 服务器错误，保守认为token有效
      console.log('⚠️ 服务器错误，假设token有效:', response.status)
      return true
    } else {
      // 其他状态码，保守认为token有效
      console.log('⚠️ 未知状态码，假设token有效:', response.status)
      return true
    }
    
  } catch (error: any) {
    console.log('❌ Token验证过程中出错:', {
      message: error.message,
      status: error.status,
      tokenPrefix: token.substring(0, 20) + '...'
    })
    
    // 检查是否是明确的认证错误
    const isAuthError = error?.message?.includes('401') || 
                       error?.message?.includes('Unauthorized') ||
                       error?.message?.includes('4100') ||
                       error?.message?.includes('4101') ||
                       error?.message?.includes('authentication is invalid') ||
                       error?.status === 401 ||
                       error?.status === 403
    
    if (isAuthError) {
      console.log('❌ 检测到明确的认证错误，token无效')
      return false
    }
    
    // 网络错误或其他问题，保守认为token有效
    console.log('⚠️ 验证过程出错，假设token有效（可能是网络问题）')
    return true
  }
}

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

    // 1. 优先从Redis缓存获取Token
    let cachedToken = await tokenCache.getToken(userProfileId)

    if (cachedToken && !forceRefresh) {
      console.log('📋 从缓存获取到Token，验证其有效性...')

      // 检查缓存的验证结果
      let isTokenValid = await tokenCache.getCachedTokenValidation(cachedToken.token)

      // 如果没有缓存的验证结果，进行验证
      if (isTokenValid === null) {
        console.log('🔍 验证Token有效性...')
        isTokenValid = await validateCozeToken(cachedToken.token)

        // 缓存验证结果
        await tokenCache.cacheTokenValidation(cachedToken.token, isTokenValid)
      }

      if (isTokenValid) {
        console.log('✅ 使用缓存的有效Token')
        return NextResponse.json({
          success: true,
          token: cachedToken.token,
          expiresAt: cachedToken.expiresAt,
          createdAt: cachedToken.createdAt,
          cached: true,
          source: cachedToken.source
        })
      } else {
        console.log('❌ 缓存Token验证失败，需要重新生成')
        // 清除无效的缓存
        await tokenCache.invalidateToken(userProfileId)
      }
    }

    // 2. 如果缓存未命中，从数据库获取
    if (!cachedToken) {
      console.log('🔍 缓存未命中，从数据库获取Token...')
      cachedToken = await tokenCache.getTokenFromDatabase(userProfileId)

      if (cachedToken && !forceRefresh) {
        console.log('📋 数据库Token验证其有效性...')

        const isTokenValid = await validateCozeToken(cachedToken.token)

        if (isTokenValid) {
          console.log('✅ 数据库Token有效')
          // 缓存验证结果
          await tokenCache.cacheTokenValidation(cachedToken.token, true)

          return NextResponse.json({
            success: true,
            token: cachedToken.token,
            expiresAt: cachedToken.expiresAt,
            createdAt: cachedToken.createdAt,
            cached: false,
            source: 'database'
          })
        } else {
          console.log('❌ 数据库Token验证失败，需要重新生成')
          await tokenCache.invalidateToken(userProfileId)
        }
      }
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

      // 验证新生成的token是否有效
      const isNewTokenValid = await validateCozeToken(tokenData.access_token)
      
      if (!isNewTokenValid) {
        console.error('❌ 新生成的Token验证失败')
        throw new Error('新生成的Token无效，请检查认证配置')
      }

      console.log('✅ 新Token验证通过')

      // 4. 保存新token到数据库和缓存
      // expires_in 是绝对时间戳（Unix时间戳，以秒为单位），不是相对时间
      const newExpiresAt = new Date(tokenData.expires_in * 1000 - 60000) // 提前1分钟过期

      console.log('📅 Token过期时间计算:', {
        expires_in_timestamp: tokenData.expires_in,
        expires_in_date: new Date(tokenData.expires_in * 1000).toISOString(),
        final_expires_at: newExpiresAt.toISOString(),
        current_time: now.toISOString()
      })

      // 使用Token缓存管理器更新token（同时更新数据库和缓存）
      const updateSuccess = await tokenCache.updateToken(
        userProfileId,
        tokenData.access_token,
        newExpiresAt.toISOString(),
        now.toISOString()
      )

      if (!updateSuccess) {
        console.error('❌ 保存Token失败')
        // 即使保存失败，也返回token，避免阻塞用户
      } else {
        console.log('✅ Token已保存到数据库和缓存')

        // 缓存验证结果（新token肯定是有效的）
        await tokenCache.cacheTokenValidation(tokenData.access_token, true)
      }

      return NextResponse.json({
        success: true,
        token: tokenData.access_token,
        expiresAt: newExpiresAt.toISOString(),
        createdAt: now.toISOString(),
        cached: false,
        source: 'new_generated'
      })

    } catch (tokenError) {
      console.error('❌ 获取新Token失败:', tokenError)

      // 如果获取新token失败，尝试从缓存获取备用token
      const fallbackToken = await tokenCache.getToken(userProfileId)

      if (fallbackToken) {
        console.log('⚠️ 返回缓存的备用Token')
        return NextResponse.json({
          success: true,
          token: fallbackToken.token,
          expiresAt: fallbackToken.expiresAt,
          createdAt: fallbackToken.createdAt,
          cached: true,
          source: fallbackToken.source,
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

    // 使用Token缓存管理器清除token（同时清除数据库和缓存）
    const clearSuccess = await tokenCache.invalidateToken(userProfileId)

    if (!clearSuccess) {
      console.error('❌ 清除Token失败')
      return NextResponse.json({
        success: false,
        error: 'CLEAR_TOKEN_FAILED',
        message: '清除Token失败'
      }, { status: 500 })
    }

    // 额外清除数据库中的token记录
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
      console.warn('⚠️ 清除数据库Token记录失败:', error)
    }

    console.log('✅ Token已清除（缓存和数据库）')
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