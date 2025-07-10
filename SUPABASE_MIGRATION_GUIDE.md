# 天乙神算项目 - Supabase 数据库迁移指南

## 概述

本指南帮助你将天乙神算项目的数据库从当前的 Supabase 账号迁移到新的 Supabase 账号。

## 数据库表格结构

项目包含以下 5 个主要表格：

1. **users** - 用户表
2. **user_profiles** - 用户资料表
3. **personality_reports** - 性格报告表
4. **conversations** - 对话表
5. **invite_codes** - 兑换码表

## 迁移步骤

### 第一步：创建新的 Supabase 项目

1. 登录新的 Supabase 账号
2. 创建新项目
3. 记录新项目的：
   - Project URL
   - Anon Key
   - Service Role Key

### 第二步：执行数据库迁移

#### 方案 A：完整迁移（推荐）

在新 Supabase 项目的 SQL Editor 中执行：

```sql
-- 执行 database_migration_complete.sql 文件中的所有内容
```

这个文件包含：
- 所有表格的创建语句
- 索引创建
- 触发器设置
- RLS 策略配置

#### 方案 B：分步迁移

如果需要分步执行，可以按以下顺序：

1. 执行基础表格创建（来自 `001_initial_schema.sql`）
2. 执行字段补充（来自 `002_add_user_fields.sql`）
3. 执行对话表字段补充（来自 `003_add_coze_conversation_id.sql`）
4. 执行 RLS 策略修复（来自 `002_fix_rls_policies.sql`）

### 第三步：配置匿名用户访问（如果需要）

如果你的项目不使用 Supabase Auth，而是使用手机号验证码登录，需要执行：

```sql
-- 执行 database_migration_anon_policies.sql 文件中的内容
```

### 第四步：更新项目配置

更新项目中的环境变量：

```env
NEXT_PUBLIC_SUPABASE_URL=你的新项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的新项目Anon Key
SUPABASE_SERVICE_ROLE_KEY=你的新项目Service Role Key
```

### 第五步：验证迁移

运行以下验证脚本确认迁移成功：

```sql
-- 验证所有表是否创建成功
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'user_profiles', 'personality_reports', 'conversations', 'invite_codes')
ORDER BY table_name;

-- 验证所有策略是否创建成功
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename IN ('users', 'user_profiles', 'personality_reports', 'conversations', 'invite_codes')
ORDER BY tablename, policyname;
```

## 文件说明

- `database_migration_complete.sql` - 完整的数据库迁移文件
- `database_migration_anon_policies.sql` - 匿名用户访问策略文件
- `SUPABASE_MIGRATION_GUIDE.md` - 本迁移指南

## 注意事项

1. **数据备份**：虽然是开发环境，建议在迁移前备份重要数据
2. **环境变量**：确保更新所有相关的环境变量
3. **测试验证**：迁移完成后进行功能测试
4. **RLS 策略**：根据项目需求选择合适的 RLS 策略配置

## 常见问题

### Q: 迁移后无法访问数据？
A: 检查 RLS 策略是否正确配置，确保使用了正确的 Service Role Key

### Q: 匿名用户无法操作数据？
A: 执行 `database_migration_anon_policies.sql` 中的策略

### Q: 触发器不工作？
A: 确保 `update_updated_at_column()` 函数已正确创建

## 联系支持

如果在迁移过程中遇到问题，可以：
1. 检查 Supabase Dashboard 的日志
2. 使用项目中的测试脚本验证连接
3. 查看浏览器控制台的错误信息
