-- ========================================
-- 天乙神算项目 - 仅表格结构 SQL
-- ========================================
-- 此文件仅包含表格创建语句，不包含策略和触发器
-- 用于快速查看数据库结构

-- 1. 用户表
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

-- 2. 用户资料表
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

-- 3. 性格报告表（包含异步生成支持）
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

-- 4. 对话表
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  messages JSONB DEFAULT '[]'::jsonb,
  coze_conversation_id VARCHAR(200),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 兑换码表
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
-- 字段说明
-- ========================================

/*
users 表字段说明：
- id: 用户唯一标识
- phone_number: 手机号（登录凭证）
- is_profile_completed: 是否完成个人信息填写
- last_login: 最后登录时间
- invite_code_used: 使用的邀请码
- permissions: 用户权限数组

user_profiles 表字段说明：
- user_id: 关联用户ID
- name: 用户姓名
- gender: 性别 (male/female)
- year/month/day/hour/minute: 出生时间
- area_*: 出生地区（省市区）

personality_reports 表字段说明：
- user_id: 关联用户ID
- content: 报告内容（Markdown格式）
- user_data_hash: 用户数据哈希（用于缓存）
- coze_conversation_id: Coze对话ID
- task_id: 异步生成任务ID
- status: 生成状态 (generating/completed/failed)
- progress: 生成进度 (0-100)
- error_message: 错误信息

conversations 表字段说明：
- user_id: 关联用户ID
- title: 对话标题
- messages: 消息数组（JSON格式）
- coze_conversation_id: Coze对话ID

invite_codes 表字段说明：
- code: 兑换码
- status: 状态 (active/used/expired)
- used_by: 使用者用户ID
- used_at: 使用时间
- remarks: 备注
*/
