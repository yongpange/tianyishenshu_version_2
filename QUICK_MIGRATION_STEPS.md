# 🚀 天乙神算 - 快速迁移步骤

## 简化版迁移指南（5分钟完成）

### 1️⃣ 创建新 Supabase 项目
- 登录新的 Supabase 账号
- 创建新项目，记录：
  - Project URL
  - Anon Key  
  - Service Role Key

### 2️⃣ 执行数据库迁移
- 打开 Supabase Dashboard → SQL Editor
- 复制粘贴 `COMPLETE_SUPABASE_MIGRATION.sql` 全部内容
- 点击 Run 执行

### 3️⃣ 更新项目配置
更新 `.env.local` 文件：
```env
NEXT_PUBLIC_SUPABASE_URL=你的新项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的新Anon Key
SUPABASE_SERVICE_ROLE_KEY=你的新Service Role Key
```

### 4️⃣ 重启应用
```bash
npm run dev
```

### 5️⃣ 测试验证
- 访问首页
- 尝试注册新用户
- 检查数据库是否有新记录

## ✅ 迁移完成！

现在您的应用已经连接到新的 Supabase 数据库，所有功能都应该正常工作。

---

**需要详细说明？请查看 `SUPABASE_MIGRATION_GUIDE_COMPLETE.md`**
