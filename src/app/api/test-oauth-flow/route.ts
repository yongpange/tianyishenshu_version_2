import { NextRequest, NextResponse } from 'next/server'
import { createCozeOAuthClient } from '@/lib/coze-oauth-client'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 测试完整 OAuth 流程...')
    
    const body = await request.json()
    const { step = 'all' } = body
    
    // 创建 OAuth 客户端
    console.log('📡 创建 OAuth 客户端...')
    const cozeClient = createCozeOAuthClient()
    
    const result: any = {
      success: true,
      steps: {}
    }
    
    if (step === 'all' || step === 'jwt') {
      console.log('🔐 测试 JWT Token 创建...')
      try {
        // 通过反射访问私有方法进行测试
        const jwtToken = (cozeClient as any).createJWTToken()
        result.steps.jwt = {
          success: true,
          tokenLength: jwtToken.length,
          tokenPrefix: jwtToken.substring(0, 50) + '...'
        }
        console.log('✅ JWT Token 创建成功')
      } catch (error) {
        result.steps.jwt = {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        }
        console.error('❌ JWT Token 创建失败:', error)
      }
    }
    
    if (step === 'all' || step === 'oauth') {
      console.log('🔄 测试 OAuth Access Token 获取...')
      try {
        const accessToken = await (cozeClient as any).getOAuthAccessToken()
        result.steps.oauth = {
          success: true,
          tokenLength: accessToken.length,
          tokenPrefix: accessToken.substring(0, 20) + '...'
        }
        console.log('✅ OAuth Access Token 获取成功')
      } catch (error) {
        result.steps.oauth = {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        }
        console.error('❌ OAuth Access Token 获取失败:', error)
        if (step === 'oauth') {
          result.success = false
        }
      }
    }
    
    if (step === 'all' || step === 'chat') {
      console.log('💬 测试聊天 API...')
      try {
        const chatResult = await cozeClient.sendMessage({
          botId: '7519894586509590568',
          message: '你好，这是一个测试消息',
          userId: 'test_user_123'
        })
        
        result.steps.chat = {
          success: chatResult.success,
          authMethod: chatResult.authMethod,
          hasResponse: !!chatResult.response,
          error: chatResult.error
        }
        
        if (chatResult.success) {
          console.log('✅ 聊天 API 测试成功')
        } else {
          console.error('❌ 聊天 API 测试失败:', chatResult.error)
        }
      } catch (error) {
        result.steps.chat = {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        }
        console.error('❌ 聊天 API 测试异常:', error)
      }
    }
    
    if (step === 'all' || step === 'personality') {
      console.log('📊 测试性格报告 API...')
      try {
        const reportResult = await cozeClient.generatePersonalityReport({
          botId: '7519894586509590568',
          userInfo: {
            year: 1990,
            month: 5,
            day: 15,
            hour: 14,
            minute: 30,
            gender: '男',
            area: {
              province: '北京市',
              city: '北京市',
              district: '朝阳区'
            }
          },
          userId: 'test_user_123'
        })
        
        result.steps.personality = {
          success: reportResult.success,
          authMethod: reportResult.authMethod,
          hasReport: !!reportResult.report,
          reportLength: reportResult.report?.length || 0,
          error: reportResult.error
        }
        
        if (reportResult.success) {
          console.log('✅ 性格报告 API 测试成功')
        } else {
          console.error('❌ 性格报告 API 测试失败:', reportResult.error)
        }
      } catch (error) {
        result.steps.personality = {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        }
        console.error('❌ 性格报告 API 测试异常:', error)
      }
    }
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('❌ OAuth 流程测试失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      details: error instanceof Error ? error.stack : String(error)
    })
  }
}
