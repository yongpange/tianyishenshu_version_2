#!/bin/bash

echo "🐳 Docker JWT 测试脚本"
echo "========================"

# 构建测试镜像
echo "📦 构建测试镜像..."
docker build -t jwt-test-app . 

if [ $? -eq 0 ]; then
    echo "✅ 镜像构建成功"
    
    # 运行容器并测试JWT模块
    echo "🧪 测试JWT模块加载..."
    docker run --rm jwt-test-app node -e "
    console.log('🔍 测试 jsonwebtoken 模块...');
    try {
        const jwt = require('jsonwebtoken');
        console.log('✅ jsonwebtoken 加载成功!');
        console.log('🔧 jwt.sign 函数可用:', typeof jwt.sign === 'function');
        console.log('🎉 测试通过 - JWT认证应该可以正常工作');
    } catch (error) {
        console.log('❌ jsonwebtoken 加载失败:', error.message);
        console.log('🚨 需要进一步修复Docker配置');
        process.exit(1);
    }
    "
else
    echo "❌ 镜像构建失败"
    exit 1
fi 