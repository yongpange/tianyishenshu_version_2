# 八字上下文字段优化方案

## 优化目标

根据用户需求，将八字上下文字段统一存储在 `bazi_reports` 表中，所有报告生成和对话都直接从此表获取格式化的八字上下文，实现：

1. **统一数据源**：所有八字相关信息统一存储在 `bazi_reports` 表
2. **预格式化存储**：格式化的八字上下文只生成一次，避免重复计算
3. **性能优化**：直接从数据库获取格式化数据，无需重复处理
4. **数据一致性**：确保所有功能使用相同的八字上下文

## 实施方案

### 1. 数据库结构调整

**执行脚本**: `scripts/add-bazi-context-field.sql`

```sql
-- 为 bazi_reports 表添加格式化的八字上下文字段
ALTER TABLE bazi_reports 
ADD COLUMN IF NOT EXISTS astrology_context TEXT;

-- 添加字段注释和索引
COMMENT ON COLUMN bazi_reports.astrology_context IS '格式化后的八字排盘上下文信息，用于所有报告生成和对话';
CREATE INDEX IF NOT EXISTS idx_bazi_reports_astrology_context 
ON bazi_reports USING gin(to_tsvector('chinese', astrology_context));
```

### 2. 八字生成流程优化

**修改文件**: `src/app/api/bazi/generate/route.ts`

**优化内容**:
- 在调用外部八字API获取原始数据后，立即生成格式化的八字上下文
- 将原始数据和格式化上下文一起存储到 `bazi_reports` 表

**新流程**:
```
外部八字API → 原始数据 + 格式化上下文 → 同时存储到 bazi_reports 表
```

### 3. 八字获取API增强

**修改文件**: `src/app/api/bazi/get/route.ts`

**新增功能**:
- API响应中新增 `astrologyContext` 字段
- 返回预格式化的八字上下文，避免重复格式化

### 4. 上下文获取逻辑重构

**修改文件**: `src/utils/personality-report.ts`

**优化内容**:
- `getAstrologyContext()` 函数优先从数据库获取格式化的上下文
- 只有在格式化上下文不存在时才进行格式化处理
- 导出 `formatAstrologyPrompt()` 函数供其他模块使用

**新逻辑流程**:
```
1. 检查 bazi_reports.astrology_context 字段
2. 如果存在格式化上下文 → 直接返回
3. 如果只有原始数据 → 格式化后返回
4. 如果都没有 → 调用外部API
```

### 5. 现有数据更新

**执行脚本**: `scripts/update-existing-bazi-context.js`

为现有的 `bazi_reports` 记录生成格式化的八字上下文：

```bash
# 执行更新脚本
node scripts/update-existing-bazi-context.js
```

## 数据流程对比

### 优化前的流程:
```
用户注册 → 八字API → 存储原始数据到 bazi_reports
↓
报告生成 → 重新获取原始数据 → 重新格式化 → 生成报告
↓  
对话交互 → 重新获取原始数据 → 重新格式化 → AI对话
```

### 优化后的流程:
```
用户注册 → 八字API → 格式化上下文 → 存储原始数据+格式化上下文到 bazi_reports
↓
报告生成 → 直接获取格式化上下文 → 生成报告
↓
对话交互 → 直接获取格式化上下文 → AI对话
```

## 性能提升

1. **计算开销减少**: 格式化八字上下文只需计算一次
2. **数据库查询优化**: 所有功能统一从 `bazi_reports` 表获取数据
3. **响应速度提升**: 直接使用预格式化数据，无需重复处理
4. **一致性保证**: 所有功能使用相同的八字上下文数据

## 实施步骤

### 第一步：执行数据库迁移
```sql
-- 在 Supabase Dashboard 中执行
scripts/add-bazi-context-field.sql
```

### 第二步：更新现有数据
```bash
# 为现有记录生成格式化上下文
node scripts/update-existing-bazi-context.js
```

### 第三步：验证功能
1. 测试新用户注册时八字数据生成
2. 验证报告生成时使用预格式化上下文
3. 检查对话功能中的八字上下文

## 监控和验证

### 日志信息
在控制台可以看到详细的执行日志：
- `🔮 优先从数据库获取格式化八字上下文`
- `✅ 从数据库获取格式化八字上下文成功，长度: xxx`
- `⚠️ 数据库中有原始数据但无格式化上下文，进行格式化`

### 数据验证
```sql
-- 检查 bazi_reports 表中格式化上下文的完整性
SELECT 
  id,
  user_id,
  CASE 
    WHEN astrology_context IS NOT NULL THEN '已格式化'
    WHEN raw_payload IS NOT NULL THEN '仅原始数据'
    ELSE '无数据'
  END as status,
  LENGTH(astrology_context) as context_length
FROM bazi_reports 
ORDER BY created_at DESC 
LIMIT 10;
```

## 兼容性保证

1. **向后兼容**: 现有API调用方式完全兼容
2. **渐进式优化**: 新数据自动使用优化流程，旧数据通过脚本更新
3. **错误处理**: 各种异常情况下都有相应的回退机制

## 维护建议

1. **定期检查**: 定期验证 `astrology_context` 字段的完整性
2. **性能监控**: 关注数据库查询性能和响应时间
3. **数据一致性**: 确保所有新生成的记录都包含格式化上下文

## 技术细节

### 数据结构
```sql
-- bazi_reports 表结构（新增字段）
CREATE TABLE bazi_reports (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  raw_payload JSONB NOT NULL,          -- 原始八字API数据
  astrology_context TEXT,              -- 格式化的八字上下文 (新增)
  generated_at TIMESTAMP DEFAULT NOW(),
  user_data_hash VARCHAR(100),
  api_request_id VARCHAR(200),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### API响应格式
```json
{
  "success": true,
  "message": "成功获取八字报告",
  "report": { /* 原始八字数据 */ },
  "astrologyContext": "格式化的八字上下文文本",
  "generatedAt": "2024-01-01T00:00:00Z",
  "userDataHash": "hash_value"
}
```

这次优化实现了八字上下文的统一管理和预格式化存储，大幅提升了系统性能和数据一致性。 