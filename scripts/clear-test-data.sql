-- 清理所有测试数据
-- 在 Supabase Dashboard 中执行此 SQL
-- ⚠️ 注意：此操作将删除所有数据，请确认这是测试环境

-- 1. 删除对话数据（有外键依赖，先删除）
DELETE FROM conversations;

-- 2. 删除性格报告数据
DELETE FROM personality_reports;

-- 3. 删除用户资料数据
DELETE FROM user_profiles;

-- 4. 删除用户数据
DELETE FROM users;

-- 5. 保留邀请码表（通常是系统配置数据）
-- DELETE FROM invite_codes; -- 如果需要删除邀请码，取消注释

-- 6. 验证删除结果
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'user_profiles' as table_name, COUNT(*) as record_count FROM user_profiles
UNION ALL
SELECT 'personality_reports' as table_name, COUNT(*) as record_count FROM personality_reports
UNION ALL
SELECT 'conversations' as table_name, COUNT(*) as record_count FROM conversations
UNION ALL
SELECT 'invite_codes' as table_name, COUNT(*) as record_count FROM invite_codes;

-- 执行完成后，除了invite_codes，其他表的记录数应该都是 0
