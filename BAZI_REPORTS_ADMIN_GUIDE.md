# 八字报告管理指南

## 🎯 概述

八字报告系统使用 `bazi_reports` 表存储用户的八字排盘数据。本指南说明如何为用户生成和管理八字报告。

## 📊 数据库表结构

```sql
-- 八字报告表
CREATE TABLE bazi_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,                    -- 关联 user_profiles.id
  raw_payload JSONB NOT NULL,               -- 八字API的原始返回数据
  generated_at TIMESTAMP DEFAULT NOW(),     -- 生成时间
  user_data_hash VARCHAR(100),              -- 用户数据哈希（防重复）
  api_request_id VARCHAR(200),              -- API请求ID
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  astrology_context TEXT,                   -- 格式化的八字上下文
  CONSTRAINT bazi_reports_user_id_key UNIQUE (user_id),
  CONSTRAINT bazi_reports_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES user_profiles (id) ON DELETE CASCADE
);
```

## 🔧 生成八字报告

### 方法1: 使用批量生成脚本（推荐）

```bash
# 为所有主用户生成八字报告
node scripts/generate-bazi-reports-for-all.js

# 为特定用户资料生成（推荐 - 精确控制）
node scripts/generate-bazi-reports-for-all.js --userProfileId=uuid-here

# 为特定手机号的所有用户生成
node scripts/generate-bazi-reports-for-all.js --userPhone=13812345678

# 查看帮助信息
node scripts/generate-bazi-reports-for-all.js --help
```

### 方法2: 使用管理员API

```javascript
// 为特定用户生成八字报告
const response = await fetch('/api/admin/regenerate-reports', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    reportType: 'astrology',              // 八字报告类型
    adminToken: 'your_admin_token',
    singleUser: true,
    userProfileId: 'user-profile-uuid'    // 推荐使用，精确控制
  })
})
```

### 方法3: 直接调用八字生成API

```javascript
const response = await fetch('/api/bazi/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userInfo: {
      name: '张三',
      gender: 'male',
      year: 1990,
      month: 5,
      day: 15,
      hour: 14,
      minute: 30,
      area: {
        province: '北京市',
        city: '北京市',
        district: '朝阳区'
      }
    },
    userId: 'user-profile-uuid',
    isUserProfileId: true
  })
})
```

## 📋 查看八字报告

### 使用获取API

```javascript
const response = await fetch('/api/bazi/get', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-profile-uuid',
    isUserProfileId: true
  })
})
```

### 直接查询数据库

```sql
-- 查看所有八字报告
SELECT 
  br.id,
  br.user_id,
  up.name,
  up.phone_number,
  br.generated_at,
  br.created_at
FROM bazi_reports br
JOIN user_profiles up ON br.user_id = up.id
ORDER BY br.created_at DESC;

-- 查看特定用户的八字报告
SELECT * FROM bazi_reports 
WHERE user_id = 'user-profile-uuid';

-- 统计八字报告数量
SELECT COUNT(*) as total_reports FROM bazi_reports;
```

## 🚨 故障排查

### 常见问题

1. **错误: relation "astrology_reports" does not exist**
   - ✅ 已修复：代码中的表名映射已更正为 `bazi_reports`

2. **API调用失败**
   - 检查 `ALIYUN_APPCODE` 环境变量是否正确配置
   - 查看控制台日志了解详细错误信息

3. **重复生成**
   - 系统会自动检查现有报告，避免重复生成
   - 如需强制重新生成，先删除现有记录

### 日志监控

启动开发服务器时，关注以下日志：

```bash
# 八字报告生成成功
✅ 八字报告保存成功: uuid-here

# 八字报告已存在
✅ 八字报告已存在，返回现有报告

# API配置检查
🔑 API配置检查: { hasApiAddress: true, hasAppCode: true }

# 使用模拟数据（需要配置API）
⚠️ ALIYUN_APPCODE未配置，使用模拟数据
```

## 🔐 环境变量配置

在 `.env.local` 文件中配置：

```bash
# 阿里云八字排盘API
ALIYUN_APPCODE=your_app_code_here

# 管理员令牌
ADMIN_TOKEN=your_admin_token

# 基础URL（生产环境需要）
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

## 📊 数据流程

1. **用户创建** → 自动调用 `/api/bazi/generate` 
2. **八字生成** → 调用阿里云API获取原始数据
3. **数据处理** → 生成格式化的八字上下文
4. **数据存储** → 保存到 `bazi_reports` 表
5. **前端显示** → 通过 `/api/bazi/get` 获取数据

## 💡 最佳实践

1. **精确控制**: 使用 `userProfileId` 参数，避免影响其他用户
2. **批量处理**: 使用提供的脚本进行批量生成
3. **监控日志**: 关注控制台输出，及时发现问题
4. **数据备份**: 定期备份 `bazi_reports` 表数据
5. **性能优化**: 八字上下文已预格式化，避免重复计算

## 🔗 相关文件

- `src/app/api/bazi/generate/route.ts` - 八字生成API
- `src/app/api/bazi/get/route.ts` - 八字获取API  
- `src/app/api/admin/regenerate-reports/route.ts` - 管理员批量生成API
- `scripts/generate-bazi-reports-for-all.js` - 批量生成脚本
- `supabase/migrations/001_initial_schema.sql` - 数据库表结构 