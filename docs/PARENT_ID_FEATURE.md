# Parent ID 功能说明

## 概述

`parent_id` 功能允许在 `user_profiles` 表中建立用户资料之间的层级关系。当新增用户时，系统会自动查找该手机号对应的 `user_id` 在 `user_profiles` 表中 `parent_id` 为空的记录，并将其 `id` 设置为新用户的 `parent_id`。

## 数据库结构

### user_profiles 表新增字段

```sql
ALTER TABLE user_profiles
ADD COLUMN parent_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL;
```

### 约束和索引

1. **防止自引用约束**：
   ```sql
   ALTER TABLE user_profiles
   ADD CONSTRAINT chk_parent_not_self CHECK (
     (parent_id IS NULL) OR (parent_id <> id)
   );
   ```

2. **唯一索引**：确保每个用户只有一个顶级资料
   ```sql
   CREATE UNIQUE INDEX uniq_user_profiles_primary ON user_profiles(user_id) 
   WHERE parent_id IS NULL;
   ```

3. **性能索引**：
   ```sql
   CREATE INDEX idx_user_profiles_parent_id ON user_profiles(parent_id);
   ```

## 功能逻辑

### 新增用户时的处理流程

1. **查找父级资料**：
   - 根据手机号找到对应的 `user_id`
   - 在 `user_profiles` 表中查找该 `user_id` 且 `parent_id` 为空的记录
   - 如果找到，将其 `id` 作为新用户的 `parent_id`
   - 如果未找到，新用户将成为顶级用户（`parent_id` 为 `null`）

2. **创建新用户资料**：
   - 设置 `parent_id` 为找到的父级资料 ID
   - 保存用户资料到数据库

### 代码实现

在 `src/lib/user-manager.ts` 的 `saveUserProfileToUser` 函数中：

```typescript
// 查找该手机号对应的 user_id 在 user_profiles 表中 parent_id 为空的记录
let parentId: string | null = null
try {
  const { data: parentProfile, error: parentError } = await supabaseAdmin
    .from('user_profiles')
    .select('id')
    .eq('user_id', userId)
    .is('parent_id', null)
    .order('created_at', { ascending: true }) // 获取最早创建的记录作为父级
    .limit(1)
    .single()

  if (!parentError && parentProfile) {
    parentId = parentProfile.id
    console.log('✅ 找到父级用户资料:', parentId)
  } else if (parentError && parentError.code === 'PGRST116') {
    console.log('ℹ️ 未找到父级用户资料，将创建顶级用户资料')
  }
} catch (error) {
  console.error('查找父级用户资料异常:', error)
}

// 创建用户资料时设置 parent_id
const profileData = {
  // ... 其他字段
  parent_id: parentId
}
```

## 使用场景

### 场景 1：家庭用户管理
- 主账号创建后，可以添加家庭成员
- 每个家庭成员都关联到主账号的顶级资料

### 场景 2：多角色用户
- 一个用户可以创建多个资料（不同角色）
- 所有子资料都关联到第一个创建的顶级资料

### 场景 3：组织架构
- 管理员可以创建下级用户
- 形成清晰的层级关系

## 查询示例

### 获取用户的所有资料
```sql
SELECT * FROM user_profiles 
WHERE user_id = 'user-uuid' 
ORDER BY created_at;
```

### 获取顶级资料
```sql
SELECT * FROM user_profiles 
WHERE user_id = 'user-uuid' 
AND parent_id IS NULL;
```

### 获取子级资料
```sql
SELECT * FROM user_profiles 
WHERE parent_id = 'parent-profile-id';
```

### 获取完整的层级结构
```sql
WITH RECURSIVE profile_tree AS (
  -- 顶级资料
  SELECT id, name, parent_id, 1 as level
  FROM user_profiles 
  WHERE user_id = 'user-uuid' AND parent_id IS NULL
  
  UNION ALL
  
  -- 子级资料
  SELECT up.id, up.name, up.parent_id, pt.level + 1
  FROM user_profiles up
  JOIN profile_tree pt ON up.parent_id = pt.id
)
SELECT * FROM profile_tree ORDER BY level, created_at;
```

## 测试

运行测试脚本验证功能：

```bash
node scripts/test-parent-id-logic.js
```

## 注意事项

1. **数据一致性**：确保每个用户只有一个顶级资料（`parent_id` 为 `null`）
2. **循环引用**：约束防止自己引用自己
3. **级联删除**：当父级资料被删除时，子级资料的 `parent_id` 会被设置为 `null`
4. **性能考虑**：已创建索引以提高查询性能

## 迁移

如果需要在现有数据库中添加此功能，请执行：

```sql
-- 执行 supabase/migrations/005_add_parent_id_to_user_profiles.sql
```

这将安全地添加 `parent_id` 字段和相关约束，不会影响现有数据。 