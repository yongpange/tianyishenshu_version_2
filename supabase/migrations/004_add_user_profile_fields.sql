-- 为user_profiles表添加新字段
-- 添加邀请码使用记录、聊天使用次数和用户角色字段
-- 添加邀请码使用字段（冗余字段，方便在profile中直接查询）
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS invite_code_used VARCHAR(50);
-- 添加聊天相关字段：总次数、使用次数、剩余次数
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS chat_total_count INTEGER DEFAULT 10;
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS chat_used_count INTEGER DEFAULT 0;
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS chat_remaining_count INTEGER DEFAULT 10;
-- 添加用户当前角色字段（冗余字段，存储用户的主要角色）
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS user_role VARCHAR(50) DEFAULT 'basic_user';
-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_profiles_invite_code ON user_profiles(invite_code_used);
CREATE INDEX IF NOT EXISTS idx_user_profiles_chat_total ON user_profiles(chat_total_count);
CREATE INDEX IF NOT EXISTS idx_user_profiles_chat_used ON user_profiles(chat_used_count);
CREATE INDEX IF NOT EXISTS idx_user_profiles_chat_remaining ON user_profiles(chat_remaining_count);
CREATE INDEX IF NOT EXISTS idx_user_profiles_current_role ON user_profiles(current_role);
-- 从users表同步invite_code_used数据到user_profiles表
UPDATE user_profiles
SET invite_code_used = users.invite_code_used
FROM users
WHERE user_profiles.user_id = users.id
    AND user_profiles.invite_code_used IS NULL;
-- 从user_roles表同步当前角色到user_profiles表
-- 如果用户有多个角色，优先选择admin > vip_user > basic_user > guest
UPDATE user_profiles
SET current_role = (
        SELECT ur.role_name
        FROM user_roles ur
        WHERE ur.user_id = user_profiles.user_id
            AND ur.is_active = true
            AND (
                ur.expires_at IS NULL
                OR ur.expires_at > NOW()
            )
        ORDER BY CASE
                ur.role_name
                WHEN 'admin' THEN 1
                WHEN 'vip_user' THEN 2
                WHEN 'basic_user' THEN 3
                WHEN 'guest' THEN 4
                ELSE 5
            END
        LIMIT 1
    )
WHERE EXISTS (
        SELECT 1
        FROM user_roles ur
        WHERE ur.user_id = user_profiles.user_id
            AND ur.is_active = true
            AND (
                ur.expires_at IS NULL
                OR ur.expires_at > NOW()
            )
    );
-- 初始化现有用户的聊天次数数据
-- 为已存在的用户设置默认的聊天配额
UPDATE user_profiles
SET chat_total_count = CASE
        WHEN current_role = 'admin' THEN 999
        WHEN current_role = 'vip_user' THEN 50
        WHEN current_role = 'basic_user' THEN 10
        ELSE 3
    END,
    chat_used_count = COALESCE(chat_used_count, 0),
    chat_remaining_count = CASE
        WHEN current_role = 'admin' THEN 999
        WHEN current_role = 'vip_user' THEN 50
        WHEN current_role = 'basic_user' THEN 10
        ELSE 3
    END - COALESCE(chat_used_count, 0)
WHERE chat_total_count IS NULL
    OR chat_remaining_count IS NULL;
-- 创建触发器函数：当users表的invite_code_used更新时，同步到user_profiles
CREATE OR REPLACE FUNCTION sync_invite_code_to_profile() RETURNS TRIGGER AS $$ BEGIN -- 当users表的invite_code_used更新时，同步到对应的user_profiles
UPDATE user_profiles
SET invite_code_used = NEW.invite_code_used,
    updated_at = NOW()
WHERE user_id = NEW.id;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- 创建触发器：users表invite_code_used字段变化时自动同步
CREATE TRIGGER sync_invite_code_to_profile_trigger
AFTER
UPDATE OF invite_code_used ON users FOR EACH ROW
    WHEN (
        OLD.invite_code_used IS DISTINCT
        FROM NEW.invite_code_used
    ) EXECUTE FUNCTION sync_invite_code_to_profile();
