import { NextRequest, NextResponse } from 'next/server'
import * as jwt from 'jsonwebtoken'
import * as fs from 'fs'
import * as path from 'path'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 直接测试 OAuth Token 获取...')
    
    // 1. 创建 JWT Token
    const clientId = process.env.COZE_CLIENT_ID!
    const publicKeyId = process.env.COZE_PUBLIC_KEY_ID!
    const privateKeyFile = process.env.COZE_PRIVATE_KEY_FILE!
    const apiBase = process.env.COZE_API_BASE || 'api.coze.cn'
    
    const privateKeyPath = path.resolve(process.cwd(), privateKeyFile)
    const privateKey = fs.readFileSync(privateKeyPath, 'utf8')
    
    const now = Math.floor(Date.now() / 1000)
    const payload = {
      iss: clientId,
      aud: 'api.coze.cn',
      iat: now,
      exp: now + 3600,
      jti: `${clientId}_${now}_direct_test`
    }
    
    const jwtToken = jwt.sign(payload, privateKey, {
      algorithm: 'RS256',
      keyid: publicKeyId,
    })
    
    console.log('✅ JWT Token 创建成功')
    console.log('   长度:', jwtToken.length)
    console.log('   前缀:', jwtToken.substring(0, 50) + '...')
    
    // 2. 直接调用 OAuth API
    const requestBody = {
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      duration_seconds: 86400
    }

    console.log('📡 发送 OAuth 请求...')
    console.log('   URL:', `https://${apiBase}/api/permission/oauth2/token`)
    console.log('   请求体:', JSON.stringify(requestBody, null, 2))
    console.log('   Authorization 头:', `Bearer ${jwtToken.substring(0, 50)}...`)

    const response = await fetch(`https://${apiBase}/api/permission/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`,
      },
      body: JSON.stringify(requestBody),
    })
    
    console.log('📥 OAuth 响应状态:', response.status, response.statusText)
    
    const responseText = await response.text()
    console.log('📥 OAuth 响应内容:', responseText)
    
    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `OAuth请求失败: ${response.status} ${response.statusText}`,
        responseBody: responseText,
        requestBody: requestBody,
        jwtTokenInfo: {
          length: jwtToken.length,
          prefix: jwtToken.substring(0, 50) + '...',
          payload: payload
        }
      })
    }
    
    const responseData = JSON.parse(responseText)
    console.log('✅ OAuth 请求成功')
    
    return NextResponse.json({
      success: true,
      message: 'OAuth Access Token 获取成功',
      accessToken: {
        length: responseData.access_token?.length || 0,
        prefix: responseData.access_token?.substring(0, 20) + '...' || '',
        expiresIn: responseData.expires_in
      },
      jwtTokenInfo: {
        length: jwtToken.length,
        prefix: jwtToken.substring(0, 50) + '...',
        payload: payload
      },
      fullResponse: responseData
    })
    
  } catch (error) {
    console.error('❌ 直接 OAuth 测试失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      details: error instanceof Error ? error.stack : String(error)
    })
  }
}
