# Mermaid图表查看指南

## 图表1：标准ER图（表结构和字段关系）

使用以下Mermaid语法渲染：

```mermaid
erDiagram
    users {
        uuid id PK
        varchar phone_number UK
        timestamp created_at
        timestamp updated_at
        varchar invite_code_used
        text permissions
        boolean is_profile_completed
        timestamp last_login
    }

    user_profiles {
        uuid id PK
        uuid user_id FK
        varchar name
        varchar gender
        integer year
        integer month
        integer day
        integer hour
        integer minute
        varchar area_province
        varchar area_city
        varchar area_district
        varchar phone_number
        timestamp created_at
        timestamp updated_at
    }

    personality_reports {
        uuid id PK
        uuid user_id FK
        text content
        timestamp generated_at
        varchar user_data_hash
        varchar coze_conversation_id
        varchar task_id
        varchar status
        integer progress
        text error_message
        timestamp created_at
        timestamp updated_at
    }

    conversations {
        uuid id PK
        uuid user_id FK
        varchar title
        jsonb messages
        varchar coze_conversation_id
        timestamp created_at
        timestamp updated_at
    }

    invite_codes {
        uuid id PK
        varchar code UK
        varchar status
        text remarks
        uuid used_by FK
        timestamp used_at
        timestamp created_at
        timestamp updated_at
    }

    wealth_reports {
        text id PK
        uuid user_id FK
        text content
        timestamp generated_at
        text user_data_hash
        text coze_conversation_id
        text task_id
        text status
        integer progress
        text error_message
        timestamp created_at
        timestamp updated_at
    }

    marriage_reports {
        text id PK
        uuid user_id FK
        text content
        timestamp generated_at
        text user_data_hash
        text coze_conversation_id
        text task_id
        text status
        integer progress
        text error_message
        timestamp created_at
        timestamp updated_at
    }

    health_reports {
        text id PK
        uuid user_id FK
        text content
        timestamp generated_at
        text user_data_hash
        text coze_conversation_id
        text task_id
        text status
        integer progress
        text error_message
        timestamp created_at
        timestamp updated_at
    }

    %% 关系定义
    users ||--o{ user_profiles : "1对1"
    users ||--o{ personality_reports : "1对多"
    users ||--o{ conversations : "1对多"
    users ||--o{ invite_codes : "1对多(作为使用方)"
    user_profiles ||--o{ wealth_reports : "1对多"
    user_profiles ||--o{ marriage_reports : "1对多"
    user_profiles ||--o{ health_reports : "1对多"
```

## 图表2：流程关系图（业务逻辑数据流向）

使用以下Mermaid语法渲染：

```mermaid
graph TD
    A[users<br/>用户表] --> B[user_profiles<br/>用户资料]
    A --> C[personality_reports<br/>性格报告]
    A --> D[conversations<br/>对话表]
    A --> E[invite_codes<br/>邀请码]
    
    B --> F[wealth_reports<br/>财富报告]
    B --> G[marriage_reports<br/>婚恋报告]
    B --> H[health_reports<br/>健康报告]
    
    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style C fill:#e8f5e8
    style D fill:#fff3e0
    style E fill:#fce4ec
    style F fill:#e0f2f1
    style G fill:#f1f8e9
    style H fill:#fff8e1
```

## 推荐查看方式：

### 1. 在线Mermaid渲染器
- 访问 [Mermaid Live Editor](https://mermaid.live/)
- 复制上述mermaid代码片段到编辑器中即可查看

### 2. 支持Mermaid的Markdown编辑器
- **VSCode**: 安装 "Mermaid Preview" 插件
- **Typora**: 直接打开.md文件即可预览
- **Notion**: 支持Mermaid代码块

### 3. 浏览器插件
- 安装 "Mermaid Diagram" 相关浏览器插件
- 直接在浏览器中预览.md文件

### 4. 命令行工具
```bash
# 安装mermaid-cli
npm install -g @mermaid-js/mermaid-cli

# 渲染图表
mmdc -i input.md -o output.png
```

## 图表说明：

**图表1 (ER图)**：展示了数据库的标准化结构，包括：
- 每个表的字段定义
- 主键和外键关系
- 数据类型和约束

**图表2 (流程图)**：展示了业务数据的流向，包括：
- 数据表之间的层级关系
- 业务逻辑的数据流向
- 不同颜色代表不同类型的表

选择其中任何一种方式都可以清晰地看到您的数据库关系可视化图表！