-- 用户数据流向
-- 手机号 → users.phone_number → users.id → user_profiles.user_id → user_profiles.id → personality_reports.user_id
-- 手机号 → users.phone_number → users.id → user_profiles.user_id → user_profiles.id → conversations.user_id
-- 手机号 → users.phone_number → users.id → user_profiles.user_id → user_profiles.id → invite_codes.used_by
-- 创建用户表
create table public.users (
  id uuid not null default gen_random_uuid (),
  phone_number character varying(20) not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  invite_code_used character varying(50) null,
  permissions text [] null default array ['basic'::text],
  is_profile_completed boolean null default false,
  last_login timestamp with time zone null,
  latest_verification_code character varying(10) null,
  verification_code_expires_at timestamp with time zone null,
  constraint users_pkey primary key (id),
  constraint users_phone_number_key unique (phone_number)
) TABLESPACE pg_default;
create index IF not exists idx_users_phone on public.users using btree (phone_number) TABLESPACE pg_default;
create index IF not exists idx_users_verification_code on public.users using btree (latest_verification_code) TABLESPACE pg_default;
create index IF not exists idx_users_verification_expires on public.users using btree (verification_code_expires_at) TABLESPACE pg_default;
create trigger update_users_updated_at BEFORE
update on users for EACH row execute FUNCTION update_updated_at_column ();
-- 创建用户资料表
create table public.user_profiles (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  name character varying(100) not null,
  gender character varying(10) not null,
  year integer not null,
  month integer not null,
  day integer not null,
  hour integer not null,
  minute integer not null,
  area_province character varying(100) not null,
  area_city character varying(100) not null,
  area_district character varying(100) not null,
  phone_number character varying(20) not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  invite_code_used character varying(50) null,
  chat_total_count integer null default 10,
  chat_used_count integer null default 0,
  chat_remaining_count integer null default 10,
  user_role character varying(50) null default 'basic_user'::character varying,
  parent_id uuid null,
  constraint user_profiles_pkey primary key (id),
  constraint user_profiles_parent_id_fkey foreign KEY (parent_id) references user_profiles (id) on delete
  set null,
    constraint user_profiles_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
    constraint chk_parent_not_self check (
      (
        (parent_id is null)
        or (parent_id <> id)
      )
    ),
    constraint user_profiles_gender_check check (
      (
        (gender)::text = any (
          (
            array [
            'male'::character varying,
            'female'::character varying
          ]
          )::text []
        )
      )
    )
) TABLESPACE pg_default;
create index IF not exists idx_user_profiles_user_id on public.user_profiles using btree (user_id) TABLESPACE pg_default;
create index IF not exists idx_user_profiles_parent_id on public.user_profiles using btree (parent_id) TABLESPACE pg_default;
create unique INDEX IF not exists uniq_user_profiles_primary on public.user_profiles using btree (user_id) TABLESPACE pg_default
where (parent_id is null);
create trigger update_user_profiles_updated_at BEFORE
update on user_profiles for EACH row execute FUNCTION update_updated_at_column ();
-- 创建用户角色权限表
create table public.user_roles_permissions (
  id uuid not null default gen_random_uuid (),
  role_name character varying(50) not null,
  role_display_name character varying(100) not null,
  permissions jsonb not null,
  description text null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint user_roles_permissions_pkey primary key (id),
  constraint user_roles_permissions_role_name_key unique (role_name)
) TABLESPACE pg_default;
-- 创建性格报告表
CREATE TABLE personality_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- user_id 为user_profiles表的id
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_data_hash VARCHAR(100) NOT NULL,
  coze_conversation_id VARCHAR(200),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
-- 创建八字报告表
create table bazi_reports (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  raw_payload jsonb not null,
  generated_at timestamp with time zone null default now(),
  user_data_hash character varying(100) null,
  api_request_id character varying(200) null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint bazi_reports_pkey primary key (id),
  constraint bazi_reports_user_id_key unique (user_id),
  constraint bazi_reports_user_id_fkey foreign KEY (user_id) references user_profiles (id) on delete CASCADE
) TABLESPACE pg_default;
create index IF not exists idx_bazi_reports_user_id on public.bazi_reports using btree (user_id) TABLESPACE pg_default;
create trigger trg_bazi_reports_updated_at BEFORE
update on bazi_reports for EACH row execute FUNCTION update_updated_at_column ();
-- 创建对话表
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- user_id 为user_profiles表的id
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 创建兑换码表
CREATE TABLE invite_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) CHECK (status IN ('active', 'used', 'expired')) DEFAULT 'active',
  remarks TEXT,
  -- used_by 为user_profiles表的id
  used_by UUID REFERENCES user_profiles(id),
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 创建索引
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_personality_reports_user_id ON personality_reports(user_id);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_invite_codes_code ON invite_codes(code);
CREATE INDEX idx_invite_codes_status ON invite_codes(status);
-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ language 'plpgsql';
-- 为所有表添加更新时间触发器
CREATE TRIGGER update_users_updated_at BEFORE
UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE
UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_personality_reports_updated_at BEFORE
UPDATE ON personality_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE
UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invite_codes_updated_at BEFORE
UPDATE ON invite_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- 启用行级安全策略 (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE personality_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
-- 创建安全策略（用户只能访问自己的数据）
CREATE POLICY "Users can view own data" ON users FOR
SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own data" ON users FOR
UPDATE USING (auth.uid()::text = id::text);
CREATE POLICY "Users can view own profile" ON user_profiles FOR
SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR
INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own profile" ON user_profiles FOR
UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can view own reports" ON personality_reports FOR
SELECT USING (
    user_id IN (
      SELECT id
      FROM user_profiles
      WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert own reports" ON personality_reports FOR
INSERT WITH CHECK (
    user_id IN (
      SELECT id
      FROM user_profiles
      WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update own reports" ON personality_reports FOR
UPDATE USING (
    user_id IN (
      SELECT id
      FROM user_profiles
      WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "Users can view own conversations" ON conversations FOR
SELECT USING (
    user_id IN (
      SELECT id
      FROM user_profiles
      WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert own conversations" ON conversations FOR
INSERT WITH CHECK (
    user_id IN (
      SELECT id
      FROM user_profiles
      WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update own conversations" ON conversations FOR
UPDATE USING (
    user_id IN (
      SELECT id
      FROM user_profiles
      WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete own conversations" ON conversations FOR DELETE USING (
  user_id IN (
    SELECT id
    FROM user_profiles
    WHERE user_id = auth.uid()
  )
);
-- 兑换码表策略
CREATE POLICY "Anyone can view invite codes" ON invite_codes FOR
SELECT TO anon,
  authenticated USING (true);
CREATE POLICY "Service role can manage invite codes" ON invite_codes FOR ALL TO service_role USING (true);
CREATE POLICY "Authenticated users can insert invite codes" ON invite_codes FOR
INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update invite codes" ON invite_codes FOR
UPDATE TO authenticated USING (true);