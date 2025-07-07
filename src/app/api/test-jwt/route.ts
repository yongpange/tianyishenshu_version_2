import { NextRequest, NextResponse } from 'next/server'
import * as jwt from 'jsonwebtoken'
import * as fs from 'fs'
import * as path from 'path'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 测试 JWT 创建...')
    
    // 检查环境变量
    const clientId = process.env.COZE_CLIENT_ID
    const publicKeyId = process.env.COZE_PUBLIC_KEY_ID
    const privateKeyFile = process.env.COZE_PRIVATE_KEY_FILE
    
    console.log('环境变量检查:')
    console.log('  COZE_CLIENT_ID:', clientId ? '✅' : '❌')
    console.log('  COZE_PUBLIC_KEY_ID:', publicKeyId ? '✅' : '❌')
    console.log('  COZE_PRIVATE_KEY_FILE:', privateKeyFile ? '✅' : '❌')
    
    if (!clientId || !publicKeyId || !privateKeyFile) {
      return NextResponse.json({
        success: false,
        error: '环境变量配置不完整'
      })
    }
    
    // 检查私钥文件
    console.log('当前工作目录:', process.cwd())
    const privateKeyPath = path.resolve(process.cwd(), privateKeyFile)
    console.log('私钥文件路径:', privateKeyPath)
    
    if (!fs.existsSync(privateKeyPath)) {
      return NextResponse.json({
        success: false,
        error: `私钥文件不存在: ${privateKeyPath}`
      })
    }
    
    const privateKey = fs.readFileSync(privateKeyPath, 'utf8')
    console.log('私钥文件读取成功，长度:', privateKey.length)
    
    // 创建 JWT
    const now = Math.floor(Date.now() / 1000)
    const payload = {
      iss: clientId,
      aud: 'api.coze.cn',
      iat: now,
      exp: now + 3600,
      jti: `${clientId}_${now}_test`
    }
    
    const token = jwt.sign(payload, privateKey, {
      algorithm: 'RS256',
      keyid: publicKeyId,
    })
    
    console.log('JWT Token 创建成功，长度:', token.length)
    
    return NextResponse.json({
      success: true,
      message: 'JWT Token 创建成功',
      tokenLength: token.length,
      payload: payload,
      cwd: process.cwd(),
      privateKeyPath: privateKeyPath,
      privateKeyExists: fs.existsSync(privateKeyPath)
    })
    
  } catch (error) {
    console.error('JWT 测试失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      details: error instanceof Error ? error.stack : String(error)
    })
  }
}
