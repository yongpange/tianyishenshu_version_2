-- 安全清理测试数据 - 分步骤执行
-- 在 Supabase Dashboard 中逐步执行

-- 第一步：检查现有表结构
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 第二步：检查各表的记录数
SELECT 
  'users' as table_name, 
  COUNT(*) as record_count 
FROM users
UNION ALL
SELECT 
  'user_profiles' as table_name, 
  COUNT(*) as record_count 
FROM user_profiles
UNION ALL
SELECT 
  'personality_reports' as table_name, 
  COUNT(*) as record_count 
FROM personality_reports
UNION ALL
SELECT 
  'conversations' as table_name, 
  COUNT(*) as record_count 
FROM conversations;

-- 第三步：删除数据（按依赖关系顺序）
-- 3.1 删除性格报告
DELETE FROM personality_reports;

-- 3.2 删除用户资料
DELETE FROM user_profiles;

-- 3.3 删除对话记录
DELETE FROM conversations;

-- 3.4 删除用户数据
DELETE FROM users;

-- 第四步：验证删除结果
SELECT 
  'users' as table_name, 
  COUNT(*) as record_count 
FROM users
UNION ALL
SELECT 
  'user_profiles' as table_name, 
  COUNT(*) as record_count 
FROM user_profiles
UNION ALL
SELECT 
  'personality_reports' as table_name, 
  COUNT(*) as record_count 
FROM personality_reports
UNION ALL
SELECT 
  'conversations' as table_name, 
  COUNT(*) as record_count 
FROM conversations;
