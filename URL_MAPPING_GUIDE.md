# URL映射配置指南

## 公司介绍页面URL映射设置

### 当前配置
- **本地开发环境**: `http://localhost:3000/about/company-intro`
- **生产环境**: `https://www.tyfate.com/aboutus.html`

### 配置位置

1. **Next.js重写规则** - `next.config.js`
   ```javascript
   async rewrites() {
     return [
       {
         source: '/aboutus.html',
         destination: '/about/company-intro',
       },
     ]
   }
   ```

2. **Nginx配置** - `nginx/nginx.conf`
   - 已更新server_name支持 `www.tyfate.com` 和 `tyfate.com`
   - 已更新HTTPS配置中的server_name

### 如何手动添加新的URL映射

#### 方法1：使用Next.js重写（推荐）
1. 打开 `next.config.js`
2. 在 `rewrites()` 函数中添加新的映射：
   ```javascript
   async rewrites() {
     return [
       {
         source: '/aboutus.html',           // 生产环境URL
         destination: '/about/company-intro', // 本地开发路径
       },
       {
         source: '/new-page.html',
         destination: '/folder/new-page',
       },
     ]
   }
   ```

#### 方法2：使用Nginx重写规则
在nginx配置中添加：
```nginx
location /aboutus.html {
    rewrite ^/aboutus.html$ /about/company-intro permanent;
}
```

### 部署步骤

1. **本地测试**:
   ```bash
   npm run dev
   # 访问 http://localhost:3000/aboutus.html 应该重定向到公司介绍页面
   ```

2. **生产部署**:
   ```bash
   # 构建项目
   npm run build
   
   # 使用Docker部署
   docker-compose up -d
   ```

### 验证方法

1. **本地验证**:
   - 访问 `http://localhost:3000/aboutus.html`
   - 应该显示公司介绍页面内容

2. **生产验证**:
   - 访问 `https://www.tyfate.com/aboutus.html`
   - 应该显示公司介绍页面内容

### 常见问题

- **404错误**: 检查Next.js重写规则是否正确配置
- **重定向循环**: 检查Nginx配置是否有冲突的规则
- **缓存问题**: 清除浏览器缓存或尝试无痕模式

### 下次手动设置步骤

1. 复制现有的重写规则格式
2. 修改 `source` 为新的生产环境URL
3. 修改 `destination` 为对应的本地页面路径
4. 重启服务使配置生效