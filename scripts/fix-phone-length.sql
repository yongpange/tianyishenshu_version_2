-- 修复手机号字段长度问题
-- 在 Supabase Dashboard 的 SQL Editor 中执行此脚本
-- 1. 增加手机号字段长度
ALTER TABLE users
ALTER COLUMN phone_number TYPE VARCHAR(50);
-- 2. 清理现有数据中的空格
UPDATE users
SET phone_number = TRIM(phone_number)
WHERE phone_number != TRIM(phone_number);
-- 3. 显示修复后的统计信息
SELECT COUNT(*) as total_users,
    MIN(LENGTH(phone_number)) as min_length,
    MAX(LENGTH(phone_number)) as max_length,
    AVG(LENGTH(phone_number)) as avg_length
FROM users;
-- 4. 显示所有手机号（用于检查）
SELECT phone_number,
    LENGTH(phone_number) as length
FROM users
ORDER BY created_at DESC;