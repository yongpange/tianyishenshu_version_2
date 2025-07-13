const { createClient } = require('@supabase/supabase-js')

// 配置Supabase客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的环境变量')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '已设置' : '未设置')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '已设置' : '未设置')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function testProfileSaveFlow() {
  try {
    console.log('🧪 开始测试profile保存流程...')

    // 1. 创建一个测试兑换码
    const testInviteCode = 'TEST' + Date.now().toString().slice(-12)
    console.log('📝 创建测试兑换码:', testInviteCode)

    const { data: inviteCodeData, error: inviteCodeError } = await supabaseAdmin
      .from('invite_codes')
      .insert({
        code: testInviteCode,
        status: 'active',
        remarks: '测试兑换码'
      })
      .select()
      .single()

    if (inviteCodeError) {
      console.error('❌ 创建测试兑换码失败:', inviteCodeError)
      return
    }

    console.log('✅ 测试兑换码创建成功:', inviteCodeData.id)

    // 2. 创建一个测试用户
    const testPhoneNumber = '138' + Date.now().toString().slice(-8)
    console.log('📱 创建测试用户:', testPhoneNumber)

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        phone_number: testPhoneNumber,
        permissions: ['basic']
      })
      .select()
      .single()

    if (userError) {
      console.error('❌ 创建测试用户失败:', userError)
      return
    }

    console.log('✅ 测试用户创建成功:', userData.id)

    // 3. 模拟保存用户资料（新增用户模式）
    const userInfo = {
      name: '测试用户',
      gender: 'male',
      year: 1990,
      month: 1,
      day: 1,
      hour: 12,
      minute: 0,
      area: {
        province: '北京市',
        city: '北京市',
        district: '朝阳区'
      }
    }

    console.log('💾 保存用户资料...')

    // 模拟API调用
    const response = await fetch('http://localhost:3000/api/user-profile/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: testPhoneNumber,
        userInfo,
        isAddingNewUser: true,
        targetUserId: userData.id,
        inviteCode: testInviteCode
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('❌ API调用失败:', error)
      return
    }

    const result = await response.json()
    console.log('✅ 用户资料保存成功:', result.profile.id)

    // 4. 验证兑换码状态
    console.log('🔍 验证兑换码状态...')
    const { data: updatedInviteCode, error: checkError } = await supabaseAdmin
      .from('invite_codes')
      .select('*')
      .eq('code', testInviteCode)
      .single()

    if (checkError) {
      console.error('❌ 查询兑换码失败:', checkError)
      return
    }

    console.log('📊 兑换码状态:', {
      code: updatedInviteCode.code,
      status: updatedInviteCode.status,
      used_by: updatedInviteCode.used_by,
      used_at: updatedInviteCode.used_at
    })

    // 5. 验证用户资料
    console.log('🔍 验证用户资料...')
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', result.profile.id)
      .single()

    if (profileError) {
      console.error('❌ 查询用户资料失败:', profileError)
      return
    }

    console.log('📊 用户资料:', {
      id: userProfile.id,
      name: userProfile.name,
      invite_code_used: userProfile.invite_code_used,
      user_id: userProfile.user_id
    })

    // 6. 验证关联关系
    if (updatedInviteCode.used_by === result.profile.id) {
      console.log('✅ 兑换码正确关联到用户资料ID')
    } else {
      console.error('❌ 兑换码关联错误')
      console.error('期望:', result.profile.id)
      console.error('实际:', updatedInviteCode.used_by)
    }

    // 7. 清理测试数据
    console.log('🧹 清理测试数据...')
    await supabaseAdmin
      .from('invite_codes')
      .delete()
      .eq('code', testInviteCode)

    await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('id', result.profile.id)

    await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userData.id)

    console.log('✅ 测试完成，数据已清理')

  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

// 运行测试
testProfileSaveFlow() 