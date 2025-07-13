// 测试兑换码管理API，验证用户信息显示
const fetch = require('node-fetch')

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

async function testInviteCodeAPI() {
  console.log('🔍 测试兑换码管理API...')
  
  try {
    // 测试获取兑换码列表
    const response = await fetch(`${BASE_URL}/api/invite-code/supabase`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    
    console.log('📊 API响应结果:')
    console.log('成功:', result.success)
    console.log('数据条数:', result.data?.length || 0)
    
    if (result.data && result.data.length > 0) {
      console.log('\n📋 兑换码详情:')
      result.data.forEach((code, index) => {
        console.log(`\n${index + 1}. 兑换码: ${code.code}`)
        console.log(`   状态: ${code.status}`)
        console.log(`   用户手机号: ${code.user_phone || '未使用'}`)
        console.log(`   用户名称: ${code.user_name || '未使用'}`)
        console.log(`   剩余Token: ${code.remaining_tokens !== null ? code.remaining_tokens : '未使用'}`)
        console.log(`   用户角色: ${code.user_role || '未使用'}`)
        console.log(`   创建时间: ${new Date(code.created_at).toLocaleString('zh-CN')}`)
        console.log(`   使用时间: ${code.used_at ? new Date(code.used_at).toLocaleString('zh-CN') : '未使用'}`)
        console.log(`   备注: ${code.remarks || '无'}`)
      })
      
      // 统计信息
      const totalCodes = result.data.length
      const usedCodes = result.data.filter(code => code.status === 'used').length
      const activeCodes = result.data.filter(code => code.status === 'active').length
      const expiredCodes = result.data.filter(code => code.status === 'expired').length
      
      console.log('\n📈 统计信息:')
      console.log(`总兑换码数: ${totalCodes}`)
      console.log(`已使用: ${usedCodes}`)
      console.log(`未使用: ${activeCodes}`)
      console.log(`已过期: ${expiredCodes}`)
      
      // 验证用户信息
      const codesWithUserInfo = result.data.filter(code => 
        code.user_phone && code.user_name && code.remaining_tokens !== null && code.user_role
      )
      
      console.log(`\n✅ 包含完整用户信息的兑换码: ${codesWithUserInfo.length}`)
      
      if (codesWithUserInfo.length > 0) {
        console.log('\n🔍 用户信息示例:')
        codesWithUserInfo.slice(0, 3).forEach((code, index) => {
          console.log(`${index + 1}. ${code.user_name} (${code.user_phone}) - ${code.user_role} - 剩余${code.remaining_tokens}次`)
        })
      }
      
    } else {
      console.log('📝 暂无兑换码数据')
    }
    
    console.log('\n✅ 兑换码API测试完成')
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    console.error('详细错误:', error)
  }
}

async function testCreateInviteCode() {
  console.log('\n🔧 测试创建兑换码...')
  
  try {
    const response = await fetch(`${BASE_URL}/api/invite-code/supabase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        count: 1,
        remarks: '测试兑换码 - 验证用户信息显示功能'
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    
    console.log('创建结果:', result.success ? '成功' : '失败')
    if (result.data && result.data.length > 0) {
      console.log('新生成的兑换码:', result.data[0].code)
    }
    
  } catch (error) {
    console.error('❌ 创建兑换码失败:', error.message)
  }
}

// 运行测试
async function runTests() {
  console.log('🚀 开始测试兑换码管理功能\n')
  
  await testInviteCodeAPI()
  await testCreateInviteCode()
  
  console.log('\n🎉 测试完成')
}

runTests() 