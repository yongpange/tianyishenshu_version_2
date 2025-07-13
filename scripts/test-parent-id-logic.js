const { createClient } = require('@supabase/supabase-js')

// 配置 Supabase 客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的环境变量')
  console.error('请设置 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testParentIdLogic() {
  console.log('🧪 开始测试 parent_id 逻辑...')

  try {
    // 1. 创建一个测试用户
    const testPhone = `1380000${Date.now().toString().slice(-4)}`
    console.log(`📱 创建测试用户，手机号: ${testPhone}`)

    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        phone_number: testPhone,
        permissions: ['basic']
      })
      .select()
      .single()

    if (userError) {
      console.error('❌ 创建用户失败:', userError)
      return
    }

    console.log('✅ 用户创建成功:', user.id)

    // 2. 创建第一个用户资料（顶级资料，parent_id 为空）
    const { data: profile1, error: profile1Error } = await supabase
      .from('user_profiles')
      .insert({
        user_id: user.id,
        name: '测试用户1',
        gender: 'male',
        year: 1990,
        month: 1,
        day: 1,
        hour: 12,
        minute: 0,
        area_province: '北京市',
        area_city: '北京市',
        area_district: '朝阳区',
        phone_number: testPhone,
        parent_id: null
      })
      .select()
      .single()

    if (profile1Error) {
      console.error('❌ 创建第一个用户资料失败:', profile1Error)
      return
    }

    console.log('✅ 第一个用户资料创建成功:', profile1.id)

    // 3. 创建第二个用户资料（子级资料，parent_id 为第一个资料的 id）
    const { data: profile2, error: profile2Error } = await supabase
      .from('user_profiles')
      .insert({
        user_id: user.id,
        name: '测试用户2',
        gender: 'female',
        year: 1995,
        month: 5,
        day: 15,
        hour: 14,
        minute: 30,
        area_province: '上海市',
        area_city: '上海市',
        area_district: '浦东新区',
        phone_number: testPhone,
        parent_id: profile1.id
      })
      .select()
      .single()

    if (profile2Error) {
      console.error('❌ 创建第二个用户资料失败:', profile2Error)
      return
    }

    console.log('✅ 第二个用户资料创建成功:', profile2.id, '父级:', profile2.parent_id)

    // 4. 验证层级关系
    console.log('\n📋 验证层级关系:')
    
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (profilesError) {
      console.error('❌ 查询用户资料失败:', profilesError)
      return
    }

    profiles.forEach((profile, index) => {
      console.log(`${index + 1}. ${profile.name} (ID: ${profile.id})`)
      console.log(`   父级ID: ${profile.parent_id || '无（顶级）'}`)
      console.log(`   创建时间: ${profile.created_at}`)
    })

    // 5. 测试查找父级资料的逻辑
    console.log('\n🔍 测试查找父级资料逻辑:')
    
    const { data: parentProfile, error: parentError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', user.id)
      .is('parent_id', null)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (parentError) {
      console.error('❌ 查找父级资料失败:', parentError)
    } else {
      console.log('✅ 找到父级资料:', parentProfile.id)
      console.log('   这应该是第一个用户资料的ID:', profile1.id)
      console.log('   匹配结果:', parentProfile.id === profile1.id ? '✅ 正确' : '❌ 错误')
    }

    // 6. 清理测试数据
    console.log('\n🧹 清理测试数据...')
    
    await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', user.id)

    await supabase
      .from('users')
      .delete()
      .eq('id', user.id)

    console.log('✅ 测试数据清理完成')

    console.log('\n🎉 parent_id 逻辑测试完成！')

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error)
  }
}

// 运行测试
testParentIdLogic() 