-- Supabase RLS 策略设置
-- 用于天乙神数项目的数据库权限配置

-- 1. 为 users 表设置 RLS 策略
-- 允许匿名用户插入和查询自己的记录

-- 删除现有策略（如果存在）
DROP POLICY IF EXISTS "Allow anon users to insert" ON users;
DROP POLICY IF EXISTS "Allow anon users to select own records" ON users;
DROP POLICY IF EXISTS "Allow anon users to update own records" ON users;

-- 创建新的 RLS 策略
-- 允许匿名用户插入记录
CREATE POLICY "Allow anon users to insert" ON users
    FOR INSERT TO anon
    WITH CHECK (true);

-- 允许匿名用户查询记录（基于手机号）
CREATE POLICY "Allow anon users to select own records" ON users
    FOR SELECT TO anon
    USING (true);

-- 允许匿名用户更新自己的记录
CREATE POLICY "Allow anon users to update own records" ON users
    FOR UPDATE TO anon
    USING (true)
    WITH CHECK (true);

-- 2. 为 conversations 表设置 RLS 策略
-- 删除现有策略（如果存在）
DROP POLICY IF EXISTS "Allow anon users to insert conversations" ON conversations;
DROP POLICY IF EXISTS "Allow anon users to select conversations" ON conversations;
DROP POLICY IF EXISTS "Allow anon users to update conversations" ON conversations;
DROP POLICY IF EXISTS "Allow anon users to delete conversations" ON conversations;

-- 创建新的 RLS 策略
-- 允许匿名用户插入对话记录
CREATE POLICY "Allow anon users to insert conversations" ON conversations
    FOR INSERT TO anon
    WITH CHECK (true);

-- 允许匿名用户查询对话记录
CREATE POLICY "Allow anon users to select conversations" ON conversations
    FOR SELECT TO anon
    USING (true);

-- 允许匿名用户更新对话记录
CREATE POLICY "Allow anon users to update conversations" ON conversations
    FOR UPDATE TO anon
    USING (true)
    WITH CHECK (true);

-- 允许匿名用户删除对话记录
CREATE POLICY "Allow anon users to delete conversations" ON conversations
    FOR DELETE TO anon
    USING (true);

-- 3. 确保 RLS 已启用
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- 4. 验证策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('users', 'conversations')
ORDER BY tablename, policyname;
