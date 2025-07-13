-- 修复剩余对话次数显示问题
-- 在 Supabase Dashboard 的 SQL Editor 中执行此脚本
-- 1. 检查 user_profiles 表是否有 chat_remaining_count 字段
SELECT column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
    AND column_name LIKE '%chat%';
-- 2. 如果没有 chat_remaining_count 字段，添加它
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS chat_remaining_count INTEGER DEFAULT 10;
-- 3. 如果没有 user_role 字段，添加它
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS user_role VARCHAR(50) DEFAULT 'basic_user';
-- 4. 更新现有用户的 NULL 值
UPDATE user_profiles
SET chat_remaining_count = 10
WHERE chat_remaining_count IS NULL;
-- 5. 更新现有用户的角色默认值
UPDATE user_profiles
SET user_role = 'basic_user'
WHERE user_role IS NULL
    OR user_role = '';
-- 6. 验证修复结果
SELECT COUNT(*) as total_users,
    COUNT(chat_remaining_count) as users_with_chat_count,
    COUNT(user_role) as users_with_role,
    AVG(chat_remaining_count) as avg_chat_count
FROM user_profiles;
-- 7. 查看修复后的数据样例
SELECT up.name,
    up.chat_remaining_count,
    up.user_role,
    u.phone_number,
    ic.code as invite_code
FROM user_profiles up
    JOIN users u ON up.user_id = u.id
    LEFT JOIN invite_codes ic ON ic.used_by = u.id
LIMIT 5;
-- 8. 创建索引以提高查询性能（如果不存在）
CREATE INDEX IF NOT EXISTS idx_user_profiles_chat_remaining ON user_profiles(chat_remaining_count);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_role ON user_profiles(user_role);