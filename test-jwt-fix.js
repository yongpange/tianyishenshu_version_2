#!/usr/bin/env node

console.log('🧪 测试 jsonwebtoken 模块加载...\n')

// 测试1: 标准导入
console.log('1️⃣ 测试标准导入方式:')
try {
  const jwt = require('jsonwebtoken')
  console.log('✅ 标准导入成功')
  console.log('   jwt.sign 函数存在:', typeof jwt.sign === 'function')
} catch (error) {
  console.log('❌ 标准导入失败:', error.message)
}

// 测试2: 动态导入
console.log('\n2️⃣ 测试动态导入方式:')
try {
  const jwt = eval('require')('jsonwebtoken')
  console.log('✅ 动态导入成功')
  console.log('   jwt.sign 函数存在:', typeof jwt.sign === 'function')
} catch (error) {
  console.log('❌ 动态导入失败:', error.message)
}

// 测试3: 检查package.json依赖
console.log('\n3️⃣ 检查依赖配置:')
try {
  const pkg = require('./package.json')
  console.log('   package.json 中的 jsonwebtoken 版本:', pkg.dependencies?.jsonwebtoken || '未找到')
  console.log('   package.json 中的 @types/jsonwebtoken 版本:', pkg.dependencies?.['@types/jsonwebtoken'] || '未找到')
} catch (error) {
  console.log('❌ 无法读取 package.json:', error.message)
}

// 测试4: 检查node_modules
console.log('\n4️⃣ 检查 node_modules:')
const fs = require('fs')
const path = require('path')

try {
  const nodeModulesPath = path.join(__dirname, 'node_modules', 'jsonwebtoken')
  const exists = fs.existsSync(nodeModulesPath)
  console.log('   node_modules/jsonwebtoken 存在:', exists)
  
  if (exists) {
    const pkgPath = path.join(nodeModulesPath, 'package.json')
    if (fs.existsSync(pkgPath)) {
      const jwtPkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
      console.log('   已安装版本:', jwtPkg.version)
    }
  }
} catch (error) {
  console.log('❌ 检查 node_modules 失败:', error.message)
}

console.log('\n🏁 测试完成') 