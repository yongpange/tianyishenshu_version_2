const { createClient } = require('@supabase/supabase-js')

// 配置Supabase客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少必要的环境变量')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '已设置' : '未设置')
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '已设置' : '未设置')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testInviteCodesQuery() {
  try {
    console.log('🔍 开始测试兑换码查询...')
    
    // 测试1: 基础查询
    console.log('\n📊 测试1: 基础兑换码查询')
    const { data: basicData, error: basicError } = await supabase
      .from('invite_codes')
      .select('*')
      .limit(5)
    
    if (basicError) {
      console.error('❌ 基础查询失败:', basicError)
    } else {
      console.log('✅ 基础查询成功，数据条数:', basicData?.length || 0)
      console.log('📋 基础数据示例:', basicData?.[0])
    }
    
    // 测试2: 关联查询
    console.log('\n📊 测试2: 关联查询兑换码和用户信息')
    const { data: relatedData, error: relatedError } = await supabase
      .from('invite_codes')
      .select(`
        *,
        user_profiles:used_by (
          id,
          name,
          phone_number,
          chat_remaining_count,
          user_role,
          users:user_id (
            id,
            phone_number
          )
        )
      `)
      .limit(5)
    
    if (relatedError) {
      console.error('❌ 关联查询失败:', relatedError)
    } else {
      console.log('✅ 关联查询成功，数据条数:', relatedData?.length || 0)
      console.log('📋 关联数据示例:', relatedData?.[0])
      
      // 检查数据结构
      if (relatedData && relatedData.length > 0) {
        const sample = relatedData[0]
        console.log('\n🔍 数据结构分析:')
        console.log('- 兑换码ID:', sample.id)
        console.log('- 兑换码:', sample.code)
        console.log('- 状态:', sample.status)
        console.log('- 用户资料:', sample.user_profiles ? '存在' : '不存在')
        if (sample.user_profiles) {
          console.log('  - 用户姓名:', sample.user_profiles.name)
          console.log('  - 用户手机号:', sample.user_profiles.phone_number)
          console.log('  - 剩余对话次数:', sample.user_profiles.chat_remaining_count)
          console.log('  - 用户角色:', sample.user_profiles.user_role)
          console.log('  - 关联用户:', sample.user_profiles.users ? '存在' : '不存在')
          if (sample.user_profiles.users) {
            console.log('    - 用户ID:', sample.user_profiles.users.id)
            console.log('    - 用户手机号:', sample.user_profiles.users.phone_number)
          }
        }
      }
    }
    
    // 测试3: 检查用户资料表
    console.log('\n📊 测试3: 检查用户资料表')
    const { data: userProfiles, error: userProfilesError } = await supabase
      .from('user_profiles')
      .select(`
        id,
        name,
        phone_number,
        chat_remaining_count,
        user_role,
        users:user_id (
          id,
          phone_number
        )
      `)
      .limit(5)
    
    if (userProfilesError) {
      console.error('❌ 用户资料查询失败:', userProfilesError)
    } else {
      console.log('✅ 用户资料查询成功，数据条数:', userProfiles?.length || 0)
      console.log('📋 用户资料示例:', userProfiles?.[0])
    }
    
    // 测试4: 检查用户表
    console.log('\n📊 测试4: 检查用户表')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, phone_number')
      .limit(5)
    
    if (usersError) {
      console.error('❌ 用户表查询失败:', usersError)
    } else {
      console.log('✅ 用户表查询成功，数据条数:', users?.length || 0)
      console.log('📋 用户数据示例:', users?.[0])
    }
    
    console.log('\n✅ 测试完成')
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error)
  }
}

// 运行测试
testInviteCodesQuery() 