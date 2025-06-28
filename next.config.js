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
    ignoreBuildErrors: false,
  },
  eslint: {
    // 在生产构建时忽略 ESLint 错误（开发时仍会显示）
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig