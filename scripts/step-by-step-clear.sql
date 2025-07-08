-- 逐步清理数据 - 请按顺序执行每个步骤

-- 步骤1：查看当前表结构
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 步骤2：查看当前数据量
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'user_profiles', COUNT(*) FROM user_profiles
UNION ALL
SELECT 'personality_reports', COUNT(*) FROM personality_reports
UNION ALL
SELECT 'conversations', COUNT(*) FROM conversations
UNION ALL
SELECT 'invite_codes', COUNT(*) FROM invite_codes;

-- 步骤3：删除对话表数据（先删除有外键依赖的）
-- DELETE FROM conversations;

-- 步骤4：删除性格报告表数据
-- DELETE FROM personality_reports;

-- 步骤5：删除用户资料表数据
-- DELETE FROM user_profiles;

-- 步骤6：删除用户表数据
-- DELETE FROM users;

-- 步骤7：验证清理结果
-- SELECT 'users' as table_name, COUNT(*) as count FROM users
-- UNION ALL
-- SELECT 'user_profiles', COUNT(*) FROM user_profiles
-- UNION ALL
-- SELECT 'personality_reports', COUNT(*) FROM personality_reports
-- UNION ALL
-- SELECT 'conversations', COUNT(*) FROM conversations
-- UNION ALL
-- SELECT 'invite_codes', COUNT(*) FROM invite_codes;
