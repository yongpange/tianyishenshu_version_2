-- 为 personality_reports 表添加异步生成支持字段
-- 在 Supabase Dashboard 中执行此 SQL

-- 添加任务状态相关字段
ALTER TABLE personality_reports 
ADD COLUMN IF NOT EXISTS task_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'completed',
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- 添加字段注释
COMMENT ON COLUMN personality_reports.task_id IS '异步生成任务ID';
COMMENT ON COLUMN personality_reports.status IS '生成状态：generating/completed/failed';
COMMENT ON COLUMN personality_reports.progress IS '生成进度：0-100';
COMMENT ON COLUMN personality_reports.error_message IS '错误信息（如果生成失败）';

-- 为现有记录设置默认状态
UPDATE personality_reports 
SET status = 'completed', progress = 100 
WHERE status IS NULL AND content IS NOT NULL AND content != '';

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_personality_reports_task_id ON personality_reports(task_id);
CREATE INDEX IF NOT EXISTS idx_personality_reports_status ON personality_reports(status);
CREATE INDEX IF NOT EXISTS idx_personality_reports_user_status ON personality_reports(user_id, status);
