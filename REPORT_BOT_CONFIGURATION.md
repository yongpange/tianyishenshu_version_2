# 报告生成Bot ID配置指南

## 概述

系统已重构为使用通用报告生成引擎，支持为每种报告类型配置独立的Bot ID，从而实现更精准的专业化服务。

## 📋 支持的报告类型

| 报告类型 | 环境变量名称 | 描述 | 后备变量 |
|---------|-------------|------|---------|
| 性格报告 | `PERSONALITY_BOT_ID` | 专门用于性格分析的智能体 | `BOT_ID` |
| 事业财富报告 | `WEALTH_BOT_ID` | 专门用于财富分析的智能体 | `BOT_ID` |
| 婚恋感情报告 | `MARRIAGE_BOT_ID` | 专门用于感情分析的智能体 | `BOT_ID` |
| 身体健康报告 | `HEALTH_BOT_ID` | 专门用于健康分析的智能体 | `BOT_ID` |

## 🔧 环境变量配置

### 方式1：使用专门的Bot ID（推荐）
```bash
# 性格报告专用Bot
PERSONALITY_BOT_ID=7123456789012345678

# 事业财富报告专用Bot  
WEALTH_BOT_ID=7123456789012345679

# 婚恋感情报告专用Bot
MARRIAGE_BOT_ID=7123456789012345680

# 身体健康报告专用Bot
HEALTH_BOT_ID=7123456789012345681

# 通用后备Bot ID
BOT_ID=7123456789012345678
```

### 方式2：使用统一Bot ID
```bash
# 所有报告使用同一个Bot
BOT_ID=7123456789012345678
```

## 🎯 配置优先级

每个报告的Bot ID选择优先级如下：

1. **专用Bot ID**：`PERSONALITY_BOT_ID`、`WEALTH_BOT_ID` 等
2. **通用Bot ID**：`BOT_ID` 
3. **空值处理**：如果都未配置，将返回配置错误

## 🚀 重构优势

### 统一认证机制
- ✅ 所有报告使用相同的多层降级认证策略
- ✅ 支持JWT OAuth + PAT Token双重认证
- ✅ 自动token刷新和重试机制
- ✅ 与聊天API完全一致的认证逻辑

### 代码复用
- ✅ 通用报告生成引擎（`src/lib/report-generator.ts`）
- ✅ 统一的错误处理和日志记录
- ✅ 一致的Fallback机制
- ✅ 减少代码重复，提高维护性

### 灵活配置
- ✅ 每种报告可使用专用Bot，提供更精准的分析
- ✅ 支持后备Bot配置，确保服务可用性
- ✅ 可独立调整每种报告的Prompt模板
- ✅ 支持独立的Fallback内容生成

## 📝 使用示例

### 配置不同的Bot ID
```bash
# .env.local
PERSONALITY_BOT_ID=7111111111111111111  # 性格分析专家
WEALTH_BOT_ID=7222222222222222222      # 财富分析专家  
MARRIAGE_BOT_ID=7333333333333333333    # 感情分析专家
HEALTH_BOT_ID=7444444444444444444      # 健康分析专家
BOT_ID=7000000000000000000             # 通用后备Bot
```

### API调用保持不变
```javascript
// 性格报告API调用（不需要修改）
const response = await fetch('/api/personality-report/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userInfo: userData,
    userId: userId,
    isUserProfileId: true
  })
})
```

## 🔍 技术架构

### 通用报告生成引擎
```typescript
// src/lib/report-generator.ts
export async function generateReport(
  request: UniversalReportRequest,
  config: ReportConfig
): Promise<NextResponse<UniversalReportResponse>>
```

### 报告配置接口
```typescript
interface ReportConfig {
  reportType: string
  reportName: string
  botId: string                    // 使用的Bot ID
  tableName: string               // 数据库表名
  formatPrompt: Function          // Prompt生成函数
  createReport: Function          // 报告创建函数
  saveReport: Function            // 报告保存函数
  includeAstrology?: boolean      // 是否包含八字信息
  fallbackContent?: Function      // Fallback内容生成
}
```

## 🎨 自定义Prompt

每种报告都有专门的Prompt生成函数，可以独立调整：

### 性格报告Prompt
```typescript
function formatPersonalityPrompt(userInfo: UserInfo, astrologyContext?: string): string {
  // 专注于性格特征、情感表达、处事风格等
}
```

### 财富报告Prompt  
```typescript
function formatWealthPrompt(userInfo: UserInfo, astrologyContext?: string): string {
  // 专注于事业发展、财富累积、投资理财等
}
```

### 感情报告Prompt
```typescript
function formatMarriagePrompt(userInfo: UserInfo, astrologyContext?: string): string {
  // 专注于感情模式、伴侣特质、婚姻运势等
}
```

### 健康报告Prompt
```typescript
function formatHealthPrompt(userInfo: UserInfo, astrologyContext?: string): string {
  // 专注于体质特点、健康趋势、养生建议等
}
```

## 🛠️ 故障排查

### 常见问题

1. **Bot ID未配置**
   ```
   错误：Bot ID配置缺失
   解决：检查相应的环境变量是否正确设置
   ```

2. **认证失败**
   ```
   错误：authentication is invalid (4100)
   解决：系统会自动降级使用不同的认证方式
   ```

3. **报告生成失败**
   ```
   错误：智能体响应失败
   解决：检查Bot ID是否有效，智能体是否正常工作
   ```

### 调试命令
```bash
# 检查环境变量配置
echo "PERSONALITY_BOT_ID: $PERSONALITY_BOT_ID"
echo "WEALTH_BOT_ID: $WEALTH_BOT_ID"
echo "MARRIAGE_BOT_ID: $MARRIAGE_BOT_ID"
echo "HEALTH_BOT_ID: $HEALTH_BOT_ID"
echo "BOT_ID: $BOT_ID"
```

## 📈 性能优化

- ✅ **Token缓存**：优先使用数据库中的有效token
- ✅ **智能重试**：token过期时自动刷新并重试
- ✅ **并行处理**：admin批量生成时支持并发控制
- ✅ **错误恢复**：多层降级确保服务可用性

## 🔄 迁移指南

从旧版本迁移到新架构：

1. **无需修改前端代码**：API接口保持完全兼容
2. **配置Bot ID**：根据需要设置专用或通用Bot ID
3. **验证功能**：测试各种报告的生成功能
4. **监控日志**：观察认证方式和性能表现

## 📞 联系支持

如果遇到配置问题或需要技术支持，请查看控制台日志获取详细的错误信息和调试信息。 