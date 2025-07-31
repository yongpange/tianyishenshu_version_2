-- 创建模块管理表（简化版）
-- Migration: 007_add_modules_table_simplified.sql
-- 创建模块表
CREATE TABLE IF NOT EXISTS modules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    module_key VARCHAR(50) UNIQUE NOT NULL,
    module_name VARCHAR(100) NOT NULL,
    module_display_name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20) DEFAULT '#1f2937',
    bot_id VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    is_premium BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    permissions JSONB DEFAULT '[]'::jsonb,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 创建索引
CREATE INDEX IF NOT EXISTS idx_modules_key ON modules(module_key);
CREATE INDEX IF NOT EXISTS idx_modules_active ON modules(is_active);
CREATE INDEX IF NOT EXISTS idx_modules_premium ON modules(is_premium);
CREATE INDEX IF NOT EXISTS idx_modules_sort_order ON modules(sort_order);
-- 添加更新时间触发器
CREATE TRIGGER update_modules_updated_at BEFORE
UPDATE ON modules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- 插入默认模块数据
INSERT INTO modules (
        module_key,
        module_name,
        module_display_name,
        description,
        icon,
        color,
        bot_id,
        is_premium,
        sort_order,
        permissions,
        config
    )
VALUES (
        'astrology',
        'astrology',
        '八字排盘',
        '解读您的生辰八字，揭示命运轨迹',
        '☯️',
        '#8b5cf6',
        '7445193658986659842',
        false,
        1,
        '["view", "generate"]'::jsonb,
        '{"subtitle": "解读您的生辰八字，揭示命运轨迹", "status": "推荐"}'::jsonb
    ),
    (
        'personality',
        'personality',
        '性格内观',
        '深入灵魂深处，发现真实的自己',
        '🧠',
        '#3b82f6',
        '7445193658986659842',
        false,
        2,
        '["view", "generate", "chat"]'::jsonb,
        '{"subtitle": "深入灵魂深处，发现真实的自己", "status": "已完成"}'::jsonb
    ),
    (
        'wealth',
        'wealth',
        '事业财富',
        '洞察事业走向，把握财富机遇',
        '💰',
        '#10b981',
        '7445193658986659842',
        false,
        3,
        '["view", "generate", "chat"]'::jsonb,
        '{"subtitle": "洞察事业走向，把握财富机遇"}'::jsonb
    ),
    (
        'marriage',
        'marriage',
        '婚恋感情',
        '探寻情感密码，指引爱情方向',
        '💕',
        '#f59e0b',
        '7445193658986659842',
        false,
        4,
        '["view", "generate", "chat"]'::jsonb,
        '{"subtitle": "探寻情感密码，指引爱情方向"}'::jsonb
    ),
    (
        'health',
        'health',
        '身体健康',
        '感知身心状态，守护健康之源',
        '🏥',
        '#ef4444',
        '7445193658986659842',
        false,
        5,
        '["view", "generate", "chat"]'::jsonb,
        '{"subtitle": "感知身心状态，守护健康之源", "status": "新功能"}'::jsonb
    ),
    (
        'consultation',
        'consultation',
        '咨询问道',
        '一对一专业咨询，解答人生疑惑',
        '🔮',
        '#6366f1',
        '7445193658986659842',
        true,
        6,
        '["view", "chat"]'::jsonb,
        '{"subtitle": "一对一专业咨询，解答人生疑惑"}'::jsonb
    );
-- 插入或更新角色权限数据（使用user_roles_permissions表）
INSERT INTO user_roles_permissions (
        role_name,
        role_display_name,
        permissions,
        description
    )
VALUES (
        'admin',
        '管理员',
        '{"personality": ["view", "generate", "chat", "manage"], "astrology": ["view", "generate", "manage"], "wealth": ["view", "generate", "chat"], "marriage": ["view", "generate", "chat"], "health": ["view", "generate", "chat"], "consultation": ["view", "chat"], "admin": ["dashboard", "users", "roles", "reports"]}'::jsonb,
        '系统管理员，拥有所有权限'
    ),
    (
        'vip_user',
        'VIP用户',
        '{"personality": ["view", "generate", "chat"], "astrology": ["view", "generate"], "wealth": ["view", "generate", "chat"], "marriage": ["view", "generate", "chat"], "health": ["view", "generate", "chat"], "consultation": ["view", "chat"]}'::jsonb,
        'VIP用户，可使用所有模块'
    ),
    (
        'basic_user',
        '普通用户',
        '{"personality": ["view", "chat"], "astrology": ["view"], "wealth": ["view"], "marriage": ["view"], "health": ["view"], "consultation": []}'::jsonb,
        '普通用户，基础功能权限'
    ),
    (
        'guest',
        '访客',
        '{"personality": ["view"], "astrology": ["view"], "wealth": [], "marriage": [], "health": [], "consultation": []}'::jsonb,
        '访客用户，仅可查看部分内容'
    ) ON CONFLICT (role_name) DO
UPDATE
SET permissions = EXCLUDED.permissions,
    role_display_name = EXCLUDED.role_display_name,
    description = EXCLUDED.description,
    updated_at = NOW();