-- 创建触发器函数：当用户角色变化时，更新profile中的current_role
CREATE OR REPLACE FUNCTION sync_role_to_profile() RETURNS TRIGGER AS $$
DECLARE new_role VARCHAR(50);
BEGIN -- 获取用户的最高优先级角色
SELECT ur.role_name INTO new_role
FROM user_roles ur
WHERE ur.user_id = COALESCE(NEW.user_id, OLD.user_id)
    AND ur.is_active = true
    AND (
        ur.expires_at IS NULL
        OR ur.expires_at > NOW()
    )
ORDER BY CASE
        ur.role_name
        WHEN 'admin' THEN 1
        WHEN 'vip_user' THEN 2
        WHEN 'basic_user' THEN 3
        WHEN 'guest' THEN 4
        ELSE 5
    END
LIMIT 1;
-- 如果没有找到角色，设置为默认角色
IF new_role IS NULL THEN new_role := 'basic_user';
END IF;
-- 更新user_profiles中的current_role
UPDATE user_profiles
SET current_role = new_role,
    updated_at = NOW()
WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);
RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
-- 创建触发器：user_roles表变化时自动同步角色到profile
CREATE TRIGGER sync_role_to_profile_trigger
AFTER
INSERT
    OR
UPDATE
    OR DELETE ON user_roles FOR EACH ROW EXECUTE FUNCTION sync_role_to_profile();
-- 创建增加聊天使用次数的函数
CREATE OR REPLACE FUNCTION increment_chat_usage(user_uuid UUID) RETURNS INTEGER AS $$
DECLARE new_used_count INTEGER;
current_remaining INTEGER;
BEGIN -- 检查剩余次数是否足够
SELECT chat_remaining_count INTO current_remaining
FROM user_profiles
WHERE user_id = user_uuid;
IF current_remaining IS NULL
OR current_remaining <= 0 THEN RAISE EXCEPTION 'No remaining chat credits available';
END IF;
-- 增加使用次数，减少剩余次数
UPDATE user_profiles
SET chat_used_count = chat_used_count + 1,
    chat_remaining_count = chat_remaining_count - 1,
    updated_at = NOW()
WHERE user_id = user_uuid
RETURNING chat_used_count INTO new_used_count;
-- 如果没有找到记录，返回0
IF new_used_count IS NULL THEN new_used_count := 0;
END IF;
RETURN new_used_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 创建重置/调整聊天次数的函数（管理员功能）
CREATE OR REPLACE FUNCTION adjust_chat_quota(
        user_uuid UUID,
        new_total INTEGER DEFAULT NULL,
        new_used INTEGER DEFAULT NULL,
        reset_used BOOLEAN DEFAULT FALSE
    ) RETURNS BOOLEAN AS $$ BEGIN -- 检查调用者是否为管理员
    IF NOT EXISTS (
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
    ) THEN RAISE EXCEPTION 'Access denied: Admin role required';
END IF;
-- 根据参数调整聊天配额
UPDATE user_profiles
SET chat_total_count = COALESCE(new_total, chat_total_count),
    chat_used_count = CASE
        WHEN reset_used THEN 0
        WHEN new_used IS NOT NULL THEN new_used
        ELSE chat_used_count
    END,
    chat_remaining_count = CASE
        WHEN reset_used THEN COALESCE(new_total, chat_total_count)
        WHEN new_total IS NOT NULL
        OR new_used IS NOT NULL THEN COALESCE(new_total, chat_total_count) - COALESCE(new_used, chat_used_count)
        ELSE chat_remaining_count
    END,
    updated_at = NOW()
WHERE user_id = user_uuid;
RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 添加字段约束
ALTER TABLE user_profiles
ADD CONSTRAINT check_chat_counts_non_negative CHECK (
        chat_total_count >= 0
        AND chat_used_count >= 0
        AND chat_remaining_count >= 0
    );
