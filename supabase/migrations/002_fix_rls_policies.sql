-- 修复 RLS 策略，允许服务端操作

-- 1. 删除现有的限制性策略
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

DROP POLICY IF EXISTS "Users can view own reports" ON personality_reports;
DROP POLICY IF EXISTS "Users can insert own reports" ON personality_reports;
DROP POLICY IF EXISTS "Users can update own reports" ON personality_reports;

DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON conversations;

-- 2. 为 service_role 创建完全访问策略
-- 用户表策略
CREATE POLICY "Service role can manage users" ON users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users can view own data" ON users FOR SELECT TO authenticated USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own data" ON users FOR UPDATE TO authenticated USING (auth.uid()::text = id::text);

-- 用户资料表策略
CREATE POLICY "Service role can manage profiles" ON user_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT TO authenticated USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE TO authenticated USING (auth.uid()::text = user_id::text);

-- 性格报告表策略
CREATE POLICY "Service role can manage reports" ON personality_reports FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users can view own reports" ON personality_reports FOR SELECT TO authenticated USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own reports" ON personality_reports FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own reports" ON personality_reports FOR UPDATE TO authenticated USING (auth.uid()::text = user_id::text);

-- 对话表策略
CREATE POLICY "Service role can manage conversations" ON conversations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users can view own conversations" ON conversations FOR SELECT TO authenticated USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own conversations" ON conversations FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own conversations" ON conversations FOR UPDATE TO authenticated USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can delete own conversations" ON conversations FOR DELETE TO authenticated USING (auth.uid()::text = user_id::text);

-- 3. 为匿名用户添加必要的访问权限（用于登录等操作）
CREATE POLICY "Anonymous can insert users" ON users FOR INSERT TO anon WITH CHECK (true);

-- 4. 确保兑换码策略正确
-- 兑换码表策略已经正确，无需修改

-- 5. 添加一些有用的注释
COMMENT ON POLICY "Service role can manage users" ON users IS '服务端可以完全管理用户数据';
COMMENT ON POLICY "Service role can manage profiles" ON user_profiles IS '服务端可以完全管理用户资料';
COMMENT ON POLICY "Service role can manage reports" ON personality_reports IS '服务端可以完全管理性格报告';
COMMENT ON POLICY "Service role can manage conversations" ON conversations IS '服务端可以完全管理对话数据';
COMMENT ON POLICY "Anonymous can insert users" ON users IS '允许匿名用户注册（用于登录流程）';
