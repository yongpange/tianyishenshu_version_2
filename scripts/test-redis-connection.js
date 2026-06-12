const { createClient } = require('redis')
require('dotenv').config({ path: '.env.local' })

async function testRedisConnection() {
  console.log('🔍 测试Redis连接...\n')
  
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
  const redisPassword = process.env.REDIS_PASSWORD || undefined
  
  console.log('📋 Redis配置:')
  console.log(`   URL: ${redisUrl}`)
  console.log(`   密码: ${redisPassword ? '已设置' : '未设置'}`)
  console.log('')
  
  let client = null
  
  try {
    // 创建Redis客户端
    console.log('🔗 创建Redis客户端...')
    client = createClient({
      url: redisUrl,
      password: redisPassword,
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: false // 测试时不重连
      }
    })
    
    // 错误处理
    client.on('error', (err) => {
      console.error('❌ Redis错误:', err.message)
    })
    
    client.on('connect', () => {
      console.log('🔗 Redis连接建立')
    })
    
    client.on('ready', () => {
      console.log('✅ Redis连接就绪')
    })
    
    // 连接Redis
    console.log('🚀 连接Redis服务器...')
    await client.connect()
    
    // 测试基本操作
    console.log('\n🧪 测试基本操作:')
    
    // 1. PING测试
    console.log('1. PING测试...')
    const pong = await client.ping()
    console.log(`   响应: ${pong}`)
    
    // 2. SET/GET测试
    console.log('2. SET/GET测试...')
    const testKey = 'test:connection'
    const testValue = { message: 'Hello Redis!', timestamp: new Date().toISOString() }
    
    await client.set(testKey, JSON.stringify(testValue))
    console.log(`   SET ${testKey}: 成功`)
    
    const retrievedValue = await client.get(testKey)
    const parsed = JSON.parse(retrievedValue)
    console.log(`   GET ${testKey}: ${parsed.message}`)
    
    // 3. TTL测试
    console.log('3. TTL测试...')
    await client.setEx('test:ttl', 60, 'expires in 60 seconds')
    const ttl = await client.ttl('test:ttl')
    console.log(`   TTL: ${ttl}秒`)
    
    // 4. 递增测试
    console.log('4. 递增测试...')
    const counter = await client.incr('test:counter')
    console.log(`   计数器: ${counter}`)
    
    // 5. 删除测试
    console.log('5. 删除测试...')
    const deleted = await client.del(testKey, 'test:ttl', 'test:counter')
    console.log(`   删除了 ${deleted} 个键`)
    
    // 6. 信息查询
    console.log('\n📊 Redis服务器信息:')
    const info = await client.info('server')
    const lines = info.split('\r\n').filter(line => line && !line.startsWith('#'))
    lines.slice(0, 5).forEach(line => {
      console.log(`   ${line}`)
    })
    
    console.log('\n✅ Redis连接测试成功！')
    
  } catch (error) {
    console.error('\n❌ Redis连接测试失败:')
    console.error(`   错误: ${error.message}`)
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 可能的解决方案:')
      console.log('   1. 确保Redis服务器正在运行')
      console.log('   2. 检查Redis URL配置')
      console.log('   3. 如果使用Docker，确保容器已启动:')
      console.log('      docker-compose up redis')
    }
    
    process.exit(1)
    
  } finally {
    // 关闭连接
    if (client) {
      try {
        await client.quit()
        console.log('\n🔌 Redis连接已关闭')
      } catch (err) {
        console.log('\n⚠️ 关闭连接时出错:', err.message)
      }
    }
  }
}

// 运行测试
testRedisConnection().catch(console.error)
