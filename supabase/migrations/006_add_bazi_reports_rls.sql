-- 为八字报告表启用行级安全策略
ALTER TABLE bazi_reports ENABLE ROW LEVEL SECURITY;
-- 创建八字报告表的安全策略
CREATE POLICY "Users can view own bazi reports" ON bazi_reports FOR
SELECT USING (
        user_id IN (
            SELECT id
            FROM user_profiles
            WHERE user_id = auth.uid()
        )
    );
CREATE POLICY "Users can insert own bazi reports" ON bazi_reports FOR
INSERT WITH CHECK (
        user_id IN (
            SELECT id
            FROM user_profiles
            WHERE user_id = auth.uid()
        )
    );
CREATE POLICY "Users can update own bazi reports" ON bazi_reports FOR
UPDATE USING (
        user_id IN (
            SELECT id
            FROM user_profiles
            WHERE user_id = auth.uid()
        )
    );
-- 允许service role完全访问（用于API）
CREATE POLICY "Service role can manage bazi reports" ON bazi_reports FOR ALL TO service_role USING (true);