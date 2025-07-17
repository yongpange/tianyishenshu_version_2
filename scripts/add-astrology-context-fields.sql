-- 为各个报告表添加八字上下文字段
-- 在 Supabase Dashboard 中执行此 SQL
-- 为性格报告表添加八字上下文字段
ALTER TABLE personality_reports
ADD COLUMN IF NOT EXISTS astrology_context TEXT;
-- 为事业财富报告表添加八字上下文字段（如果表存在）
DO $$ BEGIN IF EXISTS (
    SELECT
    FROM information_schema.tables
    WHERE table_name = 'wealth_reports'
) THEN
ALTER TABLE wealth_reports
ADD COLUMN IF NOT EXISTS astrology_context TEXT;
END IF;
END $$;
-- 为婚恋感情报告表添加八字上下文字段（如果表存在）
DO $$ BEGIN IF EXISTS (
    SELECT
    FROM information_schema.tables
    WHERE table_name = 'marriage_reports'
) THEN
ALTER TABLE marriage_reports
ADD COLUMN IF NOT EXISTS astrology_context TEXT;
END IF;
END $$;
-- 为身体健康报告表添加八字上下文字段（如果表存在）
DO $$ BEGIN IF EXISTS (
    SELECT
    FROM information_schema.tables
    WHERE table_name = 'health_reports'
) THEN
ALTER TABLE health_reports
ADD COLUMN IF NOT EXISTS astrology_context TEXT;
END IF;
END $$;
-- 添加字段注释
COMMENT ON COLUMN personality_reports.astrology_context IS '格式化后的八字排盘上下文信息，用于报告生成和对话';
-- 为现有表添加注释（如果表存在）
DO $$ BEGIN IF EXISTS (
    SELECT
    FROM information_schema.tables
    WHERE table_name = 'wealth_reports'
) THEN COMMENT ON COLUMN wealth_reports.astrology_context IS '格式化后的八字排盘上下文信息，用于报告生成';
END IF;
IF EXISTS (
    SELECT
    FROM information_schema.tables
    WHERE table_name = 'marriage_reports'
) THEN COMMENT ON COLUMN marriage_reports.astrology_context IS '格式化后的八字排盘上下文信息，用于报告生成';
END IF;
IF EXISTS (
    SELECT
    FROM information_schema.tables
    WHERE table_name = 'health_reports'
) THEN COMMENT ON COLUMN health_reports.astrology_context IS '格式化后的八字排盘上下文信息，用于报告生成';
END IF;
END $$;
-- 创建索引以提高查询性能（可选）
-- CREATE INDEX IF NOT EXISTS idx_personality_reports_astrology_context ON personality_reports USING gin(to_tsvector('chinese', astrology_context));
-- 验证字段是否添加成功
SELECT table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN (
        'personality_reports',
        'wealth_reports',
        'marriage_reports',
        'health_reports'
    )
    AND column_name = 'astrology_context'
ORDER BY table_name;