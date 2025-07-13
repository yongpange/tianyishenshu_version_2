#!/usr/bin/env node

/**
 * 八字报告数据流程测试脚本
 * 
 * 测试流程：
 * 1. 新用户创建时自动调用八字API
 * 2. 八字信息写入数据库bazi_reports表
 * 3. 用户登录时从数据库获取八字信息
 * 4. 聊天时更新用户聊天次数
 */

const { createClient } = require('@supabase/supabase-js')

// 配置
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ 缺少Supabase配置')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// 测试用户信息
const testUser = {
  name: '测试用户八字',
  gender: 'male',
  year: 1990,
  month: 5,
  day: 15,
  hour: 14,
  minute: 30,
  area: {
    province: '北京市',
    city: '北京市',
    district: '朝阳区'
  }
}

const testPhone = '13800138888'

async function testBaziFlow() {
  console.log('🔮 开始测试八字报告数据流程...\n')

  try {
    // 步骤1: 清理测试数据
    console.log('1️⃣ 清理测试数据...')
    await cleanupTestData()
    console.log('✅ 测试数据清理完成\n')

    // 步骤2: 创建新用户（应自动生成八字报告）
    console.log('2️⃣ 创建新用户（应自动生成八字报告）...')
    const userId = await createTestUser()
    console.log('✅ 用户创建成功，ID:', userId, '\n')

    // 步骤3: 检查八字报告是否自动生成
    console.log('3️⃣ 检查八字报告是否自动生成...')
    const baziReport = await checkBaziReport(userId)
    if (baziReport) {
      console.log('✅ 八字报告已自动生成')
      console.log('📊 报告生成时间:', baziReport.generated_at)
      console.log('📊 数据哈希:', baziReport.user_data_hash)
    } else {
      console.log('❌ 八字报告未自动生成')
    }
    console.log('')

    // 步骤4: 测试从数据库获取八字数据
    console.log('4️⃣ 测试从数据库获取八字数据...')
    const retrievedReport = await getBaziFromDatabase(userId)
    if (retrievedReport) {
      console.log('✅ 成功从数据库获取八字数据')
    } else {
      console.log('❌ 从数据库获取八字数据失败')
    }
    console.log('')

    // 步骤5: 测试聊天次数更新
    console.log('5️⃣ 测试聊天次数更新...')
    await testChatCountUpdate(userId)
    console.log('')

    console.log('🎉 八字报告数据流程测试完成！')

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error)
  }
}

async function cleanupTestData() {
  // 删除测试用户相关的所有数据
  const { data: users } = await supabase
    .from('users')
    .select('id')
    .eq('phone_number', testPhone)

  if (users && users.length > 0) {
    const userId = users[0].id
    
    // 删除用户配置文件（级联删除会自动删除八字报告）
    await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', userId)

    // 删除用户
    await supabase
      .from('users')
      .delete()
      .eq('id', userId)
  }
}

async function createTestUser() {
  // 创建用户
  const { data: user, error: userError } = await supabase
    .from('users')
    .insert({
      phone_number: testPhone
    })
    .select()
    .single()

  if (userError) {
    throw new Error('创建用户失败: ' + userError.message)
  }

  // 创建用户配置文件
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      user_id: user.id,
      name: testUser.name,
      gender: testUser.gender,
      year: testUser.year,
      month: testUser.month,
      day: testUser.day,
      hour: testUser.hour,
      minute: testUser.minute,
      area_province: testUser.area.province,
      area_city: testUser.area.city,
      area_district: testUser.area.district,
      phone_number: testPhone
    })
    .select()
    .single()

  if (profileError) {
    throw new Error('创建用户配置文件失败: ' + profileError.message)
  }

  // 模拟调用API生成八字报告
  try {
    const response = await fetch(`${BASE_URL}/api/bazi/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userInfo: testUser,
        userId: profile.id,
        isUserProfileId: true
      })
    })

    const result = await response.json()
    if (!result.success) {
      console.warn('⚠️ 八字报告生成失败:', result.message)
    }
  } catch (error) {
    console.warn('⚠️ 调用八字API失败:', error.message)
  }

  return profile.id
}

async function checkBaziReport(userId) {
  const { data: report, error } = await supabase
    .from('bazi_reports')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('查询八字报告失败:', error)
    return null
  }

  return report
}

async function getBaziFromDatabase(userId) {
  try {
    const response = await fetch(`${BASE_URL}/api/bazi/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        isUserProfileId: true
      })
    })

    const result = await response.json()
    return result.success ? result.report : null
  } catch (error) {
    console.error('从数据库获取八字数据失败:', error)
    return null
  }
}

async function testChatCountUpdate(userId) {
  // 检查初始聊天次数
  const { data: initialProfile } = await supabase
    .from('user_profiles')
    .select('chat_remaining_count, chat_used_count')
    .eq('id', userId)
    .single()

  console.log('📊 初始聊天次数:', {
    remaining: initialProfile.chat_remaining_count,
    used: initialProfile.chat_used_count
  })

  // 模拟聊天（应该扣减次数）
  try {
    const response = await fetch(`${BASE_URL}/api/coze/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: '你好，这是测试消息',
        userInfo: testUser,
        userId: userId
      })
    })

    const result = await response.json()
    
    if (result.success) {
      console.log('✅ 聊天成功，剩余次数:', result.remainingCount)
    } else {
      console.log('⚠️ 聊天失败:', result.error)
    }

    // 检查更新后的聊天次数
    const { data: updatedProfile } = await supabase
      .from('user_profiles')
      .select('chat_remaining_count, chat_used_count')
      .eq('id', userId)
      .single()

    console.log('📊 更新后聊天次数:', {
      remaining: updatedProfile.chat_remaining_count,
      used: updatedProfile.chat_used_count
    })

  } catch (error) {
    console.error('聊天测试失败:', error)
  }
}

// 运行测试
if (require.main === module) {
  testBaziFlow()
} 