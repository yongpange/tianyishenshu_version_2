-- 添加用户表缺失的字段
-- 为天乙神算项目的登录/注册系统添加必要字段

-- 添加 is_profile_completed 字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_profile_completed BOOLEAN DEFAULT FALSE;

-- 添加 last_login 字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- 更新现有用户的 is_profile_completed 状态
-- 如果用户在 user_profiles 表中有记录，则标记为已完成
UPDATE users 
SET is_profile_completed = TRUE 
WHERE id IN (
  SELECT DISTINCT user_id 
  FROM user_profiles
);

-- 添加注释
COMMENT ON COLUMN users.is_profile_completed IS '用户是否已完成个人信息填写';
COMMENT ON COLUMN users.last_login IS '用户最后登录时间';
