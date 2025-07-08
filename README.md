# 天乙神算 命理网站

这是一个基于 Next.js 的现代命理网站，提供命运解读和人生策展服务。

## 技术栈

- 前端：Next.js 14 + TypeScript + Tailwind CSS
- UI组件：Ant Design / Shadcn/ui
- 状态管理：Zustand / React Query
- 后端：Next.js API Routes
- 数据库：Supabase
- 动画：Framer Motion
- 部署：Vercel

## 功能特点

- 🎯 响应式设计，完美适配桌面端和移动端
- 🎨 现代化UI设计，美观大气
- 🔮 三大核心功能：小道童、一事一卦、大司命
- 📊 个性化命理报告：命之书、运之书
- 🚀 快速响应的用户体验
- 🔐 安全的用户认证系统

## 安装和运行

1. 克隆项目
```bash
git clone [repository-url]
cd tianyishenshu-website
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm run dev
```

4. 打开浏览器访问 http://localhost:3000

## 项目结构

```
src/
├── app/
│   ├── globals.css          # 全局样式
│   ├── layout.tsx           # 根布局
│   ├── page.tsx             # 首页
│   └── login/
│       └── page.tsx         # 登录页面
├── components/              # 可复用组件
├── lib/                     # 工具函数
└── types/                   # TypeScript 类型定义
```

## 页面功能

### 首页 (/)
- 品牌介绍和价值主张
- 产品预览（桌面端和移动端界面展示）
- 三大核心功能介绍
- 命理报告展示

### 登录页面 (/login)
- 📱 短信验证码登录（集成腾讯云短信服务）
- 🎟️ 16位兑换码功能（数字+字母组合）
- 💬 客服微信二维码弹窗
- 📊 登录步骤指示器（身份验证→完善信息→进入应用）
- 🔐 60秒倒计时防刷机制
- 📱 完美的移动端适配

## 设计特色

- **东方美学**：融合传统文化元素与现代设计语言
- **渐变色彩**：使用蓝紫色调营造神秘感
- **卡片布局**：清晰的信息层级和视觉焦点
- **动画效果**：平滑的过渡和交互反馈

## 开发指南

### 样式系统
- 使用 Tailwind CSS 进行样式开发
- 自定义 CSS 类位于 `globals.css`
- 响应式断点：sm (640px), md (768px), lg (1024px), xl (1280px)

### 组件开发
- 使用 TypeScript 确保类型安全
- 遵循 React 最佳实践
- 组件应该是可复用和可测试的

### 短信服务配置
1. 在腾讯云开通短信服务
2. 获取 SecretId、SecretKey、SdkAppId
3. 创建短信签名和模板
4. 在 `.env.local` 中配置环境变量：
```bash
TENCENT_SECRET_ID=your_secret_id
TENCENT_SECRET_KEY=your_secret_key
TENCENT_SMS_APP_ID=your_app_id
TENCENT_SMS_SIGN_NAME=天乙神算
TENCENT_SMS_TEMPLATE_ID=your_template_id
```

### 兑换码系统
- 16位数字和大写字母组合
- 支持批量生成和管理
- 实时验证有效性和使用状态
- 可配置不同权益等级

### 测试兑换码
以下兑换码可用于测试：
- `2406AB8F9E2D4C7K`
- `F1A2B3C4D5E6F7G8`
- `H9I0J1K2L3M4N5O6`

### 部署
- 项目已配置 Vercel 部署
- 推送到主分支将自动触发部署

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

此项目采用 MIT 许可证。

## 联系方式

如有问题或建议，请联系项目维护者。 