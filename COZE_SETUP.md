# Coze 智能体集成配置指南

## 🎯 概述

已成功集成 Coze 智能体 API！现在你的性格报告页面可以调用真实的 Coze 智能体进行对话。

## 🔧 配置步骤

### 1. 获取 Coze API 访问令牌

1. 访问 [Coze 开放平台](https://www.coze.cn/open/oauth/pats)
2. 登录你的账号
3. 点击"创建令牌"
4. 填写令牌名称，选择权限（需要勾选 Bot 相关权限）
5. 创建完成后**立即复制保存**（只显示一次）

### 2. 获取智能体 Bot ID

1. 进入你的智能体编辑页面
2. 在浏览器地址栏中找到 Bot ID
   ```
   https://www.coze.cn/space/xxxxx/bot/7123456789012345678
                                   ^^^^^^^^^^^^^^^^^^^
                                   这就是你的 Bot ID
   ```

### 3. 配置环境变量

在项目根目录创建 `.env.local` 文件：

```bash
# Coze API 配置
COZE_API_TOKEN=pat_xxxxxxxxxxxxxxxxxxxxxxxx
COZE_BOT_ID=7123456789012345678

# 现有的腾讯云SMS配置
TENCENT_SECRET_ID=your_secret_id
TENCENT_SECRET_KEY=your_secret_key
TENCENT_SMS_SDK_APP_ID=your_app_id
TENCENT_SMS_SIGN_NAME=your_sign_name
TENCENT_SMS_TEMPLATE_ID=your_template_id
```

### 4. 重启开发服务器

```bash
npm run dev
```

## 🎮 使用说明

### API 接口

新增了 `/api/coze/chat` 接口：

**请求格式：**
```json
{
  "message": "用户的问题",
  "userInfo": {
    "nickname": "用户昵称",
    "gender": "male",
    "year": 1990,
    "month": 1,
    "day": 1,
    "hour": 12,
    "minute": 30,
    "area": {
      "province": "北京市",
      "city": "北京市",
      "county": "朝阳区"
    }
  },
  "conversationId": "coze_conversation_id" // 可选，用于保持对话连续性
}
```

**响应格式：**
```json
{
  "success": true,
  "response": "AI智能体的回复内容",
  "conversationId": "coze_conversation_id",
  "chatId": "chat_id"
}
```

### 前端集成

性格报告页面 (`/personality`) 已自动集成：

1. ✅ 自动传递用户信息给智能体
2. ✅ 保持对话连续性
3. ✅ 错误处理和降级机制
4. ✅ 加载状态显示

## 🔍 智能体优化建议

为了获得最佳效果，建议在 Coze 平台中为你的智能体配置：

### 提示词示例

```
你是天乙神数的专业命理分析师，擅长根据用户的出生信息进行性格分析和命理咨询。

当用户提供以下信息时：
- 昵称、性别、出生日期时间、出生地区

请基于这些信息提供：
1. 个性化的性格分析
2. 命理学角度的见解
3. 实用的建议和指导
4. 温暖、专业的语气

回复要求：
- 语言亲切自然
- 内容专业可信
- 结合具体信息
- 控制在200字以内
```

### 知识库配置

可以上传相关的命理学资料、性格分析理论等作为知识库。

### 插件推荐

- 日期计算插件
- 农历转换插件
- 地理信息插件

## 🚨 注意事项

1. **API 配额**：Coze 有使用限制，请合理使用
2. **错误处理**：已实现降级机制，API 失败时会显示友好提示
3. **数据隐私**：用户信息会传递给 Coze，请确保合规
4. **对话记录**：对话历史保存在 localStorage，考虑迁移到数据库

## 🎉 下一步

1. 测试智能体响应质量
2. 根据用户反馈优化提示词
3. 考虑添加更多智能体功能
4. 集成到其他报告页面

---

配置完成后，你的用户就可以与真实的 Coze 智能体进行专业的命理咨询对话了！ 