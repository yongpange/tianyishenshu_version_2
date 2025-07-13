const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的环境变量:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 测试用户数据
const testPhone = '13800138000'
const testUserData = {
  name: '测试用户',
  gender: 'male',
  year: 1990,
  month: 1,
  day: 1,
  hour: 12,
  minute: 0,
  area_province: '北京市',
  area_city: '北京市',
  area_district: '朝阳区'
}

async function testPersonalityReportFlow() {
  console.log('🧪 开始测试性格报告保存流程...')
  
  try {
    // 1. 清理测试数据
    console.log('🧹 清理测试数据...')
    await supabase.from('personality_reports').delete().eq('user_data_hash', 'test_hash_123')
    await supabase.from('user_profiles').delete().eq('phone_number', testPhone)
    await supabase.from('users').delete().eq('phone_number', testPhone)
    
    // 2. 创建测试用户
    console.log('👤 创建测试用户...')
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        phone_number: testPhone,
        permissions: ['basic']
      })
      .select('id')
      .single()
    
    if (userError) {
      throw new Error(`创建用户失败: ${userError.message}`)
    }
    
    console.log('✅ 用户创建成功:', user.id)
    
    // 3. 创建用户资料
    console.log('📋 创建用户资料...')
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: user.id,
        phone_number: testPhone,
        ...testUserData
      })
      .select('id')
      .single()
    
    if (profileError) {
      throw new Error(`创建用户资料失败: ${profileError.message}`)
    }
    
    console.log('✅ 用户资料创建成功:', userProfile.id)
    
    // 4. 测试性格报告保存（应该使用 user_profiles.id）
    console.log('📝 测试性格报告保存...')
    const { data: report, error: reportError } = await supabase
      .from('personality_reports')
      .insert({
        user_id: userProfile.id, // 使用 user_profiles.id
        content: '这是一个测试性格报告内容',
        user_data_hash: 'test_hash_123',
        coze_conversation_id: 'test_conv_123'
      })
      .select('*')
      .single()
    
    if (reportError) {
      throw new Error(`保存性格报告失败: ${reportError.message}`)
    }
    
    console.log('✅ 性格报告保存成功:', report.id)
    
    // 5. 测试通过手机号查询报告（模拟API逻辑）
    console.log('🔍 测试通过手机号查询报告...')
    
    // 先通过手机号找到用户
    const { data: foundUser, error: findUserError } = await supabase
      .from('users')
      .select('id')
      .eq('phone_number', testPhone)
      .single()
    
    if (findUserError) {
      throw new Error(`查找用户失败: ${findUserError.message}`)
    }
    
    // 通过用户ID找到用户资料
    const { data: foundProfile, error: findProfileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', foundUser.id)
      .single()
    
    if (findProfileError) {
      throw new Error(`查找用户资料失败: ${findProfileError.message}`)
    }
    
    // 通过用户资料ID查找报告
    const { data: foundReport, error: findReportError } = await supabase
      .from('personality_reports')
      .select('*')
      .eq('user_id', foundProfile.id)
      .single()
    
    if (findReportError) {
      throw new Error(`查找性格报告失败: ${findReportError.message}`)
    }
    
    console.log('✅ 报告查询成功:', {
      手机号: testPhone,
      用户ID: foundUser.id,
      用户资料ID: foundProfile.id,
      报告ID: foundReport.id,
      内容长度: foundReport.content.length
    })
    
    // 6. 验证数据一致性
    console.log('🔍 验证数据一致性...')
    
    if (foundReport.id !== report.id) {
      throw new Error('报告ID不匹配')
    }
    
    if (foundReport.user_id !== userProfile.id) {
      throw new Error('报告的user_id不匹配用户资料ID')
    }
    
    console.log('✅ 数据一致性验证通过')
    
    // 7. 测试外键约束
    console.log('🔗 测试外键约束...')
    
    // 尝试删除用户资料（应该级联删除报告）
    const { error: deleteProfileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userProfile.id)
    
    if (deleteProfileError) {
      throw new Error(`删除用户资料失败: ${deleteProfileError.message}`)
    }
    
    // 检查报告是否被级联删除
    const { data: remainingReport, error: checkReportError } = await supabase
      .from('personality_reports')
      .select('id')
      .eq('id', report.id)
      .single()
    
    if (checkReportError && checkReportError.code !== 'PGRST116') {
      throw new Error(`检查报告删除失败: ${checkReportError.message}`)
    }
    
    if (remainingReport) {
      throw new Error('报告未被级联删除')
    }
    
    console.log('✅ 外键约束测试通过（级联删除正常）')
    
    // 8. 清理剩余数据
    console.log('🧹 清理剩余测试数据...')
    await supabase.from('users').delete().eq('phone_number', testPhone)
    
    console.log('🎉 所有测试通过！性格报告保存修复验证成功')
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    
    // 清理测试数据
    console.log('🧹 清理测试数据...')
    await supabase.from('personality_reports').delete().eq('user_data_hash', 'test_hash_123')
    await supabase.from('user_profiles').delete().eq('phone_number', testPhone)
    await supabase.from('users').delete().eq('phone_number', testPhone)
    
    process.exit(1)
  }
}

// 运行测试
testPersonalityReportFlow() 