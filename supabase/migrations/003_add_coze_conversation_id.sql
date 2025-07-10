-- 为conversations表添加coze_conversation_id字段
-- 用于保存Coze智能体的对话ID，实现对话连续性

-- 添加 coze_conversation_id 字段
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS coze_conversation_id VARCHAR(200);

-- 添加注释
COMMENT ON COLUMN conversations.coze_conversation_id IS 'Coze智能体的对话ID，用于保持对话连续性';

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_conversations_coze_conversation_id ON conversations(coze_conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id_created_at ON conversations(user_id, created_at DESC);
