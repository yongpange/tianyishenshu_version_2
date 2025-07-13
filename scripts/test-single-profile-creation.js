const { createClient } = require('@supabase/supabase-js')
const { createOrGetUser, saveUserProfile } = require('../src/lib/user-manager')

// 配置 Supabase 客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的环境变量')
  console.error('请设置 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testSingleProfileCreation() {
  console.log('🧪 开始测试主用户注册和invite_codes表更新...')

  let testUser = null
  let testInviteCode = null

  try {
    // 1. 先创建一个测试兑换码
    const testCodeValue = 'TEST' + Date.now().toString(36).toUpperCase().slice(-12)
    console.log(`🎟️ 创建测试兑换码: ${testCodeValue}`)
    
    const { data: inviteCodeData, error: inviteCodeError } = await supabase
      .from('invite_codes')
      .insert({
        code: testCodeValue,
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
    testInviteCode = inviteCodeData

    // 2. 创建一个测试用户（模拟注册流程）
    const testPhone = `1380000${Date.now().toString().slice(-4)}`
    console.log(`📱 测试手机号: ${testPhone}`)

    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        phone_number: testPhone,
        invite_code_used: testCodeValue, // 模拟注册时保存的invite_code
        permissions: ['basic'],
        is_profile_completed: false,
        last_login: new Date().toISOString()
      })
      .select()
      .single()

    if (userError) {
      console.error('❌ 创建测试用户失败:', userError)
      return
    }

    console.log('✅ 测试用户创建成功:', userData.id)
    testUser = userData

    // 3. 检查此时是否有用户资料记录
    const { data: profilesAfterRegister, error: checkError1 } = await supabase
      .from('user_profiles')
      .select('id, name, parent_id')
      .eq('user_id', userData.id)

    if (checkError1) {
      console.error('❌ 查询用户资料失败:', checkError1)
      return
    }

    console.log('📊 注册后的用户资料记录数:', profilesAfterRegister?.length || 0)
    if (profilesAfterRegister && profilesAfterRegister.length > 0) {
      console.log('⚠️ 注册后不应该有用户资料记录，但找到了:', profilesAfterRegister)
    } else {
      console.log('✅ 注册后没有用户资料记录，符合预期')
    }

    // 4. 检查invite_codes表的初始状态
    const { data: inviteCodeBefore, error: inviteError1 } = await supabase
      .from('invite_codes')
      .select('id, code, status, used_by, used_at')
      .eq('id', testInviteCode.id)
      .single()

    if (inviteError1) {
      console.error('❌ 查询invite_codes表失败:', inviteError1)
      return
    }

    console.log('📊 保存profile前的invite_codes状态:', {
      status: inviteCodeBefore.status,
      used_by: inviteCodeBefore.used_by,
      used_at: inviteCodeBefore.used_at
    })

    // 5. 模拟用户填写资料
    console.log('🔄 步骤2: 用户填写资料...')
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

    const profile = await saveUserProfile(testPhone, userInfo)
    console.log('✅ 用户资料保存成功:', profile.id)

    // 6. 检查最终的用户资料记录
    const { data: profilesAfterSave, error: checkError2 } = await supabase
      .from('user_profiles')
      .select('id, name, parent_id, invite_code_used, created_at')
      .eq('user_id', userData.id)
      .order('created_at', { ascending: true })

    if (checkError2) {
      console.error('❌ 查询最终用户资料失败:', checkError2)
      return
    }

    console.log('📊 最终用户资料记录数:', profilesAfterSave?.length || 0)
    console.log('📝 用户资料详情:', profilesAfterSave)

    // 7. 检查invite_codes表的最终状态
    const { data: inviteCodeAfter, error: inviteError2 } = await supabase
      .from('invite_codes')
      .select('id, code, status, used_by, used_at')
      .eq('id', testInviteCode.id)
      .single()

    if (inviteError2) {
      console.error('❌ 查询invite_codes表失败:', inviteError2)
      return
    }

    console.log('📊 保存profile后的invite_codes状态:', {
      status: inviteCodeAfter.status,
      used_by: inviteCodeAfter.used_by,
      used_at: inviteCodeAfter.used_at
    })

    // 8. 验证结果
    let testPassed = true
    const issues = []

    // 验证用户资料
    if (profilesAfterSave && profilesAfterSave.length === 1) {
      const profile = profilesAfterSave[0]
      if (profile.parent_id === null) {
        console.log('✅ 用户资料测试通过: 主用户只有一条记录且parent_id为空')
      } else {
        console.log('❌ 用户资料测试失败: parent_id应该为空，但实际为:', profile.parent_id)
        testPassed = false
        issues.push('parent_id不为空')
      }
      
      if (profile.invite_code_used === testCodeValue) {
        console.log('✅ 用户资料测试通过: invite_code_used正确保存')
      } else {
        console.log('❌ 用户资料测试失败: invite_code_used应该为', testCodeValue, '但实际为:', profile.invite_code_used)
        testPassed = false
        issues.push('invite_code_used不正确')
      }
    } else {
      console.log('❌ 用户资料测试失败: 应该只有一条记录，但实际有:', profilesAfterSave?.length || 0)
      testPassed = false
      issues.push('用户资料记录数量不对')
    }

    // 验证invite_codes表
    if (inviteCodeAfter.status === 'used') {
      console.log('✅ invite_codes表测试通过: 状态已更新为used')
    } else {
      console.log('❌ invite_codes表测试失败: 状态应该为used，但实际为:', inviteCodeAfter.status)
      testPassed = false
      issues.push('invite_codes状态未更新')
    }

         if (inviteCodeAfter.used_by === profilesAfterSave[0]?.id) {
       console.log('✅ invite_codes表测试通过: used_by正确关联到user_profiles.id')
     } else {
       console.log('❌ invite_codes表测试失败: used_by应该为', profilesAfterSave[0]?.id, '但实际为:', inviteCodeAfter.used_by)
       testPassed = false
       issues.push('invite_codes的used_by不正确')
     }

    if (inviteCodeAfter.used_at) {
      console.log('✅ invite_codes表测试通过: used_at已设置')
    } else {
      console.log('❌ invite_codes表测试失败: used_at应该有值但为空')
      testPassed = false
      issues.push('invite_codes的used_at为空')
    }

    // 输出总结
    if (testPassed) {
      console.log('\n🎉 所有测试都通过了！')
      console.log('✅ 主用户注册时只创建一条记录且parent_id为空')
      console.log('✅ invite_codes表正确更新')
    } else {
      console.log('\n❌ 测试失败，发现以下问题:')
      issues.forEach(issue => console.log(`   - ${issue}`))
    }

  } catch (error) {
    console.error('❌ 测试失败:', error)
  } finally {
    // 9. 清理测试数据
    console.log('\n🧹 清理测试数据...')
    try {
      if (testUser) {
        await supabase.from('user_profiles').delete().eq('user_id', testUser.id)
        await supabase.from('users').delete().eq('id', testUser.id)
      }
      if (testInviteCode) {
        await supabase.from('invite_codes').delete().eq('id', testInviteCode.id)
      }
      console.log('✅ 测试数据清理完成')
    } catch (cleanupError) {
      console.error('❌ 清理测试数据失败:', cleanupError)
    }
  }
}

// 运行测试
testSingleProfileCreation().then(() => {
  console.log('\n🎉 测试完成')
  process.exit(0)
}).catch(error => {
  console.error('❌ 测试出错:', error)
  process.exit(1)
}) 