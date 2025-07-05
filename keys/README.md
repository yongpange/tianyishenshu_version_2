# Coze 私钥文件目录

这个目录用于存放 Coze OAuth JWT 认证所需的私钥文件。

## 使用说明

1. 从 Coze 开放平台下载您的私钥文件
2. 将私钥文件保存到此目录下，例如：`coze_private_key.pem`
3. 在 `.env.local` 中配置私钥文件路径：
   ```bash
   COZE_PRIVATE_KEY_FILE=keys/coze_private_key.pem
   ```

## 安全注意事项

⚠️ **重要提示**：
- 私钥文件包含敏感信息，请勿提交到代码仓库
- 确保私钥文件权限设置为仅所有者可读 (600)
- 生产环境建议使用安全的密钥管理服务

## 文件权限设置

Linux/macOS:
```bash
chmod 600 keys/coze_private_key.pem
```

Windows PowerShell:
```powershell
icacls keys\coze_private_key.pem /inheritance:r /grant:r "$($env:USERNAME):F"
``` 