-- 修改conversations表，添加外键约束
ALTER TABLE conversations
ADD CONSTRAINT conversations_module_type_fkey FOREIGN KEY (module_type) REFERENCES modules(module_key) ON UPDATE CASCADE;
-- 为user_profiles.user_role添加外键约束
ALTER TABLE user_profiles
ADD CONSTRAINT user_profiles_user_role_fkey FOREIGN KEY (user_role) REFERENCES user_roles_permissions(role_name) ON UPDATE CASCADE;
-- 启用行级安全策略
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
-- 创建RLS策略
CREATE POLICY "Anyone can view active modules" ON modules FOR
SELECT USING (is_active = true);
CREATE POLICY "Service role can manage modules" ON modules FOR ALL TO service_role USING (true) WITH CHECK (true);
-- 简化版权限检查函数：直接从user_profiles.user_role获取权限
CREATE OR REPLACE FUNCTION user_has_module_permission(
        user_profile_id UUID,
        module_key_param TEXT,
        action_param TEXT
    ) RETURNS BOOLEAN AS $$
DECLARE user_role_name TEXT;
role_permissions JSONB;
module_permissions TEXT [];
BEGIN -- 从user_profiles获取用户角色
SELECT user_role INTO user_role_name
FROM user_profiles
WHERE id = user_profile_id;
IF user_role_name IS NULL THEN RETURN false;
END IF;
-- 获取角色权限
SELECT permissions INTO role_permissions
FROM user_roles_permissions
WHERE role_name = user_role_name
    AND is_active = true;
IF role_permissions IS NULL THEN RETURN false;
END IF;
-- 检查模块权限
SELECT array_agg(action) INTO module_permissions
FROM (
        SELECT jsonb_array_elements_text(role_permissions->module_key_param) as action
    ) actions;
RETURN action_param = ANY(module_permissions);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 简化版获取用户可访问模块函数
CREATE OR REPLACE FUNCTION get_user_accessible_modules(user_profile_id UUID) RETURNS TABLE(
        module_key TEXT,
        module_name TEXT,
        module_display_name TEXT,
        description TEXT,
        icon TEXT,
        color TEXT,
        bot_id TEXT,
        is_premium BOOLEAN,
        user_permissions TEXT []
    ) AS $$
DECLARE user_role_name TEXT;
role_permissions JSONB;
BEGIN -- 从user_profiles获取用户角色
SELECT user_role INTO user_role_name
FROM user_profiles
WHERE id = user_profile_id;
IF user_role_name IS NULL THEN user_role_name := 'guest';
END IF;
-- 获取角色权限
SELECT permissions INTO role_permissions
FROM user_roles_permissions
WHERE role_name = user_role_name
    AND is_active = true;
IF role_permissions IS NULL THEN role_permissions := '{}'::jsonb;
END IF;
RETURN QUERY
SELECT m.module_key::TEXT,
    m.module_name::TEXT,
    m.module_display_name::TEXT,
    m.description::TEXT,
    m.icon::TEXT,
    m.color::TEXT,
    m.bot_id::TEXT,
    m.is_premium,
    COALESCE(
        ARRAY(
            SELECT jsonb_array_elements_text(role_permissions->m.module_key)
        ),
        ARRAY []::TEXT []
    ) as user_permissions
FROM modules m
WHERE m.is_active = true
ORDER BY m.sort_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 获取用户角色信息函数
CREATE OR REPLACE FUNCTION get_user_role_info(user_profile_id UUID) RETURNS TABLE(
        role_name TEXT,
        role_display_name TEXT,
        permissions JSONB
    ) AS $$
DECLARE user_role_name TEXT;
BEGIN -- 从user_profiles获取用户角色
SELECT user_role INTO user_role_name
FROM user_profiles
WHERE id = user_profile_id;
IF user_role_name IS NULL THEN user_role_name := 'guest';
END IF;
RETURN QUERY
SELECT rp.role_name::TEXT,
    rp.role_display_name::TEXT,
    rp.permissions
FROM user_roles_permissions rp
WHERE rp.role_name = user_role_name
    AND rp.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 添加字段注释
COMMENT ON TABLE modules IS '系统模块配置表';
COMMENT ON COLUMN modules.module_key IS '模块唯一标识符';
COMMENT ON COLUMN modules.module_name IS '模块名称（用于代码中）';
COMMENT ON COLUMN modules.module_display_name IS '模块显示名称';
COMMENT ON COLUMN modules.description IS '模块描述';
COMMENT ON COLUMN modules.icon IS '模块图标';
COMMENT ON COLUMN modules.color IS '模块主题色';
COMMENT ON COLUMN modules.bot_id IS '关联的Coze智能体Bot ID';
COMMENT ON COLUMN modules.is_active IS '模块是否启用';
COMMENT ON COLUMN modules.is_premium IS '是否为付费模块';
COMMENT ON COLUMN modules.sort_order IS '排序权重';
COMMENT ON COLUMN modules.permissions IS '模块支持的权限动作列表';
COMMENT ON COLUMN modules.config IS '模块配置信息（JSON格式）';
-- 注释：使用现有的user_roles_permissions表，不需要额外注释
COMMENT ON FUNCTION user_has_module_permission(UUID, TEXT, TEXT) IS '检查用户是否拥有特定模块的权限（简化版）';
COMMENT ON FUNCTION get_user_accessible_modules(UUID) IS '获取用户可访问的模块列表及权限（简化版）';
COMMENT ON FUNCTION get_user_role_info(UUID) IS '获取用户角色信息';