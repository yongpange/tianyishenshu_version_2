-- 为 user_profiles 表添加 Coze Access Token 相关字段
-- 用于缓存和复用 JWT 生成的 Access Token
-- 添加 Coze Access Token 字段
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS coze_access_token TEXT NULL;
-- 添加 token 过期时间字段
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS coze_token_expires_at TIMESTAMP WITH TIME ZONE NULL;
-- 添加 token 创建时间字段
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS coze_token_created_at TIMESTAMP WITH TIME ZONE NULL;
-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_profiles_token_expires ON user_profiles(coze_token_expires_at);
-- 添加字段注释
COMMENT ON COLUMN user_profiles.coze_access_token IS 'Coze API Access Token，通过JWT认证获取，有效期24小时';
COMMENT ON COLUMN user_profiles.coze_token_expires_at IS 'Access Token过期时间';
COMMENT ON COLUMN user_profiles.coze_token_created_at IS 'Access Token创建时间';