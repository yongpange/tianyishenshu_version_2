-- ========================================
-- 天乙神算项目 - 完整数据库迁移 SQL
-- ========================================
-- 此文件包含所有表格的创建语句，可直接在新的 Supabase 账号中执行
-- 生成时间: 2025-01-12
-- 版本: v2.0 (包含最新的报告状态字段)

-- ========================================
-- 1. 创建更新时间触发器函数
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ========================================
-- 2. 创建所有表格
-- ========================================

-- 创建用户表
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invite_code_used VARCHAR(50),
  permissions TEXT[] DEFAULT ARRAY['basic'],
  is_profile_completed BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP WITH TIME ZONE
);

-- 创建用户资料表
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  gender VARCHAR(10) CHECK (gender IN ('male', 'female')) NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  day INTEGER NOT NULL,
  hour INTEGER NOT NULL,
  minute INTEGER NOT NULL,
  area_province VARCHAR(100) NOT NULL,
  area_city VARCHAR(100) NOT NULL,
  area_district VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 创建性格报告表（包含异步生成支持）
CREATE TABLE personality_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_data_hash VARCHAR(100) NOT NULL,
  coze_conversation_id VARCHAR(200),
  task_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'completed',
  progress INTEGER DEFAULT 100,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 创建对话表
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  messages JSONB DEFAULT '[]'::jsonb,
  coze_conversation_id VARCHAR(200),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建兑换码表
CREATE TABLE invite_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) CHECK (status IN ('active', 'used', 'expired')) DEFAULT 'active',
  remarks TEXT,
  used_by UUID REFERENCES users(id),
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 3. 创建索引
-- ========================================

-- 用户表索引
CREATE INDEX idx_users_phone ON users(phone_number);

-- 用户资料表索引
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- 性格报告表索引
CREATE INDEX idx_personality_reports_user_id ON personality_reports(user_id);
CREATE INDEX idx_personality_reports_task_id ON personality_reports(task_id);
CREATE INDEX idx_personality_reports_status ON personality_reports(status);
CREATE INDEX idx_personality_reports_user_status ON personality_reports(user_id, status);

-- 对话表索引
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_coze_conversation_id ON conversations(coze_conversation_id);
CREATE INDEX idx_conversations_user_id_created_at ON conversations(user_id, created_at DESC);

-- 兑换码表索引
CREATE INDEX idx_invite_codes_code ON invite_codes(code);
CREATE INDEX idx_invite_codes_status ON invite_codes(status);

-- ========================================
-- 4. 创建触发器
-- ========================================

-- 为所有表添加更新时间触发器
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personality_reports_updated_at 
  BEFORE UPDATE ON personality_reports 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at 
  BEFORE UPDATE ON conversations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invite_codes_updated_at 
  BEFORE UPDATE ON invite_codes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 5. 添加字段注释
-- ========================================

COMMENT ON COLUMN users.is_profile_completed IS '用户是否已完成个人信息填写';
COMMENT ON COLUMN users.last_login IS '用户最后登录时间';
COMMENT ON COLUMN conversations.coze_conversation_id IS 'Coze智能体的对话ID，用于保持对话连续性';
COMMENT ON COLUMN personality_reports.task_id IS '异步生成任务ID';
COMMENT ON COLUMN personality_reports.status IS '生成状态：generating/completed/failed';
COMMENT ON COLUMN personality_reports.progress IS '生成进度：0-100';
COMMENT ON COLUMN personality_reports.error_message IS '错误信息（如果生成失败）';

-- ========================================
-- 6. 启用行级安全策略 (RLS)
-- ========================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE personality_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 7. 创建 RLS 策略
-- ========================================

-- 用户表策略
CREATE POLICY "Service role can manage users" ON users
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Anonymous can insert users" ON users
  FOR INSERT TO anon WITH CHECK (true);

-- 用户资料表策略
CREATE POLICY "Service role can manage profiles" ON user_profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 性格报告表策略
CREATE POLICY "Service role can manage reports" ON personality_reports
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 对话表策略
CREATE POLICY "Service role can manage conversations" ON conversations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 兑换码表策略
CREATE POLICY "Service role can manage invite codes" ON invite_codes
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ========================================
-- 8. 添加策略注释
-- ========================================

COMMENT ON POLICY "Service role can manage users" ON users IS '服务端可以完全管理用户数据';
COMMENT ON POLICY "Service role can manage profiles" ON user_profiles IS '服务端可以完全管理用户资料';
COMMENT ON POLICY "Service role can manage reports" ON personality_reports IS '服务端可以完全管理性格报告';
COMMENT ON POLICY "Service role can manage conversations" ON conversations IS '服务端可以完全管理对话数据';
COMMENT ON POLICY "Anonymous can insert users" ON users IS '允许匿名用户注册（用于登录流程）';

-- ========================================
-- 9. 验证脚本（可选执行）
-- ========================================

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

-- 验证所有索引是否创建成功
SELECT indexname, tablename, indexdef
FROM pg_indexes
WHERE tablename IN ('users', 'user_profiles', 'personality_reports', 'conversations', 'invite_codes')
ORDER BY tablename, indexname;
