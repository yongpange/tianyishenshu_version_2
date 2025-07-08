-- 选择性删除测试数据
-- 只删除明确的测试用户数据，保留可能的真实数据

-- 1. 删除测试手机号的相关数据
-- 测试手机号模式：159000000XX

-- 删除测试用户的消息
DELETE FROM messages 
WHERE conversation_id IN (
  SELECT id FROM conversations 
  WHERE user_id IN (
    SELECT id FROM users 
    WHERE phone_number LIKE '159000000%'
  )
);

-- 删除测试用户的对话
DELETE FROM conversations 
WHERE user_id IN (
  SELECT id FROM users 
  WHERE phone_number LIKE '159000000%'
);

-- 删除测试用户的性格报告
DELETE FROM personality_reports 
WHERE user_id IN (
  SELECT id FROM users 
  WHERE phone_number LIKE '159000000%'
);

-- 删除测试用户的资料
DELETE FROM user_profiles 
WHERE user_id IN (
  SELECT id FROM users 
  WHERE phone_number LIKE '159000000%'
);

-- 删除测试用户
DELETE FROM users 
WHERE phone_number LIKE '159000000%';

-- 2. 删除包含错误内容的报告
DELETE FROM personality_reports 
WHERE content LIKE '%很遗憾%' 
   OR content LIKE '%执行超时%'
   OR content LIKE '%未能成功获取结果%'
   OR LENGTH(content) < 300;

-- 3. 删除空的或无效的记录
DELETE FROM user_profiles WHERE name IS NULL OR name = '';
DELETE FROM personality_reports WHERE content IS NULL OR content = '';

-- 4. 验证删除结果
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'user_profiles' as table_name, COUNT(*) as record_count FROM user_profiles
UNION ALL
SELECT 'personality_reports' as table_name, COUNT(*) as record_count FROM personality_reports
UNION ALL
SELECT 'conversations' as table_name, COUNT(*) as record_count FROM conversations
UNION ALL
SELECT 'messages' as table_name, COUNT(*) as record_count FROM messages;

-- 5. 显示剩余的用户（确认没有误删）
SELECT phone_number, created_at FROM users ORDER BY created_at DESC;
