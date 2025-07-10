-- 天乙神算项目 - 匿名用户访问策略
-- 此文件用于设置允许匿名用户访问的特殊策略
-- 适用于不使用 Supabase Auth 的项目
-- 生成时间: 2025-07-09

-- ========================================
-- 删除现有的限制性策略
-- ========================================

-- 删除用户表的限制性策略
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Anonymous can insert users" ON users;

-- 删除对话表的限制性策略
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON conversations;

-- ========================================
-- 创建匿名用户访问策略
-- ========================================

-- 用户表 - 允许匿名用户完全访问
CREATE POLICY "Allow anon users to insert" ON users
    FOR INSERT TO anon
    WITH CHECK (true);

CREATE POLICY "Allow anon users to select own records" ON users
    FOR SELECT TO anon
    USING (true);

CREATE POLICY "Allow anon users to update own records" ON users
    FOR UPDATE TO anon
    USING (true)
    WITH CHECK (true);

-- 对话表 - 允许匿名用户完全访问
CREATE POLICY "Allow anon users to insert conversations" ON conversations
    FOR INSERT TO anon
    WITH CHECK (true);

CREATE POLICY "Allow anon users to select conversations" ON conversations
    FOR SELECT TO anon
    USING (true);

CREATE POLICY "Allow anon users to update conversations" ON conversations
    FOR UPDATE TO anon
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow anon users to delete conversations" ON conversations
    FOR DELETE TO anon
    USING (true);

-- 用户资料表 - 允许匿名用户完全访问
CREATE POLICY "Allow anon users to insert profiles" ON user_profiles
    FOR INSERT TO anon
    WITH CHECK (true);

CREATE POLICY "Allow anon users to select profiles" ON user_profiles
    FOR SELECT TO anon
    USING (true);

CREATE POLICY "Allow anon users to update profiles" ON user_profiles
    FOR UPDATE TO anon
    USING (true)
    WITH CHECK (true);

-- 性格报告表 - 允许匿名用户完全访问
CREATE POLICY "Allow anon users to insert reports" ON personality_reports
    FOR INSERT TO anon
    WITH CHECK (true);

CREATE POLICY "Allow anon users to select reports" ON personality_reports
    FOR SELECT TO anon
    USING (true);

CREATE POLICY "Allow anon users to update reports" ON personality_reports
    FOR UPDATE TO anon
    USING (true)
    WITH CHECK (true);

-- ========================================
-- 验证策略设置
-- ========================================

-- 查看所有相关表的策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('users', 'conversations', 'user_profiles', 'personality_reports')
ORDER BY tablename, policyname;
