-- 创建事业财富报告表
CREATE TABLE wealth_reports (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  content TEXT,
  generated_at TIMESTAMP WITH TIME ZONE,
  user_data_hash TEXT,
  coze_conversation_id TEXT,
  task_id TEXT,
  status TEXT DEFAULT 'completed',
  progress INTEGER DEFAULT 100,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建婚恋感情报告表
CREATE TABLE marriage_reports (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  content TEXT,
  generated_at TIMESTAMP WITH TIME ZONE,
  user_data_hash TEXT,
  coze_conversation_id TEXT,
  task_id TEXT,
  status TEXT DEFAULT 'completed',
  progress INTEGER DEFAULT 100,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建身体健康报告表
CREATE TABLE health_reports (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  content TEXT,
  generated_at TIMESTAMP WITH TIME ZONE,
  user_data_hash TEXT,
  coze_conversation_id TEXT,
  task_id TEXT,
  status TEXT DEFAULT 'completed',
  progress INTEGER DEFAULT 100,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX idx_wealth_reports_user_id ON wealth_reports(user_id);
CREATE INDEX idx_wealth_reports_task_id ON wealth_reports(task_id);
CREATE INDEX idx_marriage_reports_user_id ON marriage_reports(user_id);
CREATE INDEX idx_marriage_reports_task_id ON marriage_reports(task_id);
CREATE INDEX idx_health_reports_user_id ON health_reports(user_id);
CREATE INDEX idx_health_reports_task_id ON health_reports(task_id);

-- 启用行级安全策略 (RLS)
ALTER TABLE wealth_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE marriage_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_reports ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略（允许用户访问自己的报告）
CREATE POLICY "Users can view their own wealth reports" ON wealth_reports
  FOR SELECT USING (user_id IN (
    SELECT id FROM user_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own wealth reports" ON wealth_reports
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM user_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own wealth reports" ON wealth_reports
  FOR UPDATE USING (user_id IN (
    SELECT id FROM user_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view their own marriage reports" ON marriage_reports
  FOR SELECT USING (user_id IN (
    SELECT id FROM user_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own marriage reports" ON marriage_reports
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM user_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own marriage reports" ON marriage_reports
  FOR UPDATE USING (user_id IN (
    SELECT id FROM user_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view their own health reports" ON health_reports
  FOR SELECT USING (user_id IN (
    SELECT id FROM user_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own health reports" ON health_reports
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM user_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own health reports" ON health_reports
  FOR UPDATE USING (user_id IN (
    SELECT id FROM user_profiles WHERE user_id = auth.uid()
  ));
