# 八字报告数据流程文档

## 概述

本文档描述了天乙神算系统中八字报告的完整数据流程，包括自动生成、数据存储、获取和聊天次数管理。

## 核心流程

### 1. 新用户创建时自动生成八字报告

当新用户被创建时，系统会自动调用八字API并将结果保存到数据库。

#### 流程步骤：
1. 用户通过 `/api/user-profile/save` 创建用户资料
2. 用户资料保存成功后，自动调用 `/api/bazi/generate`
3. 八字API调用外部服务获取八字数据
4. 八字数据保存到 `bazi_reports` 表

#### 相关文件：
- `src/app/api/user-profile/save/route.ts` - 用户保存API，包含八字生成调用
- `src/app/api/bazi/generate/route.ts` - 八字生成API

### 2. 八字数据存储结构

八字数据存储在 `bazi_reports` 表中：

```sql
CREATE TABLE bazi_reports (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,                    -- 关联 user_profiles.id
  raw_payload JSONB NOT NULL,               -- 八字API的原始返回数据
  generated_at TIMESTAMP DEFAULT NOW(),     -- 生成时间
  user_data_hash VARCHAR(100),              -- 用户数据哈希（防重复）
  api_request_id VARCHAR(200),              -- API请求ID
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3. 八字数据获取

用户登录或切换用户时，系统从数据库获取已存储的八字数据：

#### 流程步骤：
1. 前端调用 `/api/bazi/get`
2. API根据用户ID查询 `bazi_reports` 表
3. 返回存储的八字数据
4. 如果没有数据，自动调用生成API

#### 相关文件：
- `src/app/api/bazi/get/route.ts` - 八字获取API
- `src/app/astrology/page.tsx` - 八字页面，修改为从数据库获取数据

### 4. 聊天次数管理

每次用户与AI聊天时，系统会自动更新用户的聊天次数：

#### 流程步骤：
1. 用户发送聊天消息到 `/api/coze/chat`
2. 系统检查用户剩余聊天次数
3. 如果次数不足，返回错误
4. 如果次数充足，调用Coze API
5. 聊天成功后，扣减聊天次数并更新数据库

#### 相关字段：
```sql
-- user_profiles 表中的聊天次数字段
chat_total_count INTEGER DEFAULT 10,       -- 总聊天次数
chat_used_count INTEGER DEFAULT 0,         -- 已使用次数
chat_remaining_count INTEGER DEFAULT 10    -- 剩余次数
```

#### 相关文件：
- `src/app/api/coze/chat/route.ts` - 聊天API，包含次数管理

## API 接口说明

### 1. 八字生成 API

**接口**: `POST /api/bazi/generate`

**请求参数**:
```json
{
  "userInfo": {
    "name": "用户姓名",
    "gender": "male|female",
    "year": 1990,
    "month": 5,
    "day": 15,
    "hour": 14,
    "minute": 30,
    "area": {
      "province": "北京市",
      "city": "北京市", 
      "district": "朝阳区"
    }
  },
  "userId": "user_profile_id",
  "isUserProfileId": true
}
```

**返回结果**:
```json
{
  "success": true,
  "message": "八字报告生成成功",
  "report": {
    "id": "report_id",
    "raw_payload": { /* 八字数据 */ }
  },
  "isExisting": false
}
```

### 2. 八字获取 API

**接口**: `POST /api/bazi/get`

**请求参数**:
```json
{
  "userId": "user_id",
  "isUserProfileId": true
}
```

**返回结果**:
```json
{
  "success": true,
  "message": "成功获取八字报告",
  "report": { /* 八字数据 */ },
  "generatedAt": "2024-01-01T00:00:00Z",
  "userDataHash": "hash_value"
}
```

### 3. 聊天 API（含次数管理）

**接口**: `POST /api/coze/chat`

**请求参数**:
```json
{
  "message": "聊天内容",
  "userInfo": { /* 用户信息 */ },
  "conversationId": "conversation_id",
  "userId": "user_profile_id"
}
```

**返回结果**:
```json
{
  "success": true,
  "response": "AI回复内容",
  "conversationId": "conversation_id",
  "remainingCount": 9,  // 剩余聊天次数
  "chatId": "chat_id"
}
```

## 数据库安全策略

系统使用Supabase的行级安全策略(RLS)来保护数据：

1. **bazi_reports 表**：用户只能访问自己的八字报告
2. **user_profiles 表**：用户只能访问自己的资料
3. **service_role**：API使用service_role权限进行数据操作

## 测试

使用测试脚本验证完整流程：

```bash
node scripts/test-bazi-flow.js
```

测试内容包括：
1. 用户创建和八字报告自动生成
2. 从数据库获取八字数据
3. 聊天次数更新机制

## 环境变量配置

需要配置以下环境变量：

```env
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 外部八字API
NEXT_PUBLIC_ASTROLOGY_API_URL=your_astrology_api_url

# 应用URL
NEXTAUTH_URL=http://localhost:3000
```

## 注意事项

1. **性能优化**：八字数据通过哈希值避免重复生成
2. **错误处理**：八字生成失败不影响用户创建流程
3. **安全性**：所有数据操作都经过RLS策略验证
4. **扩展性**：支持不同用户类型（手机号用户 vs UUID用户）的聊天次数管理

## 相关文档

- [用户管理文档](./USER_MANAGEMENT.md)
- [聊天功能文档](./CHAT_FEATURES.md)
- [数据库结构文档](./DATABASE_SCHEMA.md) 