-- 为 bazi_reports 表添加八字上下文字段
-- 在 Supabase Dashboard 中执行此 SQL
-- 为 bazi_reports 表添加格式化的八字上下文字段
ALTER TABLE bazi_reports
ADD COLUMN IF NOT EXISTS astrology_context TEXT;
-- 添加字段注释
COMMENT ON COLUMN bazi_reports.astrology_context IS '格式化后的八字排盘上下文信息，用于所有报告生成和对话';
-- 创建索引以提高查询性能（可选）
CREATE INDEX IF NOT EXISTS idx_bazi_reports_astrology_context ON bazi_reports USING gin(to_tsvector('chinese', astrology_context));
-- 验证字段是否添加成功
SELECT table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'bazi_reports'
    AND column_name = 'astrology_context';
-- 查看 bazi_reports 表的完整结构
\ d bazi_reports;