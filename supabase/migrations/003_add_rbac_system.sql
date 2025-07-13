-- 添加RBAC权限管理系统
-- 使用角色权限一体表设计
-- 创建角色权限一体表
CREATE TABLE user_roles_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    role_display_name VARCHAR(100) NOT NULL,
    permissions JSONB NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 创建用户角色关联表
CREATE TABLE user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_name VARCHAR(50) REFERENCES user_roles_permissions(role_name) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role_name)
);
-- 创建索引
CREATE INDEX idx_user_roles_permissions_role_name ON user_roles_permissions(role_name);
CREATE INDEX idx_user_roles_permissions_is_active ON user_roles_permissions(is_active);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_name ON user_roles(role_name);
CREATE INDEX idx_user_roles_is_active ON user_roles(is_active);
CREATE INDEX idx_user_roles_expires_at ON user_roles(expires_at);
-- 添加更新时间触发器
CREATE TRIGGER update_user_roles_permissions_updated_at BEFORE
UPDATE ON user_roles_permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_roles_updated_at BEFORE
UPDATE ON user_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- 启用行级安全策略
ALTER TABLE user_roles_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
-- 创建安全策略
CREATE POLICY "Authenticated users can view roles" ON user_roles_permissions FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can manage roles" ON user_roles_permissions FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM user_roles ur
            JOIN user_roles_permissions urp ON ur.role_name = urp.role_name
        WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND urp.role_name = 'admin'
            AND (
                ur.expires_at IS NULL
                OR ur.expires_at > NOW()
            )
    )
);
CREATE POLICY "Users can view own roles" ON user_roles FOR
SELECT TO authenticated USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM user_roles ur
                JOIN user_roles_permissions urp ON ur.role_name = urp.role_name
            WHERE ur.user_id = auth.uid()
                AND ur.is_active = true
                AND urp.role_name = 'admin'
                AND (
                    ur.expires_at IS NULL
                    OR ur.expires_at > NOW()
                )
        )
    );
CREATE POLICY "Only admins can manage user roles" ON user_roles FOR
INSERT,
    UPDATE,
    DELETE TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM user_roles ur
                JOIN user_roles_permissions urp ON ur.role_name = urp.role_name
            WHERE ur.user_id = auth.uid()
                AND ur.is_active = true
                AND urp.role_name = 'admin'
                AND (
                    ur.expires_at IS NULL
                    OR ur.expires_at > NOW()
                )
        )
    );
-- 插入默认角色和权限
INSERT INTO user_roles_permissions (
        role_name,
        role_display_name,
        permissions,
        description
    )
VALUES (
        'admin',
        'Administrator',
        '{"personality": ["view", "generate", "manage"], "astrology": ["view", "generate", "manage"], "chat": ["view", "create", "delete", "manage"], "admin": ["dashboard", "users", "roles", "reports"], "profile": ["view", "edit", "manage"], "system": ["manage", "config"]}'::jsonb,
        'System administrator with all permissions'
    ),
    (
        'vip_user',
        'VIP User',
        '{"personality": ["view", "generate"], "astrology": ["view", "generate"], "chat": ["view", "create", "delete"], "profile": ["view", "edit"], "premium": ["access"]}'::jsonb,
        'VIP user with premium features'
    ),
    (
        'basic_user',
        'Basic User',
        '{"personality": ["view"], "astrology": ["view"], "chat": ["view", "create"], "profile": ["view", "edit"]}'::jsonb,
        'Basic user with standard permissions'
    ),
    (
        'guest',
        'Guest',
        '{"personality": [], "astrology": [], "chat": [], "profile": ["view"]}'::jsonb,
        'Guest user with view-only access'
    );
-- 为现有用户分配默认角色
INSERT INTO user_roles (user_id, role_name, assigned_at)
SELECT id,
    'basic_user',
    NOW()
FROM users
WHERE NOT EXISTS (
        SELECT 1
        FROM user_roles
        WHERE user_roles.user_id = users.id
    );
-- 添加权限检查函数
CREATE OR REPLACE FUNCTION has_permission(
        user_uuid UUID,
        module_name TEXT,
        action_name TEXT
    ) RETURNS BOOLEAN AS $$
DECLARE user_permissions JSONB;
module_permissions TEXT [];
BEGIN
SELECT COALESCE(
        jsonb_agg(urp.permissions),
        '[]'::jsonb
    ) INTO user_permissions
FROM user_roles ur
    JOIN user_roles_permissions urp ON ur.role_name = urp.role_name
WHERE ur.user_id = user_uuid
    AND ur.is_active = true
    AND urp.is_active = true
    AND (
        ur.expires_at IS NULL
        OR ur.expires_at > NOW()
    );
SELECT array_agg(action) INTO module_permissions
FROM (
        SELECT DISTINCT jsonb_array_elements_text(perm->module_name) as action
        FROM jsonb_array_elements(user_permissions) as perm
        WHERE perm ? module_name
    ) actions;
RETURN action_name = ANY(module_permissions);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 添加获取用户权限函数
CREATE OR REPLACE FUNCTION get_user_permissions(user_uuid UUID) RETURNS JSONB AS $$
DECLARE result JSONB := '{}'::jsonb;
role_perms JSONB;
BEGIN FOR role_perms IN
SELECT urp.permissions
FROM user_roles ur
    JOIN user_roles_permissions urp ON ur.role_name = urp.role_name
WHERE ur.user_id = user_uuid
    AND ur.is_active = true
    AND urp.is_active = true
    AND (
        ur.expires_at IS NULL
        OR ur.expires_at > NOW()
    ) LOOP result := result || role_perms;
END LOOP;
RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 添加表注释
COMMENT ON TABLE user_roles_permissions IS 'Roles and permissions table';
COMMENT ON TABLE user_roles IS 'User role assignments table';
COMMENT ON COLUMN user_roles_permissions.permissions IS 'Permissions JSON format: {"module": ["action1", "action2"]}';
COMMENT ON COLUMN user_roles.expires_at IS 'Role expiration time, NULL means never expires';
COMMENT ON FUNCTION has_permission(UUID, TEXT, TEXT) IS 'Check if user has specific permission';
COMMENT ON FUNCTION get_user_permissions(UUID) IS 'Get all user permissions';