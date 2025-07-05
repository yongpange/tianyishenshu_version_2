# 阿里云API配置说明

## 环境变量配置

为了使用阿里云的八字排盘API，您需要配置以下环境变量：

### 1. 创建环境变量文件

在项目根目录创建 `.env.local` 文件：

```bash
# 阿里云百炼API配置
ALIYUN_APPCODE=your_app_code_here
```

### 2. 获取AppCode

1. 登录阿里云控制台
2. 进入API网关服务
3. 在"已购买的API"中找到"集速八字排盘API"
4. 点击查看AppCode
5. 将AppCode复制到 `.env.local` 文件中

### 3. API接口信息

- **调用地址**: https://jisubazi.market.alicloudapi.com/bazi/paipan
- **请求方式**: GET (不是ANY)
- **认证方式**: APPCODE

### 4. 请求参数

| 参数名称 | 是否必填 | 参数说明 |
|---------|---------|---------|
| name | 是 | 姓名 |
| sex | 是 | 性别 (1男 0女) |
| year | 是 | 年份 |
| month | 是 | 月份 |
| day | 是 | 日期 |
| hour | 是 | 小时 |
| minute | 是 | 分钟 |
| city | 是 | 城市 |
| islunar | 是 | 是否是阴历 (默认0阳历) |
| istaiyang | 是 | 是否使用太阳时 (默认0不使用) |

### 5. 地区编码转换

我们的系统会自动将地区编码转换为实际的城市名称：

- **输入**: `"11 1101 110105"` (地区编码)
- **转换**: `"北京市 北京市 东城区"` (实际名称)

### 6. 问题解决

#### 问题1：HTTP 405 错误
- **错误**: `Unsupported Method 'ANY'`
- **解决**: 使用 `GET` 方法而不是 `ANY`

#### 问题2：HTTP 400 错误
- **错误**: `Bad Request`
- **原因**: 使用了占位符参数 (如 "请输入城市")
- **解决**: 使用实际的参数值

#### 问题3：地区编码问题
- **错误**: 城市参数是编码形式
- **解决**: 我们的系统会自动转换编码为实际地名

### 7. 测试配置

#### 正确的curl命令示例：
```bash
curl -i -k -X GET \
  'https://jisubazi.market.alicloudapi.com/bazi/paipan?city=北京市&day=18&hour=2&islunar=0&istaiyang=0&minute=5&month=10&name=张三&sex=1&year=2009' \
  -H 'Authorization: APPCODE your_real_appcode_here'
```

#### 使用测试脚本：
```bash
# 启动开发服务器
npm run dev

# 在另一个终端运行测试
node test-astrology-api.js
```

### 8. 调试日志

我们的系统会输出详细的调试日志：
- 地区编码转换结果
- 构建的查询参数
- API请求URL
- API响应状态和内容

### 9. 注意事项

- 如果没有配置正确的AppCode，系统将使用模拟数据
- 请确保您的阿里云账户有足够的API调用次数
- 系统会自动处理中文城市名称的URL编码
- 如果API调用失败，系统会降级到模拟数据，确保功能正常

### 10. 错误排查

如果遇到问题，请检查：
1. AppCode是否正确配置
2. 网络连接是否正常
3. 阿里云API是否有调用限制
4. 查看控制台日志了解详细错误信息 