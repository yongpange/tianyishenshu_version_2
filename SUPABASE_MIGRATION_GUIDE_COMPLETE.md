# 天乙神算项目 - Supabase 完整迁移指南

## 📋 概述

本指南帮助您将天乙神算项目的数据库从当前的 Supabase 账号迁移到新的 Supabase 账号。

## 🗂️ 数据库表格结构

项目包含以下 5 个主要表格：

1. **users** - 用户表（包含登录状态字段）
2. **user_profiles** - 用户资料表
3. **personality_reports** - 性格报告表（包含异步生成支持）
4. **conversations** - 对话表（包含Coze对话ID）
5. **invite_codes** - 兑换码表

## 🚀 完整迁移步骤

### 第一步：创建新的 Supabase 项目

1. **登录新的 Supabase 账号**
   - 访问 [https://supabase.com](https://supabase.com)
   - 使用目标账号登录

2. **创建新项目**
   - 点击 "New Project"
   - 选择组织（Organization）
   - 填写项目信息：
     - Name: `tianyishenshu` 或您喜欢的名称
     - Database Password: 设置强密码（请记住）
     - Region: 选择离用户最近的区域（建议选择新加坡或东京）

3. **等待项目创建完成**
   - 通常需要 2-3 分钟
   - 创建完成后会自动跳转到项目仪表板

4. **记录项目配置信息**
   - 进入 Settings → API
   - 记录以下信息：
     ```
     Project URL: https://your-project-id.supabase.co
     Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     ```

### 第二步：执行数据库迁移

1. **打开 SQL Editor**
   - 在 Supabase Dashboard 左侧菜单中点击 "SQL Editor"

2. **执行完整迁移 SQL**
   - 点击 "New Query"
   - 复制 `COMPLETE_SUPABASE_MIGRATION.sql` 文件的全部内容
   - 粘贴到 SQL Editor 中
   - 点击 "Run" 执行

3. **验证迁移结果**
   - 执行成功后，您应该看到类似以下的输出：
   ```
   Query executed successfully
   ```
   - 在左侧的 Table Editor 中应该能看到 5 个表格

### 第三步：验证数据库结构

在 SQL Editor 中执行以下验证脚本：

```sql
-- 验证所有表是否创建成功
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('users', 'user_profiles', 'personality_reports', 'conversations', 'invite_codes')
ORDER BY table_name;
```

应该返回 5 行结果，每个表一行。

### 第四步：更新项目配置

1. **更新环境变量文件**
   - 打开项目根目录的 `.env.local` 文件
   - 更新以下变量：
   ```env
   # Supabase 配置
   NEXT_PUBLIC_SUPABASE_URL=https://your-new-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-new-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-new-service-role-key
   ```

2. **保存并重启开发服务器**
   ```bash
   # 停止当前服务器 (Ctrl+C)
   # 重新启动
   npm run dev
   ```

### 第五步：测试连接

1. **运行连接测试**
   - 访问您的应用首页
   - 尝试注册一个新用户
   - 检查是否能正常创建用户记录

2. **检查数据库**
   - 在 Supabase Dashboard 的 Table Editor 中
   - 查看 `users` 表是否有新记录

## 📊 表格详细结构

### users 表
```sql
- id (UUID, Primary Key)
- phone_number (VARCHAR, Unique)
- is_profile_completed (BOOLEAN)
- last_login (TIMESTAMP)
- invite_code_used (VARCHAR)
- permissions (TEXT[])
- created_at, updated_at (TIMESTAMP)
```

### user_profiles 表
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key)
- name, gender (VARCHAR)
- year, month, day, hour, minute (INTEGER)
- area_province, area_city, area_district (VARCHAR)
- phone_number (VARCHAR)
- created_at, updated_at (TIMESTAMP)
```

### personality_reports 表
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key)
- content (TEXT)
- user_data_hash (VARCHAR)
- coze_conversation_id (VARCHAR)
- task_id (VARCHAR) -- 异步生成支持
- status (VARCHAR) -- generating/completed/failed
- progress (INTEGER) -- 0-100
- error_message (TEXT)
- generated_at, created_at, updated_at (TIMESTAMP)
```

### conversations 表
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key)
- title (VARCHAR)
- messages (JSONB)
- coze_conversation_id (VARCHAR)
- created_at, updated_at (TIMESTAMP)
```

### invite_codes 表
```sql
- id (UUID, Primary Key)
- code (VARCHAR, Unique)
- status (VARCHAR) -- active/used/expired
- remarks (TEXT)
- used_by (UUID, Foreign Key)
- used_at (TIMESTAMP)
- created_at, updated_at (TIMESTAMP)
```

## 🔒 安全策略 (RLS)

所有表都启用了行级安全策略：
- **Service Role** 拥有完全访问权限
- **匿名用户** 只能插入用户记录（用于注册）
- 其他操作需要通过 Service Role Key 进行

## ⚠️ 注意事项

1. **数据备份**：虽然是开发环境，建议在迁移前备份重要数据
2. **环境变量**：确保更新所有相关的环境变量
3. **测试验证**：迁移完成后进行全面的功能测试
4. **密钥安全**：Service Role Key 具有完全访问权限，请妥善保管

## 🐛 常见问题

### Q: 迁移后无法访问数据？
**A:** 检查以下几点：
- RLS 策略是否正确配置
- 是否使用了正确的 Service Role Key
- 环境变量是否正确更新

### Q: 执行 SQL 时出现权限错误？
**A:** 确保您在 Supabase Dashboard 中以项目所有者身份登录

### Q: 表格创建成功但应用无法连接？
**A:** 检查网络连接和 Project URL 是否正确

### Q: 如何添加测试数据？
**A:** 可以在 Table Editor 中手动添加，或使用 SQL Editor 执行 INSERT 语句

## 📞 技术支持

如果在迁移过程中遇到问题：
1. 检查 Supabase Dashboard 的日志
2. 查看浏览器控制台的错误信息
3. 使用项目中的测试脚本验证连接
4. 参考 Supabase 官方文档

---

**迁移完成后，您的新 Supabase 数据库将完全复制原有的表结构和功能，可以无缝支持天乙神算项目的所有功能。**
