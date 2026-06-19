-- 009: 删除僵尸表 user_roles
-- 背景：003_add_rbac_system.sql 建了 user_roles 关联表，本想做"用户↔角色"多对多，
--       但应用代码全程未使用它。真正生效的是 user_profiles.user_role 字段
--       （外键指向 user_roles_permissions.role_name）。
-- 本迁移删除该僵尸表，并清理 003 中引用了 user_roles 的 RLS 策略与函数。
--
-- ⚠️ 执行前请确认：
--   1. 应用通过 service_role 访问数据库，绕过 RLS，删除这些策略不影响业务。
--   2. user_roles_permissions 表本身保留（角色权限定义仍存于此）。

-- 1) 删除引用了 user_roles 的 RLS 策略（建在 user_roles_permissions 上）
DROP POLICY IF EXISTS "Only admins can manage roles" ON user_roles_permissions;

-- 2) 删除依赖 user_roles 的权限函数（其查询基于 user_roles 关联）
DROP FUNCTION IF EXISTS has_permission(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_user_permissions(UUID);

-- 3) 删除僵尸表本身（CASCADE 连带清理其自身的策略、索引、触发器、外键）
DROP TABLE IF EXISTS user_roles CASCADE;

-- 说明：保留 user_roles_permissions 上的 "Authenticated users can view roles" 只读策略，
--       该策略不引用 user_roles，无需改动。
