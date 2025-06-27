// 测试 Supabase 客户端在不同环境中的行为
console.log('🧪 测试 Supabase 客户端环境适配...\n')

// 模拟客户端环境
global.window = {}

try {
  // 动态导入 supabase 模块
  const supabaseModule = require('../src/lib/supabase.ts')
  
  console.log('✅ 模块导入成功')
  console.log('📋 导出的对象:', Object.keys(supabaseModule))
  
  // 检查 supabase 客户端
  if (supabaseModule.supabase) {
    console.log('✅ supabase 客户端存在')
  } else {
    console.log('❌ supabase 客户端不存在')
  }
  
  // 检查 supabaseAdmin 客户端
  if (supabaseModule.supabaseAdmin === null) {
    console.log('✅ supabaseAdmin 在客户端环境中正确返回 null')
  } else if (supabaseModule.supabaseAdmin) {
    console.log('⚠️ supabaseAdmin 在客户端环境中不应该存在')
  } else {
    console.log('❌ supabaseAdmin 状态异常')
  }
  
} catch (error) {
  console.error('❌ 测试失败:', error.message)
  console.error('详细错误:', error)
}

// 清理模拟环境
delete global.window

console.log('\n🎉 测试完成！')
console.log('\n📋 修复说明:')
console.log('- 在客户端环境中，supabaseAdmin 返回 null')
console.log('- 在服务端环境中，supabaseAdmin 正常创建')
console.log('- storage-adapter 会自动选择合适的客户端')
console.log('- 避免了客户端访问服务端环境变量的错误')
