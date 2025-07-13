-- 为 user_profiles 表添加 parent_id 字段
-- 这个字段用于建立用户资料之间的层级关系
-- 添加 parent_id 字段
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES user_profiles(id) ON DELETE
SET NULL;
-- 添加约束，防止自己引用自己
ALTER TABLE user_profiles
ADD CONSTRAINT IF NOT EXISTS chk_parent_not_self CHECK (
        (parent_id IS NULL)
        OR (parent_id <> id)
    );
-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_profiles_parent_id ON user_profiles(parent_id);
-- 创建唯一索引，确保每个用户只有一个顶级资料（parent_id 为空的记录）
CREATE UNIQUE INDEX IF NOT EXISTS uniq_user_profiles_primary ON user_profiles(user_id)
WHERE parent_id IS NULL;
-- 添加字段注释
COMMENT ON COLUMN user_profiles.parent_id IS '父级用户资料ID，用于建立用户资料层级关系';
COMMENT ON CONSTRAINT chk_parent_not_self ON user_profiles IS '防止用户资料自己引用自己';
COMMENT ON INDEX uniq_user_profiles_primary IS '确保每个用户只有一个顶级资料（parent_id为空的记录）';