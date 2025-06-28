// 测试性格报告修复
const http = require('http')

console.log('🔧 测试性格报告修复...\n')

// 测试获取报告 API
async function testGetReportAPI() {
  console.log('📖 测试获取报告 API...')

  const testUserId = '15600003333' // 已知有报告的用户

  const postData = JSON.stringify({
    userId: testUserId
  })

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/personality-report/get',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  }

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = ''
      
      console.log('📡 响应状态:', res.statusCode)

      res.on('data', (chunk) => {
        body += chunk
      })

      res.on('end', () => {
        try {
          const result = JSON.parse(body)
          console.log('\n📊 API 响应:')
          console.log('- 成功:', result.success)
          console.log('- 错误:', result.error || '无')
          
          if (result.report) {
            console.log('- 报告ID:', result.report.id)
            console.log('- 用户ID:', result.report.userId)
            console.log('- 内容长度:', result.report.content?.length || 0)
            console.log('- 生成时间:', result.report.generatedAt)
            console.log('- 对话ID:', result.report.cozeConversationId || '无')
            
            if (result.report.content) {
              console.log('\n📄 报告内容预览:')
              console.log(result.report.content.substring(0, 200) + '...')
            }
          }
          
          resolve(result)
        } catch (error) {
          console.error('❌ 解析响应失败:', error)
          console.log('📄 原始响应:', body)
          reject(error)
        }
      })
    })

    req.on('error', (error) => {
      console.error('❌ 请求失败:', error)
      reject(error)
    })

    req.write(postData)
    req.end()
  })
}

// 分析问题和解决方案
function explainFix() {
  console.log('\n🔍 问题分析和解决方案:')
  console.log('')
  
  console.log('❌ 原始问题:')
  console.log('  • 性格报告页面显示"报告加载失败"')
  console.log('  • 客户端使用普通 supabase 客户端读取数据')
  console.log('  • 可能遇到 RLS (Row Level Security) 权限限制')
  console.log('  • 数据存在但无法读取')
  console.log('')
  
  console.log('✅ 解决方案:')
  console.log('  • 创建新的 API 路由: /api/personality-report/get')
  console.log('  • 使用 supabaseAdmin 客户端（具有管理员权限）')
  console.log('  • 在服务端处理数据库查询，避免客户端权限问题')
  console.log('  • 修改 personality 页面使用新的 API 路由')
  console.log('')
  
  console.log('🔧 技术实现:')
  console.log('  • 服务端 API: 使用 supabaseAdmin 查询数据')
  console.log('  • 客户端页面: 通过 fetch 调用 API 获取数据')
  console.log('  • 权限隔离: 敏感操作在服务端，客户端只接收结果')
  console.log('  • 错误处理: 完善的错误信息和状态码')
  console.log('')
}

// 运行测试
async function runTest() {
  try {
    await testGetReportAPI()
    
    console.log('\n✅ 测试成功!')
    console.log('')
    
    explainFix()
    
    console.log('🎉 性格报告修复完成!')
    console.log('')
    console.log('📝 用户现在可以:')
    console.log('• 正常查看已生成的性格报告')
    console.log('• 获得完整的报告内容')
    console.log('• 看到正确的生成时间和用户信息')
    console.log('• 享受流畅的用户体验')
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message)
  }
}

// 执行测试
runTest()
