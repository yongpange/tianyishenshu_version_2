import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 验证用户是否仍然存在于数据库中
export async function POST(request: NextRequest) {
  try {
    const { phone, userId, userProfileId } = await request.json()

    // 至少需要手机号或者用户ID之一
    if (!phone && !userId && !userProfileId) {
      return NextResponse.json(
        { success: false, message: '缺少验证参数' },
        { status: 400 }
      )
    }

    // 简化日志输出，仅在debug模式下显示详细信息
    const isDebug = process.env.NODE_ENV === 'development'
    if (isDebug) {
      console.log('🔍 验证用户存在性:', { phone: phone ? `${phone.slice(0,3)}****${phone.slice(-4)}` : undefined, userId, userProfileId })
    }

    // 1. 如果有userProfileId，直接验证用户资料是否存在
    if (userProfileId) {
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select(`
          id,
          name,
          user_id,
          users!inner(id, phone_number)
        `)
        .eq('id', userProfileId)
        .single()

      if (profileError || !userProfile) {
        if (isDebug) {
          console.log('❌ 用户资料不存在:', userProfileId)
        }
        return NextResponse.json({
          success: false,
          exists: false,
          message: '用户资料不存在，请重新登录'
        })
      }

      if (isDebug) {
        console.log('✅ 用户资料验证通过:', userProfile.name)
      }
      return NextResponse.json({
        success: true,
        exists: true,
        user: {
          id: (userProfile.users as any).id,
          phone: (userProfile.users as any).phone_number,
          profile: {
            id: userProfile.id,
            name: userProfile.name
          }
        }
      })
    }

    // 2. 如果有手机号，验证用户是否存在
    if (phone) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select(`
          id,
          phone_number,
          user_profiles(id, name)
        `)
        .eq('phone_number', phone)
        .single()

      if (userError || !user) {
        if (isDebug) {
          console.log('❌ 用户不存在:', phone?.slice(0,3) + '****' + phone?.slice(-4))
        }
        return NextResponse.json({
          success: false,
          exists: false,
          message: '用户账户不存在，请重新注册'
        })
      }

      if (isDebug) {
        console.log('✅ 用户验证通过:', user.phone_number?.slice(0,3) + '****' + user.phone_number?.slice(-4))
      }
      return NextResponse.json({
        success: true,
        exists: true,
        user: {
          id: user.id,
          phone: user.phone_number,
          profiles: user.user_profiles
        }
      })
    }

    // 3. 如果有userId，验证用户是否存在
    if (userId) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select(`
          id,
          phone_number,
          user_profiles(id, name)
        `)
        .eq('id', userId)
        .single()

      if (userError || !user) {
        if (isDebug) {
          console.log('❌ 用户ID不存在:', userId)
        }
        return NextResponse.json({
          success: false,
          exists: false,
          message: '用户账户不存在，请重新登录'
        })
      }

      if (isDebug) {
        console.log('✅ 用户ID验证通过:', user.phone_number?.slice(0,3) + '****' + user.phone_number?.slice(-4))
      }
      return NextResponse.json({
        success: true,
        exists: true,
        user: {
          id: user.id,
          phone: user.phone_number,
          profiles: user.user_profiles
        }
      })
    }

    return NextResponse.json(
      { success: false, message: '无效的验证参数' },
      { status: 400 }
    )

  } catch (error) {
    console.error('用户验证失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        exists: false,
        message: '验证失败，请重新登录'
      },
      { status: 500 }
    )
  }
} 