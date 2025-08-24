/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com', 'plus.unsplash.com'],
  },
  // 优化编译性能
  swcMinify: true,
  // Docker 支持 - 启用 standalone 输出
  output: 'standalone',
  // 减少编译时间
  typescript: {
    // 在生产构建时忽略类型错误（开发时仍会显示）
    ignoreBuildErrors: true,
  },
  eslint: {
    // 在生产构建时忽略 ESLint 错误（开发时仍会显示）
    ignoreDuringBuilds: true,
  },
  // 兼容性配置
  compiler: {
    // 移除console.log在生产环境中
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // 实验性功能配置
  experimental: {
    // 确保更好的兼容性
    esmExternals: false,
  },
  // Webpack 配置 - 确保服务器端依赖正确处理
  webpack: (config, { isServer }) => {
    if (isServer) {
      // 确保 jsonwebtoken 等服务器端依赖不被打包，而是作为外部依赖
      config.externals = config.externals || []
      config.externals.push({
        'jsonwebtoken': 'commonjs jsonwebtoken'
      })
    }
    return config
  },
}

module.exports = nextConfig