ALTER TABLE user_profiles
ADD CONSTRAINT check_chat_counts_consistency CHECK (
        chat_total_count = chat_used_count + chat_remaining_count
    );
-- 添加外键约束，确保current_role存在于角色表中
ALTER TABLE user_profiles
ADD CONSTRAINT fk_user_profiles_current_role FOREIGN KEY (current_role) REFERENCES user_roles_permissions(role_name);
-- 添加字段注释
COMMENT ON COLUMN user_profiles.invite_code_used IS '用户使用的邀请码（从users表同步）';
COMMENT ON COLUMN user_profiles.chat_total_count IS '用户聊天总次数配额';
COMMENT ON COLUMN user_profiles.chat_used_count IS '用户已使用的聊天次数';
COMMENT ON COLUMN user_profiles.chat_remaining_count IS '用户剩余的聊天次数';
COMMENT ON COLUMN user_profiles.current_role IS '用户当前主要角色（从user_roles表同步）';
COMMENT ON FUNCTION increment_chat_usage(UUID) IS '增加用户聊天使用次数，减少剩余次数';
COMMENT ON FUNCTION adjust_chat_quota(UUID, INTEGER, INTEGER, BOOLEAN) IS '调整用户聊天配额（管理员功能）';
-- 创建增加聊天配额的函数（用于充值、奖励等）
CREATE OR REPLACE FUNCTION add_chat_quota(user_uuid UUID, additional_count INTEGER) RETURNS BOOLEAN AS $$ BEGIN -- 增加总次数和剩余次数
UPDATE user_profiles
SET chat_total_count = chat_total_count + additional_count,
    chat_remaining_count = chat_remaining_count + additional_count,
    updated_at = NOW()
WHERE user_id = user_uuid;
RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 创建获取用户聊天配额信息的函数
CREATE OR REPLACE FUNCTION get_chat_quota(user_uuid UUID) RETURNS TABLE(
        total_count INTEGER,
        used_count INTEGER,
        remaining_count INTEGER
    ) AS $$ BEGIN RETURN QUERY
SELECT chat_total_count,
    chat_used_count,
    chat_remaining_count
FROM user_profiles
WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 创建检查用户是否有足够聊天次数的函数
CREATE OR REPLACE FUNCTION can_chat(user_uuid UUID) RETURNS BOOLEAN AS $$
DECLARE remaining INTEGER;
BEGIN
SELECT chat_remaining_count INTO remaining
FROM user_profiles
WHERE user_id = user_uuid;
RETURN COALESCE(remaining, 0) > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 添加新函数注释
COMMENT ON FUNCTION add_chat_quota(UUID, INTEGER) IS '为用户增加聊天配额（充值、奖励等）';
COMMENT ON FUNCTION get_chat_quota(UUID) IS '获取用户聊天配额信息';
COMMENT ON FUNCTION can_chat(UUID) IS '检查用户是否还有聊天次数';
-- 移除user_profiles表中的phone_number字段，避免与users表冗余
-- 这个字段在user_profiles表中是多余的，因为可以通过users表获取
-- 在删除字段之前，检查是否有数据不一致的情况
DO $$ BEGIN -- 检查是否存在数据不一致
IF EXISTS (
    SELECT 1
    FROM user_profiles up
        JOIN users u ON up.user_id = u.id
    WHERE up.phone_number != u.phone_number
) THEN -- 如果存在不一致，先同步数据
UPDATE user_profiles
SET phone_number = u.phone_number
FROM users u
WHERE user_profiles.user_id = u.id
    AND user_profiles.phone_number != u.phone_number;
RAISE NOTICE '已同步不一致的手机号数据';
END IF;
END $$;
-- 删除user_profiles表中的phone_number字段
ALTER TABLE user_profiles DROP COLUMN IF EXISTS phone_number;
-- 添加注释说明
COMMENT ON TABLE user_profiles IS '用户资料表 - 手机号信息通过users表获取，避免数据冗余';