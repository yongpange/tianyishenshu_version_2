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
  coze_access_token text null,
  coze_token_expires_at timestamp with time zone null,
  coze_token_created_at timestamp with time zone null,
  constraint user_profiles_pkey primary key (id),
  constraint user_profiles_parent_id_fkey foreign KEY (parent_id) references user_profiles (id) on delete
  set null,
    constraint user_profiles_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
    constraint user_profiles_user_role_fkey foreign KEY (user_role) references user_roles_permissions (role_name) on update CASCADE,
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
create index IF not exists idx_user_profiles_token_expires on public.user_profiles using btree (coze_token_expires_at) TABLESPACE pg_default;
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
create table public.bazi_reports (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  raw_payload jsonb not null,
  generated_at timestamp with time zone null default now(),
  user_data_hash character varying(100) null,
  api_request_id character varying(200) null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  astrology_context text null,
  constraint bazi_reports_pkey primary key (id),
  constraint bazi_reports_user_id_key unique (user_id),
  constraint bazi_reports_user_id_fkey foreign KEY (user_id) references user_profiles (id) on delete CASCADE
) TABLESPACE pg_default;
create index IF not exists idx_bazi_reports_user_id on public.bazi_reports using btree (user_id) TABLESPACE pg_default;
create trigger trg_bazi_reports_updated_at BEFORE
update on bazi_reports for EACH row execute FUNCTION update_updated_at_column ();
-- 创建对话表
create table public.conversations (
  id uuid not null default gen_random_uuid (),
  -- user_id 为user_profiles表的id
  user_id uuid null,
  title character varying(200) not null,
  module_type character varying(50) not null check (
    module_type in (
      'personality',
      'astrology',
      'wealth',
      'marriage',
      'health',
      'consultation'
    )
  ),
  messages jsonb null default '[]'::jsonb,
  coze_conversation_id character varying(200) null,
  bot_id character varying(50) null,
  is_pinned boolean null default false,
  is_manual_title boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint conversations_pkey primary key (id),
  constraint conversations_user_id_fkey foreign KEY (user_id) references user_profiles (id) on delete CASCADE
) TABLESPACE pg_default;
create index IF not exists idx_conversations_user_id on public.conversations using btree (user_id) TABLESPACE pg_default;
create index IF not exists idx_conversations_module_type on public.conversations using btree (module_type) TABLESPACE pg_default;
create index IF not exists idx_conversations_user_module on public.conversations using btree (user_id, module_type) TABLESPACE pg_default;
create index IF not exists idx_conversations_coze_conversation_id on public.conversations using btree (coze_conversation_id) TABLESPACE pg_default;
create index IF not exists idx_conversations_user_id_created_at on public.conversations using btree (user_id, created_at desc) TABLESPACE pg_default;
create index IF not exists idx_conversations_user_module_created_at on public.conversations using btree (user_id, module_type, created_at desc) TABLESPACE pg_default;
create trigger update_conversations_updated_at BEFORE
update on conversations for EACH row execute FUNCTION update_updated_at_column ();
-- 创建消息表
create table public.messages (
  id uuid not null default gen_random_uuid (),
  -- conversation_id 为 conversations表的id
  conversation_id uuid not null,
  role character varying(20) not null check (role in ('user', 'assistant', 'system', 'tool')),
  content text not null,
  metadata jsonb null default '{}'::jsonb,
  message_index integer not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint messages_pkey primary key (id),
  constraint messages_conversation_id_fkey foreign KEY (conversation_id) references conversations (id) on delete CASCADE,
  constraint messages_conversation_index_unique unique (conversation_id, message_index)
) TABLESPACE pg_default;
create index IF not exists idx_messages_conversation_id on public.messages using btree (conversation_id) TABLESPACE pg_default;
create index IF not exists idx_messages_conversation_id_index on public.messages using btree (conversation_id, message_index) TABLESPACE pg_default;
create index IF not exists idx_messages_created_at on public.messages using btree (created_at) TABLESPACE pg_default;
create trigger update_messages_updated_at BEFORE
update on messages for EACH row execute FUNCTION update_updated_at_column ();
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
CREATE INDEX idx_conversations_module_type ON conversations(module_type);
CREATE INDEX idx_conversations_user_module ON conversations(user_id, module_type);
CREATE INDEX idx_conversations_user_module_created_at ON conversations(user_id, module_type, created_at DESC);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_conversation_id_index ON messages(conversation_id, message_index);
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
CREATE TRIGGER update_messages_updated_at BEFORE
UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invite_codes_updated_at BEFORE
UPDATE ON invite_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- 启用行级安全策略 (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE personality_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
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
-- 消息表策略
CREATE POLICY "Users can view own messages" ON messages FOR
SELECT USING (
    conversation_id IN (
      SELECT id
      FROM conversations
      WHERE user_id IN (
          SELECT id
          FROM user_profiles
          WHERE user_id = auth.uid()
        )
    )
  );
CREATE POLICY "Users can insert own messages" ON messages FOR
INSERT WITH CHECK (
    conversation_id IN (
      SELECT id
      FROM conversations
      WHERE user_id IN (
          SELECT id
          FROM user_profiles
          WHERE user_id = auth.uid()
        )
    )
  );
CREATE POLICY "Users can update own messages" ON messages FOR
UPDATE USING (
    conversation_id IN (
      SELECT id
      FROM conversations
      WHERE user_id IN (
          SELECT id
          FROM user_profiles
          WHERE user_id = auth.uid()
        )
    )
  );
CREATE POLICY "Users can delete own messages" ON messages FOR DELETE USING (
  conversation_id IN (
    SELECT id
    FROM conversations
    WHERE user_id IN (
        SELECT id
        FROM user_profiles
        WHERE user_id = auth.uid()
      )
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