# 管理员重新生成报告API使用指南

## 🎯 API端点
```
POST /api/admin/regenerate-reports
```

## 📋 请求参数

```typescript
interface RegenerateReportsRequest {
  reportType: string        // 报告类型：'astrology', 'personality', 'wealth', 'marriage', 'health'
  adminToken: string        // 管理员令牌
  singleUser?: boolean      // 是否为单个用户重新生成（默认false）
  userProfileId?: string    // 【推荐】特定用户资料的ID（精确控制）
  userPhone?: string        // 【备用】特定用户的手机号（可能影响多个用户）
}
```

## 🔧 使用场景

### 1. 为特定子用户重新生成报告（推荐）

```javascript
const response = await fetch('/api/admin/regenerate-reports', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    reportType: 'personality',
    adminToken: 'your_admin_token',
    singleUser: true,
    userProfileId: 'user-profile-uuid-here'  // 子用户的user_profiles.id
  })
})
```

**优势：**
- ✅ 精确控制，只为指定的用户资料生成报告
- ✅ 不会影响其他用户
- ✅ 支持主用户和子用户

### 2. 通过手机号重新生成（可能影响多个用户）

```javascript
const response = await fetch('/api/admin/regenerate-reports', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    reportType: 'personality',
    adminToken: 'your_admin_token',
    singleUser: true,
    userPhone: '13812345678'
  })
})
```

**注意：**
- ⚠️ 会为该手机号下的**所有用户资料**（主用户+所有子用户）重新生成报告
- ⚠️ 可能不是您想要的结果

### 3. 批量重新生成所有主用户报告

```javascript
const response = await fetch('/api/admin/regenerate-reports', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    reportType: 'personality',
    adminToken: 'your_admin_token',
    singleUser: false  // 或不传递singleUser参数
  })
})
```

**说明：**
- 只处理主用户（parent_id为null的用户资料）
- 不会重复处理子用户

## 🎯 最佳实践

### 管理员页面集成建议

1. **获取用户资料ID**：
   ```javascript
   // 在管理员页面显示用户列表时，保存每个用户的user_profiles.id
   const userProfile = {
     id: 'user-profile-uuid',
     name: '张三',
     isChild: profile.parent_id !== null,
     // ... 其他信息
   }
   ```

2. **重新生成报告按钮**：
   ```javascript
   const handleRegenerateReport = async (userProfileId, reportType) => {
     const response = await fetch('/api/admin/regenerate-reports', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         reportType,
         adminToken: getAdminToken(),
         singleUser: true,
         userProfileId  // 使用精确的ID
       })
     })
     
     const result = await response.json()
     if (result.success) {
       alert(`成功为用户重新生成${reportType}报告`)
     }
   }
   ```

## 📊 响应格式

```typescript
interface RegenerateReportsResponse {
  success: boolean
  count?: number        // 成功启动生成的用户数量
  message?: string      // 成功消息
  error?: string        // 错误消息
}
```

## ⚠️ 重要提示

1. **精确控制**：优先使用 `userProfileId` 参数，避免意外影响其他用户
2. **数据一致性**：API会先删除现有报告，再重新生成
3. **异步处理**：报告生成是异步的，API只负责启动生成任务
4. **权限验证**：确保 `adminToken` 有效

## 🐛 常见问题

**Q: 为什么子用户的报告写入了主用户的数据库？**
A: 请使用 `userProfileId` 参数而不是 `userPhone`，因为手机号会匹配到所有相关用户。

**Q: 如何获取用户的 user_profiles.id？**
A: 在管理员页面查询用户列表时，确保选择了 `user_profiles.id` 字段。

**Q: 批量模式会处理子用户吗？**
A: 不会，批量模式只处理主用户（parent_id为null的用户资料）。 