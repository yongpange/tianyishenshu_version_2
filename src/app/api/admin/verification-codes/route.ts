import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// 获取所有验证码信息
export async function GET() {
  try {
    // console.log('🔍 开始获取验证码信息...')

    // 查询所有有验证码的用户
    const { data, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        phone_number,
        latest_verification_code,
        verification_code_expires_at,
        created_at,
        updated_at,
        last_login
      `)
      .not('latest_verification_code', 'is', null)
      .order('verification_code_expires_at', { ascending: false })

    if (error) {
      console.error('❌ 查询验证码失败:', error)
      throw error
    }

    // 处理数据，添加状态信息
    const processedData = data?.map(user => {
      const now = new Date()
      const expiresAt = user.verification_code_expires_at ? new Date(user.verification_code_expires_at) : null
      const isExpired = expiresAt ? now > expiresAt : true
      
      return {
        ...user,
        status: isExpired ? 'expired' : 'active',
        expires_in_minutes: expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60))) : 0
      }
    }) || []

    // console.log('✅ 成功获取验证码数据:', processedData?.length || 0, '条')
    
    return NextResponse.json({
      success: true,
      data: processedData,
      summary: {
        total: processedData.length,
        active: processedData.filter(item => item.status === 'active').length,
        expired: processedData.filter(item => item.status === 'expired').length
      }
    })

  } catch (error) {
    console.error('❌ 获取验证码信息失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: '获取验证码信息失败',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

// 清理过期验证码
export async function DELETE() {
  try {
    console.log('🧹 开始清理过期验证码...')

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        latest_verification_code: null,
        verification_code_expires_at: null,
        updated_at: new Date().toISOString()
      })
      .lt('verification_code_expires_at', new Date().toISOString())
      .select('id, phone_number')

    if (error) {
      console.error('❌ 清理过期验证码失败:', error)
      throw error
    }

    console.log('✅ 清理完成，影响用户数:', data?.length || 0)

    return NextResponse.json({
      success: true,
      message: `成功清理 ${data?.length || 0} 个过期验证码`,
      cleaned_count: data?.length || 0
    })

  } catch (error) {
    console.error('❌ 清理过期验证码失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: '清理过期验证码失败',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
} 